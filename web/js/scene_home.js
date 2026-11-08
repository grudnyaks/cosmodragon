// Главный экран Ням-Ням: два дракончика с потребностями (как тамагочи), космонавт, ракета, игры и пещера Змея Шипуна
'use strict';
const ASTRO_ANIMS = ['wave', 'jump', 'dance', 'salute', 'spin', 'cheer'];
const ASTRO_PHRASES = ['Привет!', 'Полетели за вкусняшками!', 'Дракончики — мои лучшие друзья!', 'Смотри, как я умею!', 'Космос такой большой!',
  'Я самый смелый космонавт!', 'Ура, приключения!', 'Давай поиграем!', 'Мой шлем блестит!', 'Звёзды мне подмигивают!',
  'Кто тут самый весёлый? Я!', 'Здесь так красиво!', 'Опа! Прыжок!', 'На планете Ням-Ням так интересно!', 'Шипуна я не боюсь!'];
const ROCKET_PHRASES = ['Бортовой компьютер: все системы в норме!', 'Топливо: сто процентов!', 'Ракета готова к полёту!',
  'Проверка двигателей. Отлично!', 'Внимание! Обнаружены вкусняшки!', 'Связь с Землёй установлена!', 'Курс на звёзды проложен!'];
const DRAGON_SPOT = { dark: 575, light: 865 };
const CAVE_X = 1140;

G.scenes.home = {
  enter() {
    PS().visited = true; Care.tick(); S.save();
    Sound.preload();
    this.redirect = Care.asleep() ? 'sleeping' : null; this.tickT = 0; this.lateAsked = false;
    this.drs = {};
    for (const d of DRAGONS) this.drs[d.id] = { id: d.id, x: DRAGON_SPOT[d.id], y: 600, lift: 0, squash: 0, mouth: 0, happyT: 0, fire: 0, flying: false, look: 0, tilt: 0,
      blinkT: M.rnd(1, 4), blink: 0, taps: 0, carried: false };
    this.as = { anim: 'idle', at: 0, until: 0, phrase: 0 };
    this.rk = { lift: 0, flame: 0, busy: false, act: 0, pilotWave: 0, lights: 0 };
    this.cave = { peek: 0, eyes: 1, talk: 0 };
    this.sp = null; this.busy = false; this.feedTurn = 0;
    // 12 игр в нижнем ряду
    const games = P().games.concat([{ scene: 'duo', icon: 'duo', color: '#ff9a3c' }]), n = games.length, step = 91, r = 39;
    const x0 = 640 - (n - 1) * step / 2;
    this.gameBtns = games.map((g, i) => UI.add(this, { x: x0 + i * step, y: 668, r, icon: g.icon, color: g.color, bob: true, iconScale: 1.1,
      onTap: () => { Voice.stop(); G.go(g.scene); } }));
    this.feedBtn = UI.add(this, { x: 720, y: 470, r: 44, color: '#ffd23f', draw: (ctx) => Art.treat(ctx, 0, 0, 4, 0.6, G.t), onTap: () => this.feed() });
    // имя и четыре потребности над каждым дракончиком
    this.petUI = {};
    for (const D of DRAGONS) {
      const x = DRAGON_SPOT[D.id], ui = this.petUI[D.id] = {};
      ui.name = UI.add(this, { x, y: 300, w: 190, h: 44, label: Care.name(D.id), fontSize: 24, color: D.id === 'dark' ? '#4a4660' : '#c8b8e8',
        onTap: () => { Voice.stop(); G.go('name', { id: D.id }); } });
      ui.needs = NEEDS.map((N, i) => UI.add(this, { x: x - 87 + i * 58, y: 358, r: 25, color: '#ffffff', need: N.id,
        draw: (ctx) => this.drawNeed(ctx, D.id, N), onTap: () => this.needTap(D.id, N) }));
    }
    const tx = i => G.view.x0 + 52 + i * 78;
    UI.add(this, { x: tx(0), y: 56, r: 33, icon: S.data.music ? 'music' : 'musicOff', color: '#38d6c3', onTap() { Sound.setMusic(!S.data.music); this.icon = S.data.music ? 'music' : 'musicOff'; } });
    UI.add(this, { x: tx(1), y: 56, r: 33, icon: 'book', color: '#ff9a3c', onTap: () => { Voice.stop(); G.go('intro'); } });
    UI.add(this, { x: tx(2), y: 56, r: 33, icon: 'snake', color: '#8f6cf2', onTap: () => { Voice.stop(); G.go('story'); } });
    UI.add(this, { x: tx(3), y: 56, r: 33, icon: 'trophy', color: '#ff7eb6', onTap: () => { Voice.stop(); G.go('ach'); } });
    UI.add(this, { x: tx(4), y: 56, r: 33, icon: 'hat', color: '#ffd23f', onTap: () => { Voice.stop(); G.go('wardrobe'); } });
    UI.add(this, { x: tx(5), y: 56, r: 33, icon: 'palette', color: '#41d982', onTap: () => { Voice.stop(); G.go('paint'); } });
    this.bedBtn = UI.add(this, { x: 720, y: 190, w: 380, h: 80, label: 'Уложить спать', icon: 'moon', iconX: -140, fontSize: 30, color: '#5a4ab0', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('sleep', { mode: 'bedtime' }); } });
    this.updBtn = UI.add(this, { x: tx(6), y: 56, r: 33, icon: 'update', color: '#41d982', pulse: true, hidden: !G.updateReady, onTap: () => { if (window.Android && Android.reload) Android.reload(); else location.reload(); } });
    this.rescueBtn = UI.add(this, { x: 640, y: 180, w: 470, h: 84, label: 'Спасти дракончиков!', icon: 'sword', iconX: -185, fontSize: 32, color: '#ff3b5c', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('rescue'); } });
    // Шипун приходит, когда набралось достаточно побед
    if (Villain.due()) setTimeout(() => this.kidnap(), 1600);
    else setTimeout(() => this.hello(), 700);
  },
  present() { return DRAGONS.filter(d => !isTaken(d.id) && !this.drs[d.id].carried).map(d => d.id); },
  hello() {
    if (G.scene !== this || this.busy) return;
    const v = V();
    if (v.taken.length) { Voice.say(v.keys >= 3 ? 'Все ключи найдены! Нажми на красную кнопку, чтобы спасти дракончиков!' : 'Шипун держит дракончиков в Тёмной пещере! ' + Villain.task(v.taken)); return; }
    if (Care.late()) { this.askBed(); return; }
    for (const D of DRAGONS) { const n = Care.lowest(D.id, 35); if (n) { Voice.say(Care.ask(D.id, n.id)); this.pulseNeed(D.id, n.id); Care.data().lastCall = Date.now(); return; } }
    Voice.say('Привет! Дракончики рады тебя видеть!');
  },
  dragonHit(id, x, y) {
    const d = this.drs[id], s = 0.72;
    return Math.abs(x - d.x) < 100 * s && y < d.y - d.lift + 10 && y > d.y - d.lift - 270 * s;
  },
  down(x, y) {
    if (this.busy) return;
    for (const id of this.present()) if (this.dragonHit(id, x, y)) return this.pet(id);
    if (Math.abs(x - CAVE_X) < 110 && y > 420 && y < 640) return this.tapCave();
    if (Math.abs(x - 390) < 55 && y > 420 && y < 630) return this.tapAstro();
    if (Math.abs(x - 170) < 85 && y > 120 - this.rk.lift && y < 600 - this.rk.lift) return this.tapRocket();
  },
  // ---------- пещера Шипуна ----------
  tapCave() {
    const c = this.cave;
    Sound.hiss(); c.peek = 0.01; c.talk = 2.2;
    G.tween(c, { peek: 1 }, 0.5, G.ease.outBack, () => G.tween(c, { peek: 0 }, 0.6, G.ease.inOutQuad, null, 1.6));
    Voice.say(Villain.taunt());
    stat('cave');
  },
  // ---------- космонавт ----------
  tapAstro() {
    const a = this.as;
    a.anim = ASTRO_ANIMS[(ASTRO_ANIMS.indexOf(a.anim) + 1 + M.ri(0, 2)) % ASTRO_ANIMS.length];
    a.at = 0; a.until = a.anim === 'spin' ? 0.75 : 1.8;
    Sound.boing(); stat('astro');
    a.phrase = (a.phrase + 1 + M.ri(0, 4)) % ASTRO_PHRASES.length;
    Voice.say(ASTRO_PHRASES[a.phrase]);
    if (a.anim === 'cheer' || a.anim === 'jump') G.burst(390, 450, { kind: 'star', n: 8, up: true, speed: 200 });
  },
  // ---------- ракета ----------
  tapRocket() {
    const rk = this.rk; if (rk.busy) return;
    rk.busy = true; rk.act = (rk.act + 1) % 3;
    if (rk.act === 1) {
      Voice.say('Три! Два! Один! Пуск!'); stat('launch');
      G.wait(2.4, () => {
        rk.flame = 1; Sound.rumble(2.5); Sound.whoosh();
        for (let i = 0; i < 8; i++) setTimeout(() => G.burst(170 + M.rnd(-60, 60), 590, { kind: 'smoke', n: 4, colors: ['#ffffff', '#d8d0f0'], g: -30, speed: 120, size: 22 }), i * 120);
        G.tween(rk, { lift: 900 }, 1.8, x => x * x, () => {
          G.wait(1.2, () => { rk.flame = 0.7; G.tween(rk, { lift: 0 }, 2.2, G.ease.outQuad, () => { rk.flame = 0; rk.busy = false; Sound.bump(); G.burst(170, 600, { kind: 'smoke', n: 14, colors: ['#ffffff'], g: -20, speed: 180, size: 18 }); }); });
        });
      });
    } else if (rk.act === 2) {
      Sound.whoosh(); rk.flame = 1; rk.lights = 2;
      G.tween(rk, { lift: 70 }, 0.6, G.ease.outQuad, () => G.tween(rk, { lift: 0 }, 0.8, G.ease.outBounce, () => { rk.flame = 0; rk.busy = false; }));
    } else {
      Sound.beep(); rk.pilotWave = 2.2; rk.lights = 2.2;
      Voice.say(M.pick(ROCKET_PHRASES));
      G.wait(1.2, () => { rk.busy = false; });
    }
  },
  // ---------- дракончики ----------
  pet(id) {
    const d = this.drs[id], D = DRAGON_BY_ID[id];
    S.data.buddy = id; Care.add(id, 'fun', 8);
    d.taps++; stat('pet');
    Sound.purr(1.6, { dragon: id });
    d.happyT = 1.8;
    G.burst(d.x, d.y - 200 - d.lift, { kind: 'heart', n: 5, colors: ['#ff5e9a', '#ff9ad5', '#ffb3d0'], up: true, g: -80, speed: 160, size: 20 });
    d.squash = 0.6; G.tween(d, { squash: 0 }, 0.6, G.ease.outElastic);
    if (d.taps % 4 === 0) {
      Sound.fire(); d.fire = 0.01; G.tween(d, { fire: 1 }, 0.3, G.ease.outQuad, () => G.tween(d, { fire: 0 }, 0.5, G.ease.linear, null, 0.4));
    } else if (d.taps % 2 === 0) {
      d.flying = true;
      G.tween(d, { lift: 140 }, 0.6, G.ease.outQuad, () => G.tween(d, { lift: 0 }, 0.7, G.ease.inOutQuad, () => { d.flying = false; }, 0.4));
    } else if (d.taps === 1) Voice.say(Care.name(id) + ' любит, когда его гладят!');
  },
  feed() {
    if (this.busy) return;
    const here = this.present();
    if (!here.length) { Voice.say('Шипун держит дракончиков в Тёмной пещере! ' + Villain.task(V().taken)); return; }
    const ps = PS();
    if (ps.treats <= 0) {
      Voice.say('Угощение закончилось! Поиграй в игры, чтобы найти ещё.');
      for (const b of this.gameBtns) { b.pulse = true; setTimeout(() => { b.pulse = false; }, 3000); }
      return;
    }
    const id = here[this.feedTurn++ % here.length], d = this.drs[id];
    ps.treats--; Care.add(id, 'food', 12); Care.add(id, 'fun', 3); stat('fed');
    const mx = d.x, my = d.y - 150 * 0.72 - d.lift;
    d.mouth = 0; G.tween(d, { mouth: 1 }, 0.3);
    UI.flyTreat(M.ri(0, 5), this.feedBtn.x, this.feedBtn.y, mx, my, 0, () => {
      Sound.chomp(); d.mouth = 1; G.tween(d, { mouth: 0 }, 0.5); d.squash = 0.5; G.tween(d, { squash: 0 }, 0.7, G.ease.outElastic);
      G.burst(mx, my, { kind: 'star', n: 8, speed: 180, size: 12 }); d.happyT = 1.5;
      setTimeout(() => Sound.purr(1.2, { dragon: id }), 400);
    });
  },
  // ---------- потребности ----------
  drawNeed(ctx, id, N) {
    const v = Care.pet(id)[N.id] / 100;
    ctx.beginPath(); ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.strokeStyle = v < 0.3 ? '#ff3b5c' : v < 0.6 ? '#ffb23a' : N.color; ctx.stroke();
    Art.icon(ctx, N.icon, 0, 0, 0.5, G.t);
  },
  pulseNeed(id, need) {
    const b = this.petUI[id].needs.find(x => x.need === need); if (!b) return;
    b.pulse = true; setTimeout(() => { b.pulse = false; }, 4000);
  },
  needTap(id, N) {
    if (this.busy) return;
    S.data.buddy = id; S.save();
    if (N.id === 'fun') { this.pet(id); return; }
    if (N.id === 'energy' && Care.late()) { Voice.stop(); G.go('sleep', { mode: 'bedtime' }); return; }
    Voice.stop(); G.go(N.scene, { id });
  },
  askBed() {
    this.lateAsked = true; this.bedBtn.hidden = false;
    Voice.say('Уже поздно! Дракончики зевают. Пора укладываться спать!');
  },
  // ---------- похищение ----------
  kidnap() {
    if (G.scene !== this || this.busy || !Villain.due()) return;
    const plan = Villain.plan();
    plan.line = Villain.sayLine(Villain.chapter());
    this.busy = true;
    const sp = this.sp = { head: CAVE_X + 60, y: 560, carry: [] };
    Sound.hiss(); Voice.say('Ой! Кто это шипит в пещере?');
    const grab = (i) => {
      const id = plan.ids[i], d = this.drs[id];
      G.tween(sp, { head: d.x + 30 }, 2.2, G.ease.inOutQuad, () => {
        Sound.hiss(); d.carried = true; sp.carry.push(id);
        if (i + 1 < plan.ids.length) grab(i + 1);
        else {
          Voice.say(plan.line);
          G.tween(sp, { head: CAVE_X + 700 }, 3.2, G.ease.inOutQuad, () => {
            Villain.start(plan);
            this.sp = null; this.busy = false;
            G.go('villain', { kind: 'kidnap' });
          }, 2.2);
        }
      }, i ? 0.3 : 1.4);
    };
    grab(0);
  },
  serpentPts(headX, y, t) {
    const pts = [];
    for (let i = 0; i < 28; i++) pts.push([headX + i * 22, y - 40 + Math.sin(t * 4 - i * 0.6) * 20]);
    return pts;
  },
  update(dt) {
    if (this.redirect && G.fadeDir === 0) { const r = this.redirect; this.redirect = null; G.go(r); return; }
    this.tickT += dt;
    if (this.tickT > 2) {
      this.tickT = 0; Care.tick();
      const c = Care.data();
      if (!this.busy && !Voice.cur && Date.now() - (c.lastCall || 0) > 50000) {
        if (Care.late() && !this.lateAsked) this.askBed();
        else for (const D of DRAGONS) { if (isTaken(D.id)) continue; const n = Care.lowest(D.id, 25); if (n) { Voice.say(Care.ask(D.id, n.id)); this.pulseNeed(D.id, n.id); break; } }
        c.lastCall = Date.now();
      }
    }
    for (const D of DRAGONS) { const ui = this.petUI[D.id], hide = isTaken(D.id) || this.drs[D.id].carried; ui.name.hidden = hide; ui.name.label = Care.name(D.id); ui.needs.forEach(b => { b.hidden = hide; }); }
    for (const id in this.drs) {
      const d = this.drs[id];
      d.blinkT -= dt;
      if (d.blinkT < 0) { d.blink = 1; if (d.blinkT < -0.14) { d.blink = 0; d.blinkT = M.rnd(2, 4.5); } }
      d.happyT = Math.max(0, d.happyT - dt);
      if (!this.busy) d.look += (M.clamp((G.pointer.x - d.x) / 400, -1, 1) - d.look) * dt * 3;
    }
    const a = this.as; a.at += dt; if (a.anim !== 'idle' && a.at > a.until) a.anim = 'idle';
    this.rk.pilotWave = Math.max(0, this.rk.pilotWave - dt); this.rk.lights = Math.max(0, this.rk.lights - dt);
    this.cave.talk = Math.max(0, this.cave.talk - dt);
    this.updBtn.hidden = !G.updateReady;
    const v = V();
    this.rescueBtn.hidden = !(v.taken.length && v.keys >= 3 && !this.busy);
    if (v.taken.length) this.rescueBtn.label = 'Спасти ' + (v.taken.length > 1 ? 'дракончиков' : Care.custom(v.taken[0]) ? Care.name(v.taken[0]) : DRAGON_BY_ID[v.taken[0]].acc) + '!';
    this.feedBtn.hidden = !this.present().length || this.busy;
    if (Care.late() && !this.busy) { this.bedBtn.hidden = false; this.rescueBtn.y = 270; }
  },
  draw(ctx) {
    const t = G.t, v = V();
    World.bg(ctx, t, { noBeacon: true });
    Art.lair(ctx, CAVE_X, 612, 1, t, { peek: this.cave.peek, talk: this.cave.talk > 0, friend: v.friend, eyes: !this.sp });
    const rk = this.rk;
    Art.rocket(ctx, 170, World.GROUND + 25 - rk.lift, 0.8, { t, flame: rk.flame, glowBase: rk.lift < 5, pilot: rk.pilotWave > 0, pilotWave: rk.pilotWave > 0 });
    if (rk.lights > 0) for (let i = 0; i < 4; i++) { const on = Math.sin(t * 16 + i) > 0; if (on) { ctx.save(); ctx.globalAlpha = 0.6; Art.ell(ctx, 170 + (i - 1.5) * 40, World.GROUND + 25 - rk.lift - 140 - (i % 2) * 120, 14, 14, ['#ff3b5c', '#41ff82', '#ffe14a', '#7ee8ff'][i]); ctx.restore(); } }
    Art.astronaut(ctx, 390, 600, 1.1, { t, anim: this.as.anim, at: this.as.at, look: M.clamp((G.pointer.x - 390) / 500, -1, 1) });
    for (const D of DRAGONS) {
      const d = this.drs[D.id];
      if (isTaken(D.id) || d.carried) { // пустое место и следы Шипуна
        ctx.save(); ctx.globalAlpha = 0.35; Art.ell(ctx, d.x, d.y, 80, 16, '#3a1a3a'); ctx.restore();
        continue;
      }
      const late = Care.late(), yawn = late && ((t + (D.id === 'light' ? 3 : 0)) % 7) < 1.2 ? Math.sin(((t + (D.id === 'light' ? 3 : 0)) % 7) / 1.2 * Math.PI) : 0;
      Art.dragon(ctx, d.x, d.y, 0.72, { kind: D.id, t: t + (D.id === 'light' ? 1.3 : 0), blink: yawn > 0.2 ? 0.8 : d.blink, mouth: Math.max(d.mouth, yawn), look: d.look, squash: d.squash,
        happy: d.happyT > 0 && d.mouth < 0.1, lift: d.lift, flying: d.flying, fire: d.fire, tilt: d.tilt, mood: d.happyT > 0 ? 'happy' : Care.mood(D.id) });
      const low = d.happyT > 0 ? null : Care.lowest(D.id, 30);
      if (low && !this.busy) this.thought(ctx, d.x + (D.id === 'dark' ? -110 : 110), d.y - 215 - d.lift, low, t, D.id === 'dark' ? 1 : -1);
    }
    if (this.sp) {
      const pts = this.serpentPts(this.sp.head, this.sp.y, t);
      Art.serpent(ctx, pts, t, { open: !this.sp.carry.length, r: 34 });
      this.sp.carry.forEach((id, i) => Art.dragon(ctx, this.sp.head + 50 + i * 70, this.sp.y - 60 - i * 10, 0.42, { kind: id, t, tilt: 0.5, look: -1, mouth: 0.8 }));
    }
    if (v.taken.length && !this.sp) this.drawKeys(ctx, t);
  },
  thought(ctx, x, y, N, t, dir) {
    const b = Math.sin(t * 3) * 4;
    ctx.save(); ctx.globalAlpha = 0.95;
    Art.ell(ctx, x + dir * 40, y + 46 + b, 7, 7, '#fff'); Art.ell(ctx, x + dir * 26, y + 32 + b, 10, 10, '#fff');
    Art.ell(ctx, x, y + b, 34, 30, '#fff');
    Art.icon(ctx, N.icon, x, y + b, 0.75, t);
    ctx.restore();
  },
  drawKeys(ctx, t) {
    const v = V(), cx = 820;
    Art.rr(ctx, cx - 210, 16, 420, 110, 30); ctx.fillStyle = 'rgba(30,14,70,0.7)'; ctx.fill();
    UI.text(ctx, 'Ключи от пещеры Шипуна', cx, 44, 26, '#ffd6f0', 'center', true);
    for (let i = 0; i < 3; i++) {
      Art.ell(ctx, cx - 90 + i * 90, 92, 26, 26, i < v.keys ? '#ffd23f' : 'rgba(255,255,255,0.15)');
      ctx.save(); if (i >= v.keys) ctx.globalAlpha = 0.35; Art.icon(ctx, 'key', cx - 90 + i * 90, 92, 0.6, t); ctx.restore();
    }
  },
  drawTop(ctx) {
    UI.drawCounterTopRight(ctx);
    ctx.save(); ctx.globalAlpha = 0.45; UI.text(ctx, 'версия ' + G.webVersion, G.view.x1 - 20, G.view.y1 - 18, 18, '#fff', 'right', false); ctx.restore();
  },
};
