import {describe,it,expect} from 'vitest';
import {linearHelp,localAnswerGuidance} from '../src/local-tutor';
describe('fast local linear help',()=>{
  it('returns exact integer and reduced fraction answers without a model',()=>{
    expect(linearHelp('2x+3=7','hint3')).toContain('x=2');
    expect(linearHelp('3x+1=0','hint3')).toContain(String.raw`x=-\frac{1}{3}`);
    expect(linearHelp('-2x+1=4','hint3')).toContain(String.raw`x=-\frac{3}{2}`);
    expect(linearHelp('2x+3=x+5','hint3')).toContain('x=2');
  });
  it('handles inconsistent and identical equations',()=>{
    expect(linearHelp('x+1=x+2','hint3')).toContain('no solution');
    expect(linearHelp('x+1=x+1','hint3')).toContain('Every real value');
  });
  it('declines conditions, unsupported notation and unrelated chat questions',()=>{
    for(const statement of ['2x=1, x is an integer','x^2=4','2x+y=3','2x=1 or x=2','x/2=4','2x=2.5'])expect(linearHelp(statement,'hint3')).toBeUndefined();
    expect(linearHelp('2x=4','chat','Why can I divide?')).toBeUndefined();
    expect(linearHelp('2x=4','chat','Solve it')).toContain('x=2');
  });
  it('keeps early hints gradual and expands only on request',()=>{
    expect(linearHelp('2x+3=7','hint1')).not.toContain('x=2');
    expect(linearHelp('2x+3=7','hint2')).not.toContain('x=2');
    expect(linearHelp('2x+3=7','hint3','','explained')).toContain('preserve equality');
    expect(linearHelp('2x+3=7','hint3','','brief')).not.toContain('preserve equality');
    expect(localAnswerGuidance()).toContain('every necessary justification');
  });
});
