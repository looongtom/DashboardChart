import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
  },
  base: './', // rất quan trọng cho file:// trong Electron
});