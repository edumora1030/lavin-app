import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: path.resolve(__dirname, '../public/dist'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3500', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:3500', changeOrigin: true },
      '/assets': { target: 'http://127.0.0.1:3500', changeOrigin: true },
    },
  },
});
