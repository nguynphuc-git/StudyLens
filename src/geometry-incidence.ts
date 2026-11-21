import {parseProofScene,resolveProofScene,type ProofScene,type ProofPoint} from './geometry-proof';

/** Replace guessed line-bound points with dependent constructions. No givens or
 * relations are removed; accept only if the entire scene validates afterwards. */
export function repairProofIncidences(input:ProofScene):ProofScene|undefined {
  const scene=structuredClone(input);
  let changed=false;
  for(let index=0;index<scene.points.length;index++){
    const point=scene.points[index];if(point.kind!=='free')continue;
    const earlier=new Set(scene.points.slice(0,index).map(p=>p.id));
    const candidates=scene.relations.filter(r=>(r.kind==='collinear'||r.kind==='between')&&r.refs.includes(point.id))
      .map(r=>r.refs.filter(id=>id!==point.id)).filter(refs=>refs.length===2&&refs.every(id=>earlier.has(id)));
    const lines=[...new Map(candidates.map(refs=>[[...refs].sort().join(','),refs])).values()];
    if(!lines.length)continue;
    let construction:ProofPoint|undefined;
    for(const r of scene.relations){
      if(r.kind!=='parallel'||r.refs.filter(id=>id===point.id).length!==1)continue;
      const [a,b,c,d]=r.refs;
      const refs=(a===point.id||b===point.id)?[a===point.id?b:a,c,d,...lines[0]]:[c===point.id?d:c,a,b,...lines[0]];
      if(refs.every(id=>earlier.has(id))){construction={id:point.id,kind:'parallelIntersection',refs};break;}
    }
    if(!construction&&lines.length>1)construction={id:point.id,kind:'intersection',refs:[...lines[0],...lines[1]]};
    if(!construction){
      // A projection determines the free parameter; dependencies are resolved
      // before fitting, so earlier repairs propagate to this point too.
      try{
        const resolved=resolveProofScene({...scene,points:scene.points.slice(0,index),circles:scene.circles.filter(c=>earlier.has(c.center)&&earlier.has(c.through)),edges:[],relations:[],faces:[]});
        const [a,b]=lines[0].map(id=>resolved.get(id)!);if(!a||!b)continue;
        const direction=b.map((x,i)=>x-a[i]),den=direction.reduce((s,x)=>s+x*x,0);if(den<1e-10)continue;
        const t=direction.reduce((s,x,i)=>s+x*(point.xyz![i]-a[i]),0)/den;
        construction={id:point.id,kind:'onLine',refs:lines[0],t};
      }catch{continue;}
    }
    scene.points[index]={...construction,...(point.auxiliary!==undefined?{auxiliary:point.auxiliary}:{})};changed=true;
  }
  if(!changed)return;
  try{return parseProofScene(JSON.stringify(scene));}catch{return;}
}

/** Separate coincident free endpoints only when the complete scene still validates. */
export function repairZeroLengthProofEdge(input:ProofScene,error:unknown):ProofScene|undefined {
  if(!(error instanceof Error))return;
  const edge=input.edges.find(candidate=>error.message.includes(`edge ${candidate.a}${candidate.b} has zero length`));
  if(!edge)return;
  const offsets=[.25,-.25,.5,-.5,1,-1,2,-2];
  for(const id of [edge.a,edge.b]){
    const point=input.points.find(candidate=>candidate.id===id);
    if(point?.kind!=='free'||!point.xyz)continue;
    for(let axis=0;axis<(input.dimension==='2D'?2:3);axis++){
      for(const offset of offsets){
        const scene=structuredClone(input);
        const moved=scene.points.find(candidate=>candidate.id===id)!;
        moved.xyz![axis]+=offset;
        try{return parseProofScene(JSON.stringify(scene));}catch{}
      }
    }
  }
}

/** Nudge only free sketch coordinates used by a failed intersection; keep a
 * candidate only when the complete scene, including every relation, validates. */
export function repairDegenerateProofIntersection(input:ProofScene,error:unknown):ProofScene|undefined {
  if(!(error instanceof Error))return;
  const match=/intersection for point ([A-Za-z][A-Za-z0-9_']{0,11}) has (?:parallel or degenerate|skew) lines/.exec(error.message);
  if(!match)return;
  const intersection=input.points.find(point=>point.id===match[1]);
  if(!intersection||!['intersection','parallelIntersection'].includes(intersection.kind))return;
  const candidates=(intersection.refs??[])
    .map(id=>input.points.find(point=>point.id===id))
    .filter((point):point is ProofPoint=>point?.kind==='free'&&!!point.xyz)
    .sort((a,b)=>Number(!!b.auxiliary)-Number(!!a.auxiliary));
  const offsets=[.1,-.1,.25,-.25,.5,-.5,1,-1,2,-2];
  for(const point of candidates){
    for(let axis=0;axis<(input.dimension==='2D'?2:3);axis++){
      for(const offset of offsets){
        const scene=structuredClone(input);
        const moved=scene.points.find(candidate=>candidate.id===point.id)!;
        moved.xyz![axis]+=offset;
        try{return parseProofScene(JSON.stringify(scene));}catch{}
      }
    }
  }
}
