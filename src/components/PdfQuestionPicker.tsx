import {useEffect,useRef,useState} from 'react';
import type {Attachment} from '../notebook';
import {splitPdfQuestions,type PdfQuestion} from '../pdf-questions';
import {combinePdfQuestions,reviewPdfQuestions,type ReviewedPdfQuestion} from '../pdf-selection';
import {hasEditorContent} from '../math-input';
import {lockBodyScroll} from '../scroll-lock';
import {MathInput,type MathInputHandle} from './MathInput';
import {MathKeyboard} from './MathKeyboard';
import {SelectMenu} from './SelectMenu';

interface Props {
  file:File; questions:PdfQuestion[]; pageCount:number; suspended:boolean;
  onClose:()=>void; onUse:(latex:string)=>Promise<void>;
  onImage:(image:Attachment)=>void;
  onReadPage:(image:string,page:number,hasEdits:boolean,signal:AbortSignal)=>Promise<string|null>;
}
function QuestionEditor({question,number,disabled,onChange,onRemove}:{question:ReviewedPdfQuestion;number:number;disabled:boolean;onChange:(latex:string)=>void;onRemove:()=>void}){
  const input=useRef<MathInputHandle>(null),[restored,setRestored]=useState(false);
  return <section className="pdf-review-question" aria-label={`Review question ${number}`}>
    <div className="row pdf-review-heading"><h4>Question {number} · Page {question.page}</h4><button type="button" disabled={disabled} onClick={onRemove} aria-label={`Deselect question ${number}`}>Deselect</button></div>
    <p className="pdf-extracted-label">Extracted question</p>
    <MathInput ref={input} label={`Extracted question ${number}`} value={question.latex} onChange={latex=>{setRestored(false);onChange(latex);}} disabled={disabled} initialMode="text" preserveLines/>
    <div className="row pdf-review-tools"><MathKeyboard showCommon={false} disabled={disabled} onActivate={()=>input.current?.focus()} onInsert={symbol=>input.current?.insert(symbol.latex)}/><button type="button" disabled={disabled} onClick={()=>{input.current?.replace(reviewPdfQuestions([question])[0].latex);setRestored(true);}}>Restore extracted text</button><small>{question.latex.length.toLocaleString()} characters</small></div>
    {restored&&<p className="subtle restore-status" role="status">Extracted text restored. Check recognition errors against the source.</p>}
  </section>;
}
export function PdfQuestionPicker({file,questions,pageCount,suspended,onClose,onUse,onImage,onReadPage}:Props){
  const [entries,setEntries]=useState(()=>reviewPdfQuestions(questions));
  const [page,setPage]=useState(questions[0]?.page??1),[filter,setFilter]=useState('');
  const [preview,setPreview]=useState<{page:number;image:string}|null>(null),[rendering,setRendering]=useState(false);
  const [error,setError]=useState(''),[reading,setReading]=useState(false),[using,setUsing]=useState(false);
  const operation=useRef<AbortController|null>(null),generation=useRef(0),alive=useRef(true);
  const dialog=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null);
  const state=useRef({suspended,using,onClose});state.current={suspended,using,onClose};
  const count=Math.max(1,pageCount,...questions.map(question=>question.page));
  const selected=entries.filter(question=>question.selected),statement=combinePdfQuestions(entries);
  const visible=entries.filter(question=>question.page===page&&question.text.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()));
  const waiting=reading||using;
  useEffect(()=>{
    alive.current=true;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const release=lockBodyScroll();close.current?.focus();
    const handle=(event:KeyboardEvent)=>{
      if(state.current.suspended||event.defaultPrevented)return;
      if(event.target instanceof Element&&event.target.closest('.symbol-browser,[role="listbox"]'))return;
      if(event.key==='Escape'&&!state.current.using){event.preventDefault();operation.current?.abort();state.current.onClose();return;}
      if(event.key!=='Tab')return;
      const nodes=[...dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')??[]];
      const first=nodes[0],last=nodes.at(-1);if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',handle);
    return()=>{alive.current=false;operation.current?.abort();operation.current=null;document.removeEventListener('keydown',handle);release();previous?.focus();};
  },[]);
  useEffect(()=>{
    let current=true;setPreview(null);setRendering(true);setError('');
    void import('../pdf').then(module=>module.renderPdfPagePreview(file,page)).then(image=>{if(current)setPreview({page,image});}).catch(reason=>{if(current)setError(reason instanceof Error?reason.message:'Could not render this page.');}).finally(()=>{if(current)setRendering(false);});
    return()=>{current=false;};
  },[file,page]);
  function update(id:string,changes:Partial<ReviewedPdfQuestion>){setEntries(current=>current.map(question=>question.id===id?{...question,...changes}:question));}
  function stop(){operation.current?.abort();operation.current=null;setReading(false);setError('');}
  async function read(){
    if(!preview||waiting)return;
    const controller=new AbortController();operation.current=controller;const activePage=page;
    setReading(true);setError('');
    try{
      const edited=entries.some(question=>question.page===activePage&&question.latex!==reviewPdfQuestions([question])[0].latex);
      const text=await onReadPage(preview.image,activePage,edited,controller.signal);
      if(!text||!alive.current||operation.current!==controller||controller.signal.aborted)return;
      controller.signal.throwIfAborted();
      const replacements=reviewPdfQuestions(splitPdfQuestions([{page:activePage,text}]),`cloud-${++generation.current}`).map(question=>({...question,selected:true}));
      if(!replacements.length)throw new Error('No questions were recognized. The previous extraction was kept.');
      if(!alive.current||operation.current!==controller)return;
      setEntries(current=>[...current.filter(question=>question.page!==activePage),...replacements].sort((a,b)=>a.page-b.page));
    }catch(reason){if(alive.current&&operation.current===controller&&!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Cloud reading failed.');}
    finally{if(alive.current&&operation.current===controller){operation.current=null;setReading(false);}}
  }
  async function use(){
    if(waiting||!selected.length||statement.length>6000||selected.some(question=>!hasEditorContent(question.latex)))return;
    setUsing(true);setError('');
    try{await onUse(statement);}catch(reason){if(alive.current)setError(reason instanceof Error?reason.message:'Could not use these questions.');}
    finally{if(alive.current)setUsing(false);}
  }
  return <div className="modal-backdrop pdf-backdrop" inert={suspended}>
    <section ref={dialog} className="paper pdf-dialog pdf-multi-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-title">
      <header className="pdf-dialog-header"><div><p className="eyebrow">PDF IMPORT · SELECT · REVIEW · USE</p><h2 id="pdf-title">Choose questions from your PDF</h2><p className="subtle">Select one or more questions across pages. Review each question before adding them together.</p></div><button ref={close} type="button" aria-label="Close PDF import" disabled={using} onClick={()=>{stop();onClose();}}>✕</button></header>
      <div className="pdf-picker" tabIndex={0} aria-label="PDF questions and review">
        {error&&<p className="notice error" role="alert">{error}</p>}
        <section className="pdf-question-browser" aria-label="Questions found in PDF">
          <div className="pdf-page-tools"><SelectMenu label="PDF page" value={String(page)} disabled={waiting} options={Array.from({length:count},(_,index)=>({value:String(index+1),label:`Page ${index+1}`}))} onChange={value=>{setPage(Number(value));setFilter('');}}/><button type="button" disabled={waiting||page<=1} onClick={()=>{setPage(value=>value-1);setFilter('');}}>Previous page</button><button type="button" disabled={waiting||page>=count} onClick={()=>{setPage(value=>value+1);setFilter('');}}>Next page</button><span className="subtle">{count} pages · {selected.length} selected</span></div>
          <div className="pdf-question-browser-heading"><div><h3>Questions found · Page {page}</h3><span>{visible.length} shown on this page</span></div><label>Find a question<input type="search" aria-label="Search PDF questions" disabled={waiting} value={filter} onChange={event=>setFilter(event.target.value)} placeholder="Search this page"/></label></div>
          <div className="row pdf-select-actions"><button type="button" disabled={waiting||!visible.length} onClick={()=>setEntries(current=>current.map(question=>visible.some(item=>item.id===question.id)?{...question,selected:true}:question))}>Select all shown</button><button type="button" disabled={waiting||!selected.length} onClick={()=>setEntries(current=>current.map(question=>({...question,selected:false})))}>Clear selection</button></div>
          <div className="pdf-question-list" role="list" aria-label="Extracted PDF questions">
            {!visible.length&&<p className="subtle">No questions found on this page. Try another page, clear the search, or read this page with Cloud AI.</p>}
            {visible.map(question=>{const number=entries.indexOf(question)+1;return <label className="pdf-question-choice" role="listitem" data-selected={question.selected} key={question.id}><input type="checkbox" aria-label={`Select question ${number}`} disabled={waiting} checked={question.selected} onChange={event=>update(question.id,{selected:event.target.checked})}/><span><strong>Question {number} <small>Page {question.page}</small></strong><span>{question.text.slice(0,180)}{question.text.length>180?'…':''}</span></span></label>;})}
          </div>
        </section>
        <div className="import-review-columns">
          <aside className="import-source pdf-source-column"><h3>Source page · {page}</h3><p className="subtle">Click the page to zoom. Cloud reading asks before sending this page.</p>{rendering&&<p className="subtle" role="status">Rendering source page…</p>}{preview&&<><button className="pdf-source-image" type="button" aria-label={`Enlarge PDF page ${page}`} disabled={using} onClick={()=>onImage({id:`pdf-page-${page}`,name:`${file.name} · Page ${page}`,data:preview.image,kind:'problem'})}><img src={preview.image} alt={`PDF page ${page}`}/><span>⤢ View larger</span></button><button type="button" className="primary cloud-page-read" disabled={waiting} onClick={()=>void read()}>{reading?'Reading page with Cloud AI…':'Read this page with Cloud AI'}</button></>}{reading&&<button type="button" className="stop-ai" onClick={stop}>Stop page reading</button>}</aside>
          <section className="import-edit"><h3>Review and edit selected questions · {selected.length}</h3><p className="subtle">Recognized formulas are formatted here. Check unclear or missing symbols against the source.</p>{!selected.length&&<p className="subtle">Select questions above to review them here.</p>}{selected.map(question=>{const number=entries.indexOf(question)+1;return <QuestionEditor key={question.id} question={question} number={number} disabled={waiting} onChange={latex=>update(question.id,{latex})} onRemove={()=>update(question.id,{selected:false})}/>;})}</section>
        </div>
      </div>
      <p className="subtle pdf-privacy-note">Only the current page is sent after consent. Selected questions are added together as one problem; notes and attachments are kept.</p>
      <footer className="row pdf-dialog-actions"><span className="pdf-selection-count" role="status">{selected.length} selected · {statement.length.toLocaleString()} / 6,000 characters{statement.length>6000&&<strong className="error"> Shorten the questions or select fewer.</strong>}</span><button type="button" disabled={using} onClick={()=>{stop();onClose();}}>Cancel</button><button type="button" className="primary" disabled={waiting||!selected.length||statement.length>6000||selected.some(question=>!hasEditorContent(question.latex))} onClick={()=>void use()}>{selected.length===1?'Use this question':`Use ${selected.length} questions`}</button></footer>
    </section>
  </div>;
}
