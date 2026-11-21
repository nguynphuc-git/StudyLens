import {useMemo,useState} from 'react';
import {resolveProofScene,type ProofDiagram,type Vec3} from '../geometry-proof';
import {sourceLabel} from '../ui-labels';
import {projectProofPoint,proofFaces,proofSegmentVisibility} from '../geometry-visibility';

export function ProofDiagramView({diagram,disabled=false,onToggle}:{diagram:ProofDiagram;disabled?:boolean;onToggle?:(show:boolean)=>void}) {
  const [yaw,setYaw]=useState(25),[pitch,setPitch]=useState(20);
  const resolved=useMemo(()=>{try{return {points:resolveProofScene(diagram.scene),error:''};}catch(e){return {points:new Map<string,Vec3>(),error:e instanceof Error?e.message:'Cannot display this diagram.'};}},[diagram.scene]);
  const scene=diagram.scene,show=diagram.showAuxiliary;
  if(resolved.error)return <p className="notice error" role="alert">{resolved.error}</p>;
  const points=resolved.points;
  const auxIds=new Set(scene.points.filter(p=>p.auxiliary).map(p=>p.id));
  const project=(v:Vec3):Vec3=>scene.dimension==='2D'?[v[0],-v[1],0]:projectProofPoint(v,yaw,pitch);
  const faces=proofFaces(scene).map(face=>face.map(id=>project(points.get(id)!)));
  const circles=scene.circles.map(c=>{const center=points.get(c.center)!,through=points.get(c.through)!,radius=Math.hypot(...center.map((n,i)=>n-through[i]));return {...c,samples:Array.from({length:97},(_,i)=>project([center[0]+radius*Math.cos(i*Math.PI/48),center[1]+radius*Math.sin(i*Math.PI/48),center[2]]))};});
  const projected=[...points.values()].map(project).concat(circles.flatMap(c=>c.samples));
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),width=Math.max(...xs)-minX,height=Math.max(...ys)-minY;
  const scale=Math.min(500/Math.max(width,.1),320/Math.max(height,.1));
  const canvas=([x,y]:number[])=>[300+(x-minX-width/2)*scale,200+(y-minY-height/2)*scale];
  const at=(id:string)=>canvas(project(points.get(id)!));
  const isAuxEdge=(e:{a:string;b:string;auxiliary?:boolean})=>e.auxiliary||auxIds.has(e.a)||auxIds.has(e.b);
  const isAuxCircle=(c:{auxiliary?:boolean})=>c.auxiliary;
  return <section className="paper proof-board" aria-label="Proof diagram">
    <header className="panel-heading"><h2>Diagram from the givens</h2><span className="source-label">{sourceLabel(diagram.source)} · {scene.dimension}</span></header>
    <p className="subtle">Review the extracted hypotheses against your problem. Checked constructions show one possible configuration, not a proof.</p>
    {!!scene.unresolved.length&&<div className="notice error" role="status"><strong>Some assumptions still need review</strong><ul>{scene.unresolved.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
    <div className="proof-layout"><div>
      <svg className="proof-canvas" viewBox="0 0 600 400" role="img" aria-label={`${scene.dimension} proof diagram. Green marks given objects; violet marks auxiliary constructions. Visible lines are solid. Only occluded portions are dashed.`}>
        {circles.filter(c=>show||!isAuxCircle(c)).map(c=>{
          const pieces=c.samples.slice(1).flatMap((p,i)=>proofSegmentVisibility(c.samples[i],p,faces));
          return <g key={c.id} data-circle={c.id}>{[false,true].map(hidden=>{const d=pieces.filter(p=>p.hidden===hidden).map(p=>`M${canvas(p.a).join(',')}L${canvas(p.b).join(',')}`).join(' ');return d?<path key={String(hidden)} d={d} fill="none" stroke={isAuxCircle(c)?'#8050b5':'#236b59'} strokeWidth="2.5" strokeDasharray={hidden?'6 5':undefined}/>:null;})}</g>;
        })}
        {scene.edges.filter(e=>show||!isAuxEdge(e)).map((e,i)=>{
          const a=project(points.get(e.a)!),b=project(points.get(e.b)!);
          const pieces=faces.length?proofSegmentVisibility(a,b,faces):[{a,b,hidden:scene.dimension==='3D'&&!!e.hidden}];
          return <g key={i} data-edge={`${e.a}-${e.b}`}>{pieces.map((p,j)=>{const [x1,y1]=canvas(p.a),[x2,y2]=canvas(p.b);return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isAuxEdge(e)?'#8050b5':'#236b59'} strokeWidth="2.5" strokeDasharray={p.hidden?'6 5':undefined}/>;})}</g>;
        })}
        {scene.points.filter(p=>show||!p.auxiliary).map(p=>{const [x,y]=at(p.id);return <g key={p.id} fill={p.auxiliary?'#8050b5':'#233d39'}><circle cx={x} cy={y} r="3.5"/><text x={x+7} y={y-9} fontSize="17" paintOrder="stroke" stroke="#fffefa" strokeWidth="4" strokeLinejoin="round">{p.id}</text></g>;})}
      </svg>
      <p className="proof-legend"><span>━ Given objects</span><span>━ Auxiliary constructions</span>{scene.dimension==='3D'&&<span>┄ Occluded portions</span>}</p>
      {scene.dimension==='3D'&&<div className="row proof-rotation"><label>Rotate view<input aria-label="Rotate geometry view" type="range" min="-180" max="180" value={yaw} onChange={e=>setYaw(Number(e.target.value))}/></label><label>Tilt view<input aria-label="Tilt geometry view" type="range" min="5" max="80" value={pitch} onChange={e=>setPitch(Number(e.target.value))}/></label></div>}
    </div><aside>
      <h3>Given</h3><ul>{scene.givens.map((g,i)=><li key={i}>{g}</li>)}</ul><h3>To prove</h3><p>{scene.goal}</p>
      {!!scene.constructions.length&&<><button type="button" disabled={disabled||!onToggle} aria-expanded={show} onClick={()=>onToggle?.(!show)}>{show?'Hide auxiliary constructions':'Show auxiliary constructions'}</button><p className="subtle">Also revealed with hint level 2. Try the starting hint first if you want less help.</p>{show&&<div className="proof-constructions"><h3>Construct in violet</h3><ol>{scene.constructions.map((c,i)=><li key={i}>{c}</li>)}</ol></div>}</>}
      <p className="subtle">Use the hint levels below for the theorem, method and proof. A drawing alone does not establish the conclusion.</p>
    </aside></div>
  </section>;
}
