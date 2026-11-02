// Змейка: добрая змейка Лиана собирает фрукты. Смахивай пальцем, чтобы повернуть!
'use strict';
G.scenes.snake = {
  enter() {
    const lvl = GL('snake');
    this.C = 18; this.R = 11; this.cs = 48;
    this.ox = 640 - this.C * this.cs / 2 - 60; this.oy = 120;
    this.need = Math.min(6 + lvl, 22);
    this.tick = Math.max(0.11, 0.3 - lvl * 0.016);
    this.walls = lvl >= 4; // на высоких уровнях стенки опасные, на лёгких — проходим насквозь
    this.rocks = [];
    const nR = lvl >= 6 ? Math.min(lvl - 4, 10) : 0;
    while (this.rocks.length < nR) { const c = M.ri(1, this.C - 2), r = M.ri(1, this.R - 2); if (Math.abs(r - 5) > 1 && !this.rocks.some(q => q.c === c && q.r === r)) this.rocks.push({ c, r }); }
    this.lives = 3; this.eaten = 0; this.won = false; this.lost = false;
    this.reset();
    this.placeFood();
    UI.homeButton(this);
    const ax = 1170, ay = 450;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dc, dr]) => UI.add(this, { x: ax + dc * 78, y: ay + dr * 78, r: 36, color: '#41d982',
      draw: (ctx) => { ctx.save(); ctx.rotate(Math.atan2(dr, dc)); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -16); ctx.lineTo(-10, 16); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); Art.stroke(ctx, 3); ctx.restore(); },
      onTap: () => this.turn(dc, dr) }));
    this.again = UI.add(this, { x: 580, y: 380, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('snake') });
    Voice.say('Это добрая змейка Лиана! Смахивай пальцем или нажимай стрелки, чтобы она поворачивала и ела фрукты.' + (this.walls ? ' В стенки не врезайся!' : ''));
  },
  reset() {
    this.body = [{ c: 5, r: 5 }, { c: 4, r: 5 }, { c: 3, r: 5 }];
    for (let i = 0; i < this.eaten; i++) this.body.push({ c: 3, r: 5 });
    this.dir = { c: 1, r: 0 }; this.queue = []; this.acc = 0; this.wait = 1.2; this.inv = 0;
  },
  free(c, r) { return !this.body.some(b => b.c === c && b.r === r) && !this.rocks.some(q => q.c === c && q.r === r); },
  placeFood() { let c, r, g = 0; do { c = M.ri(0, this.C - 1); r = M.ri(0, this.R - 1); } while (!this.free(c, r) && g++ < 500); this.food = { c, r, ty: M.ri(0, 5) }; },
  turn(dc, dr) {
    const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (last.c === -dc && last.r === -dr) return; // нельзя развернуться назад
    if (last.c === dc && last.r === dr) return;
    if (this.queue.length < 3) this.queue.push({ c: dc, r: dr });
    this.wait = 0;
  },
  down(x, y) { this.sw = { x, y }; },
  move(x, y) {
    if (!this.sw) return; const dx = x - this.sw.x, dy = y - this.sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 36) { if (Math.abs(dx) > Math.abs(dy)) this.turn(Math.sign(dx), 0); else this.turn(0, Math.sign(dy)); this.sw = { x, y }; }
  },
  up() { this.sw = null; },
  crash() {
    this.lives--; Sound.bump(); this.inv = 1;
    const h = this.body[0]; G.burst(this.ox + (h.c + 0.5) * this.cs, this.oy + (h.r + 0.5) * this.cs, { kind: 'star', n: 12, speed: 220 });
    if (this.lives <= 0) { this.lost = true; Voice.say('Ой! Змейка устала. Попробуй ещё раз!'); UI.reward(Math.floor(this.eaten / 3), 600, 400); setTimeout(() => { this.again.hidden = false; }, 1200); return; }
    Voice.say('Ой! Осторожно!'); this.reset();
  },
  step() {
    if (this.queue.length) this.dir = this.queue.shift();
    const h = this.body[0];
    let c = h.c + this.dir.c, r = h.r + this.dir.r;
    if (c < 0 || r < 0 || c >= this.C || r >= this.R) { if (this.walls) return this.crash(); c = (c + this.C) % this.C; r = (r + this.R) % this.R; }
    if (this.rocks.some(q => q.c === c && q.r === r) || this.body.slice(0, -1).some(b => b.c === c && b.r === r)) return this.crash();
    this.body.unshift({ c, r });
    if (c === this.food.c && r === this.food.r) {
      this.eaten++; Sound.chomp(); G.burst(this.ox + (c + 0.5) * this.cs, this.oy + (r + 0.5) * this.cs, { kind: 'star', n: 8, speed: 150, size: 10 });
      if (this.eaten >= this.need) return this.win();
      this.placeFood();
    } else this.body.pop();
  },
  win() {
    this.won = true; GW('snake'); Sound.win(); Sound.purr(1.3);
    UI.reward(5 + Math.floor(this.need / 4), 600, 400);
    Voice.say('Ура! Змейка наелась фруктов! Спасибо тебе!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    this.inv = Math.max(0, this.inv - dt);
    if (this.won || this.lost) return;
    if (this.wait > 0) { this.wait -= dt; return; }
    this.acc += dt;
    while (this.acc >= this.tick && !this.won && !this.lost) { this.acc -= this.tick; this.step(); }
  },
  draw(ctx) {
    const t = G.t, { C, R, cs, ox, oy } = this;
    World.calm(ctx, t, 0.3);
    Art.rr(ctx, ox - 12, oy - 12, C * cs + 24, R * cs + 24, 18); ctx.fillStyle = this.walls ? '#6a4a2a' : '#4caf50'; ctx.fill(); Art.stroke(ctx, 5);
    for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) { ctx.fillStyle = (c + r) % 2 ? '#a8e07a' : '#98d46a'; ctx.fillRect(ox + c * cs, oy + r * cs, cs, cs); }
    for (const q of this.rocks) Art.obstacle(ctx, 'thorn', ox + (q.c + 0.5) * cs, oy + (q.r + 0.5) * cs, cs * 0.33, 0, t);
    Art.treat(ctx, this.food.ty, ox + (this.food.c + 0.5) * cs, oy + (this.food.r + 0.5) * cs + Math.sin(t * 5) * 3, cs / 80, t);
    // змейка: тело из кружков, голова с аниме-глазками
    if (!(this.inv > 0 && Math.sin(t * 30) > 0)) {
      for (let i = this.body.length - 1; i >= 0; i--) {
        const b = this.body[i], x = ox + (b.c + 0.5) * cs, y = oy + (b.r + 0.5) * cs, rr = cs * (i === 0 ? 0.5 : 0.44 - Math.min(0.12, i * 0.006));
        Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); }, i % 2 ? '#ffd23f' : '#ff9a3c', '#d8701a', '#fff6b0', 3, rr * 0.3);
      }
      const h = this.body[0], hx = ox + (h.c + 0.5) * cs, hy = oy + (h.r + 0.5) * cs;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.atan2(this.dir.r, this.dir.c) + Math.PI / 2);
      for (const side of [-1, 1]) Art.animeEye(ctx, side * cs * 0.18, -cs * 0.12, cs * 0.12, cs * 0.15, '#7ee8ff', '#1a4ab0', { side });
      Art.blush(ctx, -cs * 0.28, cs * 0.05, cs * 0.08); Art.blush(ctx, cs * 0.28, cs * 0.05, cs * 0.08);
      Art.flower(ctx, cs * 0.3, -cs * 0.38, cs * 0.12, '#ff7eb6', 0);
      ctx.restore();
    }
    UI.progress(ctx, 330, 26, 420, 44, this.eaten / this.need, '#ffd23f');
    UI.text(ctx, 'Фрукты: ' + this.eaten + ' / ' + this.need, 540, 49, 26, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 820 + i * 44, 50, 38, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    if (this.wait > 0 && !this.won && !this.lost) UI.text(ctx, 'Приготовься…', ox + C * cs / 2, oy + R * cs / 2 - 80, 40, '#fff', 'center', true);
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 580, 270, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
