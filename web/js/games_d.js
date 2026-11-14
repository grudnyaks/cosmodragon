// Новые игры: Робоград (собери робота, провода), Грибландия (светлячки, прыжки по грибам), Сумрак (фонарик, совы)
'use strict';
(function () {
  const ell = Art.ell, TAU = Math.PI * 2, LINE = '#2a1650';

  // ================= Робоград: Собери робота =================
  // детали: форма + место на силуэте
  const RP = [
    { id: 'body', w: 150, h: 130, x: 0, y: 0, r: 20 }, { id: 'head', w: 110, h: 86, x: 0, y: -120, r: 24 },
    { id: 'armL', w: 40, h: 120, x: -104, y: 6, r: 18 }, { id: 'armR', w: 40, h: 120, x: 104, y: 6, r: 18 },
    { id: 'legL', w: 46, h: 90, x: -40, y: 116, r: 12 }, { id: 'legR', w: 46, h: 90, x: 40, y: 116, r: 12 },
  ];
  const robotPart = (ctx, p, x, y, c, t, on) => {
    ctx.save(); ctx.translate(x, y);
    Art.rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.r); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
    if (p.id === 'head') { ell(ctx, -24, -4, 14, 14, on ? '#7effff' : '#ffffff'); ctx.stroke(); ell(ctx, 24, -4, 14, 14, on ? '#7effff' : '#ffffff'); ctx.stroke(); ell(ctx, -24, -4, 5, 5, LINE); ell(ctx, 24, -4, 5, 5, LINE); Art.rr(ctx, -20, 20, 40, 10, 5); ctx.fillStyle = LINE; ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -43); ctx.lineTo(0, -66); ctx.stroke(); ell(ctx, 0, -70, 9, 9, on && Math.sin(t * 8) > 0 ? '#ff5a6a' : '#ffd23f'); ctx.stroke(); }
    if (p.id === 'body') { Art.rr(ctx, -40, -30, 80, 56, 10); ctx.fillStyle = '#2a3a5a'; ctx.fill(); ctx.stroke(); for (let i = 0; i < 3; i++) ell(ctx, -22 + i * 22, -2, 8, 8, on ? ['#ff5a6a', '#ffd23f', '#41d982'][(i + Math.floor(t * 4)) % 3] : '#5a6a80'); }
    if (p.id.startsWith('arm')) ell(ctx, 0, p.h / 2 - 4, 22, 16, '#8a9ab0');
    if (p.id.startsWith('leg')) Art.rr(ctx, -30, p.h / 2 - 14, 60, 22, 10);
    ctx.restore();
  };
  MG.game('robot', {
    icon(ctx) { Art.rr(ctx, -16, -26, 32, 24, 6); ctx.fillStyle = '#a8b8c8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); Art.rr(ctx, -20, 0, 40, 28, 6); ctx.fill(); ctx.stroke(); ell(ctx, -6, -14, 4, 4, '#41e8ff'); ell(ctx, 6, -14, 4, 4, '#41e8ff'); },
    init() { this.round = 0; this.rounds = 2; this.newRobot(); },
    newRobot() {
      this.c = M.pick(['#a8b8c8', '#ffb23a', '#7ee8ff', '#ff9ad5', '#9be37a']); this.cx = 640; this.cy = 400; this.on = 0;
      const spots = M.shuffle([[150, 220], [150, 420], [150, 610], [1130, 220], [1130, 420], [1130, 610]]);
      this.parts = RP.map((p, i) => ({ p, x: spots[i][0], y: spots[i][1], hx: spots[i][0], hy: spots[i][1], placed: false }));
      this.drag = null;
    },
    say: 'Собери робота! Перетаскивай детали на место — туда, где нарисован такой же контур.',
    down(x, y) { for (const q of this.parts.slice().reverse()) if (!q.placed && Math.abs(x - q.x) < q.p.w / 2 + 20 && Math.abs(y - q.y) < q.p.h / 2 + 20) { this.drag = { q, dx: q.x - x, dy: q.y - y }; Sound.pop(1); return; } },
    move(x, y) { if (this.drag) { this.drag.q.x = x + this.drag.dx; this.drag.q.y = y + this.drag.dy; } },
    up() {
      const d = this.drag; this.drag = null; if (!d) return;
      const q = d.q, tx = this.cx + q.p.x, ty = this.cy + q.p.y;
      // ручки и ножки взаимозаменяемы
      let slot = null;
      for (const r of this.parts) { const sx = this.cx + r.p.x, sy = this.cy + r.p.y; const same = r.p.w === q.p.w && r.p.h === q.p.h; if (same && !this.parts.find(o => o.placed && o.slot === r.p.id) && Math.hypot(q.x - sx, q.y - sy) < 90) { slot = r.p; break; } }
      if (slot) {
        q.placed = true; q.slot = slot.id; Sound.snap(); Sound.chime(1 + this.parts.filter(o => o.placed).length * 0.08);
        G.tween(q, { x: this.cx + slot.x, y: this.cy + slot.y }, 0.2, G.ease.outBack);
        if (this.parts.every(o => o.placed)) {
          Sound.magic(); G.tween(this, { on: 1 }, 0.6); Voice.say(M.pick(['Бип-бип! Робот включился!', 'Бип-буп! Привет! Я робот!']));
          G.wait(2.2, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Ты собрал двух роботов! Ты настоящий инженер!'); else this.newRobot(); });
        }
      } else if (Math.abs(q.x - tx) < 300 && Math.abs(q.y - ty) < 260) { Sound.boing(); G.tween(q, { x: q.hx, y: q.hy }, 0.4, G.ease.outQuad); Voice.say('Эта деталь не подходит сюда. Найди такой же контур!'); }
    },
    render(ctx, t) {
      // силуэт
      for (const r of RP) { ctx.save(); ctx.setLineDash([10, 8]); Art.rr(ctx, this.cx + r.x - r.w / 2, this.cy + r.y - r.h / 2, r.w, r.h, r.r); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke(); ctx.restore(); }
      const dance = this.on ? Math.sin(t * 8) * 6 : 0;
      for (const q of this.parts.filter(q => q.placed)) robotPart(ctx, q.p, q.x, q.y + (q.p.id.startsWith('arm') ? -Math.abs(dance) : 0), this.c, t, this.on > 0.5);
      for (const q of this.parts.filter(q => !q.placed)) robotPart(ctx, q.p, q.x, q.y, this.c, t, false);
      Art.dragon(ctx, 900, 690, 0.32, { kind: this.dr, t, look: -1, happy: this.on > 0 || this.won });
      MG.bar(ctx, this.round / this.rounds, 'Роботы: ' + this.round + ' из ' + this.rounds, '#7ee8ff');
    },
  });

  // ================= Робоград: Провода =================
  MG.game('wires', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-24, -14); ctx.bezierCurveTo(0, -14, 0, 14, 24, 14); ctx.lineWidth = 6; ctx.strokeStyle = '#ff4d5e'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-24, 14); ctx.bezierCurveTo(0, 14, 0, -14, 24, -14); ctx.strokeStyle = '#3fb8ff'; ctx.stroke(); },
    init() { this.round = 0; this.rounds = 3; this.newRound(); },
    newRound() {
      const n = Math.min(5, 3 + Math.floor((this.lvl + this.round) / 2));
      const cols = M.shuffle([0, 2, 3, 4, 6].map(i => COLORS[i])).slice(0, n);
      const ys = k => 210 + k * (400 / Math.max(1, n - 1));
      this.L = cols.map((c, k) => ({ c, x: 260, y: ys(k) }));
      this.R = M.shuffle(cols.slice()).map((c, k) => ({ c, x: 1020, y: ys(k), done: false }));
      this.links = []; this.drag = null; this.lamp = 0;
    },
    say: 'Почини провода! Протяни каждый провод от вилки к розетке такого же цвета.',
    down(x, y) { for (const p of this.L) if (!this.links.find(l => l.a === p) && Math.hypot(x - p.x, y - p.y) < 60) { this.drag = { a: p, x, y }; Sound.pop(1); return; } },
    move(x, y) { if (this.drag) { this.drag.x = x; this.drag.y = y; } },
    up() {
      const d = this.drag; this.drag = null; if (!d) return;
      const s = this.R.find(s => !s.done && Math.hypot(d.x - s.x, d.y - s.y) < 70);
      if (!s) return;
      if (s.c === d.a.c) {
        s.done = true; this.links.push({ a: d.a, b: s }); Sound.snap(); Sound.chime(1 + this.links.length * 0.1); G.burst(s.x, s.y, { kind: 'star', n: 10, speed: 180 });
        if (this.links.length === this.L.length) { Sound.magic(); G.tween(this, { lamp: 1 }, 0.5); Voice.say('Свет включился!'); G.wait(1.6, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Все провода починены, весь Робоград светится!'); else this.newRound(); }); }
      } else { Sound.boing(); Voice.say('Эта розетка ' + s.c.name.replace(/ый$/, 'ая').replace(/ий$/, 'яя').replace(/ой$/, 'ая') + '. Нужна такого же цвета, как провод!'); }
    },
    wire(ctx, ax, ay, bx, by, c) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo((ax + bx) / 2, ay, (ax + bx) / 2, by, bx, by); ctx.lineWidth = 16; ctx.strokeStyle = LINE; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = c; ctx.stroke(); },
    render(ctx, t) {
      Art.rr(ctx, 180, 150, 920, 520, 30); ctx.fillStyle = 'rgba(20,30,60,0.6)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#8a9ab8'; ctx.stroke();
      for (const l of this.links) this.wire(ctx, l.a.x, l.a.y, l.b.x, l.b.y, l.a.c.c);
      if (this.drag) this.wire(ctx, this.drag.a.x, this.drag.a.y, this.drag.x, this.drag.y, this.drag.a.c.c);
      for (const p of this.L) { Art.rr(ctx, p.x - 50, p.y - 26, 70, 52, 12); ctx.fillStyle = p.c.c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); ctx.fillStyle = '#c8d0e0'; ctx.fillRect(p.x + 20, p.y - 14, 22, 8); ctx.fillRect(p.x + 20, p.y + 6, 22, 8); }
      for (const s of this.R) { ell(ctx, s.x, s.y, 42, 42, '#ffffff'); ctx.lineWidth = 8; ctx.strokeStyle = s.c.c; ctx.stroke(); ell(ctx, s.x - 10, s.y, 5, 9, LINE); ell(ctx, s.x + 10, s.y, 5, 9, LINE); }
      // лампочка
      const k = this.lamp; ctx.save(); ctx.globalAlpha = 0.5 * k; ell(ctx, 640, 110, 90, 90, '#fff6a0'); ctx.restore();
      ell(ctx, 640, 110, 34, 34, k > 0.5 ? '#fff6a0' : '#8a9ab0'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      Art.dragon(ctx, 1180, 700, 0.34, { kind: this.dr, t, look: -1, happy: this.won || k > 0.5 });
      UI.text(ctx, 'Провода: ' + this.round + ' из ' + this.rounds, 900, 50, 26, '#fff', 'center', true);
    },
  });

  // ================= Грибландия: Светлячки в банку =================
  MG.game('fireflies', {
    icon(ctx) { Art.rr(ctx, -18, -16, 36, 44, 10); ctx.fillStyle = 'rgba(200,255,220,0.5)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, -4, 6, 5, 5, '#c8ff5a'); ell(ctx, 6, -2, 4, 4, '#c8ff5a'); Art.rr(ctx, -20, -24, 40, 10, 4); ctx.fillStyle = '#a8742a'; ctx.fill(); ctx.stroke(); },
    init() { this.ff = []; for (let i = 0; i < 9; i++) this.ff.push(this.newFF()); this.goal = 10 + this.lvl * 2; this.time = 45; this.jar = []; },
    newFF() { return { x: M.rnd(160, 1000), y: M.rnd(170, 560), vx: M.rnd(-40, 40), vy: M.rnd(-30, 30), ph: M.rnd(0, 6), sp: M.rnd(0.8, 1.4) }; },
    say: 'В темноте летают светлячки. Лови их, когда они светятся, и сажай в баночку!',
    lit(f) { return Math.sin(this.T * 2 * f.sp + f.ph) > 0.1; },
    down(x, y) {
      for (const f of this.ff) {
        if (Math.hypot(x - f.x, y - f.y) > 60) continue;
        if (!this.lit(f)) { Sound.boing(); return; }
        this.score++; Sound.chime(1.2 + (this.score % 5) * 0.1); this.jar.push({ x: f.x, y: f.y, k: 0, ph: M.rnd(0, 6) });
        G.tween(this.jar[this.jar.length - 1], { k: 1 }, 0.6, G.ease.inOutQuad);
        Object.assign(f, this.newFF());
        if (this.score >= this.goal) this.win('Ура! Полная баночка светлячков! Смотри, как светло стало!');
        return;
      }
    },
    tick(dt) {
      this.time -= dt; if (this.time <= 0) return this.fail('Время вышло! В баночке ' + this.score + ' светлячков!', Math.floor(this.score / 3));
      for (const f of this.ff) { f.vx += M.rnd(-60, 60) * dt; f.vy += M.rnd(-60, 60) * dt; f.vx = M.clamp(f.vx, -70, 70); f.vy = M.clamp(f.vy, -60, 60); f.x += f.vx * dt; f.y += f.vy * dt; if (f.x < 140 || f.x > 1020) f.vx *= -1; if (f.y < 160 || f.y > 580) f.vy *= -1; f.x = M.clamp(f.x, 140, 1020); f.y = M.clamp(f.y, 160, 580); }
    },
    render(ctx, t) {
      const v = G.view; ctx.save(); ctx.globalAlpha = 0.55 - Math.min(0.35, this.score * 0.025); ctx.fillStyle = '#05051a'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore();
      for (const f of this.ff) { const on = this.lit(f); if (on) { ctx.save(); ctx.globalAlpha = 0.45; ell(ctx, f.x, f.y, 34, 34, '#c8ff5a'); ctx.restore(); } ell(ctx, f.x, f.y, 9, 7, on ? '#f0ffa0' : '#4a5a3a'); ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, f.x - 6, f.y - 8, 7, 5, '#ffffff'); ell(ctx, f.x + 6, f.y - 8, 7, 5, '#ffffff'); ctx.restore(); }
      // баночка
      const jx = 1140, jy = 520, glow = Math.min(1, this.score / this.goal);
      ctx.save(); ctx.globalAlpha = 0.25 + glow * 0.5; ell(ctx, jx, jy, 130, 130, '#c8ff5a'); ctx.restore();
      Art.rr(ctx, jx - 70, jy - 90, 140, 190, 30); ctx.fillStyle = 'rgba(200,255,230,0.35)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = LINE; ctx.stroke();
      Art.rr(ctx, jx - 78, jy - 112, 156, 30, 10); ctx.fillStyle = '#a8742a'; ctx.fill(); ctx.stroke();
      for (const j of this.jar) { const x = M.lerp(j.x, jx + Math.sin(t * 2 + j.ph) * 40, j.k), y = M.lerp(j.y, jy + Math.cos(t * 1.7 + j.ph) * 60, j.k); ell(ctx, x, y, 8, 6, '#f0ffa0'); }
      Art.dragon(ctx, 980, 700, 0.34, { kind: this.dr, t, look: 1, happy: this.won });
      MG.bar(ctx, this.score / this.goal, 'Светлячки: ' + this.score + ' / ' + this.goal, '#c8ff5a');
      MG.clock(ctx, this.time, 45);
    },
  });

  // ================= Грибландия: Прыжки по грибам =================
  MG.game('shroomjump', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-26, 10); ctx.bezierCurveTo(-26, -22, 26, -22, 26, 10); ctx.closePath(); ctx.fillStyle = '#ff5a7a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); Art.rr(ctx, -8, 8, 16, 18, 6); ctx.fillStyle = '#fff2e0'; ctx.fill(); ctx.stroke(); ell(ctx, 0, -28, 6, 6, '#7effc8'); },
    init() {
      this.d = { y: 520, vy: 0, onG: true }; this.goal = 15 + this.lvl * 2; this.speed = 260 + this.lvl * 20; this.dist = 0;
      this.plats = []; let x = 200; for (let i = 0; i < 8; i++) { this.plats.push(this.plat(x, i === 0)); x += M.rnd(230, 300); }
      this.berries = [];
    },
    plat(x, first) { return { x, w: first ? 400 : M.rnd(150, 220), y: first ? 560 : M.rnd(460, 580), c: M.pick(['#ff5a7a', '#b07cff', '#7effc8', '#ffb23a']) }; },
    say: 'Дракончик бежит по грибам! Нажимай на экран, чтобы прыгнуть, и собирай светящиеся ягодки.',
    down() { if (this.d.onG) { this.d.vy = -780; this.d.onG = false; Sound.boing(); } else if (!this.d.dbl) { this.d.dbl = true; this.d.vy = -620; Sound.boing(); } },
    tick(dt) {
      const d = this.d, X = 330;
      for (const p of this.plats) p.x -= this.speed * dt;
      for (const b of this.berries) b.x -= this.speed * dt;
      if (this.plats[0].x + this.plats[0].w / 2 < -100) { this.plats.shift(); const last = this.plats[this.plats.length - 1]; const np = this.plat(last.x + M.rnd(240, 310)); this.plats.push(np); if (Math.random() < 0.8) this.berries.push({ x: np.x, y: np.y - M.rnd(110, 220) }); }
      d.vy += 1900 * dt; const prevY = d.y; d.y += d.vy * dt;
      d.onG = false;
      for (const p of this.plats) if (Math.abs(X - p.x) < p.w / 2 && prevY <= p.y - 40 + 2 && d.y >= p.y - 40) { d.y = p.y - 40; d.vy = 0; d.onG = true; d.dbl = false; }
      if (d.y > 760) { Sound.bump(); Voice.say(M.pick(['Ой! Падаем на мягкий мох. Прыгай ещё!', 'Плюх! Ничего, бежим дальше!'])); const p = this.plats.find(p => p.x > X - 50) || this.plats[1]; d.y = p.y - 200; d.vy = 0; this.score = Math.max(0, this.score - 1); }
      for (const b of this.berries) if (!b.got && Math.hypot(b.x - X, b.y - (d.y - 50)) < 60) { b.got = true; this.score++; Sound.chime(1.1 + (this.score % 5) * 0.1); G.burst(b.x, b.y, { kind: 'star', n: 6, speed: 140 }); if (this.score >= this.goal) this.win('Ура! Все ягодки собраны! Вот это прыжки!'); }
      this.berries = this.berries.filter(b => b.x > -50 && !b.got);
    },
    render(ctx, t) {
      for (const p of this.plats) {
        Art.rr(ctx, p.x - 22, p.y, 44, 720 - p.y, 14); ctx.fillStyle = '#efe0f8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - p.w / 2, p.y + 10); ctx.bezierCurveTo(p.x - p.w / 2, p.y - 50, p.x + p.w / 2, p.y - 50, p.x + p.w / 2, p.y + 10); ctx.closePath(); ctx.fillStyle = p.c; ctx.fill(); ctx.stroke();
        for (let k = -1; k <= 1; k++) ell(ctx, p.x + k * p.w * 0.25, p.y - 18 - (k ? 0 : 10), 8, 6, 'rgba(255,255,255,0.8)');
      }
      for (const b of this.berries) Art.treatNamed(ctx, 'glowberry', b.x, b.y, 0.6, t);
      Art.dragon(ctx, 330, this.d.y + 4, 0.34, { kind: this.dr, t: t * 2, flying: !this.d.onG, lift: 0, look: 1, happy: this.won });
      MG.bar(ctx, this.score / this.goal, 'Ягодки: ' + this.score + ' / ' + this.goal, '#7effc8');
    },
  });

  // ================= Сумрак: Найди с фонариком =================
  const ITEMS = [{ id: 'key', name: 'ключик' }, { id: 'ball', name: 'мячик' }, { id: 'star', name: 'звёздочку' }, { id: 'boot', name: 'ботинок' }, { id: 'cup', name: 'чашку' }, { id: 'bell', name: 'колокольчик' }, { id: 'teddy', name: 'мишку' }];
  const itemDraw = (ctx, id, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 4; ctx.strokeStyle = LINE;
    if (id === 'key') { Art.icon(ctx, 'key', 0, 0, 1.1); }
    if (id === 'ball') { ell(ctx, 0, 0, 30, 30, '#ff5a7a'); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(0, 18, 30, 0); ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
    if (id === 'star') Art.roundStar(ctx, 0, 0, 32, '#ffd23f', LINE);
    if (id === 'boot') { ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(10, -30); ctx.lineTo(10, 6); ctx.lineTo(34, 10); ctx.lineTo(34, 26); ctx.lineTo(-14, 26); ctx.closePath(); ctx.fillStyle = '#3fb8ff'; ctx.fill(); ctx.stroke(); }
    if (id === 'cup') { Art.rr(ctx, -24, -20, 40, 44, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(20, 2, 11, -1.4, 1.4); ctx.stroke(); ell(ctx, -4, -6, 8, 8, '#ff9ad5'); }
    if (id === 'bell') { ctx.beginPath(); ctx.moveTo(-26, 18); ctx.quadraticCurveTo(-22, -30, 0, -30); ctx.quadraticCurveTo(22, -30, 26, 18); ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.stroke(); ell(ctx, 0, 24, 7, 7, '#c8901a'); ctx.stroke(); }
    if (id === 'teddy') { for (const sx of [-1, 1]) { ell(ctx, sx * 18, -22, 10, 10, '#c8843a'); ctx.stroke(); } ell(ctx, 0, 0, 26, 24, '#c8843a'); ctx.stroke(); ell(ctx, 0, 8, 10, 7, '#f0c890'); ell(ctx, -9, -4, 3, 3, LINE); ell(ctx, 9, -4, 3, 3, LINE); }
    ctx.restore();
  };
  MG.game('flashlight', {
    icon(ctx) { Art.rr(ctx, -26, -8, 30, 18, 5); ctx.fillStyle = '#5a6a80'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(30, -22); ctx.lineTo(30, 22); ctx.lineTo(4, 12); ctx.closePath(); ctx.fillStyle = 'rgba(255,246,160,0.8)'; ctx.fill(); },
    init() {
      const n = Math.min(6, 4 + Math.floor(this.lvl / 2));
      const spots = M.shuffle([[220, 230], [480, 200], [760, 240], [1040, 220], [300, 450], [600, 420], [880, 470], [180, 620], [500, 630], [780, 640], [1060, 600]]);
      this.items = M.shuffle(ITEMS.slice()).slice(0, 7).map((it, i) => ({ id: it.id, name: it.name, x: spots[i][0], y: spots[i][1], found: false }));
      this.want = this.items.slice(0, n); this.wi = 0; this.lx = 640; this.ly = 400; this.found = 0;
      this.R = 120 - this.lvl * 6;
    },
    say() { return 'Темно! Води пальцем — это фонарик. Найди ' + this.want[0].name + '!'; },
    down(x, y) { this.lx = x; this.ly = y; this.check(x, y, true); },
    move(x, y) { this.lx = x; this.ly = y; },
    up(x, y) { if (x != null) this.check(this.lx, this.ly, false); },
    check(x, y) {
      const w = this.want[this.wi]; if (!w || this.won) return;
      if (Math.hypot(x - w.x, y - w.y) < 70) {
        w.found = true; this.wi++; this.score++; Sound.magic(); G.burst(w.x, w.y, { kind: 'star', n: 16, speed: 220 });
        if (this.wi >= this.want.length) { this.win('Ура! Ты всё нашёл в темноте! Ты самый смелый!'); return; }
        Voice.say('Нашёл! А теперь найди ' + this.want[this.wi].name + '!');
      }
    },
    render(ctx, t) {
      // предметы
      for (const it of this.items) if (!it.found) itemDraw(ctx, it.id, it.x, it.y, 1);
      // темнота с дыркой-фонариком
      const v = G.view;
      ctx.save(); ctx.beginPath(); ctx.rect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.arc(this.lx, this.ly, this.R, 0, TAU, true);
      ctx.fillStyle = this.won ? 'rgba(5,5,25,0.2)' : 'rgba(5,5,25,0.94)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, this.lx, this.ly, this.R, this.R, '#fff6a0'); ctx.restore();
      ctx.beginPath(); ctx.arc(this.lx, this.ly, this.R, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,246,160,0.6)'; ctx.stroke();
      // что искать
      const w = this.want[this.wi];
      Art.rr(ctx, 420, 90, 440, 70, 35); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      if (w) { itemDraw(ctx, w.id, 480, 125, 0.7); UI.text(ctx, 'Найди ' + w.name, 680, 136, 30, '#3a2a6a', 'center', false); }
      Art.dragon(ctx, 1190, 700, 0.3, { kind: this.dr, t, look: -1, happy: this.won });
      UI.text(ctx, 'Найдено: ' + this.score + ' из ' + this.want.length, 640, 50, 28, '#fff', 'center', true);
    },
  });

  // ================= Сумрак: Совы в дуплах =================
  MG.game('owls', {
    icon(ctx) { ell(ctx, 0, 4, 22, 24, '#8a6a4a'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, -9, -2, 8, 8, '#ffffff'); ell(ctx, 9, -2, 8, 8, '#ffffff'); ell(ctx, -9, -2, 4, 4, LINE); ell(ctx, 9, -2, 4, 4, LINE); ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(3, 6); ctx.lineTo(0, 12); ctx.fillStyle = '#ffb23a'; ctx.fill(); },
    init() {
      const n = this.lvl < 2 ? 6 : 9;
      const pos = n === 6 ? [[420, 260], [640, 230], [860, 260], [420, 470], [640, 440], [860, 470]] : [[400, 230], [640, 210], [880, 230], [400, 400], [640, 380], [880, 400], [400, 570], [640, 550], [880, 570]];
      this.holes = pos.map(([x, y]) => ({ x, y, owl: 0, sh: 0 }));
      this.round = 0; this.rounds = 6; this.phase = 'show'; this.seq = []; this.pick = 0;
      G.wait(1.6, () => this.show());
    },
    say: 'Совушки играют в прятки! Запомни, из какого дупла выглянула сова, и нажми на него.',
    show() {
      if (this.won) return;
      this.phase = 'show'; this.pick = 0;
      const len = 1 + Math.floor((this.round + this.lvl) / 3);
      this.seq = []; for (let i = 0; i < Math.min(3, len); i++) { let h; do { h = M.pick(this.holes); } while (this.seq.includes(h)); this.seq.push(h); }
      this.seq.forEach((h, i) => G.wait(i * 1.1, () => { Sound.note(this.holes.indexOf(h) % 7); G.tween(h, { owl: 1 }, 0.25, G.ease.outBack, () => G.tween(h, { owl: 0 }, 0.25, G.ease.inOutQuad, null, 0.5)); }));
      G.wait(this.seq.length * 1.1 + 0.4, () => { this.phase = 'guess'; Voice.say(this.seq.length > 1 ? 'Где были совы? Нажимай по порядку!' : 'Где сова?'); });
    },
    down(x, y) {
      if (this.phase !== 'guess') return;
      for (const h of this.holes) {
        if (Math.hypot(x - h.x, y - h.y) > 70) continue;
        if (h === this.seq[this.pick]) {
          this.pick++; Sound.note(this.holes.indexOf(h) % 7); G.tween(h, { owl: 1 }, 0.2, G.ease.outBack, () => G.tween(h, { owl: 0 }, 0.3, G.ease.inOutQuad, null, 0.6));
          if (this.pick >= this.seq.length) { this.phase = 'wait'; Sound.chime(1.3); this.round++; G.burst(h.x, h.y, { kind: 'star', n: 12, speed: 200 });
            if (this.round >= this.rounds) G.wait(0.8, () => this.win('Ура! Ты нашёл всех совушек! Какая у тебя память!')); else { Voice.say(M.pick(['Угу! Правильно!', 'Угу-угу! Нашёл!'])); G.wait(1.5, () => this.show()); } }
        } else { h.sh = 1; Sound.boing(); this.phase = 'wait'; Voice.say('Угу… Там пусто. Смотри ещё раз!'); G.wait(1.4, () => this.show()); }
        return;
      }
    },
    anim(dt) { for (const h of this.holes || []) h.sh = Math.max(0, h.sh - dt * 3); },
    render(ctx, t) {
      // дерево
      Art.rr(ctx, 300, 140, 680, 600, 120); ctx.fillStyle = '#5a3a2a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = LINE; ctx.stroke();
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(340 + i * 85, 160); ctx.quadraticCurveTo(350 + i * 85, 400, 330 + i * 85, 720); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke(); }
      for (const h of this.holes) {
        const sx = Math.sin(h.sh * 25) * 8 * h.sh;
        ell(ctx, h.x + sx, h.y, 62, 74, '#1a0e10'); ctx.lineWidth = 6; ctx.strokeStyle = '#3a2418'; ctx.stroke();
        if (h.owl > 0.02) {
          ctx.save(); ctx.beginPath(); ctx.ellipse(h.x, h.y, 60, 72, 0, 0, TAU); ctx.clip();
          const oy = h.y + 80 - h.owl * 80;
          ell(ctx, h.x, oy + 10, 46, 52, '#a8845a'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, h.x, oy + 30, 28, 26, '#e8d0a0');
          for (const s of [-1, 1]) { ell(ctx, h.x + s * 18, oy - 8, 16, 16, '#ffffff'); ctx.stroke(); ell(ctx, h.x + s * 18, oy - 8, 8, 8, '#ffb21a'); ell(ctx, h.x + s * 18, oy - 8, 4, 4, LINE); }
          ctx.beginPath(); ctx.moveTo(h.x - 6, oy + 6); ctx.lineTo(h.x + 6, oy + 6); ctx.lineTo(h.x, oy + 16); ctx.closePath(); ctx.fillStyle = '#ffb23a'; ctx.fill();
          ctx.restore();
        }
      }
      Art.dragon(ctx, 1150, 700, 0.36, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.round / this.rounds, this.phase === 'show' ? 'Смотри внимательно…' : 'Совушки: ' + this.round + ' из ' + this.rounds, '#ffd23f');
    },
  });
})();
