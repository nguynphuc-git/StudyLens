/** MathLive placeholders are LaTeX too; prose must explicitly use text mode. */
export function editorPlaceholder(value:string):string {
  return `\\text{${value.replace(/[\\{}%&#_^$]/g,char=>char==='\\'?'\\textbackslash{}':`\\${char}`)}}`;
}
/** Older notebook pages stored text with $...$ fragments. Keep them readable. */
export function statementLatex(value: string, format?: 'latex'): string {
  if (format === 'latex' || !value) return value;
  if (!/[a-zA-Z]{2,}/.test(value.replace(/\$[^$]*\$/g, ''))) return value.replace(/\$\$?/g, '');
  return value.split(/(\$[^$]+\$)/g).filter(Boolean).map(part => part.startsWith('$') && part.endsWith('$')
    ? part.slice(1, -1)
    : `\\text{${part.replace(/\\/g, '\\textbackslash{}').replace(/[{}%&#_^]/g, '\\$&').replace(/\n/g, ' ')}}`).join('');
}
/** Rich text wrappers and blank line markers must not turn an empty question into content. */
export function hasEditorContent(value:string):boolean {
  return value.replace(/\\class\{mathfolio-line\}/g,'').replace(/\\placeholder\{[^{}]*\}/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/[{}\s]/g,'').length>0;
}
