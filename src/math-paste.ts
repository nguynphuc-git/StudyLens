import { convertAsciiMathToLatex } from 'mathlive';
import { normalizeProblemText } from './problem-text';

export function prose(value: string): string {
  if (!value) return '';
  return `\\text{${value.replace(/\\/g, '\\textbackslash{}').replace(/[{}%&#_^$]/g, '\\$&')}}`;
}
const mathNames = /\b(?:sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|arcsin|arccos|arctan|log|ln|exp|sqrt|abs|lim|sum|prod|int|pi|alpha|beta|gamma|delta|theta|infty|dx|dy|dt)\b/g;
function isMath(value: string): boolean {
  if (/^\\(?:text|mathrm|operatorname)\{/.test(value)) return true;
  const letters = value.replace(/\\[a-zA-Z]+/g, '').replace(mathNames, '');
  // Accented Latin words are prose too: e.g. “là”, “và”, “đề”, not variables.
  if (/[^\x00-\x7F]/.test(letters.replace(/[α-ωΑ-Ωℕℤℚℝℂ∅Ø∈∉⊂⊆⊃⊇∪∩∖∀∃¬∧∨⇒⇔≤≥≠≈∑∏∫√∞²³⁰¹⁴⁵⁶⁷⁸⁹₀-₉−×÷±·]/g, ''))) return false;
  return !/\p{L}{2,}/u.test(letters.replace(/[α-ωΑ-Ω]/g,'')) && !/["'$]/.test(value)
    && /[\dA-Za-zα-ωΑ-Ωℕℤℚℝℂ∅Ø∈∉⊂⊆⊃⊇∪∩∖∀∃¬∧∨⇒⇔=+*/^_<>|!()\[\]{}≤≥≠∈∑∫√∞²³-]/.test(value);
}
function formula(value: string): string {
  if (/\\[a-zA-Z]+/.test(value)) return value;
  const normalized = value.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3')
    // MathLive recognizes (n)/(n+3) as a fraction; bare n/(n+3) stays a slash.
    .replace(/(?<![\w\\])([A-Za-z]|\d+(?:\.\d+)?)\s*\/\s*(?=\()/g, '($1)/');
  // Preserve visible sets and their braces instead of interpreting them as TeX groups.
  const groups: boolean[] = []; let sets = '';
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index];
    if (char === '{') { const group = /[\^_]/.test(normalized[index - 1] ?? '') || groups.at(-1) === true; groups.push(group); sets += group ? '{' : '\\{'; }
    else if (char === '}') sets += groups.pop() === true ? '}' : '\\}';
    else sets += char;
  }
  const unicode: Record<string,string> = { '∅':'\\emptyset ', '∈':'\\in ', '∉':'\\notin ', '⊆':'\\subseteq ', '⊂':'\\subset ', '⊇':'\\supseteq ', '⊃':'\\supset ', '∪':'\\cup ', '∩':'\\cap ', 'ℕ':'\\mathbb{N}', 'ℤ':'\\mathbb{Z}', 'ℚ':'\\mathbb{Q}', 'ℝ':'\\mathbb{R}', 'ℂ':'\\mathbb{C}' };
  if (/[∅∈∉⊆⊂⊇⊃∪∩ℕℤℚℝℂ{}]/.test(normalized)) return sets.replace(/[∅∈∉⊆⊂⊇⊃∪∩ℕℤℚℝℂ]/g, symbol => unicode[symbol]).replace(/[\t ]+/g,' ').trim();
  return convertAsciiMathToLatex(normalized);
}
/** Conservative local parsing: ordinary words stay text; formulas get math structure.
 * Explicit $...$, \(...\), \[...\] and LaTeX clipboard data take precedence.
 */
export function mixedTextToLatex(value: string, preserveLines=false): string {
  const normalized = preserveLines ? value.normalize('NFC').replace(/\r\n?/g,'\n') : normalizeProblemText(value);
  const converted = [''];
  for (const part of normalized.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g).filter(Boolean)) {
    let explicit: string | undefined;
    if (part.startsWith('$$') && part.endsWith('$$')) explicit = part.slice(2,-2);
    else if (part.startsWith('$') && part.endsWith('$')) explicit = part.slice(1,-1);
    else if (/^\\[([]/.test(part)) explicit = part.slice(2,-2);
    if (explicit !== undefined) { converted[converted.length-1] += explicit; continue; }
    part.split(preserveLines?/\n/:/\n+/).forEach((line,index) => { if(index) converted.push(''); converted[converted.length-1] += undelimited(line); });
  }
  return converted.length <= 1 ? converted.join('') : converted.map(line => `\\class{mathfolio-line}{${line}}`).join('\n');
}
function undelimited(value: string): string {
  const tokens: { start: number; end: number; fullEnd: number; math: boolean }[] = [];
  for (let index = 0; index < value.length;) {
    if (/\s/.test(value[index])) { index++; continue; }
    const start = index; let braces = 0;
    do {
      if (value[index] === '{' && value[index - 1] !== '\\') braces++;
      if (value[index] === '}' && value[index - 1] !== '\\') braces = Math.max(0, braces - 1);
      index++;
    } while (index < value.length && (braces > 0 || !/\s/.test(value[index])));
    const core = value.slice(start, index).replace(/[.,;:!?]+$/, '');
    const label = /^(?:\([a-hA-H]\)|[a-hA-H][.)]|\d{1,3}[.)])$/.test(value.slice(start,index));
    tokens.push({ start, end: start + core.length, fullEnd: index, math: !label && isMath(core) });
  }
  // Avoid turning the English article “a” into a variable in otherwise ordinary prose.
  tokens.forEach((token, index) => {
    if (/^(?:a|A|I)$/.test(value.slice(token.start, token.end)) && !tokens[index - 1]?.math && !tokens[index + 1]?.math) token.math = false;
  });
  let output = '', cursor = 0;
  for (let index = 0; index < tokens.length;) {
    const first = tokens[index];
    if (!first.math) { index++; continue; }
    let last = first;
    while (last.end === last.fullEnd && tokens[index + 1]?.math) last = tokens[++index];
    output += prose(value.slice(cursor, first.start)) + formula(value.slice(first.start, last.end));
    cursor = last.end; index++;
  }
  return output + prose(value.slice(cursor));
}

/** Text mode keeps literal words; Math paste accepts mixed prose/formulas without changing typing mode. */
export function editorPaste(value:string, mode:'math'|'text'|null, preserveLines=false):string {
  if(mode===null)return mixedTextToLatex(value,preserveLines);
  if(mode==='text'){
    const lines=[''];
    for(const part of value.replace(/\r\n?/g,'\n').split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g).filter(Boolean)){
      if(part.startsWith('$$')&&part.endsWith('$$'))lines[lines.length-1]+=part.slice(2,-2);
      else if(part.startsWith('$')&&part.endsWith('$'))lines[lines.length-1]+=part.slice(1,-1);
      else if(/^\\[([]/.test(part))lines[lines.length-1]+=part.slice(2,-2);
      else part.split('\n').forEach((line,index)=>{if(index)lines.push('');lines[lines.length-1]+=prose(line);});
    }
    return lines.length===1?lines[0]:lines.map(line=>`\\class{mathfolio-line}{${line}}`).join('\n');
  }
  // A complete authored TeX environment already carries its own math layout.
  const trimmed=value.trim();
  if(/^\\begin\{([A-Za-z*]+)\}[\s\S]*\\end\{\1\}$/.test(trimmed))return trimmed;
  // External proofs often mix words and delimited TeX on the same line. Treating
  // that whole line as one formula corrupts both, and PDF normalization joins paragraphs.
  return mixedTextToLatex(value,true);
}
