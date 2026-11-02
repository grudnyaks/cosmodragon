// Школа дракона: учим буквы и цифры с озвучкой. Дракончик — ученик, ребёнок — учитель.
'use strict';
G.scenes.school = {
  enter(args) {
    this.mode = args.mode || 'menu';
    this.kind = args.kind || 'L';
    this.dr = { happy: 0, think: 0, squash: 0 };
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => this.mode === 'menu' ? G.go('home') : G.go('school') });
    if (this.mode === 'menu') this.menu();
    else if (this.mode === 'learn') this.learnStart();
    else this.quizStart();
  },
  // ---------- меню ----------
  menu() {
    const tiles = [
      { kind: 'L', mode: 'learn', label: 'Учим буквы', sub: 'А Б В', color: '#ff7eb6', x: 420, y: 300 },
      { kind: 'L', mode: 'quiz', label: 'Игра с буквами', sub: '?', color: '#b07cff', x: 860, y: 300 },
      { kind: 'N', mode: 'learn', label: 'Учим цифры', sub: '1 2 3', color: '#41d982', x: 420, y: 520 },
      { kind: 'N', mode: 'quiz', label: 'Игра с цифрами', sub: '?', color: '#ff9a3c', x: 860, y: 520 },
    ];
    this.tiles = tiles;
    tiles.forEach(t => UI.add(this, { x: t.x, y: t.y, w: 400, h: 170, color: t.color, onTap: () => { Voice.stop(); G.go('school', { mode: t.mode, kind: t.kind }); },
      draw: (ctx) => { UI.text(ctx, t.sub, -125, 0, t.sub === '?' ? 80 : 40, '#fff', 'center', true); UI.text(ctx, t.label, 62, 0, 30, '#fff', 'center', true); } }));
    Voice.say(P().dragon.name + ' хочет учиться! Научи его буквам и цифрам. Выбери, что будем делать.');
  },
  // ---------- карточки «учим» ----------
  learnStart() {
    const list = this.kind === 'L' ? ALPHABET : NUMBERS;
    this.list = list; this.i = 0;
    if (this.kind === 'L') { const firstNew = ALPHABET.findIndex(L => !Learn.known('L', L)); this.i = Math.max(0, firstNew); }
    this.counted = 0;
    UI.add(this, { x: 150, y: 400, r: 56, color: '#8f6cf2', draw: (ctx) => { ctx.save(); ctx.scale(-1, 1); Art.icon(ctx, 'next', 0, 0, 1.1); ctx.restore(); }, onTap: () => this.flip(-1) });
    UI.add(this, { x: 1130, y: 400, r: 56, icon: 'next', color: '#8f6cf2', iconScale: 1.1, onTap: () => this.flip(1) });
    this.showCard();
  },
  flip(d) { this.i = (this.i + d + this.list.length) % this.list.length; Sound.whoosh(); this.showCard(); },
  showCard() {
    this.cardT = G.t; this.counted = 0; this.dr.squash = 0.5; G.tween(this.dr, { squash: 0 }, 0.6, G.ease.outElastic);
    if (this.kind === 'L') {
      const L = this.list[this.i]; Learn.rec('L', L).seen++; S.save();
      Voice.say(Learn.letterSay(L));
    } else {
      const n = this.list[this.i]; Learn.rec('N', n).seen++; S.save();
      clearTimeout(this.countTimer);
      if (n === 0) Voice.say('Ноль. Это когда ничего нет!');
      else { Voice.say('Цифра ' + NUM_NOM[n] + '. Давай посчитаем!'); this.autoCount(1, n, 1700); }
    }
  },
  autoCount(k, n, delay) {
    this.countTimer = setTimeout(() => {
      if (G.scene !== this || this.mode !== 'learn' || this.list[this.i] !== n) return;
      this.counted = k; Sound.pop(0.9 + k * 0.05); Voice.say(NUM_NOM[k] + (k === n ? '!' : ''));
      if (k < n) this.autoCount(k + 1, n, 750); else { this.dr.happy = 1.5; Sound.chime(1.2); }
    }, delay);
  },
  // ---------- вопросы «играем» ----------
  quizStart() {
    this.q = 0; this.total = 8; this.score = 0; this.done = false;
    Learn.data().sessions++; S.save();
    this.next();
  },
  next() {
    if (this.q >= this.total) return this.finish();
    this.q++; this.tries = 0; this.locked = false; this.opts = []; this.hintI = -1; this.wig = {};
    const k = this.kind, nOpt = Math.min(3 + Math.floor(Learn.pool(k).length / 6), 5);
    const types = k === 'L' ? (Learn.data().openL >= 9 ? ['find', 'find', 'first'] : ['find']) : (Learn.data().openN >= 4 ? ['find', 'count', 'count', 'more'] : ['find', 'count']);
    this.type = M.pick(types);
    if (this.type === 'more') {
      const a = M.ri(1, Learn.data().openN), b0 = M.ri(1, Learn.data().openN); const b = b0 === a ? (a > 1 ? a - 1 : a + 1) : b0;
      this.ans = a > b ? 0 : 1; this.groups = [a, b];
      this.say = 'Где больше вкусняшек? Покажи!';
    } else {
      this.target = Learn.pick(k);
      const opts = [this.target];
      while (opts.length < nOpt) { const o = M.pick(k === 'L' ? Learn.pool('L').concat(LETTER_ORDER.slice(0, 12)) : NUMBERS.slice(0, Math.max(5, Learn.data().openN + 2))); if (!opts.includes(o)) opts.push(o); }
      this.opts = M.shuffle(opts);
      if (this.type === 'first' && ['Ы', 'Ь', 'Ъ'].includes(this.target)) this.type = 'find';
      if (k === 'L') this.say = this.type === 'first' ? 'С какой буквы начинается слово ' + LETTERS[this.target][1].toLowerCase() + '?' : 'Научи меня: где буква ' + LETTERS[this.target][0] + '?';
      else this.say = this.type === 'count' ? 'Сколько здесь вкусняшек? Посчитай и найди цифру!' : 'Где цифра ' + NUM_NOM[this.target] + '?';
    }
    this.label = this.type === 'more' ? 'Где больше?' : this.type === 'count' ? 'Посчитай и найди цифру' : this.type === 'first' ? 'С какой буквы начинается слово?'
      : this.kind === 'L' ? 'Слушай и найди букву' : 'Слушай и найди цифру';
    this.qT = G.t; this.dr.think = 1;
    Voice.say(this.say);
  },
  optPos(i) { const n = this.opts.length, w = Math.min(190, 900 / n); return { x: 640 + (i - (n - 1) / 2) * w, y: 560, r: Math.min(78, w * 0.42) }; },
  choose(i) {
    if (this.locked) return;
    const k = this.kind;
    const ok = this.type === 'more' ? i === this.ans : this.opts[i] === this.target;
    const key = this.type === 'more' ? Math.max(...this.groups) : this.target;
    if (ok) {
      this.locked = true;
      const res = Learn.answer(k, key, this.tries === 0);
      if (this.tries === 0) { this.score++; UI.reward(1, 640, 300); }
      Sound.chime(1.3); this.dr.happy = 1.5; this.dr.think = 0;
      const p = this.type === 'more' ? { x: i ? 900 : 380, y: 330 } : this.optPos(i);
      G.burst(p.x, p.y, { kind: 'star', n: 16, speed: 240 });
      const praise = M.pick(['Правильно!', 'Молодец!', 'Ура, я запомнил!', 'Спасибо, учитель!', 'Здорово!']);
      Voice.say(praise + (k === 'L' && this.type !== 'more' ? ' ' + Learn.letterSay(this.target) : this.type === 'count' ? ' Здесь ' + NUM_NOM[this.target] + '.' : ''));
      if (res === 'new') setTimeout(() => { if (G.scene === this) { G.toast(k === 'L' ? 'Новые буквы!' : 'Новые цифры!', 'star'); } }, 800);
      setTimeout(() => { if (G.scene === this) this.next(); }, 2300);
    } else {
      this.tries++; Sound.boing(); this.wig[i] = 1;
      if (this.tries === 1) Learn.answer(k, key, false);
      if (this.tries >= 2) this.hintI = this.type === 'more' ? this.ans : this.opts.indexOf(this.target);
      Voice.say(this.tries >= 2 ? 'Посмотри, вот она светится!' : 'Не совсем. Попробуй ещё!');
      setTimeout(() => { this.wig[i] = 0; }, 400);
    }
  },
  finish() {
    this.done = true;
    Sound.win(); Sound.purr(1.5); this.dr.happy = 4;
    if (this.score >= 6) GW('school');
    UI.reward(this.score >= 6 ? 3 : 1, 640, 300);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Урок окончен! Правильных ответов: ' + this.score + ' из ' + this.total + '. ' + P().dragon.name + ' говорит: спасибо, учитель!');
    UI.add(this, { x: 520, y: 600, r: 60, icon: 'replay', color: '#41d982', pulse: true, onTap: () => G.go('school', { mode: 'quiz', kind: this.kind }) });
    UI.add(this, { x: 760, y: 600, r: 60, icon: 'home', color: '#ff7eb6', onTap: () => G.go('home') });
  },
  down(x, y) {
    if (this.mode === 'learn') {
      if (this.kind === 'L') { // нажатие на букву или картинку — повтор
        if (Math.abs(x - 520) < 160 && Math.abs(y - 320) < 170) { Voice.say(Learn.letterSay(this.list[this.i])); this.dr.squash = 0.4; G.tween(this.dr, { squash: 0 }, 0.5, G.ease.outElastic); }
        else if (Math.abs(x - 860) < 120 && Math.abs(y - 320) < 140) { Voice.say(LETTERS[this.list[this.i]][1]); Sound.pop(1.2); }
      } else { // считаем сами, нажимая на вкусняшки
        const n = this.list[this.i];
        for (let k = 0; k < n; k++) { const p = this.objPos(k, n); if (Math.hypot(x - p.x, y - p.y) < 45) { clearTimeout(this.countTimer); this.counted = Math.min(n, this.counted + 1); Sound.pop(1 + this.counted * 0.05); Voice.say(NUM_NOM[this.counted]); if (this.counted === n) { this.dr.happy = 1.5; Sound.chime(1.2); } return; } }
        if (Math.abs(x - 300) < 140 && Math.abs(y - 330) < 170) Voice.say('Цифра ' + NUM_NOM[n] + '.');
      }
      return;
    }
    if (this.mode === 'quiz' && !this.done) {
      if (this.type === 'more') { for (const gi of [0, 1]) if (Math.abs(x - (gi ? 900 : 380)) < 220 && Math.abs(y - 420) < 200) return this.choose(gi); return; }
      for (let i = 0; i < this.opts.length; i++) { const p = this.optPos(i); if (Math.hypot(x - p.x, y - p.y) < p.r + 10) return this.choose(i); }
      if (y < 480) Voice.say(this.say); // повторить вопрос
    }
  },
  objPos(k, n) { const r = Math.floor(k / 5), c = k % 5, rowN = Math.min(5, n - r * 5); return { x: 790 + (c - (rowN - 1) / 2) * 112, y: (n > 5 ? 230 : 300) + r * 140 }; },
  update(dt) { this.dr.happy = Math.max(0, this.dr.happy - dt); },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.45);
    // школьная доска
    if (this.mode !== 'menu') { Art.rr(ctx, 120, 110, 1040, 400, 26); ctx.fillStyle = '#2f5a48'; ctx.fill(); Art.stroke(ctx, 8, '#8a5a2a'); }
    const d = this.dr;
    if (this.mode === 'menu') {
      UI.text(ctx, 'Школа дракона', 640, 100, 56, '#ffd6f0', 'center', true);
      Art.dragon(ctx, 1180, 700, 0.5, { t, happy: true });
      const L = Learn.data();
      const kl = ALPHABET.filter(x => Learn.known('L', x)).length, kn = NUMBERS.filter(x => Learn.known('N', x)).length;
      UI.text(ctx, 'Знаю букв: ' + kl + ' из 33   ·   Знаю цифр: ' + kn + ' из 11', 640, 660, 26, '#fff', 'center', true);
      return;
    }
    if (this.mode === 'learn') {
      const k = Math.min(1, (t - this.cardT) * 4), sc = G.ease.outBack(k);
      if (this.kind === 'L') {
        const L = this.list[this.i], info = LETTERS[L];
        ctx.save(); ctx.translate(520, 320); ctx.scale(sc, sc);
        UI.text(ctx, L + L.toLowerCase(), 0, 0, 220, '#ffffff', 'center', false);
        ctx.restore();
        ctx.save(); ctx.translate(860, 290); ctx.scale(sc, sc); ctx.font = '150px "Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(info[2], 0, 0); ctx.restore();
        // слово: нужная буква выделена
        const w = info[1]; ctx.save(); ctx.font = 'bold 56px ' + UI.font; const tw = ctx.measureText(w).width; let x = 860 - tw / 2;
        for (const ch of w) { const cw = ctx.measureText(ch).width; UI.text(ctx, ch, x + cw / 2, 440, 56, ch.toUpperCase() === L && /[А-ЯЁ]/.test(ch) ? '#ffd23f' : '#ffffff', 'center', false); x += cw; }
        ctx.restore();
        if (Learn.known('L', L)) Art.roundStar(ctx, 200, 160, 26, '#ffd23f', '#1a1030');
      } else {
        const n = this.list[this.i];
        ctx.save(); ctx.translate(300, 330); ctx.scale(sc, sc); UI.text(ctx, String(n), 0, 0, 260, '#ffffff', 'center', false); ctx.restore();
        for (let q = 0; q < n; q++) { const p = this.objPos(q, n), on = q < this.counted; ctx.save(); if (!on) ctx.globalAlpha = 0.55; Art.treat(ctx, q % 6, p.x, p.y + (on ? -6 : 0), on ? 1.25 : 1.1, t); ctx.restore(); if (on) UI.text(ctx, String(q + 1), p.x + 40, p.y - 46, 30, '#ffd23f', 'center', true); }
        if (n === 0) { ctx.save(); ctx.globalAlpha = 0.6; Art.ell(ctx, 820, 300, 90, 60, '#4a7a62'); ctx.restore(); UI.text(ctx, 'пусто', 820, 300, 36, '#cfe8da', 'center', false); }
        UI.text(ctx, NUM_NOM[n], 300, 470, 40, '#ffd23f', 'center', false);
      }
      Art.dragon(ctx, 640, 705, 0.42, { t, happy: d.happy > 0, squash: d.squash, look: 0 });
      UI.text(ctx, (this.i + 1) + ' / ' + this.list.length, 640, 545, 24, '#fff', 'center', true);
      return;
    }
    // викторина
    if (this.done) {
      UI.text(ctx, 'Урок окончен!', 640, 220, 64, '#ffd23f', 'center', false);
      for (let i = 0; i < this.total; i++) Art.roundStar(ctx, 640 - (this.total - 1) * 30 + i * 60, 330, 24, i < this.score ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#1a1030');
      UI.text(ctx, 'Правильно: ' + this.score + ' из ' + this.total, 640, 420, 36, '#fff', 'center', false);
      Art.dragon(ctx, 1120, 700, 0.5, { t, happy: true });
      return;
    }
    UI.text(ctx, 'Вопрос ' + this.q + ' из ' + this.total, 640, 136, 22, '#cfe8da', 'center', false);
    UI.text(ctx, this.label + '  🔊', 640, 168, 26, '#ffffff', 'center', false);
    // сам вопрос
    if (this.type === 'more') {
      this.groups.forEach((n, gi) => {
        const cx = gi ? 900 : 380, hl = this.hintI === gi;
        Art.rr(ctx, cx - 200, 190, 400, 300, 24); ctx.fillStyle = hl ? 'rgba(255,240,150,0.35)' : 'rgba(255,255,255,0.12)'; ctx.fill(); Art.stroke(ctx, 4, hl ? '#ffd23f' : '#cfe8da');
        for (let q = 0; q < n; q++) Art.treat(ctx, gi ? 3 : 0, cx - 140 + (q % 4) * 92, 250 + Math.floor(q / 4) * 90, 0.72, t);
      });
      UI.text(ctx, 'Где больше?', 640, 560, 44, '#ffd23f', 'center', true);
    } else {
      if (this.kind === 'L' && this.type === 'first') {
        const info = LETTERS[this.target];
        ctx.save(); ctx.font = '170px "Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(info[2], 640, 300); ctx.restore();
        UI.text(ctx, '?' + info[1].slice(1).toLowerCase(), 640, 440, 48, '#ffffff', 'center', false);
      } else if (this.type === 'count') {
        const n = this.target; for (let q = 0; q < n; q++) Art.treat(ctx, q % 6, 640 + ((q % 5) - (Math.min(5, n - Math.floor(q / 5) * 5) - 1) / 2) * 100, 260 + Math.floor(q / 5) * 120, 0.9, t);
        if (n === 0) UI.text(ctx, 'пусто', 640, 300, 44, '#cfe8da', 'center', false);
      } else {
        Art.dragon(ctx, 640, 470, 0.55, { t, happy: d.happy > 0, look: Math.sin(t) * 0.5 });
        if (d.happy <= 0) { Art.rr(ctx, 760, 230, 120, 90, 30); ctx.fillStyle = '#ffffff'; ctx.fill(); Art.stroke(ctx, 4); UI.text(ctx, '?', 820, 276, 64, '#8f6cf2', 'center', false); }
      }
      // варианты-пузыри
      this.opts.forEach((o, i) => {
        const p = this.optPos(i), hl = this.hintI === i, wig = this.wig[i] ? Math.sin(t * 50) * 6 : 0;
        const col = ['#ff7eb6', '#4fb7ff', '#ffb23a', '#41d982', '#b07cff'][i % 5];
        if (hl) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3; Art.ell(ctx, p.x, p.y, p.r + 18, p.r + 18, '#fff3a0'); ctx.restore(); }
        Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(p.x + wig, p.y, p.r, 0, Math.PI * 2); }, col, Art.mix(col, '#000000', 0.25), '#ffffff', 4, 10);
        UI.text(ctx, this.kind === 'L' ? o : String(o), p.x + wig, p.y + 4, p.r * 1.1, '#ffffff', 'center', true);
      });
    }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
