// Лови вкусняшки: веди дракончика пальцем, он ловит ртом падающие вкусняшки
'use strict';
G.scenes.catch = {
  enter() {
    const lvl = GL('catch');
    this.goal = Math.min(16 + lvl * 3, 40);
    this.got = 0; this.won = false; this.lost = false; this.lives = 3;
    this.meteorP = Math.min(0.18 + lvl * 0.03, 0.4);
    this.gap = Math.max(0.45, 1.05 - lvl * 0.06);
    this.items = []; this.spawnT = 0.8;
    this.dr = { x: 640, tx: 640, mouth: 0, squash: 0, happy: 0, shake: 0 };
    this.speed = Math.min(170 + lvl * 20, 400);
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('catch') });
    Voice.say('Вкусняшки падают с неба! Води пальцем, чтобы дракончик их ловил. А от метеоритов уворачивайся!');
  },
  down(x) { this.dr.tx = x; },
  move(x) { this.dr.tx = x; },
  update(dt) {
    const d = this.dr;
    d.tx = M.clamp(d.tx, 110, 1170);
    d.x += (d.tx - d.x) * Math.min(1, dt * (hasAbility('paws') ? 14 : 7));
    d.happy = Math.max(0, d.happy - dt); d.shake = Math.max(0, d.shake - dt);
    if (this.won || this.lost) return;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const meteor = Math.random() < this.meteorP;
      this.items.push({ x: M.rnd(140, 1140), y: -60, vy: this.speed * M.rnd(0.85, 1.15), ty: M.ri(0, 4), meteor, rot: 0, sway: M.rnd(0, 6) });
      this.spawnT = M.rnd(this.gap, this.gap * 1.6);
    }
    const mouthY = 690 + Art.dragonHeadY(PS().level, 0.62);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.vy * dt; it.rot += dt * (it.meteor ? 2 : 0.5);
      if (!it.meteor && hasAbility('magnet') && it.y > 300 && Math.abs(it.x - d.x) < 240) it.x += Math.sign(d.x - it.x) * Math.min(Math.abs(d.x - it.x), 160 * dt);
      const x = it.x + Math.sin(G.t * 2 + it.sway) * 12;
      const reach = hasAbility('paws') ? 110 : 80;
      if (Math.abs(it.y - mouthY) < 45 && Math.abs(x - d.x) < reach) {
        this.items.splice(i, 1);
        if (it.meteor) {
          Sound.bump(); d.shake = 0.5; this.lives--;
          G.burst(x, it.y, { kind: 'dot', n: 12, colors: ['#b39a86', '#6b5246'], speed: 220 });
          if (this.lives <= 0) { this.lose(); return; }
          Voice.say(M.pick(['Ой! Это не вкусно!', 'Бум! Метеорит!']));
        } else {
          Sound.chomp(); this.got++;
          d.mouth = 1; G.tween(d, { mouth: 0 }, 0.4); d.squash = 0.4; G.tween(d, { squash: 0 }, 0.5, G.ease.outElastic);
          d.happy = 0.8;
          G.burst(x, it.y, { kind: 'star', n: 8, speed: 180, size: 12 });
          if (this.got % 4 === 0) Sound.purr(1);
          if (this.got >= this.goal) { this.win(); return; }
        }
        continue;
      }
      if (it.y > 760) {
        this.items.splice(i, 1);
        if (!it.meteor) G.burst(x, 700, { kind: 'smoke', n: 4, colors: ['#ffffff'], g: -30, speed: 60, size: 10 });
      }
    }
  },
  lose() {
    this.lost = true; this.items.length = 0;
    Voice.say('Ой-ой, три раза ударился! Дракончик устал. Попробуй ещё раз!');
    UI.reward(Math.floor(this.got / 6), this.dr.x, 520);
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  win() {
    this.won = true; this.items.length = 0;
    GW('catch');
    Sound.win(); Sound.purr(1.6); this.dr.happy = 4;
    UI.reward(5, this.dr.x, 520);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Дракончик наелся! Молодец!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  draw(ctx) {
    const t = G.t, d = this.dr;
    World.bg(ctx, t, { noDecor: true });
    for (const it of this.items) {
      const x = it.x + Math.sin(t * 2 + it.sway) * 12;
      if (it.meteor) Art.obstacle(ctx, null, x, it.y, 34, it.rot, t, 5);
      else {
        ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, x, it.y, 48, 48, '#fff6a8'); ctx.restore();
        Art.treat(ctx, it.ty, x, it.y, 0.85, t);
      }
    }
    const sx = d.shake > 0 ? Math.sin(t * 50) * 10 * d.shake : 0;
    Art.dragon(ctx, d.x + sx, 690, 0.62, {
      t, mouth: this.won ? 0 : Math.max(d.mouth, 0.35), squash: d.squash,
      happy: d.happy > 0 && d.mouth < 0.1, look: M.clamp((d.tx - d.x) / 80, -1, 1), blink: (t % 3.3 < 0.13) ? 1 : 0,
    });
    UI.progress(ctx, 440, 26, 400, 46, this.got / this.goal, '#ff7eb6');
    Art.treat(ctx, 0, 440, 48, 0.6);
    UI.text(ctx, this.got + ' / ' + this.goal, 640, 50, 30, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 900 + i * 50, 52, 44, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 235, 48, '#fff', 'center', true); },
};
