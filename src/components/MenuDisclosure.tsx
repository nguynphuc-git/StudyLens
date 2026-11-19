import {Children,cloneElement,isValidElement,createContext,useContext,useEffect,useId,useRef,type ReactNode,type RefObject} from 'react';
import {Chevron} from './Chevron';
const Context=createContext<{id:string;root:RefObject<HTMLDetailsElement|null>}|null>(null);
export const useMenuDisclosure=()=>useContext(Context);
/** Temporary menus dismiss outside; the independent math palette stays persistent. */
export function MenuDisclosure({className,children}:{className:string;children:ReactNode}){
  const root=useRef<HTMLDetailsElement>(null),id=useId();
  useEffect(()=>{
    const inside=(target:EventTarget|null)=>target instanceof Element&&(root.current?.contains(target)||target.closest('[data-disclosure-owner]')?.getAttribute('data-disclosure-owner')===id);
    const dismiss=(event:Event)=>{if(root.current?.open&&!inside(event.target))root.current.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&root.current?.open){event.preventDefault();root.current.open=false;root.current.querySelector<HTMLElement>('summary')?.focus();}};
    document.addEventListener('pointerdown',dismiss,true);document.addEventListener('focusin',dismiss);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('focusin',dismiss);document.removeEventListener('keydown',escape);};
  },[id]);
  return <Context.Provider value={{id,root}}><details ref={root} className={className}>{Children.map(children,child=>isValidElement<{children?:ReactNode}>(child)&&child.type==='summary'?cloneElement(child,{},<>{child.props.children}<Chevron/></>):child)}</details></Context.Provider>;
}
