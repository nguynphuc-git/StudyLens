import {stripProblemLayout} from './problem-text';

export interface HintProblem {label:string;statement:string}
/** Split explicit exercise headings or numbered tasks; keep lettered subparts with their parent.
 * Unlabelled/image-only tasks stay together and are inventoried by the visual prompt.
 */
export function hintProblems(value:string):HintProblem[] {
  const text=stripProblemLayout(value).replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\r\n?/g,'\n').trim();
  const named=[...text.matchAll(/^(?:[\t ]*)(?:question|problem|exercise|bài(?:\s+tập)?|câu)\s*(\d{1,3}(?:\.\d{1,3})*)[.:)]?(?=\s|$)/gimu)];
  const numbered=[...text.matchAll(/^[\t ]*\(?(\d{1,3})[.)]\s+(?=\S)/gm)];
  const headings=named.length>=2?named:numbered.length>=2?numbered:[];
  if(headings.length<2)return [{label:'Problem',statement:value}];
  const shared=text.slice(0,headings[0].index).trim();
  return headings.map((heading,index)=>({label:`${named.length>=2?'Exercise':'Problem'} ${heading[1]}`,statement:[shared,text.slice(heading.index,headings[index+1]?.index??text.length).trim()].filter(Boolean).join('\n\n')}));
}

/** Only reuse earlier hints explicitly assigned to this exercise, not another exercise. */
export function scopedHint(text:string,label:string):string {
  const heading=`### ${label}\n`;
  const start=text.indexOf(heading);
  if(start<0)return '';
  const from=start+heading.length,end=text.indexOf('\n### ',from);
  return text.slice(from,end<0?undefined:end).trim();
}
