// Пишем буквы и цифры: обведи пальцем по пунктиру, начиная с зелёной точки
'use strict';
G.scenes.trace = {
  W: 300, H: 400,
  enter(args) {
    this.kind = args.kind || 'L';
    this.list = this.kind === 'L' ? LETTER_ORDER.slice(0, Math.max(6, Learn.data().openL)) : '0123456789'.split('');
    this.i = args.i != null ? args.i : this.firstNew();
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('school') });
    UI.add(this, { x: 150, y: 400, r: 52, color: '#8f6cf2', draw: (ctx) => { ctx.save(); ctx.scale(-1, 1); Art.icon(ctx, 'next', 0, 0, 1); ctx.restore(); }, onTap: () => this.go(-1) });
    UI.add(this, { x: 1130, y: 400, r: 52, icon: 'next', color: '#8f6cf2', onTap: () => this.go(1) });
    UI.add(this, { x: 1130, y: 560, r: 40, icon: 'replay', color: '#ff9a3c', iconScale: 0.8, onTap: () => this.load() });
    this.load();
  },
  firstNew() { const i = this.list.findIndex(g => (Learn.data().T || {})[g] == null); return Math.max(0, i); },
  go(d) { this.i = (this.i + d + this.list.length) % this.list.length; Sound.whoosh(); this.load(); },
  load() {
    const g = this.list[this.i];
    this.g = g; this.ox = 640 - this.W / 2; this.oy = 160;
    this.strokes = Glyph[g].map(st => st.map(([x, y]) => [this.ox + x * this.W, this.oy + y * this.H]));
    this.si = 0; this.pi = 0; this.done = false; this.drawing = false; this.loadT = G.t;
    const say = this.kind === 'L' ? 'Напиши букву ' + LETTERS[g][0] + '. Начни с зелёной точки!' : 'Напиши цифру ' + numWord(+g) + '. Начни с зелёной точки!';
    Voice.say(say);
  },
  near(x, y, p, tol) { return Math.hypot(x - p[0], y - p[1]) < tol; },
  down(x, y) {
    if (this.done) return;
    const st = this.strokes[this.si];
    if (this.pi === 0) { if (this.near(x, y, st[0], 60)) { this.drawing = true; this.pi = 1; Sound.pop(1); } else { this.hintT = G.t; } }
    else if (this.near(x, y, st[Math.min(this.pi, st.length - 1)], 60)) this.drawing = true;
  },
  move(x, y) {
    if (!this.drawing || this.done) return;
    const st = this.strokes[this.si];
    // продвигаемся вперёд, если палец рядом с одной из следующих точек
    for (let k = Math.min(st.length - 1, this.pi + 8); k >= this.pi; k--) {
      if (this.near(x, y, st[k], 46)) { this.pi = k + 1; break; }
    }
    if (Math.random() < 0.15) G.burst(x, y, { kind: 'star', n: 1, speed: 40, size: 8, g: 0, life: 0.5 });
    if (this.pi >= st.length) this.strokeDone();
  },
  up() { this.drawing = false; },
  strokeDone() {
    this.drawing = false; Sound.chime(1 + this.si * 0.15);
    this.si++; this.pi = 0;
    if (this.si >= this.strokes.length) return this.win();
    Voice.say(M.pick(['Так! Теперь следующую линию.', 'Отлично! Ещё одна линия.', 'Хорошо! Дальше от зелёной точки.']));
  },
  win() {
    this.done = true; this.doneT = G.t;
    const T = Learn.data().T || (Learn.data().T = {});
    T[this.g] = (T[this.g] || 0) + 1; S.save(); stat('traced');
    if (T[this.g] === 1) UI.reward(1, 640, 300);
    Sound.win(); Sound.purr(1.2);
    G.burst(640, 360, { kind: 'star', n: 30, speed: 320 });
    Voice.say((this.kind === 'L' ? 'Ура! Ты написал букву ' + LETTERS[this.g][0] + '!' : 'Ура! Ты написал цифру ' + numWord(+this.g) + '!') + ' Дальше — стрелка.');
    if (Object.keys(T).length % 5 === 0 && T[this.g] === 1) GW('trace');
  },
  path(ctx, pts, n) { ctx.beginPath(); pts.slice(0, n).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.45);
    Art.rr(ctx, this.ox - 70, this.oy - 70, this.W + 140, this.H + 120, 30); ctx.fillStyle = '#2f5a48'; ctx.fill(); Art.stroke(ctx, 8, '#8a5a2a');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // широкая дорожка и пунктир
    for (const st of this.strokes) { this.path(ctx, st); ctx.lineWidth = 46; ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.stroke(); }
    ctx.save(); ctx.setLineDash([4, 16]); for (const st of this.strokes) { this.path(ctx, st); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); } ctx.restore();
    // написанное
    const done = this.done ? this.strokes.length : this.si;
    const gold = this.done ? '#ffd23f' : '#ff9ad5';
    for (let s = 0; s < done; s++) { this.path(ctx, this.strokes[s]); ctx.lineWidth = 30; ctx.strokeStyle = gold; ctx.stroke(); }
    if (!this.done && this.pi > 1) { this.path(ctx, this.strokes[this.si], this.pi); ctx.lineWidth = 30; ctx.strokeStyle = '#ffb3e0'; ctx.stroke(); }
    // зелёная точка старта и стрелка направления
    if (!this.done) {
      const st = this.strokes[this.si], p = st[Math.min(this.pi, st.length - 1)], q = st[Math.min(this.pi + 3, st.length - 1)];
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      Art.ell(ctx, p[0], p[1], 20 * pulse, 20 * pulse, '#41d982'); Art.stroke(ctx, 4, '#ffffff');
      if (q !== p) { const a = Math.atan2(q[1] - p[1], q[0] - p[0]); ctx.save(); ctx.translate(p[0] + Math.cos(a) * 34, p[1] + Math.sin(a) * 34); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore(); }
      UI.text(ctx, (this.si + 1) + '-я линия из ' + this.strokes.length, 640, 120, 24, '#cfe8da', 'center', false);
    }
    // образец рядом
    UI.text(ctx, this.kind === 'L' ? this.g + this.g.toLowerCase() : this.g, 280, 250, 90, 'rgba(255,255,255,0.85)', 'center', false);
    if (this.kind === 'L') { ctx.save(); ctx.font = '80px "Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LETTERS[this.g][2], 1000, 250); ctx.restore(); UI.text(ctx, LETTERS[this.g][1], 1000, 330, 32, '#fff', 'center', true); }
    else { const n = +this.g; for (let k = 0; k < n; k++) Art.treat(ctx, k % 6, 950 + (k % 3) * 56, 200 + Math.floor(k / 3) * 56, 0.5, t); }
    const T = (Learn.data().T || {})[this.g]; if (T) Art.roundStar(ctx, this.ox + this.W + 40, this.oy - 40, 22, '#ffd23f', '#1a1030');
    Art.dragon(ctx, 1000, 700, 0.42, { t, happy: this.done, look: -1 });
    UI.text(ctx, (this.i + 1) + ' / ' + this.list.length, 640, 680, 24, '#fff', 'center', true);
    if (this.done) { const k = Math.min(1, (t - this.doneT) * 3); ctx.save(); ctx.globalAlpha = k; UI.text(ctx, 'Молодец!', 640, 620, 50, '#ffd23f', 'center', true); ctx.restore(); }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
