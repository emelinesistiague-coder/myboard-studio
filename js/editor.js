/* MYBOARD Studio — fiche d'édition universelle (panneau latéral) */
'use strict';

const opt = (list, withEmpty) => (withEmpty ? [{ id: '', label: withEmpty }] : []).concat(list.map(x => ({ id: x.id, label: x.label })));
const companyOpts = d => App.companies({ archived: true }).filter(c => !c.archived || c.id === d.companyId).map(c => ({ id: c.id, label: c.name }));
const projectOpts = d => [{ id: '', label: 'Aucun projet' }].concat(App.list('projects', p => p.companyId === d.companyId).map(p => ({ id: p.id, label: p.name })));
const postOpts = d => [{ id: '', label: 'Aucune publication' }].concat(App.list('posts', p => p.companyId === d.companyId).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 80).map(p => ({ id: p.id, label: `${p.title || 'Sans titre'}${p.date ? ' · ' + D.fmt(p.date) : ''}` })));
const isTask = d => d.kind !== 'event';

/* Schémas : chaque fiche est décrite ici, l'éditeur fait le reste */
App.SCHEMAS = {
  tasks: {
    label: d => d.kind === 'event' ? 'Rendez-vous' : 'Tâche', titleKey: 'title',
    fields: [
      { k: 'kind', t: 'seg', opts: [{ id: 'task', label: 'Tâche' }, { id: 'event', label: 'Rendez-vous / événement' }], rerender: 1, full: 1 },
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'status', label: 'Statut', t: 'select', opts: d => opt(App.statusList('task', d.companyId)) },
      { k: 'sched', label: 'Planification', t: 'select', show: isTask, rerender: 1, opts: [{ id: 'none', label: 'Sans date (à planifier)' }, { id: 'day', label: 'Un jour précis' }, { id: 'week', label: 'Une semaine (sans jour)' }, { id: 'month', label: 'Un mois (sans jour)' }] },
      { k: 'date', label: d => isTask(d) ? 'Date de réalisation prévue' : 'Date', t: 'date', show: d => !isTask(d) || d.sched === 'day' },
      { k: 'week', label: 'Semaine du', t: 'date', show: d => isTask(d) && d.sched === 'week', week: 1 },
      { k: 'month', label: 'Mois', t: 'month', show: d => isTask(d) && d.sched === 'month' },
      { k: 'time', label: 'Heure', t: 'time', show: d => !isTask(d) || d.sched === 'day' },
      { k: 'duration', label: 'Durée', t: 'text', ph: 'ex. 1 h 30', show: d => !isTask(d) || d.sched === 'day' },
      { k: 'due', label: 'Échéance', t: 'date', show: isTask },
      { k: 'priority', label: 'Priorité', t: 'select', opts: opt(App.PRIORITIES) },
      { k: 'category', label: 'Catégorie', t: 'select', opts: d => opt(App.catList(isTask(d) ? 'task' : 'event', d.companyId), 'Aucune') },
      { k: 'description', label: 'Description / notes', t: 'textarea', full: 1 },
      { k: 'subtasks', label: 'Sous-tâches', t: 'subtasks', full: 1, show: isTask },
      { k: 'projectId', label: 'Projet associé', t: 'select', opts: projectOpts, more: 1 },
      { k: 'postId', label: 'Publication associée', t: 'select', opts: postOpts, more: 1 },
      { k: 'files', label: 'Fichiers joints', t: 'files', full: 1, more: 1 },
    ],
  },
  posts: {
    label: () => 'Publication', titleKey: 'title',
    fields: [
      { k: 'cover', label: 'Couverture', t: 'cover', side: 1 },
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'network', label: 'Réseau social', t: 'select', opts: d => opt(App.networkList(d.companyId), 'Choisir…') },
      { k: 'date', label: 'Date de publication prévue', t: 'date' },
      { k: 'time', label: 'Heure', t: 'time' },
      { k: 'status', label: 'Statut', t: 'select', opts: d => opt(App.statusList('post', d.companyId)) },
      { k: 'category', label: 'Catégorie de contenu', t: 'select', opts: d => opt(App.catList('post', d.companyId), 'Aucune') },
      { k: 'caption', label: 'Légende', t: 'textarea', full: 1, rows: 5 },
      { k: 'hashtags', label: 'Hashtags', t: 'text', full: 1, ph: '#exemple #contenu' },
      { k: 'description', label: 'Description / brief', t: 'textarea', full: 1, more: 1 },
      { k: 'notes', label: 'Notes complémentaires', t: 'textarea', full: 1, more: 1 },
      { k: 'files', label: 'Fichiers associés (vidéo, visuels…)', t: 'files', full: 1, more: 1 },
      { k: '_links', t: 'info', full: 1, html: d => App.postLinks(d) },
      { k: '_ig', t: 'info', full: 1, html: d => App.igStatsBlock(d) },
    ],
  },
  scripts: {
    label: () => 'Script vidéo', titleKey: 'title', wide: 1,
    fields: [
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'network', label: 'Réseau social', t: 'select', opts: d => opt(App.networkList(d.companyId), 'Choisir…') },
      { k: 'status', label: 'Statut du script', t: 'select', opts: d => opt(App.statusList('script', d.companyId)) },
      { k: 'category', label: 'Catégorie', t: 'select', opts: d => opt(App.catList('script', d.companyId), 'Aucune') },
      { k: 'concept', label: 'Concept de la vidéo', t: 'textarea', full: 1, rows: 2 },
      { k: 'objective', label: 'Objectif du contenu', t: 'text', full: 1, ph: 'Faire connaître, vendre, fidéliser…' },
      { k: 'hook', label: 'Accroche (hook)', t: 'textarea', full: 1, rows: 2 },
      { k: 'script', label: 'Script complet', t: 'textarea', full: 1, rows: 10 },
      { k: 'scenes', label: 'Déroulement des scènes', t: 'textarea', full: 1, rows: 5, ph: '1. Plan serré…\n2. …' },
      { k: 'onScreen', label: 'Texte à afficher à l’écran', t: 'textarea', full: 1, rows: 3 },
      { k: 'cta', label: 'Appel à l’action (CTA)', t: 'text', full: 1 },
      { k: 'notes', label: 'Notes et idées complémentaires', t: 'textarea', full: 1, more: 1 },
      { k: 'files', label: 'Fichiers joints', t: 'files', full: 1, more: 1 },
      { k: '_links', t: 'info', full: 1, html: d => App.scriptLinks(d) },
    ],
  },
  notes: {
    label: () => 'Note', titleKey: 'title',
    fields: [
      { k: 'body', label: 'Note', t: 'textarea', full: 1, rows: 6 },
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'category', label: 'Type', t: 'select', opts: d => opt(App.catList('note', d.companyId), 'Aucun') },
      { k: 'link', label: 'Lien ou référence', t: 'text', full: 1, ph: 'https://…' },
      { k: 'tags', label: 'Étiquettes', t: 'text', full: 1, ph: 'séparées par des virgules' },
      { k: 'files', label: 'Fichiers joints', t: 'files', full: 1 },
    ],
  },
  projects: {
    label: () => 'Projet', titleKey: 'name',
    fields: [
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'status', label: 'Statut', t: 'select', opts: d => opt(App.statusList('project', d.companyId)) },
      { k: 'startDate', label: 'Date de début', t: 'date' },
      { k: 'dueDate', label: 'Échéance (facultative)', t: 'date' },
      { k: 'priority', label: 'Priorité', t: 'select', opts: opt(App.PRIORITIES) },
      { k: 'description', label: 'Description', t: 'textarea', full: 1 },
      { k: '_tasks', t: 'info', full: 1, html: d => App.projectTaskBlock(d) },
      { k: 'notes', label: 'Notes', t: 'textarea', full: 1, more: 1 },
      { k: 'files', label: 'Fichiers joints', t: 'files', full: 1, more: 1 },
    ],
  },
  goals: {
    label: () => 'Objectif', titleKey: 'title',
    fields: [
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts },
      { k: 'metric', label: 'Mesure', t: 'select', rerender: 1, opts: Object.entries(App.GOAL_METRICS).map(([id, label]) => ({ id, label })) },
      { k: 'period', label: 'Période', t: 'select', rerender: 1, opts: [{ id: 'month', label: 'Mensuel' }, { id: 'year', label: 'Annuel' }] },
      { k: 'periodValue', label: d => d.period === 'year' ? 'Année' : 'Mois', t: d => d.period === 'year' ? 'year' : 'month' },
      { k: 'target', label: 'Cible', t: 'number' },
      { k: 'current', label: 'Valeur actuelle', t: 'number', show: d => d.metric === 'manual' },
      { k: 'unit', label: 'Unité (facultatif)', t: 'text', show: d => d.metric === 'manual', ph: 'clients, abonnés…' },
    ],
  },
  transactions: {
    label: d => App.TX_TYPES[d.type].label, titleKey: 'label', titlePh: d => d.type === 'revenue' ? 'Source du revenu' : 'Libellé',
    fields: [
      { k: 'type', t: 'seg', full: 1, rerender: 1, opts: Object.entries(App.TX_TYPES).map(([id, x]) => ({ id, label: x.label })) },
      { k: 'amount', label: d => d.type === 'revenue' ? 'Montant (HT si TVA)' : 'Montant', t: 'number', step: '0.01' },
      { k: 'date', label: d => d.recur && d.recur !== 'none' ? 'Première échéance' : 'Date', t: 'date' },
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'category', label: 'Catégorie', t: 'select', opts: d => opt(App.catList(d.type === 'donation' ? 'none' : d.type, d.companyId), 'Aucune') , show: d => d.type !== 'donation' },
      { k: 'recur', label: 'Récurrence', t: 'select', rerender: 1, opts: [{ id: 'none', label: 'Ponctuel' }, { id: 'monthly', label: 'Tous les mois' }, { id: 'yearly', label: 'Tous les ans' }] },
      { k: 'until', label: 'Jusqu’au (facultatif)', t: 'date', show: d => d.recur && d.recur !== 'none' },
      { k: 'notes', label: 'Notes', t: 'textarea', full: 1 },
      { k: 'files', label: 'Justificatifs', t: 'files', full: 1 },
    ],
  },
  funnels: {
    label: () => 'Tunnel de vente', titleKey: 'name', titlePh: () => 'Nom du tunnel', wide: 1,
    fields: [
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'status', label: 'Statut', t: 'select', opts: d => opt(App.statusList('funnel', d.companyId)) },
      { k: 'offer', label: 'Produit / offre concernée', t: 'text', ph: 'ex. Formation Lumière naturelle' },
      { k: 'price', label: 'Prix de l’offre (€)', t: 'number', step: '0.01' },
      { k: 'saleKeywords', label: 'Mots-clés des ventes (reconnaissance automatique Stripe / PayPal)', t: 'text', full: 1, ph: 'Par défaut : le nom de l’offre. Plusieurs mots-clés séparés par des virgules.' },
      { k: 'steps', label: 'Parcours client', t: 'steps', full: 1 },
      { k: '_perf', t: 'info', full: 1, html: d => d.id ? App.funnelMini(d) : '' },
      { k: 'description', label: 'Description', t: 'textarea', full: 1, more: 1 },
      { k: 'notes', label: 'Notes', t: 'textarea', full: 1, more: 1 },
      { k: 'files', label: 'Fichiers joints', t: 'files', full: 1, more: 1 },
    ],
  },
  funnelStats: {
    label: () => 'Statistiques du tunnel', titleKey: 'label', titlePh: () => 'Libellé (facultatif, ex. Semaine 48)', optionalTitle: 1, wide: 1,
    fields: [
      { k: 'funnelId', label: 'Tunnel', t: 'select', rerender: 1, opts: d => App.list('funnels', f => !d.companyId || f.companyId === d.companyId || f.id === d.funnelId).map(f => ({ id: f.id, label: f.name + (App.scope() === 'all' ? ' · ' + App.companyName(f.companyId) : '') })) },
      { k: 'date', label: 'Date (ou début de la période)', t: 'date' },
      { k: 'end', label: 'Fin de la période (facultatif)', t: 'date' },
      { k: 'source', label: 'Source du trafic', t: 'select', opts: d => opt(App.catList('source', d.companyId), 'Toutes sources / non précisé') },
      { k: 'campaignId', label: 'Campagne', t: 'select', opts: d => [{ id: '', label: 'Aucune' }].concat(App.list('campaigns', c => c.companyId === d.companyId).map(c => ({ id: c.id, label: c.name }))) },
      { k: 'visitors', label: 'Visiteurs par étape', t: 'visitors', full: 1 },
      { k: 'clicks', label: 'Clics (bouton d’achat)', t: 'number' },
      { k: 'carts', label: 'Ajouts au panier', t: 'number' },
      { k: 'checkouts', label: 'Paiements commencés', t: 'number' },
      { k: 'purchases', label: 'Paiements finalisés (ventes)', t: 'number' },
      { k: 'revenue', label: 'Chiffre d’affaires généré (€)', t: 'number', step: '0.01' },
      { k: 'toFinance', label: 'Ajouter ce chiffre d’affaires dans Finances → Revenus (sans ressaisie)', t: 'check', full: 1 },
      { k: 'promos', label: 'Codes promo utilisés', t: 'promos', full: 1 },
      { k: 'notes', label: 'Notes', t: 'textarea', full: 1, more: 1 },
    ],
  },
  campaigns: {
    label: () => 'Campagne marketing', titleKey: 'name', titlePh: () => 'Nom de la campagne',
    fields: [
      { k: 'companyId', label: 'Entreprise', t: 'select', opts: companyOpts, rerender: 1 },
      { k: 'category', label: 'Type', t: 'select', opts: d => opt(App.catList('campaign', d.companyId), 'Choisir…') },
      { k: 'source', label: 'Source / canal', t: 'select', rerender: 1, opts: d => opt(App.catList('source', d.companyId), 'Choisir…') },
      { k: 'funnelId', label: 'Tunnel associé', t: 'select', rerender: 1, opts: d => [{ id: '', label: 'Aucun' }].concat(App.list('funnels', f => f.companyId === d.companyId).map(f => ({ id: f.id, label: f.name }))) },
      { k: 'start', label: 'Début', t: 'date' },
      { k: 'end', label: 'Fin', t: 'date' },
      { k: 'cost', label: 'Coût / budget dépensé (€)', t: 'number', step: '0.01' },
      { k: 'promoCode', label: 'Code promo associé', t: 'text', ph: 'ex. LUMIERE10' },
      { k: 'partner', label: 'Partenaire / créateur (collaboration)', t: 'text' },
      { k: 'toFinance', label: 'Enregistrer ce coût dans Finances → Dépenses (sans ressaisie)', t: 'check', full: 1 },
      { k: '_link', t: 'info', full: 1, html: d => App.trackingLinkBlock(d) },
      { k: 'notes', label: 'Notes', t: 'textarea', full: 1, more: 1 },
      { k: 'files', label: 'Fichiers joints (visuels, contrat…)', t: 'files', full: 1, more: 1 },
    ],
  },
  companies: {
    label: () => 'Entreprise', titleKey: 'name',
    fields: [
      { k: 'logo', label: 'Logo', t: 'cover', side: 1, square: 1 },
      { k: 'color', label: 'Couleur', t: 'color', full: 1 },
      { k: 'description', label: 'Description / activité', t: 'textarea', full: 1, rows: 3 },
      { k: 'siret', label: 'SIRET / identifiant', t: 'text' },
      { k: 'legal', label: 'Forme juridique', t: 'text', ph: 'Micro-entreprise, SASU…' },
      { k: 'email', label: 'E-mail de contact', t: 'text' },
      { k: 'website', label: 'Site web', t: 'text' },
    ],
  },
};

/* ---------- Ouverture / rendu ---------- */
App.edit = (coll, item, { isNew } = {}) => {
  if (!item) return;
  App.closeEditor(true);
  const draft = clone(item);
  const sch = App.SCHEMAS[coll];
  if (coll === 'tasks') { draft.kind = draft.kind || 'task'; draft.sched = draft.sched || (draft.kind === 'event' ? 'day' : 'none'); }
  if (coll === 'funnels' && !draft.steps) draft.steps = App.defaultSteps();
  if (sch.fields.some(f => f.k === 'status') && !draft.status) {
    const kind = { tasks: 'task', posts: 'post', scripts: 'script', projects: 'project', funnels: 'funnel' }[coll];
    const list = App.statusList(kind, draft.companyId);
    draft.status = (list.find(s => s.id === draft.status) || (coll === 'projects' ? list.find(s => s.id === 'en-cours') : null) || list[0] || {}).id;
  }
  if (coll === 'goals') { draft.metric = draft.metric || 'revenue'; draft.period = draft.period || 'month'; draft.periodValue = draft.periodValue || (draft.period === 'year' ? D.today().slice(0, 4) : D.today().slice(0, 7)); }
  App.ed = { coll, draft, isNew: !!isNew, orig: JSON.stringify(item) };
  const o = document.createElement('div'); o.className = 'overlay'; o.onclick = () => App.closeEditor();
  const d = document.createElement('div'); d.className = 'drawer'; if (sch.wide) d.style.width = 'min(760px, 100vw)';
  document.body.append(o, d);
  App.renderEditor(true);
};

App.renderEditor = (first) => {
  const { coll, draft, isNew } = App.ed, sch = App.SCHEMAS[coll], d = $('.drawer'); if (!d) return;
  const vis = sch.fields.filter(f => !f.show || f.show(draft));
  const side = vis.filter(f => f.side), main = vis.filter(f => !f.side && !f.more), more = vis.filter(f => f.more);
  const tk = sch.titleKey, ph = sch.titlePh ? sch.titlePh(draft) : 'Titre';
  const extra = App.editorActions(coll, draft, isNew);
  const scroll = d.querySelector('.drawer-body') ? d.querySelector('.drawer-body').scrollTop : 0;
  const moreOpen = d.querySelector('details.more') ? d.querySelector('details.more').open : more.some(f => hasVal(draft[f.k]));
  d.innerHTML = `
    <div class="drawer-head"><span class="tag outline">${esc(sch.label(draft))}</span><span style="flex:1"></span>
      ${!isNew ? `<button class="btn icon ghost" data-ed="delete" title="Supprimer">${ic('trash')}</button>` : ''}
      <button class="btn icon ghost" data-ed="close" title="Fermer (Échap)">${ic('x')}</button></div>
    <div class="drawer-body">
      <div style="display:flex;gap:16px;align-items:flex-start">
        ${side.map(f => fieldHTML(f, draft)).join('')}
        <div style="flex:1;min-width:0"><input class="input title-input" data-k="${tk}" placeholder="${esc(ph)}" value="${esc(draft[tk] || '')}" ${first ? 'autofocus' : ''}>
        ${extra.top || ''}</div>
      </div>
      <div class="form-grid">${main.map(f => fieldHTML(f, draft)).join('')}</div>
      ${more.length ? `<details class="more" ${moreOpen ? 'open' : ''}><summary>Plus de détails</summary><div class="form-grid" style="margin-top:14px">${more.map(f => fieldHTML(f, draft)).join('')}</div></details>` : ''}
      ${!isNew && draft.createdAt ? `<div class="small muted">Créé le ${new Date(draft.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}${draft.updatedAt && draft.updatedAt !== draft.createdAt ? ` · modifié le ${new Date(draft.updatedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}` : ''}${draft.doneAt ? ` · terminé le ${new Date(draft.doneAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}` : ''}</div>` : ''}
    </div>
    <div class="drawer-foot">${extra.foot || ''}<span style="flex:1"></span><button class="btn" data-ed="cancel">Annuler</button><button class="btn primary" data-ed="save">Enregistrer</button></div>`;
  d.querySelector('.drawer-body').scrollTop = scroll;
  App.hydrateFiles(d);
  bindEditor(d);
  if (first) { const t = d.querySelector('.title-input'); if (t && !draft[tk]) setTimeout(() => t.focus(), 30); }
};
const hasVal = v => Array.isArray(v) ? v.length > 0 : !!v;
const lab = (f, d) => typeof f.label === 'function' ? f.label(d) : (f.label || '');

function fieldHTML(f, d) {
  const v = d[f.k], t = typeof f.t === 'function' ? f.t(d) : f.t, cls = f.full ? 'field full' : 'field', L = lab(f, d);
  const wrap = inner => `<div class="${cls}">${L ? `<label>${esc(L)}</label>` : ''}${inner}</div>`;
  switch (t) {
    case 'text': return wrap(`<input class="input" data-k="${f.k}" value="${esc(v || '')}" placeholder="${esc(f.ph || '')}">`);
    case 'number': return wrap(`<input class="input" type="number" inputmode="decimal" step="${f.step || 'any'}" data-k="${f.k}" data-num="1" value="${v ?? ''}">`);
    case 'date': return wrap(`<input class="input" type="date" data-k="${f.k}" ${f.week ? 'data-week="1"' : ''} value="${esc(v || '')}">`);
    case 'month': return wrap(`<input class="input" type="month" data-k="${f.k}" value="${esc(v || '')}">`);
    case 'year': return wrap(`<input class="input" type="number" min="2000" max="2100" data-k="${f.k}" value="${esc(v || '')}">`);
    case 'time': return wrap(`<input class="input" type="time" data-k="${f.k}" value="${esc(v || '')}">`);
    case 'textarea': return wrap(`<textarea class="input" data-k="${f.k}" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}">${esc(v || '')}</textarea>`);
    case 'select': {
      const opts = typeof f.opts === 'function' ? f.opts(d) : f.opts;
      return wrap(`<select class="input" data-k="${f.k}" ${f.rerender ? 'data-rr="1"' : ''}>${opts.map(o => `<option value="${esc(o.id)}" ${String(o.id) === String(v ?? '') ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`);
    }
    case 'seg': return wrap(`<div class="seg">${f.opts.map(o => `<button type="button" class="${v === o.id ? 'on' : ''}" data-seg="${f.k}" data-v="${o.id}">${esc(o.label)}</button>`).join('')}</div>`);
    case 'color': return wrap(`<div class="swatches">${App.COMPANY_COLORS.concat(Object.values(App.COLORS)).map(c => `<button type="button" class="sw ${v === c ? 'on' : ''}" style="--c:${c}" data-color="${f.k}" data-v="${c}"></button>`).join('')}</div>`);
    case 'cover': return `<div><label class="cover-box" style="${f.square ? 'width:96px;aspect-ratio:1' : ''}">${v ? `<img data-file="${v}" alt="">` : `<span>${ic('ul')}<br>${esc(L)}</span>`}<input type="file" accept="image/*" hidden data-cover="${f.k}"></label>${v ? `<button class="btn sm ghost" data-ed="rmcover" data-k="${f.k}" style="margin-top:4px">Retirer</button>` : ''}</div>`;
    case 'files': return wrap(`<div class="files" data-files="${f.k}">${(v || []).map(id => `<div class="file-item">${ic('clip')}<a data-file="${id}" data-fname="${id}" target="_blank" download>Fichier…</a><button class="iconbtn" data-ed="rmfile" data-k="${f.k}" data-id="${id}">${ic('x')}</button></div>`).join('')}
      <label class="btn sm" style="align-self:flex-start">${ic('clip')} Joindre un fichier<input type="file" multiple hidden data-addfiles="${f.k}"></label></div>`);
    case 'subtasks': return wrap(`<div class="subtasks">${(v || []).map((s, i) => `<div class="st"><button type="button" class="check ${s.done ? 'on' : ''}" data-ed="stcheck" data-i="${i}"></button><input class="input" data-st="${i}" value="${esc(s.title)}"><button class="iconbtn" data-ed="strm" data-i="${i}">${ic('x')}</button></div>`).join('')}
      <input class="inline-add" placeholder="+ Ajouter une sous-tâche (Entrée)" data-stadd="1"></div>`);
    case 'info': return `<div class="full">${f.html(d)}</div>`;
    case 'check': return `<div class="field full"><label class="checkline" style="color:var(--ink-2);font-size:13px"><input type="checkbox" data-k="${f.k}" ${v ? 'checked' : ''}> ${esc(L)}</label></div>`;
    case 'steps': return wrap(`<div class="steps-edit">${(v || []).map((s, i) => `<div class="step-row" style="--c:${App.stepType(s.type).color}">
        <span class="step-num">${i + 1}</span>
        <select class="input" data-step="${i}" data-sk="type">${App.STEP_TYPES.map(t => `<option value="${t.id}" ${t.id === s.type ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select>
        <input class="input" data-step="${i}" data-sk="name" value="${esc(s.name || '')}" placeholder="Nom de l’étape">
        <input class="input" data-step="${i}" data-sk="url" value="${esc(s.url || '')}" placeholder="https://… (lien de la page)">
        <span class="step-acts">${s.url ? `<a class="iconbtn" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener" title="Ouvrir la page">${ic('link')}</a>` : ''}
        <button type="button" class="iconbtn" data-ed="stepMove" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} title="Monter">↑</button>
        <button type="button" class="iconbtn" data-ed="stepMove" data-i="${i}" data-dir="1" ${i === v.length - 1 ? 'disabled' : ''} title="Descendre">↓</button>
        <button type="button" class="iconbtn" data-ed="stepRm" data-i="${i}" title="Retirer">${ic('x')}</button></span></div>`).join('')}
      <button type="button" class="btn sm" data-ed="stepAdd" style="align-self:flex-start">${ic('plus')} Ajouter une étape</button></div>`);
    case 'visitors': {
      const fu = App.get('funnels', d.funnelId);
      if (!fu || !(fu.steps || []).length) return wrap('<div class="small muted">Choisis un tunnel qui a des étapes.</div>');
      d.visitors = d.visitors || {};
      return wrap(`<div class="vis-grid">${fu.steps.map(s => `<label class="vis-cell" style="--c:${App.stepType(s.type).color}"><span>${esc(s.name || App.stepType(s.type).label)}</span><input class="input" type="number" min="0" data-vis="${s.id}" value="${d.visitors[s.id] ?? ''}" placeholder="0"></label>`).join('')}</div>`);
    }
    case 'promos': return wrap(`<div class="steps-edit">${(v || []).map((p, i) => `<div class="promo-row">
        <input class="input" data-promo="${i}" data-pk="code" value="${esc(p.code || '')}" placeholder="CODE">
        <input class="input" type="number" min="0" data-promo="${i}" data-pk="uses" value="${p.uses ?? ''}" placeholder="Utilisations">
        <input class="input" type="number" step="0.01" data-promo="${i}" data-pk="revenue" value="${p.revenue ?? ''}" placeholder="CA (€)">
        <button type="button" class="iconbtn" data-ed="promoRm" data-i="${i}">${ic('x')}</button></div>`).join('')}
      <button type="button" class="btn sm" data-ed="promoAdd" style="align-self:flex-start">${ic('plus')} Ajouter un code promo</button></div>`);
  }
  return '';
}

function bindEditor(d) {
  const ed = App.ed, dr = ed.draft;
  d.querySelectorAll('[data-k]').forEach(el => {
    const h = () => {
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.num) v = v === '' ? null : +v;
      if (el.dataset.week && v) v = D.weekStart(v);
      dr[el.dataset.k] = v;
      if (el.dataset.rr) onRerender(el.dataset.k);
    };
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', h);
    if (el.dataset.week) el.addEventListener('change', () => { el.value = dr[el.dataset.k] || ''; });
  });
  d.querySelectorAll('[data-file][data-fname]').forEach(async a => { const m = await App.fileMeta(a.dataset.file); if (m) { a.textContent = `${m.name} · ${Math.round(m.size / 1024)} Ko`; a.download = m.name; } });
  d.addEventListener('click', onEdClick);
  d.querySelectorAll('[data-cover]').forEach(inp => inp.addEventListener('change', async () => {
    const f = inp.files[0]; if (!f) return; const rec = await App.saveFile(f, { maxSide: 1200 }); dr[inp.dataset.cover] = rec.id; App.renderEditor();
  }));
  d.querySelectorAll('[data-addfiles]').forEach(inp => inp.addEventListener('change', async () => {
    const k = inp.dataset.addfiles; dr[k] = dr[k] || [];
    for (const f of inp.files) { if (f.size > 200 * 1024 * 1024) { App.toast(`${f.name} est trop volumineux (200 Mo max)`); continue; } const rec = await App.saveFile(f); dr[k].push(rec.id); }
    App.renderEditor();
  }));
  d.querySelectorAll('[data-step]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    const s = dr.steps[+el.dataset.step], k = el.dataset.sk, old = s.type;
    s[k] = el.value;
    if (k === 'type' && (!s.name || s.name === App.stepType(old).label)) { s.name = App.stepType(s.type).label; App.renderEditor(); }
    if (k === 'type') App.renderEditor();
  }));
  d.querySelectorAll('[data-vis]').forEach(el => el.addEventListener('input', () => { dr.visitors = dr.visitors || {}; dr.visitors[el.dataset.vis] = el.value === '' ? null : +el.value; }));
  d.querySelectorAll('[data-promo]').forEach(el => el.addEventListener('input', () => { const p = dr.promos[+el.dataset.promo]; p[el.dataset.pk] = el.dataset.pk === 'code' ? el.value : (el.value === '' ? null : +el.value); }));
  d.querySelectorAll('[data-st]').forEach(inp => inp.addEventListener('input', () => { dr.subtasks[+inp.dataset.st].title = inp.value; }));
  const sa = d.querySelector('[data-stadd]');
  if (sa) sa.addEventListener('keydown', e => { if (e.key === 'Enter' && sa.value.trim()) { e.preventDefault(); dr.subtasks = dr.subtasks || []; dr.subtasks.push({ title: sa.value.trim(), done: false }); App.renderEditor(); const n = $('.drawer [data-stadd]'); n && n.focus(); } });
  d.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); App.saveEditor(); } });
}
function onRerender(k) {
  const dr = App.ed.draft;
  if (k === 'funnelId' && App.ed.coll === 'funnelStats') { const fu = App.get('funnels', dr.funnelId); if (fu) dr.companyId = fu.companyId; dr.visitors = {}; }
  if (k === 'companyId' || k === 'kind' || k === 'type') { dr.category = ''; const kind = { tasks: 'task', posts: 'post', scripts: 'script', projects: 'project', funnels: 'funnel' }[App.ed.coll]; if (kind && k === 'companyId') { const l = App.statusList(kind, dr.companyId); if (!l.find(s => s.id === dr.status)) dr.status = (l[0] || {}).id; } }
  if (k === 'kind' && dr.kind === 'event') { dr.sched = 'day'; dr.date = dr.date || D.today(); }
  if (k === 'sched') { const td = D.today(); if (dr.sched === 'day' && !dr.date) dr.date = td; if (dr.sched === 'week' && !dr.week) dr.week = D.weekStart(td); if (dr.sched === 'month' && !dr.month) dr.month = td.slice(0, 7); }
  if (k === 'period') dr.periodValue = dr.period === 'year' ? D.today().slice(0, 4) : D.today().slice(0, 7);
  App.renderEditor();
}
function onEdClick(e) {
  const dr = App.ed && App.ed.draft; if (!dr) return;
  const seg = e.target.closest('[data-seg]'); if (seg) { dr[seg.dataset.seg] = seg.dataset.v; onRerender(seg.dataset.seg); return; }
  const col = e.target.closest('[data-color]'); if (col) { dr[col.dataset.color] = col.dataset.v; App.renderEditor(); return; }
  const b = e.target.closest('[data-ed]'); if (!b) return;
  const a = b.dataset.ed;
  if (a === 'close') App.closeEditor();
  if (a === 'cancel') App.closeEditor(true);
  if (a === 'save') App.saveEditor();
  if (a === 'delete') { const { coll } = App.ed; App.closeEditor(true); if (coll === 'companies') App.deleteCompany(dr.id); else App.trash(coll, dr.id); }
  if (a === 'rmcover') { dr[b.dataset.k] = null; App.renderEditor(); }
  if (a === 'rmfile') { dr[b.dataset.k] = dr[b.dataset.k].filter(x => x !== b.dataset.id); App.renderEditor(); }
  if (a === 'stcheck') { dr.subtasks[+b.dataset.i].done = !dr.subtasks[+b.dataset.i].done; App.renderEditor(); }
  if (a === 'strm') { dr.subtasks.splice(+b.dataset.i, 1); App.renderEditor(); }
  if (a === 'stepAdd') { dr.steps = dr.steps || []; const last = dr.steps[dr.steps.length - 1]; const t = !last ? 'vente' : ({ capture: 'vente', vente: 'paiement', paiement: 'upsell', upsell: 'merci', downsell: 'merci', merci: 'telechargement' }[last.type] || 'autre'); dr.steps.push({ id: uid(), type: t, name: App.stepType(t).label, url: '' }); App.renderEditor(); }
  if (a === 'stepRm') { dr.steps.splice(+b.dataset.i, 1); App.renderEditor(); }
  if (a === 'stepMove') { const i = +b.dataset.i, j = i + +b.dataset.dir; if (j >= 0 && j < dr.steps.length) { [dr.steps[i], dr.steps[j]] = [dr.steps[j], dr.steps[i]]; App.renderEditor(); } }
  if (a === 'promoAdd') { dr.promos = dr.promos || []; dr.promos.push({ code: '', uses: null, revenue: null }); App.renderEditor(); }
  if (a === 'promoRm') { dr.promos.splice(+b.dataset.i, 1); App.renderEditor(); }
  if (App.edActions[a]) App.edActions[a](dr, b);
}

App.saveEditor = ({ keepOpen } = {}) => {
  const ed = App.ed; if (!ed) return null;
  const sch = App.SCHEMAS[ed.coll], dr = ed.draft, tk = sch.titleKey;
  if (ed.coll === 'notes' && !dr.title && !dr.body) { App.toast('La note est vide'); return null; }
  if (ed.coll === 'funnelStats') {
    const fu = App.get('funnels', dr.funnelId); if (!fu) { App.toast('Choisis un tunnel'); return null; }
    if (!dr.date) { App.toast('Indique une date'); return null; }
    dr.companyId = fu.companyId;
  }
  if (!sch.optionalTitle && ed.coll !== 'notes' && ed.coll !== 'transactions' && !String(dr[tk] || '').trim()) { App.toast('Ajoute un titre'); $('.drawer .title-input') && $('.drawer .title-input').focus(); return null; }
  if (ed.coll === 'transactions' && !(+dr.amount)) { App.toast('Indique un montant'); return null; }
  if (ed.coll === 'transactions' && !dr.label) dr.label = App.TX_TYPES[dr.type].label;
  if (ed.coll === 'tasks') {
    if (App.isDone(dr) && !dr.doneAt) dr.doneAt = Date.now();
    if (!App.isDone(dr)) delete dr.doneAt;
  }
  const saved = App.put(ed.coll, dr);
  if (App.afterSave[ed.coll]) App.afterSave[ed.coll](saved);
  if (ed.coll !== 'companies' && dr.companyId) { App.prefs.lastCompany = dr.companyId; App.savePrefs(); }
  if (ed.isNew) App.toast(`${sch.label(dr)} enregistré${['tasks', 'posts', 'notes', 'transactions'].includes(ed.coll) && !(ed.coll === 'tasks' && dr.kind === 'event') && ed.coll !== 'transactions' ? 'e' : ''}`);
  if (keepOpen) { ed.isNew = false; ed.orig = JSON.stringify(dr); App.renderEditor(); } else App.closeEditor(true);
  return saved;
};
/* Fermer : enregistre automatiquement les modifications d'un élément existant */
App.closeEditor = (discard) => {
  const ed = App.ed;
  if (ed && !discard && JSON.stringify(ed.draft) !== ed.orig) {
    const tk = App.SCHEMAS[ed.coll].titleKey;
    if (!ed.isNew || ed.draft[tk] || ed.draft.body) { if (App.saveEditor()) return; else return; }
  }
  App.ed = null; $$('.drawer, .drawer ~ .overlay, body > .overlay:not(.modal-overlay)').forEach(x => x.remove());
};

/* ---------- Actions spécifiques à chaque fiche ---------- */
App.edActions = {};
App.editorActions = (coll, d, isNew) => {
  const r = { top: '', foot: '' };
  if (d.auto && (coll === 'funnelStats' || coll === 'transactions')) r.top = `<div class="note-box" style="margin-top:8px">${ic('later')} Importé automatiquement par le collecteur : cet élément est recalculé à chaque collecte. Pour le corriger, modifie plutôt sa source (tunnel, compte relié, mots-clés).</div>`;
  if (d.auto && coll === 'campaigns') r.top = `<div class="note-box" style="margin-top:8px">${ic('later')} Campagne Meta importée automatiquement : coût et dates se mettent à jour seuls. Tu peux choisir son tunnel, son code promo et ses notes.</div>`;
  if (coll === 'tasks' && !isNew && d.kind !== 'event') r.foot = `<button class="btn" data-ed="postpone">${ic('later')} Reporter</button>`;
  if (coll === 'scripts') r.foot = `<button class="btn" data-ed="scriptToPost">${ic('film')} Créer la publication</button>`;
  if (coll === 'posts' && !isNew) r.foot = `<button class="btn" data-ed="postTask">${ic('check')} Ajouter une tâche liée</button>`;
  if (coll === 'notes' && !isNew) r.foot = `<button class="btn" data-ed="convertNote">${ic('arrow')} Transformer en…</button>`;
  if (coll === 'funnels' && !isNew) r.foot = `<button class="btn" data-ed="addStats">${ic('plus')} Saisir des statistiques</button><button class="btn" data-ed="addCampaign">${ic('target')} Campagne</button>`;
  if (coll === 'goals' && !isNew) { const p = App.goalProgress(d); r.top = `<div style="margin-top:8px"><div class="progress"><i style="width:${p.ratio * 100}%"></i></div><div class="small muted" style="margin-top:4px">${fmtGoal(d, p.cur)} / ${fmtGoal(d, p.target)}</div></div>`; }
  return r;
};
const fmtGoal = (g, n) => g.metric === 'revenue' ? eur(n) : `${Math.round(n * 100) / 100}${g.unit ? ' ' + esc(g.unit) : ''}`;
App.fmtGoal = fmtGoal;
App.edActions.postpone = (d, b) => { const t = App.get('tasks', d.id); if (!t) return; App.menu(b, App.postponeItems(t, () => { App.ed.draft = clone(t); App.ed.orig = JSON.stringify(t); App.renderEditor(); })); };
App.edActions.scriptToPost = d => {
  if (!String(d.title || '').trim()) { App.toast('Donne un titre au script'); return; }
  const s = App.saveEditor({ keepOpen: true }); if (!s) return;
  const existing = App.list('posts', p => p.scriptId === s.id)[0];
  if (existing) { App.edit('posts', existing); return; }
  const caption = [s.hook, s.cta].filter(Boolean).join('\n\n');
  App.edit('posts', { companyId: s.companyId, title: s.title, network: s.network, category: s.category, caption, description: s.concept || '', notes: s.notes || '', scriptId: s.id, date: D.today() }, { isNew: true });
  App.toast('Publication pré-remplie depuis le script : choisis sa date');
};
App.edActions.postTask = d => {
  App.saveEditor({ keepOpen: true });
  App.quickCreate('task', { companyId: d.companyId, postId: d.id, title: 'Préparer : ' + (d.title || ''), sched: d.date ? 'day' : 'none', date: d.date ? D.add(d.date, -1) : undefined, category: 'creation-de-contenu' });
};
App.edActions.convertNote = (d, b) => App.menu(b, App.convertItems(d));
App.edActions.openLinked = (d, b) => { const o = App.get(b.dataset.coll, b.dataset.id); if (o) { App.saveEditor({ keepOpen: true }); App.edit(b.dataset.coll, o); } };
App.edActions.addProjTask = (d, b) => {
  const inp = $('.drawer [data-projtask]'); const v = inp && inp.value.trim(); if (!v) return;
  if (App.ed.isNew) { if (!App.saveEditor({ keepOpen: true })) return; }
  App.put('tasks', { kind: 'task', title: v, companyId: d.companyId, projectId: d.id, sched: 'none', priority: 'mid', status: App.openStatus(d.companyId) });
  App.renderEditor(); const n = $('.drawer [data-projtask]'); n && n.focus();
};
App.edActions.projToggle = (d, b) => { const t = App.get('tasks', b.dataset.id); if (t) { App.toggleTask(t); App.renderEditor(); } };

App.postLinks = d => {
  const parts = [];
  if (d.scriptId) { const s = App.get('scripts', d.scriptId); if (s && !s.deletedAt) parts.push(`<button class="btn sm" data-ed="openLinked" data-coll="scripts" data-id="${s.id}">${ic('script')} Script : ${esc(s.title)}</button>`); }
  const tasks = d.id ? App.list('tasks', t => t.postId === d.id) : [];
  tasks.forEach(t => parts.push(`<button class="btn sm" data-ed="openLinked" data-coll="tasks" data-id="${t.id}">${App.isDone(t) ? '✓' : ic('check')} ${esc(t.title)}</button>`));
  return parts.length ? `<div class="field"><label>Éléments liés</label><div style="display:flex;gap:6px;flex-wrap:wrap">${parts.join('')}</div></div>` : '';
};
App.igStatsBlock = d => {
  const s = d.igStats; if (!s) return '';
  const k = (n, l) => `<div><b>${App.num(n)}</b><span>${l}</span></div>`;
  return `<div class="field"><label>Statistiques Instagram ${d.igPermalink ? `· <a href="${esc(safeUrl(d.igPermalink))}" target="_blank" rel="noopener">voir la publication</a>` : ''}</label>
    <div class="mini-kpis">${k(s.views, 'vues')}${k(s.reach, 'comptes touchés')}${k(s.likes, 'j’aime')}${k(s.comments, 'commentaires')}${k(s.saved, 'enregistrements')}${k(s.shares, 'partages')}</div></div>`;
};
App.scriptLinks = d => {
  const posts = d.id ? App.list('posts', p => p.scriptId === d.id) : [];
  return posts.length ? `<div class="field"><label>Publication liée</label><div style="display:flex;gap:6px;flex-wrap:wrap">${posts.map(p => `<button class="btn sm" data-ed="openLinked" data-coll="posts" data-id="${p.id}">${ic('film')} ${esc(p.title)} · ${esc(D.fmt(p.date))}</button>`).join('')}</div></div>` : '';
};
App.projectTaskBlock = d => {
  const ts = d.id ? App.sortTasks(App.list('tasks', t => t.projectId === d.id)) : [];
  const pr = d.id ? App.projectProgress(d) : null;
  return `<div class="field"><label>Tâches du projet${pr !== null ? ` · ${Math.round(pr * 100)} %` : ''}</label>
    ${pr !== null ? `<div class="progress" style="margin-bottom:6px"><i style="width:${pr * 100}%"></i></div>` : ''}
    <div class="rows">${ts.map(t => `<div class="row ${App.isDone(t) ? 'done' : ''}" style="min-height:34px;padding:5px 2px"><button class="check ${App.isDone(t) ? 'on' : ''}" data-ed="projToggle" data-id="${t.id}"></button><div class="grow"><div class="title" data-ed="openLinked" data-coll="tasks" data-id="${t.id}">${esc(t.title)}</div></div><span class="small muted">${esc(t.sched !== 'none' ? App.schedLabel(t) : '')}</span></div>`).join('')}</div>
    <div style="display:flex;gap:6px"><input class="inline-add" data-projtask="1" placeholder="+ Ajouter une tâche au projet" style="flex:1" onkeydown="if(event.key==='Enter'){event.preventDefault();App.edActions.addProjTask(App.ed.draft)}"><button class="btn sm" data-ed="addProjTask">Ajouter</button></div></div>`;
};

/* Transformer une note (boîte de réception) en autre chose, sans ressaisie */
App.convertItems = n => {
  const title = n.title || (n.body || '').split('\n')[0].slice(0, 90);
  const body = n.title ? (n.body || '') : (n.body || '').split('\n').slice(1).join('\n').trim();
  const base = { companyId: n.companyId, files: (n.files || []).slice() };
  const done = (coll, obj) => {
    const note = App.get('notes', n.id); if (note) { note.processed = true; note.convertedTo = coll; App.put('notes', note, { silent: true }); }
    App.closeEditor(true);
    App.edit(coll, obj, { isNew: true }); App.render();
  };
  const link = n.link ? '\n' + n.link : '';
  return [
    { label: 'Tâche', icon: ic('check'), fn: () => done('tasks', Object.assign({ kind: 'task', title, description: body + link, sched: 'none', priority: 'mid' }, base)) },
    { label: 'Projet', icon: ic('folder'), fn: () => done('projects', Object.assign({ name: title, description: body + link, startDate: D.today(), priority: 'mid' }, base)) },
    { label: 'Script vidéo', icon: ic('script'), fn: () => done('scripts', Object.assign({ title, concept: body + link }, base)) },
    { label: 'Publication', icon: ic('film'), fn: () => done('posts', Object.assign({ title, description: body + link, date: D.today() }, base)) },
    { label: 'Rendez-vous', icon: ic('clock'), fn: () => done('tasks', Object.assign({ kind: 'event', title, description: body + link, sched: 'day', date: D.today(), priority: 'mid' }, base)) },
  ];
};
