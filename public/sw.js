const CACHE_NAME = 'claws-v4'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the shell — dynamic assets cached on first fetch
      return cache.addAll(['/'])
    })
  )
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

  // Only cache same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip service worker file itself
  if (url.pathname === '/sw.js') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        // Only cache valid responses for cacheable asset types
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const ext = url.pathname.split('.').pop()
        const cacheableExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'ogg', 'mp3', 'wav', 'json', 'html', 'woff', 'woff2']

        if (cacheableExts.includes(ext) || url.pathname === '/') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }

        return response
      })
    }).catch(() => {
      // Offline fallback — return cached root if available
      if (event.request.mode === 'navigate') {
        return caches.match('/')
      }
    })
  )
})
