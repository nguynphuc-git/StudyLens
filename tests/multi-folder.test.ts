import {describe,expect,it} from 'vitest';
import {emptyNotebook,newExercise,putExercise,putExercisePreview,exerciseFolderIds,removeFolder,type Attachment} from '../src/notebook';
import {findExercises} from '../src/notebook-library';
const problem:Attachment={id:'p',kind:'problem',name:'diagram.png',data:'data:image/png;base64,AA=='};
const solution:Attachment={id:'s',kind:'solution',name:'work.png',data:'data:image/png;base64,AQ=='};
const options={query:'',sort:'recent' as const,completion:'all' as const};
function notebook(){return {...emptyNotebook(),folders:[...emptyNotebook().folders,{id:'a',name:'Algebra'},{id:'b',name:'Revision'}]};}
function page(){return {...newExercise(),title:'Shared page',statement:'x=1',attachments:[problem,solution],notes:'My work',knowledge:{text:'Keep theorem',source:'ON_DEVICE'},hints:[{text:'Keep hint',source:'ON_DEVICE'}]};}
describe('one exercise, multiple folder memberships',()=>{
  it('includes legacy pages in history and their original folder without a destructive migration',()=>{
    const old={...page(),folderId:'a'};expect(exerciseFolderIds(old)).toEqual(['a']);
    expect(findExercises([old],{...options,folder:'general'})).toEqual([old]);expect(findExercises([old],{...options,folder:'a'})).toEqual([old]);expect(old.folderIds).toBeUndefined();
  });
  it('stores a single exercise while adding it to multiple folders and deduplicating memberships',()=>{
    const original=page();let book=putExercise(notebook(),{...original,folderIds:['a','b','a','general']});
    expect(book.exercises).toHaveLength(1);expect(book.exercises[0].folderIds).toEqual(['a','b']);
    for(const folder of ['general','a','b'])expect(findExercises(book.exercises,{...options,folder}).map(e=>e.id)).toEqual([original.id]);
    book=putExercise(book,{...book.exercises[0],notes:'Changed once'});expect(book.exercises).toHaveLength(1);
    expect(findExercises(book.exercises,{...options,folder:'b'})[0].notes).toBe('Changed once');
  });
  it('keeps history when no custom folder is selected and rejects nonexistent memberships',()=>{
    const book=putExercise(notebook(),{...page(),folderIds:[]});expect(book.exercises[0].folderId).toBe('general');
    expect(findExercises(book.exercises,{...options,folder:'general'})).toHaveLength(1);
    expect(()=>putExercise(book,{...page(),folderIds:['missing']})).toThrow('valid folders');
  });
  it('removes only the deleted folder membership while preserving other folders and page content',()=>{
    const book=putExercise(notebook(),{...page(),folderIds:['a','b']});const next=removeFolder(book,'a');
    expect(next.exercises[0]).toEqual({...book.exercises[0],folderIds:['b'],folderId:'b'});expect(book.exercises[0].folderIds).toEqual(['a','b']);
    expect(findExercises(next.exercises,{...options,folder:'general'})).toHaveLength(1);
  });
});
describe('narrow library preview edits',()=>{
  it('patches notes, solution images, image names and memberships without rewriting math or AI content',()=>{
    const book=putExercise(notebook(),page()),original=book.exercises[0];
    const next=putExercisePreview(book,original.id,{notes:'Revised',attachments:[{...problem,name:'Given triangle'}, {...solution,id:'new',name:'New solution'}],folderIds:['a','b']});
    const {notes,attachments,folderIds,folderId,updatedAt,...rest}=next.exercises[0];
    const {notes:_,attachments:__,folderIds:___,folderId:____,updatedAt:_____,...before}=original;
    expect(rest).toEqual(before);expect(notes).toBe('Revised');expect(attachments[0].name).toBe('Given triangle');expect(folderIds).toEqual(['a','b']);expect(original.attachments[0].name).toBe('diagram.png');
  });
  it('does not permit a preview to replace or remove a problem illustration',()=>{
    const book=putExercise(notebook(),page()),id=book.exercises[0].id;
    for(const attachments of [[solution],[{...problem,data:'data:image/png;base64,Ag=='},solution]])expect(()=>putExercisePreview(book,id,{notes:'Keep',attachments})).toThrow('workspace');
    expect(book.exercises[0].notes).toBe('My work');
  });
  it('validates image limits and names without mutating the saved record',()=>{
    const book=putExercise(notebook(),page()),id=book.exercises[0].id;
    expect(()=>putExercisePreview(book,id,{notes:'Keep',attachments:[{...problem,name:''},solution]})).toThrow('names');
    expect(()=>putExercisePreview(book,id,{notes:'Keep',attachments:[problem,...Array.from({length:4},(_,index)=>({...solution,id:`s${index}`}))]})).toThrow('up to 4');
    expect(book.exercises[0].attachments).toHaveLength(2);
  });
});
