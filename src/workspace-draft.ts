import { get, set, del } from 'idb-keyval';
import type { Exercise } from './notebook';
export interface WorkspaceDraft { version:1; exercise:Exercise; savedAt:string }
const queues = new Map<string,Promise<unknown>>();
function queued(key:string, action:()=>Promise<unknown>):Promise<void> {
  const next=(queues.get(key)??Promise.resolve()).catch(()=>{}).then(action);
  queues.set(key,next);
  return next.then(()=>{},error=>{throw error;}).finally(()=>{if(queues.get(key)===next)queues.delete(key);});
}
export function workspaceDraftKey(notebook:string) { return `${notebook}:workspace-draft`; }
export async function loadWorkspaceDraft(key:string):Promise<WorkspaceDraft|null> {
  await queues.get(key)?.catch(()=>{});
  const value=await get<WorkspaceDraft>(workspaceDraftKey(key));
  return value?.version===1 && typeof value.exercise?.id==='string' && typeof value.exercise.statement==='string' ? value : null;
}
export function saveWorkspaceDraft(key:string, exercise:Exercise):Promise<void> {
  const record:WorkspaceDraft={version:1,exercise:structuredClone(exercise),savedAt:new Date().toISOString()};
  return queued(key,()=>set(workspaceDraftKey(key),record));
}
/** Serialize with in-flight writes so a slow autosave cannot resurrect a discarded draft. */
export function clearWorkspaceDraft(key:string):Promise<void> { return queued(key,()=>del(workspaceDraftKey(key))); }
