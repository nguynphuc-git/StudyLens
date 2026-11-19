import type {InlineDataPart} from 'firebase/ai';
import {abortable} from './abortable';
import type {Attachment} from './notebook';
export interface ProblemIllustration {data:string;name:string}
export function selectedIllustrations(images:Attachment[]):ProblemIllustration[]{return images.filter(image=>image.kind==='problem'&&image.useForAI!==false).map(({data,name})=>({data,name}));}
export function sameIllustrations(a:Attachment[],b:Attachment[]):boolean {const left=selectedIllustrations(a),right=selectedIllustrations(b);return left.length===right.length&&left.every((image,index)=>image.data===right[index].data&&image.name===right[index].name);}
export function validateIllustrations(images:ProblemIllustration[]):InlineDataPart[]{
  if(images.length>4)throw new Error('Use up to 4 problem illustrations.');
  return images.map(image=>{const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image.data);
    if(!match||match[2].length>4*1024*1024)throw new Error('Each AI illustration must be a PNG, JPG or WebP smaller than 3 MB.');
    return {type:'inlineData',inlineData:{mimeType:match[1],data:match[2]}};
  });
}
/** Native Firebase vision currently supports PNG/JPEG; only its WebP inference copy is converted. */
export async function localVisionParts(parts:InlineDataPart[],signal?:AbortSignal):Promise<InlineDataPart[]> {
  const result:InlineDataPart[]=[];
  for(const part of parts){signal?.throwIfAborted();if(part.inlineData.mimeType!=='image/webp'){result.push(part);continue;}
    const bytes=Uint8Array.from(atob(part.inlineData.data),char=>char.charCodeAt(0));
    const pending=createImageBitmap(new Blob([bytes],{type:'image/webp'})).then(bitmap=>{if(signal?.aborted){bitmap.close();signal.throwIfAborted();}return bitmap;});
    const bitmap=await abortable(pending,signal),canvas=document.createElement('canvas');
    try{const ratio=Math.min(1,2048/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const context=canvas.getContext('2d');if(!context)throw new Error('Could not prepare this illustration.');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/jpeg',.94).split(',')[1];if(data.length>4*1024*1024)throw new Error('Crop a smaller illustration for local AI.');signal?.throwIfAborted();result.push({type:'inlineData',inlineData:{mimeType:'image/jpeg',data}});
    }finally{bitmap.close();canvas.width=0;canvas.height=0;}
  }
  return result;
}
