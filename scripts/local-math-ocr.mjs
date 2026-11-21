import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function startLocalMathOcr() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const environment = join(root, '.mathfolio-ocr');
  const python = process.platform === 'win32' ? join(environment, 'Scripts', 'python.exe') : join(environment, 'bin', 'python');
  if (!existsSync(python)) {
    console.log('Formula OCR setup is optional. Run npm run setup:math-ocr to enable local formula-to-LaTeX recognition.');
    return null;
  }
  const server = spawn(python, ['scripts/math-ocr-server.py'], { cwd: root, stdio: 'inherit' });
  server.once('error', error => console.error(`Could not start local formula OCR: ${error.message}`));
  return server;
}
