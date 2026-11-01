// Маршруты в метеоритном поясе: нарисуй пальцем путь ракеты до планеты
'use strict';
G.scenes.route = {
  enter() {
    const lvl = S.data.route;
    this.start = { x: 130, y: 380, r: 80 };
    this.rx = 235; this.ry = 380;
    const pal = M.pick([['#ffd0f0', '#ff7eb6'], ['#d4fff6', '#38d6c3'], ['#fff3c0', '#ffb23a'], ['#e3d6ff', '#8f6cf2']]);
    this.target = { x: 1150, y: M.rnd(220, 540), r: 78, c0: pal[0], c1: pal[1], ring: Math.random() < 0.5 ? 'rgba(255,255,255,0.7)' : null };
    const n = Math.min(4 + lvl, 12);
    this.meteors = [];
    let guard = 0;
    while (this.meteors.length < n && guard++ < 500) {
      const m = { x: M.rnd(380, 980), y: M.rnd(130, 640), r: M.rnd(30, 50), rot: Math.random() * 6, vr: M.rnd(-0.6, 0.6), seed: M.ri(1, 99), amp: lvl >= 1 ? M.rnd(15, Math.min(25 + lvl * 5, 60)) : 0, ph: Math.random() * 6, alive: true };
      if (M.dist(m.x, m.y, this.rx, this.ry) < 230 || M.dist(m.x, m.y, this.target.x, this.target.y) < 230) continue;
      if (this.meteors.some(o => M.dist(o.x, o.by, m.x, m.y) < o.r + m.r + (n > 8 ? 70 : 90))) continue;
      m.by = m.y; this.meteors.push(m);
    }
    this.stars = [];
    guard = 0;
    while (this.stars.length < 3 && guard++ < 500) {
      const s = { x: M.rnd(360, 1000), y: M.rnd(140, 620), got: false };
      if (this.meteors.some(m => M.dist(m.x, m.by, s.x, s.y) < m.r + 70)) continue;
      if (this.stars.some(o => M.dist(o.x, o.y, s.x, s.y) < 150)) continue;
      this.stars.push(s);
    }
    this.path = null; this.drawing = false; this.flying = false; this.fade = 0;
    this.rocket = { x: this.rx, y: this.ry, rot: Math.PI / 2, shake: 0 };
    this.shield = hasAbility('shield2') ? 2 : hasAbility('wings') ? 1 : 0;
    this.speed = Math.min(340 + lvl * 12, 480); this.collected = 0; this.won = false;
    this.tutorial = S.data.route === 0;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('route') });
    Voice.say('Проведи пальцем дорожку от ракеты до планеты. Облетай метеориты и собирай звёздочки!');
  },
  down(x, y) {
    if (this.flying || this.won) return;
    if (M.dist(x, y, this.rocket.x, this.rocket.y) < 120) {
      this.drawing = true; this.tutorial = false; this.fade = 0;
      this.path = [{ x: this.rocket.x, y: this.rocket.y }];
      Sound.pop(0.8);
    } else {
      this.nudge = 1.5; // подсветить ракету
    }
  },
  move(x, y) {
    if (!this.drawing) return;
    const last = this.path[this.path.length - 1];
    if (M.dist(x, y, last.x, last.y) > 14) {
      this.path.push({ x, y });
      if (M.dist(x, y, this.target.x, this.target.y) < this.target.r + 30) { this.drawing = false; this.launch(); }
    }
  },
  up() {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.path && this.path.length > 1) {
      const l = this.path[this.path.length - 1];
      if (M.dist(l.x, l.y, this.target.x, this.target.y) < this.target.r + 60) { this.launch(); return; }
    }
    this.fade = 1; Voice.say('Доведи дорожку до самой планеты!');
  },
  launch() {
    this.path.push({ x: this.target.x - this.target.r * 0.4, y: this.target.y });
    this.flying = true; this.seg = 0; this.segT = 0;
    Sound.whoosh();
  },
  crash(m) {
    if (this.shield > 0) {
      this.shield--; m.alive = false;
      Sound.bump(); Sound.chime(0.8);
      G.burst(m.x, m.y, { kind: 'dot', n: 18, colors: ['#b39a86', '#ffd23f', '#7ee8ff'], speed: 260 });
      G.floatText(m.x, m.y - 50, 'Щит!', '#7ee8ff');
      Voice.say('Дракоша защитил ракету!');
      return;
    }
    this.flying = false; this.path = null;
    Sound.bump(); this.rocket.shake = 0.6;
    G.burst(this.rocket.x, this.rocket.y, { kind: 'star', n: 10, speed: 200, colors: ['#ffd23f', '#fff'] });
    Voice.say(M.pick(['Ой! Метеорит! Попробуй ещё раз.', 'Бум! Давай облетим его.']));
    G.tween(this.rocket, { x: this.rx, y: this.ry, rot: Math.PI / 2 }, 0.9, G.ease.inOutQuad, null, 0.4);
  },
  win() {
    this.won = true; this.flying = false;
    S.data.route++; S.save();
    Sound.win();
    const n = 2 + this.collected + (this.meteors.length >= 8 ? 2 : 0);
    UI.reward(n, this.target.x, this.target.y);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(300, 1000), M.rnd(150, 450), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say(M.pick(['Ура! Долетели!', 'Отличный полёт!', 'Мы на месте! Молодец!']));
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    const t = G.t;
    for (const m of this.meteors) { m.rot += m.vr * dt; m.y = m.by + Math.sin(t * 1.2 + m.ph) * m.amp; }
    if (this.fade > 0) { this.fade -= dt * 0.8; if (this.fade <= 0) { this.fade = 0; if (!this.drawing && !this.flying) this.path = null; } }
    this.nudge = Math.max(0, (this.nudge || 0) - dt);
    const rk = this.rocket;
    rk.shake = Math.max(0, rk.shake - dt);
    if (this.flying) {
      let move = this.speed * dt;
      while (move > 0 && this.flying) {
        const a = this.path[this.seg], b = this.path[this.seg + 1];
        if (!b) { this.win(); break; }
        const segLen = M.dist(a.x, a.y, b.x, b.y) || 0.001;
        const left = segLen * (1 - this.segT);
        if (move >= left) { move -= left; this.seg++; this.segT = 0; }
        else { this.segT += move / segLen; move = 0; }
        const p = this.path[this.seg], q = this.path[this.seg + 1] || p;
        rk.x = M.lerp(p.x, q.x, this.segT); rk.y = M.lerp(p.y, q.y, this.segT);
        if (q !== p) { const want = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2; let d = want - rk.rot; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; rk.rot += d * Math.min(1, dt * 10); }
      }
      if (this.flying) {
        for (const s of this.stars) if (!s.got && M.dist(s.x, s.y, rk.x, rk.y) < (hasAbility('magnet') ? 100 : 55)) { s.got = true; this.collected++; Sound.chime(1 + this.collected * 0.15); G.burst(s.x, s.y, { kind: 'star', n: 12, speed: 220 }); }
        for (const m of this.meteors) if (m.alive && M.dist(m.x, m.y, rk.x, rk.y) < m.r + 24) { this.crash(m); break; }
      }
    }
  },
  draw(ctx) {
    const t = G.t;
    Art.sky(ctx, '#0c0830', '#22175e', '#3a2a90');
    Art.stars(ctx, 41, 160, t);
    // стартовая и целевая планеты
    Art.planet(ctx, this.start.x - 40, this.start.y, this.start.r, '#9ff0e0', '#2a8f8a');
    const tg = this.target;
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 3) * 0.15; Art.ell(ctx, tg.x, tg.y, tg.r + 30, tg.r + 30, '#fff3a0'); ctx.restore();
    Art.planet(ctx, tg.x, tg.y, tg.r, tg.c0, tg.c1, tg.ring);
    Art.roundStar(ctx, tg.x, tg.y - tg.r - 10, 20, '#ffd23f', '#2a1650');
    // звёздочки
    for (const s of this.stars) if (!s.got) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.sin(t * 2 + s.x) * 0.2); Art.roundStar(ctx, 0, 0, 26 + Math.sin(t * 4 + s.y) * 3, '#ffd23f', '#2a1650'); ctx.restore(); }
    // метеориты
    for (const m of this.meteors) if (m.alive) Art.meteor(ctx, m.x, m.y, m.r, m.rot, m.seed);
    // дорожка
    if (this.path && this.path.length > 1) {
      ctx.save(); ctx.globalAlpha = this.fade > 0 ? this.fade : 1;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); this.path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(126,232,255,0.25)'; ctx.stroke();
      ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 60; ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.restore();
    }
    // ракета
    const rk = this.rocket;
    const sx = rk.shake > 0 ? Math.sin(t * 60) * 8 * rk.shake : 0;
    if (this.shield > 0) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 4) * 0.1; Art.ell(ctx, rk.x + sx, rk.y, 70, 70, '#7ee8ff'); if (this.shield > 1) { ctx.lineWidth = 6; ctx.strokeStyle = '#38d6c3'; Art.ell(ctx, rk.x + sx, rk.y, 84, 84); ctx.stroke(); } ctx.restore(); }
    if (this.nudge > 0 || (!this.flying && !this.path && !this.won)) { ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 6) * 0.3; ctx.beginPath(); ctx.arc(rk.x, rk.y, 80, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(rk.x + sx, rk.y); ctx.rotate(rk.rot); ctx.translate(0, 72);
    Art.rocket(ctx, 0, 0, 0.34, { t, flame: this.flying ? 1 : 0.3, pilot: true });
    ctx.restore();
    // обучение: «палец» ведёт по дорожке
    if (this.tutorial && !this.drawing) {
      const k = (t * 0.4) % 1, x = M.lerp(this.rx, tg.x, k), y = M.lerp(this.ry, tg.y, k) - Math.sin(k * Math.PI) * 160;
      ctx.save(); ctx.globalAlpha = 0.8; Art.ell(ctx, x, y, 26, 26, '#fff'); ctx.lineWidth = 5; ctx.strokeStyle = '#ff7eb6'; ctx.stroke(); ctx.restore();
    }
    if (this.shield > 0) { Art.dragon(ctx, 90, 700, 0.35, { t, level: S.data.level, flying: true, lift: 10 }); }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
