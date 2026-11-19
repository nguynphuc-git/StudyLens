// @vitest-environment happy-dom
import { describe,expect,it } from 'vitest';
import { convertLatexToMarkup } from 'mathlive/ssr';
import { notesLatex } from '../src/note-format';
import { editorPaste } from '../src/math-paste';
import { clipboardMathText } from '../src/clipboard-math';
import { newExercise,emptyNotebook,putExercise,putExerciseNotes } from '../src/notebook';
describe('typeset notes and clipboard sources',()=>{
  it('displays legacy prose, paragraphs and delimited formulas without mutating the stored note',()=>{
    const original='My proof\n\n$$\\frac{1}{2}+x^2=4$$\nNext step';
    const converted=notesLatex(original);
    expect(converted).toContain(String.raw`\frac{1}{2}`);expect(converted).toContain(String.raw`\text{My proof}`);expect(converted.match(/mathfolio-line/g)?.length).toBeGreaterThanOrEqual(3);
    expect(convertLatexToMarkup(converted)).not.toContain('ML__error');expect(original).toContain('$$');
  });
  it('saves rich notes with an explicit format and reopens the exact formula without double escaping',()=>{
    const note=String.raw`\text{By definition }\forall\varepsilon>0,\exists N\in\mathbb{N}:\left|x_n-x_m\right|<\varepsilon`;
    const book=putExercise(emptyNotebook(),{...newExercise(),id:'page',title:'Proof',statement:'x=1',notes:'Old notes'});
    const next=putExerciseNotes(book,'page',note,'latex');
    expect(next.exercises[0].notesFormat).toBe('latex');expect(notesLatex(next.exercises[0].notes,next.exercises[0].notesFormat)).toBe(note);
    expect(book.exercises[0].notes).toBe('Old notes');expect(next.exercises[0].statement).toBe('x=1');
    expect(convertLatexToMarkup(note)).not.toContain('ML__error');
  });
  it('keeps Text paste literal and preserves explicit formulas in Math paste',()=>{
    expect(editorPaste('sin x', 'text')).toBe(String.raw`\text{sin x}`);
    expect(editorPaste(String.raw`$$\frac{x}{2}$$`,'math')).toBe(String.raw`\frac{x}{2}`);
    expect(editorPaste('x^2 = 4',null)).not.toContain(String.raw`\text`);
  });
  it('recovers TeX from copied rendered equations without duplicating their visual fallback',()=>{
    const html=String.raw`<p>Use <span class="katex"><span class="katex-mathml"><math><semantics><mrow>wrong flat text</mrow><annotation encoding="application/x-tex">\frac{1}{2}</annotation></semantics></math></span><span class="katex-html">duplicated visual fraction</span></span> here.</p><p>Next line</p>`;
    const text=clipboardMathText(html,'flat text');
    expect(text).toBe('Use \\(\\frac{1}{2}\\) here.\nNext line');
    expect(notesLatex(text)).toContain(String.raw`\frac{1}{2}`);expect(text).not.toContain('duplicated');
  });
  it('discards HTML execution content and falls back to plain text when no exact formula is available',()=>{
    expect(clipboardMathText('<b>words</b><script>alert(1)</script>','words')).toBe('words');
    expect(clipboardMathText('<img onerror="alert(1)"><math><annotation encoding="application/x-tex">x^2</annotation></math><script>bad()</script>','x2')).toBe(String.raw`\(x^2\)`);
    expect(clipboardMathText('x'.repeat(200001),'fallback')).toBe('fallback');
  });
});
