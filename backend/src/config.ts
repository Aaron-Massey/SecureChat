import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppConfig {
  FRONTEND_PORT: number;
  BACKEND_PORT: number;
  CORS_ORIGIN: string;
  KEY_DERIVATION_ITERATIONS: number;
  KEY_DERIVATION_SALT: string;
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Search candidate paths for config.json (works in both src/ tsx and dist/ runtime)
  const candidatePaths = [
    path.resolve(__dirname, '../../config.json'),
    path.resolve(__dirname, '../config.json'),
    path.resolve(process.cwd(), 'config.json')
  ];

  for (const configPath of candidatePaths) {
    if (fs.existsSync(configPath)) {
      try {
        const rawData = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(rawData);
        cachedConfig = {
          FRONTEND_PORT: Number(process.env.FRONTEND_PORT || parsed.FRONTEND_PORT || 5173),
          BACKEND_PORT: Number(process.env.PORT || process.env.BACKEND_PORT || parsed.BACKEND_PORT || 3000),
          CORS_ORIGIN: process.env.CORS_ORIGIN || parsed.CORS_ORIGIN || '*',
          KEY_DERIVATION_ITERATIONS: Number(parsed.KEY_DERIVATION_ITERATIONS || 10),
          KEY_DERIVATION_SALT: String(parsed.KEY_DERIVATION_SALT || 'securechat-default-salt')
        };
        return cachedConfig;
      } catch (err) {
        console.warn(`Failed to parse config file at ${configPath}:`, err);
      }
    }
  }

  // Fallback defaults if config file is missing
  cachedConfig = {
    FRONTEND_PORT: Number(process.env.FRONTEND_PORT || 5173),
    BACKEND_PORT: Number(process.env.PORT || process.env.BACKEND_PORT || 3000),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    KEY_DERIVATION_ITERATIONS: 10,
    KEY_DERIVATION_SALT: 'securechat-default-salt'
  };

  return cachedConfig;
}
