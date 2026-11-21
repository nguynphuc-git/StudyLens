import {describe,expect,it} from 'vitest';
import {hintProblems,scopedHint} from '../src/hint-problems';
describe('hint coverage across a worksheet',()=>{
  it('keeps shared assumptions and every separately numbered exercise',()=>{
    const parts=hintProblems('Work over the real numbers.\nExercise 4.2.10. Prove a_n=n/(n+3) is Cauchy.\nExercise 4.2.11. Prove every Cauchy sequence is bounded.\nExercise 4.2.12. Show a convergent subsequence determines the limit.');
    expect(parts.map(part=>part.label)).toEqual(['Exercise 4.2.10','Exercise 4.2.11','Exercise 4.2.12']);
    expect(parts.every(part=>part.statement.startsWith('Work over the real numbers.'))).toBe(true);
    expect(parts[1].statement).not.toContain('n/(n+3)');
  });
  it('understands rich Vietnamese headings without cutting off lettered subparts',()=>{
    const parts=hintProblems(String.raw`\class{mathfolio-line}{\text{Bài 2.1. Solve }x^2=1}\class{mathfolio-line}{\text{a) Explain the roots.}}\class{mathfolio-line}{\text{Bài 2.2. Show }a_n\to0}`);
    expect(parts.map(part=>part.label)).toEqual(['Exercise 2.1','Exercise 2.2']);expect(parts[0].statement).toContain('a) Explain');expect(parts[1].statement).toContain(String.raw`a_n\to0`);
  });
  it('handles numbered tasks but does not split on decimal values or inline references',()=>{
    expect(hintProblems('1. Solve x=2\n2. Integrate x\n3. Find the limit')).toHaveLength(3);
    expect(hintProblems('Exercise 1. Use Exercise 2 to show x = 1.5.\na) Start here\nb) Finish')).toHaveLength(1);
  });
  it('reuses only the matching earlier section and drops unlabelled legacy hints',()=>{
    const text='### Exercise 1\nFactor.\n\n### Exercise 2\nUse a bound.\n\n### Exercise 3\nUse continuity.';
    expect(scopedHint(text,'Exercise 2')).toBe('Use a bound.');expect(scopedHint('Only the first exercise was answered.','Exercise 2')).toBe('');
  });
});
