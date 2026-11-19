import { spawn } from 'node:child_process';
import { startLocalMathOcr } from './local-math-ocr.mjs';

const ocr = startLocalMathOcr();
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' });
let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  ocr?.kill('SIGTERM');
  if (vite.exitCode === null) vite.kill(signal);
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
vite.once('error', error => {
  console.error(`Could not start Vite: ${error.message}`);
  stop('SIGTERM');
  process.exitCode = 1;
});
vite.once('exit', (code, signal) => {
  ocr?.kill('SIGTERM');
  process.exitCode = code ?? (signal ? 1 : 0);
});
