// Погоня: ловим комету Шкоду или воришку в чёрном шлеме (механики tap / sparks / catch)
'use strict';
G.scenes.comet = {
  enter(args) {
    const v = V();
    this.who = (args && args.who) || 'comet';
    this.thief = this.who === 'thief';
    this.mode = this.thief ? (args.mode || 'tap') : COMET_MODES.includes(v.mode) ? v.mode : 'tap';
    this.ids = this.thief ? [] : v.taken.length ? v.taken.slice() : ['dark'];
    this.d = S.data.diff; this.c = Villain.chapter();
    this.fin = this.thief ? !!args.finale : this.c != null && STORY[this.c].finale;
    this.lines = this.thief ? ['Хи-хи! Не догонишь!', 'Ой! Чуть не поймал!', 'Хи-хи-хи! Я быстрый!', 'Ай! Не щекочи!'] : ['Ой! Щекотно!', 'Ж-ж-жух! Не догонишь!', 'Ай! Поймал!', 'Ха-ха! Ещё разок?'];
    this.won = false; this.free = { k: 0 }; this.pop = 0;
    this.cm = { x: 640, y: 260, a: 0, dir: 0, stun: 0, speed: 1, tail: 1, mood: 'cheeky', talk: 0 };
    this.hist = [];
    this.hits = 0; this.items = []; this.spawnT = 0.8; this.cloud = { x: 640 }; this.drag = false;
    UI.homeButton(this);
    if (this.thief) Sound.giggle(); else Sound.whoosh();
    this['init_' + this.mode]();
  },
  // ---------- общее ----------
  win(text) {
    if (this.won) return;
    this.won = true;
    if (this.thief) { Thief.caught(this, text); return; }
    const ch = Villain.rescued(); stat('cometCaught');
    Sound.win(); Sound.magic();
    Voice.say(text + ' Дракончики снова дома!');
    const c = this.cm; c.mood = 'sad'; c.stun = 0;
    G.tween(c, { x: 640, y: 210, tail: 0.3 }, 1.2, G.ease.inOutQuad);
    G.wait(1.3, () => { this.pop = 1; Sound.pop(1.5); G.burst(this.bx, this.by, { kind: 'star', n: 24, speed: 300 }); });
    G.tween(this.free, { k: 1 }, 1.6, G.ease.inOutQuad, () => { Sound.purr(2, { dragon: this.ids[0] }); G.burst(760, 520, { kind: 'heart', n: 20, up: true, g: -60, speed: 220 }); }, 1.4);
    for (let i = 0; i < 6; i++) setTimeout(() => G.burst(M.rnd(200, 1100), M.rnd(120, 400), { kind: 'confetti', n: 30, speed: 380 }), 1000 + i * 300);
    setTimeout(() => { if (G.scene === this) G.go('villain', { kind: 'defeat', ch, villain: 'comet' }); }, 5600);
  },
  // комета летает по восьмёрке; speed — множитель
  fly(dt, k) {
    const c = this.cm;
    if (this.won) return;
    const sp = c.stun > 0 ? 0.15 : c.speed;
    c.stun = Math.max(0, c.stun - dt);
    c.a += dt * sp * (k || 1);
    const nx = 640 + 470 * Math.sin(c.a), ny = 290 + 170 * Math.sin(c.a * 1.7 + 1);
    const vx = nx - c.x, vy = ny - c.y;
    if (Math.abs(vx) + Math.abs(vy) > 0.5) c.dir = Math.atan2(vy, vx);
    c.x = nx; c.y = ny;
    this.hist.push([c.x, c.y]); if (this.hist.length > 26) this.hist.shift();
  },
  hitComet(x, y) { return Math.hypot(x - this.cm.x, y - this.cm.y) < 115; },
  down(x, y) { if (this.won) return; const f = this['down_' + this.mode]; f && f.call(this, x, y); },
  move(x, y) { const f = this['move_' + this.mode]; f && f.call(this, x, y); },
  up(x, y) { this.drag = false; },
  update(dt) {
    this.cm.talk = Math.max(0, this.cm.talk - dt);
    const f = this['update_' + this.mode]; f && f.call(this, dt);
  },
  draw(ctx) {
    const t = G.t, c = this.cm;
    if (this.thief) { World.bg(ctx, t, { noDecor: true, bright: true }); const v = G.view; ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#140a30'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
    else {
      Art.starSky(ctx, t, { warm: this.won });
      // пол из облаков, куда возвращаются дракончики
      for (let i = 0; i < 8; i++) Art.cloud(ctx, G.view.x0 + i * 200, 700, 1.4);
    }
    const f = this['draw_' + this.mode]; f && f.call(this, ctx, t);
    // пузырь с дракончиками — летит следом за кометой
    const h = this.hist[0] || [c.x, c.y];
    this.bx = this.won ? M.lerp(h[0], 640, 0.5) : h[0]; this.by = this.won ? 380 : h[1] + 40;
    if (this.thief) this.drawThief(ctx, t);
    else {
      this.drawDragons(ctx, t);
      Art.comet(ctx, c.x, c.y, this.fin ? 1.05 : 0.9, t, { dir: c.dir, tail: c.tail, mood: c.stun > 0 ? 'sad' : c.mood, talk: c.talk > 0, blink: c.stun > 0 ? 1 : undefined });
    }
    if (c.stun > 0) for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; Art.roundStar(ctx, c.x + Math.cos(a) * 70, c.y - 80 + Math.sin(a) * 16, 9, '#fff6b0'); }
  },
  // воришка на реактивном ранце с мешком вкусняшек
  drawThief(ctx, t) {
    const c = this.cm, k = this.free.k;
    if (!this.won || k < 1) {
      ctx.save(); ctx.translate(c.x, c.y + 60); ctx.rotate(this.won ? 0 : Math.cos(c.dir) * 0.25);
      Art.astronaut(ctx, 0, 0, 0.85, { t, dark: true, jet: this.won ? 0.2 : 1, tail: T().ch >= 2, eyes: true, anim: c.stun > 0 ? 'spin' : 'idle', at: t, flip: Math.cos(c.dir) < 0 });
      ctx.restore();
      if (!this.won) Art.sack(ctx, c.x + (Math.cos(c.dir) < 0 ? 46 : -46), c.y + 40, 0.75, t);
    }
  },
  drawDragons(ctx, t) {
    const n = this.ids.length, k = this.free.k;
    if (k >= 1) {
      this.ids.forEach((id, i) => Art.dragon(ctx, 760 + i * 190, 640, 0.7, { kind: id, t: t + i, happy: true }));
      Art.astronaut(ctx, 560, 650, 1.05, { t, anim: 'cheer', at: t });
      return;
    }
    this.ids.forEach((id, i) => {
      const off = n > 1 ? (i ? 1 : -1) * 38 : 0;
      const x = M.lerp(this.bx + off, 760 + i * 190, k), y = M.lerp(this.by + 50, 640, k), s = M.lerp(0.3, 0.7, k);
      Art.dragon(ctx, x, y, s, { kind: id, t: t + i, happy: this.won, flying: true, look: 1, tilt: this.won ? 0 : 0.15 });
    });
    if (!this.pop) Art.bubble(ctx, this.bx, this.by, n > 1 ? 105 : 80, t);
  },
  drawTop(ctx) { if (this.thief) UI.drawCounterTopRight(ctx); },
  bar(ctx, k, label, color) { UI.progress(ctx, 380, 26, 520, 44, k, color); UI.text(ctx, label, 640, 49, 26, '#fff', 'center', true); },

  // ---------- tap: догони и нажми на комету ----------
  init_tap() {
    this.need = (this.fin ? 6 : 4) + Math.floor(this.d / 2);
    this.cm.speed = 0.75 + this.d * 0.06;
    Voice.say(this.thief ? 'Воришка улетает на реактивном ранце! Нажимай на него, чтобы он устал и отдал вкусняшки!' : 'Комета Шкода летает очень быстро! Нажимай на неё, чтобы она устала и отпустила ' + (this.ids.length > 1 ? 'дракончиков' : Care.acc(this.ids[0])) + '!');
  },
  update_tap(dt) { this.fly(dt); },
  down_tap(x, y) {
    if (!this.hitComet(x, y) || this.cm.stun > 0) return;
    this.hits++; Sound.boing(); Sound.pop(1.3);
    G.burst(this.cm.x, this.cm.y, { kind: 'star', n: 14, speed: 260 });
    this.cm.stun = 0.9; this.cm.speed += 0.1;
    if (this.hits >= this.need) { this.win(this.thief ? 'Ура! Воришка устал и остановился!' : 'Ура! Комета устала и остановилась!'); return; }
    if (this.hits === 1 || Math.random() < 0.4) { this.cm.talk = 1.4; Voice.say(M.pick(this.lines)); if (this.thief) Sound.giggle(); }
  },
  draw_tap(ctx) { if (!this.won) this.bar(ctx, this.hits / this.need, this.thief ? 'Воришка устаёт' : 'Комета устаёт', '#ffb23a'); },

  // ---------- sparks: собери искорки из хвоста ----------
  init_sparks() {
    this.need = (this.fin ? 15 : 10) + this.d;
    this.cm.speed = 0.45;
    Voice.say(this.thief ? 'Из дырявого мешка воришки сыплются вкусняшки! Собирай их, и мешок станет пустым!' : 'Из хвоста кометы сыплются искорки. Нажимай на искорки! Без них Шкода не сможет летать!');
  },
  update_sparks(dt) {
    this.fly(dt);
    if (this.won) return;
    const k = this.hits / this.need;
    this.cm.tail = 1.2 - k * 0.9; this.cm.speed = 0.45 - k * 0.2;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.items.filter(i => !i.got).length < 5) {
      const back = this.cm.dir + Math.PI;
      this.items.push({ x: this.cm.x + Math.cos(back) * 90, y: this.cm.y + Math.sin(back) * 90, vy: M.rnd(80, 130) + this.d * 8, ph: M.rnd(0, 6), got: false, c: M.pick(['#fff6b0', '#ffd0ec', '#bfefff']) });
      this.spawnT = M.rnd(0.45, 0.8);
    }
    for (const it of this.items) if (!it.got) { it.y += it.vy * dt; it.x += Math.sin(G.t * 3 + it.ph) * 30 * dt; }
    this.items = this.items.filter(it => it.got || it.y < 680);
  },
  down_sparks(x, y) {
    for (const it of this.items) {
      if (it.got || Math.hypot(x - it.x, y - it.y) > 65) continue;
      it.got = true; Sound.pop(1.4 + Math.random() * 0.4);
      G.tween(it, { x: 380 + 520 * Math.min(1, (this.hits + 1) / this.need), y: 48 }, 0.5, G.ease.inOutQuad, () => {
        this.items.splice(this.items.indexOf(it), 1); this.hits++;
        if (this.hits >= this.need) this.win(this.thief ? 'Ура! Мешок воришки опустел!' : 'Ура! Все искорки собраны! Комета не может улететь!');
        else if (this.hits === Math.floor(this.need / 2)) { this.cm.talk = 1.5; Voice.say(this.thief ? 'Ой-ой! Мой мешок пустеет!' : 'Ой-ой! Мой хвостик становится короче!'); }
      });
      return;
    }
  },
  draw_sparks(ctx, t) {
    for (const it of this.items) {
      ctx.save(); ctx.globalAlpha = 0.4; Art.ell(ctx, it.x, it.y, 34, 34, it.c); ctx.restore();
      if (this.thief) Art.treat(ctx, it.ph | 0, it.x, it.y, 0.55, t);
      else Art.roundStar(ctx, it.x, it.y, 24 + Math.sin(t * 8 + it.ph) * 3, it.c);
    }
    if (!this.won) this.bar(ctx, this.hits / this.need, this.thief ? 'Вкусняшки' : 'Искорки', '#ffd23f');
  },

  // ---------- catch: комета роняет мешочки, лови облачком ----------
  init_catch() {
    this.need = 3 + (this.fin ? 1 : 0);
    this.cm.speed = 0.55 + this.d * 0.04;
    Voice.say((this.thief ? 'Нажми на воришку, и он уронит мешочек со вкусняшками.' : 'Нажми на комету, и она уронит мешочек с искорками.') + ' Двигай облачко и лови мешочек! Поймай ' + (this.need === 3 ? 'три мешочка' : 'четыре мешочка') + '!');
  },
  update_catch(dt) {
    this.fly(dt);
    for (const it of this.items) {
      if (it.done) continue;
      it.vy += 260 * dt; it.y += it.vy * dt;
      if (it.y > 560 && it.y < 620 && Math.abs(it.x - this.cloud.x) < 110) {
        it.done = true; this.hits++; Sound.pop(1.2); Sound.magic();
        G.burst(it.x, 560, { kind: 'star', n: 16, speed: 240 });
        G.floatText(it.x, 500, 'Поймал!', '#ffd23f');
        if (this.hits >= this.need) this.win(this.thief ? 'Ура! Все мешочки пойманы! Воришка сдаётся!' : 'Ура! Все мешочки пойманы! Шкода сдаётся!');
      } else if (it.y > 700) { it.done = true; Sound.boing(); Voice.say(M.pick(['Ой, мимо! Нажми на комету ещё раз!', 'Почти! Двигай облачко под мешочек!'])); }
    }
    this.items = this.items.filter(it => !it.done);
  },
  down_catch(x, y) {
    if (y > 470) { this.drag = true; this.cloud.x = M.clamp(x, G.view.x0 + 100, G.view.x1 - 100); return; }
    if (this.hitComet(x, y) && !this.items.length && this.cm.stun <= 0) {
      this.cm.stun = 0.6; this.cm.talk = 1; Sound.whoosh();
      this.items.push({ x: this.cm.x, y: this.cm.y + 50, vy: 40 });
    }
  },
  move_catch(x, y) { if (this.drag) this.cloud.x = M.clamp(x, G.view.x0 + 100, G.view.x1 - 100); },
  draw_catch(ctx, t) {
    for (const it of this.items) Art.sack(ctx, it.x, it.y, 0.8, t);
    if (!this.won) {
      Art.cloud(ctx, this.cloud.x, 600, 1.3, '#ffffff');
      ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.2; UI.text(ctx, '◀      ▶', this.cloud.x, 600, 34, '#8f6cf2', 'center', false); ctx.restore();
      this.bar(ctx, this.hits / this.need, 'Мешочки', '#8f6cf2');
    }
  },
};
