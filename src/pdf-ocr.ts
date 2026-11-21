import { createWorker, OEM } from 'tesseract.js';
import type { PDFPageProxy } from 'pdfjs-dist';
import { abortable } from './abortable';

export async function recognizeImageText(image:string, signal?:AbortSignal):Promise<string> {
  signal?.throwIfAborted();
  const assetBase=new URL(import.meta.env.BASE_URL,window.location.href);const base=new URL('ocr/',assetBase);
  const pending=createWorker('vie+eng',OEM.LSTM_ONLY,{workerPath:new URL('worker.min.js',base).href,corePath:new URL('tesseract-core-simd-lstm.wasm.js',base).href,langPath:new URL('lang-data/',base).href,gzip:true});
  void pending.then(worker=>{if(signal?.aborted)void worker.terminate().catch(()=>{});}).catch(()=>{});
  const worker=await abortable(pending,signal);let ended=false;
  const terminate=()=>{if(!ended){ended=true;void worker.terminate().catch(()=>{});}};
  signal?.addEventListener('abort',terminate,{once:true});
  try { signal?.throwIfAborted();const {data}=await abortable(worker.recognize(image),signal);signal?.throwIfAborted();return data.text.trim(); }
  finally {signal?.removeEventListener('abort',terminate);terminate();}
}

async function createEnglishWorker() {
  const assetBase = new URL(import.meta.env.BASE_URL, window.location.href);
  const ocrBase = new URL('ocr/', assetBase);
  return createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: new URL('worker.min.js', ocrBase).href,
    corePath: new URL('tesseract-core-simd-lstm.wasm.js', ocrBase).href,
    langPath: new URL('lang-data/', ocrBase).href,
    gzip: true
  });
}

export async function recognizeImageLocally(image: Blob): Promise<string> {
  const worker = await createEnglishWorker();
  try {
    const { data } = await worker.recognize(image);
    const text = data.text.trim();
    if (!text) throw new Error('No readable English text was found in the image. Try a clearer crop or use Cloud AI after consent.');
    return text;
  } finally {
    await worker.terminate();
  }
}

export async function recognizePdfPages(
  pages: { page: number; source: PDFPageProxy }[],
  onProgress?: (page: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ page: number; text: string }[]> {
  signal?.throwIfAborted();
  const pending = createEnglishWorker();
  void pending.then(worker=>{if(signal?.aborted)void worker.terminate().catch(()=>{});}).catch(()=>{});
  const worker=await abortable(pending,signal);let ended=false;
  const terminate=()=>{if(!ended){ended=true;void worker.terminate().catch(()=>{});}};
  signal?.addEventListener('abort',terminate,{once:true});
  try {
    const results: { page: number; text: string }[] = [];
    for (const [index, item] of pages.entries()) {
      signal?.throwIfAborted();
      onProgress?.(index + 1, pages.length);
      const viewport = item.source.getViewport({ scale: 2 });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare this PDF page for local OCR.');
      try {
        await item.source.render({ canvas, canvasContext: context, viewport }).promise;
        const { data } = await abortable(worker.recognize(canvas),signal);
        signal?.throwIfAborted();
        results.push({ page: item.page, text: data.text.trim() });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    return results;
  } finally {
    signal?.removeEventListener('abort',terminate);terminate();
  }
}
