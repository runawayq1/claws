const CACHE_NAME = 'claws-v1.0.20'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  // No precache — first navigation will populate via network-first.
  event.waitUntil(caches.open(CACHE_NAME))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Never cache the service worker itself
  if (url.pathname === '/sw.js') return

  // Network-first for navigation / HTML — guarantees a deploy is picked up
  // immediately. Falls back to cache when offline.
  const isNav = event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')
  if (isNav) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('/')))
    )
    return
  }

  // Cache-first for hashed static assets — they're immutable.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const ext = url.pathname.split('.').pop()
        const cacheableExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'ogg', 'mp3', 'wav', 'json', 'woff', 'woff2']

        if (cacheableExts.includes(ext)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }

        return response
      })
    })
  )
})
