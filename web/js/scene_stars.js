// Звёздные дорожки: соедини звёзды по порядку (счёт) — получится картинка-созвездие
'use strict';
const NUM_WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять',
  'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать'];
const CONSTELLATIONS = (function () {
  const star = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1; star.push([Math.cos(a) * r, Math.sin(a) * r + 0.05]); }
  const heart = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; heart.push([0.06 * 16 * Math.pow(Math.sin(a), 3), -0.06 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) + 0.05]); }
  const moon = []; for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 6; moon.push([Math.cos(a) * 0.9, Math.sin(a) * 0.95]); }
  for (let i = 5; i >= 1; i--) { const a = -Math.PI / 2 + i * Math.PI / 6; moon.push([Math.cos(a) * 0.45 + 0.05, Math.sin(a) * 0.7]); }
  return [
    { name: 'домик', pts: [[-0.8, 0.9], [-0.8, -0.1], [0, -0.9], [0.8, -0.1], [0.8, 0.9]] },
    { name: 'кристалл', pts: [[0, -1], [0.6, -0.4], [0.6, 0.4], [0, 1], [-0.6, 0.4], [-0.6, -0.4]] },
    { name: 'ракета', pts: [[0, -1], [0.3, -0.5], [0.3, 0.4], [0.6, 0.9], [0.15, 0.7], [-0.15, 0.7], [-0.6, 0.9], [-0.3, 0.4], [-0.3, -0.5]] },
    { name: 'рыбка', pts: [[-0.95, 0], [-0.45, -0.45], [0.2, -0.4], [0.6, 0], [1, -0.4], [1, 0.4], [0.62, 0.04], [0.2, 0.4], [-0.45, 0.45]] },
    { name: 'звёздочка', pts: star },
    { name: 'сердечко', pts: heart },
    { name: 'месяц', pts: moon },
    { name: 'ёлочка', pts: [[0, -1], [0.4, -0.5], [0.2, -0.5], [0.6, 0], [0.3, 0], [0.8, 0.6], [0.15, 0.6], [0.15, 0.95], [-0.15, 0.95], [-0.15, 0.6], [-0.8, 0.6], [-0.3, 0], [-0.6, 0], [-0.2, -0.5], [-0.4, -0.5]] },
  ];
})();

G.scenes.stars = {
  enter() {
    const lvl = S.data.stars;
    this.shape = lvl < CONSTELLATIONS.length ? CONSTELLATIONS[lvl] : M.pick(CONSTELLATIONS);
    const cx = 640, cy = 395, sc = 265;
    this.pts = this.shape.pts.map((p, i) => ({ x: cx + p[0] * sc * 1.15, y: cy + p[1] * sc, n: i + 1, done: false, wig: 0 }));
    this.fakes = [];
    const nf = Math.min(Math.max(0, lvl - 1), 6);
    let guard = 0;
    while (this.fakes.length < nf && guard++ < 300) {
      const f = { x: M.rnd(200, 1080), y: M.rnd(150, 650), wig: 0 };
      if (this.pts.concat(this.fakes).some(p => M.dist(p.x, p.y, f.x, f.y) < 110)) continue;
      this.fakes.push(f);
    }
    this.next = 1; this.idle = 0; this.won = false; this.wonT = 0;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 1130, y: 600, r: 64, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('stars') });
    Voice.say('Соедини звёздочки по порядку: один, два, три… Что получится?');
  },
  down(x, y) {
    if (this.won) return;
    this.idle = 0;
    const p = this.pts[this.next - 1];
    if (M.dist(x, y, p.x, p.y) < 55) {
      p.done = true; Sound.note((this.next - 1) % 6);
      G.burst(p.x, p.y, { kind: 'star', n: 8, speed: 160, size: 10 });
      Voice.say(NUM_WORDS[this.next] || String(this.next));
      this.next++;
      if (this.next > this.pts.length) this.win();
      return;
    }
    const other = this.pts.concat(this.fakes).find(q => M.dist(x, y, q.x, q.y) < 50 && !q.done);
    if (other) { other.wig = 1; G.tween(other, { wig: 0 }, 0.5); Sound.boing(); }
  },
  win() {
    this.won = true; this.wonT = G.t;
    S.data.stars++; S.save();
    G.wait(0.6, () => {
      Sound.win();
      Voice.say('Ура! Это ' + this.shape.name + '!');
      UI.reward(3 + Math.floor(this.pts.length / 3), 640, 400);
      for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'star', n: 24, speed: 340 }), i * 250);
    });
    setTimeout(() => { this.again.hidden = false; }, 1800);
  },
  update(dt) { this.idle += dt; },
  draw(ctx) {
    const t = G.t;
    Art.sky(ctx, '#070420', '#181050', '#2a1a6e');
    Art.stars(ctx, 81, 200, t);
    // линии
    const done = this.pts.filter(p => p.done);
    if (done.length > 1 || this.won) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); done.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (this.won) ctx.closePath();
      ctx.lineWidth = 18; ctx.strokeStyle = 'rgba(126,232,255,0.25)'; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      if (this.won) {
        const k = Math.min(1, (t - this.wonT) / 1);
        ctx.globalAlpha = 0.35 * k; ctx.fillStyle = '#ffd23f'; ctx.fill();
      }
      ctx.restore();
    }
    // ложные звёзды
    for (const f of this.fakes) {
      ctx.save(); ctx.translate(f.x + Math.sin(t * 40) * 6 * f.wig, f.y);
      Art.roundStar(ctx, 0, 0, 20, '#cfc6ff', '#2a1650'); ctx.restore();
    }
    // звёзды с номерами
    for (const p of this.pts) {
      const isNext = !this.won && p.n === this.next;
      const pulse = isNext && this.idle > 3 ? 1 + Math.sin(t * 8) * 0.15 : 1;
      ctx.save(); ctx.translate(p.x + Math.sin(t * 40) * 6 * p.wig, p.y); ctx.scale(pulse, pulse);
      if (isNext && this.idle > 3) { ctx.globalAlpha = 0.4; Art.ell(ctx, 0, 0, 46, 46, '#fff3a0'); ctx.globalAlpha = 1; }
      Art.roundStar(ctx, 0, 0, 30, p.done ? '#ffd23f' : '#ffffff', '#2a1650');
      UI.text(ctx, String(p.n), 0, 3, 24, p.done ? '#7a4a00' : '#3a1f7a', 'center', false);
      ctx.restore();
    }
    if (this.won) {
      const k = Math.min(1, (t - this.wonT) / 0.8);
      ctx.save(); ctx.globalAlpha = k; UI.text(ctx, this.shape.name[0].toUpperCase() + this.shape.name.slice(1) + '!', 640, 70, 54, '#ffd23f', 'center', true); ctx.restore();
      Art.dragon(ctx, 160, 700, 0.5, { t, level: S.data.level, happy: true, look: 1 });
    }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
