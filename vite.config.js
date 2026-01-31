import { defineConfig } from 'vite';

export default defineConfig({
  base: '/durham-trees/', // Change this to match your GitHub repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
