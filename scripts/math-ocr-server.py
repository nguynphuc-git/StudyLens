from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import logging
import threading

from PIL import Image, UnidentifiedImageError

HOST = "127.0.0.1"
PORT = 5188
MAX_IMAGE_BYTES = 3 * 1024 * 1024
model = None
model_lock = threading.Lock()


def allowed_origin(value):
    if not value:
        return False
    from urllib.parse import urlparse

    origin = urlparse(value)
    return origin.scheme == "http" and origin.hostname in ("localhost", "127.0.0.1")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value, origin=None):
        body = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Mathfolio-Local-OCR")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        if self.path != "/recognize" or not allowed_origin(origin):
            self.send_json(403, {"error": "This local OCR request is not allowed."})
            return
        self.send_json(200, {}, origin)

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"ready": True})
            return
        self.send_json(404, {"error": "Not found."})

    def do_POST(self):
        origin = self.headers.get("Origin", "")
        if self.path != "/recognize" or not allowed_origin(origin):
            self.send_json(403, {"error": "This local OCR request is not allowed."})
            return
        if self.headers.get("X-Mathfolio-Local-OCR") != "1" or self.headers.get("Content-Type") != "application/octet-stream":
            self.send_json(415, {"error": "Send a cropped formula image from the Mathfolio page."}, origin)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "Invalid image size."}, origin)
            return
        if length <= 0 or length > MAX_IMAGE_BYTES:
            self.send_json(413, {"error": "Select one formula area smaller than 3 MB."}, origin)
            return
        try:
            image_bytes = self.rfile.read(length)
            if len(image_bytes) != length:
                self.send_json(400, {"error": "The cropped formula image was incomplete."}, origin)
                return
            with Image.open(BytesIO(image_bytes)) as image:
                if image.width > 5000 or image.height > 3000 or image.width * image.height > 12_000_000:
                    self.send_json(413, {"error": "Select a smaller formula area."}, origin)
                    return
                image.verify()
            global model
            with model_lock:
                if model is None:
                    from rapid_latex_ocr import LaTeXOCR

                    model = LaTeXOCR()
                latex, _elapsed = model(image_bytes)
            latex = latex.strip()
            if not latex or len(latex) > 3000:
                self.send_json(422, {"error": "The model could not recognize this formula. Select a clearer crop."}, origin)
                return
            self.send_json(200, {"latex": latex}, origin)
        except (UnidentifiedImageError, OSError):
            self.send_json(400, {"error": "Could not read the selected formula image."}, origin)
        except Exception as error:
            logging.exception("Local formula OCR failed")
            self.send_json(500, {"error": "Local formula OCR failed. Check the VS Code terminal for details."}, origin)

    def log_message(self, format_string, *args):
        logging.info(format_string, *args)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    logging.info("Local formula OCR is listening on http://%s:%s", HOST, PORT)
    server.serve_forever()
