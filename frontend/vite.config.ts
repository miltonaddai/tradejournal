import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // WEB_PORT / PORT let `PORT=4001 WEB_PORT=4000 yarn dev` run both apps on other ports.
    port: Number(process.env.WEB_PORT) || 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${Number(process.env.PORT) || 3001}`,
        changeOrigin: true,
      },
    },
  },
})
