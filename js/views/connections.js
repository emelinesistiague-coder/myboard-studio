/* Paramètres → Connexions : brancher le collecteur, relier les comptes aux entreprises, code de suivi */
'use strict';
const GUIDE_URL = 'https://github.com/emelinesistiague-coder/myboard-studio/blob/main/collecteur/GUIDE.md';
const ago = t => { if (!t) return 'jamais'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'à l’instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${plural(Math.round(m / 1440), 'jour')}`; };

App.connectTab = () => {
  const c = App.meta.collector || {};
  if (!App.collectorOn()) return `<div class="grid g2">
    <div class="card"><div class="card-head"><h3>Brancher le collecteur</h3></div>
      <p class="muted" style="margin-top:0">Le collecteur est un petit programme gratuit qui tourne sur ton compte Google. Il récupère toutes les heures tes ventes Stripe et PayPal, tes statistiques Instagram et Meta Ads, compte les visites de tes tunnels, et synchronise tes données entre ordinateur et téléphone.</p>
      <p><a href="${GUIDE_URL}" target="_blank" rel="noopener">${ic('link')} Ouvrir le guide d’installation pas à pas</a> (environ 15 minutes).</p>
      <div class="form-grid">
        <div class="field full"><label>Adresse du collecteur (URL de l’application Web, se termine par /exec)</label><input class="input" id="cx-url" placeholder="https://script.google.com/macros/s/…/exec"></div>
        <div class="field full"><label>Clé d’application</label><input class="input" id="cx-key" placeholder="affichée lors de l’installation" autocomplete="off"></div>
      </div>
      <div class="toolbar" style="margin-top:14px"><button class="btn primary" data-act="cxConnect">Connecter</button></div>
      ${c.error ? `<p class="down small">${esc(c.error)}</p>` : ''}</div>
    <div class="card"><div class="card-head"><h3>Ce qui devient automatique</h3></div>
      <div class="fin-lines">
        <div class="l"><span>${ic('euro')} Ventes Stripe et PayPal → Finances (revenus, frais) et tunnels</span></div>
        <div class="l"><span>${ic('funnel')} Visiteurs par étape, clics, sources de trafic, campagnes</span></div>
        <div class="l"><span>${ic('target')} Publicités Meta → campagnes, coûts, dépenses du mois</span></div>
        <div class="l"><span>${ic('film')} Instagram → publications marquées publiées, avec leurs statistiques</span></div>
        <div class="l"><span>${ic('later')} Synchronisation ordinateur ↔ téléphone</span></div>
      </div><div class="note-box" style="margin-top:12px">Tout reste gratuit : le collecteur utilise ton compte Google (Apps Script, Sheets, Drive), sans abonnement.</div></div>
  </div>`;

  const cache = App.collector.cache || {}, acc = cache.accounts || { stripe: [], paypal: [], ads: [], ig: [] };
  const comps = App.companies({ archived: true });
  const linkSel = (kind, id, label) => {
    const cur = App.companies({ archived: true }).find(x => ((x.links || {})[kind] || []).includes(String(id)));
    const auto = !cur && App.companies().length === 1;
    return `<div class="row"><div class="grow"><b style="font-weight:500">${esc(label)}</b>${auto ? ' <span class="small muted">· relié automatiquement (une seule entreprise)</span>' : !cur ? ' <span class="small down">· à relier</span>' : ''}</div>
      <select class="input" style="width:auto" data-change="cxLink" data-kind="${kind}" data-id="${esc(id)}"><option value="">${auto ? esc(App.companies()[0].name) : 'Choisir l’entreprise…'}</option>${comps.map(x => `<option value="${x.id}" ${cur && cur.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`;
  };
  const accRows = [
    ...acc.stripe.map(l => linkSel('stripe', l, 'Stripe · ' + l)),
    ...acc.paypal.map(l => linkSel('paypal', l, 'PayPal · ' + l)),
    ...(acc.ig || []).map(a => linkSel('ig', a.id, 'Instagram · @' + a.username)),
    ...(acc.ads || []).map(a => linkSel('ads', a.id, 'Compte publicitaire · ' + a.name)),
  ];
  const unknown = Object.entries(App.collector.unknownPages || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const unmatched = (App.collector.unmatchedSales || []).slice(-8).reverse();
  const errs = (cache.errors || []).slice(-6).reverse();
  return `<div class="grid g2">
    <div class="card"><div class="card-head"><h3>${ic('later')} Collecteur connecté</h3><span class="tag" style="--c:${c.error || c.syncError ? App.COLORS.rouge : App.COLORS.vert}">${c.error || c.syncError ? 'Erreur' : 'Actif'}</span></div>
      <div class="fin-lines">
        <div class="l"><span>Dernière collecte côté Google</span><span>${cache.lastRun ? esc(new Date(cache.lastRun).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })) : '—'}</span></div>
        <div class="l"><span>Dernière récupération sur cet appareil</span><span>${ago(c.lastPullAt)}</span></div>
        <div class="l"><span>Dernière synchronisation entre appareils</span><span>${ago(c.lastSyncAt)}</span></div>
      </div>
      ${c.error ? `<p class="down small">Collecte : ${esc(c.error)}</p>` : ''}${c.syncError ? `<p class="down small">Synchronisation : ${esc(c.syncError)}</p>` : ''}
      <div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="cxRefresh">${ic('later')} Actualiser maintenant</button><button class="btn" data-act="cxSync">Synchroniser</button><button class="btn ghost danger" data-act="cxDisconnect">Déconnecter</button></div>
      <div class="section-title">Connecter un autre appareil</div>
      <div class="small muted" style="margin-bottom:8px">Ouvre ce lien sur ton téléphone (envoie-le-toi par message privé) : l’appareil se connecte et récupère tes données. Garde-le pour toi, il contient ta clé.</div>
      <button class="btn sm" data-act="cxCopyLink">Copier le lien de connexion</button></div>
    <div class="card"><div class="card-head"><h3>Comptes reliés</h3></div>
      ${accRows.length ? `<div class="rows">${accRows.join('')}</div>` : '<div class="empty">Aucun compte détecté pour l’instant. Ajoute tes clés Stripe, PayPal ou Meta dans le collecteur (voir le guide), puis clique sur « Actualiser maintenant ».</div>'}
      ${App.collector.unassigned ? `<div class="small down" style="margin-top:8px">${plural(App.collector.unassigned, 'élément')} en attente : relie les comptes ci-dessus à une entreprise.</div>` : ''}</div>
    <div class="card" style="grid-column:1/-1"><div class="card-head"><h3>${ic('funnel')} Code de suivi des tunnels</h3><button class="btn sm" data-act="cxCopySnippet">Copier le code</button></div>
      <p class="muted" style="margin-top:0">Colle ce code <b>une seule fois</b> dans Systeme.io (réglages du tunnel → Code de suivi, ou paramètres généraux). Il compte les visites de chaque page, les clics, et retient d’où vient le visiteur. Les pages sont reconnues grâce aux liens saisis dans les étapes de tes tunnels. Aucune donnée personnelle n’est collectée.</p>
      <textarea class="input" readonly rows="5" style="font-family:ui-monospace,Consolas,monospace;font-size:11.5px" onclick="this.select()">${esc(App.collector.snippet())}</textarea>
      <div class="section-title">Paramètres d’URL pour tes publicités Meta</div>
      <div style="display:flex;gap:6px"><input class="input" readonly value="utm_source=publicite-meta&utm_medium=publicite&utm_campaign={{campaign.name}}" onclick="this.select()" style="font-family:ui-monospace,Consolas,monospace;font-size:12px"><button class="btn sm" data-act="cxCopyUtm">Copier</button></div>
      <div class="small muted" style="margin-top:4px">À coller dans chaque publicité (Gestionnaire de publicités → Publicité → Paramètres d’URL). Les ventes sont alors attribuées à la bonne campagne, sans rien faire d’autre.</div></div>
    ${unknown.length ? `<div class="card"><div class="card-head"><h3>Pages visitées non reconnues</h3></div><div class="small muted" style="margin-bottom:8px">Ajoute leur lien à une étape de tunnel pour compter ces visites.</div><div class="rows">${unknown.map(([p, n]) => `<div class="row"><div class="grow small" style="word-break:break-all">${esc(p)}</div><span class="small muted">${App.num(n)} visites</span></div>`).join('')}</div></div>` : ''}
    ${unmatched.length ? `<div class="card"><div class="card-head"><h3>Ventes sans tunnel</h3></div><div class="small muted" style="margin-bottom:8px">Bien comptées dans Finances. Pour les rattacher à un tunnel, ajoute un mot de leur libellé dans « Mots-clés des ventes » du tunnel.</div><div class="rows">${unmatched.map(s => `<div class="row"><div class="grow small">${esc(s.description || s.product || 'Vente sans libellé')}</div><span class="small muted">${esc(D.fmt(s.date))} · ${eur(s.amount)}</span></div>`).join('')}</div></div>` : ''}
    ${errs.length ? `<div class="card" style="grid-column:1/-1"><div class="card-head"><h3>Messages du collecteur</h3></div><div class="rows">${errs.map(e => `<div class="row small"><span class="muted" style="white-space:nowrap">${esc(new Date(e[0]).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }))}</span><b style="font-weight:500">${esc(e[1])}</b><span class="grow">${esc(e[2])}</span></div>`).join('')}</div></div>` : ''}
  </div>`;
};

App.act.cxConnect = async () => {
  const url = ($('#cx-url').value || '').trim(), key = ($('#cx-key').value || '').trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\/.+/.test(url)) { App.toast('L’adresse doit commencer par https://script.google.com/'); return; }
  if (!key) { App.toast('Indique la clé d’application'); return; }
  const c = App.meta.collector = Object.assign(App.meta.collector || {}, { url, key });
  try {
    App.toast('Connexion au collecteur…');
    await App.collector.call('ping');
    c.error = null; App.saveMeta(); App.toast('Collecteur connecté');
    App.collector.start();
  } catch (e) { c.url = ''; c.key = ''; c.error = 'Connexion impossible : ' + (e.message || e); App.saveMeta(); }
  App.render();
};
App.act.cxRefresh = async () => { App.toast('Collecte en cours (cela peut prendre une minute)…'); await App.collector.pull({ refresh: true }); await App.collector.sync(); App.toast(App.meta.collector.error ? 'Collecte : ' + App.meta.collector.error : 'Données à jour'); };
App.act.cxSync = async () => { await App.collector.sync(); App.toast(App.meta.collector.syncError ? 'Erreur : ' + App.meta.collector.syncError : 'Synchronisé'); };
App.act.cxDisconnect = async () => {
  if (!(await App.confirm('Déconnecter cet appareil du collecteur ? Tes données restent sur l’appareil, mais ne seront plus mises à jour automatiquement.', { ok: 'Déconnecter' }))) return;
  Object.assign(App.meta.collector, { url: '', key: '' }); App.saveMeta(); App.render();
};
const copy = (txt, msg) => (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => App.toast(msg)).catch(() => App.toast('Sélectionne le texte pour le copier'));
App.act.cxCopySnippet = () => copy(App.collector.snippet(), 'Code de suivi copié');
App.act.cxCopyUtm = () => copy('utm_source=publicite-meta&utm_medium=publicite&utm_campaign={{campaign.name}}', 'Paramètres copiés');
App.act.cxCopyLink = () => copy(App.collector.connectLink(), 'Lien de connexion copié');
App.act.cxLink = el => {
  const kind = el.dataset.kind, id = el.dataset.id;
  App.companies({ archived: true }).forEach(c => {
    const l = c.links = c.links || {}; const arr = (l[kind] || []).filter(x => x !== id);
    if (c.id === el.value) arr.push(id);
    if (JSON.stringify(arr) !== JSON.stringify(l[kind] || [])) { l[kind] = arr; App.put('companies', c, { silent: true }); }
  });
  App.collector.apply(); App.render();
};
