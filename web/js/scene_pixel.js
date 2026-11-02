// Пиксель-раскраска: выбери цвет с цифрой и закрась клетки с такой же цифрой — получится картинка
'use strict';
const PIXEL_PICS = [
  { name: 'сердечко', colors: { '.': '#bfe8ff', X: '#ff3b5c', o: '#ffffff' }, rows: [
    '..........', '.XX....XX.', 'XoXX..XXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', '.XXXXXXXX.', '..XXXXXX..', '...XXXX...', '....XX....', '..........'] },
  { name: 'звёздочка', colors: { '.': '#2a2a6a', X: '#ffd23f', o: '#fff6b0' }, rows: [
    '....XX....', '....Xo....', '...XXXX...', 'XXXXXXXXXX', '.XXXoXXXX.', '..XXXXXX..', '..XXXXXX..', '.XXX..XXX.', '.XX....XX.', '..........'] },
  { name: 'грибок', colors: { '.': '#c8f0c8', R: '#ff3b3b', W: '#ffffff', S: '#f0d8a8' }, rows: [
    '...RRRR...', '.RRWRRRRR.', 'RRRRRRWRRR', 'RWRRRRRRRR', 'RRRRRWRRRR', '...SSSS...', '...SSSS...', '...SSSS...', '..SSSSSS..', '..........'] },
  { name: 'ракета', colors: { '.': '#1a1a50', W: '#ffffff', O: '#ff7a1a', B: '#4fb7ff', Y: '#ffd23f' }, rows: [
    '....OO....', '...OWWO...', '...WWWW...', '...WBBW...', '...WBBW...', '...WWWW...', '..OWWWWO..', '.OOWWWWOO.', '...O..O...', '...Y..Y...'] },
  { name: 'радуга', colors: { '.': '#d6ecff', R: '#ff3b5c', O: '#ff9a3c', Y: '#ffd23f', G: '#41d982', W: '#ffffff' }, rows: [
    '..........', '..RRRRRR..', '.RROOOORR.', 'RROYYYYORR', 'ROYGGGGYOR', 'ROYG..GYOR', 'ROYG..GYOR', '..........', 'WW......WW', 'WWW....WWW'] },
  { name: 'дракончик', colors: { '.': '#ffe9f4', H: '#fff1c9', G: '#4cc85a', E: '#1a1030', P: '#ff7eb6' }, rows: [
    '.H......H.', '.GG....GG.', '.GGGGGGGG.', 'GGEHGGEHGG', 'GGEEGGEEGG', 'GGGGGGGGGG', '.GGPGGPGG.', '..GGGGGG..', '...GGGG...', '..........'] },
];
G.scenes.pixel = {
  enter() {
    const lvl = GL('pixel');
    const wins = PS().games.pixel || 0;
    const pic = PIXEL_PICS[(wins + P().order) % PIXEL_PICS.length];
    this.pic = pic;
    // номера цветов: по порядку появления
    const order = []; for (const row of pic.rows) for (const ch of row) if (!order.includes(ch)) order.push(ch);
    this.palette = order.map((ch, i) => ({ ch, n: i + 1, color: pic.colors[ch] }));
    this.N = 10; this.cs = 54; this.ox = 110; this.oy = 120;
    const pre = Math.max(0, 0.55 - lvl * 0.07);
    this.cells = [];
    for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) {
      const ch = pic.rows[r][c], n = order.indexOf(ch) + 1;
      this.cells.push({ c, r, n, done: Math.random() < pre, wig: 0, pop: 0 });
    }
    this.sel = 1; this.mist = 0; this.won = false; this.painting = false;
    UI.homeButton(this);
    this.palBtns = this.palette.map((p, i) => UI.add(this, { x: 830 + (i % 2) * 140, y: 200 + Math.floor(i / 2) * 120, r: 50, color: p.color, label: String(p.n), fontSize: 40,
      onTap: () => { this.sel = p.n; Sound.pop(1.1 + i * 0.05); this.refresh(); } }));
    this.again = UI.add(this, { x: 380, y: 400, r: 70, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('pixel') });
    this.refresh();
    Voice.say('Выбери цвет с цифрой и закрась все клетки с такой же цифрой. Что получится?');
  },
  refresh() { this.palBtns.forEach((b, i) => { b.pulse = this.palette[i].n === this.sel; }); },
  cellAt(x, y) { const c = Math.floor((x - this.ox) / this.cs), r = Math.floor((y - this.oy) / this.cs); return c >= 0 && r >= 0 && c < this.N && r < this.N ? this.cells[r * this.N + c] : null; },
  paint(x, y) {
    const cell = this.cellAt(x, y); if (!cell || cell.done || this.won) return;
    if (cell.n === this.sel) {
      cell.done = true; cell.pop = 1; G.tween(cell, { pop: 0 }, 0.3);
      if (Math.random() < 0.4) Sound.pop(1.2 + Math.random() * 0.4);
      if (this.cells.every(q => q.done)) this.win();
      else if (!this.cells.some(q => !q.done && q.n === this.sel)) { Sound.chime(1.2); const nx = this.cells.find(q => !q.done); if (nx) { this.sel = nx.n; this.refresh(); } }
    } else if (!cell.wig) { cell.wig = 1; G.tween(cell, { wig: 0 }, 0.4); this.mist++; Sound.boing(); }
  },
  down(x, y) { this.painting = true; this.paint(x, y); },
  move(x, y) { if (this.painting) this.paint(x, y); },
  up() { this.painting = false; },
  win() {
    this.won = true; GW('pixel'); Sound.win(); Sound.purr(1.3);
    UI.reward(5 + (this.mist === 0 ? 3 : this.mist < 4 ? 1 : 0), 380, 380);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(150, 650), M.rnd(150, 600), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Это ' + this.pic.name + '! Какая красота!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  draw(ctx) {
    const t = G.t, { N, cs, ox, oy } = this;
    World.calm(ctx, t, 0.3);
    Art.rr(ctx, ox - 14, oy - 14, N * cs + 28, N * cs + 28, 18); ctx.fillStyle = '#ffffff'; ctx.fill(); Art.stroke(ctx, 5);
    for (const cell of this.cells) {
      const x = ox + cell.c * cs + Math.sin(t * 50) * 4 * cell.wig, y = oy + cell.r * cs;
      if (cell.done) {
        const k = 1 + cell.pop * 0.25;
        ctx.save(); ctx.translate(x + cs / 2, y + cs / 2); ctx.scale(k, k);
        ctx.fillStyle = this.palette[cell.n - 1].color; ctx.fillRect(-cs / 2, -cs / 2, cs, cs);
        ctx.restore();
      } else {
        const hl = cell.n === this.sel && !this.won;
        ctx.fillStyle = hl ? '#fff6c8' : '#f4f0fa'; ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        UI.text(ctx, String(cell.n), x + cs / 2, y + cs / 2 + 2, 24, hl ? '#2a1650' : '#9a90b8', 'center', false);
      }
    }
    ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath(); for (let i = 1; i < N; i++) { ctx.moveTo(ox + i * cs, oy); ctx.lineTo(ox + i * cs, oy + N * cs); ctx.moveTo(ox, oy + i * cs); ctx.lineTo(ox + N * cs, oy + i * cs); } Art.stroke(ctx, 1.5, '#5a4a80'); ctx.restore();
    const left = this.cells.filter(q => !q.done).length;
    UI.text(ctx, this.won ? 'Это ' + this.pic.name + '!' : 'Осталось клеток: ' + left, 900, 110, 30, '#fff', 'center', true);
    const selP = this.palette[this.sel - 1];
    if (!this.won && selP) { Art.ell(ctx, 900, 620, 44, 44, selP.color); Art.stroke(ctx, 5); UI.text(ctx, String(selP.n), 900, 623, 40, '#2a1650', 'center', false); UI.text(ctx, 'Сейчас:', 790, 620, 26, '#fff', 'center', true); }
    Art.dragon(ctx, 1160, 700, 0.42, { t, happy: this.won, look: -1 });
    if (this.won && !this.again.hidden) UI.text(ctx, 'Дальше!', 380, 290, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
