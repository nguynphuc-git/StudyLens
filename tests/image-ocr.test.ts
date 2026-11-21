// @vitest-environment happy-dom
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({create:vi.fn(),recognize:vi.fn(),terminate:vi.fn()}));
vi.mock('tesseract.js',()=>({createWorker:mock.create,OEM:{LSTM_ONLY:1}}));
import {recognizeImageText} from '../src/pdf-ocr';
beforeEach(()=>{mock.create.mockReset().mockResolvedValue({recognize:mock.recognize,terminate:mock.terminate});mock.recognize.mockReset();mock.terminate.mockReset().mockResolvedValue(undefined);});
describe('local printed image OCR lifecycle',()=>{
  it('uses bundled bilingual assets and releases the worker after recognition',async()=>{
    mock.recognize.mockResolvedValue({data:{text:'  Solve x=1  '}});
    await expect(recognizeImageText('data:image/png;base64,AA==')).resolves.toBe('Solve x=1');
    const options=mock.create.mock.calls[0][2];
    expect(mock.create.mock.calls[0][0]).toBe('vie+eng');
    for(const name of ['workerPath','corePath','langPath'])expect(options[name]).toContain('/ocr/');
    expect(mock.terminate).toHaveBeenCalledOnce();
  });
  it('terminates a worker that finishes initializing after cancellation',async()=>{
    let finish!:(worker:unknown)=>void;mock.create.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
    const controller=new AbortController();const result=recognizeImageText('image',controller.signal);
    controller.abort();await expect(result).rejects.toMatchObject({name:'AbortError'});
    finish({recognize:mock.recognize,terminate:mock.terminate});await Promise.resolve();
    expect(mock.terminate).toHaveBeenCalledOnce();expect(mock.recognize).not.toHaveBeenCalled();
  });
  it('stops an active OCR worker and rejects its late transcription',async()=>{
    let finish!:(result:unknown)=>void;mock.recognize.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
    const controller=new AbortController();const result=recognizeImageText('image',controller.signal);
    await vi.waitFor(()=>expect(mock.recognize).toHaveBeenCalled());controller.abort();
    await expect(result).rejects.toMatchObject({name:'AbortError'});
    finish({data:{text:'late'}});await Promise.resolve();expect(mock.terminate).toHaveBeenCalledOnce();
  });
});
