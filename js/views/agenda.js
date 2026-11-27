/* Tâches & agenda : une seule liste de tâches, quatre façons de la regarder */
'use strict';
App.state.agFilter = { type: 'all', showDone: true, showPosts: true, category: '' };

const agMatch = t => {
  const f = App.state.agFilter;
  if (f.type === 'task' && App.isEvent(t)) return false;
  if (f.type === 'event' && !App.isEvent(t)) return false;
  if (!f.showDone && App.isDone(t)) return false;
  if (f.category && t.category !== f.category) return false;
  return true;
};
const agTasks = fn => App.list('tasks', t => agMatch(t) && fn(t));
/* Ce qui tombe un jour donné : réalisation prévue ce jour, ou échéance ce jour */
App.itemsOn = day => {
  const planned = agTasks(t => (t.sched === 'day' || App.isEvent(t)) && t.date === day);
  const due = agTasks(t => !App.isEvent(t) && t.due === day && !(t.sched === 'day' && t.date === day));
  return { planned: App.sortTasks(planned), due: App.sortTasks(due) };
};
const postsOn = day => App.state.agFilter.showPosts ? App.list('posts', p => p.date === day) : [];
const postChip = p => { const st = App.status('post', p); return `<div class="cal-item post" style="--c:${st.color}" draggable="true" data-drag="posts|${p.id}" data-act="edit" data-coll="posts" data-id="${p.id}" title="Publication · ${esc(st.label)}">${ic('film', 'ico')} ${esc(p.title || 'Sans titre')}</div>`; };
const inlineAdd = (kind, v, ph = '+ Ajouter') => `<input class="inline-add" placeholder="${ph}" data-enter="agAdd" data-kind="${kind}" data-v="${v}" data-focuskey="ag-${kind}-${v}">`;

App.views.agenda = {
  render() {
    const s = App.state, view = s.agendaView || 'week', a = s.agendaDate || D.today(), f = s.agFilter;
    let title = '', body = '';
    if (view === 'day') { title = App.cap(D.long(a)); body = dayView(a); }
    if (view === 'week') { const ws = D.weekStart(a); title = `${D.fmt(ws, { day: 'numeric', month: 'long' })} – ${D.fmt(D.add(ws, 6), { day: 'numeric', month: 'long', year: 'numeric' })}`; body = weekView(ws); }
    if (view === 'month') { title = App.cap(D.month(a)); body = monthList(a); }
    if (view === 'cal') { title = App.cap(D.month(a)); body = calView(a); }
    const cats = App.catList(f.type === 'event' ? 'event' : 'task').concat(f.type === 'all' ? App.catList('event') : []);
    const withBacklog = view !== 'week';
    return `
      <div class="page-head"><div><h1>Tâches & agenda</h1><div class="sub">Une seule liste de tâches et de rendez-vous, visible dans toutes les vues.</div></div>
        <div class="toolbar"><button class="btn" data-act="quickCreateAg" data-k="event">${ic('clock')} Rendez-vous</button><button class="btn primary" data-act="quickCreateAg" data-k="task">${ic('plus')} Tâche</button></div></div>
      <div class="toolbar" style="justify-content:space-between;margin-bottom:16px">
        <div class="toolbar">
          <div class="seg">${[['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois'], ['cal', 'Calendrier']].map(([k, l]) => `<button class="${view === k ? 'on' : ''}" data-act="agView" data-v="${k}">${l}</button>`).join('')}</div>
          <button class="btn icon ghost" data-act="agNav" data-dir="-1">${ic('left')}</button>
          <button class="btn sm" data-act="agNav" data-dir="0">Aujourd’hui</button>
          <button class="btn icon ghost" data-act="agNav" data-dir="1">${ic('right')}</button>
          <b style="font-family:var(--serif);font-size:17px;font-weight:500">${esc(title)}</b>
        </div>
        <div class="toolbar">
          <div class="seg">${[['all', 'Tout'], ['task', 'Tâches'], ['event', 'Rendez-vous']].map(([k, l]) => `<button class="${f.type === k ? 'on' : ''}" data-act="agFilter" data-k="type" data-v="${k}">${l}</button>`).join('')}</div>
          <select class="input" style="width:auto;min-height:32px;padding:4px 8px" data-change="agCat"><option value="">Toutes catégories</option>${cats.map(c => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
          <button class="chip ${f.showDone ? 'on' : ''}" data-act="agFilter" data-k="showDone">Terminées</button>
          <button class="chip ${f.showPosts ? 'on' : ''}" data-act="agFilter" data-k="showPosts">${ic('film')} Publications</button>
        </div>
      </div>
      ${withBacklog ? `<div class="agenda-layout"><div style="min-width:0">${body}</div>${backlog()}</div>` : body}`;
  },
};

function backlog(wide) {
  const list = App.sortTasks(App.list('tasks', t => !App.isEvent(t) && t.sched === 'none' && !App.isDone(t) && agMatch(t)));
  return `<div class="card backlog" data-drop="none|">
    <div class="card-head"><h3>À planifier</h3><span class="small muted">${list.length}</span></div>
    <div class="small muted" style="margin-bottom:8px">Tâches sans date. Glisse-les sur un jour, une semaine ou un mois.</div>
    <div style="display:${wide ? 'grid' : 'flex'};${wide ? 'grid-template-columns:repeat(auto-fill,minmax(220px,1fr));' : 'flex-direction:column;'}gap:6px">${list.map(App.miniTask).join('')}</div>
    ${inlineAdd('none', '', '+ Ajouter une tâche sans date')}
  </div>`;
}

function dayView(day) {
  const { planned, due } = App.itemsOn(day);
  const events = planned.filter(App.isEvent), tasks = planned.filter(t => !App.isEvent(t));
  const ws = D.weekStart(day);
  const weekB = App.sortTasks(agTasks(t => !App.isEvent(t) && t.sched === 'week' && t.week === ws && !App.isDone(t)));
  const posts = postsOn(day);
  return `<div class="card" data-drop="day|${day}">
    ${events.length ? `<div class="section-title">Rendez-vous</div><div class="rows">${events.map(t => App.taskRow(t)).join('')}</div>` : ''}
    <div class="section-title">Tâches du jour <span>${tasks.length}</span></div>
    ${tasks.length ? `<div class="rows">${tasks.map(t => App.taskRow(t, { showSched: false })).join('')}</div>` : '<div class="empty">Aucune tâche prévue ce jour.</div>'}
    ${due.length ? `<div class="section-title">Échéances ce jour</div><div class="rows">${due.map(t => App.taskRow(t)).join('')}</div>` : ''}
    ${posts.length ? `<div class="section-title">Publications</div><div class="rows">${posts.map(App.postRow).join('')}</div>` : ''}
    <div style="margin-top:10px">${inlineAdd('day', day, '+ Ajouter une tâche ce jour (Entrée)')}</div>
  </div>
  ${weekB.length ? `<div class="card" style="margin-top:14px" data-drop="week|${ws}"><div class="section-title">Cette semaine, sans jour fixé</div><div class="rows">${weekB.map(t => App.taskRow(t, { showSched: false })).join('')}</div></div>` : ''}`;
}

function weekView(ws) {
  const td = D.today();
  const cols = [...Array(7)].map((_, i) => {
    const d = D.add(ws, i), { planned, due } = App.itemsOn(d);
    return `<div class="wcol ${d === td ? 'today' : ''}" data-drop="day|${d}">
      <div class="wcol-head"><span class="small muted">${D.DOW[i]}</span><b>${D.parse(d).getDate()}</b></div>
      ${planned.map(App.miniTask).join('')}
      ${due.map(t => App.miniTask(t).replace('class="txt"', 'class="txt" title="Échéance ce jour"')).join('')}
      ${postsOn(d).map(postChip).join('')}
      ${inlineAdd('day', d)}
    </div>`;
  }).join('');
  const bucket = App.sortTasks(agTasks(t => !App.isEvent(t) && t.sched === 'week' && t.week === ws));
  const backlogList = App.sortTasks(App.list('tasks', t => !App.isEvent(t) && t.sched === 'none' && !App.isDone(t) && agMatch(t)));
  return `<div class="week">${cols}
    <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
      <div class="wcol bucket" data-drop="week|${ws}" style="min-height:140px"><div class="wcol-head"><b>Cette semaine</b><span class="small muted">sans jour</span></div>${bucket.map(App.miniTask).join('')}${inlineAdd('week', ws)}</div>
      <div class="wcol bucket" data-drop="none|" style="min-height:120px"><div class="wcol-head"><b>À planifier</b><span class="small muted">${backlogList.length}</span></div>${backlogList.map(App.miniTask).join('')}${inlineAdd('none', '')}</div>
    </div></div>`;
}

function monthList(a) {
  const ms = D.monthStart(a), me = D.monthEnd(a), td = D.today(), mk = ms.slice(0, 7);
  const monthB = App.sortTasks(agTasks(t => !App.isEvent(t) && t.sched === 'month' && t.month === mk));
  const weekB = App.sortTasks(agTasks(t => !App.isEvent(t) && t.sched === 'week' && D.add(t.week, 6) >= ms && t.week <= me));
  let days = '';
  for (let d = ms; d <= me; d = D.add(d, 1)) {
    const { planned, due } = App.itemsOn(d), posts = postsOn(d), n = planned.length + due.length + posts.length;
    days += `<div class="mday ${n ? '' : 'empty-day'} ${d === td ? 'today' : ''}" data-drop="day|${d}">
      <div class="dlabel" data-act="agGoDay" data-d="${d}" style="cursor:pointer">${D.fmt(d, { weekday: 'short' })}<b>${D.parse(d).getDate()}</b></div>
      <div class="ditems">${planned.map(t => App.taskRow(t, { showSched: false })).join('')}${due.map(t => App.taskRow(t)).join('')}${posts.map(App.postRow).join('')}</div></div>`;
  }
  return `<div class="card" data-drop="month|${ms}" style="margin-bottom:14px">
      <div class="card-head"><h3>Ce mois-ci, sans jour fixé</h3><span class="small muted">${monthB.length}</span></div>
      ${monthB.length ? `<div class="rows">${monthB.map(t => App.taskRow(t, { showSched: false })).join('')}</div>` : '<div class="empty">Glisse ici les tâches à faire dans le mois, sans jour précis.</div>'}
      ${inlineAdd('month', ms, '+ Ajouter une tâche pour ce mois')}
      ${weekB.length ? `<div class="section-title">Prévues à la semaine</div><div class="rows">${weekB.map(t => App.taskRow(t)).join('')}</div>` : ''}
    </div>
    <div class="card month-list">${days}</div>`;
}

function calView(a) {
  const ms = D.monthStart(a), start = D.weekStart(ms), td = D.today(), m = ms.slice(5, 7);
  let cells = D.DOW.map(x => `<div class="dow">${x}</div>`).join('');
  const weeks = D.diff(start, D.monthEnd(ms)) >= 35 ? 6 : 5;
  for (let i = 0; i < weeks * 7; i++) {
    const d = D.add(start, i), { planned, due } = App.itemsOn(d), posts = postsOn(d);
    const chips = [
      ...planned.map(t => { const c = App.cat(App.isEvent(t) ? 'event' : 'task', t) || App.status('task', t); return `<div class="cal-item ${App.isDone(t) ? 'done' : ''}" style="--c:${App.scope() === 'all' ? (App.company(t.companyId) || {}).color : c.color}" draggable="true" data-drag="tasks|${t.id}" data-act="edit" data-coll="tasks" data-id="${t.id}">${t.time ? `<span class="t">${esc(t.time)}</span>` : ''}${App.isEvent(t) ? '' : (App.isDone(t) ? '✓ ' : '')}${esc(t.title)}</div>`; }),
      ...due.map(t => `<div class="cal-item ${App.isDone(t) ? 'done' : ''}" style="--c:var(--danger)" draggable="true" data-drag="tasks|${t.id}" data-act="edit" data-coll="tasks" data-id="${t.id}" title="Échéance">⚑ ${esc(t.title)}</div>`),
      ...posts.map(postChip),
    ];
    const max = 4;
    cells += `<div class="day ${d.slice(5, 7) !== m ? 'out' : ''} ${d === td ? 'today' : ''}" data-drop="day|${d}">
      <div class="num"><b data-act="agGoDay" data-d="${d}" style="cursor:pointer">${D.parse(d).getDate()}</b><button class="iconbtn add" data-act="agAddDay" data-d="${d}" title="Ajouter">${ic('plus')}</button></div>
      ${chips.slice(0, max).join('')}${chips.length > max ? `<button class="btn sm ghost" data-act="agGoDay" data-d="${d}">+${chips.length - max} autres</button>` : ''}
    </div>`;
  }
  return `<div class="cal">${cells}</div>`;
}

App.act.agView = el => { App.state.agendaView = el.dataset.v; App.persistState(); App.render(); };
App.act.agNav = el => {
  const s = App.state, dir = +el.dataset.dir, v = s.agendaView || 'week', a = s.agendaDate || D.today();
  if (!dir) s.agendaDate = D.today();
  else s.agendaDate = v === 'day' ? D.add(a, dir) : v === 'week' ? D.add(a, 7 * dir) : D.addMonths(D.monthStart(a), dir);
  App.render();
};
App.act.agGoDay = el => { App.state.agendaView = 'day'; App.state.agendaDate = el.dataset.d; App.render(); };
App.act.agFilter = el => { const f = App.state.agFilter, k = el.dataset.k; if (el.dataset.v) { f[k] = el.dataset.v; f.category = ''; } else f[k] = !f[k]; App.render(); };
App.act.agCat = el => { App.state.agFilter.category = el.value; App.render(); };
App.act.agAddDay = el => App.quickCreate('task', { sched: 'day', date: el.dataset.d });
App.act.quickCreateAg = el => {
  const v = App.state.agendaView, a = App.state.agendaDate || D.today();
  if (el.dataset.k === 'event') App.quickCreate('event', { date: v === 'day' ? a : D.today() });
  else App.quickCreate('task', v === 'day' ? { sched: 'day', date: a } : {});
};
App.act.agAdd = el => {
  const v = el.value.trim(); if (!v) return;
  if (!App.companies().length) return App.act.newCompany();
  const cid = App.defaultCompanyId(), t = { kind: 'task', title: v, companyId: cid, priority: 'mid', status: App.openStatus(cid) };
  App.schedule(t, el.dataset.kind, el.dataset.v);
  if (App.state.agFilter.category) t.category = App.state.agFilter.category;
  App.put('tasks', t);
};
