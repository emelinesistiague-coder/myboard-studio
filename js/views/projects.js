/* Projets (tableau par statut) & objectifs */
'use strict';
App.views.projects = {
  render() {
    const sts = App.statusList('project');
    const projects = App.list('projects');
    const col = s => {
      const list = projects.filter(p => p.status === s.id).sort((a, b) => prio(a) - prio(b) || (a.dueDate || '9').localeCompare(b.dueDate || '9'));
      return `<div class="board-col" data-drop="project|${s.id}"><div class="head">${App.tag(s)}<span class="small muted">${list.length}</span><button class="iconbtn" style="margin-left:auto" data-act="newProject" data-s="${s.id}">${ic('plus')}</button></div>
        ${list.map(projectCard).join('') || '<div class="small muted" style="padding:6px 4px">—</div>'}</div>`;
    };
    const goals = App.list('goals').sort((a, b) => (b.periodValue || '').localeCompare(a.periodValue || ''));
    const curM = D.today().slice(0, 7), curY = D.today().slice(0, 4);
    const active = goals.filter(g => g.periodValue === curM || g.periodValue === curY), past = goals.filter(g => !active.includes(g));
    return `
      <div class="page-head"><div><h1>Projets & objectifs</h1><div class="sub">Les chantiers importants et ce que tu vises.</div></div>
        <div class="toolbar"><button class="btn" data-act="newGoal">${ic('target')} Objectif</button><button class="btn primary" data-act="newProject">${ic('plus')} Projet</button></div></div>
      <div class="board">${sts.map(col).join('')}</div>
      <div class="section-title" style="margin-top:34px">Objectifs en cours</div>
      ${active.length ? `<div class="cards">${active.map(goalCard).join('')}</div>` : `<div class="card"><div class="empty">Fixe un objectif mensuel ou annuel par entreprise : chiffre d’affaires, publications, tâches… La progression se calcule toute seule.</div></div>`}
      ${past.length ? `<details class="more" style="margin-top:18px"><summary>Objectifs passés et futurs (${past.length})</summary><div class="cards" style="margin-top:12px">${past.map(goalCard).join('')}</div></details>` : ''}`;
  },
};
const prio = p => ({ high: 0, mid: 1, low: 2 }[p.priority] ?? 1);
function projectCard(p) {
  const pr = App.projectProgress(p), ts = App.projectTasks(p), open = ts.filter(t => !App.isDone(t)).length, td = D.today();
  const late = p.dueDate && p.dueDate < td && !App.status('project', p).done;
  return `<div class="icard" draggable="true" data-drag="projects|${p.id}" data-act="edit" data-coll="projects" data-id="${p.id}">
    <div style="display:flex;gap:6px;align-items:center">${App.cdot(p.companyId)}<h3 style="flex:1">${esc(p.name)}</h3>${p.priority === 'high' ? App.tag(App.priority('high')) : ''}</div>
    ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
    ${pr !== null ? `<div class="progress"><i style="width:${pr * 100}%"></i></div>` : ''}
    <div class="foot small muted">${ts.length ? `${plural(open, 'tâche')} restante${open > 1 ? 's' : ''}` : 'Aucune tâche'}${p.dueDate ? `<span style="margin-left:auto" class="${late ? 'down' : ''}">${ic('clock')} ${esc(D.fmt(p.dueDate, { day: 'numeric', month: 'short', year: 'numeric' }))}</span>` : ''}</div>
  </div>`;
}
function goalCard(g) {
  const p = App.goalProgress(g), c = App.company(g.companyId);
  const per = g.period === 'year' ? g.periodValue : App.cap(D.month(g.periodValue + '-01'));
  return `<div class="icard" data-act="edit" data-coll="goals" data-id="${g.id}">
    <div style="display:flex;gap:6px;align-items:center">${App.avatar(c)}<span class="small muted">${esc(c ? c.name : '')} · ${esc(per)}</span></div>
    <h3>${esc(g.title)}</h3>
    <div class="progress"><i style="width:${p.ratio * 100}%;${p.ratio >= 1 ? 'background:var(--ok)' : ''}"></i></div>
    <div class="foot small"><b style="font-weight:500">${App.fmtGoal(g, p.cur)}</b><span class="muted">sur ${App.fmtGoal(g, p.target)}</span><span style="margin-left:auto" class="muted">${Math.round(p.ratio * 100)} %</span></div>
  </div>`;
}
App.act.newProject = el => App.quickCreate('project', el && el.dataset.s ? { status: el.dataset.s } : {});
App.act.newGoal = () => App.edit('goals', { companyId: App.defaultCompanyId(), metric: 'revenue', period: 'month', periodValue: D.today().slice(0, 7) }, { isNew: true });
