export interface PdfQuestion { page:number; text:string }

export function splitPdfQuestions(pages: { page: number; text: string }[]): PdfQuestion[] {
  const questions: PdfQuestion[] = [];
  for (const page of pages) {
    const lines = page.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const starts = lines.flatMap((line, index) =>
      /^(?:(?:question|problem|exercise|bài(?:\s+tập)?|câu)\s*\d{1,3}(?:\.\d{1,3})*\s*[:.)]?|\(?\d{1,3}[.)])\s+\S/iu.test(line) ? [index] : []);
    const headingOnlyPrefix = starts.length > 0 && starts[0] > 0
      && lines.slice(0, starts[0]).every(line => /^(?:chapter|section|unit|page|chương)\b/iu.test(line));
    const boundaries = starts.length ? [headingOnlyPrefix ? starts[0] : 0, ...starts.slice(1)] : [0];
    for (let i = 0; i < boundaries.length; i++) {
      const end = boundaries[i + 1] ?? lines.length;
      const text = lines.slice(boundaries[i], end).join('\n').trim();
      if (text) questions.push({ page: page.page, text });
    }
  }
  return questions;
}
