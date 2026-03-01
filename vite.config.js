import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: '/theyellow/songscryer/',
  server: {
    proxy: {
      '/theyellow/songscryer/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/theyellow\/songscryer/, '')
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
