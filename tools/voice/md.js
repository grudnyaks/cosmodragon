const S = require('./script.json'), ID = it => it.isNew ? it.id + ' ★' : it.id, fs = require('fs');
const esc = t => t.replace(/\|/g, '\\|');
const TITLES = { 1: 'История', 2: 'Главный экран', 3: 'Мини-игры', 6: 'Змей Шипун', 5: 'Перерыв и достижения' };
for (const sec of S) {
  let md = '## ' + TITLES[sec.n] + '\n\n';
  const n = sec.subs.reduce((a, g) => a + g.items.length, 0);
  const ids = sec.subs.flatMap(g => g.items.map(i => +i.id)), nNew = sec.subs.flatMap(g => g.items).filter(i => i.isNew).length;
  md += 'Фраз в разделе: ' + n + (nNew ? ', из них новых (★): ' + nNew : '') + '.\n\n';
  for (const g of sec.subs) {
    if (!g.items.length) continue;
    md += '### ' + g.title + '\n\n';
    const compact = g.items.length > 12 && g.items.every(i => i.text.length < 24 && i.role === 'Рассказчик');
    if (compact) {
      const C = 4; md += '|' + ' № | Фраза |'.repeat(C) + '\n|' + ' --- | --- |'.repeat(C) + '\n';
      for (let i = 0; i < g.items.length; i += C) {
        md += '|' + Array.from({ length: C }, (_, k) => { const it = g.items[i + k]; if (!it) return '  |  |'; const extra = it.note && it.note.length <= 3 && !/^\d+$/.test(it.note) ? ' (' + it.note + ')' : ''; return ' ' + ID(it) + ' | ' + esc(it.text + extra) + ' |'; }).join('') + '\n';
      }
    } else {
      const roles = new Set(g.items.map(i => i.role)), notes = g.items.some(i => i.note);
      const showRole = !(roles.size === 1 && roles.has('Рассказчик'));
      md += '| № |' + (showRole ? ' Кто |' : '') + ' Фраза |' + (notes ? ' Примечание |' : '') + '\n| --- |' + (showRole ? ' --- |' : '') + ' --- |' + (notes ? ' --- |' : '') + '\n';
      for (const it of g.items) md += '| ' + ID(it) + ' |' + (showRole ? ' ' + it.role + ' |' : '') + ' ' + esc(it.text) + ' |' + (notes ? ' ' + esc(it.note) + ' |' : '') + '\n';
    }
    md += '\n';
  }
  fs.writeFileSync('/tmp/voice_s' + sec.n + '.md', md.trim() + '\n');
  console.log(sec.n, md.length);
}

// диапазоны номеров, которые больше не нужны
const ch = require('./changes.json');
const rm = ch.removed.map(r => +r.id).sort((a, b) => a - b), rr = [];
for (const id of rm) { const l = rr[rr.length - 1]; if (l && id === l[1] + 1) l[1] = id; else rr.push([id, id]); }
fs.writeFileSync('/tmp/voice_removed.txt', rr.map(([a, b]) => a === b ? String(a) : a + '–' + b).join(', '));
console.log('removed ranges', rr.length);
