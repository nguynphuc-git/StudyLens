import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public', 'ocr');
const worker = join(dirname(dirname(require.resolve('tesseract.js'))), 'dist');
const core = dirname(require.resolve('tesseract.js-core'));
const assets = [
  [join(worker, 'worker.min.js'), join(output, 'worker.min.js')],
  [join(core, 'tesseract-core-simd-lstm.wasm.js'), join(output, 'tesseract-core-simd-lstm.wasm.js')],
  [join(core, 'tesseract-core-simd-lstm.wasm'), join(output, 'tesseract-core-simd-lstm.wasm')],
  [require.resolve('@tesseract.js-data/eng/4.0.0/eng.traineddata.gz'), join(output, 'lang-data', 'eng.traineddata.gz')]
];

for (const [, destination] of assets) await mkdir(dirname(destination), { recursive: true });
await Promise.all(assets.map(([source, destination]) => copyFile(source, destination)));
console.log(`Prepared local OCR engine and language data in ${output}`);
