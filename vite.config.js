import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      // Tell Vite this is multi-page
      input: {
        main: './index.html',              // home
        'local-seo-tool': './local-seo-tool.html',   // add one per page
        // add others as you create them, e.g.:
        // about: './about.html',
        // 'ai-seo-ux-tools': './ai-seo-ux-tools.html',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})