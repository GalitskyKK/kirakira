import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    VitePWA({
      registerType: 'prompt', // ✅ Показываем кнопку обновления + автообновление при закрытии
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/favicon-16x16.png',
        'icons/favicon-32x32.png',
      ],
      devOptions: {
        enabled: true, // Для тестирования
      },
      // Регистрируем SW вручную через virtual:pwa-register,
      // чтобы можно было отключить его в Telegram WebApp.
      injectRegister: null,
      manifest: {
        name: 'KiraKira - Digital Emotional Garden',
        short_name: 'KiraKira',
        description:
          'A meditative PWA where your daily emotions bloom into a unique digital garden',
        theme_color: '#10b981',
        background_color: '#f0fdf4',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif}'],
        // Очистка старых кэшей при обновлении
        cleanupOutdatedCaches: true,
        // ✅ АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ: Service Worker обновляется немедленно
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // ✅ КРИТИЧНО: JS чанки с NetworkFirst стратегией
            // Это гарантирует получение свежих версий при деплое
            urlPattern: /\.js$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-chunks-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour - короткий кеш для JS
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // API запросы с network-first стратегией
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: id => {
          const normalized = id.replace(/\\/g, '/')
          if (normalized.includes('node_modules')) return 'vendor'
          if (normalized.includes('/src/pages/')) {
            const name = path.basename(normalized, path.extname(normalized))
            return `page-${name}`
          }
          return undefined
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
