import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  process.env = { ...process.env, ...env };
  const NGINX_HTTPS_URL = env.NGINX_HTTPS_URL || 'https://localhost:4430';
  return {
    plugins: [react()],
    root: '.',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: NGINX_HTTPS_URL,
          secure: false,
          changeOrigin: true,
        },
        '/uploads': {
          target: NGINX_HTTPS_URL,
          secure: false,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          dashboard: path.resolve(__dirname, 'src/html/dashboard.html'),
        },
        output: {
          // Force un nom prédictible pour le script du dashboard
          entryFileNames: (chunkInfo: { name: string }) => {
            return chunkInfo.name === 'dashboard' ? 'assets/app.js' : 'assets/[name]-[hash].js';
          },
        },
      },
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@transcendence/core': path.resolve(__dirname, '../shared/core/src/index.ts'),
      },
    },
  };
});
