// Лабиринт: проведи дракончика пальцем к сундуку, собирая вкусняшки
'use strict';
G.scenes.maze = {
  enter() {
    const lvl = GL('maze');
    this.cols = Math.min(5 + Math.floor(lvl / 2), 12);
    this.rows = Math.min(3 + Math.floor(lvl / 3), 7);
    this.cs = Math.floor(Math.min(1060 / this.cols, 540 / this.rows));
    this.ox = 640 - this.cols * this.cs / 2; this.oy = 140 + (560 - this.rows * this.cs) / 2;
    this.gen();
    this.pl = { c: 0, r: 0, x: 0, y: 0 };
    this.goal = { c: this.cols - 1, r: this.rows - 1 };
    this.items = [];
    const cells = [];
    for (let c = 0; c < this.cols; c++) for (let r = 0; r < this.rows; r++) if ((c || r) && !(c === this.goal.c && r === this.goal.r)) cells.push({ c, r });
    M.shuffle(cells);
    for (let i = 0; i < Math.min(3 + Math.floor(lvl / 4), 6); i++) this.items.push(Object.assign({ got: false, ty: M.ri(0, 5) }, cells[i]));
    this.enemies = [];
    if (lvl >= 6) for (let i = 0; i < Math.min(1 + Math.floor((lvl - 6) / 4), 3); i++) {
      const c0 = cells[cells.length - 1 - i];
      this.enemies.push({ c: c0.c, r: c0.r, x: c0.c, y: c0.r, from: null, t: 0, speed: Math.max(0.45, 0.9 - lvl * 0.02) });
    }
    this.dark = lvl >= 8;
    this.light = hasAbility('glow') ? 2.6 : 1.6;
    this.hintT = hasAbility('glow') ? 3 : 0;
    this.hint = this.path(0, 0, this.goal.c, this.goal.r);
    this.got = 0; this.won = false; this.bumpT = 0;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'next', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('maze') });
    Voice.say(this.dark ? 'В лабиринте темно! Веди дракончика пальцем к сундуку.' : 'Проведи дракончика пальцем по дорожкам к сундуку. Собирай вкусняшки!');
  },
  // стены: walls[c][r] = {r: правая, b: нижняя}
  gen() {
    const C = this.cols, R = this.rows;
    this.walls = []; const seen = [];
    for (let c = 0; c < C; c++) { this.walls[c] = []; seen[c] = []; for (let r = 0; r < R; r++) { this.walls[c][r] = { r: true, b: true }; seen[c][r] = false; } }
    const st = [[0, 0]]; seen[0][0] = true;
    while (st.length) {
      const [c, r] = st[st.length - 1];
      const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < R && !seen[a][b]);
      if (!nb.length) { st.pop(); continue; }
      const [a, b] = M.pick(nb);
      if (a > c) this.walls[c][r].r = false; else if (a < c) this.walls[a][b].r = false;
      else if (b > r) this.walls[c][r].b = false; else this.walls[a][b].b = false;
      seen[a][b] = true; st.push([a, b]);
    }
    // немного петель, чтобы было веселее
    for (let i = 0; i < Math.floor(C * R / 10); i++) { const c = M.ri(0, C - 2), r = M.ri(0, R - 1); this.walls[c][r].r = false; }
  },
  open(c, r, dc, dr) {
    if (dc === 1) return c < this.cols - 1 && !this.walls[c][r].r;
    if (dc === -1) return c > 0 && !this.walls[c - 1][r].r;
    if (dr === 1) return r < this.rows - 1 && !this.walls[c][r].b;
    if (dr === -1) return r > 0 && !this.walls[c][r - 1].b;
    return false;
  },
  path(c0, r0, c1, r1) {
    const prev = {}, q = [[c0, r0]], key = (c, r) => c + ',' + r; prev[key(c0, r0)] = null;
    while (q.length) {
      const [c, r] = q.shift();
      if (c === c1 && r === r1) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.open(c, r, dc, dr) && !(key(c + dc, r + dr) in prev)) { prev[key(c + dc, r + dr)] = [c, r]; q.push([c + dc, r + dr]); }
    }
    const out = []; let cur = [c1, r1];
    while (cur) { out.unshift(cur); cur = prev[key(cur[0], cur[1])]; }
    return out;
  },
  cellAt(x, y) { return { c: Math.floor((x - this.ox) / this.cs), r: Math.floor((y - this.oy) / this.cs) }; },
  down(x, y) { this.drag = true; this.move(x, y); },
  up() { this.drag = false; },
  move(x, y) {
    if (!this.drag || this.won || this.bumpT > 0) return;
    const p = this.pl, cell = this.cellAt(x, y);
    const dc = Math.sign(cell.c - p.c), dr = Math.sign(cell.r - p.r);
    // шагаем по одной клетке в сторону пальца (сначала по большей разнице)
    const tries = Math.abs(cell.c - p.c) >= Math.abs(cell.r - p.r) ? [[dc, 0], [0, dr]] : [[0, dr], [dc, 0]];
    for (const [a, b] of tries) {
      if ((a || b) && this.open(p.c, p.r, a, b)) { p.c += a; p.r += b; this.step(); if (cell.c !== p.c || cell.r !== p.r) this.move(x, y); return; }
    }
  },
  step() {
    Sound.pop(0.7 + Math.random() * 0.2);
    for (const it of this.items) if (!it.got && it.c === this.pl.c && it.r === this.pl.r) {
      it.got = true; this.got++; Sound.chime(1.1);
      G.burst(this.ox + (it.c + 0.5) * this.cs, this.oy + (it.r + 0.5) * this.cs, { kind: 'star', n: 8, speed: 150, size: 10 });
    }
    if (this.pl.c === this.goal.c && this.pl.r === this.goal.r) this.win();
  },
  win() {
    this.won = true; GW('maze');
    Sound.win(); Sound.purr(1.4);
    UI.reward(3 + this.got + Math.floor(this.cols * this.rows / 25), this.ox + (this.goal.c + 0.5) * this.cs, this.oy + (this.goal.r + 0.5) * this.cs);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say(M.pick(['Ура! Сундук найден!', 'Молодец, ты прошёл лабиринт!', 'Отлично! Вот это путешествие!']));
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  update(dt) {
    const p = this.pl;
    p.x += (p.c - p.x) * Math.min(1, dt * 14); p.y += (p.r - p.y) * Math.min(1, dt * 14);
    this.hintT = Math.max(0, this.hintT - dt); this.bumpT = Math.max(0, this.bumpT - dt);
    if (this.won) return;
    for (const e of this.enemies) {
      e.t += dt;
      if (e.t >= e.speed) {
        e.t = 0;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => this.open(e.c, e.r, a, b) && !(e.from && e.from[0] === e.c + a && e.from[1] === e.r + b));
        const ch = opts.length ? M.pick(opts) : (e.from ? [e.from[0] - e.c, e.from[1] - e.r] : [0, 0]);
        e.from = [e.c, e.r]; e.c += ch[0]; e.r += ch[1];
      }
      e.x += (e.c - e.x) * Math.min(1, dt * 8); e.y += (e.r - e.y) * Math.min(1, dt * 8);
      if (this.bumpT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < 0.5) {
        this.bumpT = 1; Sound.bump(); Voice.say('Ой! Обратно к началу!');
        G.burst(this.ox + (p.x + 0.5) * this.cs, this.oy + (p.y + 0.5) * this.cs, { kind: 'star', n: 10, speed: 200 });
        p.c = 0; p.r = 0; this.drag = false;
      }
    }
  },
  draw(ctx) {
    const t = G.t, { cols, rows, cs, ox, oy } = this;
    World.calm(ctx, t, 0.45);
    const pd = P();
    Art.rr(ctx, ox - 14, oy - 14, cols * cs + 28, rows * cs + 28, 20); ctx.fillStyle = Art.mix(pd.ground[0], '#ffffff', 0.35); ctx.fill(); Art.stroke(ctx, 5);
    // подсказка
    if (this.hintT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.hintT); ctx.setLineDash([8, 10]); ctx.beginPath();
      this.hint.forEach(([c, r], i) => { const x = ox + (c + 0.5) * cs, y = oy + (r + 0.5) * cs; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      Art.stroke(ctx, 6, '#ffd23f'); ctx.setLineDash([]); ctx.restore();
    }
    // стены
    ctx.lineCap = 'round';
    const wallC = Art.mix(pd.ground[2], '#1a1030', 0.3);
    ctx.beginPath();
    ctx.rect(ox, oy, cols * cs, rows * cs);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const w = this.walls[c][r], x = ox + c * cs, y = oy + r * cs;
      if (w.r && c < cols - 1) { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); }
      if (w.b && r < rows - 1) { ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); }
    }
    Art.stroke(ctx, Math.max(8, cs * 0.16), '#1a1030'); ctx.stroke(); ctx.lineWidth = Math.max(4, cs * 0.1); ctx.strokeStyle = wallC; ctx.stroke();
    // вкусняшки и сундук
    for (const it of this.items) if (!it.got) Art.treat(ctx, it.ty, ox + (it.c + 0.5) * cs, oy + (it.r + 0.5) * cs, cs / 110, t);
    Art.chest(ctx, ox + (this.goal.c + 0.5) * cs, oy + (this.goal.r + 0.85) * cs, cs / 130, this.won, t);
    for (const e of this.enemies) Art.obstacle(ctx, null, ox + (e.x + 0.5) * cs, oy + (e.y + 0.5) * cs, cs * 0.3, t * 2, t, 3);
    // игрок
    const px = ox + (this.pl.x + 0.5) * cs, py = oy + (this.pl.y + 0.5) * cs;
    if (!(this.bumpT > 0 && Math.sin(t * 30) > 0)) Art.dragon(ctx, px, py + cs * 0.4, cs / 430, { t, happy: this.won, blink: (t % 3 < 0.12) ? 1 : 0 });
    // темнота
    if (this.dark && !this.won) {
      const v = G.view, R = this.light * cs;
      ctx.save();
      const g = ctx.createRadialGradient(px, py, R * 0.4, px, py, R);
      g.addColorStop(0, 'rgba(10,5,30,0)'); g.addColorStop(1, 'rgba(10,5,30,0.93)');
      ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      ctx.restore();
      Art.chest(ctx, ox + (this.goal.c + 0.5) * cs, oy + (this.goal.r + 0.85) * cs, cs / 130, false, t);
    }
    UI.text(ctx, 'Вкусняшки: ' + this.got + ' / ' + this.items.length, 640, 100, 28, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if (this.won && !this.again.hidden) UI.text(ctx, 'Дальше!', 640, 260, 48, '#fff', 'center', true); },
};
