/* MYBOARD Studio — Connexions : collecte automatique et synchronisation entre appareils
   Les données arrivent du collecteur Google (collecteur/Code.gs), puis sont transformées ici
   en statistiques de tunnels, revenus, frais, campagnes et publications. */
'use strict';
const CX = App.collector = { cache: null, busy: false, timer: null };
const cfg = () => (App.meta.collector = App.meta.collector || { url: '', key: '', purgedPending: [], uploaded: [] });
App.collectorOn = () => !!(App.meta.collector && App.meta.collector.url && App.meta.collector.key);

/* ---------- Appel au collecteur ---------- */
CX.call = async (action, body = {}) => {
  const c = cfg();
  const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({}, body, { action, key: c.key })) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Réponse invalide du collecteur');
  return j;
};
CX.loadCache = async () => { if (!CX.cache) CX.cache = (await DB.get('meta', 'collector-cache')) || { id: 'collector-cache', visits: {}, sales: {}, ads: {}, ig: [], accounts: null, errors: [] }; return CX.cache; };
CX.saveCache = () => DB.put('meta', CX.cache).catch(App.dbError);

/* ---------- Collecte : récupère les nouveautés puis les applique ---------- */
CX.pull = async ({ refresh } = {}) => {
  if (!App.collectorOn() || CX.busy || !navigator.onLine) return;
  CX.busy = true; const c = cfg();
  try {
    const since = c.lastPull ? D.add(c.lastPull, -3) : '2000-01-01';
    const res = await CX.call(refresh ? 'refresh' : 'pull', { since });
    const cache = await CX.loadCache();
    res.visits.forEach(v => { cache.visits[v.slice(0, 5).join('|')] = v; });
    res.sales.forEach(s => { cache.sales[s.id] = s; });
    res.ads.forEach(a => { cache.ads[a.date + '|' + a.campaignId] = a; });
    cache.ig = res.ig || []; cache.accounts = res.accounts; cache.errors = res.errors || []; cache.lastRun = res.lastRun;
    await CX.saveCache();
    c.lastPull = res.today; c.lastPullAt = Date.now(); c.error = null; App.saveMeta();
    CX.apply();
  } catch (e) { c.error = String(e.message || e); App.saveMeta(); console.warn(e); }
  finally { CX.busy = false; if (App.state.view === 'settings') App.render(); }
};

/* Écrit seulement si quelque chose a réellement changé (évite le bruit de synchronisation) */
const strip = o => JSON.stringify(o, (k, v) => (k === 'updatedAt' || k === 'createdAt' || k === '_s') ? undefined : v);
const putIfChanged = (coll, obj) => {
  const cur = App.data[coll].get(obj.id);
  if (cur && !cur.deletedAt && strip(cur) === strip(Object.assign({}, cur, obj))) return false;
  const o = Object.assign({}, cur || {}, obj);
  o.createdAt = (cur && cur.createdAt) || Date.now(); o.updatedAt = Date.now(); delete o.deletedAt;
  App.data[coll].set(o.id, o); DB.put(coll, o).catch(App.dbError); return true;
};
const nurl = u => { u = safeUrl(u); if (!u) return ''; try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/+$/, '').toLowerCase(); } catch (e) { return ''; } };
CX.nurl = nurl;
const sl = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* À quelle entreprise appartient un compte (Stripe, PayPal, Instagram, publicité) ? */
CX.companyFor = (kind, id) => {
  const comps = App.companies({ archived: true });
  const c = comps.find(x => ((x.links || {})[kind] || []).includes(String(id)));
  if (c) return c.id;
  const active = App.companies();
  return active.length === 1 ? active[0].id : null; // une seule entreprise : rien à régler
};
const matchSource = (cid, source, medium) => {
  const s = sl(source); if (!s) return '';
  const cats = App.catList('source', cid);
  const paid = /paid|cpc|ads|pub/.test(sl(medium));
  if (paid && /facebook|instagram|meta|fb|ig/.test(s)) { const m = cats.find(c => sl(c.label) === 'publicite-meta'); if (m) return m.id; }
  const found = cats.find(c => sl(c.label) === s) || cats.find(c => s.includes(sl(c.label)) || sl(c.label).includes(s));
  return found ? found.id : '';
};

CX.apply = () => {
  const cache = CX.cache; if (!cache) return;
  const keep = new Set(); let changed = 0;
  const put = (coll, o) => { keep.add(o.id); if (putIfChanged(coll, o)) changed++; };
  const funnels = App.list('funnels');
  CX.unknownPages = {}; CX.unmatchedSales = []; CX.unassigned = 0;

  /* 1. Ventes → revenus (une ligne par vente) et frais → dépenses (par jour) */
  const fees = {}, salesByFunnelDay = {};
  Object.values(cache.sales).forEach(s => {
    const cid = CX.companyFor(s.provider, s.account);
    if (!cid) { CX.unassigned++; return; }
    const net = Math.round((s.amount - (s.refunded || 0)) * 100) / 100;
    const prov = s.provider === 'stripe' ? 'Stripe' : 'PayPal';
    if (net !== 0) put('transactions', { id: 'auto-sale-' + s.id, type: 'revenue', amount: net, date: s.date, companyId: cid, recur: 'none', category: 'ventes', auto: true,
      label: `${prov} · ${s.description || s.product || 'Vente'}${s.currency && s.currency !== 'EUR' ? ' (' + s.currency + ')' : ''}`, notes: 'Importé automatiquement depuis ' + prov + (s.refunded ? ` — remboursé ${eur(s.refunded)}` : '') });
    if (s.fee) { const k = s.provider + '|' + s.account + '|' + s.date; fees[k] = fees[k] || { cid, prov, label: s.account, date: s.date, amount: 0 }; fees[k].amount += s.fee; }
    if (net > 0) {
      const text = norm((s.description || '') + ' ' + (s.product || ''));
      const f = funnels.find(fu => fu.companyId === cid && String(fu.saleKeywords || fu.offer || fu.name || '').split(',').map(x => norm(x.trim())).filter(x => x.length > 2).some(kw => text.includes(kw)));
      if (f) { const k = f.id + '|' + s.date; const o = salesByFunnelDay[k] = salesByFunnelDay[k] || { n: 0, revenue: 0 }; o.n++; o.revenue += net; }
      else CX.unmatchedSales.push(s);
    }
  });
  Object.entries(fees).forEach(([k, f]) => put('transactions', { id: 'auto-fee-' + sl(k), type: 'expense', amount: Math.round(f.amount * 100) / 100, date: f.date, companyId: f.cid, recur: 'none', category: 'autres-charges', auto: true, label: `Frais ${f.prov}`, notes: 'Commissions de paiement, importées automatiquement.' }));

  /* 2. Publicités Meta → campagnes (coûts, clics) et dépenses mensuelles */
  const byCamp = {};
  Object.values(cache.ads).forEach(a => { const o = byCamp[a.campaignId] = byCamp[a.campaignId] || { a, days: [] }; o.days.push(a); });
  Object.entries(byCamp).forEach(([mid, { a, days }]) => {
    const cid = CX.companyFor('ads', a.accountId); if (!cid) { CX.unassigned++; return; }
    const spent = days.filter(d => d.spend > 0).map(d => d.date).sort();
    const sum = k => days.reduce((s, d) => s + (+d[k] || 0), 0);
    const id = 'auto-meta-' + mid, cur = App.get('campaigns', id);
    const cats = App.catList('campaign', cid), srcs = App.catList('source', cid);
    put('campaigns', Object.assign({ id, companyId: cid, name: a.campaignName, category: (cats.find(c => c.id === 'publicite') || {}).id || '', source: (srcs.find(c => c.id === 'publicite-meta') || {}).id || '', funnelId: '', promoCode: '', notes: '' }, cur ? { name: cur.name, category: cur.category, source: cur.source, funnelId: cur.funnelId, promoCode: cur.promoCode, notes: cur.notes, files: cur.files } : {},
      { metaId: mid, metaName: a.campaignName, start: spent[0] || days[0].date, end: spent[spent.length - 1] || days[days.length - 1].date, cost: Math.round(sum('spend') * 100) / 100, impressions: sum('impressions'), adClicks: sum('clicks'), linkClicks: sum('linkClicks'), toFinance: false, auto: true }));
    const months = {}; days.forEach(d => { if (!d.spend) return; const m = d.date.slice(0, 7); months[m] = months[m] || { amount: 0, last: d.date }; months[m].amount += d.spend; if (d.date > months[m].last) months[m].last = d.date; });
    Object.entries(months).forEach(([m, v]) => put('transactions', { id: 'auto-ads-' + mid + '-' + m, type: 'expense', amount: Math.round(v.amount * 100) / 100, date: v.last, companyId: cid, recur: 'none', category: 'publicite', auto: true, label: 'Meta Ads · ' + a.campaignName, notes: 'Dépense publicitaire importée automatiquement (cumul du mois).' }));
  });

  /* 3. Visites → statistiques de tunnel (par jour, source et campagne) */
  const pages = {};
  funnels.forEach(f => (f.steps || []).forEach(st => { const k = nurl(st.url); if (k) pages[k] = { f, st }; }));
  const entries = {};
  const campaigns = App.list('campaigns');
  Object.values(cache.visits).forEach(([date, page, source, medium, campaign, visitors, clicks]) => {
    const m = pages[String(page).replace(/\/+$/, '').toLowerCase()];
    if (!m) { CX.unknownPages[page] = (CX.unknownPages[page] || 0) + (+visitors || 0); return; }
    const cid = m.f.companyId, src = matchSource(cid, source, medium);
    const camp = campaign ? campaigns.find(c => c.companyId === cid && (sl(c.name) === sl(campaign) || (c.metaName && sl(c.metaName) === sl(campaign)))) : null;
    const id = 'auto-st-' + m.f.id + '-' + date + '-' + (src || sl(source) || 'na') + '-' + (camp ? camp.id : sl(campaign) || 'na');
    const e = entries[id] = entries[id] || { id, funnelId: m.f.id, companyId: cid, date, source: src, campaignId: camp ? camp.id : '', label: 'Automatique' + (!src && source ? ' · ' + source : ''), visitors: {}, clicks: 0, carts: null, checkouts: 0, purchases: 0, revenue: 0, promos: [], toFinance: false, auto: true };
    e.visitors[m.st.id] = (e.visitors[m.st.id] || 0) + (+visitors || 0);
    if (m.st.type === 'vente') e.clicks += +clicks || 0;
    if (m.st.type === 'paiement') e.checkouts += +visitors || 0;
  });
  /* Répartit les ventes du jour entre les sources, selon les visites de la page de remerciement */
  Object.entries(salesByFunnelDay).forEach(([k, s]) => {
    const [fid, date] = k.split('|'); const f = App.get('funnels', fid);
    let list = Object.values(entries).filter(e => e.funnelId === fid && e.date === date);
    if (!list.length) { const id = 'auto-st-' + fid + '-' + date + '-na-na'; entries[id] = { id, funnelId: fid, companyId: f.companyId, date, source: '', campaignId: '', label: 'Automatique', visitors: {}, clicks: 0, carts: null, checkouts: 0, purchases: 0, revenue: 0, promos: [], toFinance: false, auto: true }; list = [entries[id]]; }
    const ofType = t => (f.steps || []).filter(st => st.type === t).map(st => st.id);
    const wt = (e, t) => ofType(t).reduce((a, id) => a + (e.visitors[id] || 0), 0);
    // On choisit l'étape la plus proche de l'achat qui a des visites (remerciement, sinon téléchargement, sinon paiement)
    const ref = ['merci', 'telechargement', 'paiement'].find(t => list.some(e => wt(e, t) > 0));
    const weightOf = e => ref ? wt(e, ref) : 0;
    const W = list.reduce((a, e) => a + weightOf(e), 0);
    const ws = list.map(e => W ? weightOf(e) / W : 1 / list.length);
    const raw = ws.map(w => w * s.n), base = raw.map(Math.floor); let rest = s.n - base.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest-- > 0) base[i]++; });
    list.forEach((e, i) => { e.purchases += base[i]; e.revenue = Math.round((e.revenue + s.revenue * ws[i]) * 100) / 100; });
  });
  Object.values(entries).forEach(e => put('funnelStats', e));

  /* 4. Instagram → publications : reliées, marquées publiées, statistiques à jour */
  (cache.ig || []).forEach(acc => {
    const cid = CX.companyFor('ig', acc.id); if (!cid) { CX.unassigned++; return; }
    const ig = App.networkList(cid).find(n => /instagram/i.test(n.label)); if (!ig) return;
    const pub = App.statusList('post', cid).find(s => s.published) || App.statusList('post', cid).slice(-1)[0];
    (acc.media || []).forEach(m => {
      const dt = new Date(m.timestamp); if (isNaN(dt)) return;
      const date = D.iso(dt), time = dt.toTimeString().slice(0, 5);
      const stats = { likes: m.likes, comments: m.comments, reach: m.reach, views: m.views, saved: m.saved, shares: m.shares, at: cache.lastRun || null };
      const live = { igId: m.id, igPermalink: m.permalink, igStats: stats, coverUrl: m.thumb || '' };
      let p = App.list('posts', x => x.igId === m.id)[0];
      if (!p) p = App.list('posts', x => !x.igId && x.companyId === cid && x.network === ig.id && x.date === date).sort((a, b) => a.createdAt - b.createdAt)[0];
      if (p) { keep.add(p.id); if (putIfChanged('posts', Object.assign({ id: p.id }, live, p.igId ? {} : { status: pub.id }))) changed++; }
      else { const cap = (m.caption || '').trim(); put('posts', Object.assign({ id: 'auto-ig-' + m.id, companyId: cid, network: ig.id, date, time, status: pub.id, title: (cap.split('\n')[0] || 'Publication Instagram').slice(0, 70), caption: cap, auto: true }, live)); }
    });
  });

  /* 5. Retire les éléments automatiques devenus obsolètes (jamais ceux saisis à la main) */
  ['funnelStats', 'transactions'].forEach(coll => [...App.data[coll].values()].forEach(o => { if (o.auto && String(o.id).startsWith('auto-') && !keep.has(o.id)) { App.data[coll].delete(o.id); DB.del(coll, o.id); changed++; } }));
  if (changed) { App.render(); CX.scheduleSync(); }
  return changed;
};

/* ---------- Synchronisation entre appareils ---------- */
const derived = (coll, o) => o && o.auto && (coll === 'funnelStats' || coll === 'transactions'); // recalculés sur chaque appareil
CX.sync = async () => {
  if (!App.collectorOn() || CX.syncing || !navigator.onLine) return;
  CX.syncing = true; const c = cfg(), started = Date.now();
  try {
    const items = {};
    COLLS.forEach(coll => { const l = [...App.data[coll].values()].filter(o => (o.updatedAt || 0) > (c.lastPush || 0) && !derived(coll, o)); if (l.length) items[coll] = l; });
    const purged = (c.purgedPending || []).slice();
    const res = await CX.call('sync', { since: c.lastSync || 0, items, purged });
    let n = 0;
    Object.entries(res.items || {}).forEach(([coll, list]) => {
      if (!App.data[coll]) return;
      list.forEach(o => { if (derived(coll, o)) return; const cur = App.data[coll].get(o.id); if (!cur || (o.updatedAt || 0) > (cur.updatedAt || 0)) { App.data[coll].set(o.id, o); DB.put(coll, o).catch(App.dbError); n++; } });
    });
    (res.purged || []).forEach(id => COLLS.forEach(coll => { if (App.data[coll].has(id)) { App.data[coll].delete(id); DB.del(coll, id); n++; } }));
    c.lastSync = res.now; c.lastPush = started; c.lastSyncAt = Date.now(); c.purgedPending = (c.purgedPending || []).filter(id => !purged.includes(id)); c.syncError = null;
    App.saveMeta();
    if (n) { App.migrateCompanies(); if (CX.cache) CX.apply(); App.render(); }
    await CX.uploadFiles(new Set(res.files || []));
  } catch (e) { c.syncError = String(e.message || e); App.saveMeta(); console.warn(e); }
  finally { CX.syncing = false; if (App.state.view === 'settings') App.render(); }
};
/* Envoie les pièces jointes et visuels (10 Mo max chacun) pour les retrouver sur l'autre appareil */
CX.uploadFiles = async serverSet => {
  const c = cfg(); c.uploaded = c.uploaded || [];
  const ids = await DB.req(DB.tx('files').getAllKeys());
  const todo = ids.filter(id => !serverSet.has(id) && !c.uploaded.includes(id)).slice(0, 8);
  for (const id of todo) {
    const rec = await DB.get('files', id); if (!rec) continue;
    if (rec.size > 10 * 1024 * 1024) { c.uploaded.push(id); continue; }
    const b64 = (await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(rec.blob); })).split(',')[1];
    try { await CX.call('putFile', { id, name: rec.name, type: rec.type, data: b64 }); c.uploaded.push(id); } catch (e) { break; }
  }
  App.saveMeta();
};
/* Fichier absent sur cet appareil : on le récupère auprès du collecteur */
const localFileURL = App.fileURL;
App.fileURL = async id => {
  const u = await localFileURL(id); if (u || !App.collectorOn() || !navigator.onLine) return u;
  try {
    const j = await CX.call('getFile', { id });
    const blob = await (await fetch(`data:${j.type || 'application/octet-stream'};base64,${j.data}`)).blob();
    await DB.put('files', { id, name: j.name, type: j.type, size: blob.size, blob, createdAt: Date.now() });
    cfg().uploaded = (cfg().uploaded || []).concat(id);
    return localFileURL(id);
  } catch (e) { return null; }
};
App.fileMeta = async id => (await DB.get('files', id)) || (App.collectorOn() ? (await App.fileURL(id), DB.get('files', id)) : null);

CX.scheduleSync = () => { if (!App.collectorOn()) return; clearTimeout(CX.timer); CX.timer = setTimeout(CX.sync, 4000); };
/* Chaque modification locale déclenche une synchronisation discrète */
const basePut = App.put;
App.put = (coll, obj, opts) => { const r = basePut(coll, obj, opts); CX.scheduleSync(); return r; };
const basePurge = App.purge;
App.purge = async (coll, id) => { await basePurge(coll, id); if (App.collectorOn()) { const c = cfg(); c.purgedPending = (c.purgedPending || []).concat(id); App.saveMeta(); CX.scheduleSync(); } };

/* ---------- Démarrage et rythme ---------- */
CX.start = async () => {
  // Lien de connexion rapide (#connect=…) envoyé depuis un autre appareil
  const m = location.hash.match(/^#connect=([^&]+)/);
  if (m) {
    try { const [url, key] = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]))))); Object.assign(cfg(), { url, key }); App.saveMeta(); App.toast('Appareil connecté au collecteur'); } catch (e) { App.toast('Lien de connexion invalide'); }
    history.replaceState(null, '', location.pathname + '#/dashboard'); App.route();
  }
  if (!App.collectorOn()) return;
  await CX.loadCache(); CX.apply();
  CX.sync(); CX.pull();
  setInterval(() => CX.sync(), 5 * 60 * 1000);
  setInterval(() => CX.pull(), 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const c = cfg();
    if (!c.lastSyncAt || Date.now() - c.lastSyncAt > 60 * 1000) CX.sync();
    if (!c.lastPullAt || Date.now() - c.lastPullAt > 10 * 60 * 1000) CX.pull();
  });
  window.addEventListener('online', () => { CX.sync(); CX.pull(); });
};
CX.connectLink = () => { const c = cfg(); return location.origin + location.pathname + '#connect=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify([c.url, c.key]))))); };

/* Code de suivi à coller dans Systeme.io : compte les visites et retient la source (UTM ou site d'origine) */
CX.snippet = () => `<script>
(function(){try{var U=${JSON.stringify(cfg().url)},L=localStorage,q=new URLSearchParams(location.search),K="mb_utm",u=null;
var v=L.getItem("mb_vid");if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);L.setItem("mb_vid",v)}
try{u=JSON.parse(L.getItem(K)||"null")}catch(e){}
if(q.get("utm_source")){u={s:q.get("utm_source"),m:q.get("utm_medium")||"",c:q.get("utm_campaign")||""};L.setItem(K,JSON.stringify(u))}
else if(!u||u.s==="direct"){var h="";try{h=document.referrer?new URL(document.referrer).hostname:""}catch(e){}
if(h&&h.replace(/^www\\./,"")!==location.hostname.replace(/^www\\./,"")){var M={instagram:"instagram",facebook:"facebook","fb.":"facebook",tiktok:"tiktok",youtube:"youtube","youtu.be":"youtube",google:"google",pinterest:"pinterest",mail:"e-mailing",linkedin:"linkedin"},s=h;for(var x in M)if(h.indexOf(x)>-1){s=M[x];break}u={s:s,m:"referral",c:""};L.setItem(K,JSON.stringify(u))}
else if(!u){u={s:"direct",m:"",c:""};L.setItem(K,JSON.stringify(u))}}
function send(t){new Image().src=U+"?t="+t+"&p="+encodeURIComponent(location.hostname.replace(/^www\\./,"")+location.pathname)+"&v="+v+"&s="+encodeURIComponent(u.s)+"&m="+encodeURIComponent(u.m)+"&c="+encodeURIComponent(u.c)+"&r="+Math.random()}
send("v");var last=0;document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a,button,[role=button],input[type=submit]");if(!a||Date.now()-last<1500)return;last=Date.now();send("c")},true)}catch(e){}})();
</script>`;
