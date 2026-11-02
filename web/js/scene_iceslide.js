// Ледяная горка: дракончик скользит по льду до препятствия. Доберись до звезды за меньшее число ходов!
'use strict';
G.scenes.iceslide = {
  enter() {
    const lvl = GL('iceslide');
    this.W = Math.min(6 + Math.floor(lvl / 2), 11); this.H = Math.min(5 + Math.floor(lvl / 3), 8);
    this.minMoves = Math.min(2 + Math.floor(lvl / 2), 9);
    this.cs = Math.floor(Math.min(820 / this.W, 520 / this.H));
    this.ox = 560 - this.W * this.cs / 2; this.oy = 140 + (540 - this.H * this.cs) / 2;
    this.gen();
    this.pl = { c: this.start.c, r: this.start.r, x: this.start.c, y: this.start.r };
    this.moves = 0; this.sliding = false; this.won = false; this.got = 0;
    UI.homeButton(this);
    const ax = 1150, ay = 470;
    [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']].forEach(([dc, dr]) => UI.add(this, { x: ax + dc * 80, y: ay + dr * 80, r: 36, color: '#4fb7ff',
      draw: (ctx) => { ctx.save(); ctx.rotate(Math.atan2(dr, dc)); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -16); ctx.lineTo(-10, 16); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); Art.stroke(ctx, 3); ctx.restore(); },
      onTap: () => this.slide(dc, dr) }));
    UI.add(this, { x: ax, y: ay, r: 30, icon: 'replay', color: '#ff9a3c', iconScale: 0.8, onTap: () => this.restart() });
    this.again = UI.add(this, { x: 560, y: 360, r: 70, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('iceslide') });
    Voice.say('Смахни пальцем или нажми стрелку — дракончик будет скользить, пока не упрётся. Доберись до звезды!');
  },
  gen() {
    for (let tries = 0; tries < 400; tries++) {
      const need = tries > 300 ? 2 : this.minMoves;
      const rock = [];
      for (let c = 0; c < this.W; c++) { rock[c] = []; for (let r = 0; r < this.H; r++) rock[c][r] = Math.random() < 0.2; }
      const free = []; for (let c = 0; c < this.W; c++) for (let r = 0; r < this.H; r++) if (!rock[c][r]) free.push({ c, r });
      if (free.length < 6) continue;
      const start = M.pick(free), goal = M.pick(free);
      if (start === goal) continue;
      this.rock = rock;
      const res = this.solve(start, goal);
      if (res && res.length >= need && res.length <= need + 6) {
        this.start = start; this.goal = goal; this.opt = res.length;
        this.fish = M.shuffle(free.filter(f => f !== start && f !== goal)).slice(0, 2).map(f => ({ c: f.c, r: f.r, got: false }));
        return;
      }
    }
    // запасной простой уровень
    this.rock = []; for (let c = 0; c < this.W; c++) { this.rock[c] = []; for (let r = 0; r < this.H; r++) this.rock[c][r] = false; }
    this.start = { c: 0, r: 0 }; this.goal = { c: this.W - 1, r: this.H - 1 }; this.opt = 2; this.fish = [];
  },
  // куда приедем из клетки c,r в направлении dc,dr (лёд: до упора; звезда останавливает)
  dest(c, r, dc, dr, goal) {
    while (true) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= this.W || nr >= this.H || this.rock[nc][nr]) return { c, r };
      c = nc; r = nr;
      if (goal && c === goal.c && r === goal.r) return { c, r };
    }
  },
  solve(s, g) {
    const key = (c, r) => c * 100 + r, prev = new Map([[key(s.c, s.r), null]]), q = [s];
    while (q.length) {
      const cur = q.shift();
      if (cur.c === g.c && cur.r === g.r) { const path = []; let k = key(cur.c, cur.r); while (prev.get(k)) { path.push(k); k = prev.get(k); } return path; }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const d = this.dest(cur.c, cur.r, dc, dr, g), k = key(d.c, d.r);
        if (!prev.has(k)) { prev.set(k, key(cur.c, cur.r)); q.push(d); }
      }
    }
    return null;
  },
  restart() { if (this.won) return; this.pl = { c: this.start.c, r: this.start.r, x: this.start.c, y: this.start.r }; this.moves = 0; this.fish.forEach(f => { if (f.got) { f.got = false; this.got--; } }); Sound.whoosh(); },
  down(x, y) { this.sw = { x, y }; },
  up(x, y) {
    if (!this.sw) return; const dx = x - this.sw.x, dy = y - this.sw.y; this.sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) this.slide(Math.sign(dx), 0); else this.slide(0, Math.sign(dy));
  },
  slide(dc, dr) {
    if (this.sliding || this.won) return;
    const p = this.pl, d = this.dest(p.c, p.r, dc, dr, this.goal);
    if (d.c === p.c && d.r === p.r) { Sound.boing(); return; }
    // рыбки по пути
    let c = p.c, r = p.r;
    while (c !== d.c || r !== d.r) { c += dc; r += dr; for (const f of this.fish) if (!f.got && f.c === c && f.r === r) { f.got = true; this.got++; Sound.chime(1.3); } }
    this.moves++; this.sliding = true; Sound.whoosh();
    const dist = Math.abs(d.c - p.c) + Math.abs(d.r - p.r);
    p.c = d.c; p.r = d.r;
    G.tween(p, { x: d.c, y: d.r }, 0.08 + dist * 0.07, G.ease.outQuad, () => {
      this.sliding = false; Sound.pop(0.7);
      if (p.c === this.goal.c && p.r === this.goal.r) this.win();
    });
  },
  win() {
    this.won = true; GW('iceslide'); Sound.win(); Sound.purr(1.3);
    const bonus = Math.max(0, this.opt + 2 - this.moves);
    UI.reward(3 + bonus + this.got * 2, this.ox + (this.goal.c + 0.5) * this.cs, this.oy + (this.goal.r + 0.5) * this.cs);
    Voice.say(this.moves <= this.opt ? 'Ура! Самый короткий путь! Ты настоящий мастер!' : 'Ура! Дракончик добрался до звезды!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  draw(ctx) {
    const t = G.t, { W, H, cs, ox, oy } = this;
    World.calm(ctx, t, 0.35);
    Art.rr(ctx, ox - 12, oy - 12, W * cs + 24, H * cs + 24, 18); ctx.fillStyle = '#e8f8ff'; ctx.fill(); Art.stroke(ctx, 5);
    for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) {
      const x = ox + c * cs, y = oy + r * cs;
      ctx.fillStyle = (c + r) % 2 ? '#d6f2ff' : '#c6eafc'; ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x + cs * 0.2, y + cs * 0.3); ctx.lineTo(x + cs * 0.45, y + cs * 0.15); Art.stroke(ctx, 2, '#ffffff'); ctx.restore();
      if (this.rock[c][r]) Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(x + cs * 0.5, y + cs * 0.08); ctx.lineTo(x + cs * 0.9, y + cs * 0.45); ctx.lineTo(x + cs * 0.78, y + cs * 0.92); ctx.lineTo(x + cs * 0.2, y + cs * 0.92); ctx.lineTo(x + cs * 0.1, y + cs * 0.4); ctx.closePath(); }, '#7fbfe8', '#3a7ab8', '#ffffff', 3.5, cs * 0.12);
    }
    for (const f of this.fish) if (!f.got) Art.treat(ctx, 1, ox + (f.c + 0.5) * cs, oy + (f.r + 0.5) * cs, cs / 110, t);
    const gx = ox + (this.goal.c + 0.5) * cs, gy = oy + (this.goal.r + 0.5) * cs;
    ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.2; Art.ell(ctx, gx, gy, cs * 0.5, cs * 0.5, '#fff3a0'); ctx.restore();
    Art.roundStar(ctx, gx, gy, cs * 0.32, '#ffd23f', '#2a1650');
    const p = this.pl;
    Art.dragon(ctx, ox + (p.x + 0.5) * cs, oy + (p.y + 0.9) * cs, cs / 300, { t, happy: this.won, flying: this.sliding });
    UI.text(ctx, 'Ходы: ' + this.moves + '   (лучше всего: ' + this.opt + ')', 560, 105, 26, '#fff', 'center', true);
    if (this.won && !this.again.hidden) UI.text(ctx, 'Дальше!', 560, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
