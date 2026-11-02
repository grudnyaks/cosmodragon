// Поющие кристаллы: кристаллы поют мелодию — повтори её
'use strict';
G.scenes.simon = {
  enter() {
    const lvl = GL('simon');
    const n = lvl >= 3 ? 5 : 4;
    const colors = ['#ff7eb6', '#4fb7ff', '#ffd23f', '#41d982', '#b07cff'];
    const xs = n === 4 ? [250, 510, 770, 1030] : [200, 420, 640, 860, 1080];
    this.cr = xs.map((x, i) => ({ x, y: 470 + (i % 2) * 40, c: colors[i], lit: 0, i }));
    this.seq = []; this.pos = 0; this.state = 'wait';
    this.target = Math.min(5 + lvl, 12);
    this.start = Math.min(2 + Math.floor(lvl / 2), 4);
    this.tempo = Math.max(0.38, 0.7 - lvl * 0.04);
    this.won = false; this.lost = false; this.dr = { happy: 0 };
    for (let i = 0; i < this.start - 1; i++) this.seq.push(M.ri(0, n - 1));
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 250, r: 64, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('simon') });
    Voice.say('Послушай, как поют кристаллы, и повтори их песенку!');
    G.wait(3.2, () => this.nextRound());
  },
  nextRound() {
    this.seq.push(M.ri(0, this.cr.length - 1));
    this.pos = 0; this.state = 'show';
    this.seq.forEach((k, j) => G.wait(0.3 + j * this.tempo * 1.4, () => this.light(k, this.tempo)));
    G.wait(0.3 + this.seq.length * this.tempo * 1.4, () => { this.state = 'input'; this.inputT = 0; });
  },
  light(k, dur) {
    const c = this.cr[k];
    c.lit = 1; G.tween(c, { lit: 0 }, dur + 0.25, G.ease.linear);
    Sound.note(k);
    G.burst(c.x, c.y - 120, { kind: 'star', n: 5, speed: 120, size: 10, colors: [c.c, '#fff'], g: -40 });
  },
  down(x, y) {
    if (this.state !== 'input') return;
    for (const c of this.cr) {
      if (Math.abs(x - c.x) < 95 && y > c.y - 230 && y < c.y + 40) { this.press(c.i); return; }
    }
  },
  press(k) {
    this.light(k, 0.25);
    if (k === this.seq[this.pos]) {
      this.pos++;
      if (this.pos >= this.seq.length) {
        this.state = 'wait'; this.dr.happy = 1.2;
        const len = this.seq.length;
        if (len >= this.target) { G.wait(0.6, () => this.win()); return; }
        if (len >= 3) UI.reward(1, 640, 600);
        G.wait(0.5, () => { Sound.chime(1.2); Voice.say(M.pick(['Правильно!', 'Молодец!', 'Отлично! Слушай дальше.'])); });
        G.wait(1.9, () => this.nextRound());
      }
    } else {
      this.state = 'wait'; this.lost = true;
      Sound.boing();
      const k2 = this.seq[this.pos];
      G.wait(0.6, () => this.light(k2, 0.6));
      Voice.say('Ой! Надо было вот этот кристалл. Попробуй ещё раз!');
      setTimeout(() => { this.again.hidden = false; }, 1600);
    }
  },
  win() {
    this.won = true;
    GW('simon');
    Sound.win(); Sound.purr(1.6); this.dr.happy = 4;
    UI.reward(5, 640, 400);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Ты спел всю песенку кристаллов!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  update(dt) { this.dr.happy = Math.max(0, this.dr.happy - dt); },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.4);
    // пещера-сцена
    for (const c of this.cr) {
      if (c.lit > 0) {
        ctx.save(); ctx.globalAlpha = c.lit * 0.8;
        Art.ell(ctx, c.x, c.y - 90, 150, 150); ctx.fillStyle = Art.rg(ctx, c.x, c.y - 90, 150, '#ffffff', 'rgba(255,255,255,0)', 0, 0); ctx.fill();
        ctx.restore();
      }
      const sc = 1.9 + c.lit * 0.15;
      Art.crystal(ctx, c.x, c.y, sc, c.c);
      if (c.lit > 0) { ctx.save(); ctx.globalAlpha = c.lit * 0.6; Art.crystal(ctx, c.x, c.y, sc, '#ffffff'); ctx.restore(); }
    }
    Art.dragon(ctx, 640, 715, 0.42, { t, happy: this.dr.happy > 0, blink: (t % 3.1 < 0.13) ? 1 : 0 });
    // прогресс песенки
    const n = this.target;
    for (let i = 0; i < n; i++) {
      const done = i < this.seq.length - (this.state === 'input' || this.state === 'show' ? 1 : 0) || this.won;
      Art.roundStar(ctx, 640 - (n - 1) * 22 + i * 44, 60, 15, done ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#2a1650');
    }
    const msg = this.state === 'show' ? 'Слушай…' : this.state === 'input' ? 'Повтори!' : '';
    if (msg && !this.won && !this.lost) UI.text(ctx, msg, 640, 130, 44, '#fff', 'center', true);
    if ((this.won || this.lost) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 150, 44, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
