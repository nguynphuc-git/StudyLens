import {useRef,useState} from 'react';
import {commonSymbols,type MathSymbol} from '../math-symbols';
import type {Point} from '../floating-keyboard';
import {useMathKeyboard,readRecent} from './MathKeyboardContext';
import {SymbolPanel} from './SymbolPanel';
export function MathKeyboard({onInsert,onActivate,disabled,notes=false,showCommon=true}:{onInsert:(symbol:MathSymbol)=>void;onActivate?:()=>void;disabled?:boolean;notes?:boolean;showCommon?:boolean}) {
  const shared=useMathKeyboard(),trigger=useRef<HTMLButtonElement>(null);const [expanded,setExpanded]=useState(false),[recent,setRecent]=useState(readRecent),[position,setPosition]=useState<Point|null>(null);
  function insert(symbol:MathSymbol){onActivate?.();onInsert(symbol);if(shared)shared.remember(symbol);else{const next=[symbol.label,...recent.filter(label=>label!==symbol.label)].slice(0,6);setRecent(next);try{localStorage.setItem('mathfolio.recent-symbols',JSON.stringify(next));}catch{}}}
  const open=shared?.open??expanded;
  return <div className="math-keyboard">
    {showCommon&&<div className="math-keys">{commonSymbols.slice(0,17).map(symbol=><button type="button" key={symbol.label} disabled={disabled} title={symbol.name} aria-label={`Insert ${symbol.label}${notes?' in notes':''}`} onMouseDown={event=>event.preventDefault()} onClick={()=>insert(symbol)}>{symbol.label}</button>)}</div>}
    <button ref={trigger} type="button" className="more-symbols" disabled={disabled} aria-expanded={open} onMouseDown={event=>event.preventDefault()} onClick={()=>{onActivate?.();if(shared)shared.show();else setExpanded(true);}}>{open?'Math symbols ↗':'More symbols ▾'}</button>
    {!shared&&expanded&&<SymbolPanel recent={recent} onInsert={insert} disabled={disabled} onClose={()=>{setExpanded(false);trigger.current?.focus();}} targetLabel={notes?'Notes':'Problem'} position={position} onPosition={setPosition}/>}
  </div>;
}
