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
// время игры: при включённом напоминании после N минут при следующем переходе — перерыв
setInterval(() => {
  if (document.hidden || G.sceneName === 'rest') return;
  S.data.playSec = (S.data.playSec || 0) + 1;
  if (S.data.playSec % 15 === 0) S.save();
}, 1000);
function restDue() { return S.data.breakMin > 0 && S.data.playSec >= S.data.breakMin * 60; }
G.go = function (name, args) {
  if (G.updateReady && (name === 'home' || name === 'map')) { applyUpdate(); return; }
  if (name !== 'rest' && G.sceneName !== 'rest' && restDue()) { _go('rest'); return; }
  _go(name, args);
};
window.onAppPause = function () { Sound.pause(); };
window.onAppResume = function () { Sound.resume(); };

// для отладки в браузере: ?reset, ?scene=maze, ?treats=50, ?wins=3 (Шипун придёт), ?ch=2, ?mute
const qs = new URLSearchParams(location.search);
if (qs.has('reset')) { localStorage.removeItem(KEY); S.load(); }
if (qs.has('treats')) PS().treats = +qs.get('treats');
if (qs.has('wins')) V().wins = +qs.get('wins');
if (qs.has('ch')) V().ch = +qs.get('ch');
if (qs.has('diff')) S.data.diff = +qs.get('diff');
if (qs.has('mute')) S.data.voice = false;
S.save();

const first = qs.get('scene') || (S.data.restUntil > Date.now() ? 'rest' : S.data.introSeen ? (PS().visited ? 'home' : 'intro') : 'intro');
G.start(first, {});
G.run();
