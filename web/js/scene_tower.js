// Облачная башня: облачный блок ездит туда-сюда, нажми — он упадёт. Строй башню повыше!
'use strict';
G.scenes.tower = {
  BH: 46,
  enter() {
    const lvl = GL('tower');
    this.need = Math.min(8 + lvl, 22); this.lives = 3;
    this.speed = Math.min(170 + lvl * 18, 480);
    this.stack = [{ x: 640, w: 300 }];
    this.cam = 0; this.camT = 0;
    this.cur = null; this.falling = null; this.chips = [];
    this.won = false; this.lost = false;
    this.cols = ['#ffffff', '#ffd6f0', '#d6ecff', '#fff3c0', '#d6ffe8', '#e8d6ff'];
    this.next();
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('tower') });
    Voice.say('Нажимай, когда облачко над башней, — и оно упадёт! Построй башню до самого неба!');
  },
  topY(i) { return 640 - (i + 1) * this.BH; },
  next() {
    const top = this.stack[this.stack.length - 1];
    const dir = Math.random() < 0.5 ? 1 : -1;
    this.cur = { x: dir > 0 ? 280 : 1000, w: top.w, dir, c: this.cols[this.stack.length % this.cols.length] };
  },
  down() {
    if (!this.cur || this.falling || this.won || this.lost) return;
    this.falling = { x: this.cur.x, w: this.cur.w, y: this.topY(this.stack.length) - 150 + this.cam, vy: 0, c: this.cur.c };
    this.cur = null; Sound.whoosh();
  },
  land() {
    const f = this.falling, top = this.stack[this.stack.length - 1];
    const l = Math.max(f.x - f.w / 2, top.x - top.w / 2), r = Math.min(f.x + f.w / 2, top.x + top.w / 2);
    this.falling = null;
    if (r - l < 12) { // промах
      this.lives--; Sound.bump(); this.chips.push({ x: f.x, w: f.w, y: this.topY(this.stack.length), vy: 0, c: f.c, rot: 0 });
      Voice.say(this.lives > 0 ? 'Ой, мимо! Попробуй ещё.' : 'Башня устала. Попробуй ещё раз!');
      if (this.lives <= 0) { this.lost = true; UI.reward(Math.floor(this.stack.length / 3), 640, 300); setTimeout(() => { this.again.hidden = false; }, 1200); return; }
      return this.next();
    }
    const perfect = Math.abs(f.x - top.x) < 8;
    const nb = perfect ? { x: top.x, w: top.w, c: f.c } : { x: (l + r) / 2, w: r - l, c: f.c };
    if (!perfect) { // отрезанный кусочек падает вниз
      const cutL = f.x - f.w / 2 < l, cw = f.w - (r - l);
      this.chips.push({ x: cutL ? l - cw / 2 : r + cw / 2, w: cw, y: this.topY(this.stack.length), vy: 0, c: f.c, rot: 0 });
      Sound.pop(1);
    } else { Sound.chime(1.4); G.floatText(nb.x, this.topY(this.stack.length) - 30 + this.cam, 'Точно!', '#ffd23f'); nb.w = Math.min(300, nb.w + 8); }
    this.stack.push(nb);
    G.burst(nb.x, this.topY(this.stack.length - 1) + this.cam, { kind: 'star', n: 6, speed: 120, size: 10 });
    if (this.stack.length > 6) this.camT = (this.stack.length - 6) * this.BH;
    if (this.stack.length - 1 >= this.need) return this.win();
    this.next();
  },
  win() {
    this.won = true; GW('tower'); Sound.win(); Sound.purr(1.4);
    UI.reward(5 + Math.floor(this.need / 4), 640, 300);
    Voice.say('Ура! Башня до самого неба!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    this.cam += (this.camT - this.cam) * Math.min(1, dt * 4);
    const c = this.cur;
    if (c) { c.x += c.dir * this.speed * dt; if (c.x > 1100 || c.x < 180) { c.dir *= -1; c.x = M.clamp(c.x, 180, 1100); } }
    const f = this.falling;
    if (f) { f.vy += 2000 * dt; f.y += f.vy * dt; if (f.y >= this.topY(this.stack.length) + this.cam) this.land(); }
    for (const ch of this.chips) { ch.vy += 1500 * dt; ch.y += ch.vy * dt; ch.rot += dt * 3; }
    this.chips = this.chips.filter(ch => ch.y < 900);
  },
  block(ctx, x, y, w, c, rot) {
    ctx.save(); ctx.translate(x, y + this.BH / 2); if (rot) ctx.rotate(rot);
    Art.cel(ctx, () => { Art.rr(ctx, -w / 2, -this.BH / 2, w, this.BH, 18); }, c, Art.mix(c, '#7a8ac0', 0.3), '#ffffff', 3.5, 8);
    for (let i = 0; i < Math.floor(w / 40); i++) Art.ell(ctx, -w / 2 + 20 + i * 40, -this.BH / 2 + 4, 14, 9, c);
    ctx.restore();
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { noDecor: true, noBeacon: true });
    ctx.save(); ctx.translate(0, this.cam);
    Art.cel(ctx, () => { Art.rr(ctx, 440, 640, 400, 80, 20); }, '#9be37a', '#4a9a48', null, 4, 8);
    this.stack.forEach((b, i) => { if (i === 0) return; this.block(ctx, b.x, this.topY(i), b.w, b.c); });
    const base = this.stack[0]; this.block(ctx, base.x, 640 - this.BH, base.w, '#c8e4ff');
    for (const ch of this.chips) this.block(ctx, ch.x, ch.y, ch.w, ch.c, ch.rot);
    if (this.falling) this.block(ctx, this.falling.x, this.falling.y - this.cam, this.falling.w, this.falling.c);
    ctx.restore();
    if (this.cur) {
      const y = this.topY(this.stack.length) - 150 + this.cam;
      ctx.save(); ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(this.cur.x, y + this.BH); ctx.lineTo(this.cur.x, this.topY(this.stack.length - 1) + this.cam); Art.stroke(ctx, 2, 'rgba(255,255,255,0.6)'); ctx.restore();
      this.block(ctx, this.cur.x, y, this.cur.w, this.cur.c);
      Art.dragon(ctx, this.cur.x, y - 4, 0.22, { t, flying: true });
    }
    UI.progress(ctx, 330, 26, 420, 44, (this.stack.length - 1) / this.need, '#7ec0ff');
    UI.text(ctx, 'Этажей: ' + (this.stack.length - 1) + ' / ' + this.need, 540, 49, 26, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 820 + i * 44, 50, 38, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 230, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
