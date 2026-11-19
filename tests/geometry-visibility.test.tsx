import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProofDiagramView} from '../src/components/ProofDiagramView';
import {proofFaces,projectProofPoint,proofSegmentVisibility} from '../src/geometry-visibility';
import {imo2019Construction,imo1970Problem} from '../src/geometry-olympiad';
import {exampleProofScene} from '../src/geometry-proof-examples';
import {resolveProofScene,type Vec3,type ProofScene} from '../src/geometry-proof';

function render(scene:ProofScene){return renderToStaticMarkup(<ProofDiagramView diagram={{scene,statement:'Test',source:'local_construction',showAuxiliary:true}}/>);}
describe('geometry line visibility',()=>{
  it('draws visible given and auxiliary 2D objects solid, even with stale hidden flags',()=>{
    const scene=imo2019Construction();scene.edges.forEach(e=>e.hidden=true);
    scene.points.push({id:'O',kind:'free',xyz:[0,0,0],auxiliary:true});scene.circles.push({id:'c',center:'O',through:'A',auxiliary:true});
    const markup=render(scene);
    expect(markup).toContain('stroke="#8050b5"');expect(markup).toContain('stroke="#236b59"');
    expect(markup).not.toContain('stroke-dasharray');expect(markup).not.toContain('violet dashed');
  });
  it('splits only the portion behind a face and keeps a line on its surface solid',()=>{
    const triangle:Vec3[][]=[[[0,0,1],[2,0,1],[0,2,1]]];
    const pieces=proofSegmentVisibility([-1,.5,0],[3,.5,0],triangle);
    expect(pieces.map(p=>p.hidden)).toEqual([false,true,false]);
    expect(pieces[1].a[0]).toBeCloseTo(0);expect(pieces[1].b[0]).toBeCloseTo(1.5);
    expect(proofSegmentVisibility([0,0,1],[2,0,1],triangle).every(p=>!p.hidden)).toBe(true);
    expect(proofSegmentVisibility([-1,.5,2],[3,.5,2],triangle).every(p=>!p.hidden)).toBe(true);
  });
  it('recomputes occluded tetrahedron edges when the camera rotates, ignoring stale edge flags',()=>{
    const scene=exampleProofScene(imo1970Problem)!,points=resolveProofScene(scene),faces=proofFaces(scene);
    const hidden=(yaw:number)=>{
      const project=(p:Vec3)=>projectProofPoint(p,yaw,20),triangles=faces.map(f=>f.map(id=>project(points.get(id)!)));
      return scene.edges.slice(0,6).filter(e=>proofSegmentVisibility(project(points.get(e.a)!),project(points.get(e.b)!),triangles).some(p=>p.hidden)).map(e=>`${e.a}${e.b}`);
    };
    expect(hidden(25).length).toBeGreaterThan(0);expect(hidden(25)).not.toEqual(hidden(205));
    const before=render(scene);scene.edges.forEach(e=>e.hidden=!e.hidden);
    expect(render(scene)).toBe(before);
  });
  it('keeps auxiliary color independent of occlusion',()=>{
    const scene=exampleProofScene(imo1970Problem)!;
    // A segment outside the solid is auxiliary and visible. DH is inside it.
    scene.points.push({id:'X',kind:'free',xyz:[5,5,5],auxiliary:true},{id:'Y',kind:'free',xyz:[6,6,5],auxiliary:true});
    scene.edges.push({a:'X',b:'Y',auxiliary:true});scene.edges.find(e=>e.a==='D'&&e.b==='H')!.auxiliary=true;
    const markup=render(scene),outside=markup.match(/<g data-edge="X-Y">(.*?)<\/g>/)![1],inside=markup.match(/<g data-edge="D-H">(.*?)<\/g>/)![1];
    expect(outside).toContain('stroke="#8050b5"');expect(outside).not.toContain('stroke-dasharray');
    expect(inside).toContain('stroke="#8050b5"');expect(inside).toContain('stroke-dasharray="6 5"');
  });
});
