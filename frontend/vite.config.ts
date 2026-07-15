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
  },
  define: {
    'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(config.BACKEND_PORT),
    'import.meta.env.VITE_KEY_DERIVATION_ITERATIONS': JSON.stringify(config.KEY_DERIVATION_ITERATIONS)
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
