import type {Attachment} from '../notebook';
import {useState} from 'react';
export function AttachmentGallery({images,onOpen,onRemove,onRename,disabled=false,showKind=false,onAISelection}:{images:Attachment[];onOpen:(image:Attachment)=>void;onRemove?:(id:string)=>void;onRename?:(id:string,name:string)=>void;disabled?:boolean;showKind?:boolean;onAISelection?:(id:string,included:boolean)=>void}) {
  const [renaming,setRenaming]=useState<string|null>(null),[name,setName]=useState('');
  function rename(){if(!name.trim()||name.length>120||!renaming||disabled)return;onRename?.(renaming,name.trim());setRenaming(null);}
  return <div className="attachments">{images.map(image=><figure key={image.id}>
    <button type="button" className="attachment-thumbnail" aria-label={`View image: ${image.name}`} title="Open image · zoom and pan" onClick={()=>onOpen(image)}><img src={image.data} alt={image.name}/><span aria-hidden="true">⤢</span></button>
    <figcaption>{showKind?`${image.kind==='problem'?'Problem':'Your solution'} · `:''}{image.name}<div className="image-actions">{onRename&&<button type="button" disabled={disabled} aria-label={`Rename image: ${image.name}`} onClick={()=>{setName(image.name);setRenaming(image.id);}}>Rename</button>}{onRemove&&<button type="button" disabled={disabled} aria-label={`Remove image: ${image.name}`} onClick={()=>onRemove(image.id)}>Remove</button>}</div></figcaption>
    {renaming===image.id&&<div className="image-rename"><label>Image name<input autoFocus aria-label="Image name" value={name} maxLength={120} disabled={disabled} onChange={event=>setName(event.target.value)} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setRenaming(null);}if(event.key==='Enter'){event.preventDefault();event.stopPropagation();rename();}}}/></label><button type="button" disabled={disabled||!name.trim()||name.length>120} onClick={rename}>Apply name</button><button type="button" disabled={disabled} onClick={()=>setRenaming(null)}>Cancel rename</button></div>}
    {onAISelection&&image.kind==='problem'&&<label className="check image-ai-choice"><input type="checkbox" checked={image.useForAI!==false} disabled={disabled} onChange={event=>onAISelection(image.id,event.target.checked)}/>Use this illustration for AI</label>}
  </figure>)}</div>;
}
