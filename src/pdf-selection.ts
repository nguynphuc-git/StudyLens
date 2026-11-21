import type {PdfQuestion} from './pdf';
import {mixedTextToLatex} from './math-paste';
import {normalizeProblemText} from './problem-text';
export interface ReviewedPdfQuestion extends PdfQuestion {id:string;latex:string;selected:boolean}
export function reviewPdfQuestions(questions:PdfQuestion[],prefix='pdf'):ReviewedPdfQuestion[]{
  return questions.map((question,index)=>({...question,id:`${prefix}-${index}`,latex:mixedTextToLatex(normalizeProblemText(question.text),true),selected:index===0}));
}
/** Keep document order and the existing question headings; never reparse edited TeX. */
export function combinePdfQuestions(questions:ReviewedPdfQuestion[]):string{
  return questions.filter(question=>question.selected).slice().sort((a,b)=>a.page-b.page).map(question=>question.latex).join('\n\\class{mathfolio-line}{}\n');
}
