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
  // как segment, но неизвестные слова (например, своё имя дракончика) идут кусочком для синтезатора речи
  segmentMixed(text, map) {
    const t = this.norm(text).split(' ').filter(Boolean), n = t.length;
    if (!n) return [];
    const best = new Array(n + 1).fill(null); best[n] = { c: 0, list: [] };
    for (let i = n - 1; i >= 0; i--) {
      let key = '';
      for (let j = i; j < n && j < i + 60; j++) {
        key = key ? key + ' ' + t[j] : t[j];
        const id = map[key];
        if (id && best[j + 1] && (!best[i] || best[j + 1].c + 1 < best[i].c)) best[i] = { c: best[j + 1].c + 1, list: [{ id }].concat(best[j + 1].list) };
      }
      const nx = best[i + 1];
      if (nx) {
        const head = nx.list[0], list = head && head.tts ? [{ tts: t[i] + ' ' + head.tts }].concat(nx.list.slice(1)) : [{ tts: t[i] }].concat(nx.list);
        const c = nx.c + (head && head.tts ? 20 : 40);
        if (!best[i] || c < best[i].c) best[i] = { c, list };
      }
    }
    return best[0].list;
  },
};
if (typeof module !== 'undefined') module.exports = VoiceNorm;
