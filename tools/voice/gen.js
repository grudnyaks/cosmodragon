// Генератор сценария озвучки: собирает все фразы игры, нумерует их и пишет
// web/voice/phrases.json (номер → ключи для поиска) и tools/voice/script.json (для документа).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), JS = path.join(ROOT, 'web', 'js');
const ctx = { console, Math, Date, JSON, window: {}, fetch: () => new Promise(() => {}), localStorage: { getItem() { return null; }, setItem() {} } };
ctx.G = { scenes: {} }; vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8').replace(/^(const|let) /gm, 'var '), ctx);
['state.js', 'planets.js', 'learn.js', 'ach.js', 'scene_home.js', 'scene_rest.js', 'scene_intro.js', 'scene_pop.js', 'scene_stars.js', 'scene_pixel.js'].forEach(load);
const D = vm.runInContext('({LEVELS, PLANETS, LETTERS, LETTER_ORDER, VOWELS, READ_WORDS, NUM_NOM, ACH, ASTRO_PHRASES, ROCKET_PHRASES, REST_TIPS, NYAM_SLIDES, POP_COLORS, NUM_GEN, CONSTELLATIONS, PIXEL_PICS: typeof PIXEL_PICS !== "undefined" ? PIXEL_PICS : null, numWord, tensWord, NUM_UNITS})', ctx);
const VoiceNorm = require(path.join(ROOT, 'web', 'js', 'voice_norm.js'));

const out = [], byKey = {};
let sec = null, sub = null, next = 0;
function section(n, title) { sec = { n, title, subs: [] }; out.push(sec); next = n * 1000 + 1; }
function group(title) { sub = { title, items: [] }; sec.subs.push(sub); }
// add(текст для актёра, {role, note, keys: [доп. ключи], game: текст как в игре})
function add(text, o = {}) {
  const game = o.game || text;
  const k = VoiceNorm.norm(game);
  if (byKey[k]) return byKey[k];
  const it = { id: String(next++).padStart(4, '0'), role: o.role || 'Рассказчик', text, note: o.note || '', keys: [k].concat((o.keys || []).map(VoiceNorm.norm)) };
  for (const kk of it.keys) byKey[kk] = it;
  sub.items.push(it); return it;
}
const CHUNK = 'Кусочек: дальше подставится ';
const P = D.PLANETS, NUMW = n => D.numWord(n);

// ===== 1. История и планеты =====
section(1, 'История и планеты');
group('Вступление: планета Ням-Ням');
D.NYAM_SLIDES.forEach(s => add(s.text));
for (const p of P.slice(1)) { group('Прилёт: ' + p.name); p.intro.forEach(t => add(t)); add(p.beaconText, { note: 'Когда зажёгся маяк' }); }
group('Маяк и карта галактики');
add('Маяк зажёгся! Все звёзды вернулись на небо. Луч маяка показал путь к новой планете!', { note: 'Маяк планеты Ням-Ням' });
add('Это карта галактики. Нажми на планету, чтобы полететь туда.');
add('Нажми на неё, чтобы полететь.', { note: 'Звучит после «Смотри! Луч маяка ведёт…»' });
add('Ты зажёг все маяки галактики! Ура!');
for (const p of P.slice(1)) add('Смотри! Луч маяка ведёт к планете ' + p.name + '!');
for (const p of P.slice(1)) add('Открылась планета ' + p.name + '!');
for (const p of P.slice(1)) add('Нажми «Лететь дальше», чтобы отправиться на планету ' + p.name + '!');
for (const p of P) add('Летим на планету ' + p.name + '!');
P.slice(1).forEach((p, i) => { add('Планета ' + p.name + ' пока закрыта.'); });
P.slice(0, -1).forEach(p => add('Вырасти дракона ' + p.of + ' и зажги там маяк!'));

// ===== 2. Дом: дракон, космонавт, ракета =====
section(2, 'Главный экран');
group('Имена дракончиков (отдельно, ровным голосом)');
P.forEach(p => add(p.dragon.name + '.', { game: p.dragon.name, note: 'Имя ставится перед кусочками ниже' }));
group('Привет и кормление');
P.forEach(p => add('Привет, ' + p.dragon.name + '!'));
P.forEach(p => add('Его можно покормить угощением ' + p.of + '.'));
add('…хочет кушать!', { game: 'хочет кушать!', note: CHUNK.replace('дальше', 'перед ним') + 'имя дракончика' });
add('Нажми на угощение.');
add('Угощение закончилось! Поиграй в игры, чтобы найти ещё.');
group('Яйцо и вылупление');
add('Согрей яйцо! Нажми на кнопку с угощением.');
add('Поиграй в игры, чтобы найти угощение для яйца!');
['Тук-тук! Кто там?', 'Яйцо шевелится!', 'Скоро вылупится!', 'Ой! Яйцо трещит!'].forEach(t => add(t));
P.forEach(p => add('Ура! Вылупился ' + p.dragon.name + '! Привет, малыш!'));
group('Рост и умения');
add('…подрос, пока ты играл!', { game: 'подрос, пока ты играл!', note: 'Перед ним — имя дракончика' });
P.forEach(p => add(p.dragon.name + ' вырос!'));
D.LEVELS.filter(l => l.ability).forEach(l => add(l.ability, { note: 'Звучит после «… вырос!»' }));
group('Маяк');
add('Маяк сияет! Его луч показывает путь к новой планете.');
add('Маяк погас. Вырасти дракончика до десятого уровня, и он его зажжёт!');
add('Полетели к маяку!', { role: 'Космонавт' });
add('…зажёг маяк своей планеты издалека!', { game: 'зажёг маяк своей планеты издалека!', note: 'Перед ним — имя дракончика' });
group('Все драконы на Ням-Ням');
add('…полетел в гости на планету Ням-Ням!', { game: 'полетел в гости на планету Ням-Ням!', note: 'Перед ним — имя дракончика' });
add('Там он будет жить со всеми драконами.');
add('…вернулся домой!', { game: 'вернулся домой!', note: 'Перед ним — имя дракончика' });
add('…сейчас в гостях на планете Ням-Ням.', { game: 'сейчас в гостях на планете Ням-Ням.', note: 'Перед ним — имя дракончика' });
add('Можно вернуть его домой кнопкой.');
add('Ура! …', { game: 'Ура!', note: 'Отдельное «Ура!»; дальше — имя и «прилетел на Ням-Ням»' });
add('…прилетел на Ням-Ням!', { game: 'прилетел на Ням-Ням!', note: 'Перед ним — имя дракончика' });
add('Ура! Драконы прилетели на Ням-Ням!');
add('Все вылупившиеся драконы уже здесь, на Ням-Ням!');
add('Пока некого перевезти. Вырасти дракончиков на других планетах!');
add('Сначала дракончик должен вылупиться!');
add('Сейчас нельзя.');
group('Космонавт');
D.ASTRO_PHRASES.forEach(t => add(t, { role: 'Космонавт' }));
P.forEach(p => add('На планете ' + p.name + ' так интересно!', { role: 'Космонавт' }));
group('Ракета');
add('Три! Два! Один! Пуск!', { role: 'Бортовой компьютер' });
D.ROCKET_PHRASES.forEach(t => add(t, { role: 'Бортовой компьютер' }));
group('Воришка (планета Радуга)');
['Хи-хи-хи! Сейчас стащу вкусняшки!', 'Хи-хи-хи! Мои вкусняшки! Догони, если сможешь!', 'Ой-ой! Убегаю!', 'Не трогай мои вкусняшки! Ой, то есть твои!', 'Эх, поймали!'].forEach(t => add(t, { role: 'Воришка', note: 'Хитро, с хихиканьем' }));
add('Ура! Ты отобрал вкусняшки обратно!');
group('Змей (планета Джунгария)');
add('Ой! Кто это шипит в кустах?');
add('Злой Змей схватил Листика! Нужно его спасти! Выигрывай игры в джунглях и найди три ключа.');
add('Листика похитил Змей! Выигрывай игры, чтобы найти три ключа.');
add('Листика нет дома! Его похитил Змей. Найди три ключа, чтобы его спасти!');
add('Все ключи найдены! Нажми на кнопку, чтобы спасти Листика!');

// ===== 3. Мини-игры: собираются из кода автоматически =====
section(3, 'Мини-игры');
const GAME_FILES = [['scene_treasure.js', 'Сокровища'], ['scene_puzzle.js', 'Пазлы'], ['scene_match3.js', 'Три в ряд'], ['scene_route.js', 'Маршруты'], ['scene_catch.js', 'Лови вкусняшки'],
  ['scene_memory.js', 'Найди пару'], ['scene_simon.js', 'Поющие кристаллы'], ['scene_stars.js', 'Звёздные дорожки'], ['scene_bunny.js', 'Космо-зайчики'], ['scene_bowling.js', 'Боулинг'],
  ['scene_maze.js', 'Лабиринт'], ['scene_flyer.js', 'Полёт'], ['scene_pop.js', 'Пузырьки'], ['scene_sort.js', 'Сортировка'], ['scene_fishing.js', 'Рыбалка'], ['scene_catapult.js', 'Катапульта'],
  ['scene_tower.js', 'Облачная башня'], ['scene_iceslide.js', 'Ледяная горка'], ['scene_pixel.js', 'Раскраска по цифрам'], ['scene_snake.js', 'Змейка Лиана'], ['scene_serpent.js', 'Битва со Змеем']];
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
    add('Лопай пузыри с цифрой…', { game: 'Лопай пузыри с цифрой', note: CHUNK + 'цифра' });
  }
  if (f === 'scene_sort.js') ['по цвету', 'одинаковые к одинаковым', 'по количеству: сколько вкусняшек, такая и цифра'].forEach(h => add('Разложи всё по корзинкам: ' + h + '!'));
  if (f === 'scene_bowling.js') add('Смахни шар пальцем вверх и сбей кегли!');
  if (f === 'scene_bowling.js') add('Нужно сбить…', { game: 'Нужно сбить', note: CHUNK + 'число кеглей' });
  if (f === 'scene_stars.js') D.CONSTELLATIONS.forEach(c => add('Ура! Это ' + c.name + '!'));
  if (f === 'scene_pixel.js') { (D.PIXEL_PICS || []).forEach(c => add('Ура! Это ' + c.name + '!')); add('Какая красота!'); }
  if (f === 'scene_snake.js') add('В стенки не врезайся!');
}

// ===== 4. Школа дракона =====
section(4, 'Школа дракона');
group('Общие фразы школы');
['Правильно!', 'Молодец!', 'Здорово!', 'Не совсем. Попробуй ещё!'].forEach(t => add(t));
['Ура, я запомнил!', 'Спасибо, учитель!'].forEach(t => add(t, { role: 'Дракончик' }));
for (const f of ['scene_school.js', 'scene_trace.js', 'scene_read.js', 'scene_hundred.js']) for (const t of literals(f)) add(t);
group('Вопросы с подстановкой');
[['Научи меня: где буква…', 'буква (её название)', 'Дракончик'], ['С какой буквы начинается слово…', 'слово'], ['Где цифра…', 'цифра'], ['Здесь…', 'число'],
 ['Напиши букву…', 'буква'], ['Напиши цифру…', 'цифра'], ['Ты написал букву…', 'буква'], ['Ты написал цифру…', 'цифра'],
 ['Это буква…', 'буква'], ['Новая буква…', 'буква'], ['Найди слог…', 'слог'], ['Это слово…', 'слово'], ['Вот он светится…', 'слог'],
 ['Найди число…', 'число'], ['Какое число идёт после…', 'число'], ['Теперь будем считать до…', 'число'], ['Откроется, когда дракончик вырастет до уровня…', 'число']]
  .forEach(([t, what, role]) => add(t, { game: t.replace('…', ''), note: CHUNK + what, role }));
['Начни с зелёной точки!', 'Дальше — стрелка.', 'Давай читать слоги!', 'Нажми на любую гласную — и они встретятся!', 'Собери с ней слоги!', 'Где эта картинка?', 'Давай посчитаем!', 'Ты умеешь читать!', 'Здорово считаешь!'].forEach(t => add(t));
group('Буквы: «Буква А» (33)');
D.LETTER_ORDER.forEach(L => add('Буква ' + D.LETTERS[L][0] + '.', { note: L }));
group('Названия букв отдельно (33)');
D.LETTER_ORDER.forEach(L => add(D.LETTERS[L][0] + '.', { game: D.LETTERS[L][0], note: L + ' — для подстановки' }));
group('Слова к буквам (33)');
D.LETTER_ORDER.forEach(L => add(D.LETTERS[L][1].charAt(0).toUpperCase() + D.LETTERS[L][1].slice(1).toLowerCase() + '.', { note: 'К букве ' + L }));
group('Цифры: «Цифра один» (10)');
for (let n = 1; n <= 10; n++) add('Цифра ' + D.NUM_NOM[n] + '.');
group('Числа от 0 до 100 (101)');
for (let n = 0; n <= 100; n++) add(NUMW(n) + '.', { game: NUMW(n), keys: [String(n)], note: String(n) });
group('Десятки в сотенной таблице');
for (let t = 1; t <= 9; t++) { add('Это ' + D.tensWord(t) + '.'); add('Это ' + D.tensWord(t) + ' и…', { game: 'Это ' + D.tensWord(t) + ' и', note: CHUNK + 'единицы' }); }
add('Это десять десятков!');
group('Слоги');
const cons = D.LETTER_ORDER.filter(L => !D.VOWELS.includes(L) && !'ЬЪЙЕЁЮЯ'.includes(L)), syl = [];
for (const c of cons) for (const v of D.VOWELS) { const s = c + v; if (/[КГХЖШЧЩ]Ы/.test(s)) continue; syl.push(s); }
for (const w of D.READ_WORDS) for (const s of w.syl) if (!syl.includes(s)) syl.push(s);
syl.forEach(s => add(s.toLowerCase() + '!', { game: s.toLowerCase() }));
group('Слова для чтения (22)');
D.READ_WORDS.forEach(w => add(w.word.charAt(0) + w.word.slice(1).toLowerCase() + '!', { game: w.word.toLowerCase() }));

// ===== 5. Отдых, умения, достижения =====
section(5, 'Отдых, умения, достижения');
for (const [f, title] of [['scene_rest.js', 'Перерыв'], ['scene_skills.js', 'Умения дракончика']]) { group(title); for (const t of literals(f)) add(t); }
group('Перерыв: зарядка'); D.REST_TIPS.forEach(t => add(t));
group('Умения: названия и описания');
D.LEVELS.filter(l => l.skill).forEach(l => { add(l.title + '.'); add(l.short + '.'); });
group('Достижения: названия и описания');
const spell = t => t.replace('до 5 уровня', 'до пятого уровня').replace('до 10 уровня', 'до десятого уровня').replace(/\b1500\b/, 'тысячу пятьсот').replace(/\b500\b/, 'пятьсот').replace(/\b300\b/, 'триста').replace(/\b200\b/, 'двести').replace(/\b\d+\b/g, m => D.numWord(+m));
D.ACH.forEach(a => { add(a.title + (/[!.]$/.test(a.title) ? '' : '.')); add(spell(a.desc) + '.', { game: a.desc + '.' }); });

const all = out.flatMap(s => s.subs.flatMap(g => g.items));
fs.mkdirSync(path.join(ROOT, 'web', 'voice'), { recursive: true });
const map = {}; for (const it of all) for (const k of it.keys) map[k] = it.id;
fs.writeFileSync(path.join(ROOT, 'web', 'voice', 'phrases.json'), JSON.stringify(map));
fs.writeFileSync(path.join(__dirname, 'script.json'), JSON.stringify(out, null, 1));
console.log('phrases:', all.length, out.map(s => s.n + ':' + s.subs.reduce((a, g) => a + g.items.length, 0)).join(' '));
