import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {lockBodyScroll} from '../scroll-lock';
import {fitImage,imageZoom,type ImageSize} from '../image-view';
import type {Attachment} from '../notebook';
interface Anchor {x:number;y:number;clientX:number;clientY:number}
export function ImageViewer({image,onClose,kindLabel}:{image:Attachment;onClose:()=>void;kindLabel?:string}) {
  const [natural,setNatural]=useState<ImageSize>({width:0,height:0}),[viewport,setViewport]=useState<ImageSize>({width:0,height:0});
  const [zoom,setZoom]=useState<number|'fit'>('fit'),[error,setError]=useState(false),[dragging,setDragging]=useState(false);
  const dialog=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),picture=useRef<HTMLImageElement>(null),close=useRef<HTMLButtonElement>(null);
  const callback=useRef(onClose);callback.current=onClose;
  const pending=useRef<Anchor|null>(null),drag=useRef<{id:number;x:number;y:number;left:number;top:number}|null>(null);
  const fit=fitImage(natural,viewport),scale=zoom==='fit'?fit:zoom;
  const current=useRef({scale,natural});current.current={scale,natural};
  const changeZoom=useRef<(value:number|'fit',point?:{x:number;y:number})=>void>(()=>{});
  changeZoom.current=(value,point)=>{
    const area=stage.current,img=picture.current;if(!area||!img||!natural.width||error)return;
    if(value==='fit'){pending.current=null;setZoom('fit');area.scrollLeft=0;area.scrollTop=0;return;}
    const next=imageZoom(value);if(next===scale)return;
    const bounds=area.getBoundingClientRect(),imageBounds=img.getBoundingClientRect();
    const x=point?.x??bounds.left+area.clientWidth/2,y=point?.y??bounds.top+area.clientHeight/2;
    pending.current={x:(x-imageBounds.left)/scale,y:(y-imageBounds.top)/scale,clientX:x-bounds.left,clientY:y-bounds.top};
    setZoom(next);
  };
  useLayoutEffect(()=>{
    const area=stage.current;if(!area)return;
    const measure=()=>setViewport({width:area.clientWidth,height:area.clientHeight});
    measure();const observer=new ResizeObserver(measure);observer.observe(area);return()=>observer.disconnect();
  },[]);
  useLayoutEffect(()=>{
    const anchor=pending.current,area=stage.current,img=picture.current;if(!anchor||!area||!img)return;
    pending.current=null;const bounds=area.getBoundingClientRect(),imageBounds=img.getBoundingClientRect();
    area.scrollLeft+=imageBounds.left-bounds.left+anchor.x*scale-anchor.clientX;
    area.scrollTop+=imageBounds.top-bounds.top+anchor.y*scale-anchor.clientY;
  },[scale]);
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const release=lockBodyScroll();close.current?.focus();
    const handle=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();callback.current();return;}
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(['+','=','-','0','1'].includes(event.key)){
        event.preventDefault();event.stopImmediatePropagation();
        changeZoom.current(event.key==='0'?'fit':event.key==='1'?1:current.current.scale*(event.key==='-' ? 0.8 : 1.25));return;
      }
      if(event.key!=='Tab')return;
      const nodes=[...dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')??[]],first=nodes[0],last=nodes.at(-1);
      if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    const area=stage.current;
    const wheel=(event:WheelEvent)=>{
      if(!current.current.natural.width)return;event.preventDefault();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?area!.clientHeight:1);
      changeZoom.current(current.current.scale*Math.exp(-Math.max(-150,Math.min(150,delta))*.002),{x:event.clientX,y:event.clientY});
    };
    window.addEventListener('keydown',handle,true);area?.addEventListener('wheel',wheel,{passive:false});
    return()=>{release();window.removeEventListener('keydown',handle,true);area?.removeEventListener('wheel',wheel);previous?.focus();};
  },[]);
  function start(event:React.PointerEvent<HTMLDivElement>){
    if(event.button!==0||error||!natural.width)return;event.preventDefault();
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop};
    event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);
  }
  function move(event:React.PointerEvent<HTMLDivElement>){const previous=drag.current;if(!previous||previous.id!==event.pointerId)return;event.currentTarget.scrollLeft=previous.left+previous.x-event.clientX;event.currentTarget.scrollTop=previous.top+previous.y-event.clientY;}
  function end(){drag.current=null;setDragging(false);}
  const ready=!!natural.width&&!error;
  return <div className="modal-backdrop image-viewer-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section ref={dialog} className="paper image-viewer" role="dialog" aria-modal="true" aria-labelledby="image-viewer-title" aria-describedby="image-viewer-help">
      <header className="image-viewer-header"><div><p className="eyebrow">{kindLabel??(image.kind==='problem'?'PROBLEM IMAGE':'YOUR SOLUTION')}</p><h2 id="image-viewer-title">{image.name}</h2></div><button ref={close} type="button" aria-label="Close image viewer" onClick={onClose}>✕</button></header>
      <div className="image-viewer-tools" role="group" aria-label="Image zoom"><button type="button" aria-label="Zoom out" disabled={!ready||scale<=.01} onClick={()=>changeZoom.current(scale*.8)}>−</button><output aria-live="polite" aria-label="Image zoom percentage">{Math.round(scale*100)}%</output><button type="button" aria-label="Zoom in" disabled={!ready||scale>=5} onClick={()=>changeZoom.current(scale*1.25)}>＋</button><button type="button" disabled={!ready} aria-pressed={zoom==='fit'} onClick={()=>changeZoom.current('fit')}>Fit to window</button><button type="button" disabled={!ready} aria-pressed={zoom===1} onClick={()=>changeZoom.current(1)}>Actual size</button><p id="image-viewer-help">Scroll to zoom · drag to move · Esc to close</p></div>
      <div ref={stage} className={`image-viewer-stage${dragging?' dragging':''}`} role="region" aria-label="Enlarged image" tabIndex={0} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
        {error?<p className="notice error" role="alert">This image could not be displayed. Close this viewer and try another image.</p>:<div className="image-viewer-surface" style={{width:Math.max(viewport.width,natural.width*scale+32),height:Math.max(viewport.height,natural.height*scale+32)}}>
          <img ref={picture} src={image.data} alt={image.name} draggable={false} style={natural.width?{width:natural.width*scale,height:natural.height*scale}:undefined} onLoad={event=>{setNatural({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight});}} onError={()=>setError(true)}/>
        </div>}
      </div>
    </section>
  </div>;
}
