/* Paramètres : entreprises, personnalisation, fiscalité, données */
'use strict';
App.state.setTab = 'companies';

App.views.settings = {
  render() {
    const tab = App.state.setTab;
    const tabs = [['companies', 'Entreprises'], ['custom', 'Statuts & catégories'], ['fiscal', 'Fiscalité & dons'], ['data', 'Données & sauvegarde']];
    let body = '';
    if (!App.companies({ archived: true }).length && tab !== 'data') body = App.onboarding();
    else body = { companies: companiesTab, custom: customTab, fiscal: fiscalTab, data: dataTab }[tab]();
    return `<div class="page-head"><div><h1>Paramètres</h1><div class="sub">Tout est enregistré sur cet appareil.</div></div></div>
      <div class="seg" style="margin-bottom:20px;flex-wrap:wrap">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="setTab" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
  },
};
const setCompany = () => {
  let id = App.state.setCompanyId;
  if (!id || !App.company(id)) id = App.scope() !== 'all' ? App.scope() : (App.companies({ archived: true })[0] || {}).id;
  App.state.setCompanyId = id; return App.company(id);
};
const companyPicker = c => `<div class="toolbar" style="margin-bottom:16px"><span class="muted">Entreprise :</span>
  <select class="input" style="width:auto" data-change="setPick">${App.companies({ archived: true }).map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}${x.archived ? ' (archivée)' : ''}</option>`).join('')}</select></div>`;

function companiesTab() {
  const list = App.companies({ archived: true });
  return `<div class="card"><div class="card-head"><h3>Mes entreprises</h3><button class="btn primary sm" data-act="newCompany">${ic('plus')} Nouvelle entreprise</button></div>
    <div class="rows">${list.map((c, i) => `<div class="row">${App.avatar(c)}<div class="grow"><div class="title" data-act="edit" data-coll="companies" data-id="${c.id}">${esc(c.name)}</div><div class="meta">${c.archived ? '<span class="tag outline">Archivée</span>' : ''}${esc(c.legal || '')}${c.siret ? ' · ' + esc(c.siret) : ''}</div></div>
      <button class="iconbtn" data-act="moveCompany" data-id="${c.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Monter">${ic('left')}</button>
      <button class="btn sm" data-act="edit" data-coll="companies" data-id="${c.id}">Modifier</button>
      <button class="btn sm" data-act="archiveCompany" data-id="${c.id}">${ic('archive')} ${c.archived ? 'Désarchiver' : 'Archiver'}</button>
      <button class="btn sm danger" data-act="delCompany" data-id="${c.id}">${ic('trash')}</button></div>`).join('')}</div>
    <div class="note-box" style="margin-top:14px">Chaque nouvelle entreprise reçoit la même structure de base (finances, réseaux sociaux, scripts, agenda, tâches, projets, pense-bête) et ses propres statuts et catégories, que tu peux ensuite adapter. <b>Archiver</b> masque l’entreprise des vues sans rien effacer : son historique reste consultable depuis le sélecteur d’entreprise.</div></div>`;
}

function customTab() {
  const c = setCompany(); if (!c) return '';
  const listEditor = (path, items, { status } = {}) => `<div class="list-edit">${items.map((x, i) => `<div class="status-edit">
      <button class="sw" style="--c:${x.color}" data-act="pickColor" data-path="${path}" data-i="${i}" title="Couleur"></button>
      <input class="input" value="${esc(x.label)}" data-change="renameItem" data-path="${path}" data-i="${i}" style="max-width:240px">
      ${status ? `<label class="checkline small muted"><input type="checkbox" ${x.done ? 'checked' : ''} data-change="toggleDoneFlag" data-path="${path}" data-i="${i}"> compte comme terminé</label>` : ''}
      <span style="flex:1"></span>
      <button class="iconbtn" data-act="moveItem" data-path="${path}" data-i="${i}" title="Monter" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="iconbtn" data-act="delItem" data-path="${path}" data-i="${i}" title="Supprimer">${ic('x')}</button></div>`).join('')}
    <input class="inline-add" placeholder="+ Ajouter (Entrée)" data-enter="addItem" data-path="${path}" data-focuskey="add-${path}" style="max-width:300px"></div>`;
  return `${companyPicker(c)}
    <div class="grid g2">
      ${Object.entries(App.STATUS_KINDS).map(([k, l]) => `<div class="card"><div class="card-head"><h3>Statuts · ${l}</h3></div>${listEditor('statuses.' + k, c.statuses[k], { status: 1 })}</div>`).join('')}
      <div class="card"><div class="card-head"><h3>Réseaux sociaux</h3></div>${listEditor('networks', c.networks)}</div>
      ${Object.entries(App.CAT_KINDS).map(([k, l]) => `<div class="card"><div class="card-head"><h3>Catégories · ${l}</h3></div>${listEditor('categories.' + k, c.categories[k] || [])}</div>`).join('')}
    </div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h3>Copier ces réglages</h3></div><div class="small muted" style="margin-bottom:10px">Applique les statuts, catégories et réseaux de ${esc(c.name)} à une autre entreprise.</div>
      <div class="toolbar">${App.companies({ archived: true }).filter(x => x.id !== c.id).map(x => `<button class="btn sm" data-act="copySettings" data-to="${x.id}">→ ${esc(x.name)}</button>`).join('') || '<span class="muted small">Aucune autre entreprise.</span>'}</div></div>`;
}
const getPath = (c, path) => path.split('.').reduce((o, k) => o[k] = o[k] || [], c);

function fiscalTab() {
  const c = setCompany(); if (!c) return '';
  const f = c.fiscal || {}, dn = c.donation || {};
  return `${companyPicker(c)}<div class="grid g2">
    <div class="card"><div class="card-head"><h3>Fiscalité · ${esc(c.name)}</h3></div>
      <div class="form-grid">
        <div class="field full"><label>Régime fiscal / statut</label><input class="input" value="${esc(f.regime || '')}" placeholder="ex. Micro-entreprise BNC, versement libératoire" data-change="setFiscal" data-k="regime"></div>
        <div class="field"><label>Cotisations sociales (% du CA)</label><input class="input" type="number" step="0.01" value="${f.cotisRate ?? 0}" data-change="setFiscal" data-k="cotisRate" data-num="1"></div>
        <div class="field"><label>Impôt / versement libératoire (% du CA)</label><input class="input" type="number" step="0.01" value="${f.impotRate ?? 0}" data-change="setFiscal" data-k="impotRate" data-num="1"></div>
        <div class="field"><label class="checkline" style="margin-top:22px"><input type="checkbox" ${f.tvaEnabled ? 'checked' : ''} data-change="setFiscal" data-k="tvaEnabled" data-bool="1"> Assujettie à la TVA</label></div>
        <div class="field"><label>Taux de TVA (%)</label><input class="input" type="number" step="0.1" value="${f.tvaRate ?? 20}" data-change="setFiscal" data-k="tvaRate" data-num="1" ${f.tvaEnabled ? '' : 'disabled'}></div>
      </div>
      <div class="note-box" style="margin-top:14px">Ces taux servent uniquement à <b>estimer</b> ce qu’il faudra mettre de côté. Les montants réellement payés s’enregistrent dans Finances → Cotisations & taxes. Vérifie tes taux auprès de l’URSSAF ou de ton comptable.</div></div>
    <div class="card"><div class="card-head"><h3>${ic('gift')} Dons</h3></div>
      <div class="form-grid">
        <div class="field full"><label>Règle de don</label><select class="input" data-change="setDonation" data-k="mode">
          <option value="none" ${dn.mode === 'none' || !dn.mode ? 'selected' : ''}>Pas d’objectif</option><option value="percent" ${dn.mode === 'percent' ? 'selected' : ''}>Un pourcentage du chiffre d’affaires</option><option value="fixed" ${dn.mode === 'fixed' ? 'selected' : ''}>Un montant fixe par mois</option></select></div>
        ${dn.mode && dn.mode !== 'none' ? `<div class="field"><label>${dn.mode === 'percent' ? 'Pourcentage du CA (%)' : 'Montant par mois (€)'}</label><input class="input" type="number" step="0.01" value="${dn.value ?? 0}" data-change="setDonation" data-k="value" data-num="1"></div>` : ''}
      </div>
      <div class="note-box" style="margin-top:14px">L’objectif est calculé automatiquement sur la période choisie, et comparé aux dons enregistrés dans Finances → Dons.</div></div>
  </div>`;
}

function dataTab() {
  const lb = App.meta.lastBackup, days = lb ? Math.floor((Date.now() - lb) / 864e5) : null;
  const trash = [];
  COLLS.forEach(coll => App.data[coll].forEach(o => { if (o.deletedAt) trash.push({ coll, o }); }));
  trash.sort((a, b) => b.o.deletedAt - a.o.deletedAt);
  const label = { companies: 'Entreprise', tasks: 'Tâche', posts: 'Publication', scripts: 'Script', notes: 'Note', projects: 'Projet', goals: 'Objectif', transactions: 'Finances', funnels: 'Tunnel', funnelStats: 'Statistiques', campaigns: 'Campagne' };
  const theme = App.prefs.theme || 'auto';
  return `<div class="grid g2">
    <div class="card"><div class="card-head"><h3>Sauvegarde</h3></div>
      <p class="muted" style="margin-top:0">Tes données restent sur cet appareil, dans le navigateur. Exporte régulièrement une sauvegarde (par exemple dans ton dossier Documents ou sur une clé USB) : c’est elle qui te protège si l’appareil est perdu ou le navigateur réinitialisé.</p>
      <p>${lb ? `Dernière sauvegarde : <b>${days === 0 ? 'aujourd’hui' : `il y a ${plural(days, 'jour')}`}</b>` : '<b class="down">Aucune sauvegarde pour l’instant.</b>'}</p>
      <div class="toolbar"><button class="btn primary" data-act="exportJSON">${ic('dl')} Exporter une sauvegarde complète</button><button class="btn" data-act="importJSON">${ic('ul')} Restaurer…</button></div>
      <div class="small muted" style="margin-top:10px" id="storage-info">Espace utilisé : calcul…</div>
      <div class="small muted" id="persist-info"></div>
      <div class="note-box" style="margin-top:12px">Pour passer de l’ordinateur au téléphone : exporte la sauvegarde ici, puis utilise <b>Restaurer</b> sur l’autre appareil.</div></div>
    <div class="card"><div class="card-head"><h3>Affichage</h3></div>
      <div class="seg">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button class="${theme === k ? 'on' : ''}" data-act="setTheme" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="section-title">Raccourcis clavier</div>
      <div class="small" style="line-height:2"><span class="kbd">N</span> ajout rapide · <span class="kbd">Ctrl K</span> ou <span class="kbd">/</span> rechercher · <span class="kbd">Ctrl Entrée</span> enregistrer une fiche · <span class="kbd">Échap</span> fermer</div>
      <div class="section-title">Installation</div>
      <div class="small muted" id="install-info">MYBOARD Studio est une application installable (PWA) : elle fonctionne hors ligne une fois installée.</div>
      <button class="btn sm" style="margin-top:8px" data-act="installApp" id="install-btn" hidden>${ic('dl')} Installer l’application</button></div>
    <div class="card" style="grid-column:1/-1"><div class="card-head"><h3>${ic('trash')} Corbeille</h3>${trash.length ? `<button class="btn sm danger" data-act="emptyTrash">Vider la corbeille</button>` : ''}</div>
      ${trash.length ? `<div class="rows">${trash.slice(0, 100).map(({ coll, o }) => `<div class="row"><span class="tag outline">${label[coll]}</span><div class="grow">${esc(o.title || o.name || o.label || (o.body || '').slice(0, 60) || 'Sans titre')} <span class="small muted">· supprimé le ${new Date(o.deletedAt).toLocaleDateString('fr-FR')}</span></div>
        <button class="btn sm" data-act="restoreItem" data-coll="${coll}" data-id="${o.id}">Restaurer</button><button class="btn sm ghost danger" data-act="purgeItem" data-coll="${coll}" data-id="${o.id}">Supprimer définitivement</button></div>`).join('')}</div>` : '<div class="empty">La corbeille est vide.</div>'}</div>
  </div>`;
}
App.views.settings.after = () => {
  if (App.state.setTab !== 'data') return;
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { const el = $('#storage-info'); if (el) el.textContent = `Espace utilisé : ${(e.usage / 1048576).toFixed(1)} Mo`; });
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist-info'); if (el) el.textContent = p ? 'Stockage protégé : le navigateur ne supprimera pas tes données automatiquement.' : 'Stockage non protégé : installe l’application pour que le navigateur conserve tes données durablement.'; });
  const b = $('#install-btn'); if (b && App.installPrompt) b.hidden = false;
  if (matchMedia('(display-mode: standalone)').matches) { const i = $('#install-info'); if (i) i.textContent = 'L’application est installée sur cet appareil.'; }
};

/* ---------- Actions ---------- */
App.act.setTab = el => { App.state.setTab = el.dataset.v; App.render(); };
App.act.setPick = el => { App.state.setCompanyId = el.value; App.render(); };
App.act.newCompany = async () => {
  const name = await App.ask('Nom de la nouvelle entreprise'); if (!name || !name.trim()) return;
  const c = App.put('companies', App.newCompany({ name: name.trim() }), { silent: true });
  App.state.company = c.id; App.prefs.lastCompany = c.id; App.persistState();
  App.toast(`${c.name} est prête : tous les espaces sont créés.`);
  if (App.state.view === 'settings') App.render(); else App.go('dashboard');
  App.edit('companies', c);
};
App.act.archiveCompany = el => { const c = App.company(el.dataset.id); if (!c) return; c.archived = !c.archived; if (c.archived && App.scope() === c.id) App.state.company = 'all'; App.put('companies', c); App.toast(c.archived ? `${c.name} archivée (historique conservé)` : `${c.name} réactivée`); };
App.act.delCompany = el => App.deleteCompany(el.dataset.id);
App.deleteCompany = async id => {
  const c = App.company(id); if (!c) return;
  if (!(await App.confirm(`Supprimer « ${c.name} » ? Elle et toutes ses données iront dans la corbeille. Pour simplement la masquer, utilise plutôt Archiver.`, { ok: 'Mettre à la corbeille', danger: 1 }))) return;
  c.deletedAt = Date.now(); if (App.scope() === id) App.state.company = 'all'; App.put('companies', c);
};
App.act.moveCompany = el => {
  const list = App.companies({ archived: true }), i = list.findIndex(c => c.id === el.dataset.id); if (i < 1) return;
  [list[i - 1], list[i]] = [list[i], list[i - 1]]; list.forEach((c, k) => { c.order = k; App.put('companies', c, { silent: true }); }); App.render();
};
const editList = (el, fn) => { const c = setCompany(); const arr = getPath(c, el.dataset.path); fn(arr, +el.dataset.i, c); App.put('companies', c); };
App.act.renameItem = el => editList(el, (arr, i) => { if (el.value.trim()) arr[i].label = el.value.trim(); });
App.act.toggleDoneFlag = el => editList(el, (arr, i) => { arr[i].done = el.checked; });
App.act.moveItem = el => editList(el, (arr, i) => { if (i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; });
App.act.delItem = async el => {
  const c = setCompany(), arr = getPath(c, el.dataset.path), x = arr[+el.dataset.i];
  if (el.dataset.path.startsWith('statuses') && arr.length <= 1) { App.toast('Il faut garder au moins un statut'); return; }
  const [kind, sub] = el.dataset.path.split('.');
  const coll = { task: 'tasks', event: 'tasks', post: 'posts', script: 'scripts', project: 'projects', note: 'notes', revenue: 'transactions', expense: 'transactions', tax: 'transactions', funnel: 'funnels', campaign: 'campaigns', source: 'funnelStats' }[sub];
  const key = kind === 'statuses' ? 'status' : kind === 'networks' ? 'network' : sub === 'source' ? 'source' : 'category';
  const used = coll ? [...App.data[coll].values()].filter(o => o.companyId === c.id && o[key] === x.id && !o.deletedAt).length : kind === 'networks' ? [...App.data.posts.values(), ...App.data.scripts.values()].filter(o => o.companyId === c.id && o.network === x.id).length : 0;
  if (used && !(await App.confirm(`« ${x.label} » est utilisé par ${plural(used, 'élément')}. Le supprimer quand même ?`, { ok: 'Supprimer', danger: 1 }))) return;
  editList(el, (a, i) => a.splice(i, 1));
};
App.act.addItem = el => { const v = el.value.trim(); if (!v) return; editList(el, arr => arr.push({ id: uid(), label: v, color: Object.values(App.COLORS)[arr.length % 10] })); };
App.act.pickColor = el => App.menu(el, [{ html: `<div class="swatches" style="padding:8px;max-width:200px">${Object.entries(App.COLORS).map(([n, c]) => `<button class="sw" style="--c:${c}" title="${n}" data-c="${c}"></button>`).join('')}</div>` }])
  .addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; App.closeMenu(); editList(el, (arr, i) => { arr[i].color = b.dataset.c; }); });
App.act.copySettings = async el => {
  const from = setCompany(), to = App.company(el.dataset.to); if (!to) return;
  if (!(await App.confirm(`Remplacer les statuts, catégories et réseaux de « ${to.name} » par ceux de « ${from.name} » ?`))) return;
  to.statuses = clone(from.statuses); to.categories = clone(from.categories); to.networks = clone(from.networks); App.put('companies', to); App.toast('Réglages copiés');
};
App.act.setFiscal = el => { const c = setCompany(); c.fiscal = c.fiscal || {}; c.fiscal[el.dataset.k] = el.dataset.bool ? el.checked : el.dataset.num ? (+el.value || 0) : el.value; App.put('companies', c); };
App.act.setDonation = el => { const c = setCompany(); c.donation = c.donation || {}; c.donation[el.dataset.k] = el.dataset.num ? (+el.value || 0) : el.value; App.put('companies', c); };
App.act.setTheme = el => { App.prefs.theme = el.dataset.v; App.savePrefs(); App.applyTheme(); App.render(); };
App.applyTheme = () => { const t = App.prefs.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
App.act.restoreItem = el => App.restore(el.dataset.coll, el.dataset.id);
App.act.purgeItem = async el => {
  if (!(await App.confirm('Supprimer définitivement cet élément ? Cette action est irréversible.', { ok: 'Supprimer définitivement', danger: 1 }))) return;
  await purgeDeep(el.dataset.coll, el.dataset.id); App.render();
};
const purgeDeep = async (coll, id) => {
  if (coll === 'companies') for (const c of COLLS) for (const o of [...App.data[c].values()]) if (o.companyId === id) await App.purge(c, o.id);
  await App.purge(coll, id);
};
App.act.emptyTrash = async () => {
  if (!(await App.confirm('Vider la corbeille ? Tous les éléments seront supprimés définitivement.', { ok: 'Vider', danger: 1 }))) return;
  for (const coll of COLLS) for (const o of [...App.data[coll].values()]) if (o.deletedAt) await purgeDeep(coll, o.id);
  App.render();
};

/* ---------- Export / import ---------- */
const blobToB64 = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
App.act.exportJSON = async () => {
  App.toast('Préparation de la sauvegarde…');
  const out = { app: 'myboard-studio', version: 1, exportedAt: new Date().toISOString(), data: {}, files: [] };
  COLLS.forEach(c => out.data[c] = [...App.data[c].values()]);
  for (const f of await DB.all('files')) out.files.push({ id: f.id, name: f.name, type: f.type, size: f.size, createdAt: f.createdAt, data: await blobToB64(f.blob) });
  App.download(`myboard-sauvegarde-${D.today()}.json`, JSON.stringify(out), 'application/json');
  App.meta.lastBackup = Date.now(); App.saveMeta(); App.render();
};
App.act.importJSON = () => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return;
    let j; try { j = JSON.parse(await file.text()); } catch (e) { App.toast('Fichier illisible'); return; }
    if (j.app !== 'myboard-studio' || !j.data) { App.toast('Ce fichier n’est pas une sauvegarde MYBOARD Studio'); return; }
    const n = (j.data.companies || []).length;
    if (!(await App.confirm(`Restaurer la sauvegarde du ${new Date(j.exportedAt).toLocaleDateString('fr-FR')} (${plural(n, 'entreprise')}) ? Les données actuelles de cet appareil seront remplacées.`, { ok: 'Restaurer', danger: 1 }))) return;
    for (const c of [...COLLS, 'files']) await DB.clear(c);
    for (const c of COLLS) { App.data[c] = new Map(); for (const o of j.data[c] || []) { App.data[c].set(o.id, o); await DB.put(c, o); } }
    for (const f of j.files || []) { const blob = await (await fetch(f.data)).blob(); await DB.put('files', { id: f.id, name: f.name, type: f.type, size: f.size, createdAt: f.createdAt, blob }); }
    App.urlCache.clear(); App.state.company = 'all'; App.persistState();
    App.toast('Sauvegarde restaurée'); App.go('dashboard');
  };
  inp.click();
};
App.act.installApp = async () => { if (!App.installPrompt) return; App.installPrompt.prompt(); await App.installPrompt.userChoice; App.installPrompt = null; App.render(); };
