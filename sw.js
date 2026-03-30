const CACHE = 'tangent-v1'
const FILES = [
  '/Tangent-Website/dashboard.html',
  '/Tangent-Website/dashboard.css',
  '/Tangent-Website/dashboard.js'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request)
    })
  )
})
