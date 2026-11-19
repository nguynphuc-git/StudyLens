import type {ProofScene,Vec3} from './geometry-proof';

export function projectProofPoint(v:Vec3,yaw:number,pitch:number):Vec3 {
  const y=yaw*Math.PI/180,p=pitch*Math.PI/180;
  const across=v[0]*Math.sin(y)+v[1]*Math.cos(y);
  return [v[0]*Math.cos(y)-v[1]*Math.sin(y),-v[2]*Math.cos(p)+across*Math.sin(p),across*Math.cos(p)+v[2]*Math.sin(p)];
}

/** Compatibility for saved tetrahedra/pyramids created before explicit faces. */
export function proofFaces(scene:ProofScene):[string,string,string][] {
  if(scene.dimension!=='3D')return [];
  if(scene.faces?.length)return scene.faces;
  const has=(names:string[])=>names.every(id=>scene.points.some(p=>p.id===id));
  const givens=scene.givens.join(' ');
  if(/tetrahedron/i.test(givens)&&has(['A','B','C','D']))return [['A','B','C'],['D','A','B'],['D','B','C'],['D','C','A']];
  if(has(['S','A','B','C','D'])&&/square.*base|square.*plane/i.test(givens))return [['A','B','C'],['A','C','D'],['S','A','B'],['S','B','C'],['S','C','D'],['S','D','A']];
  return [];
}

export interface VisibleSegment {a:Vec3;b:Vec3;hidden:boolean}
const at=(a:Vec3,b:Vec3,t:number):Vec3=>a.map((v,i)=>v+(b[i]-v)*t) as Vec3;

/** Clip a projected line against triangle interiors and compare depth. This
 * splits partially occluded edges, and treats a line on a face as visible. */
export function proofSegmentVisibility(a:Vec3,b:Vec3,faces:Vec3[][]):VisibleSegment[] {
  const hidden:[number,number][]=[];
  for(const [u,v,w] of faces){
    const den=(v[1]-w[1])*(u[0]-w[0])+(w[0]-v[0])*(u[1]-w[1]);
    if(Math.abs(den)<1e-10)continue;
    const weights=(p:Vec3)=>{
      const first=((v[1]-w[1])*(p[0]-w[0])+(w[0]-v[0])*(p[1]-w[1]))/den;
      const second=((w[1]-u[1])*(p[0]-w[0])+(u[0]-w[0])*(p[1]-w[1]))/den;
      return [first,second,1-first-second];
    };
    const wa=weights(a),wb=weights(b);let low=0,high=1;
    const clip=(start:number,end:number)=>{
      const delta=end-start;
      if(Math.abs(delta)<1e-12){if(start<0)high=-1;return;}
      const crossing=-start/delta;
      if(delta>0)low=Math.max(low,crossing);else high=Math.min(high,crossing);
    };
    for(let i=0;i<3;i++)clip(wa[i],wb[i]);
    const depth=(weights:number[])=>weights[0]*u[2]+weights[1]*v[2]+weights[2]*w[2];
    clip(depth(wa)-a[2]-1e-7,depth(wb)-b[2]-1e-7);
    if(high-low>1e-7)hidden.push([low,high]);
  }
  const stops=[...new Set([0,1,...hidden.flat()])].sort((a,b)=>a-b);
  const result:VisibleSegment[]=[];
  for(let i=1;i<stops.length;i++){
    const low=stops[i-1],high=stops[i];if(high-low<1e-7)continue;
    const mid=(low+high)/2,occluded=hidden.some(([from,to])=>mid>from&&mid<to);
    const previous=result.at(-1);
    if(previous?.hidden===occluded)previous.b=at(a,b,high);
    else result.push({a:at(a,b,low),b:at(a,b,high),hidden:occluded});
  }
  return result;
}
