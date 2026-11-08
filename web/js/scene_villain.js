// Тёмная пещера Змея Шипуна: сцены похищения, поражения и финала, «Книга Шипуна» с главами
'use strict';
G.scenes.villain = {
  // args.kind: kidnap | defeat | replay; args.ch — номер главы (для defeat/replay)
  enter(args) {
    args = args || {};
    const v = V();
    this.kind = args.kind || 'kidnap';
    this.ch = args.ch != null ? args.ch : Villain.chapter();
    const c = this.ch != null ? VILLAIN_CHAPTERS[this.ch] : null;
    const sl = [];
    if (this.kind === 'kidnap') {
      this.caged = v.taken.slice();
      sl.push({ who: 'villain', text: v.line || Villain.sayLine(this.ch) });
      sl.push({ who: 'narrator', text: 'Шипун утащил ' + (this.caged.length > 1 ? 'обоих дракончиков' : Care.acc(this.caged[0])) + ' в Тёмную пещеру. ' + Villain.task(this.caged) });
    } else if (this.kind === 'defeat') {
      this.caged = [];
      sl.push({ who: 'villain', text: Villain.loseLine(this.ch) });
      if (c && c.finale) VILLAIN_FINALE.forEach(f => sl.push(Object.assign({ finale: true }, f)));
    } else { // replay из книги
      this.caged = c.who === 'both' ? ['dark', 'light'] : [c.who === 'light' ? 'light' : 'dark'];
      sl.push({ who: 'villain', text: c.say });
      sl.push({ who: 'villain', text: c.lose, free: true });
      if (c.finale) VILLAIN_FINALE.forEach(f => sl.push(Object.assign({ finale: true, free: true }, f)));
    }
    this.slides = sl; this.i = 0; this.st = 0;
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    Sound.hiss();
    this.say();
  },
  say() { const s = this.slides[this.i]; Voice.say(s.text); if (s.who === 'villain') Sound.hiss(); },
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
    Art.caveInside(ctx, t, { warm: finale });
    // Шипун свернулся кольцами слева
    const talk = s.who === 'villain' && this.st < 4 && Math.sin(t * 14) > 0;
    Art.serpentCoil(ctx, 380, 560, 1, t, { open: talk, friend: finale, angry: !free && !finale, flee: this.kind === 'defeat' && !(VILLAIN_CHAPTERS[this.ch] || {}).finale ? Math.min(1, this.st / 3) : 0 });
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
  bubble(ctx, s) {
    const villain = s.who === 'villain';
    const x = 640, y = 110, w = 1000;
    Art.rr(ctx, x - w / 2, y - 70, w, 150, 34); ctx.fillStyle = villain ? 'rgba(40,12,60,0.92)' : 'rgba(255,255,255,0.94)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = villain ? '#b88ae8' : '#8f6cf2'; ctx.stroke();
    if (villain) { ctx.beginPath(); ctx.moveTo(380, y + 78); ctx.lineTo(420, y + 78); ctx.lineTo(370, y + 140); ctx.closePath(); ctx.fillStyle = 'rgba(40,12,60,0.92)'; ctx.fill(); }
    UI.text(ctx, villain ? 'Змей Шипун' : '', x - w / 2 + 40, y - 42, 24, '#c8e05a', 'left', false);
    UI.wrap(ctx, Care.fill(s.text), x, y + (villain ? 16 : 4), w - 80, 30, villain ? '#ffffff' : '#3a1f6a', 38);
  },
};

// «Книга Шипуна»: все главы истории
G.scenes.story = {
  enter() {
    UI.homeButton(this);
    const v = V();
    this.cards = VILLAIN_CHAPTERS.map((c, i) => ({ c, i, open: v.seen.includes(i) }));
    Voice.say(v.seen.length ? 'Это книга Шипуна. Нажми на главу, чтобы вспомнить, как всё было.' : 'Это книга Шипуна. Главы появятся, когда ты спасёшь дракончиков.');
  },
  pos(i) { return [250 + (i % 4) * 260, 290 + Math.floor(i / 4) * 250]; },
  down(x, y) {
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k.i);
      if (Math.abs(x - cx) < 115 && Math.abs(y - cy) < 105) {
        if (!k.open) { Sound.boing(); Voice.say('Эта глава ещё впереди!'); return; }
        Voice.stop(); G.go('villain', { kind: 'replay', ch: k.i }); return;
      }
    }
  },
  draw(ctx) {
    const t = G.t, v = V();
    Art.caveInside(ctx, t, {});
    UI.text(ctx, 'Книга Шипуна', 640, 80, 54, '#ffe9a8', 'center', true);
    UI.text(ctx, v.friend ? 'Шипун стал другом и играет с дракончиками в прятки' : 'Спасено дракончиков: ' + v.rescues + ' раз', 640, 140, 26, '#d8c8ff', 'center', true);
    for (const k of this.cards) {
      const [cx, cy] = this.pos(k.i);
      Art.rr(ctx, cx - 115, cy - 105, 230, 210, 26); ctx.fillStyle = k.open ? 'rgba(255,246,224,0.95)' : 'rgba(40,20,70,0.75)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = k.open ? '#c89a4a' : '#6a4a9a'; ctx.stroke();
      UI.text(ctx, 'Глава ' + (k.i + 1), cx, cy - 72, 24, k.open ? '#8a5a2a' : '#9a8ac0', 'center', false);
      if (k.open) {
        const who = k.c.who === 'both' ? ['dark', 'light'] : [k.c.who === 'light' ? 'light' : 'dark'];
        who.forEach((id, j) => Art.dragon(ctx, cx + (who.length > 1 ? (j ? 40 : -40) : 0), cy + 50, 0.24, { kind: id, t: t + j }));
        UI.wrap(ctx, k.c.title, cx, cy + 82, 210, 22, '#5a3a8a', 24);
      } else { Art.icon(ctx, 'lock', cx, cy + 10, 1.2, t); }
    }
  },
};
