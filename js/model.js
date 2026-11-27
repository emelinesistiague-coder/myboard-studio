/* MYBOARD Studio — modèle : modèle d'entreprise, statuts, périmètre, calculs */
'use strict';

App.COLORS = { gris: '#8a847b', sable: '#a88b5a', jaune: '#c39a1e', orange: '#cf7434', rouge: '#bf4f3d', rose: '#c2557f', violet: '#7a58b3', bleu: '#4570b2', turquoise: '#2f8f8a', vert: '#4c8752' };
App.COMPANY_COLORS = ['#3d5a4c', '#9a5b3f', '#4a5f8a', '#8a4f6d', '#6b6a3a', '#3f7a85', '#7a4a3a', '#555'];
App.PRIORITIES = [
  { id: 'high', label: 'Haute', color: App.COLORS.rouge },
  { id: 'mid', label: 'Moyenne', color: App.COLORS.jaune },
  { id: 'low', label: 'Basse', color: App.COLORS.gris },
];
App.priority = id => App.PRIORITIES.find(p => p.id === id);

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const L = (arr) => arr.map(([label, color, extra]) => Object.assign({ id: slug(label), label, color: App.COLORS[color] }, extra || {}));

/* Modèle appliqué à chaque nouvelle entreprise : même structure de base, personnalisable ensuite */
App.companyTemplate = () => ({
  statuses: {
    task: L([['À faire', 'gris'], ['En cours', 'bleu'], ['En attente', 'jaune'], ['Terminé', 'vert', { done: true }], ['Annulé', 'rouge', { done: true, cancelled: true }]]),
    post: L([['Pas commencé', 'gris'], ['À préparer', 'sable'], ['En tournage', 'orange'], ['À monter', 'jaune'], ['En montage', 'violet'], ['À valider', 'rose'], ['Terminée', 'turquoise'], ['Programmée', 'bleu', { done: true }], ['Publiée', 'vert', { done: true, published: true }]]),
    script: L([['Idée', 'gris'], ['Brouillon', 'jaune'], ['Écrit', 'bleu'], ['Validé', 'turquoise'], ['Tourné', 'vert', { done: true }]]),
    project: L([['Idée', 'gris'], ['En cours', 'bleu'], ['En attente', 'jaune'], ['Terminé', 'vert', { done: true }]]),
  },
  categories: {
    task: L([['Administratif', 'gris'], ['Création de contenu', 'rose'], ['Commercial', 'bleu'], ['Finances', 'vert'], ['Prise de décision', 'violet'], ['Projet', 'turquoise'], ['Personnel', 'sable']]),
    event: L([['Rendez-vous', 'bleu'], ['Réunion', 'violet'], ['Session de tournage', 'orange'], ['Session de montage', 'rose'], ['Échéance', 'rouge'], ['Rappel', 'sable']]),
    post: L([['Éducatif', 'bleu'], ['Inspiration', 'rose'], ['Coulisses', 'sable'], ['Promotion', 'orange'], ['Témoignage', 'turquoise']]),
    script: L([['Éducatif', 'bleu'], ['Inspiration', 'rose'], ['Coulisses', 'sable'], ['Promotion', 'orange'], ['Témoignage', 'turquoise']]),
    revenue: L([['Ventes', 'vert'], ['Prestations', 'bleu'], ['Partenariats', 'violet'], ['Affiliation', 'turquoise'], ['Autre', 'gris']]),
    expense: L([['Matériel', 'sable'], ['Abonnements', 'violet'], ['Achats', 'orange'], ['Prestations externes', 'bleu'], ['Publicité', 'rose'], ['Autres charges', 'gris']]),
    tax: L([['Cotisations sociales', 'bleu'], ['Impôts et taxes', 'rouge'], ['TVA', 'jaune'], ['Autres prélèvements', 'gris']]),
    note: L([['Idée', 'jaune'], ['Info importante', 'rouge'], ['Piste de projet', 'turquoise'], ['Lien / référence', 'bleu']]),
  },
  networks: L([['Instagram', 'rose'], ['TikTok', 'gris'], ['YouTube', 'rouge'], ['Facebook', 'bleu'], ['LinkedIn', 'turquoise'], ['Pinterest', 'orange']]),
  fiscal: { regime: '', cotisRate: 0, impotRate: 0, tvaEnabled: false, tvaRate: 20 },
  donation: { mode: 'none', value: 0 },
});

App.STATUS_KINDS = { task: 'Tâches & rendez-vous', post: 'Publications', script: 'Scripts', project: 'Projets' };
App.CAT_KINDS = { task: 'Tâches', event: 'Rendez-vous', post: 'Publications', script: 'Scripts', revenue: 'Revenus', expense: 'Dépenses', tax: 'Taxes & prélèvements', note: 'Pense-bête' };

App.newCompany = (data = {}) => {
  const n = App.companies({ archived: true }).length;
  return Object.assign({ name: 'Nouvelle entreprise', color: App.COMPANY_COLORS[n % App.COMPANY_COLORS.length], description: '', siret: '', order: n, archived: false }, App.companyTemplate(), data);
};

/* ---------- Entreprises & périmètre ---------- */
App.companies = ({ archived = false } = {}) => [...App.data.companies.values()]
  .filter(c => !c.deletedAt && (archived || !c.archived))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
App.company = id => { const c = App.get('companies', id); return c && !c.deletedAt ? c : null; };
App.scope = () => App.state.company || 'all';
App.inScope = companyId => {
  const c = App.company(companyId); if (!c) return false;
  const s = App.scope();
  return s === 'all' ? !c.archived : companyId === s;
};
/* Tous les éléments visibles d'une collection dans le périmètre actuel */
App.list = (coll, fn) => [...App.data[coll].values()].filter(o => !o.deletedAt && App.inScope(o.companyId) && (!fn || fn(o)));
App.defaultCompanyId = () => App.scope() !== 'all' ? App.scope() : (App.prefs.lastCompany && App.company(App.prefs.lastCompany) && !App.company(App.prefs.lastCompany).archived ? App.prefs.lastCompany : (App.companies()[0] || {}).id);
App.scopeCompanies = () => App.scope() === 'all' ? App.companies() : [App.company(App.scope())].filter(Boolean);

/* ---------- Statuts et catégories (par entreprise, union en vue globale) ---------- */
const unionBy = lists => { const m = new Map(); lists.flat().forEach(x => { if (!m.has(x.id)) m.set(x.id, x); }); return [...m.values()]; };
App.statusList = (kind, companyId) => {
  if (companyId) { const c = App.company(companyId); return c ? c.statuses[kind] : []; }
  return unionBy(App.scopeCompanies().map(c => c.statuses[kind]));
};
App.catList = (kind, companyId) => {
  if (companyId) { const c = App.company(companyId); return c ? (c.categories[kind] || []) : []; }
  return unionBy(App.scopeCompanies().map(c => c.categories[kind] || []));
};
App.networkList = companyId => {
  if (companyId) { const c = App.company(companyId); return c ? c.networks : []; }
  return unionBy(App.scopeCompanies().map(c => c.networks));
};
const FALLBACK = { id: '', label: '—', color: App.COLORS.gris };
App.status = (kind, item) => (App.statusList(kind, item.companyId).find(s => s.id === item.status)) || App.statusList(kind, item.companyId)[0] || FALLBACK;
App.cat = (kind, item) => item.category ? (App.catList(kind, item.companyId).find(s => s.id === item.category) || null) : null;
App.network = item => App.networkList(item.companyId).find(n => n.id === item.network) || null;

/* ---------- Tâches & rendez-vous (une seule collection, jamais dupliquée) ---------- */
App.isEvent = t => t.kind === 'event';
App.isDone = t => !!App.status('task', t).done;
App.doneStatus = cid => (App.statusList('task', cid).find(s => s.done && !s.cancelled) || {}).id;
App.openStatus = cid => (App.statusList('task', cid).find(s => !s.done) || {}).id;
App.toggleTask = t => {
  if (App.isDone(t)) { t.status = App.openStatus(t.companyId); delete t.doneAt; }
  else { t.status = App.doneStatus(t.companyId); t.doneAt = Date.now(); }
  App.put('tasks', t);
};
/* Fin de la période prévue d'une tâche (jour, semaine ou mois) */
App.taskEnd = t => t.sched === 'day' ? t.date : t.sched === 'week' ? D.add(t.week, 6) : t.sched === 'month' ? D.monthEnd(t.month + '-01') : null;
App.isOverdue = (t, today = D.today()) => {
  if (App.isDone(t)) return false;
  const end = App.taskEnd(t);
  return (end && end < today) || (t.due && t.due < today);
};
App.schedule = (t, kind, value) => {
  t.sched = kind;
  if (kind === 'day') t.date = value;
  if (kind === 'week') t.week = D.weekStart(value);
  if (kind === 'month') t.month = value.slice(0, 7);
  if (kind === 'none') { /* garde les anciennes valeurs inutilisées */ }
};
App.schedLabel = t => {
  if (t.sched === 'day') return D.rel(t.date) + (t.time ? ' · ' + t.time : '');
  if (t.sched === 'week') return D.weekLabel(t.week).replace('Semaine du', 'sem. du');
  if (t.sched === 'month') return D.month(t.month + '-01');
  return 'Non planifiée';
};
App.sortTasks = arr => arr.sort((a, b) => (App.isDone(a) - App.isDone(b)) || ((a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0)
  || (prioRank(a) - prioRank(b)) || (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
const prioRank = t => ({ high: 0, mid: 1, low: 2 }[t.priority] ?? 1);
App.subProgress = t => { const s = t.subtasks || []; return s.length ? `${s.filter(x => x.done).length}/${s.length}` : ''; };

/* ---------- Périodes ---------- */
App.PERIODS = [['week', 'Semaine'], ['month', 'Mois'], ['quarter', 'Trimestre'], ['year', 'Année'], ['custom', 'Personnalisée']];
App.range = (p) => {
  const a = p.anchor || D.today();
  if (p.type === 'week') { const s = D.weekStart(a); return { start: s, end: D.add(s, 6), label: D.weekLabel(s) }; }
  if (p.type === 'month') return { start: D.monthStart(a), end: D.monthEnd(a), label: cap(D.month(a)) };
  if (p.type === 'quarter') { const d = D.parse(a); const q = Math.floor(d.getMonth() / 3); const s = D.iso(new Date(d.getFullYear(), q * 3, 1)); return { start: s, end: D.monthEnd(D.addMonths(s, 2)), label: `T${q + 1} ${d.getFullYear()}` }; }
  if (p.type === 'year') { const y = a.slice(0, 4); return { start: y + '-01-01', end: y + '-12-31', label: y }; }
  const s = p.start || D.monthStart(a), e = p.end || D.monthEnd(a);
  return { start: s, end: e, label: `${D.fmt(s, { day: 'numeric', month: 'short', year: 'numeric' })} → ${D.fmt(e, { day: 'numeric', month: 'short', year: 'numeric' })}` };
};
App.shiftPeriod = (p, dir) => {
  const q = Object.assign({}, p);
  if (p.type === 'week') q.anchor = D.add(p.anchor, 7 * dir);
  else if (p.type === 'month') q.anchor = D.addMonths(D.monthStart(p.anchor), dir);
  else if (p.type === 'quarter') q.anchor = D.addMonths(D.monthStart(p.anchor), 3 * dir);
  else if (p.type === 'year') q.anchor = D.addMonths(D.monthStart(p.anchor), 12 * dir);
  else { const r = App.range(p); const len = D.diff(r.start, r.end) + 1; q.start = D.add(r.start, len * dir); q.end = D.add(r.end, len * dir); }
  return q;
};
App.prevRange = (p, mode = 'prev') => mode === 'year'
  ? (() => { const r = App.range(p); return { start: D.addMonths(r.start, -12), end: D.addMonths(r.end, -12) }; })()
  : App.range(App.shiftPeriod(p, -1));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
App.cap = cap;

/* ---------- Finances ---------- */
App.TX_TYPES = {
  revenue: { label: 'Revenu', plural: 'Revenus', color: '#4c8752' },
  expense: { label: 'Dépense', plural: 'Dépenses', color: '#cf7434' },
  tax: { label: 'Cotisation / taxe', plural: 'Cotisations & taxes', color: '#4570b2' },
  donation: { label: 'Don', plural: 'Dons', color: '#c2557f' },
};
/* Dates d'occurrence d'une opération dans une période (gère les frais récurrents) */
App.occurrences = (tx, s, e) => {
  if (!tx.date) return [];
  if (!tx.recur || tx.recur === 'none') return tx.date >= s && tx.date <= e ? [tx.date] : [];
  const step = tx.recur === 'yearly' ? 12 : 1, out = [];
  for (let k = 0; k < 600; k++) {
    const d = D.addMonths(tx.date, k * step);
    if (d > e || (tx.until && d > tx.until)) break;
    if (d >= s) out.push(d);
  }
  return out;
};
App.txIn = (s, e, companyId) => {
  const out = [];
  App.list('transactions', t => !companyId || t.companyId === companyId).forEach(t => App.occurrences(t, s, e).forEach(d => out.push({ tx: t, date: d, amount: +t.amount || 0 })));
  return out.sort((a, b) => b.date.localeCompare(a.date));
};
App.finSummary = (s, e, companyId) => {
  const comps = companyId ? [App.company(companyId)] : App.scopeCompanies();
  const days = D.diff(s, e) + 1;
  const tot = { revenue: 0, expense: 0, tax: 0, donation: 0, taxEst: 0, tva: 0, donDue: 0 };
  comps.filter(Boolean).forEach(c => {
    const r = { revenue: 0, expense: 0, tax: 0, donation: 0 };
    App.txIn(s, e, c.id).forEach(o => { r[o.tx.type] += o.amount; });
    Object.keys(r).forEach(k => tot[k] += r[k]);
    const f = c.fiscal || {};
    tot.taxEst += r.revenue * ((+f.cotisRate || 0) + (+f.impotRate || 0)) / 100;
    if (f.tvaEnabled) tot.tva += r.revenue * (+f.tvaRate || 0) / 100;
    const dn = c.donation || {};
    if (dn.mode === 'percent') tot.donDue += r.revenue * (+dn.value || 0) / 100;
    if (dn.mode === 'fixed') tot.donDue += (+dn.value || 0) * days / 30.4375;
  });
  tot.result = tot.revenue - tot.expense - tot.tax - tot.donation;
  tot.provision = Math.max(0, tot.taxEst - tot.tax);
  tot.afterProvision = tot.result - tot.provision;
  tot.donLeft = Math.max(0, tot.donDue - tot.donation);
  return tot;
};
App.monthly = (s, e, companyId) => {
  const months = []; let m = D.monthStart(s);
  while (m <= e && months.length < 60) { months.push(m); m = D.addMonths(m, 1); }
  return months.map(ms => {
    const me = D.monthEnd(ms), r = { month: ms, revenue: 0, expense: 0, tax: 0, donation: 0 };
    App.txIn(ms < s ? s : ms, me > e ? e : me, companyId).forEach(o => r[o.tx.type] += o.amount);
    r.result = r.revenue - r.expense - r.tax - r.donation;
    return r;
  });
};

/* ---------- Objectifs : progression calculée automatiquement quand c'est possible ---------- */
App.GOAL_METRICS = { revenue: 'Chiffre d’affaires (auto)', posts: 'Publications publiées (auto)', tasks: 'Tâches terminées (auto)', manual: 'Suivi manuel' };
App.goalRange = g => g.period === 'year' ? { start: g.periodValue + '-01-01', end: g.periodValue + '-12-31' } : { start: g.periodValue + '-01', end: D.monthEnd(g.periodValue + '-01') };
App.goalProgress = g => {
  const r = App.goalRange(g); let cur = +g.current || 0;
  if (g.metric === 'revenue') cur = App.finSummary(r.start, r.end, g.companyId).revenue;
  if (g.metric === 'posts') cur = App.list('posts', p => p.companyId === g.companyId && App.status('post', p).published && p.date >= r.start && p.date <= r.end).length;
  if (g.metric === 'tasks') cur = App.list('tasks', t => t.companyId === g.companyId && App.isDone(t) && !App.status('task', t).cancelled && t.doneAt && D.iso(new Date(t.doneAt)) >= r.start && D.iso(new Date(t.doneAt)) <= r.end).length;
  const target = +g.target || 0;
  return { cur, target, ratio: target ? Math.min(1, cur / target) : 0 };
};
App.projectTasks = p => App.list('tasks', t => t.projectId === p.id);
App.projectProgress = p => { const ts = App.projectTasks(p).filter(t => !App.status('task', t).cancelled); return ts.length ? ts.filter(App.isDone).length / ts.length : null; };
