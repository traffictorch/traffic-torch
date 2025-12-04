export default {
  base: '/traffic-torch/'
}

import { defineConfig } from 'vite'

export default defineConfig({
  base: '/traffic-torch/',
  build: {
    assetsInclude: ['**/*.js'],
    rollupOptions: {
      input: 'index.html',
    }
  },
  publicDir: 'public',
  assetsDir: '',
  // This forces Vite to copy src/*.js into dist/src/
  plugins: [{
    name: 'copy-src',
    writeBundle() {
      const fs = require('fs')
      const path = require('path')
      fs.cpSync('src', 'dist/src', { recursive: true })
    }
  }]
})
