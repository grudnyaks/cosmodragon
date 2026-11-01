// Сохранение игры, уровни дракончика, озвучка
'use strict';
const KEY = 'cosmodragon.save.v1';
const S = {
  data: null,
  defaults: {
    treats: 5, level: 1, fed: 0, name: 'Дракоша', introSeen: false,
    puzzle: 0, route: 0, match: 0, treasure: 0, catch: 0, memory: 0, simon: 0, stars: 0, bunny: 0, best: {}, music: true, voice: true, beacon: false,
  },
  load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { d = {}; }
    this.data = Object.assign({}, this.defaults, d);
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
  addTreats(n) { this.data.treats += n; this.save(); },
};
S.load();

// Рост дракончика. need — сколько вкусняшек скормить на этом уровне, чтобы вырасти.
// skill — умение, которое открывается на этом уровне; оно помогает в играх.
const LEVELS = [
  null,
  { need: 10, title: 'Малыш' },
  { need: 15, title: 'Крылышки', skill: 'wings', icon: 'wing', short: 'Летает и ставит щит ракете в «Маршрутах»',
    ability: 'Ура! У Дракоши выросли крылышки! Теперь он умеет летать и защищает ракету щитом от метеоритов.' },
  { need: 22, title: 'Сияние', skill: 'glow', icon: 'glow', short: 'Подсказывает, где сундук, в «Сокровищах»',
    ability: 'Ура! Дракоша научился светиться! Теперь он подсказывает, где спрятан сундук.' },
  { need: 30, title: 'Огонёк', skill: 'fire', icon: 'fire', short: 'Сжигает целый ряд в «Три в ряд»',
    ability: 'Ура! В Дракоше зажёгся огонёк! Теперь он умеет сжигать целый ряд вкусняшек.' },
  { need: 40, title: 'Быстрые лапки', skill: 'paws', icon: 'paw', short: 'Быстрее бегает и шире ловит в «Лови вкусняшки»',
    ability: 'Ура! У Дракоши быстрые лапки! Теперь он быстрее бегает и ловит больше вкусняшек.' },
  { need: 50, title: 'Хвостик-магнит', skill: 'magnet', icon: 'magnet', short: 'Притягивает вкусняшки и звёздочки',
    ability: 'Ура! Звёздочка на хвосте стала магнитом! Теперь Дракоша притягивает вкусняшки и звёздочки.' },
  { need: 60, title: 'Зоркие глазки', skill: 'eyes', icon: 'eye', short: 'Показывает все карточки в «Найди пару»',
    ability: 'Ура! У Дракоши зоркие глазки! В игре «Найди пару» он на секунду покажет все карточки.' },
  { need: 70, title: 'Двойной щит', skill: 'shield2', icon: 'shield', short: 'Два щита для ракеты в «Маршрутах»',
    ability: 'Ура! Дракоша стал сильнее! Теперь он ставит ракете два щита.' },
  { need: 85, title: 'Большой огонь', skill: 'bigfire', icon: 'bigfire', short: 'Огонь крест-накрест два раза в «Три в ряд»',
    ability: 'Ура! Огонь Дракоши стал большим! Теперь он сжигает вкусняшки крест-накрест, и два раза.' },
  { need: 0, title: 'Звёздный дракон', skill: 'star', icon: 'star', short: 'Зажигает Звёздный маяк',
    ability: 'Ура! Дракоша стал настоящим Звёздным драконом! Теперь он может зажечь Звёздный маяк!' },
];
const MAX_LEVEL = 10;
const SKILL_LEVEL = {};
LEVELS.forEach((l, i) => { if (l && l.skill) SKILL_LEVEL[l.skill] = i; });
function hasAbility(name) {
  if (name === 'big') name = 'star';
  return SKILL_LEVEL[name] != null && S.data.level >= SKILL_LEVEL[name];
}

// Озвучка текста (Android TTS через мост, иначе браузерная)
const Voice = {
  say(text) {
    if (!S.data.voice || !text) return;
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
    try {
      if (window.Android && Android.stopSpeak) Android.stopSpeak();
      else if (window.speechSynthesis) speechSynthesis.cancel();
    } catch (e) { }
  },
};
