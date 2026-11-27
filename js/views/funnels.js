/* Tunnels de vente : parcours, performances, marketing */
'use strict';
App.state.fu = { tab: 'funnels', selected: null, showArchived: false };
App.state.fuPeriod = { type: 'month', anchor: D.today() };

const fuRange = () => App.range(App.state.fuPeriod);
const fuAgg = (f, r) => App.funnelAgg(r.start, r.end, x => x.funnelId === f.id);

/* Parcours client sous forme de flux d'étapes */
App.funnelFlow = (f, agg) => {
  const steps = f.steps || [];
  if (!steps.length) return '<div class="empty">Aucune étape. Ouvre le tunnel pour construire le parcours.</div>';
  return `<div class="flow">${steps.map((s, i) => {
    const t = App.stepType(s.type), v = agg ? agg.visitors[s.id] : null, prev = i && agg ? agg.visitors[steps[i - 1].id] : null;
    const rate = agg && i && prev ? (v || 0) / prev : null;
    return `${i ? `<div class="flow-arrow">${rate !== null ? `<span>${App.pctFmt(rate)}</span>` : ''}${ic('right')}</div>` : ''}
      <div class="flow-step" style="--c:${t.color}"><div class="small" style="color:${t.color}">${esc(t.label)}</div><b>${esc(s.name || t.label)}</b>
      ${agg ? `<div class="flow-n">${App.num(v || 0)} <span class="small muted">visiteurs</span></div>` : ''}
      ${s.url ? `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener" class="small" onclick="event.stopPropagation()">${ic('link')} ouvrir</a>` : '<span class="small muted">pas de lien</span>'}</div>`;
  }).join('')}</div>`;
};
/* Résumé dans la fiche d'un tunnel (30 derniers jours) */
App.funnelMini = f => {
  const td = D.today(), a = App.funnelAgg(D.add(td, -29), td, x => x.funnelId === f.id);
  return `<div class="field"><label>30 derniers jours</label>
    <div class="mini-kpis"><div><b>${App.num(a.first)}</b><span>visiteurs</span></div><div><b>${App.num(a.purchases)}</b><span>ventes</span></div><div><b>${eur(a.revenue)}</b><span>CA</span></div><div><b>${App.pctFmt(a.conversion)}</b><span>conversion</span></div></div>
    ${a.entries.length ? '' : '<div class="small muted">Aucune statistique sur cette période.</div>'}</div>`;
};

App.views.funnels = {
  render() {
    const st = App.state.fu, tab = st.tab;
    const tabs = [['funnels', 'Mes tunnels'], ['perf', 'Performances'], ['marketing', 'Marketing']];
    const btn = tab === 'marketing' ? `<button class="btn primary" data-act="newCampaign">${ic('plus')} Campagne</button>` : tab === 'perf' ? `<button class="btn primary" data-act="newStats">${ic('plus')} Saisir des statistiques</button>` : `<button class="btn primary" data-act="newFunnel">${ic('plus')} Tunnel</button>`;
    return `<div class="page-head"><div><h1>Tunnels de vente</h1><div class="sub">Parcours client, performances et marketing de chaque offre.</div></div><div class="toolbar">${btn}</div></div>
      <div class="toolbar" style="justify-content:space-between;margin-bottom:18px">
        <div class="seg">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="fuTab" data-v="${k}">${l}</button>`).join('')}</div>
        ${tab !== 'funnels' ? App.periodBar('fuPeriod') : `<button class="chip ${st.showArchived ? 'on' : ''}" data-act="fuArch">Afficher les archivés</button>`}
      </div>
      ${tab === 'funnels' ? funnelsTab() : tab === 'perf' ? perfTab() : marketingTab()}`;
  },
};

function funnelsTab() {
  const r = fuRange(), td = D.today(), r30 = { start: D.add(td, -29), end: td };
  const list = App.list('funnels', f => App.state.fu.showArchived || !App.status('funnel', f).done);
  if (!list.length) return `<div class="empty-big"><h2>Aucun tunnel pour l’instant</h2><p>Crée ton premier tunnel : page de vente, paiement, upsell, remerciement… et suis ce qu’il rapporte.</p><button class="btn primary" data-act="newFunnel">${ic('plus')} Créer un tunnel</button></div>`;
  const order = App.statusList('funnel').map(s => s.id);
  list.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.name.localeCompare(b.name));
  return `<div class="flex-col" style="display:flex;flex-direction:column;gap:14px">${list.map(f => {
    const a = fuAgg(f, r30);
    return `<div class="card fcard" data-act="edit" data-coll="funnels" data-id="${f.id}" style="cursor:pointer">
      <div class="card-head" style="flex-wrap:wrap"><div style="display:flex;gap:10px;align-items:center;min-width:0">${App.cdot(f.companyId)}<h3 style="font-size:17px">${esc(f.name)}</h3>${App.tag(App.status('funnel', f))}</div>
        <span class="small muted">${f.offer ? esc(f.offer) : ''}${f.price ? ' · ' + eur(+f.price) : ''}</span></div>
      ${App.funnelFlow(f, a.entries.length ? a : null)}
      <div class="mini-kpis" style="margin-top:12px"><div><b>${App.num(a.first)}</b><span>visiteurs (30 j)</span></div><div><b>${App.num(a.purchases)}</b><span>ventes</span></div><div><b>${eur(a.revenue)}</b><span>CA</span></div><div><b>${App.pctFmt(a.conversion)}</b><span>conversion</span></div>
        <div style="margin-left:auto;align-self:center"><button class="btn sm" data-act="newStats" data-f="${f.id}">${ic('plus')} Statistiques</button></div></div>
    </div>`;
  }).join('')}</div>`;
}

function perfTab() {
  const r = fuRange(), list = App.list('funnels');
  if (!list.length) return funnelsTab();
  const st = App.state.fu; if (!st.selected || !list.find(f => f.id === st.selected)) st.selected = (list.find(f => App.status('funnel', f).id === 'actif') || list[0]).id;
  const f = App.get('funnels', st.selected), a = fuAgg(f, r);
  const steps = f.steps || [], max = Math.max(1, ...steps.map(s => a.visitors[s.id] || 0));
  const rows = list.map(x => ({ f: x, a: fuAgg(x, r) })).sort((p, q) => q.a.revenue - p.a.revenue);
  const salesRow = (label, n, base, hint) => `<div class="perf-row"><span>${label}</span><div class="perf-bar"><i style="width:${max ? Math.min(100, (n || 0) / max * 100) : 0}%;background:var(--accent)"></i></div><b>${App.num(n)}</b><span class="small muted">${base ? App.pctFmt((n || 0) / base) + (hint ? ' ' + hint : '') : ''}</span></div>`;
  return `<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px" id="perf-grid">
    <div class="card">
      <div class="card-head"><select class="input" style="width:auto;font-family:var(--serif);font-size:16px" data-change="fuSelect">${list.map(x => `<option value="${x.id}" ${x.id === f.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>${App.tag(App.status('funnel', f))}</div>
      <div class="section-title">Visiteurs par étape</div>
      ${steps.map((s, i) => { const v = a.visitors[s.id] || 0, prev = i ? a.visitors[steps[i - 1].id] || 0 : 0, t = App.stepType(s.type);
        return `<div class="perf-row"><span><span class="dot" style="--c:${t.color}"></span> ${esc(s.name || t.label)}</span><div class="perf-bar"><i style="width:${v / max * 100}%;background:${t.color}"></i></div><b>${App.num(v)}</b><span class="small muted">${i ? App.pctFmt(prev ? v / prev : null) : ''}</span></div>`; }).join('')}
      <div class="section-title">Achat</div>
      ${salesRow('Clics', a.clicks, a.first)}
      ${salesRow('Ajouts au panier', a.carts, a.clicks || a.first)}
      ${salesRow('Paiements commencés', a.checkouts, a.carts || a.clicks || a.first)}
      ${salesRow('Paiements finalisés', a.purchases, a.checkouts)}
      <div class="mini-kpis" style="margin-top:14px">
        <div><b>${eur(a.revenue)}</b><span>CA généré</span></div><div><b>${App.pctFmt(a.conversion)}</b><span>conversion globale</span></div>
        <div><b class="${a.abandonRate > .5 ? 'down' : ''}">${App.num(a.abandons)}</b><span>abandons (${App.pctFmt(a.abandonRate)})</span></div><div><b>${a.basket !== null ? eur(a.basket) : '—'}</b><span>panier moyen</span></div></div>
    </div>
    <div class="card"><div class="card-head"><h3>Relevés de la période</h3></div>
      ${a.entries.length ? `<div class="rows">${a.entries.sort((x, y) => y.date.localeCompare(x.date)).map(x => { const src = App.catList('source', x.companyId).find(s => s.id === x.source);
        return `<div class="row"><div class="grow"><div class="title" data-act="edit" data-coll="funnelStats" data-id="${x.id}">${esc(x.label || D.fmt(x.date, { day: 'numeric', month: 'long' }) + (x.end ? ' → ' + D.fmt(x.end, { day: 'numeric', month: 'long' }) : ''))}</div><div class="meta">${src ? App.tag(src) : ''}${x.auto ? '<span class="tag outline">auto</span>' : ''}<span>${App.num(x.purchases)} ventes · ${eur(+x.revenue || 0)}</span></div></div></div>`; }).join('')}</div>`
        : `<div class="empty">Aucune statistique sur cette période.<br><button class="btn sm" style="margin-top:10px" data-act="newStats" data-f="${f.id}">${ic('plus')} Saisir des statistiques</button></div>`}
    </div></div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h3>Comparaison des tunnels</h3><span class="small muted">${esc(r.label)}</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tunnel</th><th class="num">Visiteurs</th><th class="num">Clics</th><th class="num">Paniers</th><th class="num">Paiements commencés</th><th class="num">Ventes</th><th class="num">Abandons</th><th class="num">Conversion</th><th class="num">CA</th><th class="num">CA / visiteur</th></tr></thead><tbody>
      ${rows.map(({ f: x, a: y }) => `<tr class="click" data-act="fuPick" data-id="${x.id}"><td>${App.cdot(x.companyId)} ${esc(x.name)}</td><td class="num">${App.num(y.first)}</td><td class="num">${App.num(y.clicks)}</td><td class="num">${App.num(y.carts)}</td><td class="num">${App.num(y.checkouts)}</td><td class="num">${App.num(y.purchases)}</td><td class="num">${App.pctFmt(y.abandonRate)}</td><td class="num">${App.pctFmt(y.conversion)}</td><td class="num"><b>${eur(y.revenue)}</b></td><td class="num">${y.perVisitor !== null ? eur(y.perVisitor, 2) : '—'}</td></tr>`).join('')}
      </tbody></table></div></div>`;
}

function marketingTab() {
  const r = fuRange();
  const camps = App.list('campaigns', c => (!c.start || c.start <= r.end) && (!c.end || c.end >= r.start)).sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  const all = App.funnelAgg(r.start, r.end);
  const bySrc = {}; all.entries.forEach(x => { const k = x.source || ''; const s = bySrc[k] = bySrc[k] || { first: 0, purchases: 0, revenue: 0, cid: x.companyId }; const fu = App.get('funnels', x.funnelId); const fid = fu && fu.steps[0] && fu.steps[0].id; s.first += +(x.visitors || {})[fid] || 0; s.purchases += +x.purchases || 0; s.revenue += +x.revenue || 0; });
  const offers = {}; App.list('funnels').forEach(f => { const k = (f.offer || f.name).trim(); const a = fuAgg(f, r); const o = offers[k] = offers[k] || { first: 0, purchases: 0, revenue: 0, funnels: 0 }; o.first += a.first; o.purchases += a.purchases; o.revenue += a.revenue; o.funnels++; });
  const promos = Object.entries(all.promos).sort((a, b) => b[1].revenue - a[1].revenue);
  const srcLabel = (k, cid) => { const s = App.catList('source').find(x => x.id === k); return s ? App.tag(s) : '<span class="muted">Non précisée</span>'; };
  return `<div class="card"><div class="card-head"><h3>Campagnes & collaborations</h3><span class="small muted">${esc(r.label)}</span></div>
      ${camps.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Campagne</th><th>Type</th><th>Source</th><th>Tunnel</th><th>Dates</th><th class="num">Coût</th><th class="num">Ventes</th><th class="num">CA attribué</th><th class="num">ROAS</th><th class="num">Coût / vente</th></tr></thead><tbody>
      ${camps.map(c => { const a = App.campaignAgg(c), fu = App.get('funnels', c.funnelId), cat = App.catList('campaign', c.companyId).find(x => x.id === c.category);
        return `<tr class="click" data-act="edit" data-coll="campaigns" data-id="${c.id}"><td>${App.cdot(c.companyId)} ${esc(c.name)}${c.promoCode ? ` <span class="tag outline">${esc(c.promoCode)}</span>` : ''}</td><td>${cat ? App.tag(cat) : ''}</td><td>${srcLabel(c.source)}</td><td>${fu ? esc(fu.name) : '—'}</td><td class="small">${c.start ? esc(D.fmt(c.start)) : ''}${c.end ? ' → ' + esc(D.fmt(c.end)) : ''}</td><td class="num">${eur(a.cost)}</td><td class="num">${App.num(a.purchases || a.promoUses)}</td><td class="num"><b>${eur(a.revenueAttr)}</b></td><td class="num ${a.roas !== null && a.roas < 1 ? 'down' : a.roas >= 2 ? 'up' : ''}">${a.roas !== null ? (Math.round(a.roas * 10) / 10).toString().replace('.', ',') + ' ×' : '—'}</td><td class="num">${a.cpa !== null ? eur(a.cpa) : '—'}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty">Aucune campagne sur la période. Une campagne relie une pub ou une collaboration à un tunnel, avec son coût, son code promo et un lien de suivi.</div>`}</div>
    <div class="grid g2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h3>Sources de trafic</h3></div>
        ${Object.keys(bySrc).length ? `<table class="tbl"><thead><tr><th>Source</th><th class="num">Visiteurs</th><th class="num">Ventes</th><th class="num">Conversion</th><th class="num">CA</th></tr></thead><tbody>
        ${Object.entries(bySrc).sort((a, b) => b[1].revenue - a[1].revenue).map(([k, s]) => `<tr><td>${srcLabel(k)}</td><td class="num">${App.num(s.first)}</td><td class="num">${App.num(s.purchases)}</td><td class="num">${App.pctFmt(s.first ? s.purchases / s.first : null)}</td><td class="num"><b>${eur(s.revenue)}</b></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Indique la source dans tes relevés de statistiques pour voir d’où viennent tes ventes.</div>'}</div>
      <div class="card"><div class="card-head"><h3>Codes promo</h3></div>
        ${promos.length ? `<table class="tbl"><thead><tr><th>Code</th><th class="num">Utilisations</th><th class="num">CA</th></tr></thead><tbody>${promos.map(([k, p]) => `<tr><td><span class="tag outline">${esc(k)}</span></td><td class="num">${App.num(p.uses)}</td><td class="num"><b>${eur(p.revenue)}</b></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Aucun code promo enregistré sur la période.</div>'}</div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h3>Comparaison des offres</h3></div>
      ${Object.keys(offers).length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Offre</th><th class="num">Tunnels</th><th class="num">Visiteurs</th><th class="num">Ventes</th><th class="num">Conversion</th><th class="num">Panier moyen</th><th class="num">CA</th></tr></thead><tbody>
      ${Object.entries(offers).sort((a, b) => b[1].revenue - a[1].revenue).map(([k, o]) => `<tr><td>${esc(k)}</td><td class="num">${o.funnels}</td><td class="num">${App.num(o.first)}</td><td class="num">${App.num(o.purchases)}</td><td class="num">${App.pctFmt(o.first ? o.purchases / o.first : null)}</td><td class="num">${o.purchases ? eur(o.revenue / o.purchases) : '—'}</td><td class="num"><b>${eur(o.revenue)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">—</div>'}</div>`;
}

/* Lien de suivi (UTM) : identifie automatiquement la source de chaque visite */
const utmSlug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
App.trackingLink = c => {
  const fu = App.get('funnels', c.funnelId), first = fu && (fu.steps || []).find(s => s.url);
  if (!first) return '';
  const src = App.catList('source', c.companyId).find(s => s.id === c.source), cat = App.catList('campaign', c.companyId).find(s => s.id === c.category);
  const u = new URL(safeUrl(first.url));
  u.searchParams.set('utm_source', utmSlug(src ? src.label : 'autre'));
  u.searchParams.set('utm_medium', utmSlug(cat ? cat.label : 'campagne'));
  u.searchParams.set('utm_campaign', utmSlug(c.name || 'campagne'));
  return u.toString();
};
App.trackingLinkBlock = d => {
  let link = ''; try { link = App.trackingLink(d); } catch (e) { link = ''; }
  return `<div class="field"><label>Lien de suivi à utiliser dans la pub / la collaboration</label>
    ${link ? `<div style="display:flex;gap:6px"><input class="input" readonly value="${esc(link)}" onclick="this.select()"><button type="button" class="btn sm" data-ed="copyLink" data-v="${esc(link)}">Copier</button></div>
      <div class="small muted">Ce lien indique à tes outils d’analyse d’où vient chaque visiteur (paramètres UTM).</div>` : '<div class="small muted">Associe un tunnel dont la première page a un lien pour générer le lien de suivi.</div>'}</div>`;
};

/* Évite la double saisie : le CA d'un tunnel et le coût d'une campagne alimentent Finances */
const syncTx = (o, coll, type, amount, label, date, category) => {
  let tx = o.txId && App.get('transactions', o.txId);
  if (o.toFinance && +amount > 0 && date) {
    if (!tx) tx = { recur: 'none', files: [] };
    Object.assign(tx, { type, amount: +amount, label, date, companyId: o.companyId, category, linked: { coll, id: o.id }, notes: 'Créé automatiquement depuis ' + (coll === 'campaigns' ? 'la campagne' : 'le tunnel') + ' — modifie-le depuis sa fiche d’origine.' });
    delete tx.deletedAt;
    App.put('transactions', tx, { silent: true });
    if (o.txId !== tx.id) { o.txId = tx.id; App.put(coll, o, { silent: true }); }
  } else if (tx) { tx.deletedAt = Date.now(); App.put('transactions', tx, { silent: true }); }
  App.render();
};
App.afterSave = App.afterSave || {};
App.afterSave.funnelStats = o => { const f = App.get('funnels', o.funnelId); syncTx(o, 'funnelStats', 'revenue', o.revenue, 'Tunnel · ' + (f ? f.name : '') + (o.label ? ' · ' + o.label : ''), o.date, 'ventes'); };
App.afterSave.campaigns = o => syncTx(o, 'campaigns', 'expense', o.cost, 'Campagne · ' + o.name, o.start || D.today(), 'publicite');

/* ---------- Actions ---------- */
App.act.fuTab = el => { App.state.fu.tab = el.dataset.v; App.render(); };
App.act.fuArch = () => { App.state.fu.showArchived = !App.state.fu.showArchived; App.render(); };
App.act.fuSelect = el => { App.state.fu.selected = el.value; App.render(); };
App.act.fuPick = el => { App.state.fu.selected = el.dataset.id; App.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
App.act.newFunnel = () => App.quickCreate('funnel');
App.act.newCampaign = () => App.quickCreate('campaign');
App.act.newStats = el => {
  const fid = (el && el.dataset.f) || App.state.fu.selected || (App.list('funnels')[0] || {}).id;
  if (!fid) { App.toast('Crée d’abord un tunnel'); return; }
  App.newStatsFor(App.get('funnels', fid));
};
App.newStatsFor = f => App.edit('funnelStats', { funnelId: f.id, companyId: f.companyId, date: D.today(), visitors: {}, promos: [], toFinance: true }, { isNew: true });
App.edActions.addStats = d => { const f = App.saveEditor({ keepOpen: true }); if (f) App.newStatsFor(f); };
App.edActions.addCampaign = d => { const f = App.saveEditor({ keepOpen: true }); if (f) App.quickCreate('campaign', { companyId: f.companyId, funnelId: f.id }); };
App.edActions.copyLink = (d, b) => { (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.v) : Promise.reject()).then(() => App.toast('Lien copié')).catch(() => App.toast('Sélectionne le lien pour le copier')); };
