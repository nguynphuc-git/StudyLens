import { get, set } from 'idb-keyval';
import {defaultFolderColor,isFolderColor,type FolderColor} from './folder-colors';
import type { GeometryDiagram } from './geometry-diagram';
import type { ProofDiagram } from './geometry-proof';
export interface Answer { text: string; source: string }
export interface Message { role: 'user' | 'assistant'; text: string; source?: string; format?:'latex' }
export interface Attachment { id: string; name: string; data: string; kind: 'problem' | 'solution'; useForAI?:boolean }
export interface Exercise {
  proofDiagram?: ProofDiagram;
  id: string; title: string; folderId: string; folderIds?:string[]; subject?: 'calculus' | 'discrete' | 'algorithms';
  statement: string; statementFormat?: 'latex'; confirmed: boolean; knowledge?: Answer; hints: Answer[];
  notes: string; notesFormat?: 'latex'; messages: Message[]; attachments: Attachment[]; geometryDiagram?: GeometryDiagram; completed: boolean; updatedAt: string;
}
export interface Notebook { folders: { id: string; name: string; color?:FolderColor }[]; exercises: Exercise[] }
export function sameAttachments(a:Attachment[],b:Attachment[]):boolean{return a.length===b.length&&a.every((image,index)=>{const other=b[index];return image.id===other.id&&image.name===other.name&&image.data===other.data&&image.kind===other.kind&&image.useForAI===other.useForAI;});}
export function notebookKey(project: string, uid: string) {
  if (!project || !uid) throw new Error('Sign in to open your notebook.');
  return `studylens.notebook.v1:${JSON.stringify([project, uid])}`;
}
export function emptyNotebook(): Notebook { return { folders: [{ id: 'general', name: 'My exercises' }], exercises: [] }; }
export function newExercise(): Exercise {
  return { id: crypto.randomUUID(), title: '', folderId: 'general', statement: '', statementFormat: 'latex', confirmed: false,
    hints: [], notes: '', messages: [], attachments: [], completed: false, updatedAt: new Date().toISOString() };
}
export async function loadNotebook(key: string): Promise<Notebook> {
  const book = (await get<Notebook>(key)) ?? emptyNotebook();
  // Translate the previous built-in folder label, preserving user-created names.
  return { ...book, folders: book.folders.map(folder => folder.id === 'general' && folder.name === 'Bài tập của tôi' ? { ...folder, name: 'My exercises' } : folder) };
}
export async function saveNotebook(key: string, value: Notebook) { await set(key, value); }
/** general is an implicit history view; legacy single-folder records remain readable. */
export function exerciseFolderIds(exercise:Pick<Exercise,'folderId'|'folderIds'>):string[]{
  return [...new Set(exercise.folderIds??[exercise.folderId])].filter(id=>id!=='general');
}
export function inExerciseFolder(exercise:Exercise,id:string):boolean{return id==='general'||exerciseFolderIds(exercise).includes(id);}
export function withExerciseFolders(book:Notebook,exercise:Exercise,ids:string[]):Exercise{
  const folderIds=[...new Set(ids)].filter(id=>id!=='general');
  if(folderIds.some(id=>!book.folders.some(folder=>folder.id===id)))throw new Error('Select valid folders.');
  return {...exercise,folderIds,folderId:folderIds[0]??'general'};
}
export function putExercise(book: Notebook, exercise: Exercise): Notebook {
  if (!exercise.title.trim() || !exercise.statement.trim()) throw new Error('Enter an exercise name and problem.');
  const membership=withExerciseFolders(book,exercise,exerciseFolderIds(exercise));
  const snapshot = structuredClone({ ...membership, title: exercise.title.trim(), updatedAt: new Date().toISOString() });
  return { ...book, exercises: [snapshot, ...book.exercises.filter(e => e.id !== exercise.id)] };
}
/** Completion is one shared saved field, independent of an open workspace draft. */
export function putExerciseCompletion(book:Notebook,id:string,completed:boolean):Notebook{
  if(!book.exercises.some(exercise=>exercise.id===id))throw new Error('Exercise not found.');
  return {...book,exercises:book.exercises.map(exercise=>exercise.id===id?{...exercise,completed,updatedAt:new Date().toISOString()}:exercise)};
}
/** Preview edits only patch fields exposed in the library, never AI/problem content. */
export function putExercisePreview(book:Notebook,id:string,changes:{notes:string;notesFormat?:'latex';attachments?:Attachment[];folderIds?:string[]}):Notebook{
  let next=putExerciseNotes(book,id,changes.notes,changes.notesFormat);
  const attachmentIds=new Set<string>();
  if(changes.attachments){
    if(changes.attachments.length>4)throw new Error('Each exercise supports up to 4 images.');
    const original=book.exercises.find(exercise=>exercise.id===id)!;
    for(const image of changes.attachments){const unchangedName=original.attachments.some(saved=>saved.id===image.id&&saved.name===image.name);if((!unchangedName&&(!image.name.trim()||image.name.length>120))||attachmentIds.has(image.id))throw new Error('Use unique images and names of 1–120 characters.');attachmentIds.add(image.id);}
    // Problem illustrations can be renamed, but not replaced or removed in a preview.
    const before=original.attachments.filter(image=>image.kind==='problem'),after=changes.attachments.filter(image=>image.kind==='problem');
    if(JSON.stringify(before.map(({name,...image})=>image))!==JSON.stringify(after.map(({name,...image})=>image)))throw new Error('Open in workspace to change problem illustrations.');
  }
  next={...next,exercises:next.exercises.map(exercise=>exercise.id===id?{
    ...(changes.folderIds?withExerciseFolders(next,exercise,changes.folderIds):exercise),
    ...(changes.attachments?{attachments:structuredClone(changes.attachments)}:{})
  }:exercise)};
  return next;
}
/** A library note edit must never overwrite other saved fields with a workspace draft. */
export function putExerciseNotes(book: Notebook, id: string, notes: string, notesFormat?:'latex'): Notebook {
  if (notes.length > 30000) throw new Error('Notes can contain up to 30,000 characters.');
  if (!book.exercises.some(exercise => exercise.id === id)) throw new Error('Exercise not found.');
  return { ...book, exercises: book.exercises.map(exercise => exercise.id === id
    ? { ...exercise, notes, notesFormat, updatedAt: new Date().toISOString() } : exercise) };
}
export async function readAttachment(file: File, kind: Attachment['kind']): Promise<Attachment> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Each image must be smaller than 3 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(file);
  });
  return { id: crypto.randomUUID(), name: file.name.slice(0,120), data, kind };
}

export function addFolder(book: Notebook, name: string,color:FolderColor=defaultFolderColor): Notebook {
  const label = name.trim();
  if (!label || label.length > 80) throw new Error('Enter a folder name of 1–80 characters.');
  if (book.folders.some(folder => folder.name.toLocaleLowerCase() === label.toLocaleLowerCase())) throw new Error('A folder with this name already exists.');
  if(!isFolderColor(color))throw new Error('Choose a pastel folder color.');
  return { ...book, folders: [...book.folders, { id: crypto.randomUUID(), name: label,color }] };
}
export function recolorFolder(book:Notebook,id:string,color:FolderColor):Notebook{
  if(!isFolderColor(color))throw new Error('Choose a pastel folder color.');
  if(!book.folders.some(folder=>folder.id===id))throw new Error('Folder not found.');
  return {...book,folders:book.folders.map(folder=>folder.id===id?{...folder,color}:folder)};
}
/** Deleting a folder removes only its memberships; history and other folders keep pages. */
export function removeFolder(book: Notebook, id: string): Notebook {
  if (id === 'general') throw new Error('The default folder cannot be deleted.');
  if (!book.folders.some(folder => folder.id === id)) throw new Error('Folder not found.');
  return {
    folders: book.folders.filter(folder => folder.id !== id),
    exercises: book.exercises.map(exercise => exerciseFolderIds(exercise).includes(id) ? withExerciseFolders(book,exercise,exerciseFolderIds(exercise).filter(folder=>folder!==id)) : exercise)
  };
}
