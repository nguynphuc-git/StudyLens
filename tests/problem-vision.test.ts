// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {selectedIllustrations,sameIllustrations,validateIllustrations,localVisionParts} from '../src/problem-vision';
import type {Attachment} from '../src/notebook';
const diagram:Attachment={id:'diagram',name:'triangle.png',data:'data:image/png;base64,AA==',kind:'problem'};
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('selected problem images and browser-only preparation',()=>{
  it('excludes solution and unchecked images even if a solution is accidentally flagged for AI',()=>{
    const images=[diagram,{...diagram,id:'view-only',useForAI:false},{...diagram,id:'solution',kind:'solution' as const,useForAI:true}];
    expect(selectedIllustrations(images)).toEqual([{name:diagram.name,data:diagram.data}]);
    expect(sameIllustrations([diagram],[{...diagram,useForAI:true}])).toBe(true);expect(sameIllustrations([diagram],[{...diagram,useForAI:false}])).toBe(false);
  });
  it('validates supported types and per-exercise limits before constructing requests',()=>{
    expect(validateIllustrations([{data:diagram.data,name:diagram.name}])[0].inlineData.mimeType).toBe('image/png');
    expect(()=>validateIllustrations(Array(5).fill(diagram))).toThrow('up to 4');expect(()=>validateIllustrations([{name:'x.png',data:'data:image/png;base64,'+'x'.repeat(4*1024*1024+1)}])).toThrow('smaller than 3 MB');
  });
  it('converts only a local WebP inference copy and releases decoding resources',async()=>{
    const bitmap={width:4096,height:2048,close:vi.fn()},draw=vi.fn();vi.stubGlobal('createImageBitmap',vi.fn(async()=>bitmap));
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn(),drawImage:draw} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,AQ==');
    const original=validateIllustrations([{name:'diagram.webp',data:'data:image/webp;base64,AA=='}]);const result=await localVisionParts(original);
    expect(result[0].inlineData).toEqual({mimeType:'image/jpeg',data:'AQ=='});expect(original[0].inlineData.mimeType).toBe('image/webp');expect(draw).toHaveBeenCalledWith(bitmap,0,0,2048,1024);expect(bitmap.close).toHaveBeenCalledOnce();
  });
  it('retains PNG/JPEG bytes unchanged and aborts before any conversion',async()=>{
    const parts=validateIllustrations([{name:diagram.name,data:diagram.data}]);expect(await localVisionParts(parts)).toEqual(parts);
    const controller=new AbortController();controller.abort();await expect(localVisionParts(parts,controller.signal)).rejects.toMatchObject({name:'AbortError'});
  });
});
