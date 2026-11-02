// Спасение Листика: битва со злым Змеем
'use strict';
G.scenes.serpent = {
  enter() {
    const d = S.data.diff;
    this.N = 30; this.hpMax = 10 + d; this.hp = this.hpMax; this.lives = 3;
    this.spotLife = Math.max(0.9, 1.7 - d * 0.1);
    this.spots = []; this.spawnT = 1.5;
    this.angry = 0; this.angryT = 4; this.hitFlash = 0;
    this.won = false; this.lost = false; this.wonT = 0;
    this.cage = { y: 150, open: 0 };
    this.free = { x: 1080, y: 230, k: 0 };
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('home') });
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('serpent') });
    this.homeBig = UI.add(this, { x: 640, y: 250, w: 440, h: 84, label: 'Домой с Листиком!', icon: 'home', iconX: -170, fontSize: 32, color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('home') });
    Sound.hiss();
    Voice.say('Вот логово Змея! Нажимай на светящиеся чешуйки, чтобы победить его. А когда Змей краснеет и злится — не трогай его голову!');
  },
  pts(t) {
    const out = [];
    for (let i = 0; i < this.N; i++) {
      const u = t * 0.75 - i * 0.105;
      out.push([560 + 380 * Math.sin(u * 0.9), 420 + 170 * Math.sin(u * 1.7)]);
    }
    return out;
  },
  down(x, y) {
    if (this.won || this.lost) return;
    const pts = this.pts(G.t);
    // голова
    if (Math.hypot(x - pts[0][0], y - pts[0][1]) < 60) {
      if (this.angry > 0) { this.lives--; Sound.bump(); Voice.say('Ай! Змей злой, не трогай его голову!'); G.burst(x, y, { kind: 'dot', n: 12, colors: ['#ff3b5c'], speed: 200 }); if (this.lives <= 0) this.lose(); }
      else { Sound.boing(); }
      return;
    }
    for (const s of this.spots) {
      const [px, py] = pts[s.i];
      if (Math.hypot(x - px, y - py) < 52) {
        this.spots.splice(this.spots.indexOf(s), 1);
        this.hp--; this.hitFlash = 0.3; Sound.pop(1.3); Sound.hiss();
        G.burst(px, py, { kind: 'star', n: 14, speed: 240 });
        if (this.hp <= 0) this.win();
        return;
      }
    }
  },
  lose() {
    this.lost = true;
    Voice.say('Змей слишком силён! Отдохни и попробуй ещё раз. Ключи остались у тебя!');
    setTimeout(() => { this.again.hidden = false; }, 1200);
  },
  win() {
    this.won = true; this.wonT = G.t; this.spots = [];
    const ps = PS('jungle'); ps.serpent = 'rescued'; S.save(); stat('rescued');
    Sound.win(); Sound.magic();
    Voice.say('Ура! Змей убежал! Клетка открылась — Листик свободен! Ты настоящий герой!');
    G.tween(this.cage, { open: 1 }, 1, G.ease.outBack, null, 1.2);
    G.tween(this.free, { k: 1 }, 1.6, G.ease.inOutQuad, () => { Sound.purr(2, { planet: 'jungle' }); G.burst(640, 520, { kind: 'heart', n: 20, up: true, g: -60, speed: 220 }); }, 2.2);
    for (let i = 0; i < 6; i++) setTimeout(() => G.burst(M.rnd(200, 1100), M.rnd(120, 400), { kind: 'confetti', n: 30, speed: 380 }), 1200 + i * 300);
    setTimeout(() => { this.homeBig.hidden = false; }, 4200);
  },
  update(dt) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.won || this.lost) return;
    this.angryT -= dt;
    if (this.angry > 0) { this.angry -= dt; }
    else if (this.angryT <= 0) { this.angry = 2.2; this.angryT = M.rnd(4, 7); Sound.hiss(); }
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.spots.length < 2) {
      let i; do { i = M.ri(4, this.N - 5); } while (this.spots.some(s => Math.abs(s.i - i) < 5));
      this.spots.push({ i, life: this.spotLife });
      this.spawnT = M.rnd(0.5, 1.1);
    }
    for (const s of this.spots) s.life -= dt;
    this.spots = this.spots.filter(s => s.life > 0);
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { planet: 'jungle', noBeacon: true, noDecor: true });
    const v = G.view; ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#0a1a10'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore();
    World.vines(ctx, t);
    // клетка с Листиком
    const fr = this.free, fx = M.lerp(1080, 760, fr.k), fy = M.lerp(250, 640, fr.k);
    ctx.beginPath(); ctx.moveTo(1080, v.y0); ctx.lineTo(1080, 110); Art.stroke(ctx, 6, '#6a4a2a');
    if (fr.k < 1) Art.dragon(ctx, fx, fy, 0.45, { planet: 'jungle', t, level: PS('jungle').level, happy: this.won, look: -1, flying: fr.k > 0, tilt: this.won ? 0 : 0.2 });
    ctx.save(); ctx.translate(1080, 110);
    ctx.beginPath(); ctx.ellipse(0, 10, 95, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#8a6a3a'; ctx.fill(); Art.stroke(ctx, 4);
    for (let i = -4; i <= 4; i++) { const op = this.cage.open; ctx.save(); ctx.translate(i * 22, 10); ctx.rotate(op * (i < 0 ? -1.2 : 1.2) * (Math.abs(i) / 4)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 170); Art.stroke(ctx, 6, '#c8a050'); ctx.restore(); }
    if (this.cage.open < 0.5) { ctx.beginPath(); ctx.ellipse(0, 180, 95, 14, 0, 0, Math.PI * 2); Art.stroke(ctx, 7, '#8a6a3a'); }
    ctx.restore();
    if (fr.k >= 1) { Art.dragon(ctx, 760, 640, 0.75, { planet: 'jungle', t, happy: true }); Art.astronaut(ctx, 560, 650, 1.05, { t, anim: 'cheer', at: t }); }
    // змей
    if (!this.won || G.t - this.wonT < 2.5) {
      let pts = this.pts(t);
      if (this.won) { const k = (G.t - this.wonT) / 2.5; pts = pts.map(([x, y]) => [x - k * 1200, y + k * 200]); }
      if (this.angry > 0 && !this.won) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 12) * 0.15; Art.ell(ctx, pts[0][0], pts[0][1], 80, 80, '#ff3b5c'); ctx.restore(); }
      Art.serpent(ctx, pts, t, { open: this.angry > 0, r: 40, weak: this.spots.map(s => s.i) });
      if (this.hitFlash > 0) { ctx.save(); ctx.globalAlpha = this.hitFlash; Art.ell(ctx, pts[0][0], pts[0][1], 60, 60, '#ffffff'); ctx.restore(); }
    }
    // полоса силы Змея и жизни
    if (!this.won) {
      UI.progress(ctx, 380, 26, 520, 44, this.hp / this.hpMax, '#b07cff');
      UI.text(ctx, 'Сила Змея', 640, 49, 26, '#fff', 'center', true);
      for (let i = 0; i < 3; i++) Art.heart(ctx, 960 + i * 46, 50, 40, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    }
    if (this.lost && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { },
};
