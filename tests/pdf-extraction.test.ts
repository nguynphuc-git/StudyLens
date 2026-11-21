import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), recognizePdfPages: vi.fn() }));
vi.mock('pdfjs-dist', () => ({ getDocument: mocks.getDocument, GlobalWorkerOptions: {} }));
vi.mock('../src/pdf-ocr', () => ({ recognizePdfPages: mocks.recognizePdfPages }));

import { extractPdfQuestions, splitPdfQuestions } from '../src/pdf';

function configurePdf(pageTexts: string[][]) {
  const pages = pageTexts.map(items => ({
    getTextContent: vi.fn(async () => ({
      items: items.map((str, index) => ({ str, transform: [1, 0, 0, 1, 0, 700 - index * 20], hasEOL: true }))
    })),
    cleanup: vi.fn()
  }));
  const document = { numPages: pages.length, getPage: vi.fn(async (page: number) => pages[page - 1]) };
  const loadingTask = { promise: Promise.resolve(document), destroy: vi.fn() };
  mocks.getDocument.mockReturnValue(loadingTask);
  return { pages, loadingTask };
}

afterEach(() => vi.clearAllMocks());

describe('PDF extraction with local OCR fallback', () => {
  it('keeps introductory text when OCR misses the first question number', () => {
    expect(splitPdfQuestions([{ page: 1, text: 'Instructions: show your work.\nLet f(x) contain e^(-x²) and ∫.\n2. Evaluate the next expression.' }])).toEqual([
      { page: 1, text: 'Instructions: show your work.\nLet f(x) contain e^(-x²) and ∫.\n2. Evaluate the next expression.' }
    ]);
  });

  it('recognizes scanned pages locally and reports OCR page progress', async () => {
    const { pages, loadingTask } = configurePdf([[]]);
    mocks.recognizePdfPages.mockImplementation(async (scanned: { page: number }[], onProgress: (page: number, total: number) => void) => {
      expect(scanned.map(page => page.page)).toEqual([1]);
      onProgress(1, 1);
      return [{ page: 1, text: 'Question 1: Solve x squared equals four.' }];
    });
    const progress = vi.fn();

    await expect(extractPdfQuestions(new File(['scan'], 'scan.pdf'), event => progress(event))).resolves.toEqual([
      { page: 1, text: 'Question 1: Solve x squared equals four.' }
    ]);

    expect(progress).toHaveBeenCalledWith({ stage: 'ocr', page: 1, total: 1 });
    expect(mocks.recognizePdfPages).toHaveBeenCalledTimes(1);
    expect(pages[0].cleanup).toHaveBeenCalled();
    expect(loadingTask.destroy).toHaveBeenCalled();
  });

  it('skips OCR for pages with selectable text', async () => {
    configurePdf([['Question 1: Find the derivative of x squared and explain the rule.']]);
    await expect(extractPdfQuestions(new File(['text'], 'text.pdf'))).resolves.toEqual([
      { page: 1, text: 'Question 1: Find the derivative of x squared and explain the rule.' }
    ]);
    expect(mocks.recognizePdfPages).not.toHaveBeenCalled();
  });

  it('runs OCR only on scan pages in a mixed text and image PDF', async () => {
    configurePdf([
      ['Question 1: Find the derivative of x squared and explain the rule.'],
      []
    ]);
    mocks.recognizePdfPages.mockResolvedValue([{ page: 2, text: 'Question 2: Solve y plus one equals three.' }]);

    await expect(extractPdfQuestions(new File(['mixed'], 'mixed.pdf'))).resolves.toEqual([
      { page: 1, text: 'Question 1: Find the derivative of x squared and explain the rule.' },
      { page: 2, text: 'Question 2: Solve y plus one equals three.' }
    ]);
    expect(mocks.recognizePdfPages.mock.calls[0][0].map((page: { page: number }) => page.page)).toEqual([2]);
  });

  it('accepts PDFs up to 60 pages and clearly rejects larger files',async()=>{
    const {pages,loadingTask}=configurePdf(Array.from({length:61},()=>[]));
    await expect(extractPdfQuestions(new File(['large'],'large.pdf'))).rejects.toThrow('60 trang');
    expect(pages[0].getTextContent).not.toHaveBeenCalled();
    expect(loadingTask.destroy).toHaveBeenCalledOnce();
  });
});
describe('stopping PDF import',()=>{
  it('destroys a loading PDF once and never reads pages after cancellation',async()=>{
    let finish!:(value:unknown)=>void;const getPage=vi.fn();const destroy=vi.fn(async()=>{});
    mocks.getDocument.mockReturnValue({promise:new Promise(resolve=>{finish=resolve;}),destroy});
    const controller=new AbortController();const pending=extractPdfQuestions(new File(['pdf'],'p.pdf'),undefined,controller.signal);
    await vi.waitFor(()=>expect(mocks.getDocument).toHaveBeenCalledOnce());
    controller.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});
    finish({numPages:1,getPage});await Promise.resolve();expect(destroy).toHaveBeenCalledOnce();expect(getPage).not.toHaveBeenCalled();
  });
});
