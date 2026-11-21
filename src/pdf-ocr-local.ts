export async function recognizeMathFormula(image: Blob, signal?:AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  if (!image.size || image.size > 3 * 1024 * 1024) throw new Error('Select one formula area smaller than 3 MB.');
  let response: Response;
  try {
    response = await fetch('http://127.0.0.1:5188/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Mathfolio-Local-OCR': '1' },
      body: image,
      signal: signal ? AbortSignal.any([signal,AbortSignal.timeout(300000)]) : AbortSignal.timeout(300000)
    });
  } catch(error) {
    if(signal?.aborted)throw error;
    throw new Error('Local formula OCR is not running. In VS Code, run npm run setup:math-ocr, then restart npm run dev.');
  }
  const result = await response.json() as { latex?: unknown; error?: unknown };
  signal?.throwIfAborted();
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Local formula recognition failed.');
  if (typeof result.latex !== 'string' || !result.latex.trim() || result.latex.length > 3000) {
    throw new Error('The formula model returned no usable LaTeX. Select a clearer crop or edit the formula manually.');
  }
  return result.latex.trim();
}
