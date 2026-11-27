/* Pense-bête : boîte de réception des idées, classées plus tard */
'use strict';
App.state.nf = { tab: 'inbox', tag: '' };

App.views.ideas = {
  render() {
    const f = App.state.nf;
    const all = App.list('notes');
    const list = all.filter(n => (f.tab === 'inbox' ? !n.processed : n.processed) && (!f.tag || noteTags(n).includes(f.tag))).sort((a, b) => b.createdAt - a.createdAt);
    const tags = [...new Set(all.flatMap(noteTags))].sort();
    const nInbox = all.filter(n => !n.processed).length;
    return `
      <div class="page-head"><div><h1>Pense-bête</h1><div class="sub">Note tout de suite, trie plus tard.</div></div></div>
      <div class="card" style="margin-bottom:18px">
        <div class="capture"><textarea class="input" rows="2" placeholder="Une idée, une info, un lien… (Entrée pour enregistrer, Maj+Entrée pour aller à la ligne)" data-enter="noteAdd" data-focuskey="noteAdd"></textarea>
        <button class="btn primary" data-act="noteAddBtn">Noter</button></div>
        <div class="small muted" style="margin-top:6px">Enregistrée dans ${esc(App.companyName(App.defaultCompanyId()))}${App.scope() === 'all' ? ' (change d’entreprise depuis la note si besoin)' : ''}.</div>
      </div>
      <div class="toolbar" style="margin-bottom:14px">
        <div class="seg"><button class="${f.tab === 'inbox' ? 'on' : ''}" data-act="nfTab" data-v="inbox">À trier · ${nInbox}</button><button class="${f.tab === 'done' ? 'on' : ''}" data-act="nfTab" data-v="done">Classées</button></div>
        ${tags.map(t => `<button class="chip ${f.tag === t ? 'on' : ''}" data-act="nfTag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}
      </div>
      ${list.length ? `<div class="cards">${list.map(noteCard).join('')}</div>` : `<div class="empty-big"><h2>${f.tab === 'inbox' ? 'Boîte vide' : 'Aucune note classée'}</h2><p>${f.tab === 'inbox' ? 'Tout est trié. Bravo !' : 'Les notes transformées ou archivées arrivent ici.'}</p></div>`}`;
  },
};
const noteTags = n => String(n.tags || '').split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
function noteCard(n) {
  const cat = App.cat('note', n);
  const conv = { tasks: 'tâche', projects: 'projet', scripts: 'script', posts: 'publication' }[n.convertedTo];
  return `<div class="note">
    <div style="display:flex;gap:6px;align-items:center">${App.cdot(n.companyId)}${cat ? App.tag(cat) : ''}<span class="small muted" style="margin-left:auto">${esc(D.rel(D.iso(new Date(n.createdAt))))}</span></div>
    <div class="body" data-act="edit" data-coll="notes" data-id="${n.id}" style="cursor:pointer">${n.title ? `<b>${esc(n.title)}</b>\n` : ''}${esc(n.body || '')}</div>
    ${n.link ? `<a href="${esc(/^https?:/i.test(n.link) ? n.link : 'https://' + n.link)}" target="_blank" rel="noopener" class="small" style="word-break:break-all">${ic('link')} ${esc(n.link)}</a>` : ''}
    ${noteTags(n).length ? `<div class="small muted">${noteTags(n).map(t => '#' + esc(t)).join(' ')}</div>` : ''}
    ${(n.files || []).length ? `<div class="small muted">${ic('clip')} ${plural(n.files.length, 'fichier')}</div>` : ''}
    <div class="acts">${n.processed
      ? `${conv ? `<span class="small muted">Transformée en ${conv}</span>` : '<span class="small muted">Archivée</span>'}<span style="flex:1"></span><button class="btn sm ghost" data-act="noteUnarchive" data-id="${n.id}">Remettre à trier</button>`
      : `<button class="btn sm" data-act="noteConvert" data-id="${n.id}">${ic('arrow')} Transformer</button><button class="btn sm ghost" data-act="noteArchive" data-id="${n.id}">${ic('archive')} Classer</button>`}
      <button class="btn sm ghost icon" data-act="noteDelete" data-id="${n.id}" title="Supprimer">${ic('trash')}</button></div>
  </div>`;
}
const addNote = text => {
  text = text.trim(); if (!text) return false;
  if (!App.companies().length) { App.act.newCompany(); return false; }
  const link = (text.match(/https?:\/\/\S+/) || [])[0] || '';
  App.put('notes', { body: text, link, companyId: App.defaultCompanyId(), processed: false });
  return true;
};
App.act.noteAdd = el => { if (addNote(el.value)) App.toast('Note enregistrée'); };
App.act.noteAddBtn = () => { const t = $('[data-focuskey="noteAdd"]'); if (t && addNote(t.value)) App.toast('Note enregistrée'); };
App.act.nfTab = el => { App.state.nf.tab = el.dataset.v; App.render(); };
App.act.nfTag = el => { App.state.nf.tag = App.state.nf.tag === el.dataset.v ? '' : el.dataset.v; App.render(); };
App.act.noteConvert = el => { const n = App.get('notes', el.dataset.id); if (n) App.menu(el, App.convertItems(n)); };
App.act.noteArchive = el => { const n = App.get('notes', el.dataset.id); if (n) { n.processed = true; App.put('notes', n); } };
App.act.noteUnarchive = el => { const n = App.get('notes', el.dataset.id); if (n) { n.processed = false; delete n.convertedTo; App.put('notes', n); } };
App.act.noteDelete = el => App.trash('notes', el.dataset.id);
