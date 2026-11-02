// Счёт до 100: сотенная таблица, десятки и единицы, игра с растущим диапазоном
'use strict';
G.scenes.hundred = {
  enter(args) {
    this.mode = args.mode || 'board';
    const d = Learn.data(); if (!d.C) d.C = {}; if (!d.openC) d.openC = 20;
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('school') });
    this.dr = { happy: 0 }; this.sel = null; this.lit = {};
    if (this.mode === 'board') {
      this.cs = 56; this.ox = 90; this.oy = 120;
      UI.add(this, { x: 920, y: 600, w: 300, h: 70, label: 'Считаем десятками', fontSize: 24, color: '#41d982', onTap: () => this.countBy(10) });
      UI.add(this, { x: 920, y: 680, w: 300, h: 60, label: 'По одному', fontSize: 24, color: '#4fb7ff', onTap: () => this.countBy(1) });
      UI.add(this, { x: 1170, y: 640, r: 50, label: '?', fontSize: 50, color: '#ff9a3c', pulse: true, onTap: () => G.go('hundred', { mode: 'quiz' }) });
      Voice.say('Это сотенная таблица! Нажми на любое число — я его назову и покажу десятки и единицы.');
    } else this.quizStart();
  },
  // ---------- таблица ----------
  cellOf(x, y) { const c = Math.floor((x - this.ox) / this.cs), r = Math.floor((y - this.oy) / this.cs); return c >= 0 && r >= 0 && c < 10 && r < 10 ? r * 10 + c + 1 : null; },
  cellPos(n) { const i = n - 1; return { x: this.ox + (i % 10 + 0.5) * this.cs, y: this.oy + (Math.floor(i / 10) + 0.5) * this.cs }; },
  pickNum(n) {
    clearTimeout(this.cnt); this.lit = {}; this.sel = n; this.selT = G.t;
    const t = Math.floor(n / 10), u = n % 10;
    Sound.pop(1 + (n % 10) * 0.04);
    let s = numWord(n) + '.';
    if (n >= 10 && n < 100) s += ' Это ' + tensWord(t) + (u ? ' и ' + NUM_UNITS[u] : '') + '.';
    if (n === 100) s += ' Это десять десятков!';
    Voice.say(s);
  },
  countBy(step) {
    clearTimeout(this.cnt); this.lit = {}; this.sel = null;
    let n = step === 10 ? 10 : 1;
    const tick = () => {
      if (G.scene !== this || n > 100) { if (n > 100) { Sound.win(); this.dr.happy = 2; } return; }
      this.lit[n] = true; Sound.pop(1 + (n % 10) * 0.04); Voice.say(numWord(n));
      const p = this.cellPos(n); G.burst(p.x, p.y, { kind: 'star', n: 3, speed: 80, size: 8 });
      n += step; this.cnt = setTimeout(tick, step === 10 ? 1100 : 750);
    };
    tick();
  },
  // ---------- игра ----------
  quizStart() { this.q = 0; this.total = 8; this.score = 0; this.done = false; this.next(); },
  range() { return Learn.data().openC; },
  near(n) {
    const R = this.range(), out = new Set([n]);
    const cand = [n + 1, n - 1, n + 10, n - 10, (n % 10) * 10 + Math.floor(n / 10), n + 2, n - 2];
    for (const c of M.shuffle(cand)) if (c >= 0 && c <= R && out.size < 4) out.add(c);
    while (out.size < 4) out.add(M.ri(0, R));
    return M.shuffle([...out]);
  },
  next() {
    if (this.q >= this.total) return this.finish();
    this.q++; this.tries = 0; this.locked = false; this.hintI = -1;
    const R = this.range(), lo = Math.max(1, R - 30);
    const n = Math.random() < 0.6 ? M.ri(Math.max(1, R - 10), R) : M.ri(lo > 10 ? 10 : 1, R);
    this.type = M.pick(['find', 'find', 'count', 'after', 'bigger']);
    if (this.type === 'bigger') { let m = this.near(n).find(x => x !== n); this.opts = M.shuffle([n, m]); this.target = Math.max(n, m); this.say = 'Какое число больше?'; }
    else if (this.type === 'after') { const a = Math.min(n, R - 1); this.base = a; this.target = a + 1; this.opts = this.near(a + 1); this.say = 'Какое число идёт после ' + numWord(a) + '?'; }
    else { this.target = n; this.opts = this.near(n); this.say = this.type === 'count' ? 'Сколько здесь? Считай десятками, а потом единицы!' : 'Найди число ' + numWord(n) + '!'; }
    Voice.say(this.say);
  },
  optPos(i) { const n = this.opts.length; return { x: 640 + (i - (n - 1) / 2) * 210, y: 560, r: 76 }; },
  choose(i) {
    if (this.locked) return;
    const ok = this.opts[i] === this.target, key = Math.floor(this.target / 10), rec = Learn.data().C[key] || (Learn.data().C[key] = { ok: 0, bad: 0 });
    if (ok) {
      this.locked = true;
      if (this.tries === 0) { rec.ok++; this.score++; UI.reward(1, 640, 300); }
      Sound.chime(1.3); this.dr.happy = 1.5; G.burst(this.optPos(i).x, this.optPos(i).y, { kind: 'star', n: 16, speed: 240 });
      Voice.say(M.pick(['Правильно!', 'Молодец!', 'Здорово считаешь!']) + ' ' + numWord(this.target) + '!');
      setTimeout(() => { if (G.scene === this) this.next(); }, 2200);
    } else {
      this.tries++; if (this.tries === 1) rec.bad++; Sound.boing();
      if (this.tries >= 2) this.hintI = this.opts.indexOf(this.target);
      Voice.say(this.tries >= 2 ? 'Подсказка: вот оно светится.' : 'Не совсем. Попробуй ещё!');
    }
    S.save();
  },
  finish() {
    this.done = true; Sound.win(); Sound.purr(1.4);
    const d = Learn.data();
    if (this.score >= 6) {
      GW('count100');
      if (d.openC < 100) { d.openC = Math.min(100, d.openC + 10); setTimeout(() => G.toast('Теперь считаем до ' + d.openC + '!', 'star'), 900); }
    }
    S.save();
    UI.reward(this.score >= 6 ? 3 : 1, 640, 300);
    Voice.say('Урок счёта окончен! Правильно: ' + this.score + ' из ' + this.total + '.' + (this.score >= 6 && d.openC <= 100 ? ' Теперь будем считать до ' + numWord(d.openC) + '!' : ''));
    UI.add(this, { x: 520, y: 600, r: 60, icon: 'replay', color: '#41d982', pulse: true, onTap: () => G.go('hundred', { mode: 'quiz' }) });
    UI.add(this, { x: 760, y: 600, r: 60, icon: 'home', color: '#ff7eb6', onTap: () => G.go('school') });
  },
  down(x, y) {
    if (this.mode === 'board') { const n = this.cellOf(x, y); if (n) this.pickNum(n); return; }
    if (this.done) return;
    for (let i = 0; i < this.opts.length; i++) { const p = this.optPos(i); if (Math.hypot(x - p.x, y - p.y) < p.r + 8) return this.choose(i); }
    if (y < 470) Voice.say(this.say);
  },
  update(dt) { this.dr.happy = Math.max(0, this.dr.happy - dt); },
  // десятки — столбики по 10 шариков, единицы — отдельные шарики
  drawTensOnes(ctx, n, x, y, sc) {
    sc = sc || 1;
    const t = Math.floor(n / 10), u = n % 10, r = 9 * sc;
    for (let k = 0; k < t; k++) {
      const bx = x + k * 30 * sc;
      Art.rr(ctx, bx - 13 * sc, y - 4 * sc, 26 * sc, 214 * sc, 10 * sc); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      for (let j = 0; j < 10; j++) Art.ell(ctx, bx, y + 8 * sc + j * 20 * sc, r, r, '#ffd23f');
    }
    for (let j = 0; j < u; j++) Art.ell(ctx, x + t * 30 * sc + 20 * sc + (j % 2) * 22 * sc, y + 8 * sc + Math.floor(j / 2) * 22 * sc, r, r, '#ff7eb6');
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.45);
    if (this.mode === 'board') {
      const { cs, ox, oy } = this;
      Art.rr(ctx, ox - 10, oy - 10, cs * 10 + 20, cs * 10 + 20, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); Art.stroke(ctx, 5);
      for (let n = 1; n <= 100; n++) {
        const i = n - 1, x = ox + (i % 10) * cs, y = oy + Math.floor(i / 10) * cs;
        const isSel = n === this.sel, lit = this.lit[n];
        ctx.fillStyle = isSel ? '#ffd23f' : lit ? '#bff5c8' : (Math.floor(i / 10) % 2 ? '#f4f0ff' : '#fff8ec'); ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        if (n % 10 === 0) { ctx.fillStyle = 'rgba(65,217,130,0.25)'; ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4); }
        UI.text(ctx, String(n), x + cs / 2, y + cs / 2 + 2, n === 100 ? 20 : 24, '#2a1650', 'center', false);
      }
      // разбор выбранного числа
      Art.rr(ctx, 690, 110, 560, 430, 24); ctx.fillStyle = '#2f5a48'; ctx.fill(); Art.stroke(ctx, 6, '#8a5a2a');
      if (this.sel) {
        const n = this.sel, tt = Math.floor(n / 10), u = n % 10;
        UI.text(ctx, String(n), 800, 190, 90, '#ffffff', 'center', false);
        UI.text(ctx, numWord(n), 1060, 175, 30, '#ffd23f', 'center', false);
        if (n >= 10 && n < 100) UI.text(ctx, tt + ' дес. + ' + u + ' ед.', 1060, 215, 28, '#cfe8da', 'center', false);
        this.drawTensOnes(ctx, n, 730, 270, n > 70 ? 0.85 : 1);
      } else UI.text(ctx, 'Нажми на число', 970, 320, 36, '#cfe8da', 'center', false);
      Art.dragon(ctx, 1170, 520, 0.32, { t, happy: this.dr.happy > 0, look: -1 });
      return;
    }
    Art.rr(ctx, 110, 110, 1060, 380, 26); ctx.fillStyle = '#2f5a48'; ctx.fill(); Art.stroke(ctx, 8, '#8a5a2a');
    if (this.done) {
      UI.text(ctx, 'Урок счёта окончен!', 640, 230, 56, '#ffd23f', 'center', false);
      for (let i = 0; i < this.total; i++) Art.roundStar(ctx, 640 - (this.total - 1) * 30 + i * 60, 330, 24, i < this.score ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#1a1030');
      UI.text(ctx, 'Считаем до ' + this.range(), 640, 410, 30, '#fff', 'center', false);
      return;
    }
    UI.text(ctx, 'Вопрос ' + this.q + ' из ' + this.total + ' · считаем до ' + this.range() + '  🔊', 640, 140, 24, '#cfe8da', 'center', false);
    if (this.type === 'count') this.drawTensOnes(ctx, this.target, 640 - (Math.floor(this.target / 10) * 30 + 60) / 2, 200, 1.1);
    else if (this.type === 'after') { UI.text(ctx, this.base + ', ?', 640, 300, 110, '#ffffff', 'center', false); }
    else if (this.type === 'bigger') UI.text(ctx, 'Какое больше?', 640, 300, 60, '#ffffff', 'center', false);
    else { Art.dragon(ctx, 640, 430, 0.5, { t, happy: this.dr.happy > 0 }); UI.text(ctx, 'Найди число  🔊', 640, 200, 40, '#ffffff', 'center', false); }
    this.opts.forEach((o, i) => {
      const p = this.optPos(i), col = ['#ff7eb6', '#4fb7ff', '#ffb23a', '#41d982'][i % 4];
      if (this.hintI === i) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3; Art.ell(ctx, p.x, p.y, p.r + 18, p.r + 18, '#fff3a0'); ctx.restore(); }
      Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); }, col, Art.mix(col, '#000000', 0.25), '#ffffff', 4, 10);
      UI.text(ctx, String(o), p.x, p.y + 4, o >= 100 ? 56 : 66, '#ffffff', 'center', true);
    });
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
