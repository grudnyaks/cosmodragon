// Чтение: собираем слоги (М + А = МА) и читаем первые слова по слогам
'use strict';
G.scenes.read = {
  enter(args) {
    this.mode = args.mode || 'syl';
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('school') });
    this.dr = { happy: 0 };
    const d = Learn.data(); if (!d.S) d.S = {}; if (!d.W) d.W = {}; if (d.openW == null) d.openW = 6;
    if (this.mode === 'syl') this.sylStart(); else this.wordStart();
  },
  // ---------- слоги ----------
  consonants() { return LETTER_ORDER.slice(0, Math.max(8, Learn.data().openL)).filter(L => !VOWELS.includes(L) && !'ЬЪЙЕЁЮЯ'.includes(L)); },
  sylStart() {
    this.phase = 'build'; this.built = 0; this.needBuild = 6;
    this.cons = M.pick(this.consonants().length ? this.consonants() : ['М']);
    this.merge = null;
    this.vow = VOWELS.filter(v => !(this.cons === 'К' || this.cons === 'Г' || this.cons === 'Х') || v !== 'Ы').filter(v => !('ЖШЧЩ'.includes(this.cons) && v === 'Ы'));
    Voice.say('Давай читать слоги! Это буква ' + LETTERS[this.cons][0] + '. Нажми на любую гласную — и они встретятся!');
  },
  vowPos(i) { const n = this.vow.length; return { x: 760 + (i % 3) * 150, y: 300 + Math.floor(i / 3) * 160 }; },
  buildTap(x, y) {
    if (this.merge) return;
    for (let i = 0; i < this.vow.length; i++) {
      const p = this.vowPos(i);
      if (Math.hypot(x - p.x, y - p.y) < 66) {
        const syl = this.cons + this.vow[i];
        this.merge = { i, k: 0, syl, tx: p.x, ty: p.y };
        Sound.whoosh();
        G.tween(this.merge, { k: 1 }, 0.7, G.ease.inOutQuad, () => {
          Sound.chime(1.2); this.dr.happy = 1.2;
          Voice.say(syl.toLowerCase() + '! ' + syl.toLowerCase() + '!');
          G.burst(p.x, p.y, { kind: 'star', n: 12, speed: 200 });
          setTimeout(() => {
            if (G.scene !== this) return;
            this.merge = null; this.built++;
            if (this.built >= this.needBuild) this.sylQuizStart();
            else if (this.built % 3 === 0) { this.cons = M.pick(this.consonants()); Voice.say('Новая буква: ' + LETTERS[this.cons][0] + '. Собери с ней слоги!'); }
          }, 1500);
        });
        return;
      }
    }
  },
  sylQuizStart() {
    this.phase = 'quiz'; this.q = 0; this.total = 6; this.score = 0; this.opts = []; this.target = null;
    Voice.say('А теперь проверим! Слушай и найди слог.');
    setTimeout(() => { if (G.scene === this) this.sylNext(); }, 2200);
  },
  sylNext() {
    if (this.q >= this.total) return this.finish();
    this.q++; this.tries = 0; this.locked = false; this.hintI = -1;
    const cons = this.consonants(), opts = [];
    const target = M.pick(cons) + M.pick(['А', 'О', 'У', 'И']);
    opts.push(target);
    while (opts.length < 4) { const o = (Math.random() < 0.5 ? target[0] : M.pick(cons)) + M.pick(VOWELS.slice(0, 5)); if (!opts.includes(o) && !/[КГХЖШЧЩ]Ы/.test(o)) opts.push(o); }
    this.target = target; this.opts = M.shuffle(opts);
    this.say = 'Найди слог ' + target.toLowerCase() + '!';
    Voice.say(this.say);
  },
  // ---------- слова ----------
  wordStart() {
    this.phase = 'read'; this.read = 0; this.needRead = 3;
    const open = READ_WORDS.slice(0, Learn.data().openW);
    this.words = M.shuffle(open.slice()).slice(0, 3);
    this.loadWord();
    Voice.say('Читаем слова по слогам! Нажимай на слоги по порядку.');
  },
  loadWord() { this.w = this.words[this.read]; this.tapped = 0; this.reveal = 0; },
  chipPos(i, n) { return { x: 640 + (i - (n - 1) / 2) * 200, y: 470 }; },
  readTap(x, y) {
    const n = this.w.syl.length;
    for (let i = 0; i < n; i++) {
      const p = this.chipPos(i, n);
      if (Math.abs(x - p.x) < 90 && Math.abs(y - p.y) < 60) {
        if (i !== this.tapped) { Sound.boing(); Voice.say('Читаем слева направо!'); return; }
        this.tapped++; Sound.pop(1.1); Voice.say(this.w.syl[i].toLowerCase());
        if (this.tapped === n) {
          setTimeout(() => {
            if (G.scene !== this) return;
            Voice.say(this.w.syl.map(s => s.toLowerCase()).join(' ') + '. ' + this.w.word.toLowerCase() + '!');
            G.tween(this, { reveal: 1 }, 0.6, G.ease.outBack); Sound.chime(1.3); this.dr.happy = 1.5;
            const r = Learn.data().W; r[this.w.word] = r[this.w.word] || { ok: 0, bad: 0 }; r[this.w.word].seen = 1; S.save();
            setTimeout(() => { if (G.scene !== this) return; this.read++; if (this.read >= this.needRead) this.wordQuizStart(); else this.loadWord(); }, 2600);
          }, 700);
        }
        return;
      }
    }
  },
  wordQuizStart() {
    this.phase = 'wquiz'; this.q = 0; this.total = 4; this.score = 0; this.opts = []; this.target = null;
    Voice.say('А теперь прочитай слово сам и найди картинку!');
    setTimeout(() => { if (G.scene === this) this.wordNext(); }, 2400);
  },
  wordNext() {
    if (this.q >= this.total) return this.finish();
    this.q++; this.tries = 0; this.locked = false; this.hintI = -1;
    const open = READ_WORDS.slice(0, Learn.data().openW);
    const target = M.pick(open), opts = [target];
    while (opts.length < 3) { const o = M.pick(READ_WORDS.slice(0, Math.max(9, Learn.data().openW))); if (!opts.includes(o)) opts.push(o); }
    this.target = target; this.opts = M.shuffle(opts);
    this.say = 'Прочитай слово и найди картинку!';
  },
  // ---------- ответы ----------
  optPos(i) { const n = this.opts.length; return { x: 640 + (i - (n - 1) / 2) * 230, y: this.phase === 'wquiz' ? 500 : 520, r: 82 }; },
  choose(i) {
    if (this.locked || !this.target) return;
    const ok = this.opts[i] === this.target;
    const key = this.phase === 'quiz' ? this.target : this.target.word, store = this.phase === 'quiz' ? Learn.data().S : Learn.data().W;
    const rec = store[key] || (store[key] = { ok: 0, bad: 0 });
    if (ok) {
      this.locked = true;
      if (this.tries === 0) { rec.ok++; this.score++; UI.reward(1, 640, 300); } S.save();
      Sound.chime(1.3); this.dr.happy = 1.5; G.burst(this.optPos(i).x, this.optPos(i).y, { kind: 'star', n: 16, speed: 240 });
      Voice.say(M.pick(['Правильно!', 'Молодец!', 'Ты умеешь читать!']) + ' ' + (this.phase === 'quiz' ? this.target.toLowerCase() : this.target.word.toLowerCase()) + '!');
      setTimeout(() => { if (G.scene === this) this.phase === 'quiz' ? this.sylNext() : this.wordNext(); }, 2200);
    } else {
      this.tries++; rec.bad += this.tries === 1 ? 1 : 0; S.save(); Sound.boing();
      if (this.tries >= 2) { this.hintI = this.opts.indexOf(this.target); if (this.phase === 'wquiz') Voice.say('Это слово: ' + this.target.word.toLowerCase() + '. Где эта картинка?'); else Voice.say('Вот он светится: ' + this.target.toLowerCase()); }
      else Voice.say('Не совсем. Попробуй ещё!');
    }
  },
  finish() {
    this.phase = 'done';
    Sound.win(); Sound.purr(1.4);
    if (this.score >= this.total - 1) {
      GW('read');
      const d = Learn.data();
      if (this.mode === 'words' && d.openW < READ_WORDS.length) { d.openW = Math.min(READ_WORDS.length, d.openW + 3); setTimeout(() => G.toast('Новые слова!', 'book'), 800); }
      S.save();
    }
    UI.reward(this.score >= this.total - 1 ? 3 : 1, 640, 300);
    Voice.say('Урок чтения окончен! Ты молодец!');
    UI.add(this, { x: 520, y: 600, r: 60, icon: 'replay', color: '#41d982', pulse: true, onTap: () => G.go('read', { mode: this.mode }) });
    UI.add(this, { x: 760, y: 600, r: 60, icon: 'home', color: '#ff7eb6', onTap: () => G.go('school') });
  },
  down(x, y) {
    if (this.phase === 'build') return this.buildTap(x, y);
    if (this.phase === 'read') return this.readTap(x, y);
    if (this.phase === 'quiz' || this.phase === 'wquiz') {
      for (let i = 0; i < this.opts.length; i++) { const p = this.optPos(i); if (Math.hypot(x - p.x, y - p.y) < p.r + 8) return this.choose(i); }
      if (this.phase === 'quiz' && y < 420) Voice.say(this.say);
    }
  },
  update(dt) { this.dr.happy = Math.max(0, this.dr.happy - dt); },
  emoji(ctx, e, x, y, size) { ctx.save(); ctx.font = size + 'px "Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); ctx.restore(); },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.45);
    Art.rr(ctx, 110, 110, 1060, 420, 26); ctx.fillStyle = '#2f5a48'; ctx.fill(); Art.stroke(ctx, 8, '#8a5a2a');
    const chip = (txt, x, y, w, col, on) => { Art.cel(ctx, () => { Art.rr(ctx, x - w / 2, y - 52, w, 104, 24); }, on ? '#ffd23f' : col, Art.mix(on ? '#ffd23f' : col, '#000000', 0.25), '#ffffff', 4, 10); UI.text(ctx, txt, x, y + 4, 64, '#ffffff', 'center', true); };
    if (this.phase === 'build') {
      UI.text(ctx, 'Нажми на гласную', 640, 150, 30, '#cfe8da', 'center', false);
      const m = this.merge;
      this.vow.forEach((v, i) => { const p = this.vowPos(i); if (m && m.i === i && m.k >= 1) return; Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(p.x, p.y, 62, 0, Math.PI * 2); }, '#ff7eb6', '#c83a8a', '#ffffff', 4, 12); UI.text(ctx, v, p.x, p.y + 4, 70, '#fff', 'center', true); });
      const cx = m ? M.lerp(330, m.tx - 70, m.k) : 330, cy = m ? M.lerp(380, m.ty, m.k) : 380;
      if (m && m.k >= 1) { chip(m.syl, m.tx, m.ty, 230, '#41d982'); }
      else { Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, 72, 0, Math.PI * 2); }, '#4fb7ff', '#2a7ad8', '#ffffff', 4, 12); UI.text(ctx, this.cons, cx, cy + 4, 84, '#fff', 'center', true); }
      for (let i = 0; i < this.needBuild; i++) Art.roundStar(ctx, 640 - (this.needBuild - 1) * 28 + i * 56, 560, 20, i < this.built ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#1a1030');
    } else if (this.phase === 'read') {
      const w = this.w, n = w.syl.length;
      UI.text(ctx, 'Нажимай на слоги по порядку', 640, 150, 30, '#cfe8da', 'center', false);
      if (this.reveal > 0) { ctx.save(); ctx.translate(640, 300); ctx.scale(this.reveal, this.reveal); this.emoji(ctx, w.pic, 0, 0, 140); ctx.restore(); }
      else UI.text(ctx, '?', 640, 300, 120, 'rgba(255,255,255,0.3)', 'center', false);
      w.syl.forEach((s, i) => { const p = this.chipPos(i, n); chip(s, p.x, p.y, 180, ['#ff7eb6', '#4fb7ff', '#ff9a3c'][i % 3], i < this.tapped); });
      if (this.tapped < n) { const p = this.chipPos(this.tapped, n); const k = (t * 1.2) % 1; ctx.save(); ctx.globalAlpha = 1 - k; Art.ell(ctx, p.x + 40, p.y + 60 + k * 20, 18, 18, '#ffffff'); ctx.restore(); }
    } else if (this.phase === 'quiz') {
      UI.text(ctx, 'Вопрос ' + this.q + ' из ' + this.total + ' · Слушай и найди слог  🔊', 640, 150, 26, '#cfe8da', 'center', false);
      Art.dragon(ctx, 640, 420, 0.5, { t, happy: this.dr.happy > 0 });
      this.opts.forEach((o, i) => { const p = this.optPos(i); if (this.hintI === i) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3; Art.ell(ctx, p.x, p.y, 100, 100, '#fff3a0'); ctx.restore(); } chip(o, p.x, p.y, 190, ['#ff7eb6', '#4fb7ff', '#ff9a3c', '#41d982'][i]); });
    } else if (this.phase === 'wquiz') {
      UI.text(ctx, 'Вопрос ' + this.q + ' из ' + this.total + ' · Прочитай и найди картинку', 640, 150, 26, '#cfe8da', 'center', false);
      if (this.target) UI.text(ctx, this.target.syl.join('-'), 640, 290, 96, '#ffffff', 'center', false);
      this.opts.forEach((o, i) => { const p = this.optPos(i); if (this.hintI === i) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3; Art.ell(ctx, p.x, p.y, 100, 100, '#fff3a0'); ctx.restore(); }
        Art.ell(ctx, p.x, p.y, 82, 82, 'rgba(255,255,255,0.92)'); Art.stroke(ctx, 4); this.emoji(ctx, o.pic, p.x, p.y + 4, 90); });
    } else {
      UI.text(ctx, 'Урок чтения окончен!', 640, 230, 56, '#ffd23f', 'center', false);
      for (let i = 0; i < this.total; i++) Art.roundStar(ctx, 640 - (this.total - 1) * 30 + i * 60, 330, 24, i < this.score ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#1a1030');
    }
    Art.dragon(ctx, 1170, 705, 0.4, { t, happy: this.dr.happy > 0, look: -1 });
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
