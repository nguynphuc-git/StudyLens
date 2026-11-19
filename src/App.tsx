import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { getFirebaseApp } from './firebase';
import { friendlyError, generateProofDiagram, notebookAI, recognizeImageWithCloud, recommendsCloudForProblem, type NotebookRequest } from './ai';
import { MarkdownView } from './components/MarkdownView';
import { PdfQuestionPicker } from './components/PdfQuestionPicker';
import { addFolder, recolorFolder, removeFolder, emptyNotebook, loadNotebook, newExercise, notebookKey, putExercise, putExerciseCompletion, putExercisePreview, exerciseFolderIds, inExerciseFolder, withExerciseFolders, sameAttachments, readAttachment, saveNotebook, type Exercise, type Notebook, type Attachment } from './notebook';
import { ConfirmDialog, type Confirmation } from './components/ConfirmDialog';
import { ImageViewer } from './components/ImageViewer';
import { AttachmentGallery } from './components/AttachmentGallery';
import { ExercisePreview } from './components/ExercisePreview';
import {FolderPicker} from './components/FolderPicker';
import {FolderColorPicker} from './components/FolderColorPicker';
import {defaultFolderColor,folderColor,type FolderColor} from './folder-colors';
import { NotesEditor } from './components/NotesEditor';
import { MathInput, type MathInputHandle } from './components/MathInput';
import { statementLatex,hasEditorContent } from './math-input';
import {MathKeyboardProvider} from './components/MathKeyboardContext';
import {selectedIllustrations,sameIllustrations} from './problem-vision';
import { MathKeyboard } from './components/MathKeyboard';
import { ImageProblemReview } from './components/ImageProblemReview';
import { prepareProblemImage, type ProblemImage } from './image-import';
import { clearWorkspaceDraft, loadWorkspaceDraft, saveWorkspaceDraft, type WorkspaceDraft } from './workspace-draft';
import { findExercises, type ExerciseSort } from './notebook-library';
import { sourceLabel } from './ui-labels';
import type { PdfProgress, PdfQuestion } from './pdf';
import './notebook.css';
import './appearance.css';
import './folder-colors.css';
import {useAppearance} from './appearance';
import {AppearanceSettings} from './components/AppearanceSettings';
import {MenuDisclosure} from './components/MenuDisclosure';
import {Chevron} from './components/Chevron';
import {SelectMenu} from './components/SelectMenu';
import {LoginBackdrop} from './components/LoginBackdrop';
import './workspace-ui.css';
import './pdf-picker.css';
import './image-review.css';
import {GeometryDiagramEditor} from './components/GeometryDiagramEditor';
import {LatexMessage} from './components/LatexMessage';
import { UsageGuide } from './components/UsageGuide';
import type { ResponseStyle } from './local-tutor';
import {proofTutorContext} from './geometry-proof';
import {ProofDiagramView} from './components/ProofDiagramView';
import {ProblemSourceInput} from './components/ProblemSourceInput';

const labels = ['A starting point', 'The method', 'Full solution'];
export default function App() {
  const appearance=useAppearance();
  const [diagramBusy,setDiagramBusy]=useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false); const [tab, setTab] = useState<'solve' | 'library' | 'guide' | 'account'>('solve');
  const [book, setBook] = useState<Notebook>(emptyNotebook); const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Exercise>(newExercise); const [dirty, setDirty] = useState(false);
  const [folder, setFolder] = useState<string | null>(null); const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState(''); const [folderIds, setFolderIds] = useState<string[]>([]); const [newFolder, setNewFolder] = useState('');
  const [folderDialog, setFolderDialog] = useState(false); const [folderName, setFolderName] = useState('');
  const [creationColor,setCreationColor]=useState<FolderColor>(defaultFolderColor);const [saveFolderColor,setSaveFolderColor]=useState<FolderColor>(defaultFolderColor);
  const [recovery,setRecovery]=useState<WorkspaceDraft|null>(null);
  const [draftSave,setDraftSave]=useState<'idle'|'saving'|'saved'|'error'>('idle');const [draftSavedAt,setDraftSavedAt]=useState('');
  const draftTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [libraryView,setLibraryView]=useState<'folders'|'exercises'>('folders');
  const [libraryQuery,setLibraryQuery]=useState('');const [librarySort,setLibrarySort]=useState<ExerciseSort>('recent');const [libraryCompletion,setLibraryCompletion]=useState<'all'|'progress'|'completed'>('all');
  const [mathSize,setMathSize]=useState(17);const [elapsed,setElapsed]=useState(0);const runStarted=useRef(0);
  const [imageProblem,setImageProblem]=useState<ProblemImage|null>(null);const [imagePreparing,setImagePreparing]=useState(false);const [importError,setImportError]=useState('');
  const importOperation=useRef<AbortController|null>(null);
  const [pdfQuestions, setPdfQuestions] = useState<PdfQuestion[] | null>(null);
  const [pdfBusy,setPdfBusy]=useState(false);
  const [pdfProgress,setPdfProgress]=useState<PdfProgress|null>(null);
  const [pdfFile,setPdfFile]=useState<File|null>(null);
  const [pdfPageCount,setPdfPageCount]=useState(0);
  const [collapsedHints, setCollapsedHints] = useState<number[]>([]);
  const [preview, setPreview] = useState<{ id: string; notes: string; notesFormat?:'latex'; attachments:Attachment[]; folderIds:string[] } | null>(null);
  const [viewingImage,setViewingImage]=useState<Attachment|null>(null);
  const [previewError, setPreviewError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationResult = useRef<((accepted: boolean) => void) | null>(null);
  const [saving, setSaving] = useState(false); const [busy, setBusy] = useState<NotebookRequest['purpose'] | null>(null);
  const [partial, setPartial] = useState(''); const [question, setQuestion] = useState('');
  const [focusMode,setFocusMode]=useState(false);
  const [responseStyle,setResponseStyle]=useState<ResponseStyle>('auto');
  const [knowledgeRoute,setKnowledgeRoute]=useState<'local'|'cloud'>('local');
  const [firstHintRoute,setFirstHintRoute]=useState<'local'|'cloud'>('local');
  const [cloudAllowed, setCloudAllowed] = useState(false); const [chatRoute, setChatRoute] = useState<'local' | 'cloud'>('local');
  const [online, setOnline] = useState(navigator.onLine); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const epoch = useRef(0); const key = useRef(''); const input = useRef<MathInputHandle>(null);const chatInput=useRef<MathInputHandle>(null);
  const illustrations=selectedIllustrations(draft.attachments);

  const activeAI = useRef<{ controller: AbortController; status: string; error: string } | null>(null);
  const blocked = diagramBusy || !!busy || saving || pdfBusy || imagePreparing || !!recovery;
  useEffect(()=>{if(!busy)return;const tick=()=>setElapsed(Math.floor((performance.now()-runStarted.current)/1000));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[busy]);
  const problemPanel = useRef<HTMLElement>(null);
  const [problemHeight, setProblemHeight] = useState(520);
  useLayoutEffect(() => {
    if (!problemPanel.current) return;
    const observer = new ResizeObserver(entries => setProblemHeight(entries[0].target.getBoundingClientRect().height));
    observer.observe(problemPanel.current);
    return () => observer.disconnect();
  }, [ready, user?.uid, tab]);

  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on); window.addEventListener('offline', on);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); };
  }, []);
  useEffect(() => { if (!online) setChatRoute('local'); }, [online]);
  useEffect(() => {
    if (!dirty || draftSave==='saved') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty,draftSave]);
  useEffect(()=>{
    if(!ready||!dirty||!key.current||recovery||saving)return;
    const storageKey=key.current,version=epoch.current;
    setDraftSave('saving');let current=true;
    const timer=setTimeout(()=>{
      draftTimer.current=null;
      void saveWorkspaceDraft(storageKey,draft).then(()=>{if(current&&epoch.current===version){setDraftSave('saved');setDraftSavedAt(new Date().toISOString());}})
        .catch(()=>{if(current&&epoch.current===version)setDraftSave('error');});
    },750);
    draftTimer.current=timer;
    return()=>{current=false;clearTimeout(timer);if(draftTimer.current===timer)draftTimer.current=null;};
  },[draft,dirty,ready,recovery,saving]);
  useEffect(() => {
    let active = true;
    try {
      const auth = getAuth(getFirebaseApp());
      const unsubscribe = onAuthStateChanged(auth, next => {
        activeAI.current?.controller.abort(); activeAI.current = null;
        importOperation.current?.abort();importOperation.current=null;
        const version = ++epoch.current;
        confirmationResult.current?.(false); confirmationResult.current = null; setConfirmation(null);
        key.current = ''; setUser(next); setReady(false); setBook(emptyNotebook()); setDraft(newExercise()); setDirty(false);setRecovery(null);setDraftSave('idle');setDraftSavedAt('');setImageProblem(null);setImagePreparing(false);setPdfBusy(false);closePdfPicker();setImportError('');setLibraryQuery('');
        setPartial(''); setBusy(null);setDiagramBusy(false); setSaving(false); setSaveOpen(false); setFolderDialog(false); setPreview(null);setViewingImage(null); setPreviewError(''); setCollapsedHints([]); setError(''); setStatus(''); setQuestion(''); setFolder(null); setCloudAllowed(false); setChatRoute('local');setKnowledgeRoute('local');setFirstHintRoute('local');
        if (!next) return;
        const nextKey = notebookKey(auth.app.options.projectId!, next.uid); key.current = nextKey;
        void Promise.all([loadNotebook(nextKey),loadWorkspaceDraft(nextKey).catch(()=>null)]).then(([value,unfinished]) => {
          if (active && epoch.current === version) { setBook(value);setRecovery(unfinished); setReady(true); }
        }).catch(() => { if (active && epoch.current === version) setError('Could not open local data. Check browser storage permissions and reload.'); });
      });
      return () => { active = false; epoch.current++; activeAI.current?.controller.abort(); activeAI.current = null;importOperation.current?.abort();importOperation.current=null; confirmationResult.current?.(false); confirmationResult.current = null; unsubscribe(); };
    } catch (e) { setError(friendlyError(e)); }
    return () => { active = false; epoch.current++; };
  }, []);

  useEffect(() => {
    if (!saveOpen && !folderDialog) return;
    const previous = documentActiveElement();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) { event.preventDefault(); setSaveOpen(false); setFolderDialog(false); }
      if (event.key !== 'Tab') return;
      const nodes = [...window.document.querySelectorAll<HTMLElement>('[role="dialog"] button:not(:disabled), [role="dialog"] input:not(:disabled), [role="dialog"] select:not(:disabled), [role="dialog"] textarea:not(:disabled)')];
      const first = nodes[0], last = nodes.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.document.addEventListener('keydown', handleKey);
    return () => { window.document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [saveOpen, folderDialog, saving]);
  function documentActiveElement() { return window.document.activeElement instanceof HTMLElement ? window.document.activeElement : undefined; }

  function edit(update: Partial<Exercise>) { setDraft(value => ({ ...value, ...(update.statement!==undefined&&update.statement!==value.statement?{proofDiagram:undefined,geometryDiagram:undefined}:{}), ...update })); setDirty(true);setDraftSave('idle'); }
  async function createGeometryDiagram() {
    if(blocked||activeAI.current||!ready)return;
    const version=epoch.current,id=draft.id;
    const hasGuidance=!!(draft.knowledge||draft.hints.length||draft.messages.length);
    const operation={controller:new AbortController(),status,error};activeAI.current=operation;
    const current=()=>activeAI.current===operation&&epoch.current===version&&!operation.controller.signal.aborted;
    setDiagramBusy(true);setError('');setStatus(hasGuidance
      ?'Rebuilding diagram… Existing guidance will be replaced only if the new diagram succeeds.'
      :'Reading hypotheses and constructing the diagram…');
    try{
      const diagram=await generateProofDiagram(draft.statement,cloudAllowed&&online?'cloud':'local',cloudAllowed&&online,illustrations,operation.controller.signal);
      if(!current())return;
      setDraft(value=>value.id===id?{...value,proofDiagram:diagram,geometryDiagram:undefined,confirmed:false,knowledge:undefined,hints:[],messages:[]}:value);
      setCollapsedHints([]);setDirty(true);setDraftSave('idle');
      setStatus('Diagram ready. Review Given and To prove, then analyze for hints. Auxiliary constructions are hidden until you request them.');
    }catch(e){if(current()){setError(friendlyError(e));setStatus('Diagram not changed. Clarify the problem or try again.');}}
    finally{if(current()){activeAI.current=null;setDiagramBusy(false);}}
  }
  function resumeDraft(){if(!recovery)return;setDraft(structuredClone(recovery.exercise));setDirty(true);setDraftSave('saved');setDraftSavedAt(recovery.savedAt);setRecovery(null);setTab('solve');setStatus('Draft restored. Save exercise when you want to update your library.');}
  async function discardRecovery(){const version=epoch.current;setSaving(true);try{await clearWorkspaceDraft(key.current);if(version===epoch.current){setRecovery(null);setDraftSave('idle');}}catch{setError('Could not remove the draft. Try again.');}finally{if(version===epoch.current)setSaving(false);}}
  function cancelImport(){importOperation.current?.abort();importOperation.current=null;setPdfBusy(false);setPdfProgress(null);setImagePreparing(false);}
  async function loadImage(file?:File){
    if(!file||blocked)return;cancelImport();const controller=new AbortController();importOperation.current=controller;const version=epoch.current;setImagePreparing(true);setError('');setImportError('');
    try{const image=await prepareProblemImage(file,controller.signal);if(importOperation.current===controller&&version===epoch.current)setImageProblem(image);}
    catch(reason){if(importOperation.current===controller)setError(friendlyError(reason));}
    finally{if(importOperation.current===controller){importOperation.current=null;setImagePreparing(false);}}
  }
  async function applyImageText(statement:string,keep:boolean){
    if(!imageProblem||!hasEditorContent(statement))return;const version=epoch.current;
    if(statement.length>6000){setImportError('Select a shorter problem to stay within 6,000 characters.');return;}
    const hasContext=!!(draft.confirmed||draft.knowledge||draft.hints.length||draft.messages.length);
    if(hasContext&&!await confirmChange({title:'Use this image problem?',description:'This replaces the problem and clears its essentials, hints and chat. Your notes and saved images stay.',action:'Use this problem'}))return;
    if(version!==epoch.current)return;
    const attachment:Attachment={id:crypto.randomUUID(),name:imageProblem.name,data:imageProblem.data,kind:'problem'};
    edit({statement,statementFormat:'latex',confirmed:false,knowledge:undefined,hints:[],messages:[],geometryDiagram:undefined,proofDiagram:undefined,attachments:keep&&draft.attachments.length<4?[...draft.attachments,attachment]:draft.attachments});
    setCollapsedHints([]);setImageProblem(null);setImportError('');setStatus('Image problem added. Check its formulas before analyzing.');
  }
  async function loadPdf(file?:File){
    if(!file||blocked)return;
    cancelImport();const controller=new AbortController();importOperation.current=controller;const version=epoch.current;
    setPdfBusy(true);setPdfProgress(null);setError('');setStatus('');let pages=0;
    try{
      const {extractPdfQuestions}=await import('./pdf');controller.signal.throwIfAborted();
      const questions=await extractPdfQuestions(file,value=>{pages=Math.max(pages,value.total);if(importOperation.current===controller)setPdfProgress(value);},controller.signal);
      if(importOperation.current!==controller||epoch.current!==version)return;
      setPdfFile(file);setPdfPageCount(Math.max(pages,1,...questions.map(question=>question.page)));setPdfQuestions(questions);
    }catch(reason){if(importOperation.current===controller)setError(friendlyError(reason));}
    finally{if(importOperation.current===controller){importOperation.current=null;setPdfBusy(false);setPdfProgress(null);}}
  }
  function closePdfPicker(){setPdfQuestions(null);setPdfFile(null);setPdfPageCount(0);}
  async function readPdfPageWithCloud(image:string,page:number,hasEdits:boolean,signal:AbortSignal){
    signal.throwIfAborted();const version=epoch.current;
    if(!navigator.onLine)throw new Error('Cloud page reading needs an internet connection.');
    const accepted=await confirmChange({
      title:cloudAllowed?'Read this page with Cloud AI?':'Allow Cloud AI and read this page?',
      description:`${cloudAllowed?'Send only':'Enable Cloud AI for future actions you choose to run this session. For this transcription, send only'} PDF page ${page} to Google AI through Firebase for text and math transcription. No notes, chat or other attachments are sent. The result replaces extracted questions on this page; other pages are kept.${hasEdits?' Your manual edits on this page will be replaced.':''} Review the result before using it.`,
      action:cloudAllowed?'Send image to Cloud AI':'Allow Cloud AI and read page',cancel:'Not now'
    });
    if(!accepted||version!==epoch.current||signal.aborted)return null;
    if(!navigator.onLine)throw new Error('Cloud page reading needs an internet connection.');
    setCloudAllowed(true);
    return recognizeImageWithCloud(image,signal);
  }
  async function readImageWithCloud(image:string,signal:AbortSignal){
    signal.throwIfAborted();const version=epoch.current;
    if(!navigator.onLine)throw new Error('Cloud image reading needs an internet connection.');
    const accepted=await confirmChange({
      title:cloudAllowed?'Read this image with Cloud AI?':'Allow Cloud AI and read this image?',
      description:`${cloudAllowed?'Send only':'Enable Cloud AI for future actions you choose to run this session. For this transcription, send only'} this source image to Google AI through Firebase for text and math transcription. No notes, chat or other attachments are sent. This replaces the current image review. Check the result before using it.`,
      action:cloudAllowed?'Send image to Cloud AI':'Allow Cloud AI and read image',cancel:'Not now'
    });
    if(!accepted||version!==epoch.current||signal.aborted)return null;
    if(!navigator.onLine)throw new Error('Cloud image reading needs an internet connection.');
    setCloudAllowed(true);
    return recognizeImageWithCloud(image,signal);
  }
  async function usePdfQuestions(statement:string){
    const version=epoch.current;
    if(statement.length>6000)throw new Error('Select fewer questions or shorten them to stay within 6,000 characters.');
    const hasContext=!!(draft.confirmed||draft.knowledge||draft.hints.length||draft.messages.length);
    if(hasContext&&!await confirmChange({title:'Replace the current problem?',description:'This replaces the current problem and clears its knowledge, hints, and chat. Your notes and attached images will be kept.',action:'Replace with PDF text',cancel:'Keep current problem'}))return;
    if(version!==epoch.current)return;
    edit({statement,statementFormat:'latex',confirmed:false,knowledge:undefined,hints:[],messages:[],geometryDiagram:undefined,proofDiagram:undefined});
    closePdfPicker();setCollapsedHints([]);setStatus('PDF questions added to the problem editor. Review it before analyzing; your notes and attachments were kept.');
  }
  function confirmChange(value: Confirmation) {
    return new Promise<boolean>(resolve => { confirmationResult.current?.(false); confirmationResult.current=resolve; setConfirmation(value); });
  }
  function closeConfirmation(accepted: boolean) { confirmationResult.current?.(accepted); confirmationResult.current=null; setConfirmation(null); }
  async function changeExercise(value: Exercise) {
    const version=epoch.current;
    if (dirty && !await confirmChange({title:'Open another exercise?',description:'Your latest workspace changes have not been saved. Opening another page will discard them. The saved exercise will stay unchanged.',action:'Discard & open'})) return false;
    if (version !== epoch.current) return false;
    if(draftTimer.current)clearTimeout(draftTimer.current);draftTimer.current=null;
    try{await clearWorkspaceDraft(key.current);}catch{setError('Could not discard the local draft. Try again.');return false;}
    if(version!==epoch.current)return false;
    cancelImport();
    activeAI.current?.controller.abort(); activeAI.current = null;
    epoch.current++; setCollapsedHints([]); setDraft(structuredClone(value)); setDirty(false);setDraftSave('idle'); setPartial(''); setBusy(null);setDiagramBusy(false); setError(''); setStatus(''); setQuestion(''); setTab('solve');
    return true;
  }
  async function authenticate(register: boolean) {
    setAuthBusy(true); setError('');
    try {
      const auth = getAuth(getFirebaseApp());
      if (register) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      setTab('solve');
    } catch (e) { setError(friendlyError(e)); }
    finally { setAuthBusy(false); setPassword(''); }
  }
  async function logout() {
    const version=epoch.current;
    if (dirty && !await confirmChange({title:'Leave your notebook?',description:'Your latest changes are not saved. Sign out and discard this draft?',action:'Sign out'})) return;
    if (version !== epoch.current) return;
    setAuthBusy(true); setError('');
    try { if(draftTimer.current)clearTimeout(draftTimer.current);await clearWorkspaceDraft(key.current);await signOut(getAuth(getFirebaseApp())); } catch (e) { setError(friendlyError(e)); }
    finally { setAuthBusy(false); }
  }
  async function allowCloud(description = 'Cloud AI can send the current problem, selected problem illustrations, essentials, opened hints and recent conversation to the AI service. Notes and solution images are not sent; reading an image asks for separate consent each time. Allow Cloud AI for this session?'): Promise<boolean> {
    if (!online) { setError('Cloud AI needs an internet connection. Local AI is still available.'); return false; }
    if (cloudAllowed) return true;
    const version = epoch.current;
    const accepted = await confirmChange({ title:'Allow Cloud AI?', description, action:'Allow Cloud AI', cancel:'Not now' });
    if (!accepted || version !== epoch.current || !navigator.onLine) return false;
    setCloudAllowed(true); return true;
  }
  async function toggleCloud() {
    if (blocked) return;
    if (cloudAllowed) { setCloudAllowed(false); setChatRoute('local');setKnowledgeRoute('local');setFirstHintRoute('local'); }
    else await allowCloud();
  }
  async function selectChatRoute(route: 'local' | 'cloud') {
    if (blocked) return;
    if (route === 'local') { setChatRoute('local'); return; }
    if (await allowCloud()) setChatRoute('cloud');
  }
  async function selectStudyRoute(purpose:'knowledge'|'hint1',route:'local'|'cloud'){
    if(blocked)return;
    if(route==='cloud'&&!await allowCloud())return;
    if(purpose==='knowledge')setKnowledgeRoute(route);else setFirstHintRoute(route);
  }
  async function ask(purpose: NotebookRequest['purpose'],requestCloud=false) {
    if (!ready || blocked || activeAI.current) return;
    const version = epoch.current; const id = draft.id; const askedQuestion = question.trim();
    if (purpose !== 'knowledge' && purpose !== 'chat' && !draft.confirmed) { setError('Confirm the problem before asking for help.'); return; }
    if (purpose === 'chat' && !hasEditorContent(askedQuestion)) return;
    if (purpose === 'hint2' && draft.hints.length < 1 || purpose === 'hint3' && draft.hints.length < 2) return;
    const selectedRoute=purpose==='knowledge'?knowledgeRoute:purpose==='hint1'?firstHintRoute:purpose==='chat'?chatRoute:cloudAllowed&&online?'cloud':'local';
    const requestsCloud=selectedRoute==='cloud'||requestCloud;
    const permitted=requestsCloud?await allowCloud():cloudAllowed&&online;
    if(requestsCloud&&!permitted||version!==epoch.current||activeAI.current)return;
    const operation = { controller: new AbortController(), status, error };
    activeAI.current = operation;
    const currentOperation = () => activeAI.current === operation && version === epoch.current && !operation.controller.signal.aborted;
    runStarted.current=performance.now();setElapsed(0);setBusy(purpose); setPartial(''); setError(''); setStatus('Waiting for AI…');
    try {
      const route=requestsCloud&&permitted?'cloud':'local';
      const answer = await notebookAI({ purpose, statement: draft.statement, knowledge: draft.knowledge?.text ?? '', hints: draft.hints.map(h => h.text), messages: draft.messages, question: askedQuestion, cloudAllowed: permitted, route,responseStyle,geometryContext:draft.proofDiagram?.statement===draft.statement?proofTutorContext(draft.proofDiagram):undefined,images:illustrations }, text => {
        if (currentOperation()) { setPartial(text); setStatus('AI is answering…'); }
      }, operation.controller.signal);
      if (!currentOperation()) return;
      setDraft(current => {
        if (current.id !== id) return current;
        if (purpose === 'knowledge') return { ...current, confirmed: true, knowledge: answer };
        if (purpose === 'chat') return { ...current, messages: [...current.messages, { role: 'user', text: askedQuestion,format:'latex' }, { role: 'assistant', text: answer.text, source: answer.source }] };
        return { ...current, hints: [...current.hints, answer],proofDiagram:current.proofDiagram&&purpose!=='hint1'?{...current.proofDiagram,showAuxiliary:true}:current.proofDiagram };
      });
      if (purpose.startsWith('hint')) setCollapsedHints(current => current.filter(level => level !== Number(purpose.slice(-1)) - 1));
      setDirty(true);setDraftSave('idle'); if (purpose === 'chat') setQuestion(''); setStatus('Response ready. You can save this page.');
    } catch (e) { if (currentOperation()) { setError(friendlyError(e)); setStatus(operation.status); } }
    finally { if (currentOperation()) { activeAI.current = null; setPartial(''); setBusy(null);setDiagramBusy(false); } }
  }
  function stopAI() {
    const operation = activeAI.current; if (!operation) return;
    activeAI.current = null;
    operation.controller.abort();
    setPartial(''); setBusy(null);setDiagramBusy(false); setStatus(operation.status); setError(operation.error);
  }
  async function resetHints(){
    if(blocked||activeAI.current)return;
    const version=epoch.current;
    if(!await confirmChange({title:'Reset hints?',description:'Clear all opened hint levels in this workspace so you can generate fresh hints for every exercise. Your problem, knowledge, notes and conversation stay. The library copy changes only when you save.',action:'Reset hints'}))return;
    if(version!==epoch.current||activeAI.current)return;
    edit({hints:[]});setCollapsedHints([]);
  }
  async function reviseIllustrations(next:Attachment[]){
    if(blocked||activeAI.current)return;
    const version=epoch.current,changed=!sameIllustrations(draft.attachments,next);
    if(changed&&draft.confirmed&&!await confirmChange({title:'Update problem illustrations?',description:'The problem context changes. Its essentials, hints and conversation will be cleared for a fresh analysis. Notes and saved library pages stay.',action:'Update illustrations'}))return;
    if(version!==epoch.current||activeAI.current)return;
    edit({attachments:next,...(changed?{confirmed:false,knowledge:undefined,hints:[],messages:[],proofDiagram:undefined}: {})});
    if(changed)setCollapsedHints([]);
  }
  async function attach(file: File | undefined, kind: Attachment['kind']) {
    if (!file || blocked) return;
    const version = epoch.current;
    try {
      if (draft.attachments.length >= 4) throw new Error('Each exercise supports up to 4 images.');
      const attachment = await readAttachment(file, kind);
      if (version !== epoch.current||activeAI.current) return;
      if(kind==='problem'){await reviseIllustrations([...draft.attachments,attachment]);return;}
      setDraft(current => {
        if (current.attachments.length >= 4) return current;
        return { ...current, attachments: [...current.attachments, attachment] };
      }); setDirty(true);setDraftSave('idle');
    } catch (e) { if (version === epoch.current) setError(friendlyError(e)); }
  }
  function insertMath(latex: string) { input.current?.insert(latex); }
  async function editStatement() {
    const version=epoch.current;
    if ((draft.knowledge || draft.hints.length || draft.messages.length) && !await confirmChange({title:'Revise this problem?',description:'Knowledge, opened hints and this conversation will be cleared so they match your revised problem. Your notes and attached images will stay.',action:'Edit problem'})) return;
    if (version !== epoch.current) return;
    setCollapsedHints([]);
    edit({ confirmed: false, knowledge: undefined, hints: [], messages: [] });
    requestAnimationFrame(() => input.current?.focus());
  }
  function beginSave(editDetails = false) {
    if (!editDetails && book.exercises.some(exercise => exercise.id === draft.id)) { void save(draft); return; }
    setTitle(draft.title); setFolderIds(exerciseFolderIds(draft)); setNewFolder(''); setSaveFolderColor(defaultFolderColor);setSaveOpen(true);
  }
  async function save(existing?: Exercise) {
    const version = epoch.current; const storageKey = key.current;
    if (!storageKey || !ready || blocked) return;
    setSaving(true); setError('');
    try {
      let next = book; let selected = existing ? exerciseFolderIds(existing) : [...folderIds];
      if (!existing && newFolder.trim()) {
        if (newFolder.trim().length > 80) throw new Error('Folder names can contain up to 80 characters.');
        const existing = book.folders.find(f => f.name.toLocaleLowerCase() === newFolder.trim().toLocaleLowerCase());
        const createdId = existing?.id ?? crypto.randomUUID();
        selected = [...new Set([...selected,createdId])];
        if (!existing) next = { ...book, folders: [...book.folders, { id: createdId, name: newFolder.trim(),color:saveFolderColor }] };
      }
      next = putExercise(next, withExerciseFolders(next,{ ...(existing ?? draft), title: existing?.title ?? title.slice(0, 120) },selected));
      await saveNotebook(storageKey, next);
      if (version !== epoch.current) return;
      if(draftTimer.current)clearTimeout(draftTimer.current);draftTimer.current=null;
      await clearWorkspaceDraft(storageKey).catch(()=>{if(version===epoch.current)setError('Exercise saved. The previous draft could not be cleared; you can discard it next time.');});
      if(version!==epoch.current)return;
      setBook(next); setDraft(next.exercises[0]); setDirty(false);setDraftSave('idle'); setSaveOpen(false); setStatus('Saved on this device.');
    } catch (e) { if (version === epoch.current) setError(friendlyError(e)); }
    finally { if (version === epoch.current) setSaving(false); }
  }
  function openPreview(exercise: Exercise) { setPreview({ id: exercise.id, notes: exercise.notes,notesFormat:exercise.notesFormat,attachments:structuredClone(exercise.attachments),folderIds:exerciseFolderIds(exercise) }); setPreviewError(''); }
  function previewDirty(value:NonNullable<typeof preview>,exercise:Exercise){
    return value.notes!==exercise.notes||value.notesFormat!==exercise.notesFormat||!sameAttachments(value.attachments,exercise.attachments)||value.folderIds.slice().sort().join('|')!==exerciseFolderIds(exercise).sort().join('|');
  }
  async function attachPreview(file:File){
    if(!preview||blocked)return;const version=epoch.current,id=preview.id;
    setSaving(true);setPreviewError('');
    try{
      if(preview.attachments.length>=4)throw new Error('Each exercise supports up to 4 images.');
      const image=await readAttachment(file,'solution');
      if(version===epoch.current)setPreview(current=>current?.id===id&&current.attachments.length<4?{...current,attachments:[...current.attachments,image]}:current);
    }catch(error){if(version===epoch.current)setPreviewError(friendlyError(error));}
    finally{if(version===epoch.current)setSaving(false);}
  }
  async function leavePreview(openWorkspace = false) {
    if (!preview || saving) return;
    const version = epoch.current;
    const exercise = book.exercises.find(value => value.id === preview.id); if (!exercise) return;
    if (previewDirty(preview,exercise) && !await confirmChange({ title:'Leave these changes?', description:'Your preview changes have not been saved. Keep working to save them, or discard these changes and continue.', action:'Discard changes & continue' })) return;
    if (version !== epoch.current) return;
    if (openWorkspace && !await changeExercise(exercise)) return;
    setPreview(null); setPreviewError('');
  }
  async function savePreviewNotes() {
    if (!preview || blocked || !ready) return;
    const version = epoch.current; const storageKey = key.current;
    const original = book.exercises.find(value => value.id === preview.id); if (!original) return;
    setSaving(true); setPreviewError('');
    try {
      const next = putExercisePreview(book, preview.id, {notes:preview.notes,notesFormat:preview.notesFormat,...(!sameAttachments(preview.attachments,original.attachments)?{attachments:preview.attachments}:{}),...(preview.folderIds.slice().sort().join('|')!==exerciseFolderIds(original).sort().join('|')?{folderIds:preview.folderIds}:{})});
      await saveNotebook(storageKey, next);
      if (version !== epoch.current) return;
      setBook(next);
      const saved=next.exercises.find(exercise=>exercise.id===preview.id)!;
      setDraft(current=>current.id!==preview.id?current:{...current,
        ...(current.notes===original.notes&&current.notesFormat===original.notesFormat?{notes:saved.notes,notesFormat:saved.notesFormat}:{}),
        ...(sameAttachments(current.attachments,original.attachments)?{attachments:structuredClone(saved.attachments)}:{}),
        ...(exerciseFolderIds(current).sort().join('|')===exerciseFolderIds(original).sort().join('|')?{folderIds:exerciseFolderIds(saved),folderId:saved.folderId}:{})});
    } catch (e) { if (version === epoch.current) setPreviewError(friendlyError(e)); }
    finally { if (version === epoch.current) setSaving(false); }
  }
  async function changeCompletion(id:string,completed:boolean){
    if(!ready||blocked)return;
    const version=epoch.current,storageKey=key.current;
    setSaving(true);setError('');
    try{
      const next=putExerciseCompletion(book,id,completed);
      await saveNotebook(storageKey,next);
      if(version!==epoch.current)return;
      setBook(next);
      setDraft(current=>current.id===id?{...current,completed}:current);
      setStatus(completed?'Exercise marked completed.':'Exercise marked in progress.');
    }catch(reason){if(version===epoch.current)setError(friendlyError(reason));}
    finally{if(version===epoch.current)setSaving(false);}
  }
  async function deleteExercise(id: string) {
    const version = epoch.current;
    if (!await confirmChange({title:'Delete this exercise?',description:'This exercise and its attachments will be deleted from My exercises and every other folder. Folder entries refer to the same file. This cannot be undone.',action:'Delete exercise'})) return;
    if (version !== epoch.current) return;
    setSaving(true);
    try {
      const next = { ...book, exercises: book.exercises.filter(e => e.id !== id) };
      if(draft.id===id){if(draftTimer.current)clearTimeout(draftTimer.current);draftTimer.current=null;await clearWorkspaceDraft(key.current);if(version!==epoch.current)return;}
      await saveNotebook(key.current, next);
      if (version !== epoch.current) return;
      if(draft.id===id){setDraft(newExercise());setDirty(false);setDraftSave('idle');}
      setBook(next);
    } catch (e) { if (version === epoch.current) setError(friendlyError(e)); }
    finally { if (version === epoch.current) setSaving(false); }
  }
  async function changeFolderColor(id:string,color:FolderColor){
    if(blocked||!ready)return;
    const version=epoch.current,storageKey=key.current;
    setSaving(true);setError('');
    try{
      const next=recolorFolder(book,id,color);await saveNotebook(storageKey,next);
      if(version===epoch.current){setBook(next);setStatus('Folder color saved on this device.');}
    }catch(reason){if(version===epoch.current)setError(friendlyError(reason));}
    finally{if(version===epoch.current)setSaving(false);}
  }
  async function createFolder() {
    if (blocked || !ready) return;
    const version=epoch.current; setSaving(true); setError('');
    try {
      const next=addFolder(book, folderName,creationColor);
      await saveNotebook(key.current,next);
      if (version !== epoch.current) return;
      setBook(next); setFolder(null); setFolderDialog(false); setFolderName(''); setStatus('Folder created on this device.');
    } catch (e) { if (version === epoch.current) setError(friendlyError(e)); }
    finally { if (version === epoch.current) setSaving(false); }
  }
  async function deleteFolder(id: string) {
    if (blocked || id === 'general') return;
    const version=epoch.current;
    const target=book.folders.find(f => f.id === id); if (!target) return;
    const count=book.exercises.filter(e => inExerciseFolder(e,id)).length;
    if (!await confirmChange({title:`Delete “${target.name}”?`,description:count ? `${count} saved exercise${count === 1 ? '' : 's'} will remain in My exercises and any other folders. Your pages and attachments will not be deleted.` : 'This empty folder will be removed from your notebook.',action:'Delete folder'})) return;
    if (version !== epoch.current) return;
    setSaving(true); setError('');
    try {
      const next=removeFolder(book,id);
      await saveNotebook(key.current,next);
      if (version !== epoch.current) return;
      setBook(next); if (folder === id) setFolder(null);
      setDraft(current => exerciseFolderIds(current).includes(id) ? withExerciseFolders(next,current,exerciseFolderIds(current).filter(folder=>folder!==id)) : current);
      setFolderIds(current => current.filter(folder=>folder!==id));
      setStatus('Folder removed. Saved exercises were kept.');
    } catch (e) { if (version === epoch.current) setError(friendlyError(e)); }
    finally { if (version === epoch.current) setSaving(false); }
  }
  function streaming(purpose: NotebookRequest['purpose']) { return busy === purpose ? <div className="ai-progress"><button className="stop-ai" onClick={stopAI}>■ Stop AI</button><div className="live-answer" aria-busy="true">{partial || 'Preparing an answer…'}</div></div> : null; }
  const shown = findExercises(book.exercises,{folder,query:libraryQuery,sort:librarySort,completion:libraryCompletion});
  const showPages=libraryView==='exercises'||!!folder||!!libraryQuery.trim()||libraryCompletion!=='all';
  const previewExercise = preview ? book.exercises.find(exercise => exercise.id === preview.id) : undefined;
  const savedDraft = book.exercises.some(exercise => exercise.id === draft.id);
  useEffect(()=>{
    if(!user||!ready)return;
    const keydown=(event:KeyboardEvent)=>{
      if(!(event.ctrlKey||event.metaKey))return;
      if(event.key.toLowerCase()==='s'){
        event.preventDefault();
        if(viewingImage||confirmation||saveOpen||folderDialog||pdfQuestions!==null||imageProblem||blocked)return;
        if(preview){void savePreviewNotes();return;}
        if(tab==='solve'&&hasEditorContent(draft.statement))beginSave();
      }
      if(event.target instanceof Element&&event.target.closest('.symbol-browser'))return;
      if(event.key==='Enter'&&tab==='solve'&&!preview&&!viewingImage&&!confirmation&&!saveOpen&&!folderDialog&&pdfQuestions===null&&!imageProblem&&!blocked){
        event.preventDefault();
        if((event.target as HTMLElement)?.getAttribute('aria-label')==='Discussion question')void ask('chat');
        else if(hasEditorContent(draft.statement))void ask('knowledge');
      }
    };
    window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown);
  });
  return <MathKeyboardProvider><main className={`notebook-app${!user&&tab!=='guide'?' login-page':''}`} style={{'--problem-font-size':`${mathSize}px`} as React.CSSProperties} inert={!!confirmation || !!preview || pdfQuestions !== null || !!imageProblem || !!viewingImage}>
    {!user&&tab!=='guide'&&<LoginBackdrop/>}
    <header className="notebook-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('solve'); }}><span className="brand-mark" aria-hidden="true">Σ</span><span>Mathfolio<small>YOUR DIGITAL EXERCISE BOOK</small></span></a>
      <nav aria-label="Navigation"><button aria-current={tab === 'solve' ? 'page' : undefined} className={tab === 'solve' ? 'active' : ''} onClick={() => setTab('solve')}>Workspace</button><button aria-current={tab === 'library' ? 'page' : undefined} className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Exercise library <span>{book.exercises.length}</span></button><button aria-current={tab === 'guide' ? 'page' : undefined} className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}>How to use</button><button aria-current={tab === 'account' ? 'page' : undefined} className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>{user ? 'Account' : 'Sign in'}</button></nav>
      <MenuDisclosure className="appearance-disclosure"><summary>◐ <span>Appearance</span></summary><AppearanceSettings appearance={appearance}/></MenuDisclosure>
    </header>
    <div className="connection"><span className={online ? 'dot online' : 'dot'} />{online ? 'Online' : 'Offline'}<span>·</span><span>Notebook storage: this device · Cloud sync unavailable</span></div>
    {error && <p role="alert" className="notice error">{error}</p>}
    {status && <p role="status" className="notice success">{status}</p>}
    {recovery&&<section className="draft-recovery paper" aria-label="Recover workspace draft"><div><strong>Continue where you left off?</strong><p>A draft of {recovery.exercise.title || 'Untitled exercise'} was saved {new Date(recovery.savedAt).toLocaleString('en-GB')}. Your library copy has not been changed.</p></div><div className="row"><button className="primary" disabled={saving} onClick={resumeDraft}>Resume draft</button><button disabled={saving} onClick={()=>void discardRecovery()}>Start fresh</button></div></section>}
    {draftSave==='error'&&<p className="notice error" role="alert">Could not autosave this draft. Keep this page open and try Save exercise.</p>}
    {diagramBusy&&<div className="ai-toolbar" role="status"><span>Building geometry from the hypotheses…</span><button onClick={stopAI}>Stop diagram</button></div>}
    {(pdfBusy||imagePreparing)&&<div className="ai-toolbar" role="status"><span>{imagePreparing?'Preparing image…':pdfProgress?.stage==='ocr'?`Reading PDF locally · ${pdfProgress.page}/${pdfProgress.total}`:'Opening PDF…'}</span><button className="stop-ai" onClick={cancelImport}>Stop import</button></div>}
    {busy && <div className="ai-toolbar" role="status"><span>AI is working on {busy === 'knowledge' ? 'your essentials' : busy === 'chat' ? 'your conversation' : `hint ${busy.slice(-1)}`} · {elapsed}s</span><button className="stop-ai" onClick={stopAI}>■ Stop AI</button></div>}
    {((!user && tab !== 'guide') || tab === 'account') && <section className="account-panel paper">
      <div><p className="eyebrow">ONE PERSON. ONE NOTEBOOK.</p><h1>{user ? 'Your exercise notebook' : 'Start a new page.'}</h1><p>Keep your thinking, not just the answer.</p></div>
      {user ? <div><p>Signed in: <strong>{user.email}</strong></p><p className="subtle">Your notebook is private to this account and Firebase environment on this browser.</p><button disabled={authBusy || blocked} onClick={() => void logout()}>Sign out</button></div> : <form onSubmit={e => { e.preventDefault(); void authenticate(false); }}><label>Email<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} disabled={authBusy}/></label><label>Password<input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={authBusy}/></label><div className="row"><button className="primary" disabled={authBusy} type="submit">Sign in</button><button type="button" disabled={authBusy || password.length < 6 || !email.includes('@')} onClick={() => void authenticate(true)}>Create account</button></div><p className="subtle">Signing in requires Authentication or a running emulator.</p></form>}
    </section>}
    {tab === 'guide' && <UsageGuide onStart={()=>setTab('solve')}/>}
    {user && !ready && <p role="status">Opening your notebook…</p>}
    {user && ready && tab === 'solve' && <>
      <div className="page-heading workspace-heading"><div><p className="eyebrow">WORKSPACE / {draft.title || 'NEW EXERCISE'}</p><h1>{draft.title || 'One problem. One discovery.'}</h1><p>Read it. Try it. Open a hint when you need one.</p></div></div>
      <div className="workspace-toolbar">
        <div className="workspace-tools">
            <MenuDisclosure className="tool-disclosure"><summary>Add content</summary><div className="tool-content import-actions"><label className="attachment-button pdf-upload-button">＋ Choose PDF<input aria-label="Choose a PDF" type="file" accept="application/pdf,.pdf" disabled={blocked} onChange={e=>{const file=e.target.files?.[0];e.target.value='';void loadPdf(file);}}/></label><label className="attachment-button">＋ Read image<input aria-label="Read a problem image" type="file" accept="image/png,image/jpeg,image/webp" disabled={blocked} onChange={e=>{const file=e.target.files?.[0];e.target.value='';void loadImage(file);}}/></label>
</div></MenuDisclosure>
            <MenuDisclosure className="tool-disclosure study-options"><summary>Study options</summary><div className="tool-content"><div className="study-style-field"><span>Local answer style</span><SelectMenu<ResponseStyle> label="Local answer style" disabled={blocked} value={responseStyle} options={[{value:'auto',label:'Auto',description:'Match the problem'},{value:'brief',label:'Brief',description:'Essential steps'},{value:'explained',label:'Explained',description:'Why each step works'}]} onChange={setResponseStyle}/><small>Applies to new local solutions and chat. Hints stay gradual.</small></div><div className="problem-size-control"><span>Problem text size</span><div className="math-zoom" role="group" aria-label="Math size"><button type="button" aria-label="Decrease math size" disabled={mathSize<=14} onClick={()=>setMathSize(size=>Math.max(14,size-1))}>A−</button><span>{mathSize}</span><button type="button" aria-label="Increase math size" disabled={mathSize>=23} onClick={()=>setMathSize(size=>Math.min(23,size+1))}>A+</button></div></div>{savedDraft&&<button disabled={blocked} onClick={()=>beginSave(true)}>Name / folders</button>}<p className="subtle">Focus mode keeps only your problem and working notes. Keyboard shortcuts are in How to use.</p></div></MenuDisclosure>
        </div>
        <div className="workspace-actions" role="group" aria-label="Exercise actions">
          <span className={`save-state ${dirty?'draft':'saved'}`} role="status">{dirty ? draftSave==='saved'?`Draft saved · ${new Date(draftSavedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:draftSave==='saving'?'Saving draft…':'Unsaved changes' : savedDraft?'Saved on this device':'New exercise'}</span>
          <div className="row">
          <button disabled={blocked} onClick={()=>changeExercise(newExercise())}>＋ New exercise</button>
          <button type="button" className="focus-button" aria-pressed={focusMode} onClick={()=>setFocusMode(value=>!value)}>{focusMode?'Exit focus mode':'Focus mode'}</button>
          <button title="Save exercise (Ctrl+S)" className="primary" disabled={blocked||!hasEditorContent(draft.statement)} onClick={()=>beginSave()}>Save exercise {dirty?'•':''}</button>
          </div>
            <button className="cloud-switch" role="switch" aria-checked={cloudAllowed} aria-label="Cloud AI" disabled={blocked} onClick={()=>void toggleCloud()}><span className="switch-track" aria-hidden="true"><span/></span>Cloud AI <strong>{cloudAllowed?'On':'Off'}</strong></button>
        </div>
      </div>
      {focusMode&&<p className="focus-notice" role="status">Focus mode · Your hints, illustrations and discussion are kept. Exit focus mode to see them.</p>}
      <div className={focusMode?'workspace-content focus-mode':'workspace-content'}>
      <div className="problem-row">
        <section className="paper problem"><div className="panel-heading"><span className="step">01</span><h2>Problem</h2><span className="tag">YOUR PROBLEM</span></div>
          {!draft.confirmed&&<ProblemSourceInput disabled={blocked} onApply={statement=>edit({statement,statementFormat:'latex'})}/>}
          <MathInput ref={input} value={statementLatex(draft.statement, draft.statementFormat)} readOnly={draft.confirmed} disabled={blocked} onChange={value => edit({ statement: value, statementFormat: 'latex' })}/>
          {!draft.confirmed && <><p className="subtle">Type your problem or paste LaTeX. Insert symbols directly below.</p><MathKeyboard disabled={blocked} onActivate={()=>input.current?.focus()} onInsert={symbol => insertMath(symbol.latex)}/></>}
          {!cloudAllowed && online && draft.statement.trim() && recommendsCloudForProblem(draft.statement) && <aside className="cloud-recommendation" aria-label="Cloud AI recommendation"><p>This may need several reasoning steps. Cloud AI can provide deeper analysis; your problem is sent only after you enable it and run analysis.</p><button type="button" disabled={blocked} onClick={() => void allowCloud('Cloud AI may provide deeper reasoning for this problem. Your problem and related tutoring context are sent only when you choose to run an AI action with Cloud AI enabled. Allow Cloud AI for this session?')}>Consider Cloud AI</button></aside>}

          <div className="row">{draft.confirmed && <button disabled={blocked} onClick={editStatement}>Edit problem</button>}<button type="button" disabled={blocked||!hasEditorContent(draft.statement)} onClick={()=>void createGeometryDiagram()}>{draft.proofDiagram?'Update diagram':'Create diagram'}</button><button className="primary" title="Analyze problem (Ctrl+Enter)" disabled={blocked || !hasEditorContent(draft.statement)} onClick={() => void ask('knowledge')}>{draft.confirmed ? 'Refresh knowledge' : 'Confirm & analyze'}</button></div>
        </section>
        <aside className="paper problem-images" aria-label="Problem illustrations"><div className="panel-heading"><h2>Illustrations</h2><span className="tag">{illustrations.length} FOR AI</span></div>
          <label className="attachment-button">＋ Add illustration<input aria-label="Attach a problem illustration" type="file" accept="image/png,image/jpeg,image/webp" disabled={blocked||draft.attachments.length>=4} onChange={event=>{const file=event.target.files?.[0];event.target.value='';void attach(file,'problem');}}/></label>
          <p className="subtle">Selected illustrations are included in new AI requests. Refresh knowledge to update earlier analysis. Notes and solution images are excluded.</p>
          <div className="illustrations-scroll">{!draft.attachments.some(image=>image.kind==='problem')&&<p className="empty-illustrations">Add a diagram, graph or image needed to understand the problem. Click any image to zoom.</p>}
            <AttachmentGallery images={draft.attachments.filter(image=>image.kind==='problem')} onOpen={setViewingImage} disabled={blocked} onRename={(id,name)=>edit({attachments:draft.attachments.map(image=>image.id===id?{...image,name}:image)})} onRemove={id=>void reviseIllustrations(draft.attachments.filter(image=>image.id!==id))} onAISelection={(id,included)=>void reviseIllustrations(draft.attachments.map(image=>image.id===id?{...image,useForAI:included}:image))}/>

          </div>
          <p className="subtle">{cloudAllowed&&online?'Cloud actions send selected illustrations. Local chat stays on your device.':'Local AI needs a compatible device to understand illustrations. Images are not sent to cloud while Cloud AI is off.'}</p>
        </aside>
      </div>
      {draft.proofDiagram&&<ProofDiagramView diagram={draft.proofDiagram} disabled={blocked} onToggle={showAuxiliary=>edit({proofDiagram:{...draft.proofDiagram!,showAuxiliary}})}/>}
      {!draft.proofDiagram&&draft.geometryDiagram&&<GeometryDiagramEditor diagram={draft.geometryDiagram} onChange={geometryDiagram=>edit({geometryDiagram})} onCreate={()=>createGeometryDiagram()} onAnalyze={()=>void ask('knowledge')} disabled={blocked}/>}
      <div className="guidance-row">
        <section className="paper knowledge"><div className="panel-heading"><span className="step">02</span><h2>What you need</h2></div><div className="study-ai-choice"><SelectMenu label="Knowledge AI" value={knowledgeRoute} disabled={blocked} options={[{value:'local',label:'Local AI'},{value:'cloud',label:'Cloud AI'}]} onChange={route=>void selectStudyRoute('knowledge',route)}/><small>Choose how to run the next analysis.</small></div><p className="subtle">Only the concepts needed for this exact problem.</p><div className="knowledge-scroll" role="region" aria-label="Knowledge for this problem" tabIndex={0}><span className="source-label">{draft.knowledge ? sourceLabel(draft.knowledge.source) : knowledgeRoute==='cloud'?'Cloud AI':'Local AI'}</span>{streaming('knowledge')}{draft.knowledge && busy !== 'knowledge' ? <><MarkdownView value={draft.knowledge.text}/><small className="subtle">Processed by: {sourceLabel(draft.knowledge.source)}</small></> : busy !== 'knowledge' && <div className="empty-panel"><span>∑</span><p>Confirm your problem to see<br/>the essentials here.</p></div>}</div></section>
        <section className="paper hints">
          <div className="panel-heading"><span className="step">03</span><h2>A little help, your way</h2>{draft.hints.length>0&&<button className="reset-hints" disabled={blocked} onClick={()=>void resetHints()}>Reset hints</button>}</div>
          <p className="subtle">Open the next level only when you need it.</p>
          <div className="hints-scroll" role="region" aria-label="Exercise hints" tabIndex={0}>
          {labels.map((label, i) => <div className="hint-tier" key={label}>
            <div className="hint-title"><span className="hint-number">{i + 1}</span><strong>{label}</strong>{i===0&&<div className="first-hint-ai"><SelectMenu label="Hint 1 AI" value={firstHintRoute} disabled={blocked} options={[{value:'local',label:'Local AI'},{value:'cloud',label:'Cloud AI'}]} onChange={route=>void selectStudyRoute('hint1',route)}/></div>}<span className="source-label">{draft.hints[i]?sourceLabel(draft.hints[i].source):(i===0?firstHintRoute==='cloud':cloudAllowed&&online)?'Cloud':'Local'}</span></div>
            {i===0&&draft.hints[0]&&<small className="hint-route-note">Use Reset hints to generate again with your chosen AI.</small>}
            {i>0&&online&&!cloudAllowed&&!draft.hints[i]&&<aside className="hint-cloud-suggestion"><p>Cloud AI is available for deeper reasoning on this level.</p><button type="button" disabled={blocked||!draft.confirmed||draft.hints.length!==i} onClick={()=>void ask(`hint${i+1}` as NotebookRequest['purpose'],true)}>Use Cloud AI</button></aside>}
            {draft.hints[i] ? <>
              <button className="hint-toggle" aria-expanded={!collapsedHints.includes(i)} aria-controls={`hint-content-${i}`} onClick={() => setCollapsedHints(current => current.includes(i) ? current.filter(level => level !== i) : [...current,i])}>{collapsedHints.includes(i) ? 'Show hint ▾' : 'Hide hint ▴'}</button>
              <div id={`hint-content-${i}`} hidden={collapsedHints.includes(i)}><MarkdownView value={draft.hints[i].text}/><small className="subtle">{sourceLabel(draft.hints[i].source)}</small></div>
            </> : busy === `hint${i + 1}` ? streaming(`hint${i + 1}` as NotebookRequest['purpose']) : <button disabled={blocked || !draft.confirmed || draft.hints.length !== i} onClick={() => void ask(`hint${i + 1}` as NotebookRequest['purpose'])}>Open level {i + 1}</button>}
          </div>)}
          </div>

          {!online && <p className="subtle">Offline: on-device AI can work if the device model is ready.</p>}
        </section>
      </div><div className="workbench">
        <section className="paper discussion"><div className="panel-heading"><span className="step">04</span><h2>Another way to think about it?</h2><div className="chat-routes" role="group" aria-label="Chat processing"><button type="button" aria-pressed={chatRoute === 'local'} disabled={blocked} onClick={() => void selectChatRoute('local')}>Local AI</button><button type="button" aria-pressed={chatRoute === 'cloud'} disabled={blocked || !online} onClick={() => void selectChatRoute('cloud')}>Cloud AI</button></div></div><p className="subtle">Start a conversation anytime. AI uses the current problem and any essentials or hints you have opened, plus up to 6 recent messages.</p><div className="messages">{!draft.messages.length && <div className="empty-chat">“What if I try a different approach?”<small>Start with what you are thinking.</small></div>}{draft.messages.map((m, i) => <div className={`message ${m.role}`} key={i}><small>{m.role === 'user' ? 'You' : `Mathfolio · ${sourceLabel(m.source)}`}</small><>{m.role==='user'&&m.format==='latex'?<LatexMessage value={m.text} label="Your question"/>:<MarkdownView value={m.text}/>}</></div>)}{streaming('chat')}</div><form className="chat-form" onSubmit={e => { e.preventDefault(); void ask('chat'); }}><div className="chat-entry"><MathInput ref={chatInput} label="Discussion question" maxLength={1000} value={question} disabled={blocked} initialMode="text" onChange={setQuestion} placeholder="Ask a question or describe your approach…"/><MathKeyboard showCommon={false} disabled={blocked} onActivate={()=>chatInput.current?.focus()} onInsert={symbol=>chatInput.current?.insert(symbol.latex)}/></div><button className="primary" disabled={blocked || !hasEditorContent(question)} type="submit">Send ↗</button></form></section>
        <section className="paper notes"><div className="panel-heading"><span className="step">05</span><h2>Your working notes</h2></div><NotesEditor label="Notes" value={draft.notes} format={draft.notesFormat} disabled={blocked} onChange={notes => edit({ notes,notesFormat:'latex' })}/><label className="attachment-button">＋ Attach my solution<input type="file" accept="image/png,image/jpeg,image/webp" disabled={blocked || draft.attachments.length >= 4} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void attach(file, 'solution'); }}/></label><AttachmentGallery images={draft.attachments.filter(a=>a.kind==='solution')} onOpen={setViewingImage} disabled={blocked} onRename={(id,name)=>edit({attachments:draft.attachments.map(image=>image.id===id?{...image,name}:image)})} onRemove={id=>edit({attachments:draft.attachments.filter(a=>a.id!==id)})}/><label className="check"><input type="checkbox" checked={draft.completed} disabled={blocked} onChange={e => edit({ completed: e.target.checked })}/>I have completed this exercise</label><p className="subtle">Notes and images are stored when you select Save exercise.</p></section>

      </div></div><p className="footer-note">AI can be wrong. Check assumptions and steps. The work is yours.</p>
    </>}
    {user && ready && tab === 'library' && <section><div className="page-heading"><div><p className="eyebrow">PAGES OF PROGRESS</p><h1>{folder ? book.folders.find(f => f.id === folder)?.name : 'Exercise library'}</h1><p>Revisit your thinking. Continue where you left off.</p></div><div className="row"><button disabled={blocked} onClick={() => { setFolderName('');setCreationColor(defaultFolderColor); setError(''); setFolderDialog(true); }}>＋ New folder</button>{folder && folder !== 'general' && <button disabled={blocked} onClick={() => void deleteFolder(folder)}>Delete folder</button>}<button disabled={blocked} onClick={() => changeExercise(newExercise())}>＋ New exercise</button></div></div><div className="library-view row" role="group" aria-label="Library view"><button aria-pressed={!showPages} onClick={()=>{setLibraryView('folders');setFolder(null);setLibraryQuery('');setLibraryCompletion('all');}}>Folders</button><button aria-pressed={showPages&&!folder} onClick={()=>{setLibraryView('exercises');setFolder(null);}}>All exercises</button></div><div className="library-tools"><input type="search" aria-label="Search exercises" placeholder="Search names, problems or notes…" value={libraryQuery} onChange={e=>setLibraryQuery(e.target.value)}/><select aria-label="Exercise status" value={libraryCompletion} onChange={e=>setLibraryCompletion(e.target.value as typeof libraryCompletion)}><option value="all">All exercises</option><option value="progress">In progress</option><option value="completed">Completed</option></select><select aria-label="Sort exercises" value={librarySort} onChange={e=>{setLibrarySort(e.target.value as ExerciseSort);setLibraryView('exercises');}}><option value="recent">Recently updated</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></div><div className="library-results"><p role="status">{showPages ? `${shown.length} of ${book.exercises.filter(e=>!folder||inExerciseFolder(e,folder)).length} exercises` : `${book.folders.length} folders · ${book.exercises.length} exercises`}{folder?' in this folder':''}</p>{(libraryQuery||libraryCompletion!=='all')&&<button onClick={()=>{setLibraryQuery('');setLibraryCompletion('all');}}>Clear filters</button>}</div>{showPages ? <>{folder&&<button onClick={()=>{setFolder(null);setLibraryView('folders');setLibraryQuery('');setLibraryCompletion('all');}}>← All folders</button>}<div className="exercise-list">{!shown.length && <div className="paper empty-panel"><strong>{libraryQuery.trim()||libraryCompletion!=='all'?'No matching exercises.':'No exercises yet.'}</strong><p>{libraryQuery.trim()||libraryCompletion!=='all'?'Try another search or clear the filters above.':'Create an exercise in the workspace, then save it to your library.'}</p></div>}{shown.map(e => <article className="paper exercise-card" key={e.id}><div><span className={`tag ${e.completed ? 'done' : ''}`}>{e.completed ? 'Completed' : 'In progress'}</span><h2>{e.title}</h2><MathInput value={statementLatex(e.statement, e.statementFormat)} readOnly compact label={`Problem: ${e.title}`}/><small>{new Date(e.updatedAt).toLocaleString('en-GB')} · {e.hints.length}/3 hints opened</small></div><div className="row exercise-actions"><button type="button" disabled={blocked} aria-label={`${e.completed?'Mark in progress':'Mark completed'}: ${e.title}`} onClick={()=>void changeCompletion(e.id,!e.completed)}>{e.completed?'Mark in progress':'Mark completed'}</button><button className="primary" disabled={blocked} onClick={() => openPreview(e)}>Open exercise</button><button disabled={blocked} onClick={() => void deleteExercise(e.id)}>Delete</button></div></article>)}</div></> : <div className="folder-grid">{book.folders.map(f => <article className="paper folder-card" key={f.id} data-folder-color={folderColor(f.color).id}><button className="folder-open" disabled={blocked} onClick={() => setFolder(f.id)}><span aria-hidden="true">▱</span><h2>{f.name}</h2><small>{book.exercises.filter(e => inExerciseFolder(e,f.id)).length} exercises →</small></button><details className="folder-color-menu"><summary aria-label={`Choose color for ${f.name}`}><span className="folder-color-dot" aria-hidden="true"/>Color · {folderColor(f.color).name}<Chevron/></summary><FolderColorPicker value={folderColor(f.color).id} disabled={blocked} onChange={color=>void changeFolderColor(f.id,color)}/></details>{f.id !== 'general' && <button className="folder-delete" disabled={blocked} aria-label={`Delete folder ${f.name}`} onClick={() => void deleteFolder(f.id)}>Delete folder</button>}</article>)}</div>}</section>}
    {folderDialog && <div className="modal-backdrop"><section className="paper save-dialog" role="dialog" aria-modal="true" aria-labelledby="folder-title"><p className="eyebrow">ORGANIZE YOUR THINKING</p><h2 id="folder-title">New folder</h2><form onSubmit={e => { e.preventDefault(); void createFolder(); }}><label>Folder name<input autoFocus required maxLength={80} value={folderName} disabled={saving} onChange={e => setFolderName(e.target.value)} placeholder="e.g. Algebra — week 1"/></label><p className="folder-color-label">Folder color</p><FolderColorPicker value={creationColor} disabled={saving} onChange={setCreationColor}/>{error && <p role="alert" className="error">{error}</p>}<div className="row"><button type="button" disabled={saving} onClick={() => setFolderDialog(false)}>Cancel</button><button className="primary" type="submit" disabled={saving || !folderName.trim()}>{saving ? 'Creating…' : 'Create folder'}</button></div></form></section></div>}
    {saveOpen && <div className="modal-backdrop"><section className="paper save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-title"><p className="eyebrow">KEEP THIS PAGE</p><h2 id="save-title">Save to your notebook</h2><label>Exercise name<input autoFocus required maxLength={120} value={title} disabled={saving} onChange={e => setTitle(e.target.value)}/></label><FolderPicker folders={book.folders} selected={folderIds} disabled={saving} onChange={setFolderIds}/><label>Or create a new folder<input maxLength={80} aria-label="New folder name" value={newFolder} disabled={saving} onChange={e => setNewFolder(e.target.value)} placeholder="e.g. Algebra — week 1"/></label>{!!newFolder.trim()&&!book.folders.some(folder=>folder.name.toLocaleLowerCase()===newFolder.trim().toLocaleLowerCase())&&<><p className="folder-color-label">New folder color</p><FolderColorPicker value={saveFolderColor} disabled={saving} onChange={setSaveFolderColor}/></>}<p className="subtle">The problem, essentials, opened hints, notes, images and chat stay on this browser. Cloud sync is not available yet.</p>{error && <p role="alert" className="error">{error}</p>}<div className="row"><button disabled={saving} onClick={() => setSaveOpen(false)}>Not now</button><button className="primary" disabled={saving || !title.trim()} onClick={() => void save()}>{saving ? 'Saving…' : 'Save on this device'}</button></div></section></div>}
  </main>{pdfQuestions!==null&&pdfFile&&<PdfQuestionPicker file={pdfFile} questions={pdfQuestions} pageCount={pdfPageCount} suspended={!!confirmation||!!viewingImage} onClose={closePdfPicker} onUse={usePdfQuestions} onReadPage={readPdfPageWithCloud} onImage={setViewingImage}/>} {imageProblem&&<ImageProblemReview image={imageProblem} onClose={()=>{setImageProblem(null);setImportError('');}} onApply={applyImageText} onCloudRead={readImageWithCloud} onImage={()=>setViewingImage({id:'image-import-source',name:imageProblem.name,data:imageProblem.data,kind:'problem'})} suspended={!!confirmation||!!viewingImage} error={importError} canKeepImage={draft.attachments.length<4}/>} {preview && previewExercise && <ExercisePreview key={preview.id} exercise={previewExercise} folderName={['My exercises',...book.folders.filter(value=>exerciseFolderIds(previewExercise).includes(value.id)).map(value=>value.name)].join(' · ')} attachments={preview.attachments} folders={book.folders} folderIds={preview.folderIds} onAttachments={attachments=>setPreview(current=>current?{...current,attachments}:current)} onAttach={file=>void attachPreview(file)} onFolders={folderIds=>setPreview(current=>current?{...current,folderIds}:current)} notes={preview.notes} notesFormat={preview.notesFormat} saving={saving} onImage={setViewingImage} suspended={!!confirmation || !!viewingImage} error={previewError} onNotes={notes => setPreview(current => current ? { ...current, notes,notesFormat:'latex' } : current)} onSaveNotes={() => void savePreviewNotes()} onClose={() => void leavePreview()} onOpenWorkspace={() => void leavePreview(true)}/>} {viewingImage&&<ImageViewer key={viewingImage.id} image={viewingImage} kindLabel={pdfQuestions!==null?'PDF SOURCE PAGE':imageProblem?'IMAGE SOURCE':undefined} onClose={()=>setViewingImage(null)}/>} {confirmation && <ConfirmDialog {...confirmation} onClose={closeConfirmation}/>}</MathKeyboardProvider>;
}
