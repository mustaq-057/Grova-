const CACHE_NAME = "grova-v3";
const urlsToCache = ["/", "/index.html", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
    ),
  );
  self.clients.claim();
});

/** Same-origin only. JS/CSS always network-first so deploys never serve stale React chunks. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  if (url.pathname !== "/" && url.pathname !== "/index.html") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("push", (event) => {
  let targetPath = "/chat";
  let body = "New message";
  let title = "Grova";
  let requireInteraction = false;
  
  if (event.data) {
    try {
      const payload = event.data.json();
      if (typeof payload?.targetPath === "string") targetPath = payload.targetPath;
      if (typeof payload?.body === "string") body = payload.body;
      if (typeof payload?.title === "string") title = payload.title;
      if (payload?.type === "call") {
        requireInteraction = true;
      }
    } catch {
      body = event.data.text();
    }
  }
  const options = {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: { targetPath },
    requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.targetPath || "/chat";
  event.waitUntil(clients.openWindow(targetPath));
});
