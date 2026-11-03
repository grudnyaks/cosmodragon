// Конфетный боулинг: смахни пальцем шар вверх по дорожке и сбей кегли
'use strict';
G.scenes.bowling = {
  // дорожка в «своих» координатах: x от -150 до 150, y от 0 (кегли) до 600 (игрок)
  L: { w: 150, top: 150, bottom: 690 },
  enter() {
    const lvl = GL('bowling');
    this.frames = 3; this.frame = 0; this.throwN = 0; this.total = 0;
    this.need = Math.min(12 + Math.floor(lvl * 1.4), 27);
    this.bumper = lvl >= 6 ? { x: 0, y: 260, r: 26, ph: 0, sp: Math.min(1 + (lvl - 6) * 0.15, 2.2) } : null;
    this.state = 'aim'; this.won = false; this.lost = false; this.msg = '';
    this.setPins();
    this.resetBall();
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('bowling') });
    Voice.say('Смахни шар пальцем вверх и сбей кегли! Нужно сбить ' + this.need + '.');
  },
  setPins() {
    this.pins = [];
    const rows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]];
    rows.forEach((r, ri) => r.forEach(c => this.pins.push({ x: c * 26, y: 40 + ri * 40, vx: 0, vy: 0, down: false, gone: false, rot: 0 })));
  },
  resetBall() { this.ball = { x: 0, y: 560, vx: 0, vy: 0, r: 24, spin: 0 }; this.aim = null; this.stillT = 0; },
  // перспектива: дальний конец дорожки уже
  sc(y) { return 0.5 + 0.5 * (y / 600); },
  toScreen(x, y) { const k = this.sc(y); return [640 + x * k * 1.6, this.L.top + y * ((this.L.bottom - this.L.top) / 600) * (0.75 + 0.25 * y / 600)]; },
  down(x, y) {
    if (this.state !== 'aim') return;
    const [bx, by] = this.toScreen(this.ball.x, this.ball.y);
    if (Math.hypot(x - bx, y - by) < 110) this.aim = { x0: x, y0: y, x, y, t0: G.t };
  },
  move(x, y) { if (this.aim) { this.aim.x = x; this.aim.y = y; this.ball.x = M.clamp((x - 640) / 1.6, -this.L.w + 26, this.L.w - 26) * 0.3 + this.ball.x * 0.7; } },
  up(x, y) {
    if (!this.aim) return;
    const a = this.aim; this.aim = null;
    const dx = x - a.x0, dy = y - a.y0, dt = Math.max(0.08, G.t - a.t0);
    if (dy > -40) return; // нужно смахнуть вверх
    const sp = M.clamp(Math.hypot(dx, dy) / dt, 350, 1300);
    const ang = Math.atan2(dy, dx * 0.8);
    this.ball.vx = Math.cos(ang) * sp * 0.55; this.ball.vy = Math.sin(ang) * sp * 0.75;
    this.state = 'roll'; Sound.whoosh(); this.stillT = 0;
  },
  update(dt) {
    if (this.bumper) { this.bumper.ph += dt * this.bumper.sp; this.bumper.x = Math.sin(this.bumper.ph) * (this.L.w - 40); }
    if (this.state !== 'roll') return;
    const b = this.ball, steps = 4, h = dt / steps;
    for (let s = 0; s < steps; s++) {
      b.x += b.vx * h; b.y += b.vy * h; b.spin += b.vy * h * 0.05;
      if (Math.abs(b.x) > this.L.w - b.r * 0.6) { b.vx *= -0.3; b.x = Math.sign(b.x) * (this.L.w - b.r * 0.6); b.vy *= 0.8; } // бортик
      if (this.bumper) { const q = this.bumper, d = Math.hypot(b.x - q.x, b.y - q.y); if (d < b.r + q.r) { const nx = (b.x - q.x) / d, ny = (b.y - q.y) / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.8 * vn * nx; b.vy -= 1.8 * vn * ny; Sound.boing(); } } }
      for (const p of this.pins) {
        if (p.gone) continue;
        p.x += p.vx * h; p.y += p.vy * h; p.vx *= 0.995; p.vy *= 0.995;
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < b.r + 12 && d > 0) {
          const nx = (p.x - b.x) / d, ny = (p.y - b.y) / d, rel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
          if (rel > 0) { p.vx += nx * rel * 1.1; p.vy += ny * rel * 1.1; b.vx -= nx * rel * 0.25; b.vy -= ny * rel * 0.25; if (!p.down) { p.down = true; Sound.pop(0.8 + Math.random() * 0.4); } }
          p.x = b.x + nx * (b.r + 12); p.y = b.y + ny * (b.r + 12);
        }
        if (Math.abs(p.x) > this.L.w + 10 || p.y < -60 || p.y > 640) { p.down = true; p.gone = true; }
      }
      // кегли сбивают друг друга
      for (let i = 0; i < this.pins.length; i++) for (let j = i + 1; j < this.pins.length; j++) {
        const a = this.pins[i], c = this.pins[j]; if (a.gone || c.gone) continue;
        const d = Math.hypot(a.x - c.x, a.y - c.y);
        if (d < 22 && d > 0) {
          const nx = (c.x - a.x) / d, ny = (c.y - a.y) / d, rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
          if (rel > 0) { a.vx -= nx * rel; a.vy -= ny * rel; c.vx += nx * rel; c.vy += ny * rel; if (rel > 40) { a.down = c.down = true; } }
          const ov = (22 - d) / 2; a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
        }
      }
    }
    for (const p of this.pins) if (p.down) p.rot = Math.min(1.4, p.rot + dt * 6);
    const moving = Math.hypot(b.vx, b.vy) > 30 && b.y > -80 || this.pins.some(p => !p.gone && Math.hypot(p.vx, p.vy) > 20);
    if (!moving || b.y < -120) { this.stillT += dt; if (this.stillT > 0.6) this.endThrow(); }
  },
  endThrow() {
    const fallen = this.pins.filter(p => p.down && !p.counted);
    fallen.forEach(p => { p.counted = true; p.gone = true; });
    this.total += fallen.length;
    const standing = this.pins.filter(p => !p.down).length;
    if (fallen.length) Sound.chime(1 + fallen.length * 0.03);
    if (standing === 0 && this.throwN === 0) { this.msg = 'СТРАЙК!'; Voice.say('Страйк! Все кегли!'); Sound.win(); G.burst(640, 200, { kind: 'star', n: 40, speed: 380 }); stat('strike'); }
    else if (standing === 0) { this.msg = 'Все сбиты!'; Voice.say('Ура, все сбиты!'); }
    else this.msg = 'Сбито: ' + fallen.length;
    this.msgT = G.t;
    this.state = 'wait';
    setTimeout(() => {
      if (G.scene !== this) return;
      if (this.total >= this.need) return this.win();
      if (standing > 0 && this.throwN === 0) { this.throwN = 1; this.resetBall(); this.state = 'aim'; return; }
      this.frame++; this.throwN = 0;
      if (this.frame >= this.frames) return this.lose();
      this.setPins(); this.resetBall(); this.state = 'aim';
    }, 1300);
  },
  win() {
    this.won = true; this.state = 'done'; GW('bowling');
    Sound.win(); Sound.purr(1.4);
    UI.reward(5 + Math.floor(this.total / 5), 640, 300);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Победа! Отличный бросок!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  lose() {
    this.lost = true; this.state = 'done';
    Voice.say('Почти получилось! Попробуй ещё раз!');
    UI.reward(Math.floor(this.total / 6), 640, 300);
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  drawPin(ctx, p) {
    const [x, y] = this.toScreen(p.x, p.y), k = this.sc(p.y) * 1.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(p.rot * Math.sign(p.vx || 1));
    ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, 0, 4, 14, 5, '#1a1030'); ctx.restore();
    Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(10, -46, 9, -34); ctx.quadraticCurveTo(7, -26, 8, -20); ctx.quadraticCurveTo(16, -6, 11, 4); ctx.lineTo(-11, 4); ctx.quadraticCurveTo(-16, -6, -8, -20); ctx.quadraticCurveTo(-7, -26, -9, -34); ctx.quadraticCurveTo(-10, -46, 0, -46); ctx.closePath(); }, '#ffffff', '#d6d0ea', null, 2.5, 4);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(-8, -30, 16, 4); ctx.fillStyle = '#ff7eb6'; ctx.fillRect(-8, -24, 16, 3);
    ctx.restore();
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.3);
    // дорожка
    const [lx0, ly0] = this.toScreen(-this.L.w, 0), [rx0] = this.toScreen(this.L.w, 0), [lx1, ly1] = this.toScreen(-this.L.w, 600), [rx1] = this.toScreen(this.L.w, 600);
    ctx.beginPath(); ctx.moveTo(lx0 - 20, ly0 - 40); ctx.lineTo(rx0 + 20, ly0 - 40); ctx.lineTo(rx1 + 30, ly1 + 40); ctx.lineTo(lx1 - 30, ly1 + 40); ctx.closePath(); ctx.fillStyle = '#8f6cf2'; ctx.fill(); Art.stroke(ctx, 4);
    ctx.beginPath(); ctx.moveTo(lx0, ly0 - 40); ctx.lineTo(rx0, ly0 - 40); ctx.lineTo(rx1, ly1 + 40); ctx.lineTo(lx1, ly1 + 40); ctx.closePath();
    const g = ctx.createLinearGradient(0, ly0, 0, ly1); g.addColorStop(0, '#f6d8a8'); g.addColorStop(1, '#ffe9c8'); ctx.fillStyle = g; ctx.fill(); Art.stroke(ctx, 3);
    ctx.save(); ctx.globalAlpha = 0.25; for (let i = -4; i <= 4; i++) { const [a0] = this.toScreen(i * 30, 0), [a1] = this.toScreen(i * 30, 600); ctx.beginPath(); ctx.moveTo(a0, ly0 - 40); ctx.lineTo(a1, ly1 + 40); Art.stroke(ctx, 2, '#a8702a'); } ctx.restore();
    for (const i of [-2, -1, 0, 1, 2]) { const [ax, ay] = this.toScreen(i * 40, 420); Art.roundStar(ctx, ax, ay, 8, '#ff7eb6'); }
    if (this.bumper) { const [bx, by] = this.toScreen(this.bumper.x, this.bumper.y); Art.treat(ctx, 2, bx, by, 0.7 * this.sc(this.bumper.y) * 1.3, t); }
    // кегли (дальние — первыми)
    const pins = this.pins.filter(p => !p.gone).sort((a, b) => a.y - b.y);
    for (const p of pins) this.drawPin(ctx, p);
    // шар
    const b = this.ball;
    if (this.state !== 'done' && b.y > -100) {
      const [x, y] = this.toScreen(b.x, b.y), k = this.sc(b.y) * 1.4;
      ctx.save(); ctx.globalAlpha = 0.3; Art.ell(ctx, x, y + b.r * k * 0.9, b.r * k, 7 * k, '#1a1030'); ctx.restore();
      Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(x, y, b.r * k, 0, Math.PI * 2); }, '#b07cff', '#6a3ac8', '#ffffff', 3.5, 8 * k);
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.spin); for (const [hx, hy] of [[-6, -8], [5, -9], [0, 2]]) Art.ell(ctx, hx * k, hy * k, 3 * k, 3 * k, '#2a1650'); ctx.restore();
      Art.sparkle(ctx, x - 8 * k, y - 10 * k, 6 * k, '#fff');
    }
    if (this.aim) { ctx.save(); ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(this.aim.x0, this.aim.y0); ctx.lineTo(this.aim.x, this.aim.y); Art.stroke(ctx, 6, '#ffd23f'); ctx.restore(); }
    if (this.state === 'aim' && !this.aim) { const [x, y] = this.toScreen(b.x, b.y); const k = (t * 0.8) % 1; ctx.save(); ctx.globalAlpha = 1 - k; Art.ell(ctx, x, y - 60 - k * 120, 20, 20, '#ffffff'); ctx.restore(); }
    // табло
    UI.progress(ctx, 330, 26, 420, 44, this.total / this.need, '#ffd23f');
    UI.text(ctx, 'Кегли: ' + this.total + ' / ' + this.need, 540, 49, 26, '#fff', 'center', true);
    UI.text(ctx, 'Раунд ' + Math.min(this.frame + 1, this.frames) + ' из ' + this.frames + (this.throwN ? ' · бросок 2' : ''), 900, 49, 24, '#fff', 'center', true);
    if (this.msg && G.t - this.msgT < 1.4) { const k = Math.min(1, (G.t - this.msgT) * 4); ctx.save(); ctx.globalAlpha = 1 - Math.max(0, (G.t - this.msgT - 1) / 0.4); UI.text(ctx, this.msg, 640, 300 - (1 - k) * 30, this.msg === 'СТРАЙК!' ? 80 : 50, '#ffd23f', 'center', true); ctx.restore(); }
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
