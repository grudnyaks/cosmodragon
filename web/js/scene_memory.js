// Найди пару: переворачивай карточки и находи одинаковые картинки
'use strict';
const MEMORY_FACES = [
  (ctx, t) => Art.dragon(ctx, 0, 70, 0.48, { t, happy: true }),
  (ctx, t) => Art.astronaut(ctx, 0, 68, 0.85, { t }),
  (ctx, t) => Art.rocket(ctx, 0, 78, 0.33, { t }),
  (ctx) => Art.planet(ctx, 0, 0, 38, '#ffd0f0', '#ff7eb6', 'rgba(255,240,180,0.9)'),
  (ctx, t) => Art.treat(ctx, 0, 0, 6, 1.2, t),
  (ctx, t) => Art.treat(ctx, 4, 0, -4, 1.1, t),
  (ctx) => Art.beacon(ctx, 0, 70, 0.75, true, 0),
  (ctx, t) => Art.obstacle(ctx, null, 0, 0, 40, 0.3, t, 11),
  (ctx, t) => Art.treat(ctx, 1, 0, 0, 1.2, t),
  (ctx, t) => Art.treat(ctx, 2, 0, 0, 1.1, t),
  (ctx, t) => Art.treat(ctx, 3, 0, 0, 1.2, t),
  (ctx, t) => Art.treat(ctx, 5, 0, 4, 1.3, t),
  (ctx, t) => Art.critter(ctx, null, 0, 60, 0.62, t, 0),
  (ctx) => Art.chest(ctx, 0, 34, 0.9, false, 0),
];

G.scenes.memory = {
  enter() {
    const lvl = GL('memory');
    const pairs = lvl < 3 ? 4 : lvl < 6 ? 6 : 8;
    const cols = 4, rows = pairs * 2 / cols;
    const faces = M.shuffle([...MEMORY_FACES.keys()]).slice(0, pairs);
    const deck = M.shuffle(faces.concat(faces));
    this.CW = pairs === 8 ? 128 : 150; this.CH = pairs === 8 ? 140 : 176; const gap = pairs === 8 ? 16 : 24;
    this.faceScale = this.CW / 150;
    const W = cols * this.CW + (cols - 1) * gap, H = rows * this.CH + (rows - 1) * gap;
    const ox = 640 - W / 2, oy = 400 - H / 2 + 10;
    this.cards = deck.map((f, i) => ({
      face: f, x: ox + (i % cols) * (this.CW + gap) + this.CW / 2, y: oy + Math.floor(i / cols) * (this.CH + gap) + this.CH / 2,
      open: 0, done: false, wig: 0, appear: 0,
    }));
    this.cards.forEach((c, i) => G.tween(c, { appear: 1 }, 0.4, G.ease.outBack, null, i * 0.06));
    this.flipped = []; this.lock = false; this.won = false; this.misses = 0;
    if (hasAbility('eyes')) { // Зоркие глазки: показать все карточки
      this.lock = true;
      G.wait(0.8, () => { this.cards.forEach(c => G.tween(c, { open: 1 }, 0.3)); Voice.say('Дракончик показывает карточки. Запоминай!'); });
      G.wait(2.9, () => { this.cards.forEach(c => G.tween(c, { open: 0 }, 0.3)); });
      G.wait(3.3, () => { this.lock = false; });
    }
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 400, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('memory') });
    if (!hasAbility('eyes')) Voice.say('Найди одинаковые картинки! Нажми на карточку, чтобы её перевернуть.');
  },
  down(x, y) {
    if (this.lock || this.won) return;
    for (const c of this.cards) {
      if (c.done || c.open > 0.5 || this.flipped.includes(c)) continue;
      if (Math.abs(x - c.x) < this.CW / 2 && Math.abs(y - c.y) < this.CH / 2) { this.flip(c); return; }
    }
  },
  flip(c) {
    Sound.pop(1.1);
    this.flipped.push(c);
    G.tween(c, { open: 1 }, 0.3, G.ease.outQuad);
    if (this.flipped.length < 2) return;
    this.lock = true;
    const [a, b] = this.flipped;
    G.wait(0.5, () => {
      if (a.face === b.face) {
        a.done = b.done = true; Sound.chime(1.1);
        for (const c2 of [a, b]) G.burst(c2.x, c2.y, { kind: 'star', n: 12, speed: 220 });
        this.flipped = []; this.lock = false;
        if (this.cards.every(q => q.done)) G.wait(0.5, () => this.win());
        else if (Math.random() < 0.5) Voice.say(M.pick(['Пара!', 'Нашёл!', 'Здорово!']));
      } else {
        this.misses++;
        a.wig = b.wig = 1; G.tween(a, { wig: 0 }, 0.5); G.tween(b, { wig: 0 }, 0.5);
        G.wait(0.6, () => {
          G.tween(a, { open: 0 }, 0.3); G.tween(b, { open: 0 }, 0.3);
          G.wait(0.3, () => { this.flipped = []; this.lock = false; });
        });
      }
    });
  },
  win() {
    this.won = true;
    GW('memory');
    Sound.win(); Sound.purr(1.6);
    UI.reward(5, 640, 400);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Все пары найдены! Какая хорошая память!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t);
    if (this.won) {
      Art.dragon(ctx, 640, 700, 0.75, { t, happy: true });
      return;
    }
    for (const c of this.cards) this.drawCard(ctx, c, t);
  },
  drawCard(ctx, c, t) {
    const w = this.CW, h = this.CH;
    const k = Math.cos(c.open * Math.PI); // 1 — рубашка, -1 — картинка
    ctx.save();
    ctx.translate(c.x + Math.sin(t * 40) * 6 * c.wig, c.y);
    ctx.scale(Math.max(0.02, Math.abs(k)) * c.appear, c.appear);
    Art.rr(ctx, -w / 2 + 4, -h / 2 + 8, w, h, 20); ctx.fillStyle = 'rgba(20,8,50,0.35)'; ctx.fill();
    Art.rr(ctx, -w / 2, -h / 2, w, h, 20);
    if (k > 0) {
      ctx.fillStyle = Art.rg(ctx, 0, 0, h, '#b79dff', '#6a40b8'); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#2a1650'; ctx.stroke();
      Art.rr(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 14); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
      Art.roundStar(ctx, 0, 0, 34 + Math.sin(t * 3 + c.x) * 2, '#ffd23f', '#2a1650');
    } else {
      ctx.fillStyle = c.done ? '#fff6d6' : '#ffffff'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = c.done ? '#ffd23f' : '#2a1650'; ctx.stroke();
      ctx.save(); Art.rr(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 16); ctx.clip();
      ctx.scale(this.faceScale, this.faceScale);
      MEMORY_FACES[c.face](ctx, t);
      ctx.restore();
    }
    ctx.restore();
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if (this.won && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 300, 48, '#fff', 'center', true); },
};
