import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const stageRoot = path.join(repoRoot, 'electron', 'app');
const frontendDist = path.join(repoRoot, 'frontend', 'dist');
const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

const backendPathArg = readFlag('--backend-path');
const backendBinary = backendPathArg
  ? path.resolve(repoRoot, backendPathArg)
  : path.join(repoRoot, 'backend', 'target', 'release', process.platform === 'win32' ? 'backend.exe' : 'backend');
const backendBinaryName = path.basename(backendBinary);
const stagedBackendDir = path.join(stageRoot, 'backend');
const stagedWebDir = path.join(stageRoot, 'web');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(frontendDist)) {
  fail('Missing frontend build at frontend/dist. Run `npm run build:frontend` first.');
}

if (!fs.existsSync(backendBinary)) {
  fail(`Missing backend binary at ${path.relative(repoRoot, backendBinary)}. Run \`npm run build:backend\` first.`);
}

fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stagedBackendDir, { recursive: true });

fs.cpSync(frontendDist, stagedWebDir, { recursive: true });
fs.copyFileSync(backendBinary, path.join(stagedBackendDir, backendBinaryName));

if (process.platform !== 'win32') {
  fs.chmodSync(path.join(stagedBackendDir, backendBinaryName), 0o755);
}

console.log(`Staged Electron app assets in ${path.relative(repoRoot, stageRoot)}`);
