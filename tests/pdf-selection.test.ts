import {describe,expect,it} from 'vitest';
import {convertLatexToMarkup} from 'mathlive/ssr';
import {reviewPdfQuestions,combinePdfQuestions} from '../src/pdf-selection';
import {splitPdfQuestions} from '../src/pdf-questions';
describe('reviewed PDF questions',()=>{
  it('normalizes recognized fractions, scripts and relations into editable math immediately',()=>{
    const source=String.raw`Bài 2.1. Chứng minh rằng \(a_n=\frac{n}{n+3}\).
a) 0 ∈ ∅ b) ∅ ⊆ {0}`;
    const [question]=reviewPdfQuestions([{page:1,text:source}]);
    expect(question.text).toBe(source);expect(question.latex).toContain(String.raw`a_n=\frac{n}{n+3}`);expect(question.latex).toContain(String.raw`\subseteq`);
    expect(convertLatexToMarkup(question.latex)).not.toContain('ML__error');
  });
  it('combines only selected questions in page order without reparsing edited TeX or mutating entries',()=>{
    const questions=reviewPdfQuestions([{page:2,text:'2. Next'},{page:1,text:'1. First'},{page:2,text:'3. Omit'}]);
    questions[1].selected=true;questions[0].latex=String.raw`\frac{a_n}{2}`;questions[1].latex=String.raw`\text{First step }x^2=4`;
    const before=structuredClone(questions),combined=combinePdfQuestions(questions);
    expect(combined.indexOf('First step')).toBeLessThan(combined.indexOf(String.raw`\frac{a_n}{2}`));expect(combined).not.toContain('Omit');expect(questions).toEqual(before);
    expect(convertLatexToMarkup(combined)).not.toContain('ML__error');
  });
  it('keeps recognized cloud question boundaries on the active page',()=>{
    const parsed=splitPdfQuestions([{page:3,text:String.raw`1. Solve \(x^2=4\)
2. Find \(a_n\)`}]);
    const reviewed=reviewPdfQuestions(parsed,'cloud-1');
    expect(reviewed).toHaveLength(2);expect(reviewed.map(question=>question.page)).toEqual([3,3]);expect(new Set(reviewed.map(question=>question.id)).size).toBe(2);
    expect(reviewed[1].latex).toContain('a_n');
  });
});
