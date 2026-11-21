import { useEffect, useRef } from 'react';
import { lockBodyScroll } from '../scroll-lock';
import { AttachmentGallery } from './AttachmentGallery';
import {sameAttachments,exerciseFolderIds,type Attachment,type Exercise,type Notebook} from '../notebook';
import {FolderPicker} from './FolderPicker';
import { statementLatex } from '../math-input';
import { MathInput } from './MathInput';
import { MarkdownView } from './MarkdownView';
import { NotesEditor } from './NotesEditor';
import { sourceLabel } from '../ui-labels';
import {ProofDiagramView} from './ProofDiagramView';

interface Props {
  exercise: Exercise; folderName: string; attachments:Attachment[]; folders:Notebook['folders']; folderIds:string[]; onAttachments:(images:Attachment[])=>void; onAttach:(file:File)=>void; onFolders:(ids:string[])=>void; notes: string; notesFormat?:'latex'; saving: boolean; suspended: boolean; error: string;
  onImage:(image:Attachment)=>void; onNotes: (notes: string) => void; onSaveNotes: () => void; onClose: () => void; onOpenWorkspace: () => void;
}
export function ExercisePreview({ exercise, folderName, attachments,folders,folderIds,onAttachments,onAttach,onFolders,notes, notesFormat, saving, suspended, error, onImage,onNotes, onSaveNotes, onClose, onOpenWorkspace }: Props) {
  const dialog = useRef<HTMLElement>(null); const closeButton = useRef<HTMLButtonElement>(null);
  const callbacks = useRef({ onClose, saving, suspended }); callbacks.current = { onClose, saving, suspended };
  useEffect(() => {
    const previous = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    const release=lockBodyScroll(); closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (callbacks.current.suspended) return;
      if (event.key === 'Escape' && !callbacks.current.saving) { event.preventDefault(); callbacks.current.onClose(); }
      if (event.key !== 'Tab') return;
      const nodes = [...dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]') ?? []];
      const first = nodes[0], last = nodes.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.document.addEventListener('keydown', handleKey);
    return () => { window.document.removeEventListener('keydown', handleKey); release(); previous?.focus(); };
  }, []);
  const noteDirty = notes !== exercise.notes || notesFormat !== exercise.notesFormat || !sameAttachments(attachments,exercise.attachments) || [...folderIds].sort().join('|')!==exerciseFolderIds(exercise).sort().join('|');
  const rename=(id:string,name:string)=>onAttachments(attachments.map(image=>image.id===id?{...image,name}:image));
  return <div className="modal-backdrop exercise-backdrop" inert={suspended} onClick={event => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section ref={dialog} className="paper exercise-preview" role="dialog" aria-modal="true" aria-labelledby="exercise-preview-title">
      <header className="exercise-preview-header"><div><p className="eyebrow">YOUR SAVED PAGE · {folderName}</p><h2 id="exercise-preview-title">{exercise.title}</h2><p className="subtle">{exercise.completed ? 'Completed' : 'In progress'} · {new Date(exercise.updatedAt).toLocaleString('en-GB')}</p></div><button ref={closeButton} disabled={saving} onClick={onClose} aria-label="Close exercise preview">✕</button></header>
      <div className="exercise-preview-body" tabIndex={0} aria-label="Saved exercise contents">
        {exercise.proofDiagram&&<ProofDiagramView diagram={exercise.proofDiagram}/>}
        <div className="preview-columns">
          <section className="preview-section"><h3>Problem</h3><MathInput value={statementLatex(exercise.statement, exercise.statementFormat)} readOnly label="Saved problem"/><AttachmentGallery images={attachments.filter(image=>image.kind==='problem')} onOpen={onImage} onRename={rename} disabled={saving}/></section>
          <section className="preview-section"><h3>What you need</h3>{exercise.knowledge ? <><MarkdownView value={exercise.knowledge.text}/><small className="subtle">{sourceLabel(exercise.knowledge.source)}</small></> : <p className="subtle">No knowledge saved yet.</p>}</section>
          <section className="preview-section"><h3>Opened hints</h3>{exercise.hints.length ? exercise.hints.map((hint, index) => <details key={index} open><summary>Level {index + 1} · {['A starting point', 'The method', 'Full solution'][index]}</summary><MarkdownView value={hint.text}/><small className="subtle">{sourceLabel(hint.source)}</small></details>) : <p className="subtle">No hints opened yet.</p>}</section>
        </div>
        <section className="preview-section preview-notes"><div className="row"><h3>Your working notes</h3><span className="source-label">Editable here</span></div><NotesEditor label="Saved exercise notes" value={notes} format={notesFormat} disabled={saving} onChange={onNotes}/>
          <label className="attachment-button">＋ Attach my solution<input aria-label="Attach a solution in preview" type="file" accept="image/png,image/jpeg,image/webp" disabled={saving||attachments.length>=4} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)onAttach(file);}}/></label>
          <AttachmentGallery images={attachments.filter(image=>image.kind==='solution')} onOpen={onImage} onRename={rename} onRemove={id=>onAttachments(attachments.filter(image=>image.id!==id))} disabled={saving}/>
          <small className="subtle" role="status">{noteDirty ? 'Unsaved changes' : 'Changes saved on this device'}</small>
        </section>
        <section className="preview-section"><h3>Folders</h3><FolderPicker folders={folders} selected={folderIds} disabled={saving} onChange={onFolders}/></section>
        <section className="preview-section"><h3>Conversation</h3>{exercise.messages.map((message, index) => <div className={`message ${message.role}`} key={index}><small>{message.role === 'user' ? 'You' : `Mathfolio · ${sourceLabel(message.source)}`}</small>{message.role==='user'&&message.format==='latex'?<MathInput value={message.text} readOnly compact label="Saved question"/>:<MarkdownView value={message.text}/>}</div>)}{!exercise.messages.length && <p className="subtle">No conversation saved yet.</p>}</section>
        {error && <p className="notice error" role="alert">{error}</p>}
      </div>
      <footer className="exercise-preview-footer"><p className="subtle">Edit notes, solution images, image names and folders here. Save changes before closing. Open in workspace to change the problem or AI content.</p><div className="row"><button disabled={saving || !noteDirty} className="primary" onClick={onSaveNotes}>{saving ? 'Saving…' : 'Save changes'}</button><button disabled={saving} onClick={onClose}>Close</button><button className="primary" disabled={saving} onClick={onOpenWorkspace}>Open in workspace ↗</button></div></footer>
    </section>
  </div>;
}
