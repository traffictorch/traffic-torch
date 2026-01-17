// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    // Forces hashed filenames for JS/CSS/assets → safe long caching, no stale issues
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
  // ... any other plugins/config
})