import { describe, expect, it } from 'vitest';
import { splitPdfQuestions } from '../src/pdf';

describe('PDF question selection', () => {
  it('splits numbered questions and keeps their page number', () => {
    expect(splitPdfQuestions([
      { page: 2, text: '1. Solve x^2 = 4\nShow your work.\n2) Find the roots of x + 3 = 0\nCheck your answer.' }
    ])).toEqual([
      { page: 2, text: '1. Solve x^2 = 4\nShow your work.' },
      { page: 2, text: '2) Find the roots of x + 3 = 0\nCheck your answer.' }
    ]);
  });

  it('keeps unnumbered page text as one editable selection', () => {
    expect(splitPdfQuestions([{ page: 4, text: 'Explain why x + y = y + x.' }]))
      .toEqual([{ page: 4, text: 'Explain why x + y = y + x.' }]);
  });

  it('discards page headings before the first numbered question', () => {
    expect(splitPdfQuestions([{ page: 1, text: 'Chapter 1: Algebra\nQuestion 3: Solve 2x = 8' }]))
      .toEqual([{ page: 1, text: 'Question 3: Solve 2x = 8' }]);
  });
  it('recognizes Vietnamese exercise headings with chapter question numbers', () => {
    expect(splitPdfQuestions([{page:1,text:'Chương 2. Tập hợp\nBài 2.1. Chọn khẳng định đúng.\na) 0 ∈ ∅\nBài 2.2. Tìm tập hợp.'}]))
      .toEqual([{page:1,text:'Bài 2.1. Chọn khẳng định đúng.\na) 0 ∈ ∅'},{page:1,text:'Bài 2.2. Tìm tập hợp.'}]);
  });
});
