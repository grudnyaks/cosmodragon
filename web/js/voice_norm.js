// Озвучка записанным голосом: нормализация текста и разбиение фразы на записанные кусочки.
// Общий код для игры и для генератора сценария (tools/voice/gen.js).
'use strict';
var VoiceNorm = {
  norm(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е')
      .replace(/[«»"“”.,!?:;…()]/g, ' ').replace(/(^|\s)[—–-]+(?=\s|$)/g, ' ')
      .replace(/\s+/g, ' ').trim();
  },
  // map: ключ → номер файла. Возвращает список номеров (наименьшее число кусочков) или null
  segment(text, map) {
    const t = this.norm(text).split(' ').filter(Boolean), n = t.length;
    if (!n) return [];
    const best = new Array(n + 1).fill(null); best[n] = [];
    for (let i = n - 1; i >= 0; i--) {
      let key = '';
      for (let j = i; j < n && j < i + 60; j++) {
        key = key ? key + ' ' + t[j] : t[j];
        const id = map[key];
        if (id && best[j + 1] && (!best[i] || best[j + 1].length + 1 < best[i].length)) best[i] = [id].concat(best[j + 1]);
      }
    }
    return best[0];
  },
};
if (typeof module !== 'undefined') module.exports = VoiceNorm;
