/* MYBOARD Studio — démarrage */
'use strict';
(async function init() {
  App.applyTheme();
  try { await App.load(); }
  catch (e) { $('#app').innerHTML = `<div class="empty-big"><h2>Impossible d’ouvrir la base de données locale</h2><p>${esc(e && e.message || e)}</p><p class="small">Vérifie que le navigateur n’est pas en navigation privée.</p></div>`; return; }
  App.migrateCompanies();
  const saved = (App.prefs.state || {});
  Object.assign(App.state, {
    company: saved.company || 'all',
    period: saved.period || { type: 'month', anchor: D.today() },
    finPeriod: saved.finPeriod || { type: 'year', anchor: D.today() },
    agendaView: saved.agendaView || 'week',
    agendaDate: D.today(),
  });
  // Les périodes reviennent toujours sur la date du jour à l'ouverture
  if (App.state.period.type !== 'custom') App.state.period.anchor = D.today();
  if (App.state.finPeriod.type !== 'custom') App.state.finPeriod.anchor = D.today();
  App.bindEvents();
  App.route();
  App.collector.start();

  // Rappel de sauvegarde (une fois par jour au maximum)
  const hasData = App.data.companies.size > 0, lb = App.meta.lastBackup;
  if (hasData && (!lb || Date.now() - lb > 14 * 864e5) && App.prefs.lastBackupNag !== D.today()) {
    App.prefs.lastBackupNag = D.today(); App.savePrefs();
    setTimeout(() => App.toast(lb ? 'Ta dernière sauvegarde date de plus de 2 semaines' : 'Pense à exporter une première sauvegarde', { label: 'Sauvegarder', fn: App.act.exportJSON }), 1500);
  }
  // Demande au navigateur de protéger les données contre l'effacement automatique
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
})();

/* ---------- PWA : installation et fonctionnement hors ligne ---------- */
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) App.toast('Une nouvelle version est disponible', { label: 'Mettre à jour', fn: () => location.reload() });
      });
    });
  }).catch(e => console.warn('Service worker non enregistré', e)));
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); App.installPrompt = e; if (App.state.view === 'settings') App.render(); });
window.addEventListener('appinstalled', () => { App.installPrompt = null; App.toast('MYBOARD Studio est installée'); });
