import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  getGenerativeModel: vi.fn(),
  getAI: vi.fn(),
  schema: {
    object: vi.fn((value: unknown) => value),
    array: vi.fn((value: unknown) => value),
    string: vi.fn(() => ({})),
    integer: vi.fn(() => ({}))
  }
}));

vi.mock('firebase/ai', () => ({
  getAI: mocks.getAI,
  GoogleAIBackend: class {},
  getGenerativeModel: mocks.getGenerativeModel,
  InferenceMode: { ONLY_ON_DEVICE: 'device', ONLY_IN_CLOUD: 'cloud' },
  Schema: mocks.schema
}));
vi.mock('../src/firebase', () => ({ getCloudFirebaseApp: () => ({}) }));

import { recognizeImageWithCloud } from '../src/ai';

afterEach(() => {
  mocks.generateContent.mockReset();
  mocks.getGenerativeModel.mockReset();
  mocks.getAI.mockReset();
});

describe('Cloud image OCR', () => {
  it('sends only the selected image with a transcription prompt to the cloud model', async () => {
    const model = { generateContent: mocks.generateContent };
    mocks.getGenerativeModel.mockReturnValue(model);
    mocks.generateContent.mockResolvedValue({ response: { candidates: [], text: () => String.raw`Solve \(x^2=4\).` } });

    await expect(recognizeImageWithCloud('data:image/png;base64,SGVsbG8=')).resolves.toBe(String.raw`Solve \(x^2=4\).`);

    expect(mocks.getAI).toHaveBeenCalledOnce();
    expect(mocks.getGenerativeModel.mock.calls[0][1].mode).toBe('cloud');
    const parts = mocks.generateContent.mock.calls[0][0];
    expect(parts[0].text).toContain('Do not solve the problems');
    expect(parts[1]).toEqual({ type: 'inlineData', inlineData: { mimeType: 'image/png', data: 'SGVsbG8=' } });
  });

  it('rejects unsupported, malformed, and oversized images before calling the model', async () => {
    await expect(recognizeImageWithCloud('data:application/pdf;base64,SGVsbG8=')).rejects.toThrow('valid PNG, JPG or WebP');
    await expect(recognizeImageWithCloud('data:image/png;base64,!!!')).rejects.toThrow('valid PNG, JPG or WebP');
    const oversized = `data:image/png;base64,${'A'.repeat(Math.ceil(3 * 1024 * 1024 * 4 / 3) + 4)}`;
    await expect(recognizeImageWithCloud(oversized)).rejects.toThrow('smaller than 3 MB');
    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it('reports an empty or truncated model transcription explicitly', async () => {
    mocks.getGenerativeModel.mockReturnValue({ generateContent: mocks.generateContent });
    mocks.generateContent.mockResolvedValue({ response: { candidates: [], text: () => '  ' } });
    await expect(recognizeImageWithCloud('data:image/jpeg;base64,SGVsbG8=')).rejects.toThrow('did not return readable text');

    mocks.generateContent.mockResolvedValue({ response: { candidates: [{ finishReason: 'MAX_TOKENS' }], text: () => 'partial' } });
    await expect(recognizeImageWithCloud('data:image/jpeg;base64,SGVsbG8=')).rejects.toThrow('was cut off');
  });
});
