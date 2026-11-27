/* MYBOARD Studio — service worker : l'application fonctionne hors ligne.
   Pense à changer VERSION quand tu modifies un fichier pour forcer la mise à jour. */
const VERSION = 'myboard-v2';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'js/core.js', 'js/model.js', 'js/ui.js', 'js/editor.js', 'js/main.js',
  'js/views/today.js', 'js/views/dashboard.js', 'js/views/agenda.js', 'js/views/content.js', 'js/views/scripts.js',
  'js/views/ideas.js', 'js/views/funnels.js', 'js/views/projects.js', 'js/views/finance.js', 'js/views/settings.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
