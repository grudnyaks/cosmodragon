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
      if (this.comet && c && c.help) sl.push({ who: 'snake', text: c.help });
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
      DRAGONS.forEach((d, i) => Art.dragon(ctx, 820 + i * 170, 640, 0.55, { kind: d.id, t: t + i, happy: true, look: -1 }));
      Art.astronaut(ctx, finale ? 620 : 700, 640, 0.95, { t, anim: finale ? 'wave' : 'cheer', at: t, holding: finale ? 0 : null });
    }
    // реплика
    this.bubble(ctx, s);
  },
  // сцена с кометой: звёздное небо, Шкода с пузырём, добрый Шипун внизу слева
  drawComet(ctx, t, s, finale, free, talk) {
    Art.sky(ctx, t, { warm: finale });
    for (let i = 0; i < 8; i++) Art.cloud(ctx, G.view.x0 + i * 200, 700, 1.4);
    const flee = this.kind === 'defeat' && !(STORY[this.ch] || {}).finale ? Math.min(1, this.st / 3) : 0;
    const cx = 900 + flee * 700 + Math.sin(t * 1.3) * 30, cy = 330 - flee * 200 + Math.sin(t * 2.1) * 20;
    if (!free) {
      const bx = cx - 190, by = cy + 90;
      this.caged.forEach((id, i) => Art.dragon(ctx, bx + (this.caged.length > 1 ? (i ? 40 : -40) : 0), by + 55, 0.32, { kind: id, t: t + i, flying: true, look: 1, mouth: 0.3 }));
      Art.bubble(ctx, bx, by, this.caged.length > 1 ? 105 : 82, t);
    } else {
      DRAGONS.forEach((d, i) => Art.dragon(ctx, 760 + i * 170, 640, 0.55, { kind: d.id, t: t + i, happy: true, look: 1 }));
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

// «Книга Шипуна»: все главы обеих историй (7 про Шипуна, 5 про Шкоду)
G.scenes.story = {
  enter() {
    UI.homeButton(this);
    const v = V();
    this.cards = STORY.map((c, i) => ({ c, i, open: v.seen.includes(i) }));
    Voice.say(v.seen.length ? 'Это книга Шипуна. Нажми на главу, чтобы вспомнить, как всё было.' : 'Это книга Шипуна. Главы появятся, когда ты спасёшь дракончиков.');
  },
  pos(i) { const n1 = VILLAIN_CHAPTERS.length, row = i < n1 ? 0 : 1, j = row ? i - n1 : i, n = row ? COMET_CHAPTERS.length : n1; return [640 + (j - (n - 1) / 2) * 174, 300 + row * 262]; },
  down(x, y) {
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k.i);
      if (Math.abs(x - cx) < 82 && Math.abs(y - cy) < 105) {
        if (!k.open) { Sound.boing(); Voice.say('Эта глава ещё впереди!'); return; }
        Voice.stop(); G.go('villain', { kind: 'replay', ch: k.i }); return;
      }
    }
  },
  draw(ctx) {
    const t = G.t, v = V();
    Art.caveInside(ctx, t, { warm: v.friend });
    UI.text(ctx, 'Книга Шипуна', 640, 70, 52, '#ffe9a8', 'center', true);
    const sub = v.friend2 ? 'Шипун и Шкода стали друзьями и играют с дракончиками' : v.friend ? 'Шипун стал другом. Но прилетела комета-хулиганка…' : 'Спасено дракончиков: ' + v.rescues + ' раз';
    UI.text(ctx, sub, 640, 124, 26, '#d8c8ff', 'center', true);
    UI.text(ctx, 'История первая: Змей Шипун', 100, 178, 22, '#c8e05a', 'left', true);
    UI.text(ctx, 'История вторая: комета Шкода', 270, 440, 22, '#ffb0d8', 'left', true);
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k.i), comet = k.c.villain === 'comet';
      Art.rr(ctx, cx - 82, cy - 105, 164, 210, 22); ctx.fillStyle = k.open ? (comet ? 'rgba(255,236,246,0.95)' : 'rgba(255,246,224,0.95)') : 'rgba(40,20,70,0.75)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = k.open ? (comet ? '#e07ab0' : '#c89a4a') : '#6a4a9a'; ctx.stroke();
      UI.text(ctx, 'Глава ' + (k.i + 1), cx, cy - 74, 22, k.open ? '#8a5a2a' : '#9a8ac0', 'center', false);
      if (k.open) {
        const who = k.c.who === 'both' ? ['dark', 'light'] : [k.c.who === 'light' ? 'light' : 'dark'];
        who.forEach((id, j) => Art.dragon(ctx, cx + (who.length > 1 ? (j ? 36 : -36) : 0), cy + 46, 0.21, { kind: id, t: t + j }));
        Art.icon(ctx, comet ? 'comet' : 'snake', cx + 54, cy - 40, 0.5, t);
        UI.wrap(ctx, k.c.title, cx, cy + 80, 150, 21, '#5a3a8a', 21);
      } else { Art.icon(ctx, 'lock', cx, cy + 10, 1.1, t); }
    }
  },
};
