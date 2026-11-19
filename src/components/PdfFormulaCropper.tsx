import { useEffect, useRef, useState } from 'react';
import { recognizeMathFormula } from '../pdf-ocr-local';

interface Crop { x: number; y: number; width: number; height: number }

export function PdfFormulaCropper({ image, onInsert, imageLabel = 'Source page for formula selection', onCloudRead, cloudOnly = false, disabled = false, onBusyChange }: { image: string; onInsert?: (latex: string) => void; imageLabel?: string; onCloudRead?: (image: string) => Promise<void>; cloudOnly?: boolean; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [cropPreview, setCropPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [error, setError] = useState('');
  const operation=useRef<AbortController|null>(null);const busyCallback=useRef(onBusyChange);busyCallback.current=onBusyChange;
  useEffect(()=>{busyCallback.current?.(busy);},[busy]);
  useEffect(()=>()=>{operation.current?.abort();operation.current=null;},[image]);
  function stop(){const current=operation.current;operation.current=null;current?.abort();setBusy(false);setError('');}

  function selection(origin: { x: number; y: number }, end: { x: number; y: number }): Crop {
    return { x: Math.min(origin.x, end.x), y: Math.min(origin.y, end.y), width: Math.abs(end.x - origin.x), height: Math.abs(end.y - origin.y) };
  }
  function previewSelection(selected: Crop) {
    const imageElement = imageRef.current;
    if (!imageElement) return '';
    const canvas = window.document.createElement('canvas');
    const left = Math.round(selected.x * imageElement.naturalWidth);
    const top = Math.round(selected.y * imageElement.naturalHeight);
    canvas.width = Math.round(selected.width * imageElement.naturalWidth);
    canvas.height = Math.round(selected.height * imageElement.naturalHeight);
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not preview the selected formula.');
      context.drawImage(imageElement, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  function point(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = imageRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    };
  }
  function start(event: React.PointerEvent<HTMLDivElement>) {
    if (busy||disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = point(event);
    setDrag(origin); setCrop({ ...origin, width: 0, height: 0 }); setCropPreview(''); setError('');
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const end = point(event);
    setCrop(selection(drag, end));
  }
  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const selected = selection(drag, point(event));
    setCrop(selected);
    setDrag(null);
    if (selected.width >= 0.01 && selected.height >= 0.01) {
      try {
        setCropPreview(previewSelection(selected));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not preview the selected formula.');
      }
    }
  }
  async function recognize() {
    const imageElement = imageRef.current;
    if (busy || cloudBusy || disabled || !onInsert || !crop || !imageElement || crop.width < 0.01 || crop.height < 0.01 || crop.width * crop.height > 0.65) return;
    const controller=new AbortController();operation.current=controller;
    setBusy(true); setError('');
    const canvas = window.document.createElement('canvas');
    const left = Math.round(crop.x * imageElement.naturalWidth);
    const top = Math.round(crop.y * imageElement.naturalHeight);
    canvas.width = Math.round(crop.width * imageElement.naturalWidth);
    canvas.height = Math.round(crop.height * imageElement.naturalHeight);
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not crop the selected formula.');
      context.drawImage(imageElement, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare the formula image.')), 'image/png'));
      controller.signal.throwIfAborted();
      const latex = await recognizeMathFormula(blob,controller.signal);
      if(operation.current!==controller || controller.signal.aborted)return;
      onInsert(latex);
    } catch (reason) {
      if(operation.current===controller)setError(reason instanceof Error ? reason.message : 'Local formula recognition failed.');
    } finally {
      canvas.width = 0; canvas.height = 0; if(operation.current===controller){operation.current=null;setBusy(false);}
    }
  }
  async function readWholePage() {
    if (disabled || !onCloudRead || cloudBusy) return;
    setCloudBusy(true);
    try {
      await onCloudRead(image);
    } finally {
      setCloudBusy(false);
    }
  }

  return <section className={`formula-cropper${cloudOnly ? ' cloud-only-reader' : ''}`} aria-label={cloudOnly ? 'Cloud PDF page reading' : 'Local formula OCR'}>
    {cloudOnly ? <p className="subtle">Review the source page, then choose Cloud AI to transcribe its text and mathematical notation. You will be asked before the image is sent.</p> : <>
      <p className="subtle">Drag over one formula for local LaTeX OCR. Whole-page Cloud AI reading is optional and asks before sending the page.</p>
      <div className="formula-crop-stage" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
        <div className="formula-crop-image">
          <img ref={imageRef} src={image} alt={imageLabel} draggable={false}/>
          {crop && <span className="formula-crop-box" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }}/>}
        </div>
      </div>
      {crop && crop.width * crop.height > 0.65 && <p role="status" className="subtle">This crop covers most of the page. Select one formula only.</p>}
      {cropPreview && <figure className="formula-crop-preview"><figcaption>Only this crop is sent to the local formula OCR.</figcaption><img src={cropPreview} alt="Preview of the selected formula crop"/></figure>}
      <div className="row"><button type="button" disabled={disabled || busy || cloudBusy || !crop || crop.width < 0.01 || crop.height < 0.01 || crop.width * crop.height > 0.65} onClick={() => void recognize()}>{busy ? 'Recognizing locally…' : 'Recognize formula as LaTeX'}</button>{busy&&<button type="button" className="stop-ai" onClick={stop}>Stop recognition</button>}{crop && <button type="button" disabled={disabled || busy || cloudBusy} onClick={() => { setCrop(null); setCropPreview(''); setError(''); }}>Clear selection</button>}{onCloudRead && <button type="button" disabled={disabled || busy || cloudBusy} onClick={() => void readWholePage()}>{cloudBusy ? 'Reading whole page…' : 'Read whole page with Cloud AI'}</button>}</div>
    </>}
    {cloudOnly && <div className="formula-crop-image cloud-page-preview"><img src={image} alt={imageLabel} draggable={false}/></div>}
    {cloudOnly && onCloudRead && <button className="primary cloud-page-read" type="button" disabled={disabled || cloudBusy} onClick={() => void readWholePage()}>{cloudBusy ? 'Reading page with Cloud AI…' : 'Read this page with Cloud AI'}</button>}
    {error && <p role="alert" className="error">{error}</p>}
  </section>;
}
