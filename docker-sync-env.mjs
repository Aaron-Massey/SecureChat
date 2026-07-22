import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

const config = JSON.parse(readFileSync(path.join(rootDir, 'config.json'), 'utf-8'));

const envLines = [
  `FRONTEND_PORT=${config.FRONTEND_PORT}`,
  `BACKEND_PORT=${config.BACKEND_PORT}`,
];

writeFileSync(path.join(rootDir, '.env'), `${envLines.join('\n')}\n`);
console.log('Synced .env from config.json');
