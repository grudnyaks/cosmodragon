// Пазлы: собери картинку из кусочков
'use strict';
const PW = 640, PH = 440; // размер картинки
const BW = 560, BH = 385; // размер поля
const PUZZLE_PICS = [
  // в мировых координатах: видна область примерно 0..1047 по x и 0..720 по y
  (c, t) => { World.bg(c, 2, { noBeacon: true }); Art.dragon(c, 520, 640, 1.5, { t: 0.4, level: Math.max(3, PS().level), happy: true }); },
  (c, t) => { Art.sky(c, '#06042a', '#1a1060', '#3a2a90'); Art.stars(c, 5, 160, 1); Art.planet(c, 820, 560, 160, '#9ff0e0', '#2a8f8a', 'rgba(255,180,230,0.8)'); Art.planet(c, 160, 120, 50, '#ffe0a0', '#ff8a2a'); Art.rocket(c, 470, 560, 0.95, { t: 0.2, flame: 1, rot: 0.6, pilot: true }); },
  (c, t) => { World.bg(c, 3, { noBeacon: true }); Art.astronaut(c, 330, 640, 2, { t: 0.3, anim: 'wave', at: 0.2 }); Art.dragon(c, 680, 640, 1.25, { t: 0.5, level: Math.max(2, PS().level), happy: true, look: -1 }); },
  (c, t) => { World.bg(c, 4, { noBeacon: true }); Art.beacon(c, 600, 620, 2.4, true, 0.6); Art.dragon(c, 260, 650, 0.9, { t: 0.2, level: Math.max(2, PS().level), look: 1 }); },
  (c, t) => { const pd = P(); Art.sky(c, pd.sky[0], pd.sky[1], pd.sky[2]); World.rays(c, 520, 300, 1, '#ffffff');
    for (let i = 0; i < 5; i++) Art.treat(c, i, 130 + i * 190, 600, 1.9, 0); Art.treat(c, 5, 520, 280, 3.6, 0); },
  (c, t) => { World.bg(c, 5, { noBeacon: true, noDecor: true }); Art.dragon(c, 520, 600, 1.2, { t: 0.1, level: Math.max(6, PS().level), flap: -0.35, happy: true, lift: 140 }); },
];

G.scenes.puzzle = {
  enter() {
    const idx = GL('puzzle');
    this.pic = ((PS().games.puzzle || 0) + P().order) % PUZZLE_PICS.length;
    const sizes = [[3, 2], [3, 3], [3, 3], [4, 3], [4, 3], [4, 4]];
    this.ghost = Math.max(0.07, 0.2 - idx * 0.025);
    [this.cols, this.rows] = sizes[Math.min(idx, sizes.length - 1)];
    this.img = document.createElement('canvas'); this.img.width = PW; this.img.height = PH;
    const c = this.img.getContext('2d');
    World.paintTo(c, PW, PH, cc => PUZZLE_PICS[this.pic](cc, 0));
    this.bx = 60; this.by = 200;
    const pw = BW / this.cols, ph = BH / this.rows;
    this.pieces = [];
    const slots = [];
    const n = this.cols * this.rows;
    // места справа, разложенные сеткой
    const sc = n <= 4 ? 2 : n <= 9 ? 3 : 4, sr = Math.ceil(n / sc);
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
    if (M.dist(p.x, p.y, p.tx, p.ty) < Math.min(80, p.w * 0.45)) {
      p.placed = true; Sound.snap();
      G.tween(p, { x: p.tx, y: p.ty }, 0.2, G.ease.outQuad, () => G.burst(p.tx + p.w / 2, p.ty + p.h / 2, { kind: 'star', n: 10, speed: 200 }));
      if (this.pieces.every(q => q.placed)) setTimeout(() => this.win(), 400);
    } else {
      p.x = M.clamp(p.x, G.view.x0, G.view.x1 - p.w); p.y = M.clamp(p.y, 120, G.H - p.h);
    }
  },
  win() {
    this.won = true; this.winT = G.t;
    GW('puzzle');
    Sound.win();
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(this.bx + BW / 2 + M.rnd(-200, 200), this.by + M.rnd(0, 200), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    UI.reward(3 + Math.floor(this.pieces.length / 3), this.bx + BW / 2, this.by + BH / 2);
    Voice.say(M.pick(['Ура! Картинка собрана!', 'Молодец! Какая красота!', 'Здорово получилось!']));
    setTimeout(() => { this.nextBtn.hidden = false; }, 1200);
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t);
    // рамка
    Art.rr(ctx, this.bx - 18, this.by - 18, BW + 36, BH + 36, 26); ctx.fillStyle = '#ffd6f0'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    ctx.save(); ctx.globalAlpha = this.won ? 1 : this.ghost; ctx.drawImage(this.img, this.bx, this.by, BW, BH); ctx.restore();
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
      Art.dragon(ctx, 1000, 690, 0.6, { t, happy: true, look: -1 });
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
