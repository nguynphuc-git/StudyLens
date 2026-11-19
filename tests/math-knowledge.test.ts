import { describe, expect, it, vi } from 'vitest';
import { polynomialEquation, formulaReference, referenceContext } from '../src/math-knowledge';
import { notebookAI } from '../src/ai';
describe('verified local equation references', () => {
  it.each([
    ['x/2+x^2=10',2], [String.raw`\frac{x}{2}+x^{2}=10\text{ solve x}`,2], ['2x+3=7',1],
    ['(x+1)^2=x^2+3',1], ['-x^2+x=x^2',2], ['x^2=x^2+2x',1], ['y^2+2y+1=0',2], ['x^2=2*x^2-1',2]
  ])('recognizes supported equation %s', (statement, degree) => { expect(polynomialEquation(statement)?.degree).toBe(degree); });
  it.each(['x^3=1','x^2/(x+1)=0',String.raw`\sqrt{x}+x^2=2`,String.raw`\sin(x)+x^2=1`,'differentiate x^2','x+y=3','1=1','x^2=','x^2=2=3','x^2+3=NaN','0.000000000001x^2+x=1','0.000000000001*x*x*x+x=1'])('defers unsupported problem %s to AI', statement => { expect(formulaReference(statement)).toBeUndefined(); });
  it('gives the quadratic formula and its conditions, never numeric roots', () => {
    const text=formulaReference(String.raw`\frac{x}{2}+x^{2}=10`)!;
    expect(text).toContain('Quadratic formula'); expect(text).toContain(String.raw`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`);
    expect(text).toContain(String.raw`a\ne0`); expect(text).toContain('discriminant'); expect(text).not.toContain('sqrt{161}');
  });
  it('reports a reference source without claiming the language model ran', async () => {
    const onText=vi.fn();
    const result=await notebookAI({purpose:'knowledge',statement:'x/2+x^2=10',knowledge:'',hints:[],messages:[],question:'',route:'local',cloudAllowed:false},onText);
    expect(result.source).toBe('local_reference'); expect(onText).toHaveBeenCalledWith(result.text);
  });
  it('supplies conditional formula cues for other mathematical topics', () => {
    expect(referenceContext('find the derivative of x^2')).toContain('Chain rule');
    expect(referenceContext('integrate 1/x')).toContain(String.raw`\ln|x|`);
    expect(referenceContext('conditional probability')).toContain('P(B)>0');
    expect(referenceContext('arithmetic sequence')).toContain('a_n');
    expect(referenceContext('x+2=3')).toBe('');
  });
});
