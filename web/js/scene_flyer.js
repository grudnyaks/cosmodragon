// Полёт: нажимай, чтобы дракончик взмахнул крыльями, и пролетай между колоннами
'use strict';
G.scenes.flyer = {
  enter() {
    const lvl = GL('flyer');
    this.gapH = Math.max(175, 300 - lvl * 9);
    this.speed = Math.min(210 + lvl * 12, 430);
    this.goal = Math.min(8 + lvl, 26);
    this.spacing = Math.max(330, 430 - lvl * 6);
    this.moving = lvl >= 7;
    this.dr = { x: 300, y: 340, vy: 0, rot: 0, flapT: 0 };
    this.cols = []; this.items = [];
    this.nextX = 900; this.passed = 0; this.lives = 3; this.inv = 0; this.got = 0;
    this.shields = hasAbility('shield2') ? 2 : hasAbility('wings') ? 1 : 0;
    this.started = false; this.won = false; this.lost = false;
    this.scroll = 0;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('flyer') });
    Voice.say('Нажимай на экран, чтобы дракончик махал крыльями. Пролетай между колоннами!');
  },
  down() {
    if (this.won || this.lost) return;
    this.started = true;
    this.dr.vy = -430; this.dr.flapT = 0.25; Sound.whoosh();
  },
  spawn() {
    const top = 120, bot = 640;
    const cy = M.rnd(top + this.gapH / 2 + 20, bot - this.gapH / 2 - 20);
    this.cols.push({ x: this.nextX, cy, by: cy, ph: Math.random() * 6, passed: false });
    if (Math.random() < 0.75) this.items.push({ x: this.nextX, y: cy + M.rnd(-this.gapH * 0.25, this.gapH * 0.25), ty: M.ri(0, 5), got: false });
    if (Math.random() < 0.4) this.items.push({ x: this.nextX + this.spacing / 2, y: M.rnd(220, 560), ty: M.ri(0, 5), got: false });
    this.nextX += this.spacing;
  },
  hit() {
    if (this.inv > 0) return;
    if (this.shields > 0) { this.shields--; this.inv = 1.2; Sound.chime(0.8); G.floatText(this.dr.x, this.dr.y - 80, 'Щит!', '#7ee8ff'); return; }
    this.lives--; this.inv = 1.5; Sound.bump();
    G.burst(this.dr.x, this.dr.y, { kind: 'star', n: 10, speed: 200 });
    if (this.lives <= 0) {
      this.lost = true; Voice.say('Ой! Дракончик устал. Попробуй ещё раз!');
      UI.reward(Math.floor(this.got / 2), this.dr.x, this.dr.y);
      setTimeout(() => { this.again.hidden = false; }, 1200);
    }
  },
  update(dt) {
    const d = this.dr;
    this.inv = Math.max(0, this.inv - dt); d.flapT = Math.max(0, d.flapT - dt);
    if (!this.started) { d.y = 340 + Math.sin(G.t * 3) * 14; return; }
    if (this.won) { d.x += 300 * dt; d.y += (300 - d.y) * dt; return; }
    if (this.lost) { d.vy += 1200 * dt; d.y = Math.min(660, d.y + d.vy * dt); return; }
    d.vy += 1150 * dt; d.y += d.vy * dt;
    d.rot = M.clamp(d.vy / 900, -0.4, 0.6);
    const dx = this.speed * dt;
    this.scroll += dx;
    while (this.nextX - this.scroll < 1500 && this.passed + this.cols.length < this.goal + 1) this.spawn();
    if (d.y < 60) { d.y = 60; d.vy = 120; }
    if (d.y > 650) { d.y = 650; d.vy = -380; this.hit(); }
    const R = 34;
    for (const c of this.cols) {
      const x = c.x - this.scroll;
      if (this.moving) c.cy = c.by + Math.sin(G.t * 1.6 + c.ph) * 50;
      if (Math.abs(x - d.x) < 46 + R * 0.6 && (d.y - R < c.cy - this.gapH / 2 || d.y + R > c.cy + this.gapH / 2)) this.hit();
      if (!c.passed && x < d.x - 50) {
        c.passed = true; this.passed++; Sound.pop(1.2);
        if (this.passed >= this.goal) this.win();
      }
    }
    const mag = hasAbility('magnet') ? 140 : 60;
    for (const it of this.items) {
      if (it.got) continue;
      const x = it.x - this.scroll;
      if (hasAbility('magnet') && Math.hypot(x - d.x, it.y - d.y) < mag) { it.x -= (x - d.x) * dt * 4; it.y -= (it.y - d.y) * dt * 4; }
      if (Math.hypot(x - d.x, it.y - d.y) < 56) { it.got = true; this.got++; Sound.chime(1 + (this.got % 5) * 0.1); G.burst(x, it.y, { kind: 'star', n: 6, speed: 140, size: 10 }); }
    }
    this.cols = this.cols.filter(c => c.x - this.scroll > -200);
  },
  win() {
    this.won = true; GW('flyer');
    Sound.win(); Sound.purr(1.4);
    UI.reward(4 + this.got, this.dr.x, this.dr.y);
    Voice.say(M.pick(['Ура! Долетели!', 'Отличный полёт!', 'Вот это пилот!']));
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  drawColumn(ctx, x, y0, y1, flip) {
    const pd = P(), w = 92;
    const col = { water: ['#ff7eb6', '#c83a8a'], fire: ['#5a3a3a', '#2c1a20'], wind: ['#ffffff', '#b8c8e8'], ice: ['#bfe8ff', '#6aa8d8'], rainbow: ['#ffb3e0', '#b07cff'], jungle: ['#a8742a', '#6a4a1a'] }[pd.id] || ['#9b6fe0', '#5a3aa0'];
    Art.cel(ctx, () => { Art.rr(ctx, x - w / 2, y0, w, y1 - y0, 14); }, col[0], col[1], '#ffffff', 4, 12);
    const capY = flip ? y1 - 26 : y0;
    Art.cel(ctx, () => { Art.rr(ctx, x - w / 2 - 12, capY, w + 24, 26, 10); }, col[0], col[1], null, 4, 6);
    if (pd.id === 'fire') { ctx.save(); ctx.globalAlpha = 0.8; Art.ell(ctx, x, flip ? y1 : y0, 30, 8, '#ff5a1a'); ctx.restore(); }
    if (pd.id === 'jungle' || pd.id === 'nyam') Art.ell(ctx, x - 20, flip ? y1 - 40 : y0 + 40, 14, 8, pd.id === 'jungle' ? '#4cc85a' : '#7ee8ff');
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t * 0.6 + this.scroll * 0.01, { noDecor: true, noBeacon: true });
    for (const c of this.cols) {
      const x = c.x - this.scroll;
      this.drawColumn(ctx, x, G.view.y0 - 20, c.cy - this.gapH / 2, true);
      this.drawColumn(ctx, x, c.cy + this.gapH / 2, G.view.y1 + 20, false);
    }
    for (const it of this.items) if (!it.got) Art.treat(ctx, it.ty, it.x - this.scroll, it.y, 0.62, t);
    const d = this.dr;
    if (!(this.inv > 0 && Math.sin(t * 30) > 0)) {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot * 0.6);
      if (this.shields > 0) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 4) * 0.1; Art.ell(ctx, 0, 0, 72, 72, '#7ee8ff'); ctx.restore(); }
      Art.dragon(ctx, 0, 62, 0.42, { t, flying: true, flap: d.flapT > 0 ? -0.6 + d.flapT * 4 : Math.sin(t * 10) * 0.3, happy: this.won, look: 1 });
      ctx.restore();
    }
    // табло
    UI.progress(ctx, 400, 26, 480, 46, this.passed / this.goal, '#ffd23f');
    UI.text(ctx, this.passed + ' / ' + this.goal, 640, 50, 30, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 920 + i * 46, 52, 40, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    if (!this.started) UI.text(ctx, 'Нажимай, чтобы лететь!', 640, 190, 44, '#fff', 'center', true);
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, this.won ? 'Ещё полёт?' : 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
