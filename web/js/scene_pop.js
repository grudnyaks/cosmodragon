// Пузырьки: лопай только нужные — по цвету, по цифре или по количеству точек
'use strict';
const POP_COLORS = [['#ff4a6a', 'красные'], ['#3a8aff', 'синие'], ['#ffd23f', 'жёлтые'], ['#41d982', 'зелёные'], ['#b07cff', 'фиолетовые'], ['#ff9a3c', 'оранжевые']];
const NUM_GEN = ['', 'одной', 'двумя', 'тремя', 'четырьмя', 'пятью', 'шестью', 'семью', 'восемью', 'девятью'];
G.scenes.pop = {
  enter() {
    const lvl = GL('pop');
    this.mode = lvl < 3 ? 'color' : lvl < 6 ? 'digit' : lvl < 9 ? 'dots' : 'mix';
    this.maxN = Math.min(3 + lvl, 9);
    this.need = Math.min(8 + lvl, 22);
    this.time = 50; this.got = 0; this.miss = 0; this.won = false; this.over = false;
    this.speed = Math.min(70 + lvl * 8, 180);
    this.spawnGap = Math.max(0.35, 0.8 - lvl * 0.04);
    this.bubbles = []; this.spawnT = 0.2;
    this.newTarget(true);
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('pop') });
  },
  newTarget(first) {
    const old = this.target;
    if (this.mode === 'color') { do { this.target = M.ri(0, 3 + Math.min(2, Math.floor(GL('pop') / 2))); } while (this.target === old && !first); }
    else { do { this.target = M.ri(1, this.maxN); } while (this.target === old && !first); }
    this.sinceTarget = 0;
    const say = this.mode === 'color' ? 'Лопай ' + POP_COLORS[this.target][1] + ' пузыри!'
      : this.mode === 'dots' ? 'Лопай пузыри с ' + NUM_GEN[this.target] + (this.target === 1 ? ' точкой!' : ' точками!')
      : 'Лопай пузыри с цифрой ' + NUM_WORDS[this.target] + '!';
    Voice.say((first ? '' : 'Теперь новое задание! ') + say);
    this.bannerT = 2;
  },
  spawn() {
    const good = Math.random() < 0.42;
    let v;
    if (this.mode === 'color') { v = good ? this.target : M.ri(0, 5); }
    else { v = good ? this.target : M.ri(1, this.maxN); }
    const show = this.mode === 'mix' ? (Math.random() < 0.5 ? 'dots' : 'digit') : this.mode;
    this.bubbles.push({ x: M.rnd(120, 1160), y: G.view.y1 + 70, r: M.rnd(50, 62), v, show, vy: this.speed * M.rnd(0.8, 1.25), ph: Math.random() * 6, pop: 0, wig: 0 });
  },
  isGood(b) { return b.v === this.target; },
  down(x, y) {
    if (this.won || this.over) return;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.pop) continue;
      const bx = b.x + Math.sin(G.t * 1.5 + b.ph) * 20;
      if (Math.hypot(x - bx, y - b.y) < b.r + 8) {
        if (this.isGood(b)) {
          b.pop = 1; this.got++; this.sinceTarget++; Sound.pop(1.4); Sound.chime(1 + (this.got % 6) * 0.08);
          G.burst(bx, b.y, { kind: 'dot', n: 12, colors: ['#ffffff', '#bff5ff', this.mode === 'color' ? POP_COLORS[b.v][0] : '#ffd23f'], speed: 220, g: 0 });
          if (this.got >= this.need) this.win();
          else if (this.mode !== 'color' && this.sinceTarget >= 5) this.newTarget(false);
          else if (this.mode === 'color' && this.sinceTarget >= 6) this.newTarget(false);
        } else {
          b.wig = 1; G.tween(b, { wig: 0 }, 0.5); Sound.boing(); this.miss++;
          this.time = Math.max(0, this.time - 2); G.floatText(bx, b.y - 60, '−2 сек', '#ff8fa0');
        }
        return;
      }
    }
  },
  win() {
    this.won = true; GW('pop');
    Sound.win(); UI.reward(5 + Math.floor(this.need / 6), 640, 400);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Все нужные пузырьки лопнули! Молодец!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    this.bannerT = Math.max(0, this.bannerT - dt);
    if (!this.won && !this.over) {
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; this.over = true; Voice.say('Время вышло! Попробуй ещё раз!'); UI.reward(Math.floor(this.got / 4), 640, 400); setTimeout(() => { this.again.hidden = false; }, 1200); }
      this.spawnT -= dt;
      if (this.spawnT <= 0) { this.spawn(); this.spawnT = M.rnd(this.spawnGap, this.spawnGap * 1.6); }
    }
    for (const b of this.bubbles) { if (b.pop) b.pop += dt * 4; else b.y -= b.vy * dt; }
    this.bubbles = this.bubbles.filter(b => b.y > G.view.y0 - 100 && b.pop < 1.5);
  },
  drawBubble(ctx, b, t) {
    const x = b.x + Math.sin(t * 1.5 + b.ph) * 20 + Math.sin(t * 40) * 8 * b.wig, y = b.y, r = b.r * (1 + (b.pop ? b.pop * 0.6 : 0));
    ctx.save(); if (b.pop) ctx.globalAlpha = Math.max(0, 1 - b.pop);
    const tint = b.show === 'color' ? POP_COLORS[b.v][0] : '#bfe8ff';
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, Art.mix(tint, '#ffffff', 0.45) + 'cc'); g.addColorStop(1, tint + 'ee');
    Art.ell(ctx, x, y, r, r); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#1a1030'; ctx.stroke();
    Art.ell(ctx, x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.13, 'rgba(255,255,255,0.95)', -0.6);
    if (b.show === 'digit') UI.text(ctx, String(b.v), x, y + 3, r * 1.0, '#2a1650', 'center', false);
    if (b.show === 'dots') {
      const pts = DOTS[b.v] || [];
      for (const [dx, dy] of pts) Art.ell(ctx, x + dx * r * 0.42, y + dy * r * 0.42, r * 0.13, r * 0.13, '#2a1650');
    }
    ctx.restore();
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.2);
    for (const b of this.bubbles) this.drawBubble(ctx, b, t);
    // задание
    Art.rr(ctx, 340, 18, 600, 92, 30); ctx.fillStyle = 'rgba(30,14,70,0.75)'; ctx.fill(); Art.stroke(ctx, 4, '#ffd6f0');
    const sample = { x: 400, y: 64, r: 34, v: this.target, show: this.mode === 'mix' ? 'digit' : this.mode, ph: 0, pop: 0, wig: 0 };
    ctx.save(); ctx.translate(-Math.sin(t * 1.5) * 20, 0); this.drawBubble(ctx, sample, t); ctx.restore();
    UI.text(ctx, this.mode === 'color' ? 'Лопай такие!' : this.mode === 'dots' ? 'Столько точек!' : 'Такую цифру!', 520, 48, 28, '#fff', 'left', true);
    UI.progress(ctx, 520, 72, 300, 26, this.got / this.need, '#ffd23f');
    UI.text(ctx, this.got + '/' + this.need, 880, 86, 24, '#fff', 'center', true);
    // часы
    const k = this.time / 50;
    Art.ell(ctx, 1000, 64, 30, 30, '#fff'); Art.stroke(ctx, 4);
    ctx.beginPath(); ctx.moveTo(1000, 64); ctx.arc(1000, 64, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fillStyle = k < 0.25 ? '#ff3b5c' : '#41d982'; ctx.fill();
    if ((this.won || this.over) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
// расположение точек как на кубике (1..9)
const DOTS = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]], 8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
  9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
};
