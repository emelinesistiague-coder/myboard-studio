/**
 * MYBOARD Studio — Collecteur (Google Apps Script, gratuit)
 *
 * Rôle : récupérer automatiquement tes données et les tenir prêtes pour l'application.
 *  - Visites des pages de tes tunnels (code de suivi à coller dans Systeme.io)
 *  - Ventes Stripe et PayPal (toutes les heures)
 *  - Statistiques Instagram et dépenses Publicités Meta (toutes les heures)
 *  - Synchronisation des données de l'application entre ordinateur et téléphone (Google Drive)
 *
 * Installation : voir collecteur/GUIDE.md. Tes clés secrètes se mettent dans
 * « Paramètres du projet → Propriétés du script », jamais dans ce fichier.
 */

const P = PropertiesService.getScriptProperties();
const TZ = Session.getScriptTimeZone();
const VERSION = 1;
const SHEETS = {
  Visites: ['ts', 'date', 'page', 'vid', 'type', 'source', 'medium', 'campaign'],
  VisitesJour: ['date', 'page', 'source', 'medium', 'campaign', 'visitors', 'clicks'],
  Ventes: ['id', 'provider', 'account', 'date', 'amount', 'currency', 'description', 'status', 'fee', 'refunded', 'product'],
  Pubs: ['key', 'date', 'accountId', 'accountName', 'campaignId', 'campaignName', 'spend', 'impressions', 'clicks', 'linkClicks'],
  Instagram: ['accountId', 'username', 'followers', 'mediaId', 'timestamp', 'caption', 'type', 'permalink', 'thumb', 'likes', 'comments', 'reach', 'views', 'saved', 'shares'],
  Journal: ['ts', 'source', 'message'],
};

/* ====================== Installation ====================== */
/** À lancer une seule fois (bouton ▶ Exécuter) après avoir collé ce code. */
function installer() {
  if (!P.getProperty('APP_KEY')) P.setProperty('APP_KEY', Utilities.getUuid().replace(/-/g, ''));
  Object.keys(SHEETS).forEach(sh);
  folder();
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('chaqueHeure').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('chaqueNuit').timeBased().atHour(3).everyDays(1).create();
  Logger.log('✅ Collecteur installé.');
  Logger.log('Ta clé d’application (à coller dans MYBOARD → Paramètres → Connexions) : ' + P.getProperty('APP_KEY'));
  Logger.log('Étape suivante : Déployer → Nouveau déploiement → Application Web (exécuter en tant que « Moi », accès « Tout le monde »).');
}

/** Lance immédiatement une collecte (utile pour tester après avoir ajouté une clé). */
function chaqueHeure() {
  run('Stripe', fetchStripe);
  run('PayPal', fetchPaypal);
  if (P.getProperty('META_TOKEN')) { run('Instagram', fetchInstagram); run('Publicités Meta', fetchAds); }
  P.setProperty('LAST_RUN', new Date().toISOString());
}
function chaqueNuit() { run('Compactage', compact); run('Journal', trimJournal); }
function run(name, fn) { try { fn(); } catch (e) { log(name, e && e.message || e); } }

/* ====================== Web app ====================== */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.t) return hit(p);
  return json({ ok: true, app: 'myboard-collecteur', version: VERSION });
}
function doPost(e) {
  let b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Requête illisible' }); }
  if (!b.key || b.key !== P.getProperty('APP_KEY')) return json({ ok: false, error: 'Clé d’application invalide' });
  try {
    switch (b.action) {
      case 'ping': return json({ ok: true, version: VERSION, accounts: accounts(), lastRun: P.getProperty('LAST_RUN') });
      case 'pull': return json(pull(b.since));
      case 'refresh': chaqueHeure(); return json(pull(b.since));
      case 'sync': return json(sync(b));
      case 'putFile': return json(putFile(b));
      case 'getFile': return json(getFile(b.id));
    }
    return json({ ok: false, error: 'Action inconnue' });
  } catch (err) { log('Application', err.message); return json({ ok: false, error: err.message }); }
}

/* ====================== Visites (code de suivi) ====================== */
function hit(p) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(4000)) {
    try {
      sh('Visites').appendRow([new Date().toISOString(), day(), clean(p.p, 300), clean(p.v, 40), p.t === 'c' ? 'c' : 'v', clean(p.s, 60), clean(p.m, 60), clean(p.c, 120)]);
    } finally { lock.releaseLock(); }
  }
  return ContentService.createTextOutput('1');
}
/* Regroupe les visites brutes : visiteurs uniques et clics par jour / page / source / campagne */
function aggRaw(rs) {
  const m = {};
  rs.forEach(r => {
    const a = [r[1], r[2], r[5], r[6], r[7]], k = a.join('|');
    const o = m[k] = m[k] || { a, v: {}, c: 0 };
    if (r[4] === 'c') o.c++; else o.v[r[3] || Math.random()] = 1;
  });
  return Object.keys(m).map(k => m[k].a.concat([Object.keys(m[k].v).length, m[k].c]));
}
/* Chaque nuit : les visites des jours passés sont résumées pour rester légères */
function compact() {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const today = day(), raw = rows('Visites');
    const old = raw.filter(r => r[1] < today), keep = raw.filter(r => r[1] >= today);
    if (!old.length) return;
    const agg = aggRaw(old).map(r => r.map(String));
    const vj = sh('VisitesJour');
    vj.getRange(vj.getLastRow() + 1, 1, agg.length, SHEETS.VisitesJour.length).setValues(agg);
    const v = sh('Visites');
    if (v.getLastRow() > 1) v.getRange(2, 1, v.getLastRow() - 1, SHEETS.Visites.length).clearContent();
    if (keep.length) v.getRange(2, 1, keep.length, SHEETS.Visites.length).setValues(keep.map(r => r.map(String)));
  } finally { lock.releaseLock(); }
}

/* ====================== Envoi des données à l'application ====================== */
function pull(since) {
  since = since || '2000-01-01';
  const visits = {};
  const add = r => { const k = r.slice(0, 5).join('|'); if (visits[k]) { visits[k][5] += +r[5] || 0; visits[k][6] += +r[6] || 0; } else visits[k] = [r[0], r[1], r[2], r[3], r[4], +r[5] || 0, +r[6] || 0]; };
  rows('VisitesJour').filter(r => r[0] >= since).forEach(add);
  aggRaw(rows('Visites').filter(r => r[1] >= since)).forEach(add);
  const sales = rows('Ventes').filter(r => r[3] >= since).map(r => ({ id: r[0], provider: r[1], account: r[2], date: r[3], amount: +r[4] || 0, currency: r[5], description: r[6], status: r[7], fee: +r[8] || 0, refunded: +r[9] || 0, product: r[10] }));
  const ads = rows('Pubs').filter(r => r[1] >= since).map(r => ({ date: r[1], accountId: r[2], accountName: r[3], campaignId: r[4], campaignName: r[5], spend: +r[6] || 0, impressions: +r[7] || 0, clicks: +r[8] || 0, linkClicks: +r[9] || 0 }));
  const ig = {};
  rows('Instagram').forEach(r => {
    const a = ig[r[0]] = ig[r[0]] || { id: r[0], username: r[1], followers: +r[2] || 0, media: [] };
    if (r[3]) a.media.push({ id: r[3], timestamp: r[4], caption: r[5], type: r[6], permalink: r[7], thumb: r[8], likes: +r[9] || 0, comments: +r[10] || 0, reach: +r[11] || 0, views: +r[12] || 0, saved: +r[13] || 0, shares: +r[14] || 0 });
  });
  return { ok: true, now: Date.now(), today: day(), visits: Object.keys(visits).map(k => visits[k]), sales, ads, ig: Object.keys(ig).map(k => ig[k]), accounts: accounts(), errors: rows('Journal').slice(-10), lastRun: P.getProperty('LAST_RUN') };
}
function accounts() {
  const keys = P.getKeys();
  const ads = {}; rows('Pubs').forEach(r => ads[r[2]] = r[3]);
  const ig = {}; rows('Instagram').forEach(r => ig[r[0]] = r[1]);
  return {
    stripe: keys.filter(k => /^STRIPE_/.test(k)).map(k => k.slice(7)),
    paypal: keys.filter(k => /^PAYPAL_/.test(k)).map(k => k.slice(7)),
    meta: !!P.getProperty('META_TOKEN'),
    ads: Object.keys(ads).map(id => ({ id, name: ads[id] })),
    ig: Object.keys(ig).map(id => ({ id, username: ig[id] })),
  };
}

/* ====================== Stripe ====================== */
function fetchStripe() {
  P.getKeys().filter(k => /^STRIPE_/.test(k)).forEach(k => {
    const label = k.slice(7);
    try { stripeAccount(label, P.getProperty(k).trim()); } catch (e) { log('Stripe ' + label, e.message); }
  });
}
function stripeAccount(label, key) {
  const stKey = 'LAST_STRIPE_' + label;
  const last = +P.getProperty(stKey) || Math.floor(Date.now() / 1000) - 86400 * 400;
  const since = last - 86400 * 3; // relit 3 jours pour capter les remboursements
  let after = null, newest = last; const out = [];
  for (let i = 0; i < 60; i++) {
    const url = 'https://api.stripe.com/v1/charges?limit=100&created[gte]=' + since + '&expand[]=data.balance_transaction' + (after ? '&starting_after=' + after : '');
    const j = JSON.parse(UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true }).getContentText());
    if (j.error) throw new Error(j.error.message);
    j.data.forEach(c => {
      if (c.status !== 'succeeded') return;
      newest = Math.max(newest, c.created);
      const bt = c.balance_transaction && typeof c.balance_transaction === 'object' ? c.balance_transaction : null;
      const md = c.metadata || {};
      out.push(['stripe_' + c.id, 'stripe', label, day(new Date(c.created * 1000)), c.amount / 100, (c.currency || '').toUpperCase(), c.description || c.statement_descriptor || '', c.status, bt ? bt.fee / 100 : 0, (c.amount_refunded || 0) / 100, md.product || md.offer || md.offre || '']);
    });
    if (!j.has_more || !j.data.length) break;
    after = j.data[j.data.length - 1].id;
  }
  upsert('Ventes', out, 0);
  P.setProperty(stKey, String(newest));
}

/* ====================== PayPal ====================== */
function fetchPaypal() {
  P.getKeys().filter(k => /^PAYPAL_/.test(k)).forEach(k => {
    const label = k.slice(7);
    try { paypalAccount(label, P.getProperty(k).trim()); } catch (e) { log('PayPal ' + label, e.message); }
  });
}
function paypalAccount(label, cred) {
  const i = cred.indexOf(':'); if (i < 0) throw new Error('Format attendu : IDENTIFIANT_CLIENT:SECRET');
  const tok = JSON.parse(UrlFetchApp.fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'post', headers: { Authorization: 'Basic ' + Utilities.base64Encode(cred.slice(0, i) + ':' + cred.slice(i + 1)) },
    payload: { grant_type: 'client_credentials' }, muteHttpExceptions: true,
  }).getContentText());
  if (!tok.access_token) throw new Error(tok.error_description || 'Connexion PayPal refusée');
  const lastKey = 'LAST_PAYPAL_' + label;
  let start = P.getProperty(lastKey) ? new Date(+P.getProperty(lastKey) - 3 * 86400000) : new Date(Date.now() - 365 * 86400000);
  const end = new Date(); const out = [];
  while (start < end) {
    const stop = new Date(Math.min(end.getTime(), start.getTime() + 30 * 86400000));
    let page = 1, pages = 1;
    do {
      const url = 'https://api-m.paypal.com/v1/reporting/transactions?fields=transaction_info,cart_info&page_size=500&page=' + page + '&start_date=' + isoUtc(start) + '&end_date=' + isoUtc(stop);
      const j = JSON.parse(UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + tok.access_token }, muteHttpExceptions: true }).getContentText());
      if (j.name && j.message) throw new Error(j.message);
      pages = j.total_pages || 1;
      (j.transaction_details || []).forEach(t => {
        const ti = t.transaction_info || {}, code = ti.transaction_event_code || '', amt = +(ti.transaction_amount || {}).value || 0;
        const payment = /^T00/.test(code) && amt > 0, refund = /^T11/.test(code) && amt < 0;
        if (!(payment || refund) || ti.transaction_status !== 'S') return;
        const items = ((t.cart_info || {}).item_details || []).map(x => x.item_name).filter(Boolean).join(', ');
        out.push(['paypal_' + ti.transaction_id, 'paypal', label, day(new Date(ti.transaction_initiation_date)), amt, (ti.transaction_amount || {}).currency_code || '', ti.transaction_subject || items || ti.transaction_note || (refund ? 'Remboursement' : ''), refund ? 'R' : 'S', Math.abs(+(ti.fee_amount || {}).value || 0), 0, items]);
      });
      page++;
    } while (page <= pages && page < 50);
    start = stop;
  }
  upsert('Ventes', out, 0);
  P.setProperty(lastKey, String(end.getTime()));
}

/* ====================== Meta : Instagram et publicités ====================== */
function graph(path, params) {
  const v = P.getProperty('META_VERSION') || 'v23.0';
  return graphUrl('https://graph.facebook.com/' + v + '/' + path + (params ? '?' + params : ''));
}
function graphUrl(url) {
  const j = JSON.parse(UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + P.getProperty('META_TOKEN').trim() }, muteHttpExceptions: true }).getContentText());
  if (j.error) throw new Error(j.error.message);
  return j;
}
function graphAll(path, params) {
  let j = graph(path, params), out = j.data || [], n = 0;
  while (j.paging && j.paging.next && n++ < 30) { j = graphUrl(j.paging.next); out = out.concat(j.data || []); }
  return out;
}
function fetchInstagram() {
  const pages = graphAll('me/accounts', 'fields=instagram_business_account%7Bid,username,followers_count%7D&limit=100');
  const out = [];
  pages.forEach(pg => {
    const a = pg.instagram_business_account; if (!a) return;
    const media = graph(a.id + '/media', 'fields=id,caption,media_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count&limit=40').data || [];
    if (!media.length) out.push([a.id, a.username, a.followers_count || 0, '', '', '', '', '', '', '', '', '', '', '', '']);
    media.forEach(m => {
      const ins = {};
      [['reach', 'views', 'saved', 'shares'], ['reach', 'saved']].some(metrics => {
        try { (graph(m.id + '/insights', 'metric=' + metrics.join(',')).data || []).forEach(x => ins[x.name] = (x.values && x.values[0] && x.values[0].value) || x.total_value && x.total_value.value || 0); return true; } catch (e) { return false; }
      });
      out.push([a.id, a.username, a.followers_count || 0, m.id, m.timestamp, (m.caption || '').slice(0, 1000), m.media_type, m.permalink, m.thumbnail_url || m.media_url || '', m.like_count || 0, m.comments_count || 0, ins.reach || 0, ins.views || 0, ins.saved || 0, ins.shares || 0].map(String));
    });
  });
  const x = sh('Instagram');
  if (x.getLastRow() > 1) x.getRange(2, 1, x.getLastRow() - 1, SHEETS.Instagram.length).clearContent();
  if (out.length) x.getRange(2, 1, out.length, SHEETS.Instagram.length).setValues(out.map(r => r.map(String)));
}
function fetchAds() {
  const accts = graphAll('me/adaccounts', 'fields=account_id,name&limit=100');
  const first = !P.getProperty('ADS_DONE');
  const until = day(), since = day(new Date(Date.now() - (first ? 365 : 30) * 86400000));
  const out = [];
  accts.forEach(ac => {
    const range = encodeURIComponent(JSON.stringify({ since, until }));
    const rs = graphAll('act_' + ac.account_id + '/insights', 'level=campaign&time_increment=1&limit=500&fields=campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks&time_range=' + range);
    rs.forEach(r => out.push([r.date_start + '|' + r.campaign_id, r.date_start, ac.account_id, ac.name, r.campaign_id, r.campaign_name, +r.spend || 0, +r.impressions || 0, +r.clicks || 0, +r.inline_link_clicks || 0]));
  });
  upsert('Pubs', out, 0);
  P.setProperty('ADS_DONE', '1');
}

/* ====================== Synchronisation ordinateur ↔ téléphone ====================== */
function folder() {
  const id = P.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  const f = DriveApp.createFolder('MYBOARD Studio – synchronisation');
  P.setProperty('FOLDER_ID', f.getId()); return f;
}
function filesFolder() {
  const it = folder().getFoldersByName('fichiers');
  return it.hasNext() ? it.next() : folder().createFolder('fichiers');
}
function loadData() {
  const id = P.getProperty('DATA_FILE');
  if (id) { try { return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString()); } catch (e) { } }
  return { items: {}, purged: {} };
}
function saveData(d) {
  const s = JSON.stringify(d), id = P.getProperty('DATA_FILE');
  if (id) { try { DriveApp.getFileById(id).setContent(s); return; } catch (e) { } }
  const f = folder().createFile('donnees.json', s, 'application/json');
  P.setProperty('DATA_FILE', f.getId());
}
/* Fusion élément par élément : la version la plus récente gagne */
function sync(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const d = loadData(), now = Date.now(); let changed = false;
    d.purged = d.purged || {};
    Object.keys(b.items || {}).forEach(coll => {
      const m = d.items[coll] = d.items[coll] || {};
      (b.items[coll] || []).forEach(o => {
        if (!o || !o.id || d.purged[o.id]) return;
        const cur = m[o.id];
        if (!cur || (o.updatedAt || 0) >= (cur.updatedAt || 0)) { o._s = now; m[o.id] = o; changed = true; }
      });
    });
    (b.purged || []).forEach(id => {
      if (d.purged[id]) return;
      d.purged[id] = now; Object.keys(d.items).forEach(c => delete d.items[c][id]); changed = true;
    });
    if (changed) saveData(d);
    const since = +b.since || 0, out = {};
    Object.keys(d.items).forEach(c => { const l = Object.keys(d.items[c]).map(k => d.items[c][k]).filter(o => (o._s || 0) > since); if (l.length) out[c] = l; });
    const purged = Object.keys(d.purged).filter(id => d.purged[id] > since);
    const files = []; const it = filesFolder().getFiles(); while (it.hasNext()) files.push(it.next().getName());
    return { ok: true, now, items: out, purged, files };
  } finally { lock.releaseLock(); }
}
function putFile(b) {
  if (!b.id || !b.data) return { ok: false, error: 'Fichier vide' };
  const ff = filesFolder();
  if (ff.getFilesByName(b.id).hasNext()) return { ok: true };
  const blob = Utilities.newBlob(Utilities.base64Decode(b.data), b.type || 'application/octet-stream', b.id);
  const f = ff.createFile(blob); f.setDescription(JSON.stringify({ name: b.name, type: b.type }));
  return { ok: true };
}
function getFile(id) {
  const it = filesFolder().getFilesByName(id); if (!it.hasNext()) return { ok: false, error: 'Fichier introuvable' };
  const f = it.next(); let meta = {}; try { meta = JSON.parse(f.getDescription() || '{}'); } catch (e) { }
  return { ok: true, id, name: meta.name || id, type: meta.type || f.getMimeType(), data: Utilities.base64Encode(f.getBlob().getBytes()) };
}

/* ====================== Outils ====================== */
function ss() {
  const id = P.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) { } }
  const s = SpreadsheetApp.create('MYBOARD Studio – Collecteur');
  DriveApp.getFileById(s.getId()).moveTo(folder());
  P.setProperty('SHEET_ID', s.getId()); return s;
}
function sh(name) {
  const s = ss(); let x = s.getSheetByName(name);
  if (!x) {
    x = s.insertSheet(name); x.getRange('A:Z').setNumberFormat('@');
    x.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]); x.setFrozenRows(1);
    const def = s.getSheetByName('Feuille 1') || s.getSheetByName('Sheet1'); if (def && s.getSheets().length > 1) s.deleteSheet(def);
  }
  return x;
}
function rows(name) {
  const x = sh(name), n = x.getLastRow(); if (n < 2) return [];
  return x.getRange(2, 1, n - 1, SHEETS[name].length).getValues().map(r => r.map(v => v instanceof Date ? day(v) : String(v))).filter(r => r[0] !== '');
}
/* Met à jour les lignes existantes (même identifiant en colonne col) et ajoute les nouvelles */
function upsert(name, list, col) {
  if (!list.length) return;
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const x = sh(name), w = SHEETS[name].length, rs = rows(name), idx = {};
    rs.forEach((r, i) => idx[r[col]] = i);
    const add = [];
    list.forEach(r => { r = r.map(String); if (idx[r[col]] !== undefined) rs[idx[r[col]]] = r; else { idx[r[col]] = -1; add.push(r); } });
    if (rs.length) x.getRange(2, 1, rs.length, w).setValues(rs);
    if (add.length) x.getRange(x.getLastRow() + 1, 1, add.length, w).setValues(add);
  } finally { lock.releaseLock(); }
}
function log(src, msg) { try { sh('Journal').appendRow([new Date().toISOString(), src, String(msg).slice(0, 500)]); } catch (e) { } }
function trimJournal() { const x = sh('Journal'), n = x.getLastRow(); if (n > 301) x.deleteRows(2, n - 301); }
function day(d) { return Utilities.formatDate(d || new Date(), TZ, 'yyyy-MM-dd'); }
function isoUtc(d) { return Utilities.formatDate(d, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'"); }
function clean(v, n) { return String(v || '').slice(0, n).replace(/^[=+\-@]/, "'"); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
