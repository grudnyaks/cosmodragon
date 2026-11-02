// Запуск игры и связь с Android-оболочкой
'use strict';
G.webVersion = '0';
fetch('version.json').then(r => r.json()).then(v => { G.webVersion = String(v.web || '0'); }).catch(() => { });

// Оболочка сообщает, что новая версия игры скачана: на главном экране или карте
// перезапускаемся сразу, иначе — при следующем возврате домой.
function applyUpdate() {
  Voice.stop();
  if (window.Android && Android.reload) Android.reload(); else location.reload();
}
window.onUpdateReady = function () {
  G.updateReady = true;
  if (['home', 'map'].includes(G.sceneName) && !(G.scene && G.scene.busy)) {
    G.toast('Новая версия игры!', 'update');
    setTimeout(applyUpdate, 2500);
  }
};
const _go = G.go;
G.go = function (name, args) {
  if (G.updateReady && (name === 'home' || name === 'map')) { applyUpdate(); return; }
  _go(name, args);
};
window.onAppPause = function () { Sound.pause(); };
window.onAppResume = function () { Sound.resume(); };

// для отладки в браузере: ?reset, ?scene=match3, ?planet=fire, ?treats=50, ?level=3, ?mute
const qs = new URLSearchParams(location.search);
if (qs.has('reset')) { localStorage.removeItem(KEY); S.load(); }
if (qs.has('planet')) { const p = qs.get('planet'); S.data.planet = p; if (!S.data.unlocked.includes(p)) S.data.unlocked.push(p); PS().visited = true; }
if (qs.has('treats')) PS().treats = +qs.get('treats');
if (qs.has('level')) PS().level = +qs.get('level');
if (qs.has('diff')) S.data.diff = +qs.get('diff');
if (qs.has('mute')) S.data.voice = false;
S.save();

const first = qs.get('scene') || (S.data.introSeen ? (PS().visited ? 'home' : 'intro') : 'intro');
G.start(first, { planet: S.data.planet });
G.run();
