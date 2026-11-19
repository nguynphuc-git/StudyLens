import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { DiagramStroke, DiagramTool, GeometryDiagram, GeometryFigure } from '../geometry-diagram';

const palette = [
  { name: 'Coral', value: '#d34f35' },
  { name: 'Blue', value: '#2469c6' },
  { name: 'Violet', value: '#8050b5' },
  { name: 'Gold', value: '#bf8214' },
];
const pointLabels: Record<GeometryFigure, { x: number; y: number }[]> = {
  triangle: [{ x: 200, y: 38 }, { x: 63, y: 220 }, { x: 337, y: 220 }],
  quadrilateral: [{ x: 76, y: 66 }, { x: 309, y: 64 }, { x: 338, y: 213 }, { x: 55, y: 213 }],
  rectangle: [{ x: 86, y: 65 }, { x: 314, y: 65 }, { x: 314, y: 213 }, { x: 86, y: 213 }],
  trapezoid: [{ x: 122, y: 65 }, { x: 278, y: 65 }, { x: 328, y: 212 }, { x: 72, y: 212 }],
  circle: [], prism: [], pyramid: [], cylinder: [], cone: [], sphere: [],
};

function Figure({ figure }: { figure: GeometryFigure }) {
  const common = { fill: 'none', stroke: 'var(--diagram-ink, #486750)', strokeWidth: 3, strokeLinejoin: 'round' as const };
  switch (figure) {
    case 'triangle': return <path {...common} d="M200 45 70 210h260Z"/>;
    case 'quadrilateral': return <path {...common} d="M86 72 305 66l34 140-272 10Z"/>;
    case 'rectangle': return <path {...common} d="M86 68h228v145H86Z"/>;
    case 'trapezoid': return <path {...common} d="M125 68h150l55 145H70Z"/>;
    case 'circle': return <><circle {...common} cx="200" cy="130" r="85"/><path {...common} d="M200 130h85"/><circle cx="200" cy="130" r="4" fill="var(--diagram-ink, #486750)"/></>;
    case 'prism': return <g {...common}><path d="M65 95h185v120H65z M65 95l65-58h185v120l-65 58 M250 95l65-58M130 37v120h185M65 215l65-58"/></g>;
    case 'pyramid': return <g {...common}><path d="M200 38 70 200 200 226 330 200Z M70 200l130-20 130 20M200 38v142"/></g>;
    case 'cylinder': return <g {...common}><path d="M112 68v125c0 39 176 39 176 0V68"/><ellipse cx="200" cy="68" rx="88" ry="31"/><path d="M112 193c0-40 176-40 176 0M200 68v125" strokeDasharray="8 7"/></g>;
    case 'cone': return <g {...common}><path d="m200 42-96 158c0 39 192 39 192 0Z M104 200c0-39 192-39 192 0M200 42v158" strokeDasharray="none"/></g>;
    case 'sphere': return <g {...common}><circle cx="200" cy="130" r="86"/><ellipse cx="200" cy="130" rx="86" ry="29" strokeDasharray="8 7"/><path d="M200 130h86"/></g>;
  }
}

export function GeometryDiagramEditor({ diagram, onChange, onCreate, onAnalyze, disabled = false }: {
  diagram?: GeometryDiagram;
  onChange: (diagram: GeometryDiagram) => void;
  onCreate: () => void;
  onAnalyze: () => void;
  disabled?: boolean;
}) {
  const [tool, setTool] = useState<DiagramTool>('pen');
  const [color, setColor] = useState(palette[0].value);
  const [label, setLabel] = useState('');
  const [drawing, setDrawing] = useState<{ x: number; y: number }[]>([]);
  const svg = useRef<SVGSVGElement>(null);

  function coordinate(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(400, (event.clientX - rect.left) * 400 / rect.width)),
      y: Math.max(0, Math.min(260, (event.clientY - rect.top) * 260 / rect.height)),
    };
  }
  function startDrawing(event: PointerEvent<SVGSVGElement>) {
    if (!diagram || disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = coordinate(event);
    if (tool === 'label') {
      const text = label.trim();
      if (!text) return;
      onChange({ ...diagram, strokes: [...diagram.strokes, { id: crypto.randomUUID(), tool, color, points: [point], text }] });
      setLabel('');
      return;
    }
    setDrawing([point]);
  }
  function moveDrawing(event: PointerEvent<SVGSVGElement>) {
    if (drawing.length && (event.buttons !== 0 || event.currentTarget.hasPointerCapture(event.pointerId))) {
      const next = coordinate(event);
      setDrawing(current => current.length ? [...current, next] : current);
    }
  }
  function finishDrawing() {
    if (!diagram || !drawing.length) return;
    const points = tool === 'line' && drawing.length > 1 ? [drawing[0], drawing[drawing.length - 1]] : drawing;
    if (points.length > 1) onChange({ ...diagram, strokes: [...diagram.strokes, { id: crypto.randomUUID(), tool, color, points }] });
    setDrawing([]);
  }
  const active = diagram ?? undefined;
  const vertexPositions = active ? pointLabels[active.figure] : [];
  const visibleStrokes = [...(active?.strokes ?? []), ...(drawing.length > 1 ? [{ id: 'preview', tool, color, points: drawing } as DiagramStroke] : [])];

  return <section className="paper geometry-board" aria-label="Geometry diagram">
    <header className="geometry-board-heading">
      <div><p className="eyebrow">DIAGRAM & CONSTRUCTION</p><h2>Geometry diagram</h2><p className="subtle">The sketch is schematic, not to scale. Only the problem statement defines geometric facts.</p></div>
      {diagram && <div className="row"><button type="button" className="subtle-button" onClick={onCreate} disabled={disabled}>Redraw from problem</button><button type="button" className="primary" onClick={onAnalyze} disabled={disabled}>Analyze problem</button></div>}
    </header>
    {!active ? <div className="geometry-empty"><p>Create a labeled schematic from the current problem, or import a PDF/image and review its transcription first.</p><button className="primary" type="button" onClick={onCreate} disabled={disabled}>Create diagram from problem</button></div> : <>
      <div className="geometry-board-layout">
        <div>
          <div className="diagram-canvas-wrap">
            <svg ref={svg} className="geometry-canvas" viewBox="0 0 400 260" role="application" aria-label={`${active.figure} schematic. Choose a drawing tool, then draw on the diagram.`} onPointerDown={startDrawing} onPointerMove={moveDrawing} onPointerUp={finishDrawing} onPointerCancel={finishDrawing}>
              <Figure figure={active.figure}/>
              {vertexPositions.map((point, index) => {
                const text = active.vertices[index] ?? '';
                if (!text) return null;
                return <text key={`vertex-${index}`} x={point.x} y={point.y} className="diagram-vertex">{text}</text>;
              })}
              {active.figure === 'circle' && <text x="237" y="119" className="diagram-vertex">r</text>}
              {visibleStrokes.map(stroke => {
                if (stroke.tool === 'label') return <text key={stroke.id} x={stroke.points[0].x} y={stroke.points[0].y} fill={stroke.color} className="diagram-annotation-label">{stroke.text}</text>;
                const points = stroke.points.map(point => `${point.x},${point.y}`).join(' ');
                return <polyline key={stroke.id} points={points} fill="none" stroke={stroke.color} strokeWidth={stroke.tool === 'line' ? 3 : 4} strokeLinecap="round" strokeLinejoin="round"/>;
              })}
            </svg>
          </div>
          <p className="diagram-caption">Schematic only · not to scale · colored marks are your constructions</p>
        </div>
        <aside className="diagram-tools" aria-label="Drawing tools">
          <strong>Add a construction</strong>
          <div className="diagram-tool-buttons" role="group" aria-label="Drawing mode">
            <button type="button" disabled={disabled} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>Freehand</button>
            <button type="button" disabled={disabled} aria-pressed={tool === 'line'} onClick={() => setTool('line')}>Line</button>
            <button type="button" disabled={disabled} aria-pressed={tool === 'label'} onClick={() => setTool('label')}>Label</button>
          </div>
          {tool === 'label' && <label>Label text<input aria-label="Label text" disabled={disabled} maxLength={24} value={label} onChange={event => setLabel(event.target.value)} placeholder="e.g. midpoint M"/></label>}
          <div className="diagram-color-picker"><span>Mark color</span><div role="group" aria-label="Mark color">{palette.map(swatch => <button key={swatch.value} type="button" disabled={disabled} aria-label={`${swatch.name} mark`} aria-pressed={color === swatch.value} style={{ '--swatch': swatch.value } as React.CSSProperties} onClick={() => setColor(swatch.value)}/>)}</div></div>
          <div className="row"><button type="button" disabled={disabled||!active.strokes.length} onClick={() => onChange({ ...active, strokes: active.strokes.slice(0, -1) })}>Undo</button><button type="button" disabled={disabled||!active.strokes.length} onClick={() => onChange({ ...active, strokes: [] })}>Clear marks</button></div>
          {!!active.givens.length && <div className="diagram-givens"><strong>Extracted givens · review against the file</strong><ul>{active.givens.map((given, index) => <li key={`${given}-${index}`}>{given}</li>)}</ul></div>}
        </aside>
      </div>
      <p className="diagram-workflow">Guided workflow: analyze the key concepts first, then open the starting hint, method, and full worked solution when you are ready.</p>
    </>}
  </section>;
}
