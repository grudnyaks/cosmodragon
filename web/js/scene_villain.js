// Тёмная пещера Змея Шипуна: сцены похищения, поражения и финала, «Книга Шипуна» с главами
'use strict';
G.scenes.villain = {
  // args.kind: kidnap | defeat | replay; args.ch — номер главы (для defeat/replay)
  enter(args) {
    args = args || {};
    const v = V();
    this.kind = args.kind || 'kidnap';
    this.ch = args.ch != null ? args.ch : Villain.chapter();
    const c = this.ch != null ? STORY[this.ch] : null;
    this.comet = c ? c.villain === 'comet' : (this.kind === 'kidnap' ? v.villain === 'comet' : args.villain === 'comet');
    const me = this.comet ? 'comet' : 'villain', FIN = this.comet ? COMET_FINALE : VILLAIN_FINALE;
    const sl = [];
    const who = (c) => c.who === 'both' ? ['dark', 'light'] : [c.who === 'light' ? 'light' : 'dark'];
    if (this.kind === 'kidnap') {
      this.caged = v.taken.slice();
      sl.push({ who: me, text: v.line || Villain.sayLine(this.ch) });
      if (this.comet && c && c.help) sl.push({ who: 'snake', text: Villain.adapt(c.help) });
      const n = this.caged.length > 1 ? 'обоих дракончиков' : Care.acc(this.caged[0]);
      sl.push({ who: 'narrator', text: (this.comet ? 'Комета Шкода умчала ' + n + ' к звёздам. ' : 'Шипун утащил ' + n + ' в Тёмную пещеру. ') + Villain.task(this.caged) });
    } else if (this.kind === 'defeat') {
      this.caged = [];
      sl.push({ who: me, text: Villain.loseLine(this.ch, this.comet ? 'comet' : 'snake') });
      if (c && c.finale) FIN.forEach(f => sl.push(Object.assign({ finale: true }, f)));
    } else { // replay из книги
      this.caged = who(c);
      sl.push({ who: me, text: c.say });
      if (c.help) sl.push({ who: 'snake', text: c.help });
      sl.push({ who: me, text: c.lose, free: true });
      if (c.finale) FIN.forEach(f => sl.push(Object.assign({ finale: true, free: true }, f)));
    }
    this.slides = sl; this.i = 0; this.st = 0;
    this.freeIds = this.kind === 'replay' ? ['dark', 'light'] : PD().map(d => d.id);
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    if (this.comet) Sound.whoosh(); else Sound.hiss();
    this.say();
  },
  say() { const s = this.slides[this.i]; Voice.say(s.text); if (s.who === 'villain' || s.who === 'snake') Sound.hiss(); if (s.who === 'comet') Sound.whoosh(); },
  next() {
    this.i++; this.st = 0;
    if (this.i >= this.slides.length) { Voice.stop(); G.go(this.kind === 'replay' ? 'story' : 'home'); return; }
    Sound.whoosh(); this.say();
  },
  down() { if (this.st > 0.8) this.next(); },
  update(dt) { this.st += dt; },
  draw(ctx) {
    const t = G.t, s = this.slides[this.i] || this.slides[this.slides.length - 1];
    const finale = !!s.finale, free = this.kind === 'defeat' || s.free;
    const talk = this.st < 4 && Math.sin(t * 14) > 0;
    if (this.comet) { this.drawComet(ctx, t, s, finale, free, talk); this.bubble(ctx, s); return; }
    Art.caveInside(ctx, t, { warm: finale });
    // Шипун свернулся кольцами слева
    Art.serpentCoil(ctx, 380, 560, 1, t, { open: talk && s.who === 'villain', friend: finale, angry: !free && !finale, flee: this.kind === 'defeat' && !(STORY[this.ch] || {}).finale ? Math.min(1, this.st / 3) : 0 });
    // клетка с дракончиками справа
    const cx = 930, cy = 470;
    if (!free) {
      this.caged.forEach((id, i) => Art.dragon(ctx, cx + (this.caged.length > 1 ? (i ? 80 : -80) : 0), cy + 150, 0.5, { kind: id, t: t + i, tilt: 0.1, look: -1, blink: (t + i) % 3.3 < 0.13 ? 1 : 0 }));
      Art.cage(ctx, cx, cy, 1, t, 0);
    } else {
      Art.cage(ctx, cx + 120, cy, 0.8, t, 1);
      this.freeIds.forEach((id, i) => Art.dragon(ctx, 820 + i * 170, 640, 0.55, { kind: id, t: t + i, happy: true, look: -1 }));
      Art.astronaut(ctx, finale ? 620 : 700, 640, 0.95, { t, anim: finale ? 'wave' : 'cheer', at: t, holding: finale ? 0 : null });
    }
    // реплика
    this.bubble(ctx, s);
  },
  // сцена с кометой: звёздное небо, Шкода с пузырём, добрый Шипун внизу слева
  drawComet(ctx, t, s, finale, free, talk) {
    Art.starSky(ctx, t, { warm: finale });
    for (let i = 0; i < 8; i++) Art.cloud(ctx, G.view.x0 + i * 200, 700, 1.4);
    const flee = this.kind === 'defeat' && !(STORY[this.ch] || {}).finale ? Math.min(1, this.st / 3) : 0;
    const cx = 900 + flee * 700 + Math.sin(t * 1.3) * 30, cy = 330 - flee * 200 + Math.sin(t * 2.1) * 20;
    if (!free) {
      const bx = cx - 190, by = cy + 90;
      this.caged.forEach((id, i) => Art.dragon(ctx, bx + (this.caged.length > 1 ? (i ? 40 : -40) : 0), by + 55, 0.32, { kind: id, t: t + i, flying: true, look: 1, mouth: 0.3 }));
      Art.bubble(ctx, bx, by, this.caged.length > 1 ? 105 : 82, t);
    } else {
      this.freeIds.forEach((id, i) => Art.dragon(ctx, 760 + i * 170, 640, 0.55, { kind: id, t: t + i, happy: true, look: 1 }));
      Art.astronaut(ctx, finale ? 600 : 620, 645, 0.95, { t, anim: finale ? 'wave' : 'cheer', at: t });
    }
    Art.comet(ctx, cx, cy, 0.95, t, { dir: Math.PI * 0.85 + Math.sin(t) * 0.1, talk: talk && s.who === 'comet', mood: finale ? 'happy' : free ? 'sad' : 'cheeky' });
    Art.serpentCoil(ctx, 240, 640, 0.6, t, { open: talk && s.who === 'snake', friend: true });
  },
  bubble(ctx, s) {
    const villain = s.who !== 'narrator', comet = s.who === 'comet', snake = s.who === 'snake' || (s.who === 'villain' && this.comet);
    const x = 640, y = 110, w = 1000, tx = comet ? 860 : snake && this.comet ? 260 : 380;
    const bg = comet ? 'rgba(90,20,70,0.92)' : 'rgba(40,12,60,0.92)';
    Art.rr(ctx, x - w / 2, y - 70, w, 150, 34); ctx.fillStyle = villain ? bg : 'rgba(255,255,255,0.94)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = comet ? '#ff9ad5' : villain ? '#b88ae8' : '#8f6cf2'; ctx.stroke();
    if (villain) { ctx.beginPath(); ctx.moveTo(tx, y + 78); ctx.lineTo(tx + 40, y + 78); ctx.lineTo(tx - 10, y + 140); ctx.closePath(); ctx.fillStyle = bg; ctx.fill(); }
    UI.text(ctx, comet ? 'Комета Шкода' : villain ? 'Змей Шипун' : '', x - w / 2 + 40, y - 42, 24, comet ? '#ffd23f' : '#c8e05a', 'left', false);
    UI.wrap(ctx, Care.fill(s.text), x, y + (villain ? 16 : 4), w - 80, 30, villain ? '#ffffff' : '#3a1f6a', 38);
  },
};

// «Книга Шипуна»: три истории — Змей Шипун (7 глав), комета Шкода (5), воришка в чёрном шлеме (5)
G.scenes.story = {
  enter() {
    UI.homeButton(this);
    const v = V(), th = T();
    this.cards = STORY.map((c, i) => ({ c, i, row: c.villain === 'comet' ? 1 : 0, j: c.villain === 'comet' ? i - VILLAIN_CHAPTERS.length : i, open: v.seen.includes(i), kind: c.villain }))
      .concat(THIEF_CHAPTERS.map((c, j) => ({ c, i: j, row: 2, j, open: th.seen.includes(j), kind: 'thief' })));
    Voice.say(v.seen.length ? 'Это книга Шипуна. Нажми на главу, чтобы вспомнить, как всё было.' : 'Это книга Шипуна. Главы появятся, когда ты спасёшь дракончиков.');
  },
  pos(k) { const n = k.row === 0 ? VILLAIN_CHAPTERS.length : 5; return [640 + (k.j - (n - 1) / 2) * 172, 250 + k.row * 186]; },
  down(x, y) {
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k);
      if (Math.abs(x - cx) < 80 && Math.abs(y - cy) < 74) {
        if (!k.open) { Sound.boing(); Voice.say('Эта глава ещё впереди!'); return; }
        Voice.stop();
        if (k.kind === 'thief') { if (k.c.finale) G.go('unmask'); else Voice.say(k.c.title + '. ' + Thief.fill(k.c.say) + ' ' + k.c.clue); return; }
        G.go('villain', { kind: 'replay', ch: k.i }); return;
      }
    }
  },
  draw(ctx) {
    const t = G.t, v = V();
    Art.caveInside(ctx, t, { warm: v.friend });
    UI.text(ctx, 'Книга Шипуна', 640, 60, 46, '#ffe9a8', 'center', true);
    UI.text(ctx, 'История первая: Змей Шипун', 80, 150, 22, '#c8e05a', 'left', true);
    UI.text(ctx, 'История вторая: комета Шкода', 80, 336, 22, '#ffb0d8', 'left', true);
    UI.text(ctx, 'История третья: воришка в чёрном шлеме', 80, 522, 22, '#fff3a0', 'left', true);
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k), col = { snake: ['rgba(255,246,224,0.95)', '#c89a4a'], comet: ['rgba(255,236,246,0.95)', '#e07ab0'], thief: ['rgba(232,232,255,0.95)', '#6a6ad8'] }[k.kind];
      Art.rr(ctx, cx - 80, cy - 74, 160, 148, 20); ctx.fillStyle = k.open ? col[0] : 'rgba(40,20,70,0.75)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = k.open ? col[1] : '#6a4a9a'; ctx.stroke();
      UI.text(ctx, 'Глава ' + (k.j + 1), cx, cy - 48, 20, k.open ? '#8a5a2a' : '#9a8ac0', 'center', false);
      if (k.open) {
        if (k.kind === 'thief') Art.astronaut(ctx, cx, cy + 34, 0.36, { t, dark: !k.c.finale, tail: k.j >= 2, eyes: true });
        else {
          const who = k.c.who === 'both' ? ['dark', 'light'] : [k.c.who === 'light' ? 'light' : 'dark'];
          who.forEach((id, j) => Art.dragon(ctx, cx + (who.length > 1 ? (j ? 30 : -30) : 0), cy + 30, 0.16, { kind: id, t: t + j }));
          Art.icon(ctx, k.kind === 'comet' ? 'comet' : 'snake', cx + 54, cy - 24, 0.42, t);
        }
        UI.wrap(ctx, k.c.title, cx, cy + 54, 150, 19, '#5a3a8a', 19);
      } else { Art.icon(ctx, 'lock', cx, cy + 8, 0.9, t); }
    }
  },
};
