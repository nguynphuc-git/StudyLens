import {folderColors,type FolderColor} from '../folder-colors';
export function FolderColorPicker({value,onChange,disabled=false}:{value:FolderColor;onChange:(color:FolderColor)=>void;disabled?:boolean}){
  return <div className="folder-color-picker" role="group" aria-label="Folder color">
    <div className="folder-swatches">{folderColors.map(color=><button type="button" key={color.id} className="folder-swatch" data-folder-color={color.id} disabled={disabled} aria-label={`${color.name} pastel`} aria-pressed={color.id===value} title={color.name} onClick={()=>onChange(color.id)}><span aria-hidden="true">{color.id===value?'✓':''}</span></button>)}</div>
    <small>{folderColors.find(color=>color.id===value)?.name} · pastel</small>
  </div>;
}
