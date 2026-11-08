// Купание: потри губкой грязные пятнышки, потом смой пену душем
'use strict';
G.scenes.bath = {
  enter(args) {
    this.id = (args && args.id) || buddy();
    UI.homeButton(this);
    this.X = 640; this.Y = 545; this.s = 0.95;
    this.spots = [];
    const body = [[-40, -120], [30, -100], [-20, -60], [45, -55], [0, -140], [-50, -80]], head = [[-30, -20], [32, 10], [0, -34]];
    for (const [x, y] of M.shuffle(body).slice(0, 5)) this.spots.push({ x, y, r: M.rnd(14, 20), a: 1 });
    for (const [x, y] of M.shuffle(head).slice(0, 2)) this.spots.push({ x, y, r: M.rnd(10, 14), a: 1, head: true });
    this.foam = []; this.phase = 'scrub'; this.shakeT = 0; this.happy = 0; this.lastX = null;
    Voice.say(Care.name(this.id) + ' испачкался! Потри грязные пятнышки губкой.');
  },
  spotPos(sp) {
    const s = this.s;
    return sp.head ? [this.X + sp.x * s, this.Y + (-200 + sp.y) * s] : [this.X + sp.x * s, this.Y + sp.y * s];
  },
  down(x, y) { this.lastX = x; this.lastY = y; if (Math.abs(x - this.X) < 120 && y > 300 && y < 600 && this.phase === 'done') Sound.purr(1, { dragon: this.id }); },
  move(x, y) {
    const moved = this.lastX == null ? 0 : Math.hypot(x - this.lastX, y - this.lastY);
    this.lastX = x; this.lastY = y;
    if (this.phase === 'scrub') {
      let hit = false;
      for (const sp of this.spots) {
        if (sp.a <= 0) continue;
        const [sx, sy] = this.spotPos(sp);
        if (Math.hypot(x - sx, y - sy) < 50) { sp.a = Math.max(0, sp.a - moved * 0.012); hit = true; }
      }
      if (moved > 6 && Math.abs(x - this.X) < 170 && y > 330 && y < 640 && this.foam.length < 90) {
        this.foam.push({ x: x + M.rnd(-20, 20), y: y + M.rnd(-20, 20), r: M.rnd(10, 22), a: 1 });
        if (Math.random() < 0.3) Sound.pop(1.5 + Math.random());
      }
      if (hit && this.spots.every(sp => sp.a <= 0.03)) {
        this.phase = 'rinse'; Sound.magic();
        Voice.say('Чисто! Теперь смой пену душем. Води душем над дракончиком.');
      }
    } else if (this.phase === 'rinse') {
      for (const f of this.foam) if (Math.abs(f.x - x) < 70 && f.y > y && f.y < y + 260) f.a -= 0.08;
      this.foam = this.foam.filter(f => f.a > 0);
      if (!this.foam.length) this.finish();
    }
  },
  up() { this.lastX = null; },
  finish() {
    this.phase = 'done'; this.shakeT = 1.4; this.happy = 3;
    Sound.whoosh(); Sound.win();
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(this.X + M.rnd(-100, 100), 420, { kind: 'star', n: 8, colors: ['#bfe8ff', '#ffffff'], speed: 220, size: 12 }), i * 200);
    Care.add(this.id, 'clean', 100); Care.add(this.id, 'fun', 5); stat('bath');
    Voice.say('Чистенький! ' + Care.name(this.id) + ' блестит!');
    UI.reward(2, this.X, 420);
    setTimeout(() => Sound.purr(1.5, { dragon: this.id }), 900);
    G.wait(4.5, () => { if (G.scene === this) G.go('home'); });
  },
  update(dt) {
    this.shakeT = Math.max(0, this.shakeT - dt); this.happy = Math.max(0, this.happy - dt);
    for (const f of this.foam) f.wob = (f.wob || Math.random() * 6) + dt * 2;
  },
  draw(ctx) {
    const t = G.t, v = G.view;
    // ванная комната
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
    for (let x = Math.floor(v.x0 / 80) * 80; x < v.x1; x += 80) { ctx.beginPath(); ctx.moveTo(x, v.y0); ctx.lineTo(x, 520); ctx.stroke(); }
    for (let y = 40; y < 520; y += 80) { ctx.beginPath(); ctx.moveTo(v.x0, y); ctx.lineTo(v.x1, y); ctx.stroke(); }
    ctx.fillStyle = '#9ac8e8'; ctx.fillRect(v.x0, 520, v.x1 - v.x0, v.y1 - 520);
    Art.tub(ctx, this.X, 650, 1, false);
    const sh = this.shakeT > 0 ? Math.sin(this.shakeT * 30) * 0.25 : 0;
    Art.dragon(ctx, this.X, this.Y, this.s, { kind: this.id, t, dirt: this.spots, happy: this.happy > 0 || this.phase === 'rinse', squash: sh, tilt: sh * 0.5,
      look: this.lastX != null ? M.clamp((this.lastX - this.X) / 300, -1, 1) : 0, blink: (t % 3.2) < 0.13 ? 1 : 0 });
    // пена
    for (const f of this.foam) {
      ctx.save(); ctx.globalAlpha = Math.min(1, f.a) * 0.9;
      Art.ell(ctx, f.x + Math.sin(f.wob || 0) * 2, f.y, f.r, f.r, '#ffffff');
      ctx.globalAlpha *= 0.5; Art.ell(ctx, f.x - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.3, f.r * 0.25, '#bfe8ff');
      ctx.restore();
    }
    Art.tub(ctx, this.X, 650, 1, true);
    // инструмент у пальца
    const p = G.pointer;
    if (this.phase === 'scrub') Art.sponge(ctx, p.down ? p.x : 1080, p.down ? p.y : 300, 1.1);
    else if (this.phase === 'rinse') Art.shower(ctx, p.down ? p.x : 1080, p.down ? p.y - 80 : 260, 1.2, p.down, t);
    UI.text(ctx, this.phase === 'scrub' ? 'Потри пятнышки губкой' : this.phase === 'rinse' ? 'Смой пену душем' : 'Чистенький!', 640, 70, 34, '#2a5a8a', 'center', false);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
