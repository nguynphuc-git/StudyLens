import { stripProblemLayout } from './problem-text';

/** Accept the delimiters models often use, while leaving examples and code untouched. */
export function normalizeChatMath(value: string): string {
  const lines = value.replace(/\r\n?/g, '\n').split('\n');
  let fence: { character: string; size: number } | undefined;
  let prose = '', output = '';
  const flush = () => { output += normalizeInline(prose); prose = ''; };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index], ending = index < lines.length - 1 ? '\n' : '';
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      output += line + ending;
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.size && !line.slice(marker[0].length).trim()) fence = undefined;
    } else if (marker) {
      flush(); fence = { character: marker[1][0], size: marker[1].length }; output += line + ending;
    } else if (/^(?: {4}|\t)/.test(line)) {
      // Markdown indented code must also remain literal.
      flush(); output += line + ending;
    } else prose += line + ending;
  }
  flush(); return output;
}

function normalizeInline(value: string): string {
  let output = '';
  for (let index = 0; index < value.length;) {
    if (value[index] === '`') {
      const marker = /^`+/.exec(value.slice(index))![0];
      let end = value.indexOf(marker, index + marker.length);
      while (end >= 0 && (value[end - 1] === '`' || value[end + marker.length] === '`')) end = value.indexOf(marker, end + marker.length);
      if (end >= 0) { output += value.slice(index, end + marker.length); index = end + marker.length; continue; }
    }
    if (value[index] === '$') {
      const marker = value[index + 1] === '$' ? '$$' : '$';
      let end = value.indexOf(marker, index + marker.length);
      while (end >= 0 && value[end - 1] === '\\') end = value.indexOf(marker, end + marker.length);
      if (end >= 0) { output += value.slice(index, end + marker.length); index = end + marker.length; continue; }
    }
    if (value[index] === '\\') {
      const delimiter = value[index + 1];
      if (delimiter === '(' || delimiter === '[') {
        const close = delimiter === '(' ? '\\)' : '\\]';
        const end = value.indexOf(close, index + 2);
        if (end >= 0) {
          const formula = value.slice(index + 2, end).trim();
          output += delimiter === '[' ? `\n\n$$\n${formula}\n$$\n\n` : `$${formula}$`;
          index = end + 2; continue;
        }
      }
      // Do not reinterpret an escaped backslash as a delimiter.
      if (index + 1 < value.length) { output += value.slice(index, index + 2); index += 2; continue; }
    }
    output += value[index++];
  }
  return output;
}

export interface ChatPart { kind: 'text' | 'math' | 'break'; value: string }

/** Pull only top-level editor prose out of TeX so it wraps and inherits reading preferences. */
export function latexMessageParts(value: string): ChatPart[] {
  const latex = stripProblemLayout(value), parts: ChatPart[] = [];
  let formula = '', depth = 0, environments = 0;
  const flush = () => { if (formula.trim()) parts.push({ kind: 'math', value: formula }); formula = ''; };
  for (let index = 0; index < latex.length;) {
    if (depth === 0 && environments === 0 && latex.startsWith('\\text{', index)) {
      let end = index + 6, textDepth = 1;
      for (; end < latex.length; end++) {
        if (latex[end] === '\\') { end++; continue; }
        if (latex[end] === '{') textDepth++;
        if (latex[end] === '}' && --textDepth === 0) break;
      }
      if (textDepth === 0) {
        const text = decodeEditorText(latex.slice(index + 6, end));
        if (text !== undefined) { flush(); parts.push({ kind: 'text', value: text }); index = end + 1; continue; }
      }
    }
    const character = latex[index];
    if (character === '\\') {
      const environment = /^\\(begin|end)\{[^{}]+\}/.exec(latex.slice(index));
      if (environment) {
        environments = Math.max(0, environments + (environment[1] === 'begin' ? 1 : -1));
        formula += environment[0]; index += environment[0].length; continue;
      }
    }
    if (character === '\\' && index + 1 < latex.length) { formula += latex.slice(index, index + 2); index += 2; continue; }
    if (depth === 0 && environments === 0 && character === '\n') { flush(); parts.push({ kind: 'break', value: '' }); index++; continue; }
    if (character === '{') depth++;
    if (character === '}') depth = Math.max(0, depth - 1);
    formula += character; index++;
  }
  flush(); return parts;
}

function decodeEditorText(value: string): string | undefined {
  const escaped: Record<string, string> = { '\\textbackslash{}': '\\', '\\{': '{', '\\}': '}', '\\%': '%', '\\&': '&', '\\#': '#', '\\_': '_', '\\$': '$', '\\^': '^', '\\ ': ' ' };
  let output = '';
  for (let index = 0; index < value.length;) {
    if (value[index] === '\\') {
      const match = Object.keys(escaped).find(key => value.startsWith(key, index));
      if (!match) return undefined;
      output += escaped[match]; index += match.length;
    } else if (value[index] === '{' || value[index] === '}') return undefined;
    else output += value[index++];
  }
  return output;
}
