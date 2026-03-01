import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: '/theyellow/songer/',
  server: {
    proxy: {
      '/theyellow/songer/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/theyellow\/songer/, '')
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
