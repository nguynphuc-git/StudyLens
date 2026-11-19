import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizeChatMath, latexMessageParts } from '../src/chat-format';
import { MarkdownView } from '../src/components/MarkdownView';
import { LatexMessage } from '../src/components/LatexMessage';

describe('readable and safe chat content', () => {
  it('renders common AI math delimiters inline and in display blocks', () => {
    const html = renderToStaticMarkup(<MarkdownView value={String.raw`Use \(r^2\). Then \[A=\pi r^2\]`}/>);
    expect(html.match(/class="katex"/g)).toHaveLength(2);
    expect(html).toContain('katex-display');
    expect(html).not.toContain('\\(');
  });

  it('preserves literal math delimiters inside code, existing formulas and escaped strings', () => {
    const source = '```latex\n\\[x^2\\]\n```\n\nUse `\\(x\\)` and $\\text{\\(literal\\)}$.\n\n    \\[indented\\]\n\\\\(literal)';
    expect(normalizeChatMath(source)).toBe(source);
    expect(normalizeChatMath('~~~\n\\[x\\]\n~~~\n\\(y\\)')).toBe('~~~\n\\[x\\]\n~~~\n$y$');
  });

  it('keeps long user prose as native wrapping text and preserves fractions and line breaks', () => {
    const value = String.raw`\class{mathfolio-line}{\text{Why is }\frac{x^2}{2}\text{ positive?}}\class{mathfolio-line}{\text{Please explain.}}`;
    const parts = latexMessageParts(value);
    expect(parts).toContainEqual({ kind: 'text', value: 'Why is ' });
    expect(parts).toContainEqual({ kind: 'math', value: String.raw`\frac{x^2}{2}` });
    expect(parts.filter(part => part.kind === 'break')).toHaveLength(1);
    const html = renderToStaticMarkup(<LatexMessage value={value}/>);
    expect(html).toContain('latex-message-text');
    expect(html).toContain('<br/>');
    expect(html).toContain('katex');
    expect(html).not.toContain('math-field');
  });

  it('keeps nested mathematical text intact and decodes only known editor text escapes', () => {
    expect(latexMessageParts(String.raw`\underbrace{x}_{\text{side}}`)).toEqual([{ kind: 'math', value: String.raw`\underbrace{x}_{\text{side}}` }]);
    expect(latexMessageParts(String.raw`\text{Cost \$5 \& \{x\}}`)).toEqual([{ kind: 'text', value: 'Cost $5 & {x}' }]);
    expect(latexMessageParts(String.raw`\text{\textbf{bold}}`)).toEqual([{ kind: 'math', value: String.raw`\text{\textbf{bold}}` }]);
    const matrix = '\\begin{pmatrix}a&b\\\\\nc&d\\end{pmatrix}';
    expect(latexMessageParts(matrix)).toEqual([{ kind: 'math', value: matrix }]);
  });

  it('does not execute HTML, user text or unsafe TeX links', () => {
    const markdown = renderToStaticMarkup(<MarkdownView value={'<script>alert(1)</script>\n\n[run](javascript:alert)\n\n![track](https://example.com/track.png)'}/>);
    expect(markdown).not.toContain('<script');
    expect(markdown).not.toContain('javascript:');
    expect(markdown).not.toContain('<img');
    const latex = renderToStaticMarkup(<LatexMessage value={String.raw`\text{<img src=x onerror=alert(1)>}\href{javascript:alert(1)}{run}\htmlClass{unsafe}{x}`}/>);
    expect(latex).not.toContain('<img');
    expect(latex).not.toContain('href="javascript:');
    expect(latex).not.toContain('class="unsafe"');
    expect(latex).toContain('&lt;img');
  });
});
