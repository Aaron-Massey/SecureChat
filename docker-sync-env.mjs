import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

const config = JSON.parse(readFileSync(path.join(rootDir, 'config.json'), 'utf-8'));
const envPath = path.join(rootDir, '.env');

// Read existing .env into a key-value map to preserve existing secrets/PI variables
const envMap = new Map();

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        envMap.set(key, val);
      }
    }
  }
}

// Sync config values
envMap.set('FRONTEND_PORT', config.FRONTEND_PORT || 5173);
envMap.set('BACKEND_PORT', config.BACKEND_PORT || 3000);

if (config.PI_HOST) envMap.set('PI_HOST', config.PI_HOST);
if (config.PI_USER) envMap.set('PI_USER', config.PI_USER);
if (config.PI_PATH) envMap.set('PI_PATH', config.PI_PATH);
if (config.PI_PORT) envMap.set('PI_PORT', config.PI_PORT);
if (config.PI_SSH_KEY) envMap.set('PI_SSH_KEY', config.PI_SSH_KEY);

const envLines = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`);
writeFileSync(envPath, `${envLines.join('\n')}\n`);
console.log('Synced .env from config.json (preserved custom .env variables)');
