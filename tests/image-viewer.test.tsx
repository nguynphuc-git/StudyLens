// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {ImageViewer} from '../src/components/ImageViewer';
import {fitImage,imageZoom} from '../src/image-view';
import {lockBodyScroll} from '../src/scroll-lock';
let host:HTMLDivElement,root:Root;const close=vi.fn();
const image={id:'image',data:'data:image/png;base64,AA==',name:'Proof.png',kind:'solution' as const};
const control=(label:string)=>host.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
const zoom=()=>Number(host.querySelector('output')!.textContent!.replace('%',''));
const stage=()=>host.querySelector<HTMLDivElement>('.image-viewer-stage')!;
async function click(label:string){await act(async()=>control(label).click());}
async function loaded(){const img=host.querySelector<HTMLImageElement>('img')!;Object.defineProperty(img,'naturalWidth',{configurable:true,value:2000});Object.defineProperty(img,'naturalHeight',{configurable:true,value:1000});await act(async()=>img.dispatchEvent(new Event('load')));}
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});close.mockReset();
  vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('image-viewer-stage')?600:0;});
  vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('image-viewer-stage')?400:0;});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<ImageViewer image={image} onClose={close}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('local attachment image viewer',()=>{
  it('fits the original image, zooms, and returns to fit without changing its source',async()=>{
    expect(control('Zoom in').disabled).toBe(true);await loaded();expect(zoom()).toBe(28);
    await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('button')].find(x=>x.textContent==='Actual size')!.click());expect(zoom()).toBe(100);
    await click('Zoom in');expect(zoom()).toBe(125);await click('Zoom out');expect(zoom()).toBe(100);
    await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('button')].find(x=>x.textContent==='Fit to window')!.click());expect(zoom()).toBe(28);
    expect(host.querySelector<HTMLImageElement>('img')!.src).toBe(image.data);expect(image.name).toBe('Proof.png');
  });
  it('supports scroll-wheel zoom and drag panning of an enlarged image',async()=>{
    await loaded();const wheel=new WheelEvent('wheel',{deltaY:-120,clientX:150,clientY:100,cancelable:true});
    await act(async()=>stage().dispatchEvent(wheel));expect(wheel.defaultPrevented).toBe(true);expect(zoom()).toBeGreaterThan(28);
    stage().scrollLeft=100;stage().scrollTop=100;Object.defineProperty(stage(),'setPointerCapture',{value:vi.fn()});
    for(const [type,x,y] of [['pointerdown',200,200],['pointermove',160,150],['pointerup',160,150]] as const)await act(async()=>stage().dispatchEvent(new PointerEvent(type,{button:0,pointerId:1,clientX:x,clientY:y,bubbles:true,cancelable:true})));
    expect(stage().scrollLeft).toBe(140);expect(stage().scrollTop).toBe(150);expect(stage().classList.contains('dragging')).toBe(false);
  });
  it('captures Escape before a parent dialog can react and traps keyboard focus',async()=>{
    const parent=vi.fn();document.addEventListener('keydown',parent);
    const first=control('Close image viewer');expect(document.activeElement).toBe(first);
    await act(async()=>first.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));expect(document.activeElement).toBe(stage());
    await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    expect(close).toHaveBeenCalledOnce();expect(parent).not.toHaveBeenCalledWith(expect.objectContaining({key:'Escape'}));document.removeEventListener('keydown',parent);
  });
  it('reports an unreadable attachment and keeps close available',async()=>{
    await act(async()=>host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('could not be displayed');expect(control('Zoom in').disabled).toBe(true);
    await click('Close image viewer');expect(close).toHaveBeenCalledOnce();
  });
  it('uses bounded zoom and handles portrait/landscape images without enlarging small originals',()=>{
    expect(fitImage({width:100,height:50},{width:600,height:400})).toBe(1);
    expect(fitImage({width:1000,height:2000},{width:600,height:400})).toBeCloseTo(.184);
    expect(imageZoom(500)).toBe(5);expect(imageZoom(0)).toBe(.01);
  });
});
describe('nested modal scroll locks',()=>{
  it('restores the original overflow only after the last owner closes, in either order',()=>{
    const doc=document.implementation.createHTMLDocument();doc.body.style.overflow='clip';
    const a=lockBodyScroll(doc),b=lockBodyScroll(doc);a();expect(doc.body.style.overflow).toBe('hidden');a();b();expect(doc.body.style.overflow).toBe('clip');
    const c=lockBodyScroll(doc),d=lockBodyScroll(doc);d();expect(doc.body.style.overflow).toBe('hidden');c();expect(doc.body.style.overflow).toBe('clip');
  });
});
