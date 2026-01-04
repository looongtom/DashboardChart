import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  server: {
    port: 3000, // Thay đổi port tại đây
  },
  build: {
    outDir: '../../dist',
    // Ensure main process files and Node.js workers are not processed
    rollupOptions: {
      external: (id) => {
        // Exclude Node.js built-in modules and main process files
        if (id.startsWith('node:') || 
            id.includes('worker_threads') || 
            id.includes('dgram') ||
            id.includes('src/main')) {
          return true;
        }
        return false;
      },
    },
  },
  // Exclude Node.js modules from dependency optimization
  optimizeDeps: {
    exclude: ['worker_threads', 'dgram'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: './', // rất quan trọng cho file:// trong Electron
  // Worker configuration for Web Workers in renderer (if needed)
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
});