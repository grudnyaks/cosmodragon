// Огненная катапульта: оттяни огненный шар назад и отпусти — растопи ледяные башни со злыми ледышками
'use strict';
G.scenes.catapult = {
  BS: 52, GROUND: 640,
  enter() {
    const lvl = GL('catapult');
    this.sling = { x: 210, y: 470 };
    const nT = Math.min(2 + Math.floor(lvl / 2), 6);
    this.cols = [];
    const nC = Math.min(3 + Math.floor(lvl / 3), 6);
    for (let i = 0; i < nC; i++) this.cols.push({ x: 720 + i * (440 / Math.max(1, nC - 1)) * (nC > 1 ? 1 : 0), h: M.ri(1, Math.min(2 + Math.floor(lvl / 3), 6)), target: false });
    M.shuffle(this.cols.slice()).slice(0, Math.min(nT, nC)).forEach(c => { c.target = true; });
    this.extraT = []; // летающие ледышки на высоких уровнях
    if (lvl >= 7) this.extraT.push({ x: 760, y: 200, ph: 0, alive: true });
    this.shots = this.targetsLeft() + 3;
    this.ball = null; this.drag = null; this.won = false; this.lost = false;
    this.preview = Math.max(0.15, 0.9 - lvl * 0.07);
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('catapult') });
    Voice.say('Оттяни огненный шар пальцем назад и отпусти! Растопи всех злых ледышек на башнях.');
  },
  targetsLeft() { return this.cols.filter(c => c.target).length + this.extraT.filter(e => e.alive).length; },
  down(x, y) {
    if (this.ball || this.won || this.lost) return;
    if (Math.hypot(x - this.sling.x, y - this.sling.y) < 110) this.drag = { x, y };
  },
  move(x, y) { if (this.drag) { const dx = x - this.sling.x, dy = y - this.sling.y, d = Math.hypot(dx, dy), m = Math.min(d, 140) / (d || 1); this.drag.x = this.sling.x + dx * m; this.drag.y = this.sling.y + dy * m; } },
  vel() { return { vx: (this.sling.x - this.drag.x) * 7.5, vy: (this.sling.y - this.drag.y) * 7.5 }; },
  up() {
    if (!this.drag) return;
    const v = this.vel(); const pull = Math.hypot(this.sling.x - this.drag.x, this.sling.y - this.drag.y);
    if (pull < 25) { this.drag = null; return; }
    this.ball = { x: this.drag.x, y: this.drag.y, vx: v.vx, vy: v.vy, life: 4 };
    this.drag = null; this.shots--; Sound.whoosh(); Sound.fire();
  },
  explode(x, y) {
    Sound.bump(); Sound.fire();
    G.burst(x, y, { kind: 'dot', n: 22, colors: ['#ffb23a', '#ff5a1a', '#fff27a', '#bff5ff'], speed: 320 });
    const BS = this.BS;
    for (const c of this.cols) {
      // блок, в который попали (и соседний по радиусу)
      for (let k = c.h - 1; k >= 0; k--) {
        const by = this.GROUND - (k + 0.5) * BS;
        if (Math.abs(x - c.x) < BS * 0.9 && Math.abs(y - by) < BS * 0.9) { c.h--; G.burst(c.x, by, { kind: 'smoke', n: 6, colors: ['#ffffff', '#bff5ff'], g: -40, speed: 120, size: 16 }); break; }
      }
      const ty = this.GROUND - c.h * BS - 30;
      if (c.target && Math.hypot(x - c.x, y - ty) < 70) { c.target = false; this.killFx(c.x, ty); }
    }
    for (const e of this.extraT) if (e.alive && Math.hypot(x - e.x, y - e.y) < 70) { e.alive = false; this.killFx(e.x, e.y); }
    this.ball = null;
    setTimeout(() => this.check(), 700);
  },
  killFx(x, y) { Sound.chime(1.3); G.floatText(x, y - 50, 'Пш-ш!', '#bff5ff'); G.burst(x, y, { kind: 'star', n: 14, speed: 240 }); },
  check() {
    if (G.scene !== this || this.won || this.lost) return;
    if (this.targetsLeft() === 0) {
      this.won = true; GW('catapult'); Sound.win(); Sound.purr(1.3);
      UI.reward(4 + this.shots * 2, 900, 400);
      Voice.say(this.shots > 0 ? 'Ура! Все ледышки растаяли! И ещё остались огненные шары!' : 'Ура! Все ледышки растаяли!');
      setTimeout(() => { this.again.hidden = false; }, 1400);
    } else if (this.shots <= 0 && !this.ball) {
      this.lost = true; Voice.say('Огненные шары закончились! Попробуй ещё раз.');
      setTimeout(() => { this.again.hidden = false; }, 1200);
    }
  },
  update(dt) {
    for (const e of this.extraT) { e.ph += dt; e.x = 820 + Math.sin(e.ph * 0.9) * 180; e.y = 220 + Math.sin(e.ph * 1.7) * 60; }
    const b = this.ball; if (!b) return;
    const steps = 3, h = dt / steps;
    for (let s = 0; s < steps && this.ball; s++) {
      b.vy += 900 * h; b.x += b.vx * h; b.y += b.vy * h; b.life -= h;
      if (Math.random() < 0.3) G.burst(b.x, b.y, { kind: 'dot', n: 1, colors: ['#ffb23a', '#ff5a1a'], speed: 30, g: -50, life: 0.5, size: 10 });
      if (b.y > this.GROUND - 8) return this.explode(b.x, this.GROUND - 10);
      for (const c of this.cols) {
        const top = this.GROUND - c.h * this.BS - (c.target ? 60 : 0);
        if (Math.abs(b.x - c.x) < this.BS * 0.55 + 14 && b.y > top) return this.explode(b.x, b.y);
      }
      for (const e of this.extraT) if (e.alive && Math.hypot(b.x - e.x, b.y - e.y) < 50) return this.explode(b.x, b.y);
      if (b.x > G.view.x1 + 60 || b.x < G.view.x0 - 60 || b.life <= 0) { this.ball = null; setTimeout(() => this.check(), 300); }
    }
  },
  draw(ctx) {
    const t = G.t, BS = this.BS;
    World.bg(ctx, t, { noDecor: true, noBeacon: true });
    // башни
    for (const c of this.cols) {
      for (let k = 0; k < c.h; k++) {
        const y = this.GROUND - (k + 1) * BS;
        Art.cel(ctx, () => { Art.rr(ctx, c.x - BS / 2, y, BS, BS, 8); }, '#bfeaff', '#6aa8d8', '#ffffff', 3.5, 8);
        ctx.save(); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(c.x - BS / 2 + 10, y + 12); ctx.lineTo(c.x - 4, y + 22); Art.stroke(ctx, 2, '#ffffff'); ctx.restore();
      }
      if (c.target) Art.obstacle(ctx, 'icicle', c.x, this.GROUND - c.h * BS - 32, 32, Math.sin(t * 2 + c.x) * 0.1, t);
    }
    for (const e of this.extraT) if (e.alive) { Art.obstacle(ctx, 'icicle', e.x, e.y, 30, Math.sin(t * 3) * 0.2, t); Art.icon(ctx, 'wing', e.x - 34, e.y - 6, 0.6); }
    // катапульта
    const sx = this.sling.x, sy = this.sling.y;
    ctx.beginPath(); ctx.moveTo(sx - 20, this.GROUND); ctx.lineTo(sx, sy + 40); ctx.lineTo(sx + 20, this.GROUND); Art.stroke(ctx, 14, '#1a1030'); ctx.beginPath(); ctx.moveTo(sx - 20, this.GROUND); ctx.lineTo(sx, sy + 40); ctx.lineTo(sx + 20, this.GROUND); Art.stroke(ctx, 9, '#8a5a2a');
    ctx.beginPath(); ctx.moveTo(sx, sy + 40); ctx.lineTo(sx - 30, sy - 10); ctx.moveTo(sx, sy + 40); ctx.lineTo(sx + 30, sy - 10); Art.stroke(ctx, 12, '#1a1030'); ctx.beginPath(); ctx.moveTo(sx, sy + 40); ctx.lineTo(sx - 30, sy - 10); ctx.moveTo(sx, sy + 40); ctx.lineTo(sx + 30, sy - 10); Art.stroke(ctx, 8, '#a8742a');
    const bx = this.drag ? this.drag.x : sx, by = this.drag ? this.drag.y : sy;
    if (!this.ball && this.shots > 0 && !this.won && !this.lost) {
      ctx.beginPath(); ctx.moveTo(sx - 30, sy - 10); ctx.lineTo(bx, by); ctx.lineTo(sx + 30, sy - 10); Art.stroke(ctx, 4, '#5a2a1a');
      this.fireball(ctx, bx, by, t);
      if (this.drag) { // подсказка траектории
        const v = this.vel(); let x = bx, y = by, vx = v.vx, vy = v.vy;
        for (let i = 0; i < 30 * this.preview; i++) { vy += 900 * 0.03; x += vx * 0.03; y += vy * 0.03; if (i % 2 === 0) { ctx.save(); ctx.globalAlpha = 0.8 - i / 40; Art.ell(ctx, x, y, 5, 5, '#fff3a0'); ctx.restore(); } }
      }
    }
    if (this.ball) this.fireball(ctx, this.ball.x, this.ball.y, t);
    Art.dragon(ctx, 90, 650, 0.45, { t, look: 1, fire: this.ball ? 0.3 : 0 });
    // табло
    UI.text(ctx, 'Ледышки: ' + this.targetsLeft(), 470, 50, 30, '#bff5ff', 'center', true);
    for (let i = 0; i < this.shots; i++) this.fireball(ctx, 650 + i * 40, 50, t, 0.6);
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 230, 48, '#fff', 'center', true);
  },
  fireball(ctx, x, y, t, s) {
    s = s || 1;
    ctx.save(); ctx.globalAlpha = 0.5; Art.ell(ctx, x, y, 30 * s, 30 * s); ctx.fillStyle = Art.rg(ctx, x, y, 30 * s, '#ffb23a', 'rgba(255,90,30,0)', 0, 0); ctx.fill(); ctx.restore();
    Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(x, y, 18 * s, 0, Math.PI * 2); }, '#ff7a1a', '#c8300a', '#fff27a', 3, 5 * s);
    Art.ell(ctx, x - 4 * s, y - 4 * s, 6 * s, 6 * s, '#fff27a');
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
