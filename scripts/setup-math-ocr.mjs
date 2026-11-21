import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const candidates = process.env.PYTHON ? [process.env.PYTHON] : ['python3.12', 'python3'];
let python;
for (const candidate of candidates) {
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  const version = `${result.stdout ?? ''}${result.stderr ?? ''}`.match(/Python (\d+)\.(\d+)/);
  if (result.status === 0 && version && Number(version[1]) === 3 && Number(version[2]) >= 10 && Number(version[2]) <= 12) {
    python = candidate;
    break;
  }
}
if (!python) {
  console.error('Install Python 3.10–3.12, then run npm run setup:math-ocr again. Override the command with PYTHON=python3.12 if needed.');
  process.exit(1);
}

const environment = join(root, '.mathfolio-ocr');
const executable = process.platform === 'win32' ? join(environment, 'Scripts', 'python.exe') : join(environment, 'bin', 'python');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!existsSync(executable)) run(python, ['-m', 'venv', environment]);
run(executable, ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(executable, ['-m', 'pip', 'install', '-r', 'requirements-math-ocr.txt']);
console.log('Local formula OCR is installed. Start the app with npm run dev. The formula model downloads on first use.');
