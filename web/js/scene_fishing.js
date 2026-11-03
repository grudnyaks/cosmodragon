// Рыбалка: води лодку пальцем, нажми — крючок опустится. Лови рыбок, а медуз не трогай!
'use strict';
G.scenes.fishing = {
  SURF: 250,
  enter() {
    const lvl = GL('fishing');
    this.need = Math.min(8 + lvl, 22); this.time = 60; this.score = 0; this.lives = 3;
    this.fishSpeed = Math.min(70 + lvl * 9, 200); this.jellyP = Math.min(0.15 + lvl * 0.025, 0.38);
    this.boat = { x: 640, tx: 640 };
    this.hook = { y: 0, state: 'up', catch: null };
    this.fish = []; this.spawnT = 0;
    for (let i = 0; i < 6; i++) this.spawn(true);
    this.won = false; this.over = false;
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 360, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('fishing') });
    Voice.say('Води лодку пальцем, а чтобы закинуть крючок — нажми! Лови рыбок. Золотая рыбка — три очка. Медуз не лови!');
  },
  spawn(init) {
    const dir = Math.random() < 0.5 ? 1 : -1, r = Math.random();
    const kind = r < this.jellyP ? 'jelly' : r < this.jellyP + 0.12 ? 'gold' : 'fish';
    this.fish.push({ kind, dir, x: init ? M.rnd(150, 1130) : (dir > 0 ? G.view.x0 - 60 : G.view.x1 + 60), y: M.rnd(this.SURF + 90, 660),
      sp: this.fishSpeed * M.rnd(0.7, 1.3) * (kind === 'gold' ? 1.4 : kind === 'jelly' ? 0.6 : 1), ph: Math.random() * 6, ty: M.ri(0, 5) });
  },
  down(x, y) { if (this.won || this.over) return; this.boat.tx = x; this.downT = G.t; this.downX = x; },
  move(x) { this.boat.tx = x; },
  up(x) {
    if (this.won || this.over) return;
    if (G.t - this.downT < 0.3 && Math.abs(x - this.downX) < 30 && this.hook.state === 'up') { this.hook.state = 'down'; Sound.whoosh(); }
  },
  update(dt) {
    const b = this.boat, h = this.hook;
    b.x += (M.clamp(b.tx, 120, 1160) - b.x) * Math.min(1, dt * 5);
    for (const f of this.fish) { if (f === h.catch) continue; f.x += f.dir * f.sp * dt; f.y += Math.sin(G.t * 2 + f.ph) * 12 * dt; }
    this.fish = this.fish.filter(f => f === h.catch || (f.x > G.view.x0 - 100 && f.x < G.view.x1 + 100));
    if (!this.won && !this.over) {
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; this.over = true; Voice.say('Время вышло! Попробуй ещё раз!'); UI.reward(Math.floor(this.score / 3), 640, 400); setTimeout(() => { this.again.hidden = false; }, 1200); }
      this.spawnT -= dt; if (this.spawnT <= 0 && this.fish.length < 9) { this.spawn(false); this.spawnT = M.rnd(0.5, 1.1); }
    }
    // крючок
    if (h.state === 'down') {
      h.y += 520 * dt;
      const hx = b.x + 40, hy = this.SURF + h.y;
      for (const f of this.fish) if (Math.hypot(f.x - hx, f.y - hy) < 44) { h.catch = f; h.state = 'reel'; Sound.pop(1.1); break; }
      if (hy > 690) h.state = 'reel';
    } else if (h.state === 'reel') {
      h.y -= (h.catch ? 420 : 700) * dt;
      if (h.catch) { h.catch.x = b.x + 40; h.catch.y = this.SURF + h.y + 26; }
      if (h.y <= 0) { h.y = 0; h.state = 'up'; if (h.catch) this.landed(h.catch); h.catch = null; }
    }
  },
  landed(f) {
    this.fish.splice(this.fish.indexOf(f), 1);
    if (f.kind === 'jelly') {
      this.lives--; Sound.bump(); G.burst(this.boat.x, this.SURF - 40, { kind: 'dot', n: 14, colors: ['#ff7ad8', '#ffe14a'], speed: 220 });
      Voice.say('Ой! Медуза щиплется!');
      if (this.lives <= 0) { this.over = true; Voice.say('Медузы победили! Попробуй ещё раз.'); UI.reward(Math.floor(this.score / 3), 640, 400); setTimeout(() => { this.again.hidden = false; }, 1200); }
      return;
    }
    const pts = f.kind === 'gold' ? 3 : 1;
    this.score += pts; Sound.chime(f.kind === 'gold' ? 1.5 : 1.1);
    G.floatText(this.boat.x, this.SURF - 80, '+' + pts, '#ffd23f');
    G.burst(this.boat.x, this.SURF - 40, { kind: 'star', n: f.kind === 'gold' ? 20 : 8, speed: 200 });
    if (this.score >= this.need && !this.won) this.win();
  },
  win() {
    this.won = true; GW('fishing'); Sound.win(); Sound.purr(1.4);
    UI.reward(5 + Math.floor(this.need / 5), 640, 300);
    Voice.say('Ура! Отличный улов!');
    setTimeout(() => { this.again.hidden = false; }, 1400);
  },
  drawFish(ctx, f, t) {
    ctx.save(); ctx.translate(f.x, f.y); if (f.dir < 0) ctx.scale(-1, 1);
    if (f.kind === 'jelly') { ctx.scale(-1, 1); Art.obstacle(ctx, 'jelly', 0, 0, 34, 0, t); ctx.restore(); return; }
    const c = f.kind === 'gold' ? ['#ffd23f', '#d89a10'] : [['#ff9a3c', '#d8601a'], ['#4fb7ff', '#2a7ad8'], ['#ff7eb6', '#c83a8a'], ['#41d982', '#1f9a5a']][f.ty % 4];
    const wig = Math.sin(t * 10 + f.ph) * 0.25;
    ctx.save(); ctx.translate(-30, 0); ctx.rotate(wig); Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-22, -18); ctx.lineTo(-22, 18); ctx.closePath(); }, c[0], c[1], null, 3, 4); ctx.restore();
    Art.cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2); }, c[0], c[1], '#ffffff', 3.5, 6);
    Art.animeEye(ctx, 16, -4, 6, 7, '#7ec8ff', '#1a3a8a', { side: 1 });
    if (f.kind === 'gold') { Art.sparkle(ctx, -6, -20, 7, '#fff'); ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-2, -32); ctx.lineTo(4, -22); ctx.lineTo(10, -32); ctx.lineTo(14, -20); ctx.fillStyle = '#ffd23f'; ctx.fill(); Art.stroke(ctx, 2); }
    ctx.restore();
  },
  draw(ctx) {
    const t = G.t, v = G.view;
    World.bg(ctx, t, { noDecor: true, noBeacon: true });
    // толща воды
    const g = ctx.createLinearGradient(0, this.SURF, 0, v.y1); g.addColorStop(0, 'rgba(40,160,230,0.85)'); g.addColorStop(1, 'rgba(10,50,120,0.95)');
    ctx.fillStyle = g; ctx.fillRect(v.x0, this.SURF, v.x1 - v.x0, v.y1 - this.SURF);
    ctx.save(); ctx.globalAlpha = 0.12; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(200 + i * 220 + Math.sin(t + i) * 30, this.SURF); ctx.lineTo(120 + i * 220, v.y1); ctx.lineTo(220 + i * 220, v.y1); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); } ctx.restore();
    World.coral(ctx, 160, 720, 0.8, '#ff7eb6'); World.coral(ctx, 1080, 720, 0.7, '#ffb23a');
    for (const f of this.fish) this.drawFish(ctx, f, t);
    // лодка и леска
    const b = this.boat, hx = b.x + 40, hy = this.SURF + this.hook.y;
    ctx.beginPath(); ctx.moveTo(b.x + 40, this.SURF - 70); ctx.lineTo(hx, hy); Art.stroke(ctx, 2, '#ffffff');
    ctx.beginPath(); ctx.arc(hx, hy + 8, 9, 0, Math.PI); Art.stroke(ctx, 4, '#c8ccd8');
    const bob = Math.sin(t * 2) * 4;
    ctx.save(); ctx.translate(b.x, this.SURF + bob);
    ctx.beginPath(); ctx.moveTo(-40, -50); ctx.lineTo(40, -70); Art.stroke(ctx, 5, '#8a5a2a');
    Art.astronaut(ctx, -10, -18, 0.55, { t, anim: this.hook.state === 'reel' ? 'cheer' : 'idle', at: t });
    Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-80, -22); ctx.lineTo(80, -22); ctx.quadraticCurveTo(70, 14, 40, 16); ctx.lineTo(-40, 16); ctx.quadraticCurveTo(-70, 14, -80, -22); ctx.closePath(); }, '#ff7a5a', '#c84a3a', '#ffd0c0', 4, 8);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-70, -16, 140, 5);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); for (let x = v.x0; x <= v.x1; x += 20) ctx.lineTo(x, this.SURF + Math.sin(x * 0.03 + t * 2) * 4); Art.stroke(ctx, 4, '#e8fbff'); ctx.restore();
    // табло
    UI.progress(ctx, 330, 26, 420, 44, this.score / this.need, '#ffd23f');
    UI.text(ctx, 'Улов: ' + this.score + ' / ' + this.need, 540, 49, 26, '#fff', 'center', true);
    for (let i = 0; i < 3; i++) Art.heart(ctx, 800 + i * 44, 50, 38, i < this.lives ? '#ff3b5c' : 'rgba(255,255,255,0.25)');
    const k = this.time / 60; Art.ell(ctx, 970, 50, 26, 26, '#fff'); Art.stroke(ctx, 3);
    ctx.beginPath(); ctx.moveTo(970, 50); ctx.arc(970, 50, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fillStyle = k < 0.25 ? '#ff3b5c' : '#41d982'; ctx.fill();
    if ((this.won || this.over) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 260, 48, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
