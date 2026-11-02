// Сортировка: перетаскивай предметы в нужные корзинки — по цвету, по виду или по количеству
'use strict';
G.scenes.sort = {
  enter() {
    const lvl = GL('sort');
    this.mode = lvl < 4 ? 'color' : lvl < 8 ? 'kind' : 'count';
    this.nb = lvl < 3 ? 2 : lvl < 6 ? 3 : 4;
    this.need = Math.min(10 + lvl, 24);
    this.fall = lvl >= 5 ? Math.min(30 + (lvl - 5) * 8, 90) : 0;
    this.got = 0; this.lives = 3; this.won = false; this.lost = false;
    const pool = this.mode === 'color' ? M.shuffle([0, 1, 2, 3, 4, 5]) : this.mode === 'kind' ? M.shuffle([0, 1, 2, 3, 4, 5]) : M.shuffle([1, 2, 3, 4, 5].slice(0, Math.min(5, 2 + Math.floor(lvl / 3))));
    this.vals = pool.slice(0, this.nb);
    const bw = Math.min(260, 1100 / this.nb);
    this.baskets = this.vals.map((v, i) => ({ v, x: 640 + (i - (this.nb - 1) / 2) * bw, y: 620, w: bw - 30, bump: 0 }));
    this.item = null; this.drag = null;
    this.newItem();
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('sort') });
    const how = this.mode === 'color' ? 'по цвету' : this.mode === 'kind' ? 'одинаковые к одинаковым' : 'по количеству: сколько вкусняшек, такая и цифра';
    Voice.say('Разложи всё по корзинкам: ' + how + '!');
  },
  newItem() {
    this.item = { v: M.pick(this.vals), x: 640, y: 210, home: { x: 640, y: 210 }, s: 0 };
    G.tween(this.item, { s: 1 }, 0.3, G.ease.outBack);
  },
  down(x, y) {
    const it = this.item; if (!it || this.won || this.lost) return;
    if (Math.hypot(x - it.x, y - it.y) < 90) { this.drag = { dx: x - it.x, dy: y - it.y }; Sound.pop(0.9); }
  },
  move(x, y) { if (this.drag) { this.item.x = x - this.drag.dx; this.item.y = y - this.drag.dy; } },
  up() {
    if (!this.drag) return; this.drag = null;
    const it = this.item;
    const b = this.baskets.find(q => Math.abs(it.x - q.x) < q.w / 2 + 20 && it.y > q.y - 150);
    if (!b) return;
    if (b.v === it.v) this.good(b);
    else this.bad(b);
  },
  good(b) {
    this.got++; b.bump = 1; Sound.chime(1 + (this.got % 5) * 0.1);
    G.burst(b.x, b.y - 60, { kind: 'star', n: 10, speed: 180 });
    this.item = null;
    if (this.got >= this.need) return this.win();
    G.wait(0.25, () => this.newItem());
  },
  bad(b) {
    Sound.boing(); this.lives--;
    const it = this.item; G.tween(it, { x: it.home.x, y: it.home.y }, 0.35, G.ease.outBack);
    G.floatText(b.x, b.y - 120, 'Не сюда!', '#ff8fa0');
    if (this.lives <= 0) this.lose();
  },
  lose() {
    this.lost = true; this.item = null;
    Voice.say('Ой, три ошибки! Попробуй ещё раз, у тебя получится!');
    UI.reward(Math.floor(this.got / 4), 640, 400);
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  win() {
    this.won = true; GW('sort');
    Sound.win(); Sound.purr(1.3);
    UI.reward(5 + Math.floor(this.need / 6), 640, 400);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Всё разложено по местам!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    for (const b of this.baskets) b.bump = Math.max(0, b.bump - dt * 3);
    const it = this.item;
    if (it && this.fall && !this.drag && !this.won && !this.lost) {
      it.y += this.fall * dt; it.home.y = it.y; it.home.x = it.x;
      if (it.y > 470) { // упал мимо корзинок
        Sound.bump(); this.lives--; G.floatText(it.x, it.y - 60, 'Упало!', '#ff8fa0');
        this.item = null;
        if (this.lives <= 0) this.lose(); else G.wait(0.4, () => this.newItem());
      }
    }
  },
  drawThing(ctx, v, x, y, s, t) {
    const pd = P();
    if (this.mode === 'color') {
      const col = POP_COLORS[v][0];
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      if (pd.id === 'ice') { ctx.rotate(t * 0.4); for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -42); ctx.moveTo(0, -24); ctx.lineTo(-12, -34); ctx.moveTo(0, -24); ctx.lineTo(12, -34); Art.stroke(ctx, 11); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -42); ctx.moveTo(0, -24); ctx.lineTo(-12, -34); ctx.moveTo(0, -24); ctx.lineTo(12, -34); Art.stroke(ctx, 6, col); ctx.restore(); } }
      else if (pd.id === 'fire') { ctx.save(); ctx.globalAlpha = 0.5; Art.ell(ctx, 0, 0, 52, 52); ctx.fillStyle = Art.rg(ctx, 0, 0, 52, col, 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore(); Art.cel(ctx, () => { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = 36 * (0.85 + (i % 3) * 0.08); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, col, Art.mix(col, '#000000', 0.35), '#ffffff', 4, 8); }
      else { Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(34, -10); ctx.lineTo(0, 40); ctx.lineTo(-34, -10); ctx.closePath(); }, col, Art.mix(col, '#000000', 0.3), '#ffffff', 4, 9); Art.sparkle(ctx, -10, -14, 8, '#fff'); }
      ctx.restore();
    } else if (this.mode === 'kind') Art.treat(ctx, v, x, y, 1.1 * s, t);
    else {
      const pts = DOTS[v] || [];
      for (const [dx, dy] of pts) { Art.ell(ctx, x + dx * 30 * s, y + dy * 30 * s, 12 * s, 12 * s, '#ff5e9a'); Art.stroke(ctx, 3); Art.ell(ctx, x + dx * 30 * s - 4 * s, y + dy * 30 * s - 4 * s, 4 * s, 3 * s, '#ffffff'); }
    }
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.25);
    // корзинки
    for (const b of this.baskets) {
      const sc = 1 + b.bump * 0.12;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(sc, 1 / sc);
      const w = b.w, col = this.mode === 'color' ? POP_COLORS[b.v][0] : '#c8a070';
      Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-w / 2, -70); ctx.lineTo(w / 2, -70); ctx.lineTo(w / 2 - 22, 70); ctx.lineTo(-w / 2 + 22, 70); ctx.closePath(); }, col, Art.mix(col, '#000000', 0.3), '#ffffff', 4.5, 12);
      ctx.save(); ctx.globalAlpha = 0.3; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * w / 6, -66); ctx.lineTo(i * w / 7, 66); Art.stroke(ctx, 3, '#1a1030'); } ctx.restore();
      Art.rr(ctx, -w / 2 - 8, -84, w + 16, 22, 10); ctx.fillStyle = Art.mix(col, '#ffffff', 0.3); ctx.fill(); Art.stroke(ctx, 4);
      // ярлык корзинки
      Art.ell(ctx, 0, 6, 46, 46, 'rgba(255,255,255,0.9)'); Art.stroke(ctx, 3);
      if (this.mode === 'count') UI.text(ctx, String(b.v), 0, 9, 56, '#2a1650', 'center', false);
      else this.drawThing(ctx, b.v, 0, 6, 0.75, t);
      ctx.restore();
    }
    if (this.item) {
      const it = this.item, lifted = !!this.drag;
      ctx.save(); ctx.globalAlpha = 0.3; Art.ell(ctx, it.x, it.y + 70, 50, 12, '#0a0520'); ctx.restore();
      ctx.save(); ctx.translate(it.x, it.y); ctx.scale(it.s * (lifted ? 1.12 : 1), it.s * (lifted ? 1.12 : 1));
      Art.ell(ctx, 0, 0, 78, 78, 'rgba(255,255,255,0.85)'); Art.stroke(ctx, 4);
      this.drawThing(ctx, it.v, 0, 0, 1, t);
      ctx.restore();
    }
    UI.progress(ctx, 400, 26, 480, 46, this.got / this.need, '#41d982');
    UI.text(ctx, this.got + ' / ' + this.need, 640, 50, 30, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 920 + i * 46, 52, 40, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 230, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
