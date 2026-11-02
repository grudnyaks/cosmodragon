// Космо-зайчики: зайчики выглядывают из кратеров — успей их погладить, а метеориты не трогай
'use strict';
G.scenes.bunny = {
  enter() {
    const lvl = GL('bunny');
    const nHoles = lvl < 2 ? 6 : 9;
    const rows = nHoles === 6 ? [[330, 640, 950], [330, 640, 950]] : [[330, 640, 950], [330, 640, 950], [330, 640, 950]];
    const ys = nHoles === 6 ? [440, 620] : [380, 520, 660];
    this.holes = [];
    rows.forEach((r, ri) => r.forEach(x => this.holes.push({ x, y: ys[ri], up: 0, kind: null, t: 0, hit: false, stay: 0 })));
    this.goal = Math.min(12 + lvl * 2, 30);
    this.score = 0; this.time = 40; this.won = false; this.over = false;
    this.stay = Math.max(0.75, 1.5 - lvl * 0.08);
    this.gap = Math.max(0.35, 0.9 - lvl * 0.06);
    this.spawnT = 1.5;
    this.meteorP = Math.min(0.15 + lvl * 0.03, 0.35);
    this.maxUp = lvl < 3 ? 2 : 3;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 250, r: 64, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('bunny') });
    Voice.say('Погладь космо-зайчиков, пока они выглядывают! А метеориты не трогай!');
  },
  down(x, y) {
    if (this.won || this.over) return;
    const sc = this.holes.length === 9 ? 0.8 : 1;
    for (const h of this.holes) {
      if (!h.kind || h.up < 0.4 || h.hit) continue;
      if (Math.abs(x - h.x) < 75 * sc && y < h.y + 20 && y > h.y - 140 * sc) {
        h.hit = true;
        if (h.kind === 'bunny') {
          this.score++; Sound.pop(1.3); Sound.chime(1 + (this.score % 5) * 0.1);
          G.burst(h.x, h.y - 80 * sc, { kind: 'heart', n: 5, up: true, g: -80, speed: 140, colors: ['#ff5e9a', '#ffb3d0'] });
          if (this.score >= this.goal) this.win();
        } else {
          this.score = Math.max(0, this.score - 2); Sound.bump();
          G.burst(h.x, h.y - 60, { kind: 'dot', n: 12, colors: ['#b39a86', '#6b5246'], speed: 200 });
          G.floatText(h.x, h.y - 140, '-2', '#ff8fa0');
        }
        G.wait(0.35, () => { h.goingDown = true; });
        return;
      }
    }
  },
  win() {
    this.won = true;
    GW('bunny');
    Sound.win(); Sound.purr(1.6);
    UI.reward(6, 640, 400);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Все зайчики поглажены! Какой ты быстрый!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  timeUp() {
    this.over = true;
    Voice.say('Время вышло! Ты погладил ' + this.score + '. Попробуй ещё раз!');
    UI.reward(Math.floor(this.score / 4), 640, 400);
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  update(dt) {
    if (!this.won && !this.over) {
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; this.timeUp(); }
      this.spawnT -= dt;
      const upCount = this.holes.filter(h => h.kind).length;
      if (this.spawnT <= 0 && upCount < this.maxUp) {
        const free = this.holes.filter(h => !h.kind);
        if (free.length) {
          const h = M.pick(free);
          h.kind = Math.random() < this.meteorP ? 'meteor' : 'bunny';
          h.up = 0; h.hit = false; h.goingDown = false; h.stay = this.stay * M.rnd(0.85, 1.2);
        }
        this.spawnT = M.rnd(this.gap, this.gap * 1.5);
      }
    }
    for (const h of this.holes) {
      if (!h.kind) continue;
      if (!h.goingDown) {
        h.up = Math.min(1, h.up + dt * 6);
        if (h.up >= 1) { h.stay -= dt; if (h.stay <= 0 && !h.hit) h.goingDown = true; }
      } else {
        h.up -= dt * 5;
        if (h.up <= 0) { h.up = 0; h.kind = null; h.goingDown = false; }
      }
    }
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { noDecor: true, noBeacon: true });
    const sc = this.holes.length === 9 ? 0.8 : 1;
    const sorted = this.holes.slice().sort((a, b) => a.y - b.y);
    for (const h of sorted) {
      Art.ell(ctx, h.x, h.y, 92 * sc, 30 * sc, '#2a8f8a'); ctx.lineWidth = 5; ctx.strokeStyle = '#3a1f4a'; ctx.stroke();
      Art.ell(ctx, h.x, h.y + 3, 74 * sc, 20 * sc, '#163f4a');
      if (h.kind) {
        ctx.save();
        ctx.beginPath(); ctx.rect(h.x - 120, h.y - 260, 240, 262); ctx.clip();
        const yy = h.y + (1 - G.ease.outBack(h.up)) * 150 * sc;
        if (h.kind === 'bunny') Art.critter(ctx, null, h.x, yy + 10, 0.9 * sc, t, h.hit ? 1 : 0);
        else Art.obstacle(ctx, null, h.x, yy - 50 * sc, 48 * sc, t * 2, t, 4);
        ctx.restore();
      }
      // передний край кратера
      ctx.beginPath(); ctx.ellipse(h.x, h.y, 92 * sc, 30 * sc, 0, 0.05, Math.PI - 0.05); ctx.lineWidth = 8 * sc; ctx.strokeStyle = '#62d8c4'; ctx.stroke();
    }
    // табло
    UI.progress(ctx, 400, 26, 480, 46, this.score / this.goal, '#ff6f91');
    Art.critter(ctx, null, 400, 70, 0.32, t, 0);
    UI.text(ctx, this.score + ' / ' + this.goal, 640, 50, 30, '#fff', 'center', true);
    // часики
    const k = this.time / 40;
    Art.ell(ctx, 960, 50, 30, 30, '#fff'); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(960, 50); ctx.arc(960, 50, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fillStyle = k < 0.25 ? '#ff3b5c' : '#41d982'; ctx.fill();
    UI.text(ctx, String(Math.ceil(this.time)), 1010, 52, 28, '#fff', 'left', true);
    if ((this.won || this.over) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 150, 44, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
