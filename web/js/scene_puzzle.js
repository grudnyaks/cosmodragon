// Пазлы: собери картинку из кусочков
'use strict';
const PW = 640, PH = 440; // размер картинки
const BW = 560, BH = 385; // размер поля
const PUZZLE_PICS = [
  // 0: Дракоша на планете
  (c, t) => {
    let g = c.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#3a2a9e'); g.addColorStop(1, '#ff9ad5');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    Art.planet(c, 110, 90, 50, '#ffd0f0', '#ff7eb6', 'rgba(255,240,180,0.8)');
    c.fillStyle = '#62d8c4'; c.beginPath(); c.ellipse(320, 470, 460, 120, 0, 0, 7); c.fill();
    Art.mushroom(c, 80, 400, 0.7, '#7ee8ff', 0); Art.bush(c, 560, 390, 0.8, '#ffb23a', 0);
    Art.dragon(c, 330, 410, 1.2, { t: 0.4, level: 3, happy: true });
  },
  // 1: Ракета в космосе
  (c) => {
    c.fillStyle = '#140c44'; c.fillRect(0, 0, PW, PH);
    const r = Art.seeded(3); c.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) { c.beginPath(); c.arc(r() * PW, r() * PH, r() * 2.5 + 0.5, 0, 7); c.fill(); }
    Art.planet(c, 520, 340, 90, '#9ff0e0', '#2a8f8a', 'rgba(255,180,230,0.8)');
    Art.planet(c, 100, 80, 34, '#ffe0a0', '#ff8a2a');
    Art.rocket(c, 280, 330, 0.62, { t: 0.2, flame: 1, rot: 0.5, pilot: true });
  },
  // 2: Друзья
  (c) => {
    let g = c.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#6a40b8'); g.addColorStop(1, '#ffb3d9');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    c.fillStyle = '#3fb8a9'; c.fillRect(0, 360, PW, 80);
    for (let i = 0; i < 6; i++) Art.heart(c, 60 + i * 105, 60 + (i % 2) * 40, 40, ['#ff5e9a', '#ffd23f', '#7ee8ff'][i % 3]);
    Art.astronaut(c, 200, 400, 1.6, { t: 0.3, wave: true });
    Art.dragon(c, 430, 400, 1.05, { t: 0.5, level: 2, happy: true, look: -1 });
  },
  // 3: Звёздный маяк
  (c) => {
    let g = c.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#1a1050'); g.addColorStop(1, '#8a5ad8');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    const r = Art.seeded(9); c.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(r() * PW, r() * PH * 0.7, r() * 2 + 0.5, 0, 7); c.fill(); }
    c.fillStyle = '#62d8c4'; c.beginPath(); c.ellipse(420, 480, 330, 150, 0, 0, 7); c.fill();
    Art.beacon(c, 420, 360, 1.3, true, 0.6);
    Art.crystal(c, 120, 430, 0.9, '#ff9be0'); Art.bush(c, 600, 430, 0.7, '#ff7eb6', 0);
  },
  // 4: Праздник вкусняшек
  (c) => {
    c.fillStyle = '#ffe6f3'; c.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffd0e8' : '#fff3c0'; c.beginPath(); c.moveTo(320, 220); c.arc(320, 220, 600, i * Math.PI / 4, (i + 1) * Math.PI / 4); c.fill(); }
    for (let i = 0; i < 5; i++) Art.treat(c, i, 90 + i * 115, 360, 1.2, 0);
    Art.treat(c, 0, 320, 160, 2.6, 0);
  },
  // 5: Дракоша летит
  (c) => {
    let g = c.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#2a2386'); g.addColorStop(1, '#ffb3d9');
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    Art.planet(c, 520, 100, 60, '#d4fff6', '#38d6c3');
    for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(80 + i * 130, 380 + (i % 2) * 30, 70, 26, 0, 0, 7); c.fill(); }
    Art.dragon(c, 300, 380, 1.0, { t: 0.1, level: 5, flap: -0.4, happy: true });
  },
];

G.scenes.puzzle = {
  enter() {
    const idx = S.data.puzzle;
    this.pic = idx % PUZZLE_PICS.length;
    const sizes = [[2, 2], [2, 2], [3, 2], [3, 2], [3, 3]];
    [this.cols, this.rows] = sizes[Math.min(idx, sizes.length - 1)];
    this.img = document.createElement('canvas'); this.img.width = PW; this.img.height = PH;
    const c = this.img.getContext('2d');
    PUZZLE_PICS[this.pic](c, 0);
    this.bx = 60; this.by = 200;
    const pw = BW / this.cols, ph = BH / this.rows;
    this.pieces = [];
    const slots = [];
    const n = this.cols * this.rows;
    // места справа, разложенные сеткой
    const sc = n <= 4 ? 2 : 3, sr = Math.ceil(n / sc);
    for (let i = 0; i < n; i++) slots.push({ x: 690 + ((i % sc) + 0.5) * (570 / sc), y: 170 + (Math.floor(i / sc) + 0.5) * (530 / sr) });
    M.shuffle(slots);
    for (let r = 0; r < this.rows; r++) for (let col = 0; col < this.cols; col++) {
      const s = slots.pop();
      this.pieces.push({ c: col, r, w: pw, h: ph, tx: this.bx + col * pw, ty: this.by + r * ph, x: s.x - pw / 2 + M.rnd(-10, 10), y: s.y - ph / 2 + M.rnd(-10, 10), placed: false, rot: M.rnd(-0.15, 0.15), z: Math.random() });
    }
    this.drag = null; this.won = false; this.winT = 0;
    UI.homeButton(this);
    this.nextBtn = UI.add(this, { x: 1000, y: 420, r: 70, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('puzzle') });
    Voice.say('Собери картинку! Перетащи кусочки на свои места.');
  },
  down(x, y) {
    if (this.won) return;
    const list = this.pieces.filter(p => !p.placed).sort((a, b) => b.z - a.z);
    for (const p of list) {
      if (x > p.x - 10 && x < p.x + p.w + 10 && y > p.y - 10 && y < p.y + p.h + 10) {
        this.drag = { p, dx: x - p.x, dy: y - p.y }; p.z = 10 + G.t; p.rot = 0; Sound.pop(0.9); return;
      }
    }
  },
  move(x, y) {
    if (!this.drag) return;
    const p = this.drag.p;
    p.x = x - this.drag.dx; p.y = y - this.drag.dy;
  },
  up() {
    if (!this.drag) return;
    const p = this.drag.p; this.drag = null;
    if (M.dist(p.x, p.y, p.tx, p.ty) < 80) {
      p.placed = true; Sound.snap();
      G.tween(p, { x: p.tx, y: p.ty }, 0.2, G.ease.outQuad, () => G.burst(p.tx + p.w / 2, p.ty + p.h / 2, { kind: 'star', n: 10, speed: 200 }));
      if (this.pieces.every(q => q.placed)) setTimeout(() => this.win(), 400);
    } else {
      p.x = M.clamp(p.x, G.view.x0, G.view.x1 - p.w); p.y = M.clamp(p.y, 120, G.H - p.h);
    }
  },
  win() {
    this.won = true; this.winT = G.t;
    S.data.puzzle++; S.save();
    Sound.win();
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(this.bx + BW / 2 + M.rnd(-200, 200), this.by + M.rnd(0, 200), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    UI.reward(5, this.bx + BW / 2, this.by + BH / 2);
    Voice.say(M.pick(['Ура! Картинка собрана!', 'Молодец! Какая красота!', 'Здорово получилось!']));
    setTimeout(() => { this.nextBtn.hidden = false; }, 1200);
  },
  draw(ctx) {
    const t = G.t;
    Art.sky(ctx, '#2b1a6e', '#6a40b8', '#a05ad0');
    Art.stars(ctx, 21, 70, t);
    // рамка
    Art.rr(ctx, this.bx - 18, this.by - 18, BW + 36, BH + 36, 26); ctx.fillStyle = '#ffd6f0'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    ctx.save(); ctx.globalAlpha = this.won ? 1 : 0.22; ctx.drawImage(this.img, this.bx, this.by, BW, BH); ctx.restore();
    if (!this.won) {
      ctx.strokeStyle = 'rgba(42,22,80,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      for (let c = 1; c < this.cols; c++) { ctx.beginPath(); ctx.moveTo(this.bx + c * BW / this.cols, this.by); ctx.lineTo(this.bx + c * BW / this.cols, this.by + BH); ctx.stroke(); }
      for (let r = 1; r < this.rows; r++) { ctx.beginPath(); ctx.moveTo(this.bx, this.by + r * BH / this.rows); ctx.lineTo(this.bx + BW, this.by + r * BH / this.rows); ctx.stroke(); }
      ctx.setLineDash([]);
      const list = this.pieces.slice().sort((a, b) => (a.placed ? -1 : a.z) - (b.placed ? -1 : b.z));
      for (const p of list) this.drawPiece(ctx, p);
    } else {
      const k = Math.min(1, (G.t - this.winT) / 0.6);
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; ctx.fillRect(this.bx, this.by, BW, BH); ctx.restore();
      Art.dragon(ctx, 1000, 690, 0.6, { t, level: S.data.level, happy: true, look: -1 });
    }
  },
  drawPiece(ctx, p) {
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate(p.rot);
    const lifted = this.drag && this.drag.p === p;
    if (!p.placed) { Art.rr(ctx, -p.w / 2 + 6, -p.h / 2 + (lifted ? 14 : 8), p.w, p.h, 14); ctx.fillStyle = 'rgba(20,8,50,0.4)'; ctx.fill(); }
    if (lifted) ctx.scale(1.06, 1.06);
    Art.rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.placed ? 2 : 14); ctx.save(); ctx.clip();
    const sw = PW / this.cols, sh = PH / this.rows;
    ctx.drawImage(this.img, p.c * sw, p.r * sh, sw, sh, -p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
    if (!p.placed) { ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    ctx.restore();
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
