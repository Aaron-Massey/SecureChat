import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import * as fs from 'node:fs';
import * as path from 'node:path';

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: config.FRONTEND_PORT,
    proxy: {
      '/socket.io': {
        target: config.USE_HTTPS ? `https://localhost:${config.BACKEND_PORT}` : `http://localhost:${config.BACKEND_PORT}`,
        ws: true,
        secure: false,
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(config.BACKEND_PORT),
    'import.meta.env.VITE_KEY_DERIVATION_ITERATIONS': JSON.stringify(config.KEY_DERIVATION_ITERATIONS),
    'import.meta.env.VITE_KEY_DERIVATION_SALT': JSON.stringify(config.KEY_DERIVATION_SALT),
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
