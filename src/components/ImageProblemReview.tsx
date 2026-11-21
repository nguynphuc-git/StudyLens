import {lockBodyScroll} from '../scroll-lock';
import {useEffect,useRef,useState} from 'react';
import {readProblemImage,type ProblemImage} from '../image-import';
import {mixedTextToLatex} from '../math-paste';
import {hasEditorContent} from '../math-input';
import {normalizeProblemText} from '../problem-text';
import {MathInput,type MathInputHandle} from './MathInput';
import {MathKeyboard} from './MathKeyboard';
import {SelectMenu} from './SelectMenu';
import {PdfFormulaCropper} from './PdfFormulaCropper';
interface Props {
  image:ProblemImage;onClose:()=>void;onApply:(latex:string,keep:boolean)=>Promise<void>;
  suspended:boolean;error:string;canKeepImage:boolean;onImage:()=>void;
  onCloudRead:(image:string,signal:AbortSignal)=>Promise<string|null>;
}
export function ImageProblemReview({image,onClose,onApply,suspended,error,canKeepImage,onImage,onCloudRead}:Props){
  const [formulaBusy,setFormulaBusy]=useState(false),[latex,setLatex]=useState(''),[extracted,setExtracted]=useState('');
  const [route,setRoute]=useState<'local'|'cloud'>('local'),[busy,setBusy]=useState(false),[applying,setApplying]=useState(false);
  const [stage,setStage]=useState(''),[failure,setFailure]=useState(''),[keep,setKeep]=useState(canKeepImage);
  const active=useRef<AbortController|null>(null),alive=useRef(true),input=useRef<MathInputHandle>(null);
  const dialog=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null);
  const callbacks=useRef({onClose,suspended,applying});callbacks.current={onClose,suspended,applying};
  const waiting=busy||formulaBusy||applying;
  useEffect(()=>{
    alive.current=true;const previous=document.activeElement as HTMLElement|null;const release=lockBodyScroll();close.current?.focus();
    const key=(event:KeyboardEvent)=>{
      if(callbacks.current.suspended||event.defaultPrevented)return;
      if(event.target instanceof Element&&event.target.closest('.symbol-browser,[role="listbox"]'))return;
      if(event.key==='Escape'&&!callbacks.current.applying){event.preventDefault();callbacks.current.onClose();return;}
      if(event.key!=='Tab')return;
      const nodes=[...dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),summary,math-field')??[]].filter(node=>!node.closest('[hidden]'));
      const first=nodes[0],last=nodes.at(-1);if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',key);
    return()=>{alive.current=false;active.current?.abort();active.current=null;release();document.removeEventListener('keydown',key);previous?.focus();};
  },[]);
  function stop(){const job=active.current;active.current=null;job?.abort();setBusy(false);setStage('');setFailure('');}
  async function read(kind:'printed'|'ai'){
    if(waiting||active.current)return;
    const job=new AbortController();active.current=job;setBusy(true);setFailure('');
    const current=()=>alive.current&&active.current===job&&!job.signal.aborted;
    try{
      let text:string,source:string;
      if(kind==='ai'&&route==='cloud'){
        setStage('Preparing image reading with Cloud AI…');
        const result=await onCloudRead(image.data,job.signal);
        if(!current())return;
        if(result===null){setStage('Cloud reading cancelled. Your review was kept.');return;}
        text=result;source='cloud';
      }else{
        const result=await readProblemImage(image,value=>{if(current())setStage(value);},job.signal,kind==='printed');
        text=result.text;source=result.source;
      }
      if(!current())return;
      const recognized=mixedTextToLatex(normalizeProblemText(text),true);
      if(!hasEditorContent(recognized))throw new Error('No text was recognized. Try another reading method or enter the problem below.');
      if(recognized.length>6000)throw new Error('The recognized problem exceeds 6,000 characters. Use a smaller image. Your review was kept.');
      setLatex(recognized);setExtracted(recognized);
      setStage(source==='cloud'?'Read with Cloud AI. Check the transcription.':source==='on_device'?'Read with local AI. Check the transcription.':'Read with browser OCR. Check every formula.');
    }catch(reason){if(current()){setStage('');setFailure(reason instanceof Error?reason.message:'Could not read this image.');}}
    finally{if(alive.current&&active.current===job){active.current=null;setBusy(false);}}
  }
  async function apply(){
    if(waiting||!hasEditorContent(latex))return;
    setApplying(true);setFailure('');
    try{await onApply(latex,keep);}catch(reason){if(alive.current)setFailure(reason instanceof Error?reason.message:'Could not use this problem.');}
    finally{if(alive.current)setApplying(false);}
  }
  return <div className="modal-backdrop image-backdrop" inert={suspended}><section ref={dialog} className="paper import-review-dialog image-import-review" role="dialog" aria-modal="true" aria-labelledby="image-review-title">
    <header className="import-review-header"><div><p className="eyebrow">1 · SOURCE　2 · REVIEW　3 · USE</p><h2 id="image-review-title">Read a problem from an image</h2><p className="subtle">Start with printed text on this device, or choose Local AI or Cloud AI for text and formulas.</p></div><button ref={close} aria-label="Close image import" disabled={applying} onClick={onClose}>✕</button></header>
    <div className="import-review-columns"><div className="import-source">
      <button className="image-source-zoom" type="button" aria-label={`Enlarge source image: ${image.name}`} onClick={onImage} disabled={applying}><img className="source-image" src={image.data} alt={image.name}/><span>⤢ View larger</span></button>
      <details><summary>Correct a formula from the image</summary><PdfFormulaCropper image={image.data} imageLabel="Problem image for formula selection" disabled={waiting} onBusyChange={setFormulaBusy} onInsert={formula=>setLatex(value=>`${value}\\class{mathfolio-line}{${formula}}`)}/></details>
    </div><div className="import-edit">
      <div className="image-read-actions"><button className="primary printed-text-read" type="button" disabled={waiting} onClick={()=>void read('printed')}>Read printed text</button><div className="image-ai-read"><SelectMenu label="Image reading AI" value={route} options={[{value:'local',label:'Local AI'},{value:'cloud',label:'Cloud AI'}]} disabled={waiting} onChange={value=>setRoute(value as 'local'|'cloud')}/><button type="button" disabled={waiting} onClick={()=>void read('ai')}>Read with AI</button></div></div>
      {busy&&<button type="button" className="stop-ai" onClick={stop}>Stop reading</button>}
      {stage&&<p className="subtle" role="status">{stage}</p>}{busy&&<div className="recognition-skeleton" aria-label="Recognizing image"/>}
      <h3>Review your problem</h3><p className="subtle image-review-help">Edit text and formulas directly. Nothing is added until you choose Use this problem.</p>
      <MathInput ref={input} label="Recognized image problem" value={latex} onChange={setLatex} disabled={waiting} initialMode="text" preserveLines placeholder="Read the image or type your problem here"/>
      <div className="row image-review-tools"><MathKeyboard showCommon={false} disabled={waiting} onActivate={()=>input.current?.focus()} onInsert={symbol=>input.current?.insert(symbol.latex)}/><button type="button" disabled={waiting||!extracted} onClick={()=>{input.current?.replace(extracted);setStage('Extracted text restored. Check recognition errors against the source.');}}>Restore extracted text</button><small>{latex.length.toLocaleString()} / 6,000 characters</small></div>
      <label className="check"><input type="checkbox" checked={keep} disabled={!canKeepImage||waiting} onChange={event=>setKeep(event.target.checked)}/>Keep the image with this exercise</label><p className="subtle">Kept images appear in Illustrations, where you can choose whether AI uses them.</p>{!canKeepImage&&<p className="subtle">This exercise already has 4 images. You can still use the recognized text.</p>}
      {(failure||error)&&<p className="notice error" role="alert">{failure||error}</p>}
    </div></div>
    <footer className="import-review-footer"><span className="subtle">Compare with the source. Correct unreadable symbols before continuing.</span><div className="row"><button disabled={applying} onClick={onClose}>Cancel</button><button className="primary" disabled={waiting||!hasEditorContent(latex)} onClick={()=>void apply()}>Use this problem</button></div></footer>
  </section></div>;
}
