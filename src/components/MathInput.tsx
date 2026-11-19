import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import { clipboardMathText } from '../clipboard-math';
import { useMathKeyboard,editableMathTarget, type MathTarget } from './MathKeyboardContext';
import { editorPaste } from '../math-paste';
import { insertPower,insertSubscript } from '../math-editor-actions';
import {editorPlaceholder} from '../math-input';
import { altToggle } from '../editor-mode';
import 'mathlive/fonts.css';
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;
MathfieldElement.locale = 'en';
export interface MathInputHandle { focus: () => void; insert: (latex: string) => void; replace: (latex: string) => void }
interface Props { value:string; onChange?:(value:string)=>void; readOnly?:boolean; disabled?:boolean; label?:string; compact?:boolean; maxLength?:number; initialMode?:'math'|'text'; preserveLines?:boolean; placeholder?:string }
export const MathInput = forwardRef<MathInputHandle,Props>(function MathInput({value,onChange,readOnly,disabled,label='Problem statement',compact,maxLength=6000,initialMode='math',preserveLines=false,placeholder='Type your problem here'}, ref) {
  const keyboard=useMathKeyboard(),keyboardRef=useRef(keyboard);keyboardRef.current=keyboard;const editorId=useId();
  const host=useRef<HTMLDivElement>(null);const element=useRef<MathfieldElement|null>(null);
  const change=useRef(onChange);change.current=onChange;
  const options=useRef({maxLength,preserveLines});options.current={maxLength,preserveLines};
  const [inputError,setInputError]=useState('');const validValue=useRef(value);
  const [mode,setMode]=useState<'math'|'text'>(initialMode);
  const notify=useRef<()=>void>(()=>{});const toggleMode=useRef<()=>void>(()=>{});
  useEffect(()=>{
    const field=new MathfieldElement();
    field.defaultMode=initialMode;field.smartMode=false;field.smartFence=true;
    field.mathModeSpace='\\ ';
    field.smartSuperscript=false;field.mathVirtualKeyboardPolicy='manual';field.value=validValue.current;
    const flowStyle=document.createElement('style');
    // Remove the anonymous inline wrapper's baseline gap, not internal fraction/root struts.
    flowStyle.textContent=`
      :host > span:first-of-type { display:block!important; line-height:normal; }
      .ML__container { display:block!important; min-width:0!important; width:100%!important; padding:0!important; align-items:flex-start!important; }
      .ML__content { display:block!important; overflow:visible!important; width:auto!important; min-width:0!important; padding:0!important; align-self:flex-start!important; }
      .ML__content > .ML__latex { display:block!important; width:100%!important; min-width:0!important; box-sizing:border-box; white-space:normal!important; max-width:100%; }
      .ML__content > .ML__latex > .ML__strut, .ML__content > .ML__latex > .ML__strut--bottom { display:none!important; }
      .ML__content > .ML__latex > .ML__base { display:block!important; width:auto!important; white-space:normal!important; overflow-wrap:anywhere; line-height:1.45; }
      .ML__content > .ML__latex > .ML__base .ML__text { white-space:pre-wrap!important; overflow-wrap:break-word; }
      .ML__content > .ML__latex > .ML__base .mathfolio-line { display:block!important; width:auto!important; white-space:normal!important; min-height:1.45em; margin:0 0 .2em; }
      .ML__content-placeholder { position:absolute; top:0; left:0; color:var(--editor-placeholder,#788c7d); }
    `;
    const installStyle=()=>{if(!flowStyle.isConnected)field.shadowRoot?.appendChild(flowStyle);};
    field.addEventListener('mount',installStyle);
    field.setAttribute('tabindex','0');field.setAttribute('aria-label',label);field.setAttribute('role','textbox');field.setAttribute('placeholder',editorPlaceholder(placeholder));field.setAttribute('aria-placeholder',placeholder);
    const syncMode=()=>setMode(field.mode==='text'?'text':'math');
    const handleInput=()=>{
      if(field.value.length>options.current.maxLength){field.value=validValue.current;setInputError(`Keep this entry within ${options.current.maxLength.toLocaleString('en-US')} characters.`);return;}
      validValue.current=field.value;setInputError('');change.current?.(field.value);syncMode();
    };
    notify.current=handleInput;
    toggleMode.current=()=>{
      if(field.readOnly)return;
      const before=field.value;field.focus();field.smartMode=false;
      field.mode=field.mode==='text'?'math':'text';syncMode();
      // A mode change may convert selected content; a caret-only change is not an edit.
      if(field.value!==before)handleInput();
    };
    const target:MathTarget={id:editorId,label,element:field,available:()=>!field.readOnly&&editableMathTarget(field),focus:()=>field.focus(),insert:latex=>{field.focus();const power=/^\^\{(.*)\}$/.exec(latex);if(power)insertPower(field,power[1]==='#?'?undefined:power[1]);else if(latex==='_{#?}')insertSubscript(field);else field.insert(latex,{format:'latex',mode:'math',selectionMode:'placeholder'});handleInput();}};
    const activate=()=>{if(!field.readOnly)keyboardRef.current?.activate(target);};
    field.addEventListener('focusin',activate);field.addEventListener('focus',activate,true);field.addEventListener('pointerdown',activate,true);
    const taps=altToggle(()=>toggleMode.current());
    const handlePaste=(event:ClipboardEvent)=>{
      if(field.readOnly||!event.clipboardData)return;
      if(event.clipboardData.getData('application/json+mathlive'))return;
      const latex=event.clipboardData.getData('application/x-latex'),text=event.clipboardData.getData('text/plain');
      const html=event.clipboardData.getData('text/html');
      const content=latex?'':clipboardMathText(html,text);
      if(!latex&&!content)return;
      event.preventDefault();event.stopImmediatePropagation();
      const requestedMode=field.mode==='text'?'text':'math';
      const insertion=latex||editorPaste(content,requestedMode,options.current.preserveLines);
      const selection=field.selectionIsCollapsed?'':field.getValue(field.selection,'latex');
      if(field.value.length-selection.length+insertion.length>options.current.maxLength){setInputError(`Keep this entry within ${options.current.maxLength.toLocaleString('en-US')} characters.`);return;}
      field.insert(insertion,{format:'latex',mode:'math',selectionMode:'after'});
      field.mode=requestedMode;
      handleInput();
    };
    const handleKey=(event:KeyboardEvent)=>{
      if(field.readOnly){taps.reset();return;}
      taps.keydown(event);
      if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.key==='Enter'&&options.current.preserveLines&&!event.shiftKey){
        event.preventDefault();event.stopImmediatePropagation();
        const previous=field.mode;field.insert('\\class{mathfolio-line}{#?}',{format:'latex',mode:'math',selectionMode:'placeholder'});field.mode=previous;handleInput();return;
      }
      if(event.key!=='^'||field.mode==='text')return;
      event.preventDefault();event.stopImmediatePropagation();insertPower(field);handleInput();
    };
    const handleUp=(event:KeyboardEvent)=>{if(!field.readOnly)taps.keyup(event);};
    const resetTaps=()=>taps.reset();
    field.addEventListener('input',handleInput);field.addEventListener('mode-change',syncMode);field.addEventListener('selection-change',syncMode);
    field.addEventListener('paste',handlePaste,true);field.addEventListener('keydown',handleKey,true);field.addEventListener('keyup',handleUp,true);field.addEventListener('blur',resetTaps);field.addEventListener('pointerdown',resetTaps,true);window.addEventListener('blur',resetTaps);
    host.current?.appendChild(field);element.current=field;installStyle();if(initialMode==='text')field.mode='text';syncMode();
    return()=>{keyboardRef.current?.release(editorId);field.removeEventListener('focusin',activate);field.removeEventListener('focus',activate,true);field.removeEventListener('pointerdown',activate,true);field.removeEventListener('mount',installStyle);field.removeEventListener('input',handleInput);field.removeEventListener('mode-change',syncMode);field.removeEventListener('selection-change',syncMode);field.removeEventListener('paste',handlePaste,true);field.removeEventListener('keydown',handleKey,true);field.removeEventListener('keyup',handleUp,true);field.removeEventListener('blur',resetTaps);field.removeEventListener('pointerdown',resetTaps,true);window.removeEventListener('blur',resetTaps);field.remove();element.current=null;notify.current=()=>{};toggleMode.current=()=>{};};
  },[label,initialMode,placeholder,editorId]);
  useEffect(()=>{const field=element.current;validValue.current=value;setInputError('');if(field&&field.value!==value){const previous=field.mode;field.value=value;field.mode=previous;}},[value]);
  useEffect(()=>{if(element.current){element.current.readOnly=!!readOnly||!!disabled;element.current.setAttribute('aria-disabled',String(!!disabled));keyboardRef.current?.refresh();}},[readOnly,disabled]);
  useImperativeHandle(ref,()=>({
    focus(){element.current?.focus();},
    replace(latex){
      const field=element.current;if(!field||field.readOnly)return;
      if(latex.length>options.current.maxLength){setInputError(`Keep this entry within ${options.current.maxLength.toLocaleString('en-US')} characters.`);return;}
      // An explicit reset must reach MathLive even if the controlled value is unchanged.
      const previous=field.mode;field.value=latex;field.mode=previous;notify.current();
    },
    insert(latex){const field=element.current;if(!field||field.readOnly)return;field.focus();const power=/^\^\{(.*)\}$/.exec(latex);
      if(power)insertPower(field,power[1]==='#?'?undefined:power[1]);else if(latex==='_{#?}')insertSubscript(field);else field.insert(latex,{format:'latex',mode:'math',selectionMode:'placeholder'});notify.current();}
  }),[]);
  return <div className={`math-editor${compact?' compact-editor':''}`}>
    {!readOnly&&<div className="editor-mode-bar"><button type="button" className="editor-mode-toggle" disabled={disabled} aria-label={`Input mode for ${label}`} aria-description={`Current mode: ${mode}. Press Alt once (Option on Mac) to switch.`} title="Switch Math / Text · Alt (Option ⌥ on Mac)" onMouseDown={event=>event.preventDefault()} onClick={()=>toggleMode.current()}><span aria-hidden="true">{mode==='math'?'𝑥':'Aa'}</span> {mode==='math'?'Math':'Text'} ↔</button><small>Alt / ⌥ to switch</small></div>}
    <div ref={host} className={`math-input${compact?' compact':''}`}/>{inputError&&<small className="error" role="alert">{inputError}</small>}
  </div>;
});
