import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppConfig {
  FRONTEND_PORT: number;
  BACKEND_PORT: number;
  CORS_ORIGIN: string;
  KEY_DERIVATION_ITERATIONS: number;
  KEY_DERIVATION_SALT: string;
  USE_HTTPS: boolean;
  SSL_CERT_PATH: string;
  SSL_KEY_PATH: string;
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

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
          KEY_DERIVATION_SALT: String(parsed.KEY_DERIVATION_SALT || 'securechat-default-salt'),
          USE_HTTPS: process.env.USE_HTTPS ? process.env.USE_HTTPS === 'true' : (parsed.USE_HTTPS ?? true),
          SSL_CERT_PATH: String(process.env.SSL_CERT_PATH || parsed.SSL_CERT_PATH || 'certs/server.crt'),
          SSL_KEY_PATH: String(process.env.SSL_KEY_PATH || parsed.SSL_KEY_PATH || 'certs/server.key')
        };
        return cachedConfig;
      } catch (err) {
        console.warn(`Failed to parse config file at ${configPath}:`, err);
      }
    }
  }

  cachedConfig = {
    FRONTEND_PORT: Number(process.env.FRONTEND_PORT || 5173),
    BACKEND_PORT: Number(process.env.PORT || process.env.BACKEND_PORT || 3000),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    KEY_DERIVATION_ITERATIONS: 10,
    KEY_DERIVATION_SALT: 'securechat-default-salt',
    USE_HTTPS: process.env.USE_HTTPS ? process.env.USE_HTTPS === 'true' : true,
    SSL_CERT_PATH: 'certs/server.crt',
    SSL_KEY_PATH: 'certs/server.key'
  };

  return cachedConfig;
}
