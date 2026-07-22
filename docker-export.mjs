import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const exportDir = path.join(rootDir, 'exports');
const platform = 'linux/arm64';

mkdirSync(exportDir, { recursive: true });

const run = (args) => {
  execFileSync('docker', args, {
    cwd: rootDir,
    stdio: 'inherit',
  });
};

run([
  'buildx',
  'build',
  '--platform',
  platform,
  '-f',
  'backend/Dockerfile',
  '-t',
  'securechat-backend:latest',
  '--output',
  `type=docker,dest=${path.join(exportDir, 'backend-image.tar')}`,
  '.',
]);

run([
  'buildx',
  'build',
  '--platform',
  platform,
  '-f',
  'frontend/Dockerfile',
  '-t',
  'securechat-frontend:latest',
  '--output',
  `type=docker,dest=${path.join(exportDir, 'frontend-image.tar')}`,
  '.',
]);

console.log(`Exported images to ${exportDir}`);
