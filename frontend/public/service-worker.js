/* eslint-disable no-restricted-globals */

// This service worker clears all caches and unregisters itself
// This fixes the issue where old cached files were causing 404 errors

self.addEventListener('install', (event) => {
  console.log('Service Worker: Clearing all caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker: All caches cleared');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and claiming clients...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker: Unregistering...');
      return self.registration.unregister();
    }).then(() => {
      console.log('Service Worker: Unregistered successfully');
      return self.clients.claim();
    })
  );
});

// Don't cache anything - just fetch directly
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, just return error
      return new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
