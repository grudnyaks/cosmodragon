// Сохранение игры: общие настройки + прогресс на каждой планете
'use strict';
const KEY = 'cosmodragon.save.v1';
const S = {
  data: null,
  planetDefaults() { return { treats: 5, games: {}, visited: false }; },
  villainDefaults() { return { taken: [], keys: 0, ch: 0, wins: 0, next: 3, rescues: 0, friend: false, seen: [] }; },
  defaults() {
    return {
      v: 3, planet: 'nyam', planets: {}, buddy: 'dark', villain: this.villainDefaults(),
      music: true, voice: true, introSeen: false, diff: 4, breakMin: 0, playSec: 0, restUntil: 0,
      stats: {}, ach: {}, newAch: [],
    };
  },
  load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { d = {}; }
    if (d.v !== 3) d = this.migrate(d);
    this.data = Object.assign(this.defaults(), d);
    this.data.planet = 'nyam';
    this.data.planets.nyam = Object.assign(this.planetDefaults(), this.data.planets.nyam || {});
    this.data.villain = Object.assign(this.villainDefaults(), this.data.villain || {});
    if (!DRAGON_BY_ID[this.data.buddy]) this.data.buddy = 'dark';
  },
  // Старые сохранения (с планетами и ростом): переносим вкусняшки, настройки и статистику, сюжет начинается заново
  migrate(o) {
    if (!o || !Object.keys(o).length) return {};
    const d = this.defaults();
    d.music = o.music !== false; d.voice = o.voice !== false; d.introSeen = false;
    d.diff = o.diff || 4; d.breakMin = o.breakMin || 0; d.stats = o.stats || {};
    let treats = 5;
    if (o.planets) { treats = 0; for (const k in o.planets) treats += (o.planets[k] && o.planets[k].treats) || 0; }
    else if (o.treats) treats = o.treats;
    d.planets.nyam = Object.assign(this.planetDefaults(), { treats: Math.max(5, treats), games: (o.planets && o.planets.nyam && o.planets.nyam.games) || {} });
    return d;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
  addTreats(n) { PS().treats += n; if (n > 0) stat('treats', n); this.save(); },
};

// Текущая планета (всегда Ням-Ням) и её сохранение
function P() { return PLANETS[0]; }
function PS() { return S.data.planets.nyam; }
function V() { return S.data.villain; }
function isTaken(id) { return V().taken.includes(id); }
// Дракончик-напарник в мини-играх: тот, кого гладили последним, если он не у Змея
function buddy() {
  const b = S.data.buddy;
  if (!isTaken(b)) return b;
  const other = DRAGONS.find(d => !isTaken(d.id));
  return other ? other.id : b;
}
// Уровень сложности игры: число побед + сложность из настроек
function GL(key) { return (PS().games[key] || 0) + S.data.diff; }
function GW(key) {
  const g = PS().games, v = V(); g[key] = (g[key] || 0) + 1;
  // пока дракончики у Змея, каждая победа приносит ключ
  if (v.taken.length && v.keys < 3) {
    v.keys++;
    if (typeof G !== 'undefined' && G.toast) setTimeout(() => G.toast('Найден ключ! ' + v.keys + ' из 3', 'key'), 1600);
  } else if (!v.taken.length) v.wins++;
  if (typeof Care !== 'undefined') Care.played();
  stat('wins', 1); S.save();
}
function stat(k, n) {
  const st = S.data.stats; st[k] = (st[k] || 0) + (n == null ? 1 : n);
  if (typeof Ach !== 'undefined') Ach.check();
}
// Роста больше нет: умения выключены, игры работают в обычном режиме
function hasAbility() { return false; }

// Озвучка текста (Android TTS через мост, иначе браузерная)
const Voice = {
  // Записанный голос: web/voice/phrases.json (текст → номер), web/voice/files.json (какие файлы уже есть).
  // Фраза собирается из записанных кусочков; если хоть одного нет — говорит синтезатор речи.
  map: null, have: null, queue: [], cur: null, token: 0, miss: [],
  init() {
    fetch('voice/phrases.json').then(r => r.json()).then(m => { this.map = m; }).catch(() => { });
    fetch('voice/files.json').then(r => r.json()).then(f => { this.have = new Set(f.map(String)); }).catch(() => { this.have = new Set(); });
  },
  say(text) {
    if (!S.data.voice || !text) return;
    if (typeof Care !== 'undefined') text = Care.fill(text);
    this.stop();
    const ids = this.map && typeof VoiceNorm !== 'undefined' ? VoiceNorm.segment(text, this.map) : null;
    if (!ids) { if (this.miss.length < 200) this.miss.push(text); }
    else if (this.have && ids.every(id => this.have.has(id))) { this.queue = ids.slice(); this.playNext(++this.token); return; }
    // своё имя внутри записанной фразы: записанные кусочки + синтезатор для имени
    if (!ids && this.map && this.have && this.have.size) {
      const mix = VoiceNorm.segmentMixed(text, this.map);
      if (mix.some(p => p.id) && mix.every(p => p.tts || this.have.has(p.id)) && mix.filter(p => p.tts).length <= 2) { this.queue = mix; this.playNext(++this.token); return; }
    }
    this.tts(text);
  },
  playNext(tok) {
    if (tok !== this.token) return;
    let id = this.queue.shift();
    if (!id) { this.cur = null; return; }
    if (id.tts) { this.tts(id.tts, true); setTimeout(() => this.playNext(tok), 350 + id.tts.length * 75); return; }
    if (id.id) id = id.id;
    const a = new Audio('voice/' + id + '.mp3');
    this.cur = a;
    a.onended = () => setTimeout(() => this.playNext(tok), 40);
    a.onerror = () => this.playNext(tok);
    a.play().catch(() => { });
  },
  tts(text, keep) {
    try {
      if (window.Android && Android.speak) { Android.speak(text); return; }
      if (window.speechSynthesis) {
        if (!keep) speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ru-RU'; u.rate = 0.95; u.pitch = 1.15;
        speechSynthesis.speak(u);
      }
    } catch (e) { }
  },
  stop() {
    this.token++; this.queue = [];
    if (this.cur) { try { this.cur.pause(); } catch (e) { } this.cur = null; }
    try {
      if (window.Android && Android.stopSpeak) Android.stopSpeak();
      else if (window.speechSynthesis) speechSynthesis.cancel();
    } catch (e) { }
  },
};
Voice.init();
