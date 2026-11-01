// Лови вкусняшки: веди дракончика пальцем, он ловит ртом падающие вкусняшки
'use strict';
G.scenes.catch = {
  enter() {
    this.goal = Math.min(12 + S.data.catch * 2, 24);
    this.got = 0; this.won = false;
    this.items = []; this.spawnT = 0.8;
    this.dr = { x: 640, tx: 640, mouth: 0, squash: 0, happy: 0, shake: 0 };
    this.speed = 150 + Math.min(S.data.catch, 6) * 15;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('catch') });
    Voice.say('Вкусняшки падают с неба! Води пальцем, чтобы Дракоша их ловил. А от метеоритов уворачивайся!');
  },
  down(x) { this.dr.tx = x; },
  move(x) { this.dr.tx = x; },
  update(dt) {
    const d = this.dr;
    d.tx = M.clamp(d.tx, 110, 1170);
    d.x += (d.tx - d.x) * Math.min(1, dt * 8);
    d.happy = Math.max(0, d.happy - dt); d.shake = Math.max(0, d.shake - dt);
    if (this.won) return;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const meteor = S.data.catch > 0 && Math.random() < 0.18;
      this.items.push({ x: M.rnd(140, 1140), y: -60, vy: this.speed * M.rnd(0.85, 1.15), ty: M.ri(0, 4), meteor, rot: 0, sway: M.rnd(0, 6) });
      this.spawnT = M.rnd(0.9, 1.5);
    }
    const mouthY = 690 - 80;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.vy * dt; it.rot += dt * (it.meteor ? 2 : 0.5);
      const x = it.x + Math.sin(G.t * 2 + it.sway) * 12;
      if (Math.abs(it.y - mouthY) < 45 && Math.abs(x - d.x) < 85) {
        this.items.splice(i, 1);
        if (it.meteor) {
          Sound.bump(); d.shake = 0.5;
          G.burst(x, it.y, { kind: 'dot', n: 12, colors: ['#b39a86', '#6b5246'], speed: 220 });
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
  win() {
    this.won = true; this.items.length = 0;
    S.data.catch++; S.save();
    Sound.win(); Sound.purr(1.6); this.dr.happy = 4;
    UI.reward(5, this.dr.x, 520);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Дракоша наелся! Молодец!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  draw(ctx) {
    const t = G.t, d = this.dr;
    World.bg(ctx, t, { noDecor: true });
    for (const it of this.items) {
      const x = it.x + Math.sin(t * 2 + it.sway) * 12;
      if (it.meteor) Art.meteor(ctx, x, it.y, 34, it.rot, 5);
      else {
        ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, x, it.y, 48, 48, '#fff6a8'); ctx.restore();
        Art.treat(ctx, it.ty, x, it.y, 0.85, t);
      }
    }
    const sx = d.shake > 0 ? Math.sin(t * 50) * 10 * d.shake : 0;
    Art.dragon(ctx, d.x + sx, 690, 0.62, {
      t, level: S.data.level, mouth: this.won ? 0 : Math.max(d.mouth, 0.35), squash: d.squash,
      happy: d.happy > 0 && d.mouth < 0.1, look: M.clamp((d.tx - d.x) / 80, -1, 1), blink: (t % 3.3 < 0.13) ? 1 : 0,
    });
    UI.progress(ctx, 440, 26, 400, 46, this.got / this.goal, '#ff7eb6');
    Art.treat(ctx, 0, 440, 48, 0.6);
    UI.text(ctx, this.got + ' / ' + this.goal, 640, 50, 30, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if (this.won && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 235, 48, '#fff', 'center', true); },
};
