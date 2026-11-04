/* Çevrimdışı çalışma: sayfa, kütüphaneler ve fontlar önbelleğe alınır; hava API cevapları ayrı, sınırlı bir önbellekte tutulur. */
const V = 'mk-v13', AV = 'mk-api-v1';
const API_MAX = 60, API_TTL = 24 * 3600e3;   // en fazla 60 kayıt, çevrimdışı yedek olarak en çok 24 saat eski cevap
const FONTS = ['patrick-hand-latin-400', 'patrick-hand-latin-ext-400', 'bebas-neue-latin-400', 'bebas-neue-latin-ext-400', 'oswald-latin-300', 'oswald-latin-ext-300', 'oswald-latin-400', 'oswald-latin-ext-400'].map(n => 'fonts/' + n + '-normal.woff2');
const SHELL = ['./?v=kristal-2', 'manifest.webmanifest', 'icon.png', 'icon-512.png', 'apple-touch-icon.png', 'badge.png', 'css/style.css?v=kristal-2', 'css/classic.css', 'css/fonts.css', 'js/app.js?v=kristal-3', 'js/kristal.js?v=kristal-7', 'lib/chart.umd.min.js', 'lib/leaflet.js', 'lib/leaflet.css', 'gizlilik.html'].concat(FONTS);
const API = /(open-meteo\.com|api\.met\.no|wttr\.in|api\.rainviewer\.com|raw\.githubusercontent\.com)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== AV).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* API cevabını zaman damgasıyla kaydet, sınırı aşan en eski kayıtları sil */
async function putApi(r, res) {
  const c = await caches.open(AV), h = new Headers(res.headers);
  h.set('x-mk-cached', String(Date.now()));
  await c.put(r, new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: h }));
  const ks = await c.keys();
  for (let i = 0; i < ks.length - API_MAX; i++) await c.delete(ks[i]);
}
async function getApi(r) {
  const c = await caches.open(AV), hit = await c.match(r);
  if (!hit) return null;
  if (Date.now() - (+hit.headers.get('x-mk-cached') || 0) > API_TTL) { await c.delete(r); return null; }
  return hit;
}

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const mine = u.origin === location.origin, api = API.test(u.hostname);
  if (!mine && !api) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok) {
        if (mine) { const c = await caches.open(V); c.put(r, res.clone()); }
        else e.waitUntil(putApi(r, res.clone()).catch(() => {}));
      }
      return res;
    } catch (err) {
      if (!mine) { const hit = await getApi(r); if (hit) return hit; throw err; }
      const c = await caches.open(V), hit = await c.match(r, { ignoreSearch: true });
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
