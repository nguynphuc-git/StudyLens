import {describe,it,expect} from 'vitest';
import {parseProofScene,resolveProofScene,proofDiagramPrompt} from '../src/geometry-proof';
import {exampleProofScene} from '../src/geometry-proof-examples';
import {geometryExamples} from '../src/geometry';
import {mixedTextToLatex} from '../src/math-paste';
import {emptyNotebook,newExercise,putExercise} from '../src/notebook';
import {imo1970PastedProblem} from './fixtures/geometry-contests';
const sample=()=>exampleProofScene(geometryExamples[0].statement)!;
describe('proof constructions',()=>{
  it('constructs all built-in proofs from both prose and pasted LaTeX',()=>{
    for(const e of geometryExamples){
      const scene=exampleProofScene(e.statement)!;expect(scene).toBeDefined();
      expect(resolveProofScene(scene).size).toBe(scene.points.length);
      expect(exampleProofScene(mixedTextToLatex(e.statement)),mixedTextToLatex(e.statement)).toBeDefined();
    }
    expect(exampleProofScene(geometryExamples[0].statement+' Assume PA = 8.')).toBeUndefined();
  });
  it('computes tangency instead of approximating it with guessed endpoints',()=>{
    const p=resolveProofScene(sample()),b=p.get('B')!;
    expect(b[0]).toBeCloseTo(.8);expect(b[1]).toBeCloseTo(-.6);
    expect(b[0]*(2-b[0])+b[1]*(1-b[1])).toBeCloseTo(0);
  });
  it('constructs the reported IMO problem with its right angle, projection and all three altitudes',()=>{
    for(const text of [imo1970PastedProblem,mixedTextToLatex(imo1970PastedProblem,true),imo1970PastedProblem.replace(/2/g,'²')]){
      const scene=exampleProofScene(text)!;expect(scene,text).toBeDefined();
      const p=resolveProofScene(scene),sub=(a:string,b:string)=>p.get(a)!.map((x,i)=>x-p.get(b)![i]);
      const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
      expect(dot(sub('B','D'),sub('C','D'))).toBeCloseTo(0);
      expect(dot(sub('D','H'),sub('A','B'))).toBeCloseTo(0);
      expect(dot(sub('D','H'),sub('A','C'))).toBeCloseTo(0);
      expect(dot(sub('A','H'),sub('B','C'))).toBeCloseTo(0);
      expect(dot(sub('B','H'),sub('A','C'))).toBeCloseTo(0);
      expect(dot(sub('C','H'),sub('A','B'))).toBeCloseTo(0);
      expect(Math.hypot(...sub('A','D'))).not.toBe(Math.hypot(...sub('B','D')));
      expect(scene.goal).toContain('equality');expect(scene.unresolved).toEqual([]);
      expect(scene.points.find(p=>p.id==='H')?.kind).toBe('planeFoot');
    }
  });
  it('does not apply the IMO construction to changed or additional hypotheses',()=>{
    for(const changed of [imo1970PastedProblem.replace('right angle','60 degree angle'),imo1970PastedProblem+' Assume AD = BD.',imo1970PastedProblem.replace('6(AD2','4(AD2'),imo1970PastedProblem.replace('intersection of\nthe altitudes','circumcenter')]){
      expect(exampleProofScene(changed)).toBeUndefined();
    }
  });
  it('rejects a diagram that contradicts its extracted perpendicular hypothesis',()=>{
    const scene=sample();scene.points[2].xyz=[2,2,0];
    expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('perpendicular');
  });
  it('constructs circumcenters and both branches of line/circle intersections',()=>{
    const scene=sample();scene.points=[
      {id:'A',kind:'free',xyz:[1,0,0]},{id:'B',kind:'free',xyz:[0,1,0]},{id:'C',kind:'free',xyz:[-1,0,0]},
      {id:'O',kind:'circumcenter',refs:['A','B','C']},{id:'Q',kind:'free',xyz:[1,0,0]},
      {id:'R',kind:'free',xyz:[2,0,0]},
      {id:'X',kind:'lineCircle',refs:['c','C','A'],branch:1},{id:'Y',kind:'lineCircle',refs:['c','C','A'],branch:-1},
      {id:'U',kind:'circleIntersection',refs:['c','d'],branch:1},{id:'V',kind:'circleIntersection',refs:['c','d'],branch:-1}
    ];scene.circles=[{id:'c',center:'O',through:'A'},{id:'d',center:'Q',through:'R'}];scene.edges=[];scene.relations=[];
    const points=resolveProofScene(parseProofScene(JSON.stringify(scene)));
    expect(points.get('O')).toEqual([0,0,0]);expect(points.get('X')).toEqual([1,0,0]);expect(points.get('Y')).toEqual([-1,0,0]);
    expect(points.get('U')![0]).toBeCloseTo(.5);expect(points.get('U')![1]).toBeCloseTo(Math.sqrt(3)/2);
    expect(points.get('V')![1]).toBeCloseTo(-Math.sqrt(3)/2);
    scene.points[4].xyz=[4,0,0];scene.points[5].xyz=[5,0,0];
    expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('circles do not have');
  });
  it('rejects parallel intersections, invalid tangencies and forward references',()=>{
    const scene=sample();scene.points.push({id:'X',kind:'intersection',refs:['O','A','O','A']});
    expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('parallel');
    const inside=sample();inside.points[2].xyz=[0,.5,0];
    expect(()=>parseProofScene(JSON.stringify(inside))).toThrow('exterior');
    const forward=sample();forward.points.unshift({id:'M',kind:'midpoint',refs:['O','A']});
    expect(()=>parseProofScene(JSON.stringify(forward))).toThrow('before');
  });
  it('rejects malformed model data, unsafe labels, and excessive scenes',()=>{
    for(const raw of ['not JSON','{}','{"dimension":"2D","goal":"Prove"}'])expect(()=>parseProofScene(raw)).toThrow();
    const scene=sample();scene.points[0].id='<script>';
    expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('point');
    expect(()=>parseProofScene(' '.repeat(50001))).toThrow('too large');
  });
  it('extracts valid scene JSON when the model adds prose or markdown fences',()=>{
    const raw=JSON.stringify(sample());
    for(const wrapped of [`Here is the requested diagram:\n${raw}\nLet me know if you need anything else.`,`\`\`\`json\n${raw}\n\`\`\``]){
      expect(parseProofScene(wrapped)).toEqual(sample());
    }
  });
  it('does not assume cyclicity when it is the target and instructs models to report gaps',()=>{
    const prompt=proofDiagramPrompt('Prove ABCD is cyclic.');
    expect(prompt).toContain('do not draw the target circle as a given');expect(prompt).toContain('unresolved');
  });
  it('saves the diagram and auxiliary visibility without losing constructions',()=>{
    const statement=geometryExamples[0].statement;
    const saved=putExercise(emptyNotebook(),{...newExercise(),title:'Tangents',statement,proofDiagram:{statement,scene:sample(),source:'local_construction',showAuxiliary:true}});
    expect(saved.exercises[0].proofDiagram?.scene.constructions).toHaveLength(1);
    expect(saved.exercises[0].proofDiagram?.showAuxiliary).toBe(true);
  });
});
