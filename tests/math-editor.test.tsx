// @vitest-environment happy-dom
import { act, createRef, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('mathlive', async original => {
  const converters = await original<typeof import('mathlive')>();
  class Field extends HTMLElement {
    value=''; mode='math'; _defaultMode='math'; get defaultMode(){return this._defaultMode;} set defaultMode(value:string){this._defaultMode=value;this.mode=value;} readOnly=false; selectionIsCollapsed=true; selected=''; selection={ranges:[[0,0]]};
    insert=vi.fn((latex:string)=>{this.value+=latex;return true;});
    executeCommand=vi.fn(()=>true);
    getValue(){return this.selected;}
    constructor(){ super(); this.attachShadow({mode:'open'}); }
  }
  customElements.define('test-math-editor',Field);
  return {...converters,MathfieldElement:Field};
});
import {MathKeyboardProvider} from '../src/components/MathKeyboardContext';
import {MathKeyboard} from '../src/components/MathKeyboard';
import {NotesEditor} from '../src/components/NotesEditor';
import { MathInput, type MathInputHandle } from '../src/components/MathInput';

interface StubField extends HTMLElement {
  value:string; mode:string; readOnly:boolean; selectionIsCollapsed:boolean; smartMode:boolean; smartFence:boolean; smartSuperscript:boolean;
  insert:ReturnType<typeof vi.fn>; executeCommand:ReturnType<typeof vi.fn>;
}
let root:Root,host:HTMLDivElement; const change=vi.fn(); const handle=createRef<MathInputHandle>();
function field(){return host.querySelector<StubField>('test-math-editor')!;}
async function paste(mime:string|Record<string,string>,value=''){
  const data=new DataTransfer();
  for(const [type,content] of Object.entries(typeof mime==='string'?{[mime]:value}:mime))data.setData(type,content);
  const event=new ClipboardEvent('paste',{clipboardData:data,cancelable:true});
  await act(async()=>field().dispatchEvent(event));return event;
}
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});change.mockReset();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<MathInput ref={handle} value="" onChange={change}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('math editor event integration',()=>{
  it('explicitly restores unsynchronized native content even when the controlled value has not changed',async()=>{
    const original=String.raw`\frac{x}{2}`;
    await act(async()=>root.render(<MathInput ref={handle} value={original} onChange={change}/>));
    field().value='UNSYNCHRONIZED EDIT';field().mode='text';
    await act(async()=>handle.current!.replace(original));
    expect(field().value).toBe(original);expect(field().mode).toBe('text');expect(change).toHaveBeenLastCalledWith(original);
    await act(async()=>root.render(<MathInput ref={handle} value={original} onChange={change} disabled/>));
    await act(async()=>handle.current!.replace('should not replace'));
    expect(field().value).toBe(original);
  });
  it('keeps plain-text paste in the mode chosen by the user',async()=>{
    await act(async()=>host.querySelector<HTMLButtonElement>('.editor-mode-toggle')!.click());
    const event=await paste('text/plain','Find x^2 = 4 now');
    expect(event.defaultPrevented).toBe(true);
    expect(field().insert).toHaveBeenCalledWith(String.raw`\text{Find x\^2 = 4 now}`,expect.objectContaining({format:'latex',mode:'math'}));
    expect(change).toHaveBeenCalledWith(field().value);
  });
  it('preserves explicit LaTeX and structured MathLive clipboard data',async()=>{
    await paste('application/x-latex',String.raw`\frac{a+b}{c}`);
    expect(field().insert.mock.calls[0][0]).toBe(String.raw`\frac{a+b}{c}`);
    field().insert.mockClear();
    const event=await paste('application/json+mathlive','[{"type":"genfrac"}]');
    expect(event.defaultPrevented).toBe(false);expect(field().insert).not.toHaveBeenCalled();
  });
  it.each(['math','text'] as const)('recovers external rendered fractions and surrounding prose while in %s',async mode=>{
    field().mode=mode;
    // Model MathLive moving into a trailing text atom during insertion.
    field().insert.mockImplementationOnce((latex:string)=>{field().value+=latex;field().mode='text';return true;});
    const html=String.raw`<p>Vì <span class="katex"><math><semantics><annotation encoding="application/x-tex">a_{m_k}\to a</annotation></semantics></math><span>duplicated visual symbols</span></span>, tồn tại K sao cho</p><p><span class="katex"><math><annotation encoding="application/x-tex">|a_{m_k}-a|&lt;\frac{\varepsilon}{2}</annotation></math></span>.</p><script>bad()</script>`;
    const event=await paste({'text/plain':'flattened and duplicated fallback','text/html':html});
    const inserted=field().insert.mock.calls.at(-1)?.[0];
    expect(event.defaultPrevented).toBe(true);
    const ending=mode==='math'?String.raw`\text{, tồn tại }K\text{ sao cho}`:String.raw`\text{, tồn tại K sao cho}`;
    expect(inserted).toContain(String.raw`\text{Vì }a_{m_k}\to a`+ending);
    expect(inserted).toContain(String.raw`|a_{m_k}-a|<\frac{\varepsilon}{2}`);
    expect(inserted.match(/\\class\{mathfolio-line\}/g)).toHaveLength(2);
    expect(inserted).not.toMatch(/duplicated|fallback|bad\(\)|<math/);
    expect(field().mode).toBe(mode);expect(field().smartMode).toBe(false);
    expect(change).toHaveBeenLastCalledWith(field().value);
  });
  it('accepts annotated HTML even without a text/plain clipboard alternative',async()=>{
    const event=await paste('text/html',String.raw`<p>So sánh <math><annotation encoding="application/x-latex">\frac{1}{2}</annotation></math>.</p>`);
    expect(event.defaultPrevented).toBe(true);
    expect(field().insert).toHaveBeenCalledWith(String.raw`\text{So sánh }\frac{1}{2}\text{.}`,expect.anything());
  });
  it('prefers explicit LaTeX over HTML/plain alternatives and retains the chosen typing mode',async()=>{
    field().mode='text';
    const latex=String.raw`\frac{a+b}{c}`;
    field().insert.mockImplementationOnce((value:string)=>{field().value+=value;field().mode='math';return true;});
    await paste({'application/x-latex':latex,'text/plain':'flattened','text/html':'<p>ignored</p>'});
    expect(field().insert).toHaveBeenCalledWith(latex,expect.anything());expect(field().mode).toBe('text');
  });
  it('uses native fence-aware superscripts for keyboard and toolbar actions',async()=>{
    expect(field().smartMode).toBe(false);expect(field().smartFence).toBe(true);expect(field().smartSuperscript).toBe(false);
    const event=new KeyboardEvent('keydown',{key:'^',cancelable:true});
    await act(async()=>field().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);expect(field().executeCommand).toHaveBeenCalledWith('moveToSuperscript');
    field().executeCommand.mockClear();
    await act(async()=>handle.current!.insert('^{2}'));
    expect(field().executeCommand.mock.calls).toEqual([['moveToSuperscript'],['moveAfterParent']]);
    expect(field().insert).toHaveBeenCalledWith('2',expect.anything());
  });
  it('attaches a subscript to the current base or whole selected expression',async()=>{
    await act(async()=>handle.current!.insert('_{#?}'));
    expect(field().executeCommand).toHaveBeenCalledWith('moveToSubscript');
    field().selectionIsCollapsed=false;
    await act(async()=>handle.current!.insert('_{#?}'));
    expect(field().insert).toHaveBeenLastCalledWith('{#0}_{#?}',expect.objectContaining({selectionMode:'placeholder'}));
  });
  it('never changes readonly problems or intercepts IME composition',async()=>{
    await act(async()=>root.render(<MathInput ref={handle} value="x" readOnly onChange={change}/>));
    await paste('text/plain','replacement');await act(async()=>handle.current!.insert('^{2}'));
    expect(change).not.toHaveBeenCalled();expect(field().value).toBe('x');
    await act(async()=>root.render(<MathInput ref={handle} value="x" onChange={change}/>));
    const event=new KeyboardEvent('keydown',{key:'^',isComposing:true,cancelable:true});
    await act(async()=>field().dispatchEvent(event));expect(event.defaultPrevented).toBe(false);
  });
  it('rejects oversized paste without truncating the current expression',async()=>{
    await act(async()=>root.render(<MathInput ref={handle} value="x+1" onChange={change}/>));
    await paste('text/plain','a'.repeat(6001));
    expect(field().value).toBe('x+1');expect(change).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('6,000');
  });
});
async function editorKey(key:string, type='keydown', extra:KeyboardEventInit={}){
  const event=new KeyboardEvent(type,{key,bubbles:true,cancelable:true,...extra});
  // happy-dom conflates Alt and AltGraph; model the browser's separate modifier state.
  const modifier=event.getModifierState.bind(event);
  Object.defineProperty(event,'getModifierState',{value:(name:string)=>name==='AltGraph'?!!extra.modifierAltGraph||!!extra.ctrlKey&&!!extra.altKey:modifier(name)});
  await act(async()=>field().dispatchEvent(event));return event;
}
async function altTap(code='AltLeft'){await editorKey('Alt','keydown',{altKey:true,code});await editorKey('Alt','keyup',{code});}
async function ctrlTap(){await editorKey('Control','keydown',{ctrlKey:true});await editorKey('Control','keyup');}
describe('manual Math/Text control',()=>{
  it('locks Text for Vietnamese prose and switches back with one Alt tap',async()=>{
    const toggle=host.querySelector<HTMLButtonElement>('[aria-label="Input mode for Problem statement"]')!;
    await act(async()=>toggle.click());
    expect(field().mode).toBe('text');expect(field().smartMode).toBe(false);expect(change).not.toHaveBeenCalled();
    await paste('text/plain','hôm nay là ngày đầu tuần x^2');
    expect(field().insert.mock.calls.at(-1)?.[0]).toBe(String.raw`\text{hôm nay là ngày đầu tuần x\^2}`);
    expect((await editorKey('^')).defaultPrevented).toBe(false);
    await altTap();
    expect(field().mode).toBe('math');expect(toggle.textContent).toContain('Math');
  });
  it('never treats Ctrl+C/S or held/repeated Control as a mode switch',async()=>{
    await editorKey('Control','keydown',{ctrlKey:true});await editorKey('c','keydown',{ctrlKey:true});await editorKey('Control','keyup');await ctrlTap();
    expect(field().mode).toBe('math');
    await editorKey('Control','keydown',{ctrlKey:true});await editorKey('s','keydown',{ctrlKey:true});await editorKey('Control','keyup');await ctrlTap();
    expect(field().mode).toBe('math');
    await editorKey('Control','keydown',{ctrlKey:true});await editorKey('Control','keydown',{ctrlKey:true,repeat:true});
    expect(field().mode).toBe('math');
  });
  it('does not switch for Option character chords, AltGraph, composition, or focus changes',async()=>{
    await editorKey('Alt','keydown',{altKey:true,code:'AltRight'});await editorKey('Dead','keydown',{altKey:true});await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await editorKey('Alt','keydown',{altKey:true,ctrlKey:true});await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await editorKey('Alt','keydown',{altKey:true,modifierAltGraph:true});await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await editorKey('Alt','keydown',{altKey:true,isComposing:true});await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await editorKey('Alt','keydown',{altKey:true});await act(async()=>field().dispatchEvent(new Event('blur')));await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await editorKey('Alt','keydown',{altKey:true});await act(async()=>field().dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,altKey:true})));await editorKey('Alt','keyup');expect(field().mode).toBe('math');
    await altTap('AltRight');expect(field().mode).toBe('text');
  });
  it('toggles once per release, suppresses the bare Alt browser menu, and ignores old double Control',async()=>{
    expect((await editorKey('Alt','keydown',{altKey:true})).defaultPrevented).toBe(true);
    await editorKey('Alt','keydown',{altKey:true,repeat:true});expect(field().mode).toBe('math');await editorKey('Alt','keyup');expect(field().mode).toBe('text');
    await ctrlTap();await ctrlTap();expect(field().mode).toBe('text');
  });
  it.each(['Notes','Chat'])('uses the same Alt/Option switch in %s without modifying content',async label=>{
    await act(async()=>root.render(<MathInput value="" label={label} initialMode="text" onChange={change}/>));
    await altTap('AltRight');expect(field().mode).toBe('math');await altTap('AltLeft');expect(field().mode).toBe('text');expect(change).not.toHaveBeenCalled();
  });
  it('accepts formatted note-sized content and preserves line breaks and explicit LaTeX',async()=>{
    await act(async()=>root.render(<MathInput ref={handle} value="" label="Notes" initialMode="text" maxLength={30000} preserveLines onChange={change}/>));
    expect(field().mode).toBe('text');
    await paste('text/plain',String.raw`$$\forall \varepsilon>0,\exists N\in\mathbb{N}: |x_n-x_m|<\varepsilon$$`);
    expect(field().insert.mock.calls.at(-1)?.[0]).toContain(String.raw`\forall \varepsilon`);
    expect(field().insert.mock.calls.at(-1)?.[0]).not.toContain('$$');
    await paste('text/plain','First step\nSecond step');
    expect(field().insert.mock.calls.at(-1)?.[0]).toContain(String.raw`\class{mathfolio-line}`);
    const enter=await editorKey('Enter');expect(enter.defaultPrevented).toBe(true);
    expect(field().insert.mock.calls.at(-1)?.[0]).toBe(String.raw`\class{mathfolio-line}{#?}`);
    field().value='';await paste('text/plain','Long notes '.repeat(700));
    expect(change.mock.calls.at(-1)?.[0].length).toBeGreaterThan(6000);expect(host.querySelector('[role="alert"]')).toBeNull();
  });
  it('keeps manual controls disabled for busy editors and ignores Alt taps in read-only views',async()=>{
    await act(async()=>root.render(<MathInput value="x" disabled onChange={change}/>));
    expect(host.querySelector<HTMLButtonElement>('.editor-mode-toggle')!.disabled).toBe(true);
    await altTap();expect(field().mode).toBe('math');
    await act(async()=>root.render(<MathInput value="x" readOnly onChange={change}/>));
    expect(host.querySelector('.editor-mode-toggle')).toBeNull();
  });
});
function SharedEditors(){
  const problem=useRef<MathInputHandle>(null),chat=useRef<MathInputHandle>(null);
  const [statement,setStatement]=useState(''),[notes,setNotes]=useState(''),[question,setQuestion]=useState(''),[locked,setLocked]=useState(false);
  return <MathKeyboardProvider><section><MathInput ref={problem} label="Problem" value={statement} readOnly={locked} onChange={setStatement}/><MathKeyboard onActivate={()=>problem.current?.focus()} onInsert={symbol=>problem.current?.insert(symbol.latex)}/><NotesEditor label="Notes" value={notes} format="latex" onChange={setNotes}/><MathInput ref={chat} label="Chat" initialMode="text" value={question} onChange={setQuestion}/><MathKeyboard showCommon={false} onActivate={()=>chat.current?.focus()} onInsert={symbol=>chat.current?.insert(symbol.latex)}/><button onClick={()=>setLocked(true)}>Lock problem</button></section></MathKeyboardProvider>;
}
const editor=(label:string)=>host.querySelector<StubField>(`[aria-label="${label}"]`)!;
const palette=()=>document.querySelector<HTMLElement>('.symbol-browser')!;
async function symbol(){await act(async()=>palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.click());}
describe('shared math palette with real editor registration',()=>{
  it('uses one open palette across Problem, Notes and Chat and keeps inactive fields unchanged',async()=>{
    await act(async()=>root.render(<SharedEditors/>));
    await act(async()=>host.querySelector<HTMLButtonElement>('.more-symbols')!.click());
    const original=palette();expect(original.textContent).toContain('Typing in: Problem');await symbol();
    const first=editor('Problem').value;expect(first).toBe(String.raw`\emptyset`);
    await act(async()=>editor('Notes').focus());expect(palette()).toBe(original);expect(original.textContent).toContain('Typing in: Notes');await symbol();
    expect(editor('Notes').value).toBe(String.raw`\emptyset`);expect(editor('Problem').value).toBe(first);
    await act(async()=>editor('Chat').focus());expect(palette()).toBe(original);expect(original.textContent).toContain('Typing in: Chat');await symbol();
    expect(editor('Chat').value).toBe(String.raw`\emptyset`);expect(editor('Notes').value).toBe(String.raw`\emptyset`);
    await act(async()=>host.querySelectorAll<HTMLButtonElement>('.more-symbols')[1].click());expect(document.querySelectorAll('.symbol-browser')).toHaveLength(1);
    await act(async()=>editor('Problem').focus());await symbol();expect(editor('Problem').value).toBe(first+String.raw`\emptyset`);
  });
  it('disables insertion when the active field becomes read-only and resumes when another field is chosen',async()=>{
    await act(async()=>root.render(<SharedEditors/>));await act(async()=>host.querySelector<HTMLButtonElement>('.more-symbols')!.click());
    await act(async()=>[...host.querySelectorAll('button')].find(button=>button.textContent==='Lock problem')!.click());
    expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(true);
    await act(async()=>editor('Chat').focus());expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(false);await symbol();
    expect(editor('Problem').value).toBe('');expect(editor('Chat').value).toBe(String.raw`\emptyset`);
  });
  it('never switches math/text on Latin accents, words or IME keystrokes',async()=>{
    expect(field().smartMode).toBe(false);
    await editorKey('ô');await editorKey('a');expect(field().mode).toBe('math');
    await act(async()=>host.querySelector<HTMLButtonElement>('.editor-mode-toggle')!.click());
    await editorKey('x');await editorKey('2');await editorKey('ô','keydown',{isComposing:true});expect(field().mode).toBe('text');expect(field().smartMode).toBe(false);
  });
});
describe('shared keyboard modal boundaries',()=>{
  it('moves into saved-note dialogs and cannot write to inert or unmounted editors',async()=>{
    function PreviewHarness(){
      const field=useRef<MathInputHandle>(null),[open,setOpen]=useState(false),[problem,setProblem]=useState(''),[note,setNote]=useState('');
      return <MathKeyboardProvider><main inert={open}><MathInput ref={field} label="Problem" value={problem} onChange={setProblem}/><MathKeyboard onActivate={()=>field.current?.focus()} onInsert={symbol=>field.current?.insert(symbol.latex)}/></main><button onClick={()=>setOpen(true)}>Open preview</button>{open&&<section role="dialog"><NotesEditor label="Saved notes" value={note} format="latex" onChange={setNote}/><button onClick={()=>setOpen(false)}>Close preview</button></section>}</MathKeyboardProvider>;
    }
    await act(async()=>root.render(<PreviewHarness/>));await act(async()=>host.querySelector<HTMLButtonElement>('.more-symbols')!.click());
    await act(async()=>[...host.querySelectorAll('button')].find(item=>item.textContent==='Open preview')!.click());
    expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(true);
    await act(async()=>editor('Saved notes').focus());expect(palette().closest('[role="dialog"]')).not.toBeNull();await symbol();expect(editor('Saved notes').value).toBe(String.raw`\emptyset`);expect(editor('Problem').value).toBe('');
    await act(async()=>[...host.querySelectorAll('button')].find(item=>item.textContent==='Close preview')!.click());expect(palette().closest('[role="dialog"]')).toBeNull();expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(true);
  });
});
describe('shared keyboard while a save dialog is open',()=>{
  it('blocks a background editor even when the dialog has not made its ancestor inert',async()=>{
    function SaveHarness(){
      const input=useRef<MathInputHandle>(null),[value,setValue]=useState(''),[saving,setSaving]=useState(false);
      return <MathKeyboardProvider><MathInput ref={input} label="Problem" value={value} onChange={setValue}/><MathKeyboard onActivate={()=>input.current?.focus()} onInsert={symbol=>input.current?.insert(symbol.latex)}/><button onClick={()=>setSaving(true)}>Save dialog</button>{saving&&<section role="dialog"><input aria-label="Exercise name"/><button onClick={()=>setSaving(false)}>Cancel save</button></section>}</MathKeyboardProvider>;
    }
    await act(async()=>root.render(<SaveHarness/>));await act(async()=>host.querySelector<HTMLButtonElement>('.more-symbols')!.click());
    await act(async()=>[...host.querySelectorAll('button')].find(button=>button.textContent==='Save dialog')!.click());
    expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(true);expect(palette().style.zIndex).toBe('5');
    await act(async()=>[...host.querySelectorAll('button')].find(button=>button.textContent==='Cancel save')!.click());await act(async()=>editor('Problem').focus());
    expect(palette().querySelector<HTMLButtonElement>('[aria-label="Insert ∅"]')!.disabled).toBe(false);await symbol();expect(editor('Problem').value).toBe(String.raw`\emptyset`);
  });
});
