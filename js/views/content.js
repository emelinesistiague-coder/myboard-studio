/* Réseaux sociaux : filtres (gauche), calendrier éditorial (centre), grille Instagram (droite) */
'use strict';
App.state.cf = { networks: [], statuses: [], categories: [], mode: 'cal' };
App.state.contentDate = null;

const cMatch = p => {
  const f = App.state.cf;
  return (!f.networks.length || f.networks.includes(p.network)) && (!f.statuses.length || f.statuses.includes(p.status)) && (!f.categories.length || f.categories.includes(p.category));
};

App.views.content = {
  render() {
    const f = App.state.cf, a = App.state.contentDate || D.today(), all = App.list('posts');
    const posts = all.filter(cMatch);
    const fopt = (k, x, n) => `<button class="fopt ${f[k].includes(x.id) ? 'on' : ''}" data-act="cfToggle" data-k="${k}" data-v="${x.id}"><span class="dot" style="--c:${x.color}"></span>${esc(x.label)}<span class="n">${n}</span></button>`;
    const count = (k, id) => all.filter(p => p[k] === id).length;
    const comps = App.scope() === 'all' ? App.companies() : [];
    const filters = `<div class="filters">
      ${comps.length > 1 ? `<div class="section-title">Entreprises</div>${comps.map(c => `<button class="fopt" data-act="cfCompany" data-id="${c.id}">${App.avatar(c)}<span>${esc(c.name)}</span><span class="n">${App.list('posts', p => p.companyId === c.id).length}</span></button>`).join('')}` : ''}
      <div class="section-title">Réseaux</div>${App.networkList().map(n => fopt('networks', n, count('network', n.id))).join('')}
      <div class="section-title">Statuts</div>${App.statusList('post').map(s => fopt('statuses', s, count('status', s.id))).join('')}
      <div class="section-title">Catégories</div>${App.catList('post').map(c => fopt('categories', c, count('category', c.id))).join('') || '<div class="small muted">—</div>'}
      ${f.networks.length + f.statuses.length + f.categories.length ? `<button class="btn sm ghost" data-act="cfReset" style="margin-top:8px">Effacer les filtres</button>` : ''}
    </div>`;
    const center = f.mode === 'cal' ? editorialCal(a, posts) : pipeline(posts);
    return `
      <div class="page-head"><div><h1>Réseaux sociaux</h1><div class="sub">Calendrier éditorial et aperçu de ton feed.</div></div>
        <div class="toolbar"><div class="seg"><button class="${f.mode === 'cal' ? 'on' : ''}" data-act="cfMode" data-v="cal">Calendrier</button><button class="${f.mode === 'list' ? 'on' : ''}" data-act="cfMode" data-v="list">Par statut</button></div>
        <button class="btn primary" data-act="newPost">${ic('plus')} Publication</button></div></div>
      <div class="studio">${filters}<div style="min-width:0">${center}</div>${igGrid()}</div>`;
  },
};

function editorialCal(a, posts) {
  const ms = D.monthStart(a), start = D.weekStart(ms), td = D.today(), m = ms.slice(5, 7);
  const weeks = D.diff(start, D.monthEnd(ms)) >= 35 ? 6 : 5;
  let cells = D.DOW.map(x => `<div class="dow">${x}</div>`).join('');
  for (let i = 0; i < weeks * 7; i++) {
    const d = D.add(start, i), list = posts.filter(p => p.date === d).sort((x, y) => (x.time || '').localeCompare(y.time || ''));
    cells += `<div class="day ${d.slice(5, 7) !== m ? 'out' : ''} ${d === td ? 'today' : ''}" data-drop="day|${d}">
      <div class="num"><b>${D.parse(d).getDate()}</b><button class="iconbtn add" data-act="newPost" data-d="${d}">${ic('plus')}</button></div>
      ${list.map(p => { const st = App.status('post', p), nw = App.network(p); return `<div class="cal-item" style="--c:${st.color}" draggable="true" data-drag="posts|${p.id}" data-act="edit" data-coll="posts" data-id="${p.id}" title="${esc((nw ? nw.label + ' · ' : '') + st.label)}">${nw ? `<span class="dot" style="--c:${nw.color};margin-right:4px"></span>` : ''}${App.scope() === 'all' ? App.cdot(p.companyId) + ' ' : ''}${esc(p.title || 'Sans titre')}</div>`; }).join('')}
    </div>`;
  }
  return `<div class="toolbar" style="margin-bottom:12px"><button class="btn icon ghost" data-act="cNav" data-dir="-1">${ic('left')}</button><button class="btn sm" data-act="cNav" data-dir="0">Ce mois</button><button class="btn icon ghost" data-act="cNav" data-dir="1">${ic('right')}</button><b style="font-family:var(--serif);font-size:18px;font-weight:500">${esc(App.cap(D.month(ms)))}</b>
    <span class="small muted" style="margin-left:auto">${plural(posts.filter(p => p.date >= ms && p.date <= D.monthEnd(ms)).length, 'publication')} ce mois</span></div>
    <div class="cal">${cells}</div>
    ${unscheduled(posts)}`;
}
function unscheduled(posts) {
  const list = posts.filter(p => !p.date);
  return list.length ? `<div class="card" style="margin-top:14px"><div class="card-head"><h3>Sans date</h3></div><div class="rows">${list.map(p => `<div class="row" draggable="true" data-drag="posts|${p.id}"><div class="grow"><div class="title" data-act="edit" data-coll="posts" data-id="${p.id}">${esc(p.title)}</div></div>${App.tag(App.status('post', p))}</div>`).join('')}</div></div>` : '';
}
function pipeline(posts) {
  const sts = App.statusList('post').filter(s => !App.state.cf.statuses.length || App.state.cf.statuses.includes(s.id));
  return `<div class="pipeline">${sts.map(s => {
    const list = posts.filter(p => p.status === s.id).sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
    return `<div class="board-col" data-drop="poststatus|${s.id}"><div class="head">${App.tag(s)}<span class="small muted">${list.length}</span></div>
      ${list.map(p => { const nw = App.network(p); return `<div class="icard" draggable="true" data-drag="posts|${p.id}" data-act="edit" data-coll="posts" data-id="${p.id}" style="padding:12px;gap:4px">
        ${p.cover ? `<img data-file="${p.cover}" alt="" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px">` : ''}
        <b style="font-weight:500">${App.cdot(p.companyId)} ${esc(p.title || 'Sans titre')}</b><div class="small muted">${p.date ? esc(D.fmt(p.date, { weekday: 'short', day: 'numeric', month: 'short' })) : 'Sans date'}${nw ? ' · ' + esc(nw.label) : ''}</div></div>`; }).join('')}
    </div>`;
  }).join('')}</div>`;
}
/* Aperçu de la grille Instagram : du plus récent (en haut) au plus ancien */
function igGrid() {
  const ig = App.networkList().find(n => norm(n.label).includes('instagram'));
  const scopeC = App.scope() !== 'all' ? App.company(App.scope()) : null;
  const posts = ig ? App.list('posts', p => p.network === ig.id && p.date).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))) : [];
  const td = D.today();
  return `<div class="ig card" style="padding:16px">
    <div class="ig-head">${scopeC ? App.avatar(scopeC, 'lg') : `<span class="avatar lg" style="--c:var(--ink)">${ic('grid')}</span>`}<div><b>${esc(scopeC ? scopeC.name : 'Toutes les entreprises')}</b><div class="small muted">Aperçu du feed Instagram · ${posts.filter(p => p.date > td).length} à venir</div>${igFollowers()}</div></div>
    ${posts.length ? `<div class="ig-grid">${posts.slice(0, 30).map(p => {
      const future = p.date > td || !App.status('post', p).published;
      return `<div class="ig-cell ${future ? 'future' : ''}" draggable="true" data-drag="posts|${p.id}" data-drop="igswap|${p.id}" data-act="edit" data-coll="posts" data-id="${p.id}" title="${esc(p.title)} · ${esc(D.fmt(p.date))}">
        ${future ? `<span class="badge">${esc(D.fmt(p.date))}</span>` : ''}${p.cover ? `<img data-file="${p.cover}" alt="">` : p.coverUrl ? `<img src="${esc(safeUrl(p.coverUrl))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span>${esc(p.title || '')}</span>`}</div>`;
    }).join('')}</div>
    <div class="small muted" style="margin-top:10px">Glisse une vignette sur une autre pour échanger leurs dates de publication. Contour = pas encore publiée.</div>`
      : `<div class="empty">Les publications Instagram datées apparaîtront ici avec leur couverture.</div>`}
  </div>`;
}
/* Abonnés Instagram (collecteur) des comptes de l'entreprise affichée */
function igFollowers() {
  const accs = ((App.collector && App.collector.cache && App.collector.cache.ig) || []).filter(a => App.inScope(App.collector.companyFor('ig', a.id)));
  if (!accs.length) return '';
  const n = accs.reduce((s, a) => s + (+a.followers || 0), 0);
  return `<div class="small"><b style="font-weight:500">${App.num(n)}</b> abonnés${accs.length === 1 ? ' · @' + esc(accs[0].username) : ''}</div>`;
}
App.swapPostDates = (a, b) => {
  if (!a || !b || a.id === b.id) return;
  [a.date, b.date] = [b.date, a.date]; [a.time, b.time] = [b.time, a.time];
  App.put('posts', a, { silent: true }); App.put('posts', b);
  App.toast('Dates échangées');
};

App.act.cfToggle = el => { const arr = App.state.cf[el.dataset.k], v = el.dataset.v, i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); App.render(); };
App.act.cfReset = () => { Object.assign(App.state.cf, { networks: [], statuses: [], categories: [] }); App.render(); };
App.act.cfMode = el => { App.state.cf.mode = el.dataset.v; App.render(); };
App.act.cfCompany = el => App.setCompany(el.dataset.id);
App.act.cNav = el => { const d = +el.dataset.dir, a = App.state.contentDate || D.today(); App.state.contentDate = d ? D.addMonths(D.monthStart(a), d) : D.today(); App.render(); };
App.act.newPost = el => {
  const extra = { date: el.dataset.d || D.today() };
  if (App.state.cf.networks.length === 1) extra.network = App.state.cf.networks[0];
  App.quickCreate('post', extra);
};
