// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/',
  plugins: [
    viteStaticCopy({
      targets: [
        // Copy non-HTML files (js, css, images, etc.) from EVERY tool folder → preserve local structure in dist
        // Use glob to exclude index.html automatically
        { src: 'local-seo-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'local-seo-tool' },
        { src: 'seo-intent-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'seo-intent-tool' },
        { src: 'quit-risk-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'quit-risk-tool' },
        { src: 'ai-audit-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'ai-audit-tool' },
        { src: 'ai-search-optimization-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'ai-search-optimization-tool' },
        { src: 'keyword-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'keyword-tool' },
        { src: 'keyword-vs-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'keyword-vs-tool' },
        { src: 'keyword-research/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'keyword-research' },
        { src: 'seo-ux-tool/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'seo-ux-tool' },              // added from screenshot
        { src: 'ai-seo-ux-tools/*.{js,css,png,jpg,jpeg,svg,webp}', dest: 'ai-seo-ux-tools' },      // added
        // Add more tools if you create them later (copy-paste line & change folder name)
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),                        // homepage/dashboard

        // Deep-dive tool pages (from your screenshot)
        'local-seo-tool': resolve(__dirname, 'local-seo-tool/index.html'),
        'seo-intent-tool': resolve(__dirname, 'seo-intent-tool/index.html'),
        'quit-risk-tool': resolve(__dirname, 'quit-risk-tool/index.html'),
        'ai-audit-tool': resolve(__dirname, 'ai-audit-tool/index.html'),
        'ai-search-optimization-tool': resolve(__dirname, 'ai-search-optimization-tool/index.html'),
        'keyword-tool': resolve(__dirname, 'keyword-tool/index.html'),
        'keyword-vs-tool': resolve(__dirname, 'keyword-vs-tool/index.html'),
        'keyword-research': resolve(__dirname, 'keyword-research/index.html'),
        'seo-ux-tool': resolve(__dirname, 'seo-ux-tool/index.html'),                // added
        'ai-seo-ux-tools': resolve(__dirname, 'ai-seo-ux-tools/index.html'),        // added

        // Static/informational pages
        'about': resolve(__dirname, 'about/index.html'),
        'contact': resolve(__dirname, 'contact/index.html'),
        'privacy': resolve(__dirname, 'privacy/index.html'),
        'terms': resolve(__dirname, 'terms/index.html'),
        'news': resolve(__dirname, 'news.html'),                           // flat file
        '404': resolve(__dirname, '404.html'),

        // Blog posts (manual for now – you can switch to vite-plugin-pages later for auto)
        'blog/posts/developing-traffic-torch-tools': resolve(__dirname, 'blog/posts/developing-traffic-torch-tools.html'),
        'blog/posts/traffic-torch-seo-ux-analysis-tool-build': resolve(__dirname, 'blog/posts/traffic-torch-seo-ux-analysis-tool-build.html'),
        // Add new blog posts here when created (or install vite-plugin-pages for auto-discovery)
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})