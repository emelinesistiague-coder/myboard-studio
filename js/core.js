/* MYBOARD Studio — noyau : utilitaires, dates, base de données locale (IndexedDB) */
'use strict';
const App = window.App = { views: {}, act: {}, data: {}, state: {} };

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const eur = (n, dec) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec ?? (Math.abs(n) >= 1000 ? 0 : 2) }).format(n || 0);
const pct = n => (n > 0 ? '+' : '') + Math.round(n) + ' %';
const safeUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return /^https?:/i.test(u) ? u : ''; };
const plural = (n, s, p) => `${n} ${n > 1 ? (p || s + 's') : s}`;

/* ---------- Dates (format AAAA-MM-JJ, heure locale) ---------- */
const D = {
  iso(d) { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; },
  parse(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); },
  today() { return D.iso(new Date()); },
  add(s, n) { const d = D.parse(s); d.setDate(d.getDate() + n); return D.iso(d); },
  addMonths(s, n) { const d = D.parse(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return D.iso(d); },
  weekStart(s) { const d = D.parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return D.iso(d); },
  monthStart(s) { return s.slice(0, 7) + '-01'; },
  monthEnd(s) { const d = D.parse(s); return D.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); },
  diff(a, b) { return Math.round((D.parse(b) - D.parse(a)) / 864e5); },
  dow(s) { return (D.parse(s).getDay() + 6) % 7; },
  fmt(s, o = { day: 'numeric', month: 'short' }) { if (!s) return ''; return new Intl.DateTimeFormat('fr-FR', o).format(D.parse(s)); },
  long(s) { return D.fmt(s, { weekday: 'long', day: 'numeric', month: 'long' }); },
  month(s) { return D.fmt(s, { month: 'long', year: 'numeric' }); },
  rel(s) {
    if (!s) return '';
    const n = D.diff(D.today(), s);
    if (n === 0) return "aujourd'hui"; if (n === 1) return 'demain'; if (n === -1) return 'hier';
    if (n > 1 && n < 7) return D.fmt(s, { weekday: 'long' });
    return D.fmt(s, { day: 'numeric', month: 'short' });
  },
  weekLabel(ws) { return `Semaine du ${D.fmt(ws, { day: 'numeric', month: 'long' })}`; },
  DOW: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
};

/* ---------- Base de données locale ---------- */
const COLLS = ['companies', 'tasks', 'posts', 'scripts', 'notes', 'projects', 'goals', 'transactions', 'funnels', 'funnelStats', 'campaigns'];
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('myboard-studio', 2);
      r.onupgradeneeded = () => {
        const db = r.result;
        [...COLLS, 'files', 'meta'].forEach(n => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' }); });
      };
      r.onsuccess = () => { DB.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode = 'readonly') { return DB.db.transaction(store, mode).objectStore(store); },
  req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  all(store) { return DB.req(DB.tx(store).getAll()); },
  get(store, id) { return DB.req(DB.tx(store).get(id)); },
  put(store, obj) { return DB.req(DB.tx(store, 'readwrite').put(obj)); },
  del(store, id) { return DB.req(DB.tx(store, 'readwrite').delete(id)); },
  clear(store) { return DB.req(DB.tx(store, 'readwrite').clear()); },
};

App.load = async () => {
  await DB.open();
  for (const c of COLLS) {
    App.data[c] = new Map();
    (await DB.all(c)).forEach(o => App.data[c].set(o.id, o));
  }
  const meta = await DB.get('meta', 'settings');
  App.meta = meta || { id: 'settings', lastBackup: null, createdAt: Date.now() };
};
App.saveMeta = () => DB.put('meta', App.meta).catch(App.dbError);
App.dbError = e => { console.error(e); App.toast('Erreur d’enregistrement : ' + (e && e.message || e)); };

/* Enregistre un élément (création ou modification) */
App.put = (coll, obj, { silent } = {}) => {
  const now = Date.now();
  if (!obj.id) obj.id = uid();
  if (!obj.createdAt) obj.createdAt = now;
  obj.updatedAt = now;
  App.data[coll].set(obj.id, obj);
  DB.put(coll, obj).catch(App.dbError);
  if (!silent) App.render();
  return obj;
};
App.get = (coll, id) => App.data[coll] && App.data[coll].get(id);
/* Suppression douce : l'élément part dans la corbeille */
App.trash = (coll, id) => {
  const o = App.get(coll, id); if (!o) return;
  o.deletedAt = Date.now(); App.put(coll, o, { silent: true });
  const linked = o.txId && App.get('transactions', o.txId); // revenu ou dépense générés automatiquement
  if (linked) { linked.deletedAt = o.deletedAt; App.put('transactions', linked, { silent: true }); }
  App.toast('Déplacé dans la corbeille', { label: 'Annuler', fn: () => { delete o.deletedAt; App.put(coll, o); } });
  App.render();
};
App.restore = (coll, id) => {
  const o = App.get(coll, id); if (!o) return;
  const linked = o.txId && App.get('transactions', o.txId);
  if (linked && linked.deletedAt) { delete linked.deletedAt; App.put('transactions', linked, { silent: true }); }
  delete o.deletedAt; App.put(coll, o);
};
App.purge = async (coll, id) => {
  const o = App.get(coll, id); if (!o) return;
  App.fileIdsOf(o).forEach(fid => DB.del('files', fid).catch(() => {}));
  App.data[coll].delete(id); await DB.del(coll, id).catch(App.dbError);
};
App.fileIdsOf = o => [...(o.files || []), o.cover, o.logo].filter(Boolean);

/* ---------- Fichiers joints (stockés localement) ---------- */
App.urlCache = new Map();
App.saveFile = async (file, { maxSide } = {}) => {
  let blob = file, name = file.name, type = file.type;
  if (maxSide && /^image\/(png|jpe?g|webp)/.test(type)) {
    try { blob = await App.resizeImage(file, maxSide); type = 'image/jpeg'; } catch (e) { /* garde l'original */ }
  }
  const rec = { id: uid(), name, type, size: blob.size, blob, createdAt: Date.now() };
  await DB.put('files', rec);
  return rec;
};
App.resizeImage = (file, max) => new Promise((res, rej) => {
  const img = new Image(); const u = URL.createObjectURL(file);
  img.onload = () => {
    const r = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', .86);
  };
  img.onerror = rej; img.src = u;
});
App.fileURL = async id => {
  if (App.urlCache.has(id)) return App.urlCache.get(id);
  const rec = await DB.get('files', id); if (!rec) return null;
  const u = URL.createObjectURL(rec.blob); App.urlCache.set(id, u); return u;
};
App.fileMeta = id => DB.get('files', id);
/* Après chaque rendu, charge les images et liens [data-file] */
App.hydrateFiles = root => {
  $$('[data-file]', root).forEach(async el => {
    const u = await App.fileURL(el.dataset.file); if (!u) return;
    if (el.tagName === 'IMG') el.src = u; else el.href = u;
  });
};

/* ---------- Préférences d'interface (par appareil) ---------- */
App.prefs = (() => { try { return JSON.parse(localStorage.getItem('myboard-prefs') || '{}'); } catch (e) { return {}; } })();
App.savePrefs = () => { try { localStorage.setItem('myboard-prefs', JSON.stringify(App.prefs)); } catch (e) { } };
