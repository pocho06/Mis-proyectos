const CACHE_NAME = "libertad-y-cambio-v38";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./biblioteca.html",
  "./admin.html",
  "./donde-voto.html",
  "./styles.css",
  "./script.js",
  "./manifest.webmanifest",
  "./imagen/favicon-libertad-cambio.png",
  "./imagen/app-icon-192.png",
  "./imagen/app-icon-512.png",
  "./imagen/logo-libertad-cambio-nuevo-recortado.png",
  "./imagen/logo-donde-votas.png",
  "./imagen/IMG_2984.PNG",
  "./imagen/IMG_2985.PNG",
  "./imagen/IMG_2986.PNG",
  "./imagen/IMG_2987.PNG",
  "./imagen/IMG_2988.PNG",
  "./imagen/charlas-eventos.jpeg",
  "./imagen/propuestas/candidatos-centro.jpeg",
  "./imagen/propuestas/candidatos-consejo.jpeg",
  "./imagen/propuestas/transparencia-consejo.jpeg",
  "./imagen/propuestas/convenios-sector-privado.jpeg",
  "./imagen/propuestas/bono-opcional.jpeg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.endsWith("/padron.csv")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return networkResponse;
        });
      })
  );
});





