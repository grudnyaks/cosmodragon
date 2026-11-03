// Спасение дракончика от Змея: на каждой планете своя механика
'use strict';
const RESCUE = { nyam: 'feed', water: 'weeds', fire: 'cool', wind: 'blow', ice: 'locks', rainbow: 'shell', jungle: 'fight' };
const LOCK_COLORS = ['#ff4a6a', '#3a8aff', '#ffd23f', '#41d982'];
G.scenes.rescue = {
  enter() {
    this.pid = S.data.planet; this.mode = RESCUE[this.pid] || 'fight';
    this.d = S.data.diff;
    this.won = false; this.lost = false; this.wonT = 0;
    this.cage = { open: 0 }; this.free = { k: 0 };
    this.cx = 1060; this.trap = null; // trap — где сидит дракончик, если не в клетке
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('rescue') });
    this.homeBig = UI.add(this, { x: 640, y: 250, w: 380, h: 84, label: 'Домой!', icon: 'home', iconX: -110, fontSize: 34, color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('home') });
    Sound.hiss();
    this['init_' + this.mode]();
  },
  // ---------- общее ----------
  win(text) {
    if (this.won) return;
    this.won = true; this.wonT = G.t;
    const ps = PS(this.pid); ps.serpent = 'rescued'; ps.keys = 0; S.save(); stat('rescued');
    Sound.win(); Sound.magic();
    Voice.say(text + ' Ты настоящий герой!');
    G.tween(this.cage, { open: 1 }, 1, G.ease.outBack, null, 1.0);
    G.tween(this.free, { k: 1 }, 1.6, G.ease.inOutQuad, () => { Sound.purr(2, { planet: this.pid }); G.burst(760, 520, { kind: 'heart', n: 20, up: true, g: -60, speed: 220 }); }, 1.8);
    for (let i = 0; i < 6; i++) setTimeout(() => G.burst(M.rnd(200, 1100), M.rnd(120, 400), { kind: 'confetti', n: 30, speed: 380 }), 1000 + i * 300);
    setTimeout(() => { this.homeBig.hidden = false; }, 4000);
  },
  trapPos() { return this.trap || { x: this.cx, y: 250, s: 0.45 }; },
  drawCage(ctx, t) {
    const x = this.cx, v = G.view;
    ctx.beginPath(); ctx.moveTo(x, v.y0); ctx.lineTo(x, 110); Art.stroke(ctx, 6, '#6a4a2a');
    ctx.save(); ctx.translate(x, 110);
    ctx.beginPath(); ctx.ellipse(0, 10, 95, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#8a6a3a'; ctx.fill(); Art.stroke(ctx, 4);
    for (let i = -4; i <= 4; i++) { const op = this.cage.open; ctx.save(); ctx.translate(i * 22, 10); ctx.rotate(op * (i < 0 ? -1.2 : 1.2) * (Math.abs(i) / 4)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 170); Art.stroke(ctx, 6, '#c8a050'); ctx.restore(); }
    if (this.cage.open < 0.5) { ctx.beginPath(); ctx.ellipse(0, 180, 95, 14, 0, 0, Math.PI * 2); Art.stroke(ctx, 7, '#8a6a3a'); }
    ctx.restore();
  },
  drawDragon(ctx, t, hidden) {
    const tp = this.trapPos(), k = this.free.k;
    if (k >= 1) {
      Art.dragon(ctx, 760, 640, 0.75, { planet: this.pid, t, happy: true, level: PS(this.pid).level });
      Art.astronaut(ctx, 560, 650, 1.05, { t, anim: 'cheer', at: t });
      return;
    }
    if (hidden && k === 0) return;
    const x = M.lerp(tp.x, 760, k), y = M.lerp(tp.y, 640, k), s = M.lerp(tp.s, 0.75, k);
    Art.dragon(ctx, x, y, s, { planet: this.pid, t, level: PS(this.pid).level, happy: this.won, look: -1, flying: k > 0, tilt: this.won ? 0 : 0.2 });
  },
  dim(ctx, a) { const v = G.view; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0a0a24'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); },
  bar(ctx, k, label, color) { UI.progress(ctx, 380, 26, 520, 44, k, color); UI.text(ctx, label, 640, 49, 26, '#fff', 'center', true); },
  // змей уползает после победы
  awayPts(pts) { if (!this.won) return pts; const k = Math.min(1, (G.t - this.wonT) / 2.5); return pts.map(([x, y]) => [x - k * 1300, y + k * 150]); },
  down(x, y) { if (this.won || this.lost) return; const f = this['down_' + this.mode]; f && f.call(this, x, y); },
  move(x, y) { const f = this['move_' + this.mode]; f && f.call(this, x, y); },
  up(x, y) { const f = this['up_' + this.mode]; f && f.call(this, x, y); },
  update(dt) { const f = this['update_' + this.mode]; f && f.call(this, dt); },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { planet: this.pid, noBeacon: true, noDecor: this.mode === 'fight' });
    this.dim(ctx, 0.35);
    this['draw_' + this.mode](ctx, t);
    if (this.lost && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { },

  // ---------- Ням-Ням: накорми Змея конфетами, он уснёт ----------
  init_feed() {
    this.need = 6 + Math.floor(this.d / 2); this.eaten = 0; this.items = []; this.spawnT = 0.4; this.sleep = { k: 0 }; this.chomp = 0;
    Voice.say('Змей проголодался! Нажимай на конфеты — он наестся и уснёт. Тогда клетка откроется!');
  },
  feedPts(t) { const pts = [], s = 1 - this.sleep.k; for (let i = 0; i < 26; i++) pts.push([360 - i * 24, 480 + Math.sin(t * 2.2 - i * 0.5) * 24 * s + i * 4]); return pts; },
  update_feed(dt) {
    this.chomp = Math.max(0, this.chomp - dt);
    if (this.won) return;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.items.filter(i => !i.fly).length < 3) { this.items.push({ x: M.rnd(500, 930), y: -40, vy: 110 + this.d * 14, type: M.ri(0, 5), fly: null }); this.spawnT = M.rnd(0.7, 1.3); }
    for (const it of this.items) if (!it.fly) it.y += it.vy * dt;
    this.items = this.items.filter(it => it.fly || it.y < 760);
  },
  down_feed(x, y) {
    const pts = this.feedPts(G.t);
    for (const it of this.items) {
      if (it.fly || Math.hypot(x - it.x, y - it.y) > 60) continue;
      it.fly = true; Sound.pop(1.2);
      G.tween(it, { x: pts[0][0] + 20, y: pts[0][1] }, 0.5, G.ease.inOutQuad, () => {
        this.items.splice(this.items.indexOf(it), 1); this.eaten++; this.chomp = 0.4; Sound.pop(0.8);
        G.floatText(pts[0][0], pts[0][1] - 70, 'Ням!', '#ffd23f');
        if (this.eaten >= this.need && !this.won) { G.tween(this.sleep, { k: 1 }, 1.2); this.win('Ура! Змей наелся и уснул! Клетка открылась!'); }
      });
      return;
    }
  },
  draw_feed(ctx, t) {
    this.drawCage(ctx, t); this.drawDragon(ctx, t);
    const pts = this.feedPts(t);
    Art.serpent(ctx, pts, t, { open: this.chomp > 0 || (!this.won && Math.sin(t * 3) > 0.3), r: 38 });
    if (this.sleep.k > 0.5) for (let i = 0; i < 3; i++) UI.text(ctx, 'z', pts[0][0] + 40 + i * 26, pts[0][1] - 70 - i * 30 - (t * 20 % 20), 34 + i * 8, '#fff', 'center', true);
    for (const it of this.items) Art.treat(ctx, it.type, it.x, it.y, 0.9, t, this.pid);
    if (!this.won) this.bar(ctx, this.eaten / this.need, 'Змей наедается', '#ff7eb6');
  },

  // ---------- Аквария: порви водоросли ----------
  init_weeds() {
    const n = Math.min(8, 5 + Math.floor(this.d / 2));
    this.trap = { x: 860, y: 520, s: 0.5 };
    this.strands = []; for (let i = 0; i < n; i++) this.strands.push({ x: 860 - 130 + i * (260 / (n - 1)), hp: 2, cut: 0 });
    this.regrowT = this.regrowGap();
    Voice.say('Змей опутал дракончика водорослями! Нажимай на водоросли, чтобы их порвать. Быстрее, пока Змей не вернулся!');
  },
  regrowGap() { return Math.max(3.5, 7.5 - this.d * 0.5); },
  update_weeds(dt) {
    if (this.won) return;
    this.regrowT -= dt;
    if (this.regrowT <= 0) {
      this.regrowT = this.regrowGap();
      const dead = this.strands.filter(s => s.hp <= 0);
      if (dead.length && dead.length < this.strands.length) { const s = M.pick(dead); s.hp = 2; Sound.hiss(); G.burst(s.x, 420, { kind: 'dot', n: 10, colors: ['#3fcf6a'], speed: 140 }); }
    }
  },
  down_weeds(x, y) {
    if (y < 260 || y > 660) return;
    let best = null; for (const s of this.strands) if (s.hp > 0 && Math.abs(x - s.x) < 34 && (!best || Math.abs(x - s.x) < Math.abs(x - best.x))) best = s;
    if (!best) return;
    best.hp--; Sound.pop(best.hp ? 1 : 1.4); G.burst(best.x, y, { kind: 'dot', n: 8, colors: ['#3fcf6a', '#9ff5b0'], speed: 160 });
    if (this.strands.every(s => s.hp <= 0)) this.win('Ура! Все водоросли порваны! Дракончик свободен!');
  },
  draw_weeds(ctx, t) {
    // змей плавает по кругу за дракончиком
    const pts = []; for (let i = 0; i < 30; i++) { const u = t * 0.6 - i * 0.07; pts.push([640 + Math.cos(u) * 420, 400 + Math.sin(u) * 190]); }
    if (!this.won || G.t - this.wonT < 2.5) Art.serpent(ctx, this.awayPts(pts), t, { open: false, r: 34 });
    this.drawDragon(ctx, t);
    if (this.free.k > 0) return;
    for (const s of this.strands) {
      if (s.hp <= 0) continue;
      ctx.save(); ctx.globalAlpha = s.hp === 1 ? 0.55 : 1;
      ctx.beginPath(); for (let y = 290; y <= 650; y += 12) ctx.lineTo(s.x + Math.sin(y * 0.04 + t * 2 + s.x) * 12, y);
      Art.stroke(ctx, 16, '#2e9e4e'); ctx.restore();
      ctx.save(); ctx.globalAlpha = s.hp === 1 ? 0.55 : 1; ctx.beginPath(); for (let y = 290; y <= 650; y += 12) ctx.lineTo(s.x + Math.sin(y * 0.04 + t * 2 + s.x) * 12, y); Art.stroke(ctx, 6, '#7fe39a'); ctx.restore();
    }
    const left = this.strands.filter(s => s.hp > 0).length;
    if (!this.won) this.bar(ctx, 1 - left / this.strands.length, 'Водоросли', '#41d982');
  },

  // ---------- Вулкания: остуди горячие чешуйки тучкой ----------
  init_cool() {
    const K = Math.min(7, 4 + Math.floor(this.d / 2));
    this.hot = []; for (let k = 0; k < K; k++) this.hot.push({ i: Math.round(4 + k * (20 / Math.max(1, K - 1))), heat: 1 });
    this.cloud = { x: 640, y: 160 }; this.dragC = false; this.steamT = 0;
    Voice.say('Змей раскалился, как лава! Води тучку пальцем над горячими чешуйками, чтобы их остудить.');
  },
  coolPts(t) { const pts = []; for (let i = 0; i < 28; i++) { const u = t * 0.35 - i * 0.12; pts.push([560 + 420 * Math.sin(u * 0.8), 470 + 120 * Math.sin(u * 1.6)]); } return pts; },
  down_cool(x, y) { this.dragC = true; this.cloud.x = x; this.cloud.y = Math.min(y, 360); },
  move_cool(x, y) { if (this.dragC) { this.cloud.x = x; this.cloud.y = Math.min(y, 360); } },
  up_cool() { this.dragC = false; },
  update_cool(dt) {
    if (this.won) return;
    const pts = this.coolPts(G.t);
    for (const h of this.hot) {
      if (h.heat <= 0) continue;
      const [px, py] = pts[h.i];
      if (this.dragC && Math.abs(px - this.cloud.x) < 80 && py > this.cloud.y) {
        h.heat -= dt / 0.9;
        this.steamT -= dt; if (this.steamT <= 0) { this.steamT = 0.15; G.burst(px, py - 20, { kind: 'dot', n: 3, colors: ['#ffffff', '#cfe8ff'], up: true, speed: 90 }); }
        if (h.heat <= 0) { Sound.chime(1.2); G.burst(px, py, { kind: 'star', n: 10, speed: 200 }); }
      }
    }
    if (this.hot.every(h => h.heat <= 0)) this.win('Ура! Змей остыл и уполз! Клетка открылась!');
  },
  draw_cool(ctx, t) {
    this.drawCage(ctx, t); this.drawDragon(ctx, t);
    const pts = this.coolPts(t);
    if (!this.won || G.t - this.wonT < 2.5) {
      const ap = this.awayPts(pts);
      Art.serpent(ctx, ap, t, { open: !this.won, r: 38 });
      for (const h of this.hot) if (h.heat > 0) { const [px, py] = ap[h.i]; ctx.save(); ctx.globalAlpha = 0.45 + 0.35 * h.heat + Math.sin(t * 8 + h.i) * 0.1; Art.ell(ctx, px, py, 34, 34, h.heat > 0.5 ? '#ff4a1a' : '#ff9a3c'); ctx.restore(); }
    }
    if (!this.won) {
      if (this.dragC) for (let i = 0; i < 9; i++) { const rx = this.cloud.x - 60 + i * 15, ry = this.cloud.y + 30 + ((t * 500 + i * 47) % 260); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 16); Art.stroke(ctx, 4, '#8fd0ff'); }
      Art.cloud(ctx, this.cloud.x, this.cloud.y, 1.4, '#eaf4ff', '#b8cfe8');
      const left = this.hot.filter(h => h.heat > 0).length;
      this.bar(ctx, 1 - left / this.hot.length, 'Змей остывает', '#3a8aff');
    }
  },

  // ---------- Эолия: сдуй Змея ветром ----------
  init_blow() {
    this.power = 0; this.decay = 0.1 + this.d * 0.012; this.gain = 0.075; this.puff = 0; this.gusts = []; this.whooshT = 0;
    Voice.say('Змей обвил клетку! Нажимай быстро-быстро на тучку, чтобы она дула и сдула Змея!');
  },
  blowPts(t) {
    const pts = [], push = this.power * 120 + (this.won ? (G.t - this.wonT) * 900 : 0);
    for (let i = 0; i < 26; i++) { const a = t * 1.6 + i * 0.34, r = 66 + i * 2.2; pts.push([this.cx + push + Math.cos(a) * r, 250 + Math.sin(a) * r * 0.5 + i * 4 - (this.won ? (G.t - this.wonT) * 300 : 0)]); }
    return pts;
  },
  down_blow(x, y) {
    if (Math.hypot(x - 260, y - 360) > 170) return;
    this.power = Math.min(1, this.power + this.gain); this.puff = 0.25;
    for (let i = 0; i < 3; i++) this.gusts.push({ x: 360, y: 330 + M.rnd(-40, 40), life: 1 });
    if (G.t > this.whooshT) { Sound.whoosh(); this.whooshT = G.t + 0.35; }
    if (this.power >= 1) this.win('Ура! Ветер унёс Змея! Клетка открылась!');
  },
  update_blow(dt) {
    this.puff = Math.max(0, this.puff - dt);
    for (const g of this.gusts) { g.x += 900 * dt; g.life -= dt * 1.2; }
    this.gusts = this.gusts.filter(g => g.life > 0 && g.x < 1300);
    if (!this.won) this.power = Math.max(0, this.power - this.decay * dt);
  },
  draw_blow(ctx, t) {
    this.drawCage(ctx, t); this.drawDragon(ctx, t);
    if (!this.won || G.t - this.wonT < 2) Art.serpent(ctx, this.blowPts(t), t, { open: this.power > 0.4, r: 30 });
    for (const g of this.gusts) { ctx.save(); ctx.globalAlpha = g.life * 0.8; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x + 40, g.y - 18, g.x + 90, g.y); Art.stroke(ctx, 6, '#ffffff'); ctx.restore(); }
    const s = 2 + this.puff * 0.6;
    Art.cloud(ctx, 260, 360, s, '#ffffff', '#c9dcf0');
    Art.ell(ctx, 235, 352, 7, 9, '#2a1650'); Art.ell(ctx, 285, 352, 7, 9, '#2a1650');
    Art.ell(ctx, 315, 375, 12 + this.puff * 30, 10 + this.puff * 20, '#2a1650');
    if (!this.won) { this.bar(ctx, this.power, 'Сила ветра', '#7ec0ff'); if (this.power < 0.05) UI.text(ctx, 'Жми на тучку!', 260, 520, 34, '#fff', 'center', true); }
  },

  // ---------- Кристаллия: ключики к ледяным замкам ----------
  init_locks() {
    const n = this.d >= 4 ? 4 : 3;
    this.cx = 880;
    this.locks = []; for (let i = 0; i < n; i++) this.locks.push({ c: i, x: this.cx + (i - (n - 1) / 2) * 84, y: 340, open: false });
    const order = M.shuffle([...Array(n).keys()]);
    this.keysL = order.map((c, i) => ({ c, hx: 230 + i * 150, hy: 610, x: 230 + i * 150, y: 610, used: false }));
    this.dragK = null; this.wrongT = 0;
    Voice.say('Змей запер клетку на ледяные замки! Перетащи каждый ключик к замку такого же цвета.');
  },
  down_locks(x, y) { for (const k of this.keysL) if (!k.used && Math.hypot(x - k.x, y - k.y) < 60) { this.dragK = k; Sound.pop(1); return; } },
  move_locks(x, y) { if (this.dragK) { this.dragK.x = x; this.dragK.y = y; } },
  up_locks() {
    const k = this.dragK; if (!k) return; this.dragK = null;
    const l = this.locks.find(l => !l.open && Math.hypot(k.x - l.x, k.y - l.y) < 70);
    if (l && l.c === k.c) {
      l.open = true; k.used = true; Sound.chime(1.2); G.burst(l.x, l.y, { kind: 'star', n: 14, speed: 220 });
      if (this.locks.every(l => l.open)) this.win('Ура! Все замки открыты! Клетка открылась!');
      return;
    }
    if (l) { Sound.boing(); if (G.t > this.wrongT) { Voice.say('Этот ключик от другого замка. Посмотри на цвет!'); this.wrongT = G.t + 3; } }
    G.tween(k, { x: k.hx, y: k.hy }, 0.35, G.ease.outBack);
  },
  drawLock(ctx, l, t) {
    const col = LOCK_COLORS[l.c], lift = l.open ? 16 : 0;
    ctx.beginPath(); ctx.arc(l.x, l.y - 18 - lift, 17, Math.PI, 0); Art.stroke(ctx, 8, '#d8e4ef');
    ctx.save(); ctx.globalAlpha = l.open ? 0.5 : 1; Art.rr(ctx, l.x - 28, l.y - 20, 56, 48, 10); ctx.fillStyle = col; ctx.fill(); Art.stroke(ctx, 4); ctx.restore();
    Art.ell(ctx, l.x, l.y + 2, 6, 8, '#2a1650');
  },
  draw_locks(ctx, t) {
    const sp = []; for (let i = 0; i < 24; i++) sp.push([300 - i * 20, 460 + Math.sin(i * 0.5) * 16 + i * 5]);
    if (!this.won || G.t - this.wonT < 2.5) { Art.serpent(ctx, this.awayPts(sp), t, { open: false, r: 34 }); if (!this.won) for (let i = 0; i < 3; i++) UI.text(ctx, 'z', 340 + i * 24, 390 - i * 26 - (t * 20 % 20), 30 + i * 6, '#fff', 'center', true); }
    this.drawCage(ctx, t); this.drawDragon(ctx, t);
    if (this.cage.open < 0.3) for (const l of this.locks) this.drawLock(ctx, l, t);
    for (const k of this.keysL) {
      if (k.used) continue;
      Art.ell(ctx, k.x, k.y, 46, 46, LOCK_COLORS[k.c]); Art.stroke(ctx, 4);
      Art.icon(ctx, 'key', k.x, k.y, 0.9, t);
    }
  },

  // ---------- Радуга: найди, под каким кустиком дракончик ----------
  init_shell() {
    this.slots = [380, 640, 900]; this.bushes = [0, 1, 2].map(i => ({ x: this.slots[i], lift: 0 }));
    this.round = 0; this.rounds = 3; this.under = 1; this.phase = 'show';
    Voice.say('Змей прячет дракончика под кустиками! Следи внимательно и найди, где дракончик.');
    setTimeout(() => this.startRound(), 3500);
  },
  startRound() {
    if (G.scene !== this || this.won) return;
    this.phase = 'show'; this.bushes.forEach(b => b.lift = 0);
    this.bushes[this.under].lift = 1; this.trap = { x: this.bushes[this.under].x, y: 600, s: 0.4 };
    G.wait(1.4, () => {
      if (G.scene !== this) return;
      this.bushes[this.under].lift = 0; this.phase = 'shuffle';
      const n = 2 + this.round + Math.floor(this.d / 2), dur = Math.max(0.35, 0.8 - this.d * 0.05);
      const step = (k) => {
        if (G.scene !== this) return;
        if (k >= n) { this.phase = 'pick'; return; }
        const a = M.ri(0, 2); let b = M.ri(0, 1); if (b >= a) b++;
        const A = this.bushes[a], B = this.bushes[b], ax = A.x, bx = B.x;
        Sound.whoosh();
        G.tween(A, { x: bx }, dur, G.ease.inOutQuad); G.tween(B, { x: ax }, dur, G.ease.inOutQuad, () => step(k + 1));
      };
      step(0);
    });
  },
  down_shell(x, y) {
    if (this.phase !== 'pick' || y < 420) return;
    const i = this.bushes.findIndex(b => Math.abs(x - b.x) < 110);
    if (i < 0) return;
    this.phase = 'reveal';
    const c = this.bushes[this.under]; c.lift = 1; this.trap = { x: c.x, y: 600, s: 0.4 };
    if (i === this.under) {
      Sound.chime(1.2); G.burst(c.x, 520, { kind: 'star', n: 16, speed: 220 });
      this.round++;
      if (this.round >= this.rounds) { this.win('Ура! Ты перехитрил Змея! Дракончик свободен!'); return; }
      Voice.say('Нашёл! Но Змей снова прячет его!');
      setTimeout(() => this.startRound(), 2600);
    } else {
      this.bushes[i].lift = 0.6; Sound.boing();
      Voice.say('Не здесь! Смотри внимательно.');
      setTimeout(() => this.startRound(), 2600);
    }
  },
  draw_shell(ctx, t) {
    const sp = []; const hx = this.phase === 'shuffle' ? 640 + Math.sin(t * 3) * 300 : 640;
    for (let i = 0; i < 26; i++) sp.push([hx + i * 26, 300 + Math.sin(t * 3 - i * 0.5) * 20 - Math.max(0, 10 - i) * 4]);
    if (!this.won || G.t - this.wonT < 2.5) Art.serpent(ctx, this.awayPts(sp), t, { open: this.phase === 'shuffle', r: 32 });
    const showDr = this.won || this.bushes[this.under].lift > 0.5;
    if (showDr) this.drawDragon(ctx, t);
    if (this.free.k > 0) return;
    for (const b of this.bushes) Art.bush(ctx, b.x, 640 - b.lift * 150, 1.9, '#ff7eb6', t);
    if (this.phase === 'pick') UI.text(ctx, 'Где дракончик?', 640, 140, 44, '#fff', 'center', true);
    for (let i = 0; i < this.rounds; i++) Art.heart(ctx, 1000 + i * 50, 52, 40, i < this.round ? '#ffd23f' : 'rgba(255,255,255,0.25)');
  },

  // ---------- Джунгария: битва со Змеем ----------
  init_fight() {
    const d = this.d;
    this.N = 30; this.hpMax = 10 + d; this.hp = this.hpMax; this.lives = 3;
    this.spotLife = Math.max(0.9, 1.7 - d * 0.1);
    this.spots = []; this.spawnT = 1.5; this.angry = 0; this.angryT = 4; this.hitFlash = 0;
    Voice.say('Вот логово Змея! Нажимай на светящиеся чешуйки, чтобы победить его. А когда Змей краснеет и злится — не трогай его голову!');
  },
  fightPts(t) { const out = []; for (let i = 0; i < this.N; i++) { const u = t * 0.75 - i * 0.105; out.push([560 + 380 * Math.sin(u * 0.9), 420 + 170 * Math.sin(u * 1.7)]); } return out; },
  down_fight(x, y) {
    const pts = this.fightPts(G.t);
    if (Math.hypot(x - pts[0][0], y - pts[0][1]) < 60) {
      if (this.angry > 0) {
        this.lives--; Sound.bump(); Voice.say('Ай! Змей злой, не трогай его голову!'); G.burst(x, y, { kind: 'dot', n: 12, colors: ['#ff3b5c'], speed: 200 });
        if (this.lives <= 0) { this.lost = true; Voice.say('Змей слишком силён! Отдохни и попробуй ещё раз. Ключи остались у тебя!'); setTimeout(() => { this.again.hidden = false; }, 1200); }
      } else Sound.boing();
      return;
    }
    for (const s of this.spots) {
      const [px, py] = pts[s.i];
      if (Math.hypot(x - px, y - py) < 52) {
        this.spots.splice(this.spots.indexOf(s), 1);
        this.hp--; this.hitFlash = 0.3; Sound.pop(1.3); Sound.hiss();
        G.burst(px, py, { kind: 'star', n: 14, speed: 240 });
        if (this.hp <= 0) { this.spots = []; this.win('Ура! Змей убежал! Клетка открылась!'); }
        return;
      }
    }
  },
  update_fight(dt) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.won || this.lost) return;
    this.angryT -= dt;
    if (this.angry > 0) this.angry -= dt;
    else if (this.angryT <= 0) { this.angry = 2.2; this.angryT = M.rnd(4, 7); Sound.hiss(); }
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.spots.length < 2) {
      let i; do { i = M.ri(4, this.N - 5); } while (this.spots.some(s => Math.abs(s.i - i) < 5));
      this.spots.push({ i, life: this.spotLife }); this.spawnT = M.rnd(0.5, 1.1);
    }
    for (const s of this.spots) s.life -= dt;
    this.spots = this.spots.filter(s => s.life > 0);
  },
  draw_fight(ctx, t) {
    World.vines(ctx, t);
    this.drawCage(ctx, t); this.drawDragon(ctx, t);
    if (!this.won || G.t - this.wonT < 2.5) {
      const pts = this.awayPts(this.fightPts(t));
      if (this.angry > 0 && !this.won) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 12) * 0.15; Art.ell(ctx, pts[0][0], pts[0][1], 80, 80, '#ff3b5c'); ctx.restore(); }
      Art.serpent(ctx, pts, t, { open: this.angry > 0, r: 40, weak: this.spots.map(s => s.i) });
      if (this.hitFlash > 0) { ctx.save(); ctx.globalAlpha = this.hitFlash; Art.ell(ctx, pts[0][0], pts[0][1], 60, 60, '#ffffff'); ctx.restore(); }
    }
    if (!this.won) {
      this.bar(ctx, this.hp / this.hpMax, 'Сила Змея', '#b07cff');
      for (let i = 0; i < 3; i++) Art.heart(ctx, 960 + i * 46, 50, 40, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    }
  },
};
