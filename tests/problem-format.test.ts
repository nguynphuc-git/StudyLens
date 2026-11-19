import { describe, expect, it } from 'vitest';
import { convertLatexToMarkup } from 'mathlive/ssr';
import { normalizeProblemText, stripProblemLayout } from '../src/problem-text';
import { mixedTextToLatex } from '../src/math-paste';
import { reconstructPdfText, type PdfTextFragment } from '../src/pdf-layout';
import { symbolCategories, commonSymbols } from '../src/math-symbols';

describe('problem formatting without changing the mathematics',()=>{
  it('keeps short accented Vietnamese words in text spans and set relations in math',()=>{
    const result=mixedTextToLatex('Những khẳng định nào sau đây là đúng? a) 0 ∈ ∅ b) ∅ ⊆ {0} c) {0} ∈ {0}');
    expect(result).toContain(String.raw`\text{Những khẳng định nào sau đây là đúng?}`);
    expect(result).toContain(String.raw`\emptyset`); expect(result).toContain(String.raw`\subseteq`);
    expect(result).toContain(String.raw`\{0\}`); expect(result.match(/\\class\{mathfolio-line\}/g)).toHaveLength(4);
    expect(result).toContain(String.raw`\text{a) }`);
    expect(convertLatexToMarkup(result)).not.toContain('ML__error');
  });
  it('does not confuse zero, a Latin letter and the empty set',()=>{
    const result=stripProblemLayout(mixedTextToLatex('a) 0 ∈ ∅ b) O ∈ {0}'));
    expect(result).toContain(String.raw`0 \in \emptyset`);
    expect(result).toContain(String.raw`O \in \{0\}`);
  });
  it('joins PDF soft wraps while keeping question/option boundaries',()=>{
    expect(normalizeProblemText('Bài 2.1. Những khẳng định\nnào sau đây là đúng?\na)0 ∈ ∅   b)∅ ⊆ {0}\nc) {0} ∈ {0}'))
      .toBe('Bài 2.1. Những khẳng định nào sau đây là đúng?\na) 0 ∈ ∅\nb) ∅ ⊆ {0}\nc) {0} ∈ {0}');
  });
  it('preserves paragraphs, explicit formula line breaks and exponent braces',()=>{
    const explicit='Use \\(\\begin{pmatrix}1&2\\\\\n3&4\\end{pmatrix}\\) here.';
    expect(normalizeProblemText(explicit)).toBe(explicit);
    expect(mixedTextToLatex(explicit)).toContain('\\begin{pmatrix}1&2\\\\\n3&4\\end{pmatrix}');
    expect(mixedTextToLatex('Solve x^{2}+1=0')).toContain('x^{2}');
    expect(normalizeProblemText('First paragraph.\n\nSecond paragraph.')).toBe('First paragraph.\n\nSecond paragraph.');
  });
  it('removes only the application line wrappers before sending a problem to AI',()=>{
    const value=String.raw`\class{mathfolio-line}{\text{a) }\frac{x^{2}}{3}}\class{mathfolio-line}{\text{b) }\{0\}}`;
    expect(stripProblemLayout(value)).toBe(String.raw`\text{a) }\frac{x^{2}}{3}`+'\n'+String.raw`\text{b) }\{0\}`);
    expect(stripProblemLayout(String.raw`\class{mathfolio-line}{incomplete`)).toBe(String.raw`\class{mathfolio-line}{incomplete`);
  });
});

function item(str:string,x:number,y:number,size=12,width=str.length*6):PdfTextFragment { return {str,width,height:size,transform:[size,0,0,size,x,y],hasEOL:true}; }
describe('PDF geometric reading order',()=>{
  it('reassembles fragmented glyphs on the same baseline despite hasEOL and minor vertical noise',()=>{
    expect(reconstructPdfText([item('x',40,700),item('=',58,699),item('2',76,700),item('Find',0,700,12,28)]))
      .toBe('Find x = 2');
  });
  it('attaches superscript digits to the nearby math base and preserves true lines',()=>{
    const result=reconstructPdfText([item('Find',0,700,12,28),item('x',36,700,12,7),item('1',44,706,8,4),item('2',48,706,8,4),item('= 4',60,700),item('a) Next part',0,675)]);
    expect(result).toBe('Find x^{12} = 4\na) Next part');
  });
  it('keeps subscripts distinct from powers and avoids attaching letters from prose',()=>{
    expect(reconstructPdfText([item('a',0,700,12,7),item('n',8,695,8,4),item('+1',25,700)]))
      .toBe('a_{n} +1');
    expect(reconstructPdfText([item('Word',0,700,12,28),item('2',30,706,8,4)]))
      .not.toContain('^{2}');
  });
});

describe('categorized math keyboard',()=>{
  it('has common symbols, unique keys per category and valid LaTeX templates',()=>{
    expect(commonSymbols.every(Boolean)).toBe(true);
    expect(commonSymbols.slice(0,17).some(symbol=>symbol.label==='xₙ')).toBe(true);
    expect(symbolCategories.find(category=>category.name==='Calculus & series')!.symbols.map(symbol=>symbol.latex)).toEqual(expect.arrayContaining([String.raw`\bigcup_{#?}^{#?} #?`,String.raw`\bigcap_{#?}^{#?} #?`]));
    expect(symbolCategories.length).toBeGreaterThanOrEqual(7);
    for (const category of symbolCategories) {
      expect(new Set(category.symbols.map(symbol=>symbol.label)).size).toBe(category.symbols.length);
      for(const symbol of category.symbols) {
        const rendered=convertLatexToMarkup(symbol.latex.replace(/#\?/g,'x'));
        expect(rendered,`${category.name}: ${symbol.label}`).not.toContain('ML__error');
      }
    }
  });
});
