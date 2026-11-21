import { afterEach, describe, expect, it, vi } from 'vitest';
import { recognizeMathFormula } from '../src/pdf-ocr-local';

afterEach(() => vi.unstubAllGlobals());

describe('local formula OCR request', () => {
  it('sends only the selected crop to the loopback service and returns LaTeX', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ latex: String.raw`\frac{x^2}{2}` }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const crop = new Blob(['cropped formula'], { type: 'image/png' });

    await expect(recognizeMathFormula(crop)).resolves.toBe(String.raw`\frac{x^2}{2}`);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe('http://127.0.0.1:5188/recognize');
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Mathfolio-Local-OCR': '1' },
      body: crop
    });
  });

  it('explains how to enable the local service when it is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Network error'); }));
    await expect(recognizeMathFormula(new Blob(['crop']))).rejects.toThrow('npm run setup:math-ocr');
  });

  it('rejects empty or oversized crops before sending any image', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(recognizeMathFormula(new Blob())).rejects.toThrow('smaller than 3 MB');
    await expect(recognizeMathFormula(new Blob(['x'.repeat(3 * 1024 * 1024 + 1)]))).rejects.toThrow('smaller than 3 MB');
    expect(fetch).not.toHaveBeenCalled();
  });
});
