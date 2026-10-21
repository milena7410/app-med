import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dosecerta-mark.svg'],
      manifest: {
        name: 'DoseCerta',
        short_name: 'DoseCerta',
        description: 'Conversões matemáticas com unidades explícitas.',
        lang: 'pt-BR',
        theme_color: '#143d39',
        background_color: '#f5f7f4',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/dosecerta-mark.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})