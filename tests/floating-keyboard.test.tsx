// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {MathKeyboard} from '../src/components/MathKeyboard';
import {keyboardPosition} from '../src/floating-keyboard';
let root:Root,host:HTMLDivElement;const insert=vi.fn();
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});insert.mockReset();
  vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<MathKeyboard onInsert={insert}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function open(){await act(async()=>host.querySelector<HTMLButtonElement>('.more-symbols')!.click());}
async function pointer(target:Element,type:string,x:number,y:number){await act(async()=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,button:0,pointerId:7,clientX:x,clientY:y})));}
describe('movable persistent symbol panel',()=>{
  it('remains open after outside clicks, Escape and a temporary busy state; closes using its button',async()=>{
    await open();const panel=host.querySelector<HTMLElement>('.symbol-browser')!;
    await pointer(document.body,'pointerdown',0,0);await act(async()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})));
    expect(panel.hidden).toBe(false);
    await act(async()=>root.render(<MathKeyboard onInsert={insert} disabled/>));expect(panel.hidden).toBe(false);
    await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Close symbol keyboard"]')!.click());expect(host.querySelector('.symbol-browser')).toBeNull();
    expect(insert).not.toHaveBeenCalled();
  });
  it('moves by the drag handle, remembers position after closing, and clamps on viewport resize',async()=>{
    vi.spyOn(window,'innerWidth','get').mockReturnValue(1000);vi.spyOn(window,'innerHeight','get').mockReturnValue(800);
    await open();let panel=host.querySelector<HTMLElement>('.symbol-browser')!;const handle=host.querySelector<HTMLElement>('.symbol-drag-handle')!;
    Object.defineProperty(handle,'setPointerCapture',{value:vi.fn()});
    vi.spyOn(panel,'getBoundingClientRect').mockReturnValue({left:500,top:300,width:400,height:400} as DOMRect);
    await pointer(handle,'pointerdown',510,320);await pointer(handle,'pointermove',160,120);await pointer(handle,'pointerup',160,120);
    expect(panel.style.left).toBe('150px');expect(panel.style.top).toBe('100px');
    await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Close symbol keyboard"]')!.click());await open();panel=host.querySelector<HTMLElement>('.symbol-browser')!;expect(panel.style.left).toBe('150px');vi.spyOn(panel,'getBoundingClientRect').mockReturnValue({left:150,top:100,width:400,height:400} as DOMRect);
    vi.spyOn(window,'innerWidth','get').mockReturnValue(500);await act(async()=>window.dispatchEvent(new Event('resize')));
    expect(panel.style.left).toBe('92px');expect(insert).not.toHaveBeenCalled();
  });
  it('keeps the panel reachable at viewport edges',()=>{
    expect(keyboardPosition({x:-100,y:900},{width:400,height:300},{width:1000,height:800})).toEqual({x:8,y:492});
    expect(keyboardPosition({x:900,y:900},{width:400,height:300},{width:300,height:200})).toEqual({x:8,y:8});
  });
});
