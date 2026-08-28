// sw.js — Service Worker — Restaurando Vidas
const CACHE_NAME = 'restaurando-vidas-v1';
const urlsToCache = [
  '/restaurando-vidas/',
  '/restaurando-vidas/index.html',
  '/restaurando-vidas/logo.png',
  '/restaurando-vidas/logo.jpeg',
  '/restaurando-vidas/assinatura2.png',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request).then(function(response) {
        return response || caches.match('/restaurando-vidas/index.html');
      });
    })
  );
});
