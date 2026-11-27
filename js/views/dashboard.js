/* Tableau de bord : l'essentiel, sans surcharge */
'use strict';
App.views.dashboard = {
  render() {
    const p = App.state.period, r = App.range(p), td = D.today(), cid = App.scope() === 'all' ? null : App.scope();
    const cur = App.finSummary(r.start, r.end, cid), prv = App.prevRange(p), prev = App.finSummary(prv.start, prv.end, cid);
    const tasks = App.list('tasks', t => !App.isEvent(t) && !App.isDone(t));
    const overdue = tasks.filter(t => App.isOverdue(t, td)).length;
    const todayN = tasks.filter(t => (t.sched === 'day' && t.date === td) || t.due === td).length;
    const weekN = tasks.filter(t => (t.sched === 'day' && t.date >= td && t.date <= D.add(D.weekStart(td), 6)) || (t.sched === 'week' && t.week === D.weekStart(td))).length;
    const events = App.list('tasks', t => App.isEvent(t) && t.date >= td).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(0, 5);
    const posts = App.list('posts', x => x.date && x.date >= td && !App.status('post', x).published).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    const projects = App.list('projects', x => x.status === 'en-cours' || (!App.status('project', x).done && x.status !== 'idee' && x.status !== 'en-attente')).slice(0, 5);
    const comps = App.scope() === 'all' ? App.companies() : [];
    const cmpLabel = 'vs période précédente';
    const c = cid ? App.company(cid) : null;
    return `
      <div class="page-head">
        <div>${c ? `<div style="display:flex;align-items:center;gap:12px">${App.avatar(c, 'lg')}<h1>${esc(c.name)}</h1></div>` : '<h1>Tableau de bord</h1>'}
          <div class="sub">${c ? esc(c.description || 'Tableau de bord de l’entreprise') : 'Vue globale de toutes tes entreprises, sans mélanger leurs données.'}</div></div>
        ${App.periodBar('period')}
      </div>
      <div class="grid g4 kpis">
        <div class="card kpi" data-act="goFinance" style="cursor:pointer"><div class="label">Chiffre d’affaires</div><div class="value">${eur(cur.revenue)}</div><div class="delta">${App.delta(cur.revenue, prev.revenue)} <span class="muted">${cmpLabel}</span></div></div>
        <div class="card kpi" data-act="goFinance" style="cursor:pointer"><div class="label">Résultat</div><div class="value">${eur(cur.result)}</div><div class="delta muted">après dépenses, taxes et dons${cur.provision > 0 ? ` · ${eur(cur.provision)} à provisionner` : ''}</div></div>
        <div class="card kpi" data-act="goFinance" style="cursor:pointer"><div class="label">Dépenses</div><div class="value">${eur(cur.expense)}</div><div class="delta">${App.delta(cur.expense, prev.expense, true)} <span class="muted">${cmpLabel}</span></div></div>
        <a class="card kpi" href="#/today" style="text-decoration:none;color:inherit"><div class="label">Tâches à faire</div><div class="value">${tasks.length}</div><div class="delta muted">${todayN} aujourd’hui · ${weekN} cette semaine${overdue ? ` · <span class="down">${overdue} en retard</span>` : ''}</div></a>
      </div>
      <div class="grid g3" style="margin-top:16px">
        <div class="card" style="grid-column:span 2"><div class="card-head"><h3>Évolution du chiffre d’affaires</h3><a href="#/finance" class="small">Finances →</a></div>
          ${App.barChart(dashRows(r, cid))}</div>
        <div class="card"><div class="card-head"><h3>Prochains rendez-vous</h3><a href="#/agenda" class="small">Agenda →</a></div>
          ${events.length ? `<div class="rows">${events.map(t => `<div class="row"><span class="event-mark" style="--c:${(App.cat('event', t) || App.status('task', t)).color}">${ic('clock')}</span><div class="grow"><div class="title" data-act="edit" data-coll="tasks" data-id="${t.id}">${esc(t.title)}</div><div class="meta">${App.cdot(t.companyId)} ${esc(D.rel(t.date))}${t.time ? ' · ' + esc(t.time) : ''}</div></div></div>`).join('')}</div>` : '<div class="empty">Aucun rendez-vous à venir.</div>'}</div>
      </div>
      <div class="grid g3" style="margin-top:16px">
        <div class="card"><div class="card-head"><h3>Prochains contenus</h3><a href="#/content" class="small">Calendrier →</a></div>
          ${posts.length ? `<div class="rows">${posts.map(App.postRow).join('')}</div>` : '<div class="empty">Aucun contenu planifié.</div>'}</div>
        <div class="card"><div class="card-head"><h3>Projets en cours</h3><a href="#/projects" class="small">Projets →</a></div>
          ${projects.length ? `<div class="rows">${projects.map(x => { const pr = App.projectProgress(x); return `<div class="row"><div class="grow"><div class="title" data-act="edit" data-coll="projects" data-id="${x.id}">${App.cdot(x.companyId)} ${esc(x.name)}</div>${pr !== null ? `<div class="progress" style="margin-top:6px"><i style="width:${pr * 100}%"></i></div>` : ''}</div>${x.dueDate ? `<span class="small muted">${esc(D.fmt(x.dueDate))}</span>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">Aucun projet en cours.</div>'}</div>
        <div class="card"><div class="card-head"><h3>Indicateurs</h3></div>
          <div class="fin-lines">
            <div class="l"><span>Marge</span><span>${cur.revenue ? Math.round(cur.result / cur.revenue * 100) + ' %' : '—'}</span></div>
            <div class="l"><span>Cotisations & taxes payées</span><span>${eur(cur.tax)}</span></div>
            <div class="l"><span>Dons versés</span><span>${eur(cur.donation)}${cur.donLeft > 0 ? ` <span class="small muted">(reste ${eur(cur.donLeft)})</span>` : ''}</span></div>
            <div class="l"><span>Frais récurrents / mois</span><span>${eur(App.list('transactions', t => t.type === 'expense' && t.recur && t.recur !== 'none' && (!t.until || t.until >= td)).reduce((s, t) => s + (+t.amount || 0) / (t.recur === 'yearly' ? 12 : 1), 0))}</span></div>
          </div></div>
      </div>
      ${comps.length ? `<div class="section-title" style="margin-top:28px">Mes entreprises</div>
      <div class="cards">${comps.map(co => { const s = App.finSummary(r.start, r.end, co.id), nt = App.list('tasks', t => t.companyId === co.id && !App.isEvent(t) && !App.isDone(t)).length;
        return `<div class="icard" data-act="pickCompany" data-id="${co.id}"><div style="display:flex;align-items:center;gap:10px">${App.avatar(co, 'lg')}<div><h3>${esc(co.name)}</h3><div class="small muted">${plural(nt, 'tâche')} à faire</div></div></div>
          <div class="foot" style="justify-content:space-between"><span class="small muted">CA ${esc(r.label.toLowerCase())}</span><b style="font-weight:500">${eur(s.revenue)}</b></div></div>`; }).join('')}
        <div class="icard" data-act="newCompany" style="align-items:center;justify-content:center;color:var(--muted);border-style:dashed">${ic('plus')} Nouvelle entreprise</div></div>` : ''}`;
  },
};
const dashRows = (r, cid) => {
  let s = r.start; if (D.diff(r.start, r.end) < 58) s = D.addMonths(D.monthStart(r.end), -5);
  return App.monthly(D.monthStart(s), r.end, cid);
};
App.act.goFinance = () => { App.state.finPeriod = clone(App.state.period); App.go('finance'); };
