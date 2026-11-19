import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({values:new Map<string,unknown>(),write:vi.fn()}));
vi.mock('idb-keyval',()=>({
  get:async(key:string)=>structuredClone(mock.values.get(key)),
  set:async(key:string,value:unknown)=>{await mock.write(key,value);mock.values.set(key,structuredClone(value));},
  del:async(key:string)=>{mock.values.delete(key);}
}));
import {clearWorkspaceDraft,loadWorkspaceDraft,saveWorkspaceDraft,workspaceDraftKey} from '../src/workspace-draft';
import {newExercise,notebookKey} from '../src/notebook';
beforeEach(()=>{mock.values.clear();mock.write.mockReset();});
describe('account-scoped recoverable workspace copies',()=>{
  it('stores an immutable draft separately from saved pages and other accounts',async()=>{
    const alice=notebookKey('demo','alice'),bob=notebookKey('demo','bob');
    mock.values.set(alice,{saved:'original'});
    const draft={...newExercise(),statement:'x=1',notes:'before'};
    const pending=saveWorkspaceDraft(alice,draft);draft.notes='after';await pending;
    expect((await loadWorkspaceDraft(alice))?.exercise.notes).toBe('before');
    expect(await loadWorkspaceDraft(bob)).toBeNull();
    expect(mock.values.get(alice)).toEqual({saved:'original'});
  });
  it('serializes removal after an in-flight write so discarded drafts cannot reappear',async()=>{
    let finish!:()=>void;mock.write.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
    const write=saveWorkspaceDraft('slow',{...newExercise(),statement:'old draft'});
    await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
    const discard=clearWorkspaceDraft('slow');finish();await Promise.all([write,discard]);
    expect(await loadWorkspaceDraft('slow')).toBeNull();
  });
  it('allows retries after storage failure and ignores malformed records',async()=>{
    mock.write.mockRejectedValueOnce(new Error('full'));
    await expect(saveWorkspaceDraft('retry',newExercise())).rejects.toThrow('full');
    await saveWorkspaceDraft('retry',{...newExercise(),statement:'retry'});
    expect((await loadWorkspaceDraft('retry'))?.exercise.statement).toBe('retry');
    mock.values.set(workspaceDraftKey('invalid'),{version:2});
    expect(await loadWorkspaceDraft('invalid')).toBeNull();
  });
});
