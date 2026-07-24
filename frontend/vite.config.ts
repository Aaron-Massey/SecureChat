import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import * as fs from 'node:fs';
import * as path from 'node:path';

let config: any = {};
const configPath = path.resolve(__dirname, '../config.json');
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    // fallback
  }
}

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || config.FRONTEND_PORT || 5173);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || config.BACKEND_PORT || 3000);
const KEY_DERIVATION_ITERATIONS = Number(config.KEY_DERIVATION_ITERATIONS || 10);
const KEY_DERIVATION_SALT = String(config.KEY_DERIVATION_SALT || 'securechat-default-salt');
const USE_HTTPS = config.USE_HTTPS ?? true;

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: FRONTEND_PORT,
    proxy: {
      '/socket.io': {
        target: USE_HTTPS ? `https://localhost:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`,
        ws: true,
        secure: false,
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(BACKEND_PORT),
    'import.meta.env.VITE_KEY_DERIVATION_ITERATIONS': JSON.stringify(KEY_DERIVATION_ITERATIONS),
    'import.meta.env.VITE_KEY_DERIVATION_SALT': JSON.stringify(KEY_DERIVATION_SALT),
    'import.meta.env.VITE_TURN_SERVER_URL': JSON.stringify(process.env.TURN_SERVER_URL || config.TURN_SERVER_URL || ''),
    'import.meta.env.VITE_TURN_USERNAME': JSON.stringify(process.env.TURN_USERNAME || config.TURN_USERNAME || ''),
    'import.meta.env.VITE_TURN_PASSWORD': JSON.stringify(process.env.TURN_PASSWORD || config.TURN_PASSWORD || '')
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url))
    },
  },
})
