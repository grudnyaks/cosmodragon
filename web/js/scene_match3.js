// Три в ряд: собирай одинаковые вкусняшки, наполняй животик Дракоши
'use strict';
G.scenes.match3 = {
  N: 6, CS: 96, OX: 90, OY: 118, TYPES: 5,
  enter() {
    this.goal = Math.min(18 + S.data.match * 3, 36);
    this.got = 0; this.state = 'idle'; this.sel = null; this.idle = 0; this.hint = null;
    this.won = false; this.combo = 0; this.fireUsed = false;
    this.dr = { mouth: 0, squash: 0, happy: 0, fire: 0 };
    this.makeBoard();
    this.state = 'busy'; G.wait(1.1, () => { this.state = 'idle'; });
    UI.homeButton(this);
    this.fireBtn = UI.add(this, { x: 1180, y: 420, r: 52, icon: 'fire', color: '#ff9a3c', hidden: !hasAbility('fire'), pulse: true, onTap: () => this.useFire() });
    this.again = UI.add(this, { x: 1000, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('match3') });
    Voice.say('Поменяй местами две вкусняшки, чтобы собрать три одинаковых в ряд!');
  },
  makeBoard() {
    const N = this.N;
    this.g = [];
    for (let c = 0; c < N; c++) {
      this.g[c] = [];
      for (let r = 0; r < N; r++) {
        let ty;
        do { ty = M.ri(0, this.TYPES - 1); }
        while ((c >= 2 && this.g[c - 1][r].ty === ty && this.g[c - 2][r].ty === ty) || (r >= 2 && this.g[c][r - 1].ty === ty && this.g[c][r - 2].ty === ty));
        this.g[c][r] = { ty, x: c, y: r - N - 1 - Math.random(), s: 1, wig: 0 };
        G.tween(this.g[c][r], { y: r }, 0.6 + r * 0.05, G.ease.outBounce, null, c * 0.05);
      }
    }
    if (!this.findMove()) this.makeBoard();
  },
  cellAt(x, y) {
    const c = Math.floor((x - this.OX) / this.CS), r = Math.floor((y - this.OY) / this.CS);
    if (c < 0 || r < 0 || c >= this.N || r >= this.N) return null;
    return { c, r };
  },
  down(x, y) {
    if (this.state !== 'idle' || this.won) return;
    const p = this.cellAt(x, y); if (!p) { this.sel = null; return; }
    this.idle = 0; this.hint = null;
    if (this.sel && Math.abs(this.sel.c - p.c) + Math.abs(this.sel.r - p.r) === 1) { const a = this.sel; this.sel = null; this.trySwap(a, p); return; }
    this.sel = p; this.dragStart = { x, y, p }; Sound.pop(1);
  },
  move(x, y) {
    if (!this.dragStart || this.state !== 'idle') return;
    const dx = x - this.dragStart.x, dy = y - this.dragStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 40) {
      const a = this.dragStart.p; this.dragStart = null;
      const b = Math.abs(dx) > Math.abs(dy) ? { c: a.c + Math.sign(dx), r: a.r } : { c: a.c, r: a.r + Math.sign(dy) };
      if (b.c >= 0 && b.c < this.N && b.r >= 0 && b.r < this.N) { this.sel = null; this.trySwap(a, b); }
    }
  },
  up() { this.dragStart = null; },
  swapData(a, b) { const t = this.g[a.c][a.r]; this.g[a.c][a.r] = this.g[b.c][b.r]; this.g[b.c][b.r] = t; },
  trySwap(a, b) {
    this.state = 'busy';
    const A = this.g[a.c][a.r], B = this.g[b.c][b.r];
    this.swapData(a, b);
    G.tween(A, { x: b.c, y: b.r }, 0.18); G.tween(B, { x: a.c, y: a.r }, 0.18);
    G.wait(0.2, () => {
      if (this.findMatches().length) { this.combo = 0; this.resolve(); }
      else {
        Sound.boing();
        this.swapData(a, b);
        G.tween(A, { x: a.c, y: a.r }, 0.18); G.tween(B, { x: b.c, y: b.r }, 0.18);
        G.wait(0.2, () => { this.state = 'idle'; });
      }
    });
  },
  findMatches() {
    const N = this.N, set = new Set(), g = this.g;
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) {
      const t = g[c][r].ty; let k = c;
      while (k < N && g[k][r].ty === t) k++;
      if (k - c >= 3) { for (let i = c; i < k; i++) set.add(i + ',' + r); }
    }
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) {
      const t = g[c][r].ty; let k = r;
      while (k < N && g[c][k].ty === t) k++;
      if (k - r >= 3) { for (let i = r; i < k; i++) set.add(c + ',' + i); }
    }
    return [...set].map(s => { const [c, r] = s.split(',').map(Number); return { c, r }; });
  },
  resolve(forced) {
    const list = forced || this.findMatches();
    if (!list.length) {
      if (!this.findMove()) this.shuffle();
      this.state = 'idle'; return;
    }
    this.combo++;
    Sound.chime(1 + this.combo * 0.12);
    const mx = 1000, my = 690 - 115 * 0.75;
    let n = 0;
    for (const p of list) {
      const tile = this.g[p.c][p.r];
      tile.dead = true;
      G.tween(tile, { s: 0 }, 0.22, G.ease.inOutQuad);
      const cx = this.OX + (p.c + 0.5) * this.CS, cy = this.OY + (p.r + 0.5) * this.CS;
      G.burst(cx, cy, { kind: 'star', n: 3, speed: 150, size: 10, colors: [Art.TREAT_COLORS[tile.ty], '#fff'] });
      if (n++ < 4) UI.flyTreat(tile.ty, cx, cy, mx, my, n * 0.05, () => { this.dr.mouth = 1; G.tween(this.dr, { mouth: 0 }, 0.3); });
    }
    this.got = Math.min(this.goal, this.got + list.length);
    if (this.combo > 1) G.floatText(this.OX + this.N * this.CS / 2, this.OY + 40, 'Ух ты! x' + this.combo, '#ffd23f');
    G.wait(0.75, () => {
      Sound.chomp(); this.dr.squash = 0.4; G.tween(this.dr, { squash: 0 }, 0.6, G.ease.outElastic);
      if (this.got >= this.goal && !this.won) this.win();
    });
    G.wait(0.25, () => {
      // гравитация
      const N = this.N;
      for (let c = 0; c < N; c++) {
        const col = this.g[c].filter(t => !t.dead);
        const missing = N - col.length;
        const fresh = [];
        for (let i = 0; i < missing; i++) fresh.push({ ty: M.ri(0, this.TYPES - 1), x: c, y: -1 - i, s: 1, wig: 0 });
        const newCol = fresh.reverse().concat(col);
        for (let r = 0; r < N; r++) { this.g[c][r] = newCol[r]; G.tween(newCol[r], { y: r }, 0.32, G.ease.outBounce); }
      }
      G.wait(0.36, () => this.resolve());
    });
  },
  findMove() {
    const N = this.N;
    for (let c = 0; c < N; c++) for (let r = 0; r < N; r++) {
      for (const [dc, dr] of [[1, 0], [0, 1]]) {
        const b = { c: c + dc, r: r + dr }; if (b.c >= N || b.r >= N) continue;
        this.swapData({ c, r }, b);
        const ok = this.findMatches().length > 0;
        this.swapData({ c, r }, b);
        if (ok) return [{ c, r }, b];
      }
    }
    return null;
  },
  shuffle() {
    const all = []; for (const col of this.g) for (const t of col) all.push(t.ty);
    let tries = 0;
    do { M.shuffle(all); let i = 0; for (const col of this.g) for (const t of col) t.ty = all[i++]; tries++; }
    while ((this.findMatches().length || !this.findMove()) && tries < 50);
    if (tries >= 50) for (const col of this.g) for (const t of col) t.ty = M.ri(0, this.TYPES - 1);
    Sound.whoosh();
  },
  useFire() {
    if (this.fireUsed || this.state !== 'idle' || this.won) return;
    this.fireUsed = true; this.fireBtn.hidden = true; this.state = 'busy';
    Sound.fire(); this.dr.fire = 0.01;
    G.tween(this.dr, { fire: 1 }, 0.3, G.ease.outQuad, () => G.tween(this.dr, { fire: 0 }, 0.4, G.ease.linear, null, 0.3));
    const r = M.ri(1, this.N - 2), list = [];
    for (let c = 0; c < this.N; c++) list.push({ c, r });
    for (const p of list) G.burst(this.OX + (p.c + 0.5) * this.CS, this.OY + (r + 0.5) * this.CS, { kind: 'dot', n: 6, colors: ['#ffd23f', '#ff9a3c', '#ff6ab0'], speed: 200 });
    Voice.say('Огонёк!');
    G.wait(0.4, () => { this.combo = 0; this.resolve(list); });
  },
  win() {
    this.won = true;
    S.data.match++; S.save();
    Sound.win(); Sound.purr(1.5); this.dr.happy = 4;
    UI.reward(6, 1000, 500);
    for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(200, 1100), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    Voice.say('Ура! Животик Дракоши полный! Ты молодец!');
    setTimeout(() => { this.again.hidden = false; }, 1500);
  },
  update(dt) {
    this.dr.happy = Math.max(0, this.dr.happy - dt);
    if (this.state === 'idle' && !this.won) {
      this.idle += dt;
      if (this.idle > 6 && !this.hint) this.hint = this.findMove();
    }
  },
  draw(ctx) {
    const t = G.t, { N, CS, OX, OY } = this;
    Art.sky(ctx, '#2b1a6e', '#7a4bc4', '#ff9ad5');
    Art.stars(ctx, 31, 60, t);
    Art.rr(ctx, OX - 16, OY - 16, N * CS + 32, N * CS + 32, 30); ctx.fillStyle = 'rgba(255,240,250,0.92)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    for (let c = 0; c < N; c++) for (let r = 0; r < N; r++) {
      Art.rr(ctx, OX + c * CS + 4, OY + r * CS + 4, CS - 8, CS - 8, 18);
      ctx.fillStyle = (c + r) % 2 ? '#f6e6ff' : '#ffe9f4'; ctx.fill();
    }
    ctx.save(); ctx.beginPath(); ctx.rect(OX - 10, OY - 10, N * CS + 20, N * CS + 20); ctx.clip();
    for (let c = 0; c < N; c++) for (let r = 0; r < N; r++) {
      const tile = this.g[c][r]; if (!tile) continue;
      let x = OX + (tile.x + 0.5) * CS, y = OY + (tile.y + 0.5) * CS, s = tile.s * 0.82;
      const isSel = this.sel && this.sel.c === c && this.sel.r === r;
      const isHint = this.hint && this.hint.some(h => h.c === c && h.r === r);
      if (isSel) { Art.rr(ctx, OX + c * CS + 2, OY + r * CS + 2, CS - 4, CS - 4, 18); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); s *= 1.1 + Math.sin(t * 10) * 0.04; }
      if (isHint) { x += Math.sin(t * 18) * 4; s *= 1 + Math.sin(t * 6) * 0.08; }
      if (s > 0.01) Art.treat(ctx, tile.ty, x, y, s, t);
    }
    ctx.restore();
    // Дракоша и животик-прогресс
    const lvl = S.data.level;
    Art.dragon(ctx, 1000, 690, 0.75, { t, level: lvl, mouth: this.dr.mouth, squash: this.dr.squash, happy: this.dr.happy > 0, look: -0.8, fire: this.dr.fire, blink: (t % 3.2 < 0.13) ? 1 : 0 });
    UI.progress(ctx, 800, 170, 400, 46, this.got / this.goal, '#ff7eb6');
    Art.treat(ctx, 0, 800, 192, 0.6);
    UI.text(ctx, this.got + ' / ' + this.goal, 1000, 194, 30, '#fff', 'center', true);
    if (this.dr.fire > 0) { // огонь по ряду
      ctx.save(); ctx.globalAlpha = this.dr.fire * 0.5; ctx.fillStyle = '#ffb23a'; ctx.fillRect(OX, OY, N * CS, N * CS); ctx.restore();
    }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); if (this.won && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 1000, 235, 44, '#fff', 'center', true); },
};
