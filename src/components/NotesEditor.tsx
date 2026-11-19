import { useId, useMemo, useRef, useState } from 'react';
import { MathKeyboard } from './MathKeyboard';
import { MathInput, type MathInputHandle } from './MathInput';
import { notesLatex } from '../note-format';
export function NotesEditor({value,format,onChange,disabled,label}:{value:string;format?:'latex';onChange:(value:string)=>void;disabled?:boolean;label:string}) {
  const input=useRef<MathInputHandle>(null);const [open,setOpen]=useState(false);const keyboardId=useId();
  const latex=useMemo(()=>notesLatex(value,format),[value,format]);
  return <div className="notes-editor">
    <MathInput ref={input} value={latex} onChange={onChange} disabled={disabled} label={label} maxLength={30000} initialMode="text" preserveLines placeholder="Write your approach, questions, or what you just learned…"/>
    <button type="button" className="notes-keyboard-toggle" disabled={disabled} aria-expanded={open} aria-controls={keyboardId} onClick={()=>setOpen(current=>!current)}>{open?'Hide math keyboard':'Show math keyboard'}</button>
    <div id={keyboardId} className="notes-math-keys" hidden={!open} role="group" aria-label={`${label} math keyboard`}><MathKeyboard notes onActivate={()=>input.current?.focus()} disabled={disabled} onInsert={symbol=>input.current?.insert(symbol.latex)}/></div>
  </div>;
}
