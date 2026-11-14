import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/Jaysha_Carpet/',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
      },
    },
  },
}))
