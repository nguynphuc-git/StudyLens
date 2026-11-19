// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createWorker: vi.fn(), recognize: vi.fn(), terminate: vi.fn() }));
vi.mock('tesseract.js', () => ({
  createWorker: mocks.createWorker,
  OEM: { LSTM_ONLY: 1 }
}));

import { recognizeImageLocally } from '../src/pdf-ocr';

afterEach(() => vi.clearAllMocks());

describe('local image OCR', () => {
  it('uses the English model locally and always terminates its worker', async () => {
    const worker = { recognize: mocks.recognize, terminate: mocks.terminate, setParameters: vi.fn() };
    mocks.createWorker.mockResolvedValue(worker);
    mocks.recognize.mockResolvedValue({ data: { text: '  x squared plus four  ' } });
    const image = new Blob(['image'], { type: 'image/png' });

    await expect(recognizeImageLocally(image)).resolves.toBe('x squared plus four');

    expect(mocks.createWorker).toHaveBeenCalledWith('eng', 1, expect.objectContaining({ gzip: true }));
    expect(mocks.recognize).toHaveBeenCalledWith(image);
    expect(mocks.terminate).toHaveBeenCalledOnce();
  });

  it('reports an empty result and still terminates the worker', async () => {
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate });
    mocks.recognize.mockResolvedValue({ data: { text: '  ' } });

    await expect(recognizeImageLocally(new Blob(['image']))).rejects.toThrow('No readable English text');

    expect(mocks.terminate).toHaveBeenCalledOnce();
  });
});
