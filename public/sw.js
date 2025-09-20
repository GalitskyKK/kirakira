// Simple service worker for KiraKira PWA
// This will be replaced by Vite PWA plugin in production

const CACHE_NAME = 'kirakira-v1'
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/styles/index.css'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})
