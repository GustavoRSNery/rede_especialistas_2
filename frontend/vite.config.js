import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite — Configuração de build do frontend React
 *
 * Input:  frontend/view/react/main.jsx
 * Output: frontend/dist/   (copiado para o runtime Docker)
 *
 * Em dev (npm run dev) faz proxy das chamadas /backend/**
 * para o nginx local na porta 80, mantendo a mesma lógica
 * de roteamento do docker-compose.
 */
export default defineConfig({
  plugins: [react()],

  root: 'view',

  test: {
    environment: 'node',
    globals: true,
    include: ['../tests/**/*.test.{js,jsx}'],
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      // Code splitting manual por página (Lazy Loading garantido pelo React.lazy)
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'view/react'),
      '@css': path.resolve(__dirname, 'view/css'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Fila de comandos Redis → BFF Express
      '/api/queue': {
        target: process.env.VITE_BFF_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      // Cache Redis LRU → BFF Express
      '/api/cache': {
        target: process.env.VITE_BFF_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/backend': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
      '/frontend': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
});
