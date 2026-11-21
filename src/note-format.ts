import { mixedTextToLatex } from './math-paste';
/** Legacy notes are converted only for display, never rewritten just by opening a page. */
export function notesLatex(value:string, format?:'latex'):string {
  return format==='latex'?value:mixedTextToLatex(value,true);
}
