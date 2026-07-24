import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

// Helper to parse CLI args like --host=192.168.1.50
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    acc[key] = val !== undefined ? val : true;
  }
  return acc;
}, {});

// Read config.json
let config = {};
const configPath = path.join(rootDir, 'config.json');
if (existsSync(configPath)) {
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.warn('Warning: Could not parse config.json');
  }
}

// Read .env file if present
const envFileVars = {};
const envPath = path.join(rootDir, '.env');
if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          envFileVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
        }
      }
    }
  } catch (err) {
    // Ignore read error
  }
}

// Determine SSH target info (Priority: CLI args > OS env > .env file > config.json > defaults)
const piHost = args.host || process.env.PI_HOST || envFileVars.PI_HOST || config.PI_HOST || 'raspberrypi.local';
const piUser = args.user || process.env.PI_USER || envFileVars.PI_USER || config.PI_USER || 'pi';
const piPath = args.path || process.env.PI_PATH || envFileVars.PI_PATH || config.PI_PATH || '~/securechat';
const piPort = String(args.port || process.env.PI_PORT || envFileVars.PI_PORT || config.PI_PORT || '22');
const sshKey = args.key || process.env.PI_SSH_KEY || envFileVars.PI_SSH_KEY || config.PI_SSH_KEY || null;

const target = `${piUser}@${piHost}`;

console.log('----------------------------------------------------');
console.log(`Raspberry Pi Deploy Target: ${target}:${piPath}`);
console.log('----------------------------------------------------\n');

// Step 1: Build & Export Docker images unless --skip-build is specified
if (!args['skip-build']) {
  console.log('=== Step 1/3: Syncing config & building ARM64 Docker images ===');
  execFileSync('node', ['docker-sync-env.mjs'], { cwd: rootDir, stdio: ['ignore', 'inherit', 'inherit'] });
  execFileSync('node', ['docker-export.mjs'], { cwd: rootDir, stdio: ['ignore', 'inherit', 'inherit'] });
} else {
  console.log('=== Step 1/3: Skipping Docker build (--skip-build set) ===');
}

// Verify exported image tarballs exist
const backendTar = path.join(rootDir, 'exports', 'backend-image.tar');
const frontendTar = path.join(rootDir, 'exports', 'frontend-image.tar');

if (!existsSync(backendTar) || !existsSync(frontendTar)) {
  console.error('\nError: Image tar files missing in exports directory!');
  console.error('Run "npm run docker:export" before deploying.');
  process.exit(1);
}

// Common SSH & SCP options (BatchMode=yes avoids hanging on password/fingerprint prompts)
const sshBaseArgs = [
  '-p', piPort,
  '-o', 'BatchMode=yes',
  '-o', 'StrictHostKeyChecking=accept-new'
];

const scpBaseArgs = [
  '-P', piPort,
  '-r',
  '-o', 'BatchMode=yes',
  '-o', 'StrictHostKeyChecking=accept-new'
];

if (sshKey) {
  sshBaseArgs.push('-i', sshKey);
  scpBaseArgs.push('-i', sshKey);
}

// Helper to run SSH command
function runSSH(cmdString) {
  const fullArgs = [...sshBaseArgs, target, cmdString];
  const res = spawnSync('ssh', fullArgs, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (res.status !== 0) {
    throw new Error(`SSH command failed with exit code ${res.status}`);
  }
}

// Helper to run SCP command
function runSCP(files, destination) {
  const fullArgs = [...scpBaseArgs, ...files, destination];
  const res = spawnSync('scp', fullArgs, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (res.status !== 0) {
    throw new Error(`SCP command failed with exit code ${res.status}`);
  }
}

// Step 2: Transfer payload to Pi
console.log('\n=== Step 2/3: Creating remote directory & uploading deployment files ===');
try {
  runSSH(`mkdir -p ${piPath}`);
  
  const filesToCopy = [
    backendTar,
    frontendTar,
    path.join(rootDir, 'docker-compose.yml'),
    path.join(rootDir, '.env'),
    path.join(rootDir, 'config.json'),
    path.join(rootDir, 'pi', 'update-containers.sh'),
  ];

  if (existsSync(path.join(rootDir, 'certs'))) {
    filesToCopy.push(path.join(rootDir, 'certs'));
  }

  console.log(`Uploading files to ${target}:${piPath}...`);
  runSCP(filesToCopy, `${target}:${piPath}/`);
} catch (err) {
  console.error('\n❌ Error during file transfer to Raspberry Pi:');
  console.error(err.message);
  console.error('\nPlease check:');
  console.error(` 1. Is your Pi accessible at ${piHost}?`);
  console.error(` 2. Is SSH running on port ${piPort}?`);
  console.error(' 3. Have you set up your SSH Key (PI_SSH_KEY)?');
  console.error('    (Or copied your key using: type $env:USERPROFILE\\.ssh\\id_ed25519.pub | ssh user@host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys")\n');
  process.exit(1);
}

// Step 3: Run update script on Pi
console.log('\n=== Step 3/3: Recreating containers on Raspberry Pi ===');
try {
  runSSH(`cd ${piPath} && sh update-containers.sh`);
  console.log('\n====================================================');
  console.log(' Successfully deployed updates to Raspberry Pi!');
  console.log('====================================================\n');
} catch (err) {
  console.error('\n❌ Error executing container update on Raspberry Pi:');
  console.error(err.message);
  process.exit(1);
}
