import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const exportDir = path.join(rootDir, 'exports');
const platform = 'linux/arm64';

// Check if Docker daemon is running
try {
  execFileSync('docker', ['info'], { stdio: 'ignore' });
} catch (err) {
  console.error('\n====================================================');
  console.error('❌ Error: Docker Desktop is not running!');
  console.error('====================================================');
  console.error('Please launch Docker Desktop on your computer, wait for it');
  console.error('to start, and run "npm run deploy:pi" again.\n');
  process.exit(1);
}

mkdirSync(exportDir, { recursive: true });

const run = (args) => {
  try {
    execFileSync('docker', args, {
      cwd: rootDir,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  } catch (err) {
    console.error(`\n❌ Error executing "docker ${args.join(' ')}":`);
    console.error(err.message);
    process.exit(1);
  }
};

console.log('Building backend ARM64 Docker image...');
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

console.log('Building frontend ARM64 Docker image...');
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

console.log(`\nSuccessfully exported ARM64 images to ${exportDir}`);
