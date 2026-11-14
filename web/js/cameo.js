// Шипун в мини-играх: иногда выглядывает из-за края экрана.
// Пока он злодей — тянется за вкусняшкой (успей нажать, и он убежит, а ты получишь бонус).
// Когда он друг — нажми на него, и он подарит конфетку.
'use strict';
const CAMEO_GAMES = ['treasure', 'puzzle', 'catch', 'memory', 'bowling', 'maze', 'pop', 'fishing', 'simon', 'stars', 'bunny', 'tower', 'cake', 'shells', 'campfire', 'snowman', 'rainbowpaint', 'colorjars', 'bananas', 'bee', 'bouquet', 'dig', 'pattern', 'robot', 'wires', 'owls'];
const CAMEO_SAY = {
  sneak: ['Ш-ш-ш! Какая вкусняшка…', 'Ш-ш-ш! Сейчас стащу!', 'Ш-ш-ш! Никто не смотрит?'],
  scared: ['Ш-ш-ш! Заметил! Убегаю!', 'Ш-ш-ш! Ой, поймали!', 'Ш-ш-ш! Ладно, ладно!'],
  stole: ['Ш-ш-ш-ха-ха! Ням!', 'Ш-ш-ш! Вкусно! Спасибо!'],
  friend: ['Ш-ш-ш! Привет! Нажми на меня!', 'Ш-ш-ш! У меня есть подарок!', 'Ш-ш-ш! Как дела?'],
  gift: ['Ш-ш-ш! Держи конфетку!', 'Ш-ш-ш! Это тебе!', 'Ш-ш-ш! Угощайся, друг!'],
  bye: ['Ш-ш-ш! Пока-пока!', 'Ш-ш-ш! Ну ладно, играй!'],
};
const Cameo = {
  on: false, st: null, wait: 0,
  enter(name) {
    this.st = null;
    this.on = CAMEO_GAMES.includes(name);
    // появляется не в каждой игре
    this.wait = this.on && Math.random() < 0.65 ? M.rnd(9, 20) : Infinity;
  },
  stop() { this.wait = Infinity; if (this.st && this.st.phase !== 'out') this.leave(); },
  friend() { return V().friend; },
  start() {
    const v = G.view, side = M.pick(['left', 'right', 'bottom']);
    let hx, hy, ex, ey;
    if (side === 'left') { hy = M.rnd(260, 520); hx = v.x0 + 150; ex = v.x0 - 340; ey = hy + M.rnd(-60, 60); }
    else if (side === 'right') { hy = M.rnd(260, 520); hx = v.x1 - 150; ex = v.x1 + 340; ey = hy + M.rnd(-60, 60); }
    else { hx = M.rnd(300, 980); hy = v.y1 - 150; ex = hx + M.rnd(-80, 80); ey = v.y1 + 340; }
    this.st = { hx, hy, ex, ey, k: 0, phase: 'in', t: 0, friend: this.friend(), open: 0 };
    G.tween(this.st, { k: 1 }, 0.7, G.ease.outBack, () => { if (this.st && this.st.phase === 'in') this.st.phase = 'wait'; });
    Sound.hiss();
    if (!Voice.cur) Voice.say(M.pick(this.st.friend ? CAMEO_SAY.friend : CAMEO_SAY.sneak));
  },
  leave(fast) {
    const s = this.st; if (!s) return;
    s.phase = 'out';
    G.tween(s, { k: 0 }, fast ? 0.35 : 0.8, G.ease.inOutQuad, () => { if (this.st === s) this.st = null; });
    this.wait = M.rnd(25, 45);
  },
  down(x, y) {
    const s = this.st;
    if (!s || s.phase === 'out') return false;
    const [hx, hy] = this.head();
    if (Math.hypot(x - hx, y - hy) > 85) return false;
    stat('cameo');
    if (s.friend) {
      Sound.magic(); UI.reward(1, hx, hy);
      Voice.say(M.pick(CAMEO_SAY.gift));
      G.burst(hx, hy, { kind: 'heart', n: 10, up: true, g: -60, speed: 180 });
    } else {
      Sound.boing(); UI.reward(1, hx, hy);
      Voice.say(M.pick(CAMEO_SAY.scared));
      G.burst(hx, hy, { kind: 'star', n: 12, speed: 240 });
    }
    s.open = 1; this.leave(true);
    return true;
  },
  // кончик головы с учётом выдвижения
  head() { const s = this.st; return [M.lerp(s.ex, s.hx, s.k), M.lerp(s.ey, s.hy, s.k)]; },
  frame(ctx, dt) {
    if (!this.on || G.fadeDir !== 0) return;
    const sc = G.scene;
    if (!this.st) {
      if (sc && (sc.won || sc.done || sc.over)) return;
      this.wait -= dt;
      if (this.wait <= 0) this.start();
      return;
    }
    const s = this.st; s.t += dt;
    if (s.phase === 'wait' && s.t > 4.2) {
      // не успели нажать
      if (!s.friend && PS().treats > 0) {
        PS().treats--; S.save(); const [hx, hy] = this.head();
        UI.flyTreat(M.ri(0, 4), G.view.x1 - 140, 60, hx, hy, 0, () => Sound.chomp && Sound.chomp());
        Voice.say(M.pick(CAMEO_SAY.stole));
      } else Voice.say(M.pick(CAMEO_SAY.bye));
      this.leave();
    }
    this.draw(ctx, G.t);
  },
  draw(ctx, t) {
    const s = this.st, [hx, hy] = this.head();
    const pts = [], n = 16;
    const dx = s.ex - hx, dy = s.ey - hy, L0 = Math.hypot(s.ex - s.hx, s.ey - s.hy), nx = -(s.ey - s.hy) / L0, ny = (s.ex - s.hx) / L0;
    if (s.k <= 0.02) return;
    for (let i = 0; i < n; i++) { const u = i / (n - 1), w = Math.sin(t * 4 - i * 0.7) * 16 * u; pts.push([hx + dx * u + nx * w, hy + dy * u + ny * w]); }
    const talk = (s.phase === 'in' || s.t < 1.5 || s.open) && Math.sin(t * 14) > 0;
    Art.serpent(ctx, pts, t, { r: 36, open: talk, friend: s.friend, angry: false });
    // подсказка: пульсирующее кольцо вокруг головы
    if (s.phase === 'wait') {
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
      ctx.beginPath(); ctx.arc(hx, hy, 70 + Math.sin(t * 8) * 6, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = s.friend ? '#ff9ad5' : '#ffd23f'; ctx.stroke();
      ctx.restore();
      if (s.friend) Art.treat(ctx, 2, hx + nx * 50, hy + ny * 50, 0.7, t);
    }
  },
};
G.overlay = Cameo;
// после победы в игре Шипун уползает
(function () { const _GW = GW; GW = function (key) { Cameo.stop(); return _GW(key); }; })();
