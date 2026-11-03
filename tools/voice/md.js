const S = require('./script.json'), fs = require('fs');
const esc = t => t.replace(/\|/g, '\\|');
const TITLES = { 1: 'История и планеты', 2: 'Главный экран', 3: 'Мини-игры', 4: 'Школа дракона', 5: 'Перерыв, умения, достижения' };
for (const sec of S) {
  let md = '## ' + sec.n + '. ' + TITLES[sec.n] + '\n\n';
  const n = sec.subs.reduce((a, g) => a + g.items.length, 0);
  md += 'Фразы ' + sec.subs[0].items[0].id + '–' + sec.subs.at(-1).items.at(-1).id + ', всего ' + n + '.\n\n';
  for (const g of sec.subs) {
    if (!g.items.length) continue;
    md += '### ' + g.title + '\n\n';
    const compact = g.items.length > 12 && g.items.every(i => i.text.length < 24 && i.role === 'Рассказчик');
    if (compact) {
      const C = 4; md += '|' + ' № | Фраза |'.repeat(C) + '\n|' + ' --- | --- |'.repeat(C) + '\n';
      for (let i = 0; i < g.items.length; i += C) {
        md += '|' + Array.from({ length: C }, (_, k) => { const it = g.items[i + k]; if (!it) return '  |  |'; const extra = it.note && it.note.length <= 3 && !/^\d+$/.test(it.note) ? ' (' + it.note + ')' : ''; return ' ' + it.id + ' | ' + esc(it.text + extra) + ' |'; }).join('') + '\n';
      }
    } else {
      const roles = new Set(g.items.map(i => i.role)), notes = g.items.some(i => i.note);
      const showRole = !(roles.size === 1 && roles.has('Рассказчик'));
      md += '| № |' + (showRole ? ' Кто |' : '') + ' Фраза |' + (notes ? ' Примечание |' : '') + '\n| --- |' + (showRole ? ' --- |' : '') + ' --- |' + (notes ? ' --- |' : '') + '\n';
      for (const it of g.items) md += '| ' + it.id + ' |' + (showRole ? ' ' + it.role + ' |' : '') + ' ' + esc(it.text) + ' |' + (notes ? ' ' + esc(it.note) + ' |' : '') + '\n';
    }
    md += '\n';
  }
  fs.writeFileSync('/tmp/voice_s' + sec.n + '.md', md.trim() + '\n');
  console.log(sec.n, md.length);
}
