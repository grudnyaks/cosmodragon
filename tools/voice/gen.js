// Генератор сценария озвучки: собирает все фразы игры, нумерует их и пишет
// web/voice/phrases.json (номер → ключи для поиска) и tools/voice/script.json (для документа).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), JS = path.join(ROOT, 'web', 'js');
const ctx = { console, Math, Date, JSON, window: {}, fetch: () => new Promise(() => {}), localStorage: { getItem() { return null; }, setItem() {} } };
ctx.G = { scenes: {} }; vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8').replace(/^(const|let) /gm, 'var '), ctx);
['state.js', 'planets.js', 'villain.js', 'ach.js', 'scene_home.js', 'scene_rest.js', 'scene_intro.js', 'scene_pop.js', 'scene_stars.js'].forEach(load);
const D = vm.runInContext('({DRAGONS, PLANETS, ACH, ASTRO_PHRASES, ROCKET_PHRASES, REST_TIPS, NYAM_SLIDES, POP_COLORS, NUM_GEN, NUM_WORDS, CONSTELLATIONS, VILLAIN_CHAPTERS, VILLAIN_FINALE, VILLAIN_HIDE, VILLAIN_TAUNTS, VILLAIN_FRIEND})', ctx);
const VoiceNorm = require(path.join(ROOT, 'web', 'js', 'voice_norm.js'));

// Номера фраз постоянные: tools/voice/ids.json (ключ → номер). Новые фразы получают следующий свободный номер раздела.
const IDS_FILE = path.join(__dirname, 'ids.json');
const OLD = fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf8')) : {};
const maxId = {}; for (const k in OLD) { const id = +OLD[k].id, n = Math.floor(id / 1000); maxId[n] = Math.max(maxId[n] || n * 1000, id); }
const out = [], byKey = {};
let sec = null, sub = null;
function section(n, title) { sec = { n, title, subs: [] }; out.push(sec); }
function newId(n) { maxId[n] = (maxId[n] || n * 1000) + 1; return String(maxId[n]).padStart(4, '0'); }
function group(title) { sub = { title, items: [] }; sec.subs.push(sub); }
// add(текст для актёра, {role, note, keys: [доп. ключи], game: текст как в игре})
function add(text, o = {}) {
  const game = o.game || text;
  const k = VoiceNorm.norm(game);
  if (byKey[k]) return byKey[k];
  const old = OLD[k], it = { id: old ? old.id : newId(sec.n), isNew: !old, role: o.role || 'Рассказчик', text, note: o.note || '', keys: [k].concat((o.keys || []).map(VoiceNorm.norm)) };
  for (const kk of it.keys) byKey[kk] = it;
  sub.items.push(it); return it;
}
const CHUNK = 'Кусочек: дальше подставится ';
const SH = 'Змей Шипун', SHN = 'Шипит, тянет «ш-ш-ш»';
const DR = D.DRAGONS;

// ===== 1. История =====
section(1, 'История');
group('Вступление');
D.NYAM_SLIDES.forEach(s => add(s.text));

// ===== 2. Главный экран =====
section(2, 'Главный экран');
group('Дракончики');
add('Дракончики хотят кушать! Нажми на угощение.');
add('Поиграй в игры, чтобы найти вкусняшки для дракончиков!');
add('Угощение закончилось! Поиграй в игры, чтобы найти ещё.');
DR.forEach(d => add(d.name + ' любит, когда его гладят!'));
group('Космонавт');
D.ASTRO_PHRASES.forEach(t => add(t, { role: 'Космонавт' }));
group('Ракета');
add('Три! Два! Один! Пуск!', { role: 'Бортовой компьютер' });
D.ROCKET_PHRASES.forEach(t => add(t, { role: 'Бортовой компьютер' }));
group('Шипун рядом');
add('Ой! Кто это шипит в пещере?');
add('Шипун держит дракончиков в Тёмной пещере!', { note: 'Дальше — «Выигрывай игры и найди три ключа…»' });
add('Все ключи найдены! Нажми на красную кнопку, чтобы спасти дракончиков!');
for (const w of ['Дракошу', 'Пушка', 'Дракошу и Пушка']) add('Выигрывай игры и найди три ключа, чтобы спасти ' + w + '!');

// ===== 3. Мини-игры: собираются из кода автоматически =====
section(3, 'Мини-игры');
const GAME_FILES = [['scene_treasure.js', 'Сокровища'], ['scene_puzzle.js', 'Пазлы'], ['scene_catch.js', 'Лови вкусняшки'],
  ['scene_memory.js', 'Найди пару'], ['scene_bowling.js', 'Конфетный боулинг'], ['scene_maze.js', 'Лабиринт'], ['scene_pop.js', 'Пузырьки'], ['scene_fishing.js', 'Рыбалка'],
  ['scene_simon.js', 'Поющие кристаллы'], ['scene_stars.js', 'Звёздные дорожки'], ['scene_bunny.js', 'Космо-зайчики'], ['scene_tower.js', 'Облачная башня']];
function literals(file) {
  const src = fs.readFileSync(path.join(JS, file), 'utf8'), res = [];
  let i = 0;
  while ((i = src.indexOf('Voice.say(', i)) >= 0) {
    let j = i + 10, depth = 1;
    while (depth && j < src.length) { const c = src[j]; if (c === "'") { j = src.indexOf("'", j + 1); } else if (c === '(') depth++; else if (c === ')') depth--; j++; }
    const arg = src.slice(i + 10, j - 1);
    for (const m of arg.matchAll(/'([^']*)'/g)) { const t = m[1].trim(); if (/[А-Яа-яЁё]/.test(t) && /^[А-ЯЁ]/.test(t) && /[.!?]$/.test(t)) res.push(t); }
    i = j;
  }
  for (const m of src.matchAll(/this\.win\('([^']*)'\)/g)) res.push(m[1]);
  for (const m of src.matchAll(/(?:this\.say|const say) = ([^;]*);/g)) for (const q of m[1].matchAll(/'([^']*)'/g)) { const t = q[1].trim(); if (/^[А-ЯЁ]/.test(t) && /[.!?]$/.test(t)) res.push(t); }
  return res;
}
for (const [f, title] of GAME_FILES) {
  group(title);
  for (const t of literals(f)) add(t);
  if (f === 'scene_pop.js') {
    add('Теперь новое задание!');
    D.POP_COLORS.forEach(c => add('Лопай ' + c[1] + ' пузыри!'));
    for (let n = 1; n <= 9; n++) add('Лопай пузыри с ' + D.NUM_GEN[n] + (n === 1 ? ' точкой!' : ' точками!'));
    add('Лопай пузыри с цифрой…', { game: 'Лопай пузыри с цифрой', note: CHUNK + 'число' });
  }
  if (f === 'scene_stars.js') D.CONSTELLATIONS.forEach(c => add('Ура! Это ' + c.name + '!'));
}
const NUMS = D.NUM_WORDS;
group('Числа для счёта (1–15)');
for (let n = 1; n <= 15; n++) add(NUMS[n] + '.', { game: NUMS[n], keys: [String(n)], note: String(n) });

// ===== 6. Змей Шипун =====
section(6, 'Змей Шипун');
D.VILLAIN_CHAPTERS.forEach((c, i) => {
  group('Глава ' + (i + 1) + '. ' + c.title);
  add(c.say, { role: SH, note: 'Похитил. ' + SHN });
  add(c.lose, { role: SH, note: 'Проиграл' });
});
group('Финал: Шипун становится другом');
D.VILLAIN_FINALE.forEach(f => add(f.text, { role: f.who === 'villain' ? SH : 'Рассказчик', note: f.who === 'villain' ? 'Грустно, потом радостно' : '' }));
group('После финала: прятки');
D.VILLAIN_HIDE.say.forEach(t => add(t, { role: SH, note: 'Весело, по-дружески' }));
D.VILLAIN_HIDE.lose.forEach(t => add(t, { role: SH, note: 'Весело' }));
group('Шипун в пещере (если постучать)');
D.VILLAIN_TAUNTS.forEach(t => add(t, { role: SH, note: 'Злорадно' }));
D.VILLAIN_FRIEND.forEach(t => add(t, { role: SH, note: 'Дружелюбно' }));
add('Ш-ш-ш! Сначала найди три ключа!', { role: SH });
add('Ш-ш-ш! Ключи нашлись? Ну попробуй, отбери дракончиков!', { role: SH });
group('Пещера и книга Шипуна');
add('Шипун утащил Дракошу в Тёмную пещеру.', { note: 'Дальше — «Выигрывай игры…»' });
add('Шипун утащил Пушка в Тёмную пещеру.', { note: 'Дальше — «Выигрывай игры…»' });
add('Шипун утащил обоих дракончиков в Тёмную пещеру.', { note: 'Дальше — «Выигрывай игры…»' });
add('Это книга Шипуна. Нажми на главу, чтобы вспомнить, как всё было.');
add('Это книга Шипуна. Главы появятся, когда ты спасёшь дракончиков.');
add('Эта глава ещё впереди!');
group('Спасение дракончиков');
for (const t of literals('scene_rescue.js')) add(t);
for (const t of ['Шипун опутал дракончика лакричными верёвками! Нажимай на верёвки, чтобы их порвать. Быстрее, пока Шипун не вернулся!',
  'Шипун опутал дракончиков лакричными верёвками! Нажимай на верёвки, чтобы их порвать. Быстрее, пока Шипун не вернулся!',
  'Шипун прячет дракончика под кустиками! Следи внимательно и найди, где дракончик.', 'Шипун прячет дракончиков под кустиками! Следи внимательно и найди, где они.',
  'Ура! Все верёвки порваны!', 'Ура! Ты перехитрил Шипуна!', 'Дракончик свободен!', 'Дракончики свободны!', 'Нашёл! Но Шипун снова прячет его!', 'Нашёл! Но Шипун снова прячет их!',
  'Ты настоящий герой!']) add(t);

// ===== 5. Перерыв и достижения =====
section(5, 'Перерыв и достижения');
group('Перерыв'); for (const t of literals('scene_rest.js')) add(t);
D.REST_TIPS.forEach(t => add(t));
group('Достижения: названия и описания');
const spell = t => t.replace('во всех 12 играх', 'во всех двенадцати играх').replace(/\b1500\b/, 'тысячу пятьсот').replace(/\b500\b/, 'пятьсот').replace(/\b300\b/, 'триста').replace(/\b200\b/, 'двести').replace(/\b100\b/, 'сто').replace(/\b50\b/, 'пятьдесят').replace(/\b20\b/, 'двадцать').replace(/\b(\d+)\b/g, m => D.NUM_WORDS[+m] || m);
D.ACH.forEach(a => { add(a.title + (/[!.]$/.test(a.title) ? '' : '.')); add(spell(a.desc) + '.', { game: a.desc + '.' }); });

const all = out.flatMap(s => s.subs.flatMap(g => g.items));
fs.mkdirSync(path.join(ROOT, 'web', 'voice'), { recursive: true });
const map = {}; for (const it of all) for (const k of it.keys) map[k] = it.id;
fs.writeFileSync(path.join(ROOT, 'web', 'voice', 'phrases.json'), JSON.stringify(map));
fs.writeFileSync(path.join(__dirname, 'script.json'), JSON.stringify(out, null, 1));
const nowIds = new Set(all.map(i => i.id)), removed = [];
for (const k in OLD) if (!nowIds.has(OLD[k].id) && !removed.some(r => r.id === OLD[k].id)) removed.push(OLD[k]);
removed.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(__dirname, 'changes.json'), JSON.stringify({ added: all.filter(i => i.isNew).map(i => ({ id: i.id, text: i.text, role: i.role })), removed }, null, 1));
if (process.argv.includes('--save-ids')) { const ids = { ...OLD }; for (const it of all) ids[it.keys[0]] = { id: it.id, text: it.text }; fs.writeFileSync(IDS_FILE, JSON.stringify(ids)); }
console.log('added', all.filter(i => i.isNew).length, 'removed', removed.length);
console.log('phrases:', all.length, out.map(s => s.n + ':' + s.subs.reduce((a, g) => a + g.items.length, 0)).join(' '));
