const locks=new WeakMap<Document,{count:number;overflow:string}>();
/** Reference counting keeps a parent dialog locked when its image viewer closes. */
export function lockBodyScroll(doc:Document=document):()=>void {
  let entry=locks.get(doc);
  if(!entry){entry={count:0,overflow:doc.body.style.overflow};locks.set(doc,entry);}
  entry.count++;doc.body.style.overflow='hidden';let released=false;
  return()=>{if(released)return;released=true;if(--entry!.count===0){doc.body.style.overflow=entry!.overflow;locks.delete(doc);}};
}
