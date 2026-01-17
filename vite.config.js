// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),                  // homepage
        'local-seo-tool': resolve(__dirname, 'local-seo-tool/index.html'),
        'seo-intent-tool': resolve(__dirname, 'seo-intent-tool/index.html'),
        'quit-risk-tool': resolve(__dirname, 'quit-risk-tool/index.html'),
        // Add one line for EVERY tool folder you have, e.g.:
        // 'seo-ux-tool': resolve(__dirname, 'seo-ux-tool/index.html'),
        // 'ai-audit-tool': resolve(__dirname, 'ai-audit-tool/index.html'),
        // etc. — do this for all 10+ tools
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})