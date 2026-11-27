/* MYBOARD Studio — interface : icônes, coquille, navigation, composants communs */
'use strict';

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  film: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M10 8.5v7l5.5-3.5z"/>',
  script: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  ul: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  later: '<path d="M12 7v5l3 2"/><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 3v4h4"/>',
  clip: '<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7L10 17.3a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
};
const ic = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
App.ic = ic;

App.NAV = [
  ['dashboard', 'Tableau de bord', 'home'],
  ['today', 'Aujourd’hui', 'sun'],
  ['agenda', 'Tâches & agenda', 'cal'],
  ['content', 'Réseaux sociaux', 'film'],
  ['scripts', 'Scripts vidéo', 'script'],
  ['ideas', 'Pense-bête', 'bulb'],
  ['projects', 'Projets & objectifs', 'target'],
  ['finance', 'Finances', 'euro'],
];

/* ---------- Composants ---------- */
App.tag = (x, extra = '') => x ? `<span class="tag" style="--c:${x.color}">${esc(x.label)}${extra}</span>` : '';
App.avatar = (c, cls = '') => {
  if (!c) return '';
  const ini = esc((c.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase());
  return `<span class="avatar ${cls}" style="--c:${c.color}">${c.logo ? `<img data-file="${c.logo}" alt="">` : ini}</span>`;
};
App.cdot = companyId => { if (App.scope() !== 'all') return ''; const c = App.company(companyId); return c ? `<span class="dot" style="--c:${c.color}" title="${esc(c.name)}"></span>` : ''; };
App.companyName = id => (App.company(id) || {}).name || '';

/* Ligne de tâche / rendez-vous (utilisée partout pour rester cohérent) */
App.taskRow = (t, { showSched = true } = {}) => {
  const done = App.isDone(t), st = App.status('task', t), cat = App.cat(App.isEvent(t) ? 'event' : 'task', t), pr = App.priority(t.priority);
  const proj = t.projectId && App.get('projects', t.projectId), today = D.today();
  const meta = [];
  if (App.scope() === 'all') meta.push(`${App.cdot(t.companyId)} ${esc(App.companyName(t.companyId))}`);
  if (showSched && (t.sched !== 'none' || App.isEvent(t))) meta.push(`<span class="${App.taskEnd(t) && App.taskEnd(t) < today && !done ? 'down' : ''}">${esc(App.schedLabel(t))}</span>`);
  if (t.due) meta.push(`<span class="${t.due < today && !done ? 'down' : ''}">échéance ${esc(D.rel(t.due))}</span>`);
  if (t.duration) meta.push(esc(t.duration));
  if (proj && !proj.deletedAt) meta.push(`${ic('folder', 'ico')} ${esc(proj.name)}`);
  if (App.subProgress(t)) meta.push(`☐ ${App.subProgress(t)}`);
  const focus = t.focus === today;
  return `<div class="row ${done ? 'done' : ''}" draggable="true" data-drag="tasks|${t.id}">
    ${App.isEvent(t) ? `<span class="event-mark" style="--c:${(cat || st).color}">${ic('clock')}</span>` : `<button class="check ${done ? 'on' : ''}" data-act="toggleTask" data-id="${t.id}" title="Marquer comme terminée"></button>`}
    <div class="grow"><div class="title" data-act="edit" data-coll="tasks" data-id="${t.id}">${esc(t.title || 'Sans titre')}</div>
      ${meta.length ? `<div class="meta">${meta.join('<span>·</span>')}</div>` : ''}</div>
    ${pr && pr.id === 'high' && !done ? App.tag(pr) : ''}
    ${cat ? App.tag(cat) : ''}
    ${st.id !== App.openStatus(t.companyId) && !done ? App.tag(st) : ''}
    <div class="actions">
      ${!App.isEvent(t) ? `<button class="iconbtn star ${focus ? 'on' : ''}" data-act="focusTask" data-id="${t.id}" title="Priorité du jour">${ic('star')}</button>` : ''}
      <button class="iconbtn" data-act="postpone" data-id="${t.id}" title="Reporter / planifier">${ic('later')}</button>
    </div>
  </div>`;
};
/* Carte compacte (vues semaine et mois) */
App.miniTask = t => {
  const done = App.isDone(t), cat = App.cat(App.isEvent(t) ? 'event' : 'task', t), st = App.status('task', t);
  const sub = [];
  if (t.time) sub.push(esc(t.time));
  if (App.scope() === 'all') sub.push(App.cdot(t.companyId));
  if (t.due && t.sched !== 'day') sub.push('éch. ' + esc(D.fmt(t.due)));
  if (t.priority === 'high' && !done) sub.push('<span class="down">●</span>');
  if (App.subProgress(t)) sub.push('☐ ' + App.subProgress(t));
  return `<div class="mini-task ${done ? 'done' : ''} ${App.isEvent(t) ? 'event' : ''}" style="--c:${(cat || st).color}" draggable="true" data-drag="tasks|${t.id}">
    ${App.isEvent(t) ? '' : `<button class="check ${done ? 'on' : ''}" data-act="toggleTask" data-id="${t.id}"></button>`}
    <div class="txt" data-act="edit" data-coll="tasks" data-id="${t.id}">${esc(t.title || 'Sans titre')}${sub.length ? `<div class="sub">${sub.join(' ')}</div>` : ''}</div>
  </div>`;
};

/* Sélecteur de période partagé (tableau de bord, finances) */
App.periodBar = (key = 'period') => {
  const p = App.state[key], r = App.range(p);
  return `<div class="toolbar">
    <div class="seg">${App.PERIODS.map(([k, l]) => `<button class="${p.type === k ? 'on' : ''}" data-act="setPeriod" data-key="${key}" data-type="${k}">${l}</button>`).join('')}</div>
    ${p.type === 'custom' ? `<input type="date" class="input" style="width:auto" value="${r.start}" data-change="setCustom" data-key="${key}" data-side="start"><span class="muted">→</span><input type="date" class="input" style="width:auto" value="${r.end}" data-change="setCustom" data-key="${key}" data-side="end">`
      : `<button class="btn icon ghost" data-act="shiftPeriod" data-key="${key}" data-dir="-1">${ic('left')}</button><b style="min-width:130px;text-align:center">${esc(r.label)}</b><button class="btn icon ghost" data-act="shiftPeriod" data-key="${key}" data-dir="1">${ic('right')}</button>`}
  </div>`;
};
App.act.setPeriod = el => { const k = el.dataset.key; const p = App.state[k]; const r = App.range(p); p.type = el.dataset.type; if (p.type === 'custom') { p.start = r.start; p.end = r.end; } else p.anchor = p.anchor || D.today(); App.persistState(); App.render(); };
App.act.shiftPeriod = el => { const k = el.dataset.key; App.state[k] = App.shiftPeriod(App.state[k], +el.dataset.dir); App.persistState(); App.render(); };
App.act.setCustom = el => { const p = App.state[el.dataset.key]; p[el.dataset.side] = el.value; if (p.start > p.end) [p.start, p.end] = [p.end, p.start]; App.persistState(); App.render(); };

/* ---------- Coquille de l'application ---------- */
App.persistState = () => { App.prefs.state = { company: App.state.company, period: App.state.period, finPeriod: App.state.finPeriod, agendaView: App.state.agendaView }; App.savePrefs(); };

App.renderShell = () => {
  const root = $('#app');
  root.innerHTML = `<div class="app" id="shell">
    <aside class="sidebar" id="sidebar"></aside>
    <div style="min-width:0">
      <div class="mobile-bar"><button class="btn icon ghost" data-act="toggleNav">${ic('menu')}</button><span class="grow" id="mobile-title">MYBOARD</span><button class="btn icon ghost" data-act="search">${ic('search')}</button></div>
      <main class="main" id="main"></main>
    </div>
  </div>
  <button class="fab" data-act="quickAdd" title="Ajouter (N)">${ic('plus', '')}</button>
  <div class="toast-wrap" id="toasts"></div>`;
};

App.renderSidebar = () => {
  const s = App.scope(), cur = s === 'all' ? null : App.company(s), today = D.today();
  const nToday = App.list('tasks', t => !App.isDone(t) && ((t.sched === 'day' && t.date <= today) || (t.due && t.due <= today))).length;
  const nIdeas = App.list('notes', n => !n.processed).length;
  $('#sidebar').innerHTML = `
    <div class="brand"><span class="brand-mark">M</span> MYBOARD Studio</div>
    <div class="switcher">
      <button class="switch-btn" data-act="switchCompany">
        ${cur ? App.avatar(cur) : `<span class="avatar" style="--c:var(--ink)">${ic('grid', 'ico')}</span>`}
        <span class="grow"><b style="font-weight:500">${esc(cur ? cur.name : 'Toutes les entreprises')}</b>${cur && cur.archived ? '<div class="small muted">Archivée</div>' : ''}</span>${ic('down')}
      </button>
    </div>
    <nav class="nav">
      ${App.NAV.map(([k, l, i]) => `<a href="#/${k}" class="${App.state.view === k ? 'active' : ''}">${ic(i)}<span>${l}</span>${k === 'today' && nToday ? `<span class="count">${nToday}</span>` : ''}${k === 'ideas' && nIdeas ? `<span class="count">${nIdeas}</span>` : ''}</a>`).join('')}
    </nav>
    <div class="sidebar-foot">
      <button class="btn ghost" data-act="search" style="justify-content:flex-start">${ic('search')} Rechercher <span class="kbd" style="margin-left:auto">Ctrl K</span></button>
      <nav class="nav"><a href="#/settings" class="${App.state.view === 'settings' ? 'active' : ''}">${ic('gear')}<span>Paramètres</span></a></nav>
    </div>`;
  App.hydrateFiles($('#sidebar'));
};

App.render = () => {
  if (!$('#shell')) App.renderShell();
  const main = $('#main');
  if (!App.companies({ archived: true }).length && App.state.view !== 'settings') { App.renderSidebar(); main.innerHTML = App.onboarding(); return; }
  if (App.scope() !== 'all' && !App.company(App.scope())) App.state.company = 'all';
  App.renderSidebar();
  const v = App.views[App.state.view] || App.views.dashboard;
  const y = window.scrollY, same = App._lastView === App.state.view;
  const focusKey = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.focuskey;
  main.innerHTML = v.render();
  $('#mobile-title').textContent = (App.NAV.find(n => n[0] === App.state.view) || ['', 'Paramètres'])[1];
  document.title = 'MYBOARD Studio';
  App.hydrateFiles(main);
  if (v.after) v.after(main);
  if (same) window.scrollTo(0, y); else window.scrollTo(0, 0);
  App._lastView = App.state.view;
  if (focusKey) { const el = $(`[data-focuskey="${focusKey}"]`); if (el) el.focus(); }
};

App.onboarding = () => `<div class="empty-big" style="max-width:520px;margin:8vh auto">
  <div class="brand-mark" style="width:54px;height:54px;font-size:24px;margin:0 auto 20px;border-radius:14px">M</div>
  <h1 style="margin-bottom:12px">Bienvenue dans MYBOARD Studio</h1>
  <p>Ton espace unique pour piloter tes entreprises : tâches, agenda, contenus, scripts, projets et finances.</p>
  <p class="small">Tout est enregistré sur cet appareil, sans compte ni abonnement.</p>
  <div style="display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap">
    <button class="btn primary" data-act="newCompany">${ic('plus')} Créer ma première entreprise</button>
    <button class="btn" data-act="importJSON">${ic('ul')} Restaurer une sauvegarde</button>
  </div></div>`;

/* ---------- Toasts, menus, fenêtres ---------- */
App.toast = (msg, action) => {
  const w = $('#toasts'); if (!w) return;
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { action.fn(); t.remove(); };
  w.appendChild(t); setTimeout(() => t.remove(), action ? 6000 : 3000);
};
App.closeMenu = () => { $$('.menu, .menu-overlay').forEach(m => m.remove()); };
/* items : [{label, icon, fn, danger, sep}] */
App.menu = (anchor, items) => {
  App.closeMenu();
  const m = document.createElement('div'); m.className = 'menu';
  m.innerHTML = items.map((it, i) => it.sep ? '<hr>' : it.html ? it.html : `<button data-i="${i}" class="${it.danger ? 'danger' : ''}" style="${it.danger ? 'color:var(--danger)' : ''}">${it.icon || ''}<span>${it.label}</span></button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  let x = Math.min(r.left, innerWidth - mw - 10), y = r.bottom + 4;
  if (y + mh > innerHeight - 10) y = Math.max(10, r.top - mh - 4);
  m.style.left = Math.max(10, x) + 'px'; m.style.top = y + 'px';
  m.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i]; App.closeMenu(); it.fn && it.fn(); });
  setTimeout(() => document.addEventListener('mousedown', function h(e) { if (!m.contains(e.target)) { App.closeMenu(); document.removeEventListener('mousedown', h); } }), 0);
  return m;
};
App.modal = (html, { onClose } = {}) => {
  App.closeModal();
  const o = document.createElement('div'); o.className = 'overlay modal-overlay';
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = html;
  o.onclick = () => { App.closeModal(); onClose && onClose(); };
  document.body.append(o, m);
  const f = m.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 20);
  return m;
};
App.closeModal = () => { $$('.modal, .modal-overlay').forEach(x => x.remove()); };
App.confirm = (msg, { ok = 'Confirmer', danger } = {}) => new Promise(res => {
  const m = App.modal(`<h2 style="margin-bottom:10px">${esc(msg)}</h2><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px"><button class="btn" data-x="0">Annuler</button><button class="btn ${danger ? 'danger' : 'primary'}" data-x="1" autofocus>${esc(ok)}</button></div>`, { onClose: () => res(false) });
  m.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) { App.closeModal(); res(b.dataset.x === '1'); } });
});
App.ask = (label, { value = '', type = 'text' } = {}) => new Promise(res => {
  const m = App.modal(`<div class="field"><label>${esc(label)}</label><input class="input" type="${type}" value="${esc(value)}" autofocus></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn" data-x="0">Annuler</button><button class="btn primary" data-x="1">Valider</button></div>`, { onClose: () => res(null) });
  const inp = m.querySelector('input');
  const done = ok => { App.closeModal(); res(ok ? inp.value : null); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
  m.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) done(b.dataset.x === '1'); });
});

/* ---------- Événements globaux (délégation) ---------- */
App.bindEvents = () => {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = App.act[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
    e.stopPropagation(); fn(el, e);
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && App.act[el.dataset.change]) App.act[el.dataset.change](el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (el && App.act[el.dataset.input]) App.act[el.dataset.input](el, e); });
  document.addEventListener('keydown', e => {
    const el = e.target.closest && e.target.closest('[data-enter]');
    if (el && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); App.act[el.dataset.enter](el, e); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); App.act.search(); }
    else if (e.key === 'Escape') { if ($('.menu')) App.closeMenu(); else if ($('.modal')) App.closeModal(); else if ($('.drawer')) App.closeEditor(); }
    else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && !$('.drawer') && !$('.modal')) {
      if (e.key === 'n') { e.preventDefault(); App.act.quickAdd($('.fab')); }
      if (e.key === '/') { e.preventDefault(); App.act.search(); }
    }
  });
  /* Glisser-déposer */
  document.addEventListener('dragstart', e => {
    const el = e.target.closest && e.target.closest('[data-drag]'); if (!el) return;
    const [coll, id] = el.dataset.drag.split('|'); App.dragging = { coll, id };
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id);
    setTimeout(() => el.classList.add('dragging'), 0);
  });
  document.addEventListener('dragend', () => { $$('.dragging').forEach(x => x.classList.remove('dragging')); $$('.drop-over').forEach(x => x.classList.remove('drop-over')); App.dragging = null; });
  document.addEventListener('dragover', e => {
    const z = e.target.closest && e.target.closest('[data-drop]'); if (!z || !App.dragging) return;
    e.preventDefault(); $$('.drop-over').forEach(x => x !== z && x.classList.remove('drop-over')); z.classList.add('drop-over');
  });
  document.addEventListener('drop', e => {
    const z = e.target.closest && e.target.closest('[data-drop]'); if (!z || !App.dragging) return;
    e.preventDefault(); z.classList.remove('drop-over');
    const [kind, value] = z.dataset.drop.split('|'); const { coll, id } = App.dragging; App.dragging = null;
    const item = App.get(coll, id); const h = App.dropHandlers[kind]; if (item && h) h(item, value, coll);
  });
  window.addEventListener('hashchange', App.route);
};
App.dropHandlers = {
  day: (it, v, coll) => { if (coll === 'tasks') App.schedule(it, 'day', v); else it.date = v; App.put(coll, it); },
  week: (it, v) => { App.schedule(it, 'week', v); App.put('tasks', it); },
  month: (it, v) => { App.schedule(it, 'month', v); App.put('tasks', it); },
  none: it => { App.schedule(it, 'none'); App.put('tasks', it); },
  project: (it, v) => { it.status = v; App.put('projects', it); },
  poststatus: (it, v) => { it.status = v; App.put('posts', it); },
  igswap: (it, v) => App.swapPostDates(it, App.get('posts', v)),
};

App.route = () => {
  const v = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard';
  App.state.view = App.views[v] ? v : 'dashboard';
  $('#shell') && $('#shell').classList.remove('nav-open');
  App.closeEditor && App.closeEditor(true);
  App.render();
};
App.go = v => { if (location.hash === '#/' + v) App.route(); else location.hash = '#/' + v; };

/* ---------- Actions communes ---------- */
App.act.toggleNav = () => $('#shell').classList.toggle('nav-open');
App.act.switchCompany = el => {
  const items = [{ label: 'Toutes les entreprises', icon: `<span class="avatar" style="--c:var(--ink)">${ic('grid')}</span>`, fn: () => App.setCompany('all') }, { sep: 1 }];
  App.companies().forEach(c => items.push({ label: esc(c.name), icon: App.avatar(c), fn: () => App.setCompany(c.id) }));
  const arch = App.companies({ archived: true }).filter(c => c.archived);
  if (arch.length) { items.push({ sep: 1 }); arch.forEach(c => items.push({ label: esc(c.name) + ' <span class="muted small">archivée</span>', icon: App.avatar(c), fn: () => App.setCompany(c.id) })); }
  items.push({ sep: 1 }, { label: 'Nouvelle entreprise', icon: ic('plus'), fn: App.act.newCompany });
  const m = App.menu(el, items); m.style.width = el.offsetWidth + 'px'; App.hydrateFiles(m);
};
App.setCompany = id => { App.state.company = id; if (id !== 'all') { App.prefs.lastCompany = id; } App.persistState(); App.render(); };
App.act.toggleTask = el => { const t = App.get('tasks', el.dataset.id); if (t) App.toggleTask(t); };
App.act.focusTask = el => { const t = App.get('tasks', el.dataset.id); if (!t) return; const td = D.today(); t.focus = t.focus === td ? null : td; App.put('tasks', t); };
App.act.edit = el => App.edit(el.dataset.coll, App.get(el.dataset.coll, el.dataset.id));

/* Reporter / planifier une tâche */
App.postponeItems = (t, after) => {
  const td = D.today(), apply = (k, v) => { App.schedule(t, k, v); App.put('tasks', t); after && after(); App.toast('Tâche planifiée : ' + App.schedLabel(t)); };
  const nextMon = D.add(D.weekStart(td), 7);
  return [
    { label: 'Aujourd’hui', icon: ic('sun'), fn: () => apply('day', td) },
    { label: 'Demain', icon: ic('arrow'), fn: () => apply('day', D.add(td, 1)) },
    { label: 'Lundi prochain', icon: ic('cal'), fn: () => apply('day', nextMon) },
    { sep: 1 },
    { label: 'Cette semaine (sans jour)', fn: () => apply('week', td) },
    { label: 'Semaine prochaine (sans jour)', fn: () => apply('week', nextMon) },
    { label: 'Ce mois-ci (sans jour)', fn: () => apply('month', td) },
    { label: 'Mois prochain (sans jour)', fn: () => apply('month', D.addMonths(D.monthStart(td), 1)) },
    { sep: 1 },
    { label: 'Choisir une date…', icon: ic('cal'), fn: async () => { const v = await App.ask('Nouvelle date', { type: 'date', value: t.date || td }); if (v) apply('day', v); } },
    { label: 'Retirer la date', fn: () => apply('none') },
  ];
};
App.act.postpone = el => { const t = App.get('tasks', el.dataset.id); if (t) App.menu(el, App.postponeItems(t)); };

/* Ajout rapide universel (+) */
App.QUICK = [
  ['task', 'Tâche', 'check'], ['note', 'Idée ou note', 'bulb'], ['event', 'Rendez-vous', 'clock'], ['expense', 'Dépense', 'wallet'],
  ['revenue', 'Revenu', 'euro'], ['project', 'Projet', 'folder'], ['script', 'Script vidéo', 'script'], ['post', 'Publication', 'film'],
];
App.act.quickAdd = el => {
  if (!App.companies().length) { App.act.newCompany(); return; }
  App.menu(el, App.QUICK.map(([k, l, i]) => ({ label: l, icon: ic(i), fn: () => App.quickCreate(k) })));
  const m = $('.menu'); if (m && el.classList.contains('fab')) { m.style.left = 'auto'; m.style.right = '26px'; m.style.top = 'auto'; m.style.bottom = '86px'; }
};
App.quickCreate = (k, extra = {}) => {
  const cid = extra.companyId || App.defaultCompanyId(), td = D.today();
  const map = {
    task: ['tasks', { kind: 'task', sched: 'none', priority: 'mid' }],
    event: ['tasks', { kind: 'event', sched: 'day', date: td, priority: 'mid' }],
    note: ['notes', {}], project: ['projects', { status: 'en-cours', startDate: td, priority: 'mid' }],
    script: ['scripts', {}], post: ['posts', { date: td }],
    expense: ['transactions', { type: 'expense', date: td, recur: 'none' }], revenue: ['transactions', { type: 'revenue', date: td, recur: 'none' }],
    tax: ['transactions', { type: 'tax', date: td, recur: 'none' }], donation: ['transactions', { type: 'donation', date: td, recur: 'none' }],
  }[k];
  App.edit(map[0], Object.assign({ companyId: cid }, map[1], extra), { isNew: true });
};

/* ---------- Recherche globale ---------- */
App.act.search = () => {
  const m = App.modal(`<input class="search-input" placeholder="Rechercher une tâche, un script, une note, un projet…" autofocus><div class="search-res"></div><div class="small muted" style="margin-top:8px">↑ ↓ pour naviguer · Entrée pour ouvrir · Échap pour fermer</div>`);
  const inp = m.querySelector('input'), out = m.querySelector('.search-res'); let res = [], sel = 0;
  const SRC = [['tasks', 'Tâche', o => [o.title, o.description]], ['posts', 'Publication', o => [o.title, o.caption, o.description, o.hashtags, o.notes]], ['scripts', 'Script', o => [o.title, o.concept, o.script, o.hook, o.notes]],
    ['notes', 'Note', o => [o.title, o.body, o.link]], ['projects', 'Projet', o => [o.name, o.description, o.notes]], ['transactions', 'Finances', o => [o.label, o.notes, String(o.amount)]], ['goals', 'Objectif', o => [o.title]]];
  const draw = () => {
    const q = norm(inp.value.trim());
    if (!q) { out.innerHTML = ''; res = []; return; }
    res = [];
    SRC.forEach(([coll, label, f]) => App.list(coll, o => f(o).some(x => norm(x).includes(q))).slice(0, 8).forEach(o => res.push({ coll, label, o })));
    sel = Math.min(sel, Math.max(0, res.length - 1));
    out.innerHTML = res.length ? res.map((r, i) => `<div class="res ${i === sel ? 'sel' : ''}" data-i="${i}">${App.cdot(r.o.companyId)}<span class="tag outline">${r.label}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.o.title || r.o.name || r.o.label || (r.o.body || '').slice(0, 60) || 'Sans titre')}</span><span class="small muted">${esc(App.companyName(r.o.companyId))}</span></div>`).join('') : '<div class="empty">Aucun résultat.</div>';
  };
  const open = i => { const r = res[i]; if (!r) return; App.closeModal(); App.edit(r.coll, r.o); };
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, res.length - 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    if (e.key === 'Enter') open(sel);
  });
  out.addEventListener('click', e => { const r = e.target.closest('[data-i]'); if (r) open(+r.dataset.i); });
};
