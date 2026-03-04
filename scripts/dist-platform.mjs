import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const localCargoZigbuild = path.join(repoRoot, 'tools', 'cargo-zigbuild', 'bin', 'cargo-zigbuild');

const targets = {
  mac: {
    rustTarget: 'aarch64-apple-darwin',
    backendPath: 'backend/target/aarch64-apple-darwin/release/backend',
    builderArgs: ['--mac', '--arm64'],
    buildCommand: ['cargo', 'build']
  },
  win: {
    rustTarget: 'x86_64-pc-windows-gnu',
    backendPath: 'backend/target/x86_64-pc-windows-gnu/release/backend.exe',
    builderArgs: ['--win', 'nsis', 'zip', '--x64'],
    buildCommand: fs.existsSync(localCargoZigbuild) ? [localCargoZigbuild, 'zigbuild'] : ['cargo', 'build']
  },
  linux: {
    rustTarget: 'x86_64-unknown-linux-musl',
    backendPath: 'backend/target/x86_64-unknown-linux-musl/release/backend',
    builderArgs: ['--linux', 'pacman', 'AppImage', 'tar.gz', '--x64'],
    buildCommand: fs.existsSync(localCargoZigbuild) ? [localCargoZigbuild, 'zigbuild'] : ['cargo', 'build']
  }
};

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv
    }
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getGitConfig(key) {
  const result = spawnSync('git', ['config', key], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
}

function ensureTargetInstalled(rustTarget) {
  const list = spawnSync('rustup', ['target', 'list', '--installed'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (list.status !== 0) {
    process.exit(list.status ?? 1);
  }

  if (!list.stdout.split('\n').includes(rustTarget)) {
    run('rustup', ['target', 'add', rustTarget]);
  }
}

const requestedTargets = process.argv.slice(2);
const gitUserName = getGitConfig('user.name');
const gitUserEmail = getGitConfig('user.email');

if (requestedTargets.length === 0) {
  console.error('Usage: node scripts/dist-platform.mjs <mac|win|linux> [...]');
  process.exit(1);
}

run('npm', ['--prefix', 'frontend', 'run', 'build']);

for (const requestedTarget of requestedTargets) {
  const config = targets[requestedTarget];

  if (!config) {
    console.error(`Unknown target: ${requestedTarget}`);
    process.exit(1);
  }

  ensureTargetInstalled(config.rustTarget);
  run(config.buildCommand[0], [...config.buildCommand.slice(1), '--release', '--manifest-path', 'backend/Cargo.toml', '--target', config.rustTarget]);
  run('node', ['scripts/stage-electron.mjs', '--backend-path', config.backendPath]);
  const builderArgs = [...config.builderArgs];

  if (requestedTarget === 'linux' && gitUserName && gitUserEmail) {
    builderArgs.push(`--config.linux.maintainer=${gitUserName} <${gitUserEmail}>`);
  }

  run('npx', ['electron-builder', ...builderArgs], {
    CSC_IDENTITY_AUTO_DISCOVERY: requestedTarget === 'mac' ? 'true' : 'false'
  });
}
