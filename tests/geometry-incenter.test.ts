import {describe,it,expect} from 'vitest';
import {parseProofScene,resolveProofScene,assertProofRepairPreservesGivens,proofDiagramPrompt,type ProofScene,type Vec3} from '../src/geometry-proof';
import {isoscelesIncenterConstruction,isoscelesIncenterProblem,olympiadProofScene} from '../src/geometry-olympiad';
import {mixedTextToLatex} from '../src/math-paste';
import {incenterPastedProblem} from './fixtures/geometry-contests';

const angle=(a:Vec3,b:Vec3,c:Vec3)=>{
  const u=a.map((x,i)=>x-b[i]),v=c.map((x,i)=>x-b[i]);
  return Math.acos(u.reduce((sum,x,i)=>sum+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)))*180/Math.PI;
};
describe('incenters and fixed angles',()=>{
  it('recognizes the reported PDF text, editor conversion and LaTeX angle notation',()=>{
    const latex=isoscelesIncenterProblem.replaceAll('∠','\\angle ').replace('45°','45^{\\circ}');
    for(const input of [incenterPastedProblem,mixedTextToLatex(incenterPastedProblem,true),latex,mixedTextToLatex(latex,true),isoscelesIncenterProblem.replace('incentre','incenter')]){
      const scene=olympiadProofScene(input)!;expect(scene,input).toBeDefined();
      expect(scene.unresolved).toEqual([]);
      expect(scene.points.find(p=>p.id==='K')?.kind).toBe('incenter');
      expect(scene.relations).toContainEqual({kind:'angle',refs:['B','E','K'],degrees:45,source:'angle BEK = 45 degrees'});
    }
  });
  it('checks both admissible configurations independently, including internal K and both bisectors',()=>{
    for(const [height,apex] of [[1,90],[Math.sqrt(3),60]]){
      const p=resolveProofScene(isoscelesIncenterConstruction(height));
      const [a,b,c,d,e,k]=['A','B','C','D','E','K'].map(id=>p.get(id)!);
      expect(angle(b,e,k)).toBeCloseTo(45,9);expect(angle(c,a,b)).toBeCloseTo(apex,9);
      expect(angle(b,a,d)).toBeCloseTo(angle(d,a,c),9);
      expect(angle(a,b,e)).toBeCloseTo(angle(e,b,c),9);
      // ADC is right at D: distances of K to AD, DC and AC must coincide.
      const toAC=Math.abs(height*k[0]+k[1]-height)/Math.hypot(height,1);
      expect(k[0]).toBeGreaterThan(0);expect(k[1]).toBeGreaterThan(0);
      expect(height*k[0]+k[1]).toBeLessThan(height);
      expect(k[0]).toBeCloseTo(k[1],10);expect(toAC).toBeCloseTo(k[0],10);
    }
    expect(()=>isoscelesIncenterConstruction(2)).toThrow('angle: B, E, K');
  });
  it('constructs a scalene incenter and internal angle bisector in a spatial plane',()=>{
    const scene:ProofScene={dimension:'3D',givens:['A scalene triangle.'],goal:'Locate its incenter.',
      points:[{id:'A',kind:'free',xyz:[2,3,4]},{id:'B',kind:'free',xyz:[2,7,4]},{id:'C',kind:'free',xyz:[2,3,7]},
        {id:'I',kind:'incenter',refs:['A','B','C']},{id:'T',kind:'angleBisector',refs:['B','A','C']}],
      edges:[],circles:[],relations:[],constructions:[],unresolved:[]};
    const p=resolveProofScene(parseProofScene(JSON.stringify(scene)));
    expect(p.get('I')).toEqual([2,4,5]);
    expect(p.get('T')![2]).toBeCloseTo(4+4/3,10);
    expect(angle(p.get('A')!,p.get('B')!,p.get('T')!)).toBeCloseTo(angle(p.get('T')!,p.get('B')!,p.get('C')!),10);
    scene.points[2].xyz=[2,9,4];expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('nondegenerate triangle');
  });
  it('rejects invalid angles, wrong point counts and attempts to change the angle during repair',()=>{
    for(const degrees of [undefined,null,'45',0,180,360]){
      const scene=isoscelesIncenterConstruction();(scene.relations.at(-1) as any).degrees=degrees;
      expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('invalid angle constraint');
    }
    const scene=isoscelesIncenterConstruction();scene.points.at(-1)!.refs=['A','D'];
    expect(()=>parseProofScene(JSON.stringify(scene))).toThrow('construction references');
    const before=isoscelesIncenterConstruction(),after=structuredClone(before);after.relations.at(-1)!.degrees=50;
    expect(()=>assertProofRepairPreservesGivens(before,after)).toThrow('removed a given constraint');
    for(const id of ['K','E']){
      const replaced=structuredClone(before),index=replaced.points.findIndex(p=>p.id===id);
      replaced.points[index]={id,kind:'free',xyz:resolveProofScene(before).get(id)!};
      expect(()=>assertProofRepairPreservesGivens(before,replaced)).toThrow('removed a given constraint');
    }
    const supplementary=isoscelesIncenterConstruction();supplementary.relations.at(-1)!.degrees=135;
    expect(()=>parseProofScene(JSON.stringify(supplementary))).toThrow('angle: B, E, K');
  });
  it('does not match changed hypotheses or an extended problem and exposes general constructions to AI',()=>{
    for(const input of [incenterPastedProblem.replace('45◦','40◦'),incenterPastedProblem.replace('AB= AC','AB= BC'),incenterPastedProblem.replace('triangle ADC','triangle ABC'),incenterPastedProblem+' Also assume AC = BC.']){
      expect(olympiadProofScene(input)).toBeUndefined();
    }
    const prompt=proofDiagramPrompt('Any triangle problem');
    expect(prompt).toContain('kind:"incenter"');expect(prompt).toContain('kind:"angleBisector"');expect(prompt).toContain('degrees:45');
  });
});
