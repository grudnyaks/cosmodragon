// Обучение: буквы и цифры, прогресс ребёнка и адаптивный подбор заданий
'use strict';
// Буквы: как называть, слово-пример, картинка. Порядок — как учат в детском саду:
// сначала гласные, потом самые частые согласные.
const LETTERS = {
  'А': ['а', 'Арбуз', '🍉'], 'О': ['о', 'Облако', '☁️'], 'У': ['у', 'Утка', '🦆'], 'И': ['и', 'Индюк', '🦃'], 'Ы': ['ы', 'сЫр', '🧀'], 'Э': ['э', 'Эскимо', '🍦'],
  'М': ['эм', 'Мяч', '⚽'], 'П': ['пэ', 'Пингвин', '🐧'], 'Б': ['бэ', 'Банан', '🍌'], 'Т': ['тэ', 'Тигр', '🐯'], 'Д': ['дэ', 'Дракон', '🐉'], 'Н': ['эн', 'Носорог', '🦏'],
  'Л': ['эль', 'Лиса', '🦊'], 'Р': ['эр', 'Ракета', '🚀'], 'С': ['эс', 'Слон', '🐘'], 'К': ['ка', 'Кот', '🐱'], 'Г': ['гэ', 'Гриб', '🍄'], 'В': ['вэ', 'Волк', '🐺'],
  'З': ['зэ', 'Заяц', '🐰'], 'Я': ['я', 'Яблоко', '🍎'], 'Е': ['е', 'Енот', '🦝'], 'Ё': ['ё', 'Ёжик', '🦔'], 'Ю': ['ю', 'Юла', '🪀'], 'Ж': ['жэ', 'Жук', '🪲'],
  'Ш': ['ша', 'Шарик', '🎈'], 'Х': ['ха', 'Хлеб', '🍞'], 'Ф': ['эф', 'Флаг', '🚩'], 'Ц': ['цэ', 'Цыплёнок', '🐥'], 'Ч': ['че', 'Черепаха', '🐢'], 'Щ': ['ща', 'Щенок', '🐶'],
  'Й': ['и краткое', 'Йогурт', '🥛'], 'Ь': ['мягкий знак', 'конь', '🐴'], 'Ъ': ['твёрдый знак', 'подъезд', '🏠'],
};
const LETTER_ORDER = Object.keys(LETTERS);
const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const NUM_NOM = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];

const Learn = {
  data() {
    const d = S.data;
    if (!d.learn) d.learn = { L: {}, N: {}, openL: 6, openN: 4, sessions: 0 };
    return d.learn;
  },
  rec(kind, key) { const m = this.data()[kind]; return m[key] || (m[key] = { ok: 0, bad: 0, seen: 0 }); },
  // уровень знания: 0 — не знает, 3 — уверенно
  mastery(kind, key) { const r = this.data()[kind][key]; if (!r) return 0; return Math.max(0, Math.min(3, r.ok - r.bad * 0.7)); },
  known(kind, key) { return this.mastery(kind, key) >= 3; },
  pool(kind) { const d = this.data(); return kind === 'L' ? LETTER_ORDER.slice(0, d.openL) : NUMBERS.slice(0, d.openN + 1); },
  answer(kind, key, ok) {
    const r = this.rec(kind, key);
    if (ok) r.ok++; else r.bad++;
    // если почти всё открытое уже знакомо — открываем новые буквы/цифры
    const d = this.data(), pool = this.pool(kind);
    const good = pool.filter(k => this.mastery(kind, k) >= 2).length;
    if (good >= pool.length - 1) {
      if (kind === 'L' && d.openL < LETTER_ORDER.length) { d.openL = Math.min(LETTER_ORDER.length, d.openL + 3); return 'new'; }
      if (kind === 'N' && d.openN < 10) { d.openN = Math.min(10, d.openN + 2); return 'new'; }
    }
    S.save();
  },
  // взвешенный выбор: чаще то, что ребёнок знает хуже (интервальное повторение)
  pick(kind, exclude) {
    const pool = this.pool(kind).filter(k => !(exclude || []).includes(k));
    const w = pool.map(k => 4 - this.mastery(kind, k) + (this.rec(kind, k).seen ? 0 : 1));
    let s = w.reduce((a, b) => a + b, 0) * Math.random();
    for (let i = 0; i < pool.length; i++) { s -= w[i]; if (s <= 0) return pool[i]; }
    return pool[pool.length - 1];
  },
  letterSay(L) { const x = LETTERS[L]; return 'Буква ' + x[0] + '. ' + x[1] + '.'; },
};
