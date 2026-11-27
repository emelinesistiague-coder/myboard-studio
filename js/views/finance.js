/* Finances : revenus, dépenses, cotisations & taxes, dons, résultat */
'use strict';
App.state.finTab = 'summary';
App.state.finCompare = 'prev';

/* Graphique en barres minimaliste (SVG, sans bibliothèque) */
App.barChart = (rows, { a = 'revenue', b = 'expense', la = 'Chiffre d’affaires', lb = 'Dépenses' } = {}) => {
  const W = 640, H = 190, pad = 26, n = rows.length || 1, max = Math.max(1, ...rows.map(r => Math.max(r[a], r[b] || 0)));
  const gw = (W - pad) / n, bw = Math.min(22, gw / 3);
  const nice = v => v >= 1000 ? Math.round(v / 100) / 10 + ' k' : Math.round(v);
  const lines = [0, .5, 1].map(f => `<line class="gridl" x1="${pad}" x2="${W}" y1="${H - 20 - f * (H - 40)}" y2="${H - 20 - f * (H - 40)}"/><text class="axis" x="0" y="${H - 17 - f * (H - 40)}">${nice(max * f)}</text>`).join('');
  const bars = rows.map((r, i) => {
    const x = pad + i * gw + gw / 2, ha = (r[a] / max) * (H - 40), hb = ((r[b] || 0) / max) * (H - 40);
    return `<g><title>${esc(App.cap(D.month(r.month)))} — ${la} : ${eur(r[a])}${b ? ` · ${lb} : ${eur(r[b])}` : ''}</title>
      <rect class="bar" x="${x - bw - 1}" y="${H - 20 - ha}" width="${bw}" height="${Math.max(ha, .5)}" rx="3"/>
      ${b ? `<rect class="bar2" x="${x + 1}" y="${H - 20 - hb}" width="${bw}" height="${Math.max(hb, .5)}" rx="3"/>` : ''}
      <text class="axis" x="${x}" y="${H - 4}" text-anchor="middle">${esc(D.fmt(r.month, { month: 'short' }).replace('.', ''))}</text></g>`;
  }).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${lines}${bars}</svg></div>
    <div class="legend"><span><i style="background:var(--accent)"></i>${la}</span>${b ? `<span><i style="background:var(--line-2)"></i>${lb}</span>` : ''}</div>`;
};
const chartRows = (r) => {
  let s = r.start; if (D.diff(r.start, r.end) < 58) s = D.addMonths(D.monthStart(r.end), -5);
  return App.monthly(D.monthStart(s), r.end, App.scope() === 'all' ? null : App.scope());
};
const delta = (cur, prev, invert) => {
  if (!prev) return cur ? '<span class="muted">nouveau</span>' : '<span class="muted">—</span>';
  const p = (cur - prev) / Math.abs(prev) * 100, good = invert ? p <= 0 : p >= 0;
  return `<span class="${good ? 'up' : 'down'}">${pct(p)}</span>`;
};
App.delta = delta;

App.views.finance = {
  render() {
    const tab = App.state.finTab, r = App.range(App.state.finPeriod);
    const tabs = [['summary', 'Synthèse'], ['revenue', 'Revenus'], ['expense', 'Dépenses'], ['tax', 'Cotisations & taxes'], ['donation', 'Dons']];
    return `
      <div class="page-head"><div><h1>Finances</h1><div class="sub">${esc(App.scope() === 'all' ? 'Toutes les entreprises' : App.companyName(App.scope()))} · ${esc(r.label)}</div></div>
        <div class="toolbar"><button class="btn" data-act="finCSV">${ic('dl')} Export CSV</button><button class="btn primary" data-act="finAdd">${ic('plus')} ${tab === 'summary' ? 'Revenu' : App.TX_TYPES[tab].label}</button></div></div>
      <div class="toolbar" style="justify-content:space-between;margin-bottom:18px">
        <div class="seg">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="finTab" data-v="${k}">${l}</button>`).join('')}</div>
        ${App.periodBar('finPeriod')}
      </div>
      ${tab === 'summary' ? summary(r) : txList(tab, r)}`;
  },
};

function summary(r) {
  const cid = App.scope() === 'all' ? null : App.scope();
  const cur = App.finSummary(r.start, r.end, cid), pr = App.prevRange(App.state.finPeriod, App.state.finCompare), prev = App.finSummary(pr.start, pr.end, cid);
  const kpi = (label, v, pv, invert, color) => `<div class="card kpi"><div class="label">${color ? `<span class="dot" style="--c:${color}"></span> ` : ''}${label}</div><div class="value">${eur(v)}</div><div class="delta">${delta(v, pv, invert)} <span class="muted">vs ${App.state.finCompare === 'year' ? 'N-1' : 'période préc.'}</span></div></div>`;
  const T = App.TX_TYPES, ca = cur.revenue || 1;
  const parts = [[cur.expense, T.expense.color], [cur.tax, T.tax.color], [cur.donation, T.donation.color], [Math.max(0, cur.result), 'var(--accent)']];
  const comps = App.scope() === 'all' ? App.companies() : [];
  return `
    <div class="grid g5 kpis">
      ${kpi('Chiffre d’affaires', cur.revenue, prev.revenue, false, T.revenue.color)}
      ${kpi('Dépenses', cur.expense, prev.expense, true, T.expense.color)}
      ${kpi('Cotisations & taxes', cur.tax, prev.tax, true, T.tax.color)}
      ${kpi('Dons', cur.donation, prev.donation, false, T.donation.color)}
      ${kpi('Résultat', cur.result, prev.result, false)}
    </div>
    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <div class="card-head"><h3>Du chiffre d’affaires au résultat</h3></div>
        ${cur.revenue ? `<div class="split-bar">${parts.map(([v, c]) => `<i style="width:${Math.max(0, v) / ca * 100}%;background:${c}"></i>`).join('')}</div>` : ''}
        <div class="fin-lines">
          <div class="l"><span>Chiffre d’affaires${cur.tva ? ' HT' : ''}</span><span>${eur(cur.revenue)}</span></div>
          <div class="l"><span><span class="dot" style="--c:${T.expense.color}"></span>− Dépenses</span><span>${eur(cur.expense)}</span></div>
          <div class="l"><span><span class="dot" style="--c:${T.tax.color}"></span>− Cotisations & taxes payées</span><span>${eur(cur.tax)}</span></div>
          <div class="l"><span><span class="dot" style="--c:${T.donation.color}"></span>− Dons versés</span><span>${eur(cur.donation)}</span></div>
          <div class="l total"><span>= Résultat</span><span>${eur(cur.result)}</span></div>
          ${cur.provision > 0 ? `<div class="l"><span class="muted">Cotisations & impôts estimés restant à payer</span><span class="muted">− ${eur(cur.provision)}</span></div><div class="l total" style="font-size:14px"><span>Résultat après provisions</span><span>${eur(cur.afterProvision)}</span></div>` : ''}
        </div>
        <div class="note-box" style="margin-top:12px">Le <b>chiffre d’affaires</b> est ce que tu as encaissé, le <b>résultat</b> est ce qu’il reste après charges, taxes et dons. Ce n’est pas ta <b>trésorerie</b> : elle dépend aussi des paiements pas encore reçus ou réglés.${cur.tva ? ` TVA collectée estimée sur la période : <b>${eur(cur.tva)}</b> (à reverser, non incluse dans le CA).` : ''}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Évolution mensuelle</h3>
          <div class="seg"><button class="${App.state.finCompare === 'prev' ? 'on' : ''}" data-act="finCompare" data-v="prev">vs période préc.</button><button class="${App.state.finCompare === 'year' ? 'on' : ''}" data-act="finCompare" data-v="year">vs N-1</button></div></div>
        ${App.barChart(chartRows(r))}
        ${cur.donDue > 0 || cur.donation > 0 ? `<div class="section-title">${ic('gift')} Dons</div>
          <div class="fin-lines"><div class="l"><span>Objectif de dons sur la période</span><span>${eur(cur.donDue)}</span></div><div class="l"><span>Déjà donné</span><span>${eur(cur.donation)}</span></div>
          <div class="l total" style="font-size:14px"><span>${cur.donLeft > 0 ? 'Reste à donner' : 'Objectif atteint'}</span><span>${cur.donLeft > 0 ? eur(cur.donLeft) : '✓'}</span></div></div>` : ''}
      </div>
    </div>
    ${comps.length > 1 ? `<div class="card" style="margin-top:16px"><div class="card-head"><h3>Par entreprise</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Entreprise</th><th class="num">CA</th><th class="num">Dépenses</th><th class="num">Cotis. & taxes</th><th class="num">Dons</th><th class="num">Résultat</th></tr></thead><tbody>
      ${comps.map(c => { const s = App.finSummary(r.start, r.end, c.id); return `<tr class="click" data-act="pickCompany" data-id="${c.id}"><td>${App.avatar(c)} <span style="vertical-align:middle;margin-left:6px">${esc(c.name)}</span></td><td class="num">${eur(s.revenue)}</td><td class="num">${eur(s.expense)}</td><td class="num">${eur(s.tax)}</td><td class="num">${eur(s.donation)}</td><td class="num"><b>${eur(s.result)}</b></td></tr>`; }).join('')}
    </tbody></table></div></div>` : ''}
    ${monthTable(r, cid)}`;
}
function monthTable(r, cid) {
  const rows = App.monthly(r.start, r.end, cid); if (rows.length < 2) return '';
  return `<div class="card" style="margin-top:16px"><div class="card-head"><h3>Détail par mois</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mois</th><th class="num">CA</th><th class="num">Dépenses</th><th class="num">Cotis. & taxes</th><th class="num">Dons</th><th class="num">Résultat</th></tr></thead><tbody>
    ${rows.map(m => `<tr><td>${esc(App.cap(D.month(m.month)))}</td><td class="num">${eur(m.revenue)}</td><td class="num">${eur(m.expense)}</td><td class="num">${eur(m.tax)}</td><td class="num">${eur(m.donation)}</td><td class="num"><b>${eur(m.result)}</b></td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function txList(type, r) {
  const cid = App.scope() === 'all' ? null : App.scope();
  const occ = App.txIn(r.start, r.end, cid).filter(o => o.tx.type === type), total = occ.reduce((s, o) => s + o.amount, 0);
  const pr = App.prevRange(App.state.finPeriod, App.state.finCompare);
  const prevTotal = App.txIn(pr.start, pr.end, cid).filter(o => o.tx.type === type).reduce((s, o) => s + o.amount, 0);
  const byCat = {}; occ.forEach(o => { const k = o.tx.category || ''; byCat[k] = (byCat[k] || 0) + o.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const recur = type !== 'revenue' || true ? App.list('transactions', t => t.type === type && t.recur && t.recur !== 'none' && (!t.until || t.until >= D.today()) && (!cid || t.companyId === cid)) : [];
  const monthlyCost = recur.reduce((s, t) => s + (+t.amount || 0) / (t.recur === 'yearly' ? 12 : 1), 0);
  const T = App.TX_TYPES[type];
  const fiscal = type === 'tax' ? taxHint(r, cid) : type === 'donation' ? donHint(r, cid) : '';
  return `
    <div class="grid g3">
      <div class="card kpi"><div class="label">${T.plural} sur la période</div><div class="value">${eur(total)}</div><div class="delta">${delta(total, prevTotal, type === 'expense' || type === 'tax')} <span class="muted">vs ${App.state.finCompare === 'year' ? 'N-1' : 'période préc.'}</span></div></div>
      <div class="card"><div class="label small muted" style="margin-bottom:8px">Par catégorie</div>
        ${cats.length ? cats.slice(0, 5).map(([k, v]) => { const c = App.catList(type).find(x => x.id === k); return `<div style="display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13px"><span style="flex:1">${c ? App.tag(c) : '<span class="muted">Sans catégorie</span>'}</span><span>${eur(v)}</span></div><div class="progress"><i style="width:${v / total * 100}%;background:${c ? c.color : 'var(--muted)'}"></i></div>`; }).join('') : '<div class="empty">—</div>'}
      </div>
      ${recur.length ? `<div class="card"><div class="label small muted" style="margin-bottom:8px">Récurrents actifs · ${eur(monthlyCost)} / mois</div>${recur.slice(0, 6).map(t => `<div style="display:flex;justify-content:space-between;font-size:13px;margin:4px 0;cursor:pointer" data-act="edit" data-coll="transactions" data-id="${t.id}"><span>${App.cdot(t.companyId)} ${esc(t.label)}</span><span class="muted">${eur(+t.amount)} / ${t.recur === 'yearly' ? 'an' : 'mois'}</span></div>`).join('')}</div>` : fiscal ? `<div class="card">${fiscal}</div>` : '<div></div>'}
    </div>
    ${recur.length && fiscal ? `<div class="card" style="margin-top:16px">${fiscal}</div>` : ''}
    <div class="card" style="margin-top:16px">
      ${occ.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>${type === 'revenue' ? 'Source' : 'Libellé'}</th><th>Catégorie</th>${App.scope() === 'all' ? '<th>Entreprise</th>' : ''}<th class="num">Montant</th></tr></thead><tbody>
        ${occ.map(o => { const c = App.catList(type, o.tx.companyId).find(x => x.id === o.tx.category); return `<tr class="click" data-act="edit" data-coll="transactions" data-id="${o.tx.id}"><td>${esc(D.fmt(o.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</td><td>${esc(o.tx.label)}${o.tx.recur && o.tx.recur !== 'none' ? ` <span class="small muted">${ic('later')}</span>` : ''}${(o.tx.files || []).length ? ` <span class="small muted">${ic('clip')}</span>` : ''}</td><td>${c ? App.tag(c) : ''}</td>${App.scope() === 'all' ? `<td>${App.cdot(o.tx.companyId)} ${esc(App.companyName(o.tx.companyId))}</td>` : ''}<td class="num">${eur(o.amount, 2)}</td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty">Aucun${type === 'expense' || type === 'tax' ? 'e' : ''} ${T.label.toLowerCase()} sur cette période.</div>`}
    </div>`;
}
function taxHint(r, cid) {
  const s = App.finSummary(r.start, r.end, cid);
  return `<div class="label small muted" style="margin-bottom:8px">Estimation selon tes paramètres fiscaux</div>
    <div class="fin-lines"><div class="l"><span>Cotisations & impôts estimés</span><span>${eur(s.taxEst)}</span></div><div class="l"><span>Déjà payés</span><span>${eur(s.tax)}</span></div>
    <div class="l total" style="font-size:14px"><span>Reste à prévoir</span><span>${eur(s.provision)}</span></div>${s.tva ? `<div class="l"><span>TVA collectée estimée</span><span>${eur(s.tva)}</span></div>` : ''}</div>
    ${!s.taxEst ? `<div class="small muted" style="margin-top:6px">Renseigne tes taux dans <a href="#/settings">Paramètres → Fiscalité</a> pour obtenir une estimation.</div>` : ''}`;
}
function donHint(r, cid) {
  const s = App.finSummary(r.start, r.end, cid);
  return `<div class="label small muted" style="margin-bottom:8px">Objectif de dons</div>
    <div class="fin-lines"><div class="l"><span>À donner sur la période</span><span>${eur(s.donDue)}</span></div><div class="l"><span>Déjà donné</span><span>${eur(s.donation)}</span></div>
    <div class="l total" style="font-size:14px"><span>Reste</span><span>${eur(s.donLeft)}</span></div></div>
    ${!s.donDue ? `<div class="small muted" style="margin-top:6px">Définis un pourcentage du CA ou un montant fixe dans <a href="#/settings">Paramètres → Fiscalité & dons</a>.</div>` : ''}`;
}

App.act.finTab = el => { App.state.finTab = el.dataset.v; App.render(); };
App.act.finCompare = el => { App.state.finCompare = el.dataset.v; App.render(); };
App.act.finAdd = () => App.quickCreate(App.state.finTab === 'summary' ? 'revenue' : App.state.finTab);
App.act.pickCompany = el => App.setCompany(el.dataset.id);
App.act.finCSV = () => {
  const r = App.range(App.state.finPeriod), cid = App.scope() === 'all' ? null : App.scope();
  const rows = [['Date', 'Type', 'Libellé', 'Catégorie', 'Entreprise', 'Montant', 'Récurrence', 'Notes']];
  App.txIn(r.start, r.end, cid).forEach(o => { const c = App.catList(o.tx.type, o.tx.companyId).find(x => x.id === o.tx.category); rows.push([o.date, App.TX_TYPES[o.tx.type].label, o.tx.label, c ? c.label : '', App.companyName(o.tx.companyId), String(o.amount).replace('.', ','), { monthly: 'Mensuelle', yearly: 'Annuelle' }[o.tx.recur] || '', o.tx.notes || '']); });
  App.download(`finances-${r.start}-${r.end}.csv`, '﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'text/csv');
};
App.download = (name, content, type = 'application/octet-stream') => {
  const b = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};
