import { describe, expect, it } from 'vitest';
import { addFolder, recolorFolder,emptyNotebook, newExercise, putExercise, removeFolder } from '../src/notebook';
import {folderColor,type FolderColor} from '../src/folder-colors';
describe('notebook folder management', () => {
  it('stores pastel colors without changing exercise records or folder memberships',()=>{
    let book=addFolder(emptyNotebook(),'Geometry','lavender');const id=book.folders[1].id;
    book=putExercise(book,{...newExercise(),title:'Triangle',statement:'a+b=c',folderIds:[id]});
    const next=recolorFolder(book,id,'peach');expect(next.folders[1].color).toBe('peach');expect(book.folders[1].color).toBe('lavender');expect(next.exercises).toBe(book.exercises);
    expect(recolorFolder(next,'general','sky').folders[0].color).toBe('sky');
  });
  it('provides a safe default for old colors and rejects invalid colors or missing folders',()=>{
    expect(folderColor(undefined).id).toBe('sage');expect(folderColor('url(evil)').id).toBe('sage');
    expect(()=>addFolder(emptyNotebook(),'Bad','red' as FolderColor)).toThrow('pastel');
    expect(()=>recolorFolder(emptyNotebook(),'missing','rose')).toThrow('not found');
    expect(()=>recolorFolder(emptyNotebook(),'general','red' as FolderColor)).toThrow('pastel');
    expect(emptyNotebook().folders[0].color).toBeUndefined();
  });
  it('creates a named empty folder without changing existing content', () => {
    const initial=emptyNotebook(); const next=addFolder(initial,'  Algebra week 1  ');
    expect(next.folders).toHaveLength(2); expect(next.folders[1].name).toBe('Algebra week 1');
    expect(next.folders[1].id).not.toBe('general'); expect(initial.folders).toHaveLength(1);
  });
  it('rejects blank, oversized and duplicate names', () => {
    const book=addFolder(emptyNotebook(),'Algebra');
    expect(()=>addFolder(book,' ')).toThrow();
    expect(()=>addFolder(book,'a'.repeat(81))).toThrow();
    expect(()=>addFolder(book,' ALGEBRA ')).toThrow('already exists');
    expect(()=>addFolder(book,'my exercises')).toThrow('already exists');
  });
  it('moves pages to the default folder without losing notes, hints, chat or images', () => {
    let book=addFolder(emptyNotebook(),'Geometry'); const folderId=book.folders[1].id;
    const page={...newExercise(),folderId,title:'Triangle',statement:'A right triangle',notes:'My working',hints:[{text:'Pythagoras',source:'on_device'}],messages:[{role:'user' as const,text:'Another method?'}],attachments:[{id:'image',name:'triangle.png',data:'data:image/png;base64,AA==',kind:'problem' as const}]};
    book=putExercise(book,page);
    const next=removeFolder(book,folderId);
    expect(next.folders).toHaveLength(1);
    expect(next.exercises[0]).toEqual({...book.exercises[0],folderId:'general',folderIds:[]});
    expect(book.exercises[0].folderId).toBe(folderId);
  });
  it('keeps pages in other folders and refuses deletion of the recovery folder', () => {
    let book=addFolder(addFolder(emptyNotebook(),'A'),'B');
    book=putExercise(book,{...newExercise(),folderId:book.folders[2].id,title:'Other',statement:'x+1=2'});
    const next=removeFolder(book,book.folders[1].id);
    expect(next.exercises[0]).toEqual(book.exercises[0]);
    expect(()=>removeFolder(book,'general')).toThrow('cannot be deleted');
    expect(()=>removeFolder(book,'missing')).toThrow('not found');
  });
});
