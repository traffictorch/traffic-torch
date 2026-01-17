// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),                        // homepage / dashboard

        // All deep-dive tool pages
        'ai-audit-tool': resolve(__dirname, 'ai-audit-tool/index.html'),
        'ai-search-optimization-tool': resolve(__dirname, 'ai-search-optimization-tool/index.html'),
        'keyword-tool': resolve(__dirname, 'keyword-tool/index.html'),
        'keyword-vs-tool': resolve(__dirname, 'keyword-vs-tool/index.html'),
        'keyword-research': resolve(__dirname, 'keyword-research/index.html'),
        'local-seo-tool': resolve(__dirname, 'local-seo-tool/index.html'),
        'quit-risk-tool': resolve(__dirname, 'quit-risk-tool/index.html'),
        'seo-intent-tool': resolve(__dirname, 'seo-intent-tool/index.html'),

        // Static / informational pages
        'ai-seo-ux-tools': resolve(__dirname, 'ai-seo-ux-tools/index.html'),
        'about': resolve(__dirname, 'about/index.html'),
        'contact': resolve(__dirname, 'contact/index.html'),
        'privacy': resolve(__dirname, 'privacy/index.html'),
        'terms': resolve(__dirname, 'terms/index.html'),
        'news': resolve(__dirname, 'news.html'),                       // note: this one is not in folder
        '404': resolve(__dirname, '404.html')                          // custom 404
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})