import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { startLocalMathOcr } from './local-math-ocr.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  console.error('Cần Node.js 22.12 trở lên. Hãy cài Node.js 24 LTS rồi mở lại.');
  process.exit(1);
}

const stamp = 'node_modules/.mathfolio-install';
const digest = createHash('sha256').update(readFileSync('package-lock.json'))
  .update(process.versions.node).digest('hex');
if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== digest || !existsSync('node_modules/vite/bin/vite.js')) {
  const install = spawnSync('npm ci', { shell: true, stdio: 'inherit' });
  if (install.error) throw install.error;
  if (install.status !== 0) process.exit(install.status ?? 1);
  writeFileSync(stamp, digest);
}

// Write only Auth to a dedicated export. Older full-suite exports stay intact.
const exportsByPriority = ['.mathfolio-auth', '.emulator-data', '../studylens-emulator-data'];
const previous = exportsByPriority.find(dir => existsSync(dir + '/firebase-export-metadata.json'));
const cliArgs = ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start',
  '--only', 'auth', '--project', 'demo-studylens-local', '--export-on-exit=.mathfolio-auth'];
if (previous) cliArgs.push('--import=' + previous);

process.env.VITE_USE_EMULATORS = 'true';
const { createServer } = await import('vite');
const web = await createServer({ server: { host: 'localhost', port: 5173, strictPort: true, open: false } });
await web.listen();
const mathOcr = startLocalMathOcr();
console.log('Mathfolio · Nhấn Ctrl+C một lần để lưu tài khoản rồi thoát.');
const emulator = spawn(process.execPath, cliArgs, { stdio: ['inherit', 'pipe', 'inherit'] });
let opened = false;
let recentOutput = '';
emulator.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  recentOutput = (recentOutput + chunk.toString()).slice(-4000);
  if (!opened && recentOutput.includes('All emulators ready!')) {
    opened = true;
    console.log('Mở Mathfolio tại http://localhost:5173');
    web.openBrowser();
  }
});

// Ctrl+C reaches both processes. Give the CLI time to finish its Auth export.
process.on('SIGINT', () => {});
try {
  const [code] = await once(emulator, 'exit');
  process.exitCode = code ?? 1;
} finally {
  mathOcr?.kill('SIGTERM');
  await web.close();
}
