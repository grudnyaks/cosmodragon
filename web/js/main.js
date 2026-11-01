// Запуск игры и связь с Android-оболочкой
'use strict';
G.webVersion = '0';
fetch('version.json').then(r => r.json()).then(v => { G.webVersion = String(v.web || '0'); }).catch(() => { });

// Оболочка сообщает, что новое обновление скачано
window.onUpdateReady = function () { G.updateReady = true; };
window.onAppPause = function () { Sound.pause(); };
window.onAppResume = function () { Sound.resume(); };

// для отладки в браузере: ?reset — начать заново, ?scene=match3 — открыть сцену
const qs = new URLSearchParams(location.search);
if (qs.has('reset')) { localStorage.removeItem(KEY); S.load(); }
if (qs.has('treats')) { S.data.treats = +qs.get('treats'); S.save(); }
if (qs.has('level')) { S.data.level = +qs.get('level'); S.save(); }
if (qs.has('mute')) S.data.voice = false;

const first = qs.get('scene') || (S.data.introSeen ? 'home' : 'intro');
G.start(first);
G.run();
