// @vitest-environment happy-dom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({ai:vi.fn(),ocr:vi.fn()}));
vi.mock('../src/ai',()=>({transcribeProblemImage:mock.ai}));
vi.mock('../src/pdf-ocr',()=>({recognizeImageText:mock.ocr}));
import {readProblemImage,prepareProblemImage} from '../src/image-import';
const image={data:'data:image/jpeg;base64,AA==',name:'problem.jpg'};
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
beforeEach(()=>{mock.ai.mockReset();mock.ocr.mockReset();});
describe('local image reading and fallback',()=>{
  it('uses the local image model and never starts OCR if it succeeds',async()=>{
    mock.ai.mockResolvedValue('Solve \\(x^2=4\\).');
    await expect(readProblemImage(image,()=>{})).resolves.toEqual({text:'Solve \\(x^2=4\\).',source:'on_device'});
    expect(mock.ocr).not.toHaveBeenCalled();
  });
  it('falls back to browser OCR when local multimodal AI is unavailable',async()=>{
    mock.ai.mockRejectedValue(new Error('unsupported image input'));mock.ocr.mockResolvedValue('Solve x+1=2');
    await expect(readProblemImage(image,()=>{})).resolves.toMatchObject({source:'local_ocr',text:'Solve x+1=2'});
  });
  it('supports printed OCR directly and rejects blank/oversized results',async()=>{
    mock.ocr.mockResolvedValueOnce('  ').mockResolvedValueOnce('x'.repeat(6001));
    await expect(readProblemImage(image,()=>{},undefined,true)).rejects.toThrow('No readable text');
    await expect(readProblemImage(image,()=>{},undefined,true)).rejects.toThrow('shorter problem');
    expect(mock.ai).not.toHaveBeenCalled();
  });
  it('does not fall back or accept a late result after Stop',async()=>{
    const controller=new AbortController();
    mock.ai.mockImplementation(async()=>{controller.abort();throw new DOMException('stopped','AbortError');});
    await expect(readProblemImage(image,()=>{},controller.signal)).rejects.toMatchObject({name:'AbortError'});
    expect(mock.ocr).not.toHaveBeenCalled();
    const another=new AbortController();mock.ocr.mockImplementation(async()=>{another.abort();return 'late result';});
    await expect(readProblemImage(image,()=>{},another.signal,true)).rejects.toMatchObject({name:'AbortError'});
  });
  it('validates file types and limits before decoding an image',async()=>{
    await expect(prepareProblemImage(new File(['x'],'bad.txt',{type:'text/plain'}))).rejects.toThrow('PNG, JPG or WebP');
    await expect(prepareProblemImage(new File([],'empty.png',{type:'image/png'}))).rejects.toThrow('10 MB');
    await expect(prepareProblemImage({size:11*1024*1024,type:'image/png'} as File)).rejects.toThrow('10 MB');
  });
});
describe('local image preparation',()=>{
  it('bounds image dimensions and releases its canvas/bitmap after encoding',async()=>{
    const bitmap={width:3200,height:1600,close:vi.fn()};
    vi.stubGlobal('createImageBitmap',vi.fn(async()=>bitmap));
    const drawImage=vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn(),drawImage} as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue(image.data);
    await expect(prepareProblemImage(new File(['png'],'problem.png',{type:'image/png'}))).resolves.toMatchObject({data:image.data,name:'problem.png'});
    expect(drawImage).toHaveBeenCalledWith(bitmap,0,0,1600,800);expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it('closes a decoded bitmap that arrives after the import is stopped',async()=>{
    const bitmap={width:100,height:100,close:vi.fn()};let finish!:(bitmap:unknown)=>void;
    vi.stubGlobal('createImageBitmap',vi.fn(()=>new Promise(resolve=>{finish=resolve;})));
    const controller=new AbortController();const pending=prepareProblemImage(new File(['png'],'p.png',{type:'image/png'}),controller.signal);
    controller.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});
    finish(bitmap);await Promise.resolve();await Promise.resolve();expect(bitmap.close).toHaveBeenCalledOnce();
  });
});
