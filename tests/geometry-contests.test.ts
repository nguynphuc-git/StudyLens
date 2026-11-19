import {describe,it,expect} from 'vitest';
import {parseProofScene,resolveProofScene,proofDiagramPrompt} from '../src/geometry-proof';
import {geometryHelp,geometryPromptContext} from '../src/geometry';
import {mixedTextToLatex} from '../src/math-paste';
import {contestProofs,imo1970Scene,asmo2022Scene} from './fixtures/geometry-contests';
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
describe('sourced olympiad geometry regression cases (not a live LLM benchmark)',()=>{
  it.each(contestProofs)('preserves $id through LaTeX input and never routes it to a shape calculator',({statement})=>{
    const latex=mixedTextToLatex(statement),prompt=proofDiagramPrompt(latex);
    expect(prompt).toContain(JSON.stringify({statement:latex}));
    expect(geometryHelp(statement,'hint3')).toBeUndefined();
    expect(geometryHelp(latex,'hint3')).toBeUndefined();
  });
  it('IMO 1970 P5 satisfies the spatial hypotheses in unequal-axis and equality configurations',()=>{
    for(const dimensions of [[2,3,4],[3,3,3],[.7,2.1,4.3]]){
      const scene=parseProofScene(JSON.stringify(imo1970Scene(...dimensions))),p=resolveProofScene(scene);
      const A=p.get('A')!,B=p.get('B')!,C=p.get('C')!,D=p.get('D')!;
      const lhs=(distance(A,B)+distance(B,C)+distance(C,A))**2;
      const rhs=6*(distance(A,D)**2+distance(B,D)**2+distance(C,D)**2);
      expect(lhs).toBeLessThanOrEqual(rhs+1e-8);
      if(dimensions[0]===dimensions[1])expect(lhs).toBeCloseTo(rhs);else expect(lhs).toBeLessThan(rhs);
    }
    const broken=imo1970Scene();broken.points.find(p=>p.id==='A')!.xyz=[2,1,0];
    expect(()=>parseProofScene(JSON.stringify(broken))).toThrow('perpendicular');
  });
  it('IMO 1968 P4 remains an existence proof and passes a nonregular configuration check',()=>{
    const vertices=[[0,0,0],[4,0,0],[1,3,0],[.5,1,4]];
    const scene=imo1970Scene();scene.points=vertices.map((xyz,i)=>({id:'ABCD'[i],kind:'free',xyz:xyz as [number,number,number]}));scene.edges=scene.edges.filter(e=>e.a!=='H'&&e.b!=='H');scene.relations=[];scene.constructions=[];scene.givens=['ABCD is an arbitrary tetrahedron.'];scene.goal=contestProofs[0].statement;
    expect(resolveProofScene(parseProofScene(JSON.stringify(scene))).size).toBe(4);
    expect(vertices.some((v,i)=>{const lengths=vertices.filter((_,j)=>j!==i).map(w=>distance(v,w)).sort((a,b)=>a-b);return lengths[0]+lengths[1]>lengths[2];})).toBe(true);
    expect(geometryPromptContext(contestProofs[0].statement)).toContain('do not assume the conclusion');
  });
  it('ASMO 2022 Secondary P25 reproduces the published answer 10 from midpoint and intersection constructions',()=>{
    const scene=parseProofScene(JSON.stringify(asmo2022Scene())),p=resolveProofScene(scene);
    expect(distance(p.get('B')!,p.get('C')!)).toBeCloseTo(2*distance(p.get('A')!,p.get('B')!));
    expect(distance(p.get('A')!,p.get('D')!)**2/distance(p.get('I')!,p.get('M')!)**2).toBeCloseTo(10);
  });
});
