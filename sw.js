// Service worker: makes the site installable, works offline, and shows notifications.
const CACHE = "emerit-v2";
const SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates appear straight away), cache as the offline fallback.
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match("/index.html")))
  );
});

// Tapping a notification opens the app on that event.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ("focus" in c) { c.postMessage({ open: id }); return c.focus(); }
      }
      return clients.openWindow("/?event=" + encodeURIComponent(id || ""));
    })
  );
});
