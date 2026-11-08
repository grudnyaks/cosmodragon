// Укладывание: укрыть одеялом, выключить лампу, колыбельная. Вечером — «спокойной ночи» до утра.
'use strict';
function nightRoom(ctx, t, dim) {
  const v = G.view;
  const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, '#2a2a6a'); g.addColorStop(1, '#4a3a7a');
  ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  // окно с луной
  Art.rr(ctx, 120, 90, 260, 220, 20); ctx.fillStyle = '#0e0a30'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#8a6a4a'; ctx.stroke();
  ctx.save(); Art.rr(ctx, 120, 90, 260, 220, 20); ctx.clip();
  for (let i = 0; i < 14; i++) { ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.4; Art.ell(ctx, 140 + (i * 53) % 230, 110 + (i * 37) % 180, 2.5, 2.5, '#fff'); }
  ctx.globalAlpha = 1; Art.icon(ctx, 'moon', 300, 160, 1.4, t);
  ctx.restore();
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(244, 90, 12, 220); ctx.fillRect(120, 194, 260, 12);
  ctx.fillStyle = '#3a2a5a'; ctx.fillRect(v.x0, 560, v.x1 - v.x0, v.y1 - 560);
}
function zzz(ctx, x, y, t) {
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.5 + i / 3) % 1);
    ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI);
    UI.text(ctx, 'z', x + k * 50 + Math.sin(k * 6) * 8, y - k * 90, 26 + k * 18, '#ffffff', 'center', true);
    ctx.restore();
  }
}
function lamp(ctx, x, y, on, t) {
  if (on) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = Art.rg(ctx, x, y - 130, 260, '#fff2b0', 'rgba(255,240,180,0)', 0, 0); Art.ell(ctx, x, y - 130, 260, 260); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 6, y - 130, 12, 130); Art.ell(ctx, x, y, 50, 12, '#6a4a3a');
  ctx.beginPath(); ctx.moveTo(x - 60, y - 120); ctx.lineTo(x - 36, y - 200); ctx.lineTo(x + 36, y - 200); ctx.lineTo(x + 60, y - 120); ctx.closePath();
  ctx.fillStyle = on ? '#ffe9a0' : '#8a7aa8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a4a3a'; ctx.stroke();
}

G.scenes.sleep = {
  // mode: nap (днём, один дракончик) | bedtime (вечером, оба)
  enter(args) {
    args = args || {};
    this.mode = args.mode || 'nap';
    this.ids = this.mode === 'bedtime' ? PD().map(d => d.id).filter(id => !isTaken(id)) : [args.id || buddy()];
    if (!this.ids.length) this.ids = [buddy()];
    UI.homeButton(this);
    this.step = 'blanket'; this.k = 0; this.lampOn = true; this.st = 0; this.sleepT = 0;
    const who = this.ids.length > 1 ? 'Дракончики хотят спать.' : Care.name(this.ids[0]) + ' хочет спать.';
    Voice.say(who + ' Потяни одеяло вверх и укрой ' + (this.ids.length > 1 ? 'их!' : 'его!'));
  },
  down(x, y) {
    if (this.step === 'blanket') this.dragging = y > 330;
    else if (this.step === 'lamp' && Math.abs(x - 1100) < 90 && y > 380 && y < 620) this.lampOff();
    else if (this.step === 'sleep' && x > 400 && x < 1000) Voice.say('Тс-с-с! Дракончики засыпают.');
  },
  move(x, y) {
    if (this.step !== 'blanket' || !this.dragging) return;
    this.k = M.clamp((640 - y) / 240, this.k, 1);
    if (this.k > 0.85) {
      this.k = 1; this.step = 'lamp'; Sound.whoosh();
      Voice.say('Тепло и уютно! Теперь выключи лампу.');
    }
  },
  up() { this.dragging = false; },
  lampOff() {
    this.lampOn = false; this.step = 'sleep'; Sound.snap();
    Sound.stopMusic(); setTimeout(() => Sound.lullaby(), 300);
    Voice.say(this.mode === 'bedtime' ? 'Спокойной ночи, дракончики! Сладких снов!' : 'Баю-бай! Пусть дракончик немножко поспит.');
  },
  update(dt) {
    this.st += dt;
    if (this.step === 'sleep') {
      this.sleepT += dt;
      if (this.sleepT > 15 && !this.done) {
        this.done = true;
        if (this.mode === 'bedtime') { Care.goodnight(); G.go('sleeping'); return; }
        for (const id of this.ids) { Care.add(id, 'energy', 100); Care.add(id, 'fun', 5); }
        stat('nap'); this.step = 'wake'; this.lampOn = true; Sound.chime(); if (S.data.music) Sound.startMusic();
        Voice.say(Care.name(this.ids[0]) + ' выспался и полон сил!');
        G.burst(640, 420, { kind: 'star', n: 16, speed: 240, size: 14 });
        setTimeout(() => Sound.purr(1.4, { dragon: this.ids[0] }), 600);
        G.wait(4, () => { if (G.scene === this) G.go('home'); });
      }
    }
  },
  draw(ctx) {
    const t = G.t, asleep = this.step === 'sleep';
    nightRoom(ctx, t);
    lamp(ctx, 1100, 600, this.lampOn, t);
    Art.bed(ctx, 640, 600, 1, 0);
    const n = this.ids.length;
    this.ids.forEach((id, i) => {
      const x = n > 1 ? 560 + i * 170 : 640;
      Art.dragon(ctx, x, 600, 0.62, { kind: id, t: t + i, sleep: asleep, blink: this.step === 'wake' ? 0 : 0.55, happy: this.step === 'wake', tilt: asleep ? (i ? -0.15 : 0.15) : 0, mouth: !asleep && this.step !== 'wake' && (t + i * 2) % 5 < 0.8 ? 0.8 : 0 });
      if (asleep) zzz(ctx, x + 50, 380, t + i * 0.7);
    });
    Art.blanket(ctx, 640, 620, 1.05, this.k);
    if (this.step === 'blanket' && this.k < 0.1) {
      const a = (t % 1.4) / 1.4; ctx.save(); ctx.globalAlpha = 1 - a;
      Art.icon(ctx, 'next', 640, 660 - a * 120, 0.9, t); ctx.restore();
      Art.rr(ctx, 480, 625, 320, 40, 20); ctx.fillStyle = '#ff9ad5'; ctx.fill();
    }
    if (!this.lampOn) { ctx.save(); ctx.fillStyle = 'rgba(5,5,30,0.55)'; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0); ctx.restore();
      for (let i = 0; i < 6; i++) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.4; Art.roundStar(ctx, 500 + i * 60, 200 + Math.sin(t + i) * 20, 8, '#fff6c0'); ctx.restore(); }
    }
    if (this.step === 'lamp') { const p = 1 + Math.sin(t * 6) * 0.08; ctx.save(); ctx.translate(1100, 300); ctx.scale(p, p); Art.icon(ctx, 'next', 0, 0, 0.8, t); ctx.restore(); }
  },
};

// Ночь: дракончики спят до утра. Взрослый может разбудить их после «взрослого» вопроса.
G.scenes.sleeping = {
  enter() {
    this.gate = null;
    this.lockBtn = UI.add(this, { x: G.view.x1 - 70, y: G.view.y1 - 70, r: 38, icon: 'lock', color: '#5a5a7a', onTap: () => this.openGate() });
    this.gateBtns = [0, 1, 2].map(i => UI.add(this, { x: 440 + i * 200, y: 420, w: 170, h: 80, label: '', fontSize: 34, color: '#8f6cf2', hidden: true, onTap: () => this.answer(i) }));
    Sound.stopMusic();
    Voice.say('Дракончики спят. Приходи утром!');
  },
  openGate() {
    const a = M.ri(6, 9), b = M.ri(5, 9), r = a + b;
    this.gate = { a, b, r, opts: M.shuffle([r, r + M.pick([1, 2]), r - M.pick([1, 2, 3])]) };
    this.gateBtns.forEach((btn, i) => { btn.hidden = false; btn.label = String(this.gate.opts[i]); });
  },
  answer(i) {
    if (this.gate.opts[i] === this.gate.r) { Care.wake(); if (S.data.music) Sound.startMusic(); G.go('home'); }
    else { this.gate = null; this.gateBtns.forEach(b => { b.hidden = true; }); Sound.bump(); }
  },
  down(x, y) { if (!this.gate && y > 300) { Voice.say('Тс-с-с! Дракончики спят. Приходи утром!'); } },
  update() {
    if (!Care.asleep() && !this.woke) {
      this.woke = true; Sound.chime(); if (S.data.music) Sound.startMusic();
      Voice.say('Доброе утро! Дракончики проснулись!');
      G.wait(2.5, () => G.go('home'));
    }
  },
  draw(ctx) {
    const t = G.t;
    nightRoom(ctx, t);
    Art.bed(ctx, 640, 600, 1, 0);
    const ids = PD().map(d => d.id).filter(id => !isTaken(id));
    ids.forEach((id, i) => { const x = ids.length > 1 ? 560 + i * 170 : 640; Art.dragon(ctx, x, 600, 0.62, { kind: id, t: t + i, sleep: !this.woke, happy: this.woke, tilt: this.woke ? 0 : (i ? -0.15 : 0.15) }); if (!this.woke) zzz(ctx, x + 50, 380, t + i * 0.7); });
    Art.blanket(ctx, 640, 620, 1.05, this.woke ? 0.3 : 1);
    if (!this.woke) { ctx.save(); ctx.fillStyle = 'rgba(5,5,30,0.45)'; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0); ctx.restore(); }
    UI.text(ctx, this.woke ? 'Доброе утро!' : 'Дракончики спят. Приходи утром!', 760, 120, 40, '#ffffff', 'center', true);
    if (this.gate) {
      Art.rr(ctx, 330, 230, 620, 300, 30); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      UI.text(ctx, 'Для взрослых: сколько будет ' + this.gate.a + ' + ' + this.gate.b + '?', 640, 300, 30, '#3a1f6a', 'center', false);
    }
  },
};
