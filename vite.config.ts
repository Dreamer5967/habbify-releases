import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function removeCrossorigin() {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/\s*crossorigin(=["'][^"']*["'])?/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
