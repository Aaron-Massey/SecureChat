import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

const configPath = path.join(rootDir, 'config.json');
const envPath = path.join(rootDir, '.env');

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
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

// Ensure non-sensitive default ports and limits are in .env if missing
if (!envMap.has('FRONTEND_PORT')) envMap.set('FRONTEND_PORT', config.FRONTEND_PORT || 5173);
if (!envMap.has('BACKEND_PORT')) envMap.set('BACKEND_PORT', config.BACKEND_PORT || 3000);
if (!envMap.has('DOCKER_NETWORK')) envMap.set('DOCKER_NETWORK', 'cloudflared');
if (!envMap.has('VITE_MAX_QUEUE_SIZE')) envMap.set('VITE_MAX_QUEUE_SIZE', config.MAX_QUEUE_SIZE || 50);
if (!envMap.has('VITE_MAX_MESSAGES_PER_MINUTE')) envMap.set('VITE_MAX_MESSAGES_PER_MINUTE', config.MAX_MESSAGES_PER_MINUTE || 30);

const envLines = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`);
writeFileSync(envPath, `${envLines.join('\n')}\n`);
console.log('.env verified (config.json kept clean of environment secrets)');
