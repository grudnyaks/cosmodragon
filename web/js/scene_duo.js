// Вдвоём: каждый ведёт своего дракончика на своей половине экрана, ловим вкусняшки вместе
'use strict';
G.scenes.duo = {
  enter() {
    const lvl = GL('duo');
    this.goal = Math.min(20 + lvl * 2, 40); this.time = 60;
    this.got = 0; this.won = false; this.lost = false;
    this.items = []; this.spawnT = 0.6; this.speed = Math.min(160 + lvl * 15, 340);
    // два дракончика: здешние, а если на планете один — к нему прилетает Дракоша (или Пушок)
    const here = PD().map(d => d.id), a = here[0] || 'dark', b = here[1] || (a === 'dark' ? 'light' : 'dark');
    this.drs = [{ id: a, x: 320, tx: 320, min: 90, max: 570, mouth: 0, squash: 0, shake: 0, happy: 0 },
                { id: b, x: 960, tx: 960, min: 710, max: 1190, mouth: 0, squash: 0, shake: 0, happy: 0 }];
    this.fingers = {};
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('duo') });
    Voice.say('Играем вдвоём! Один ведёт ' + Care.acc(a) + ' слева, другой — ' + Care.acc(b) + ' справа. Ловите вкусняшки вместе!');
  },
  side(x) { return x < 640 ? 0 : 1; },
  pdown(id, x) { const s = this.side(x); this.fingers[id] = s; this.drs[s].tx = x; },
  pmove(id, x) { const s = this.fingers[id]; if (s != null) this.drs[s].tx = x; },
  pup(id) { delete this.fingers[id]; },
  update(dt) {
    for (const d of this.drs) {
      d.tx = M.clamp(d.tx, d.min, d.max); d.x += (d.tx - d.x) * Math.min(1, dt * 8);
      d.shake = Math.max(0, d.shake - dt); d.happy = Math.max(0, d.happy - dt);
    }
    if (this.won || this.lost) return;
    this.time -= dt;
    if (this.time <= 0) return this.lose();
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const s = M.ri(0, 1), d = this.drs[s];
      this.items.push({ x: M.rnd(d.min + 20, d.max - 20), y: -50, vy: this.speed * M.rnd(0.85, 1.15), ty: M.ri(0, 4), meteor: Math.random() < 0.2, rot: 0, sway: M.rnd(0, 6) });
      this.spawnT = M.rnd(0.45, 0.8);
    }
    const mouthY = 690 + Art.dragonHeadY(1, 0.6);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.y += it.vy * dt; it.rot += dt * 2;
      const d = this.drs[this.side(it.x)];
      if (Math.abs(it.y - mouthY) < 45 && Math.abs(it.x - d.x) < 85) {
        this.items.splice(i, 1);
        if (it.meteor) { Sound.bump(); d.shake = 0.5; this.got = Math.max(0, this.got - 1); G.burst(it.x, it.y, { kind: 'dot', n: 10, colors: ['#b39a86', '#6b5246'], speed: 200 }); }
        else {
          Sound.chomp(); this.got++; d.mouth = 1; G.tween(d, { mouth: 0 }, 0.4); d.squash = 0.4; G.tween(d, { squash: 0 }, 0.5, G.ease.outElastic); d.happy = 0.8;
          G.burst(it.x, it.y, { kind: 'star', n: 8, speed: 180, size: 12 });
          if (this.got >= this.goal) return this.win();
        }
        continue;
      }
      if (it.y > 760) this.items.splice(i, 1);
    }
  },
  lose() {
    this.lost = true; this.items.length = 0;
    Voice.say('Время вышло! Попробуй ещё раз!');
    UI.reward(Math.floor(this.got / 6), 640, 520);
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  win() {
    this.won = true; this.items.length = 0; GW('duo');
    for (const d of this.drs) { d.happy = 4; Care.add(d.id, 'fun', 15); }
    Sound.win(); Sound.purr(1.6, { dragon: this.drs[0].id });
    UI.reward(6, 640, 520);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Вы отличная команда!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { noDecor: true });
    ctx.save(); ctx.setLineDash([16, 14]); ctx.beginPath(); ctx.moveTo(640, 110); ctx.lineTo(640, 720); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke(); ctx.restore();
    for (const it of this.items) {
      const x = it.x + Math.sin(t * 2 + it.sway) * 8;
      if (it.meteor) Art.obstacle(ctx, null, x, it.y, 32, it.rot, t, 5);
      else { ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, x, it.y, 44, 44, '#fff6a8'); ctx.restore(); Art.treat(ctx, it.ty, x, it.y, 0.8, t); }
    }
    for (const d of this.drs) {
      const sx = d.shake > 0 ? Math.sin(t * 50) * 10 * d.shake : 0;
      Art.dragon(ctx, d.x + sx, 690, 0.6, { kind: d.id, t, mouth: this.won ? 0 : Math.max(d.mouth, 0.35), squash: d.squash, happy: d.happy > 0 && d.mouth < 0.1, look: M.clamp((d.tx - d.x) / 80, -1, 1) });
    }
    UI.progress(ctx, 440, 26, 400, 46, this.got / this.goal, '#ff7eb6');
    UI.text(ctx, this.got + ' / ' + this.goal, 640, 50, 30, '#fff', 'center', true);
    UI.text(ctx, Math.max(0, Math.ceil(this.time)) + ' сек', 1000, 50, 28, '#fff', 'center', true);
    UI.text(ctx, Care.name(this.drs[0].id), 320, 140, 26, '#fff', 'center', true);
    UI.text(ctx, Care.name(this.drs[1].id), 960, 140, 26, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 235, 48, '#fff', 'center', true); },
};
