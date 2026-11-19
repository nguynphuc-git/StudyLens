import {useEffect,useId,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {useMenuDisclosure} from './MenuDisclosure';
import {Chevron} from './Chevron';
export interface SelectOption<T extends string>{value:T;label:string;description?:string}
export function SelectMenu<T extends string>({id,label,value,options,onChange,disabled=false,describedBy}:{id?:string;label:string;value:T;options:readonly SelectOption<T>[];onChange:(value:T)=>void;disabled?:boolean;describedBy?:string}){
  const generated=useId(),listId=`${generated}-options`,owner=useMenuDisclosure();
  const trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(0),[position,setPosition]=useState<CSSProperties>({visibility:'hidden'});
  const search=useRef({value:'',at:0});
  const selected=Math.max(0,options.findIndex(option=>option.value===value));
  const close=(focus=false)=>{setOpen(false);if(focus)trigger.current?.focus();};
  function show(){if(disabled||!options.length)return;search.current={value:'',at:0};setActive(selected);setOpen(true);}
  function choose(index:number){const option=options[index];if(!disabled&&option){onChange(option.value);close(true);}}
  useEffect(()=>{if(disabled)setOpen(false);},[disabled]);
  useLayoutEffect(()=>{
    if(!open)return;
    const place=(event?:Event)=>{
      if(event?.target instanceof Node&&list.current?.contains(event.target))return;
      const rect=trigger.current?.getBoundingClientRect();if(!rect)return;
      const viewport=window.visualViewport,originX=viewport?.offsetLeft??0,originY=viewport?.offsetTop??0;
      const width=Math.max(0,Math.min(Math.max(rect.width,180),(viewport?.width??innerWidth)-24));
      const bottom=originY+(viewport?.height??innerHeight),below=bottom-rect.bottom-20,above=rect.top-originY-20;
      const upward=below<Math.min(160,options.length*44+12)&&above>below;
      const height=Math.max(60,Math.min(230,upward?above:below));
      const actual=Math.min(height,list.current?.scrollHeight||options.length*44+12);
      setPosition({left:Math.max(originX+12,Math.min(rect.left,originX+(viewport?.width??innerWidth)-width-12)),top:upward?Math.max(originY+12,rect.top-actual-8):Math.max(originY+12,rect.bottom+8),width,maxHeight:height});
    };
    place();window.addEventListener('resize',place);document.addEventListener('scroll',place,true);window.visualViewport?.addEventListener('resize',place);window.visualViewport?.addEventListener('scroll',place);
    const outside=(event:Event)=>{const node=event.target;if(node instanceof Node&&!trigger.current?.contains(node)&&!list.current?.contains(node))setOpen(false);};
    const toggle=()=>{if(!owner?.root.current?.open)setOpen(false);};
    document.addEventListener('pointerdown',outside,true);document.addEventListener('focusin',outside);const details=owner?.root.current;details?.addEventListener('toggle',toggle);
    return()=>{window.removeEventListener('resize',place);document.removeEventListener('scroll',place,true);window.visualViewport?.removeEventListener('resize',place);window.visualViewport?.removeEventListener('scroll',place);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('focusin',outside);details?.removeEventListener('toggle',toggle);};
  },[open,owner?.id,options.length]);
  useEffect(()=>{if(open)list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({block:'nearest'});},[active,open]);
  function keys(event:React.KeyboardEvent){
    if(disabled||event.isDefaultPrevented()||event.nativeEvent.isComposing)return;
    const key=event.key;
    if(key==='Tab'){close();return;}
    if(key==='Escape'&&open){event.preventDefault();event.stopPropagation();close(true);return;}
    if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
      event.preventDefault();event.stopPropagation();
      if(!open){show();return;}
      if(key==='Enter'||key===' ')choose(active);
      else setActive(current=>key==='Home'?0:key==='End'?options.length-1:(current+(key==='ArrowDown'?1:-1)+options.length)%options.length);
      return;
    }
    if(open&&key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();const now=performance.now();search.current={value:now-search.current.at<800?search.current.value+key:key,at:now};
      const match=options.findIndex(option=>option.label.toLocaleLowerCase().startsWith(search.current.value.toLocaleLowerCase()));if(match>=0)setActive(match);
    }
  }
  return <div className="select-menu">
    <button ref={trigger} id={id} type="button" role="combobox" aria-label={label} aria-describedby={describedBy} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined} aria-activedescendant={open?`${listId}-${active}`:undefined} disabled={disabled} className="select-trigger" onKeyDown={keys} onClick={()=>open?close():show()}><span>{options[selected]?.label??'Choose an option'}</span><Chevron className="select-chevron" expanded={open}/></button>
    {open&&createPortal(<div ref={list} id={listId} role="listbox" aria-label={`${label} options`} data-disclosure-owner={owner?.id} className="select-options" style={position} onKeyDown={keys}>{options.map((option,index)=><button type="button" role="option" id={`${listId}-${index}`} key={option.value} aria-selected={value===option.value} tabIndex={-1} data-index={index} className={active===index?'highlighted':''} onMouseDown={event=>event.preventDefault()} onPointerMove={()=>setActive(index)} onClick={()=>choose(index)}><span>{option.label}{option.description&&<small>{option.description}</small>}</span><span className="option-check" aria-hidden="true">{value===option.value?'✓':''}</span></button>)}</div>,document.body)}
  </div>;
}
