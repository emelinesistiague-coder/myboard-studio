/* Bibliothèque de scripts vidéo */
'use strict';
App.state.sf = { q: '', status: '', category: '', network: '' };

App.views.scripts = {
  render() {
    const f = App.state.sf, q = norm(f.q);
    const list = App.list('scripts', s => (!f.status || s.status === f.status) && (!f.category || s.category === f.category) && (!f.network || s.network === f.network)
      && (!q || [s.title, s.concept, s.hook, s.script, s.notes, s.cta].some(x => norm(x).includes(q))))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const sel = (k, items, all) => `<select class="input" style="width:auto;min-height:34px" data-change="sfSet" data-k="${k}"><option value="">${all}</option>${items.map(x => `<option value="${x.id}" ${f[k] === x.id ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`;
    return `
      <div class="page-head"><div><h1>Scripts vidéo</h1><div class="sub">Écris tes vidéos ici, puis transforme-les en publication en un clic.</div></div>
        <button class="btn primary" data-act="newScript">${ic('plus')} Nouveau script</button></div>
      <div class="toolbar" style="margin-bottom:18px">
        <input class="input" style="max-width:280px" placeholder="Rechercher dans les scripts…" value="${esc(f.q)}" data-input="sfSearch" data-focuskey="sfSearch">
        ${sel('status', App.statusList('script'), 'Tous les statuts')}${sel('category', App.catList('script'), 'Toutes catégories')}${sel('network', App.networkList(), 'Tous les réseaux')}
      </div>
      ${list.length ? `<div class="cards">${list.map(s => {
        const st = App.status('script', s), cat = App.cat('script', s), nw = App.network(s), post = App.list('posts', p => p.scriptId === s.id)[0];
        return `<div class="icard" data-act="edit" data-coll="scripts" data-id="${s.id}">
          <div style="display:flex;gap:6px;align-items:center">${App.cdot(s.companyId)}${App.tag(st)}${nw ? `<span class="small muted">${esc(nw.label)}</span>` : ''}</div>
          <h3>${esc(s.title || 'Sans titre')}</h3>
          ${s.hook ? `<div class="desc"><i>« ${esc(s.hook)} »</i></div>` : s.concept ? `<div class="desc">${esc(s.concept)}</div>` : ''}
          <div class="foot">${cat ? App.tag(cat) : ''}${post ? `<span class="tag outline">${ic('film')} ${esc(D.fmt(post.date))}</span>` : ''}<span class="small muted" style="margin-left:auto">${esc(D.fmt(D.iso(new Date(s.updatedAt))))}</span></div>
        </div>`;
      }).join('')}</div>` : `<div class="empty-big"><h2>${f.q || f.status || f.category || f.network ? 'Aucun script ne correspond' : 'Aucun script pour l’instant'}</h2><p>Accroche, scènes, texte à l’écran, CTA : tout au même endroit.</p></div>`}`;
  },
};
App.act.newScript = () => App.quickCreate('script', App.state.sf.network ? { network: App.state.sf.network } : {});
App.act.sfSet = el => { App.state.sf[el.dataset.k] = el.value; App.render(); };
let sfT; App.act.sfSearch = el => { App.state.sf.q = el.value; clearTimeout(sfT); sfT = setTimeout(App.render, 180); };
