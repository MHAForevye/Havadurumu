/* Çevrimdışı çalışma: sayfa, kütüphaneler, fontlar ve hava API cevapları önbelleğe alınır; ağ yoksa son kayıt kullanılır. */
const V = 'mk-v9';
const FONTS = ['patrick-hand-latin-400', 'patrick-hand-latin-ext-400', 'bebas-neue-latin-400', 'bebas-neue-latin-ext-400', 'oswald-latin-300', 'oswald-latin-ext-300', 'oswald-latin-400', 'oswald-latin-ext-400'].map(n => 'fonts/' + n + '-normal.woff2');
const SHELL = ['./?v=kristal-2', 'manifest.webmanifest', 'icon.png', 'badge.png', 'css/style.css?v=kristal-2', 'css/classic.css', 'css/fonts.css', 'js/app.js?v=kristal-2', 'js/kristal.js?v=kristal-4', 'lib/chart.umd.min.js', 'lib/leaflet.js', 'lib/leaflet.css', 'gizlilik.html'].concat(FONTS);
const API = /(open-meteo\.com|api\.met\.no|wttr\.in|api\.rainviewer\.com|raw\.githubusercontent\.com)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const mine = u.origin === location.origin, api = API.test(u.hostname);
  if (!mine && !api) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    try {
      const res = await fetch(r);
      if (res.ok) c.put(r, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(r, { ignoreSearch: mine });
      if (hit) return hit;
      if (r.mode === 'navigate') { const p = await c.match('./', { ignoreSearch: true }); if (p) return p; }
      throw err;
    }
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
