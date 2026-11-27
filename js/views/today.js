/* Page « Aujourd'hui » : tout ce qui concerne ma journée, cochable directement */
'use strict';
App.views.today = {
  render() {
    const td = D.today(), in7 = D.add(td, 7);
    const tasks = App.list('tasks');
    const open = tasks.filter(t => !App.isDone(t));
    const focus = App.sortTasks(tasks.filter(t => t.focus === td && !App.isEvent(t)));
    const events = tasks.filter(t => App.isEvent(t) && t.date === td).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const todayTasks = App.sortTasks(tasks.filter(t => !App.isEvent(t) && t.focus !== td && ((t.sched === 'day' && t.date === td) || (t.due === td && !(t.sched === 'day' && t.date < td)))));
    const overdue = App.sortTasks(open.filter(t => !App.isEvent(t) && t.focus !== td && App.isOverdue(t, td) && !(t.sched === 'day' && t.date === td)));
    const week = App.sortTasks(open.filter(t => !App.isEvent(t) && t.focus !== td && t.sched === 'week' && t.week === D.weekStart(td) && !(t.due && t.due <= td)));
    const deadlines = [
      ...open.filter(t => t.due && t.due > td && t.due <= in7).map(t => ({ date: t.due, html: `<span class="tag outline">Tâche</span>`, title: t.title, coll: 'tasks', id: t.id, cid: t.companyId })),
      ...App.list('projects', p => p.dueDate && p.dueDate >= td && p.dueDate <= D.add(td, 14) && !App.status('project', p).done).map(p => ({ date: p.dueDate, html: `<span class="tag outline">Projet</span>`, title: p.name, coll: 'projects', id: p.id, cid: p.companyId })),
      ...tasks.filter(t => App.isEvent(t) && t.date > td && t.date <= D.add(td, 3)).map(t => ({ date: t.date, html: `<span class="tag outline">RDV${t.time ? ' ' + esc(t.time) : ''}</span>`, title: t.title, coll: 'tasks', id: t.id, cid: t.companyId })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    const posts = App.list('posts', p => p.date && p.date >= td && p.date <= in7 && !App.status('post', p).done).sort((a, b) => a.date.localeCompare(b.date));
    const postsToday = App.list('posts', p => p.date === td);

    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel après-midi' : 'Bonsoir';
    const nOpen = [...focus, ...todayTasks].filter(t => !App.isDone(t)).length;
    const summary = [
      nOpen ? plural(nOpen, 'tâche') + ' pour aujourd’hui' : 'aucune tâche prévue aujourd’hui',
      events.length ? plural(events.length, 'rendez-vous', 'rendez-vous') : '',
      overdue.length ? `<span class="down">${plural(overdue.length, 'tâche')} en retard</span>` : '',
      postsToday.length ? plural(postsToday.length, 'publication') + ' prévue' + (postsToday.length > 1 ? 's' : '') : '',
    ].filter(Boolean).join(' · ');

    const block = (title, list, opts = {}) => list.length ? `<div class="section-title">${title}<span>${list.length}</span></div><div class="rows">${list.map(t => App.taskRow(t, opts)).join('')}</div>` : '';
    return `
      <div class="page-head today-head"><div><div class="muted">${esc(App.cap(D.long(td)))}</div><h1>${hello}.</h1><div class="sub">${summary}</div></div></div>
      <div class="today-grid">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card focus-card">
            <div class="card-head"><h3>${ic('star')} Priorités du jour</h3><span class="small muted">${focus.length}/3 conseillé</span></div>
            ${focus.length ? `<div class="rows">${focus.map(t => App.taskRow(t)).join('')}</div>` : `<div class="empty">Choisis 1 à 3 tâches importantes avec l’étoile ${ic('star')} pour les retrouver ici.</div>`}
          </div>
          <div class="card">
            <div class="card-head"><h3>Ma journée</h3></div>
            ${events.length ? `<div class="section-title">Rendez-vous</div><div class="rows">${events.map(t => App.taskRow(t, { showSched: true })).join('')}</div>` : ''}
            ${block('À faire aujourd’hui', todayTasks, { showSched: false })}
            ${!events.length && !todayTasks.length ? '<div class="empty">Rien de prévu aujourd’hui pour l’instant.</div>' : ''}
            ${block('En retard', overdue)}
            ${block('Cette semaine, sans jour fixé', week, { showSched: false })}
            <div class="quick-line"><input class="input" placeholder="Ajouter une tâche pour aujourd’hui…  (Entrée)" data-enter="todayAdd" data-focuskey="todayAdd"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card"><div class="card-head"><h3>Échéances à venir</h3></div>
            ${deadlines.length ? `<div class="rows">${deadlines.map(x => `<div class="row"><div class="grow"><div class="title" data-act="edit" data-coll="${x.coll}" data-id="${x.id}">${App.cdot(x.cid)} ${esc(x.title)}</div><div class="meta">${x.html} ${esc(D.rel(x.date))}</div></div></div>`).join('')}</div>` : '<div class="empty">Aucune échéance dans les 7 prochains jours.</div>'}
          </div>
          <div class="card"><div class="card-head"><h3>Publications à préparer</h3><a href="#/content" class="small">Calendrier →</a></div>
            ${posts.length ? `<div class="rows">${posts.map(p => App.postRow(p)).join('')}</div>` : '<div class="empty">Aucune publication à préparer cette semaine.</div>'}
          </div>
        </div>
      </div>`;
  },
};
App.act.todayAdd = el => {
  const v = el.value.trim(); if (!v) return;
  if (!App.companies().length) return App.act.newCompany();
  const cid = App.defaultCompanyId();
  App.put('tasks', { kind: 'task', title: v, companyId: cid, sched: 'day', date: D.today(), priority: 'mid', status: App.openStatus(cid) });
  App.toast('Tâche ajoutée à ' + App.companyName(cid));
};
App.postRow = p => {
  const st = App.status('post', p), nw = App.network(p);
  return `<div class="row"><div class="grow"><div class="title" data-act="edit" data-coll="posts" data-id="${p.id}">${App.cdot(p.companyId)} ${esc(p.title || 'Sans titre')}</div>
    <div class="meta">${esc(D.rel(p.date))}${p.time ? ' · ' + esc(p.time) : ''}${nw ? ' · ' + esc(nw.label) : ''}</div></div>${App.tag(st)}</div>`;
};
