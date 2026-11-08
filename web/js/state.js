// Сохранение игры: общие настройки + прогресс на каждой планете
'use strict';
const KEY = 'cosmodragon.save.v1';
const S = {
  data: null,
  planetDefaults() { return { treats: 5, earned: 0, games: {}, visited: false, beacon: false }; },
  thiefDefaults() { return { ch: 0, wins: 0, next: 4, friend: false, seen: [], active: false, stolen: 0 }; },
  villainDefaults() { return { taken: [], keys: 0, ch: 0, wins: 0, next: 3, rescues: 0, friend: false, friend2: false, villain: 'snake', hides: null, seen: [] }; },
  defaults() {
    return {
      v: 4, planet: 'nyam', planets: {}, unlocked: ['nyam'], buddy: 'dark', villain: this.villainDefaults(), thief: this.thiefDefaults(),
      music: true, voice: true, introSeen: false, diff: 4, breakMin: 0, playSec: 0, restUntil: 0,
      stats: {}, ach: {}, newAch: [],
    };
  },
  load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { d = {}; }
    if (d.v === 3) { d.v = 4; d.unlocked = ['nyam']; d.planet = 'nyam'; if (d.planets && d.planets.nyam) d.planets.nyam.earned = d.planets.nyam.treats || 0; }
    else if (d.v !== 4) d = this.migrate(d);
    this.data = Object.assign(this.defaults(), d);
    for (const p of PLANETS) this.data.planets[p.id] = Object.assign(this.planetDefaults(), this.data.planets[p.id] || {});
    if (!PLANET_BY_ID[this.data.planet] || !this.data.unlocked.includes(this.data.planet)) this.data.planet = 'nyam';
    this.data.villain = Object.assign(this.villainDefaults(), this.data.villain || {});
    this.data.thief = Object.assign(this.thiefDefaults(), this.data.thief || {});
    { const v = this.data.villain; if (v.hides == null) v.hides = Math.max(0, v.rescues - (v.friend ? 7 : v.rescues)); }
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
  addTreats(n) { const ps = PS(); ps.treats += n; if (n > 0) { ps.earned = (ps.earned || 0) + n; stat('treats', n); } this.save(); },
};

// Текущая планета, её сохранение и её драконы
function P() { return PLANET_BY_ID[S.data.planet] || PLANETS[0]; }
function PS(id) { return S.data.planets[id || S.data.planet]; }
function PD() { return dragonsOf(S.data.planet); }
function T() { return S.data.thief; }
// сколько вкусняшек нужно, чтобы зажечь маяк планеты
const BEACON_GOAL = 100;
function V() { return S.data.villain; }
function isTaken(id) { return V().taken.includes(id); }
// Дракончик-напарник в мини-играх: тот, кого гладили последним, если он не у Змея
function buddy() {
  const here = PD(), b = S.data.buddy;
  if (here.some(d => d.id === b) && !isTaken(b)) return b;
  const other = here.find(d => !isTaken(d.id)) || here[0] || DRAGONS[0];
  return other.id;
}
// Уровень сложности игры: число побед + сложность из настроек
function GL(key) { return (PS().games[key] || 0) + S.data.diff; }
function GW(key) {
  const g = PS().games, v = V(); g[key] = (g[key] || 0) + 1;
  // пока дракончики у Змея, каждая победа приносит ключ
  if (v.taken.length && v.keys < 3) {
    v.keys++;
    const star = v.villain === 'comet';
    if (typeof G !== 'undefined' && G.toast) setTimeout(() => G.toast((star ? 'Найдена звезда! ' : 'Найден ключ! ') + v.keys + ' из 3', star ? 'star' : 'key'), 1600);
  } else if (!v.taken.length) { v.wins++; T().wins++; }
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
