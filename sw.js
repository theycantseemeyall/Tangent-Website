const CACHE = 'tangent-v2'  // bump this version number every deploy

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      '/Tangent-Website/dashboard.html',
      '/Tangent-Website/dashboard.css',
      '/Tangent-Website/dashboard.js'
    ]))
  )
  self.skipWaiting()  // activate immediately, don't wait
})

self.addEventListener('activate', e => {
  // delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()  // take control of all open tabs immediately
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})