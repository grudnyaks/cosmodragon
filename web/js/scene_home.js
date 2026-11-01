// Главный экран: дракончик, космонавт, ракета, кормление и рост
'use strict';
G.scenes.home = {
  enter() {
    const d = S.data;
    this.dr = { x: 650, y: 590, lift: 0, squash: 0, mouth: 0, happyT: 0, fire: 0, flying: false, look: 0, tilt: 0 };
    this.as = { wave: 0 };
    this.rk = { lift: 0, flame: 0 };
    this.blinkT = 2; this.blink = 0; this.taps = 0;
    this.banner = null; this.busy = false;
    const by = 655, games = [
      { icon: 'map', color: '#ffb23a', scene: 'treasure' },
      { icon: 'puzzle', color: '#3fb8ff', scene: 'puzzle' },
      { icon: 'match', color: '#ff7eb6', scene: 'match3' },
      { icon: 'route', color: '#8f6cf2', scene: 'route' },
    ];
    this.gameBtns = games.map((g, i) => UI.add(this, { x: 380 + i * 170, y: by, r: 56, icon: g.icon, color: g.color, bob: true, iconScale: 1.05, onTap: () => { Voice.stop(); G.go(g.scene); } }));
    this.feedBtn = UI.add(this, { x: 890, y: 420, r: 58, icon: 'feed', color: '#ffd23f', onTap: () => this.feed() });
    UI.add(this, { x: G.view.x0 + 60, y: 60, r: 38, icon: d.music ? 'music' : 'musicOff', color: '#38d6c3', onTap() { Sound.setMusic(!S.data.music); this.icon = S.data.music ? 'music' : 'musicOff'; } });
    UI.add(this, { x: G.view.x0 + 150, y: 60, r: 38, icon: 'book', color: '#ff9a3c', onTap: () => { Voice.stop(); G.go('intro'); } });
    this.updBtn = UI.add(this, { x: G.view.x0 + 240, y: 60, r: 38, icon: 'update', color: '#41d982', pulse: true, hidden: !G.updateReady, onTap: () => { if (window.Android && Android.reload) Android.reload(); else location.reload(); } });
    if (!this.greeted) { this.greeted = true; setTimeout(() => this.hello(), 700); }
  },
  hello() {
    const d = S.data;
    if (d.treats > 0 && d.level < MAX_LEVEL) Voice.say('Дракоша хочет кушать! Нажми на кексик, чтобы покормить его.');
    else if (d.level < MAX_LEVEL) Voice.say('Поиграй в игры, чтобы найти вкусняшки для Дракоши!');
  },
  dragonScale() { return 0.78 + (S.data.level - 1) * 0.11; },
  dragonHit(x, y) {
    const s = this.dragonScale(), d = this.dr;
    return Math.abs(x - d.x) < 110 * s && y < d.y - d.lift + 10 && y > d.y - d.lift - 230 * s;
  },
  down(x, y) {
    if (this.banner && this.banner.tapClose && G.t - this.banner.t0 > 1) { this.banner = null; return; }
    if (this.dragonHit(x, y)) return this.petDragon();
    if (Math.abs(x - 470) < 50 && y > 470 && y < 620) { // космонавт
      this.as.wave = 2; Sound.boing(); Voice.say(M.pick(['Привет!', 'Полетели за вкусняшками!', 'Дракоша — мой лучший друг!']));
      return;
    }
    if (Math.abs(x - 190) < 80 && y > 200 && y < 590) { // ракета
      if (this.rk.busy) return; this.rk.busy = true;
      Sound.whoosh(); this.rk.flame = 1;
      G.tween(this.rk, { lift: 60 }, 0.6, G.ease.outQuad, () => G.tween(this.rk, { lift: 0 }, 0.8, G.ease.outBounce, () => { this.rk.flame = 0; this.rk.busy = false; }));
      return;
    }
  },
  petDragon() {
    const d = this.dr, lvl = S.data.level;
    if (this.busy) return;
    this.taps++;
    Sound.purr(1.6);
    d.happyT = 1.8;
    G.burst(d.x, d.y - 220 * this.dragonScale() - d.lift, { kind: 'heart', n: 5, colors: ['#ff5e9a', '#ff9ad5', '#ffb3d0'], up: true, g: -80, speed: 160, size: 20 });
    d.squash = 0.6; G.tween(d, { squash: 0 }, 0.6, G.ease.outElastic);
    if (lvl >= 4 && this.taps % 3 === 0) {
      Sound.fire(); d.fire = 0.01; G.tween(d, { fire: 1 }, 0.3, G.ease.outQuad, () => G.tween(d, { fire: 0 }, 0.5, G.ease.linear, null, 0.4));
    } else if (lvl >= 2 && this.taps % 2 === 0) {
      d.flying = true;
      G.tween(d, { lift: 110 + lvl * 15 }, 0.6, G.ease.outQuad, () => G.tween(d, { lift: 0 }, 0.7, G.ease.inOutQuad, () => { d.flying = false; }, 0.4));
    }
  },
  feed() {
    const d = S.data, dr = this.dr;
    if (this.busy) return;
    if (d.treats <= 0) {
      Voice.say('Вкусняшки закончились! Поиграй в игры, чтобы найти ещё.');
      dr.tilt = 0.25; G.tween(dr, { tilt: 0 }, 1.2, G.ease.outElastic);
      for (const b of this.gameBtns) { b.pulse = true; setTimeout(() => { b.pulse = false; }, 3000); }
      return;
    }
    d.treats--; S.save();
    const s = this.dragonScale();
    const mx = dr.x, my = dr.y - 115 * s - dr.lift;
    dr.mouth = 0; G.tween(dr, { mouth: 1 }, 0.3);
    UI.flyTreat(M.ri(0, 4), this.feedBtn.x, this.feedBtn.y, mx, my, 0, () => {
      Sound.chomp(); dr.mouth = 1; G.tween(dr, { mouth: 0 }, 0.5);
      dr.squash = 0.5; G.tween(dr, { squash: 0 }, 0.7, G.ease.outElastic);
      G.burst(mx, my, { kind: 'star', n: 8, speed: 180, size: 12 });
      dr.happyT = 1.5;
      if (d.level >= MAX_LEVEL) { Sound.purr(1.2); G.burst(mx, my - 80, { kind: 'heart', n: 6, up: true, g: -80, speed: 150, colors: ['#ff5e9a'] }); return; }
      d.fed++; S.save();
      if (d.fed >= LEVELS[d.level].need) setTimeout(() => this.levelUp(), 600);
      else setTimeout(() => Sound.purr(1.0), 400);
    });
  },
  levelUp() {
    const d = S.data;
    d.level = Math.min(MAX_LEVEL, d.level + 1); d.fed = 0; S.save();
    Sound.levelUp();
    const dr = this.dr;
    dr.squash = -0.8; G.tween(dr, { squash: 0 }, 1.2, G.ease.outElastic);
    for (let i = 0; i < 4; i++) setTimeout(() => G.burst(M.rnd(300, 1000), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    this.banner = { t0: G.t, title: LEVELS[d.level].title, lvl: d.level };
    Voice.say(LEVELS[d.level].ability);
    if (d.level >= MAX_LEVEL && !d.beacon) setTimeout(() => this.lightBeacon(), 6500);
    else setTimeout(() => { if (this.banner && this.banner.lvl === d.level) this.banner.tapClose = true; }, 1500);
  },
  lightBeacon() {
    if (G.sceneName !== 'home') { return; }
    const dr = this.dr; this.busy = true; this.banner = null;
    dr.flying = true;
    Voice.say('Полетели к маяку!');
    G.tween(dr, { x: 980, lift: 220 }, 2.2, G.ease.inOutQuad, () => {
      dr.look = 1; Sound.fire(); dr.fire = 0.01;
      G.tween(dr, { fire: 1 }, 0.4, G.ease.outQuad, () => {
        S.data.beacon = true; S.save();
        Sound.win();
        for (let i = 0; i < 8; i++) setTimeout(() => { G.burst(M.rnd(200, 1100), M.rnd(80, 350), { kind: 'star', n: 26, speed: 340, g: 120 }); Sound.chime(M.rnd(0.8, 1.4)); }, i * 350);
        Voice.say('Маяк зажёгся! Все звёзды вернулись на небо. Планета Ням-Ням снова сияет. Спасибо тебе, друг!');
        this.banner = { t0: G.t, title: 'Маяк зажёгся!', lvl: 5, final: true, tapClose: false };
        G.tween(dr, { fire: 0 }, 0.6, G.ease.linear, () => {
          G.tween(dr, { x: 650, lift: 0 }, 2.2, G.ease.inOutQuad, () => { dr.flying = false; dr.look = 0; this.busy = false; if (this.banner) this.banner.tapClose = true; }, 1.5);
        }, 0.8);
      });
    });
  },
  update(dt) {
    const d = this.dr;
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blink = 1; if (this.blinkT < -0.14) { this.blink = 0; this.blinkT = M.rnd(2, 4.5); } }
    d.happyT = Math.max(0, d.happyT - dt);
    this.as.wave = Math.max(0, this.as.wave - dt);
    if (!this.busy) d.look += (M.clamp((G.pointer.x - d.x) / 400, -1, 1) - d.look) * dt * 3;
    this.updBtn.hidden = !G.updateReady;
    this.feedBtn.badge = S.data.treats > 0 ? null : null;
  },
  draw(ctx) {
    const t = G.t, d = S.data;
    World.bg(ctx, t);
    Art.rocket(ctx, 190, World.GROUND + 25 - this.rk.lift, 0.8, { t, flame: this.rk.flame, glowBase: true });
    Art.astronaut(ctx, 470, 600, 1.1, { t, wave: this.as.wave > 0 });
    const dr = this.dr;
    Art.dragon(ctx, dr.x, dr.y, this.dragonScale(), {
      t, level: d.level, blink: this.blink, mouth: dr.mouth, look: dr.look, squash: dr.squash,
      happy: dr.happyT > 0 && dr.mouth < 0.1, lift: dr.lift, flying: dr.flying, fire: dr.fire, tilt: dr.tilt,
    });
    // рост
    this.drawGrowth(ctx);
  },
  drawGrowth(ctx) {
    const d = S.data, cx = 640;
    Art.rr(ctx, cx - 230, 18, 460, 108, 30); ctx.fillStyle = 'rgba(42,22,80,0.6)'; ctx.fill();
    UI.text(ctx, d.name, cx, 46, 34, '#ffd6f0', 'center', true);
    for (let i = 1; i <= MAX_LEVEL; i++) Art.roundStar(ctx, cx - 190 + (i - 1) * 32, 92, 14, i <= d.level ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#2a1650');
    if (d.level < MAX_LEVEL) {
      UI.progress(ctx, cx - 20, 76, 230, 32, d.fed / LEVELS[d.level].need, '#ff7eb6');
      Art.treat(ctx, 0, cx + 205, 88, 0.45);
    } else UI.text(ctx, d.beacon ? '★ Маяк сияет ★' : '★ Большой дракон ★', cx + 95, 92, 26, '#ffd23f', 'center', true);
  },
  drawTop(ctx) {
    UI.drawCounterTopRight(ctx);
    const b = this.banner;
    if (b) {
      const k = Math.min(1, (G.t - b.t0) / 0.5), sc = G.ease.outBack(k);
      ctx.save(); ctx.translate(b.final ? 560 : 640, 205); ctx.scale(sc * 0.85, sc * 0.85);
      Art.rr(ctx, -330, -90, 660, 180, 50); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#8f6cf2'; ctx.stroke();
      UI.text(ctx, b.final ? b.title : 'Дракоша вырос!', 0, -36, 52, '#8f6cf2', 'center', false);
      if (!b.final) UI.text(ctx, '★ ' + b.title + ' ★', 0, 34, 44, '#ff7eb6', 'center', false);
      else UI.text(ctx, '★ ★ ★ ★ ★', 0, 34, 44, '#ffd23f', 'center', false);
      ctx.restore();
    }
  },
};
