import { abortable } from './abortable';
import { transcribeProblemImage } from './ai';
export interface ProblemImage { data:string; name:string }
export async function prepareProblemImage(file:File, signal?:AbortSignal):Promise<ProblemImage> {
  signal?.throwIfAborted();
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>10*1024*1024)throw new Error('Choose a PNG, JPG or WebP image up to 10 MB.');
  const decoding=createImageBitmap(file).then(bitmap=>{if(signal?.aborted){bitmap.close();signal.throwIfAborted();}return bitmap;});
  const bitmap=await abortable(decoding,signal);
  const canvas=window.document.createElement('canvas');
  try {
    const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    const context=canvas.getContext('2d');if(!context)throw new Error('Could not prepare this image.');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/jpeg',.92);
    if(data.length>4*1024*1024)throw new Error('Crop one problem from this image and try again.');
    signal?.throwIfAborted();return {data,name:file.name};
  } finally {bitmap.close();canvas.width=0;canvas.height=0;}
}

export async function readProblemImage(image:ProblemImage, stage:(label:string)=>void, signal?:AbortSignal, textOnly=false):Promise<{text:string;source:'on_device'|'local_ocr'}> {
  signal?.throwIfAborted();
  if(!textOnly){
    stage('Reading with local AI…');
    try {
      return {text:await transcribeProblemImage(image.data,signal),source:'on_device'};
    } catch(error){if(signal?.aborted || (error instanceof Error&&error.name==='AbortError'))throw error;}
  }
  stage('Reading printed text on this device…');
  const {recognizeImageText}=await import('./pdf-ocr');
  const text=await recognizeImageText(image.data,signal);signal?.throwIfAborted();
  if(!text.trim())throw new Error('No readable text found. Try a sharper image or type the problem.');
  if(text.length>6000)throw new Error('Crop one shorter problem or shorten the recognized text.');
  return {text,source:'local_ocr'};
}
