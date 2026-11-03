// Сохранение игры: общие настройки + прогресс на каждой планете
'use strict';
const KEY = 'cosmodragon.save.v1';
const S = {
  data: null,
  planetDefaults() { return { treats: 0, level: 0, fed: 0, beacon: false, games: {}, keys: 0, serpent: 'none', visited: false, moved: false }; },
  defaults() {
    return {
      v: 2, planet: 'nyam', unlocked: ['nyam'], planets: {},
      music: true, voice: true, introSeen: false, diff: 4, breakMin: 0, playSec: 0, restUntil: 0,
      stats: {}, ach: {}, newAch: [],
    };
  },
  load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { d = {}; }
    if (!d.v) d = this.migrate(d);
    this.data = Object.assign(this.defaults(), d);
    for (const p of PLANETS) {
      this.data.planets[p.id] = Object.assign(this.planetDefaults(), p.id === 'nyam' ? { level: 1, treats: 5 } : {}, this.data.planets[p.id] || {});
    }
  },
  // Перенос старого сохранения (версия 1) на планету Ням-Ням
  migrate(o) {
    if (!o || !Object.keys(o).length) return {};
    const d = this.defaults();
    d.music = o.music !== false; d.voice = o.voice !== false; d.introSeen = !!o.introSeen;
    d.planets.nyam = Object.assign(this.planetDefaults(), {
      treats: o.treats || 0, level: Math.max(1, o.level || 1), fed: o.fed || 0, beacon: !!o.beacon, visited: true,
      games: { treasure: o.treasure || 0, puzzle: o.puzzle || 0, match3: o.match || 0, route: o.route || 0, catch: o.catch || 0,
        memory: o.memory || 0, simon: o.simon || 0, stars: o.stars || 0, bunny: o.bunny || 0 },
    });
    if (d.planets.nyam.beacon) d.unlocked.push('water');
    return d;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
  addTreats(n) { PS().treats += n; if (n > 0) stat('treats', n); this.save(); },
};

// Текущая планета (описание) и её сохранение
function P() { return PLANET_BY_ID[S.data.planet] || PLANETS[0]; }
function PS(id) { return S.data.planets[id || S.data.planet]; }
// Уровень сложности игры: число побед + сложность из настроек + номер планеты
function GL(key) { return (PS().games[key] || 0) + S.data.diff + P().order; }
function GW(key) {
  const ps = PS(), g = ps.games; g[key] = (g[key] || 0) + 1;
  // в Джунглях, пока Листик похищен, каждая победа приносит ключ
  if (P().special === 'serpent' && ps.serpent === 'kidnapped' && ps.keys < 3) {
    ps.keys++;
    if (typeof G !== 'undefined' && G.toast) setTimeout(() => G.toast('Найден ключ! ' + ps.keys + ' из 3', 'key'), 1600);
  }
  // за каждую победу дракончик этой планеты сам подрастает на 1
  if (ps.level < MAX_LEVEL && ps.serpent !== 'kidnapped' && (ps.level > 0 || ps.visited)) ps.fed++;
  stat('wins', 1); S.save();
}
function stat(k, n) {
  const st = S.data.stats; st[k] = (st[k] || 0) + (n == null ? 1 : n);
  if (typeof Ach !== 'undefined') Ach.check();
}

// Рост дракона. Уровень 0 — яйцо. need — сколько вкусняшек нужно на этом уровне.
const LEVELS = [
  { need: 4, title: 'Яйцо' },
  { need: 5, title: 'Малыш' },
  { need: 6, title: 'Крылышки', skill: 'wings', icon: 'wing', short: 'Летает и ставит щит ракете в «Маршрутах»',
    ability: 'У дракончика выросли крылышки! Теперь он умеет летать и защищает ракету щитом.' },
  { need: 7, title: 'Сияние', skill: 'glow', icon: 'glow', short: 'Подсказывает, где сундук, в «Сокровищах»',
    ability: 'Дракончик научился светиться! Теперь он подсказывает, где спрятан сундук, и освещает лабиринт.' },
  { need: 8, title: 'Огонёк', skill: 'fire', icon: 'fire', short: 'Сжигает целый ряд в «Три в ряд»',
    ability: 'В дракончике зажёгся огонёк! Теперь он умеет сжигать целый ряд вкусняшек.' },
  { need: 9, title: 'Быстрые лапки', skill: 'paws', icon: 'paw', short: 'Быстрее бегает и шире ловит',
    ability: 'У дракончика быстрые лапки! Теперь он быстрее бегает и ловит больше вкусняшек.' },
  { need: 10, title: 'Хвостик-магнит', skill: 'magnet', icon: 'magnet', short: 'Притягивает вкусняшки и звёздочки',
    ability: 'Хвостик стал магнитом! Теперь дракончик притягивает вкусняшки и звёздочки.' },
  { need: 11, title: 'Зоркие глазки', skill: 'eyes', icon: 'eye', short: 'Показывает все карточки в «Найди пару»',
    ability: 'У дракончика зоркие глазки! Он подсказывает в играх на внимание.' },
  { need: 12, title: 'Двойной щит', skill: 'shield2', icon: 'shield', short: 'Два щита в полётах',
    ability: 'Дракончик стал сильнее! Теперь он ставит два щита.' },
  { need: 14, title: 'Большой огонь', skill: 'bigfire', icon: 'bigfire', short: 'Огонь крест-накрест два раза в «Три в ряд»',
    ability: 'Огонь дракончика стал большим! Теперь он сжигает вкусняшки крест-накрест, и два раза.' },
  { need: 0, title: 'Звёздный дракон', skill: 'star', icon: 'star', short: 'Зажигает маяк планеты',
    ability: 'Дракончик стал настоящим Звёздным драконом! Теперь он может зажечь маяк!' },
];
const MAX_LEVEL = 10;
const SKILL_LEVEL = {};
LEVELS.forEach((l, i) => { if (l.skill) SKILL_LEVEL[l.skill] = i; });
function levelNeed(lvl, pid) { const pd = PLANET_BY_ID[pid] || P(); return Math.max(1, Math.round(LEVELS[Math.min(lvl, MAX_LEVEL)].need * pd.mult)); }
function hasAbility(name) {
  if (name === 'big') name = 'star';
  return SKILL_LEVEL[name] != null && PS().level >= SKILL_LEVEL[name];
}

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
    this.stop();
    const ids = this.map && typeof VoiceNorm !== 'undefined' ? VoiceNorm.segment(text, this.map) : null;
    if (!ids) { if (this.miss.length < 200) this.miss.push(text); }
    else if (this.have && ids.every(id => this.have.has(id))) { this.queue = ids.slice(); this.playNext(++this.token); return; }
    this.tts(text);
  },
  playNext(tok) {
    if (tok !== this.token) return;
    const id = this.queue.shift();
    if (!id) { this.cur = null; return; }
    const a = new Audio('voice/' + id + '.mp3');
    this.cur = a;
    a.onended = () => setTimeout(() => this.playNext(tok), 40);
    a.onerror = () => this.playNext(tok);
    a.play().catch(() => { });
  },
  tts(text) {
    try {
      if (window.Android && Android.speak) { Android.speak(text); return; }
      if (window.speechSynthesis) {
        speechSynthesis.cancel();
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
