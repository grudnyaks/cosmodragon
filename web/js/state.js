// Сохранение игры, уровни дракончика, озвучка
'use strict';
const KEY = 'cosmodragon.save.v1';
const S = {
  data: null,
  defaults: {
    treats: 5, level: 1, fed: 0, name: 'Дракоша', introSeen: false,
    puzzle: 0, route: 0, match: 0, treasure: 0, music: true, voice: true, beacon: false,
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

// Рост дракончика: сколько вкусняшек нужно скормить, чтобы перейти на следующий уровень
const LEVELS = [
  null,
  { need: 6, title: 'Малыш', ability: '' },
  { need: 12, title: 'Крылышки', ability: 'Ура! Дракоша вырос, и у него выросли крылышки! Теперь он умеет летать и защищает ракету от метеоритов.' },
  { need: 20, title: 'Сияние', ability: 'Ура! Дракоша вырос и научился светиться! Теперь он подсказывает, где спрятан сундук.' },
  { need: 30, title: 'Огонёк', ability: 'Ура! В Дракоше зажёгся огонёк! Теперь он умеет дышать волшебным огнём.' },
  { need: 0, title: 'Большой дракон', ability: 'Ура! Дракоша стал большим и сильным драконом! Он может зажечь Звёздный маяк!' },
];
const MAX_LEVEL = 5;
function hasAbility(name) {
  const l = S.data.level;
  return (name === 'wings' && l >= 2) || (name === 'glow' && l >= 3) || (name === 'fire' && l >= 4) || (name === 'big' && l >= 5);
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
