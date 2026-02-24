/* ─── YourCVPassport Service Worker ───────────────────────── */
const CACHE_NAME = 'yourcvpassport-sw-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ── Push event: show browser notification ────────────────── */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title   = data.title   || 'YourCVPassport';
  const body    = data.body    || '';
  const url     = data.url     || '/';
  const tag     = data.tag     || 'ycvp-notification';
  const type    = data.type    || 'general';

  const options = {
    body,
    icon:   '/favicon-192x192.png',
    badge:  '/favicon-32x32.png',
    tag,
    data:   { url, type },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/* ── Notification click: focus existing tab or open new one ─ */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already open, focus it
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus();
            // Navigate to the specific URL if possible
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // No existing tab — open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
