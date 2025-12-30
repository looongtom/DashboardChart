import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'app/renderer/views',
  server: {
    port: 3000, // Thay đổi port tại đây
  },
  build: {
    outDir: '../../../dist',
  },
  base: './', // rất quan trọng cho file:// trong Electron
});