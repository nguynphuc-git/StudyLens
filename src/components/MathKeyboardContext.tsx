import {createContext,useCallback,useContext,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {SymbolPanel} from './SymbolPanel';
import type {MathSymbol} from '../math-symbols';
import type {Point} from '../floating-keyboard';
export interface MathTarget {id:string;label:string;element:HTMLElement;available:()=>boolean;insert:(latex:string)=>void;focus:()=>void}
export function editableMathTarget(field:HTMLElement):boolean {
  if(!field.isConnected||field.closest('[inert],[hidden]'))return false;
  const top=[...field.ownerDocument.querySelectorAll<HTMLElement>('[role="dialog"],[role="alertdialog"]')].filter(dialog=>!dialog.closest('[inert],[hidden]')).at(-1);
  return !top||top.contains(field);
}
const recentKey='mathfolio.recent-symbols';
export function readRecent():string[]{try{const value:unknown=JSON.parse(localStorage.getItem(recentKey)??'[]');return Array.isArray(value)?value.filter(item=>typeof item==='string').slice(0,6):[];}catch{return [];}}
interface KeyboardState {open:boolean;show:()=>void;close:()=>void;activate:(target:MathTarget)=>void;release:(id:string)=>void;refresh:()=>void;recent:string[];remember:(symbol:MathSymbol)=>void;insert:(symbol:MathSymbol)=>void}
const Context=createContext<KeyboardState|null>(null);
export const useMathKeyboard=()=>useContext(Context);
export function MathKeyboardProvider({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false),[active,setActive]=useState<MathTarget|null>(null),[recent,setRecent]=useState(readRecent),[position,setPosition]=useState<Point|null>(null);
  const [,setRevision]=useState(0),target=useRef<MathTarget|null>(null);
  const activate=useCallback((next:MathTarget)=>{if(!next.available())return;target.current=next;setActive(current=>current?.id===next.id?current:next);},[]);
  const release=useCallback((id:string)=>{if(target.current?.id===id){target.current=null;setActive(null);}},[]);
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  const remember=useCallback((symbol:MathSymbol)=>setRecent(current=>{const next=[symbol.label,...current.filter(label=>label!==symbol.label)].slice(0,6);try{localStorage.setItem(recentKey,JSON.stringify(next));}catch{}return next;}),[]);
  const insert=useCallback((symbol:MathSymbol)=>{const current=target.current;if(!current?.available())return;current.focus();current.insert(symbol.latex);remember(symbol);},[remember]);
  const close=useCallback(()=>{setOpen(false);if(target.current?.available())target.current.focus();},[]);
  const available=!!active?.available();
  const suspended=!available&&!!document.querySelector('[role="dialog"],[role="alertdialog"]');
  useLayoutEffect(()=>{
    let previous=`${available}/${suspended}`;
    const sync=()=>{
      const nextAvailable=!!active?.available();
      const next=`${nextAvailable}/${!nextAvailable&&!!document.querySelector('[role="dialog"],[role="alertdialog"]')}`;
      if(next!==previous){previous=next;refresh();}
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['inert','hidden','role']});
    return ()=>observer.disconnect();
  },[active,available,suspended,refresh]);
  const portal=active?.element.closest<HTMLElement>('[role="dialog"]')??document.body;
  return <Context.Provider value={{open,show:()=>setOpen(true),close,activate,release,refresh,recent,remember,insert}}>
    {children}
    {open&&createPortal(<SymbolPanel recent={recent} onInsert={insert} disabled={!available} onClose={close} suspended={suspended} targetLabel={available?active!.label:'Click Problem, Notes or Chat to choose a field'} position={position} onPosition={setPosition}/>,portal)}
  </Context.Provider>;
}
