// Карта галактики: планеты, лучи маяков, перелёты
'use strict';
const MAP_POS = { nyam: [170, 560], water: [380, 330], fire: [560, 560], wind: [720, 250], ice: [900, 500], rainbow: [1060, 260], jungle: [1150, 560] };
G.scenes.map = {
  enter(args) {
    this.reveal = args.reveal && S.data.unlocked.includes(args.reveal) ? args.reveal : null;
    this.revealK = this.reveal ? 0 : 1;
    this.travel = null;
    this.ship = { x: MAP_POS[S.data.planet][0], y: MAP_POS[S.data.planet][1] - 70, rot: 0 };
    UI.add(this, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('home') });
    if (this.reveal) {
      const np = PLANET_BY_ID[this.reveal];
      Sound.magic();
      Voice.say('Смотри! Луч маяка ведёт к планете ' + np.name + '! Нажми на неё, чтобы полететь.');
      G.tween(this, { revealK: 1 }, 2.5, G.ease.inOutQuad, () => { Sound.chime(1.2); G.burst(MAP_POS[np.id][0], MAP_POS[np.id][1], { kind: 'star', n: 30, speed: 300 }); });
    } else Voice.say('Это карта галактики. Нажми на планету, чтобы полететь туда.');
  },
  down(x, y) {
    if (this.travel) return;
    for (const p of PLANETS) {
      const [px, py] = MAP_POS[p.id];
      if (Math.hypot(x - px, y - py) < 80) {
        if (!S.data.unlocked.includes(p.id)) {
          Sound.boing();
          const prev = PLANETS[p.order - 1];
          Voice.say('Планета ' + p.name + ' пока закрыта. Вырасти дракона ' + prev.of + ' и зажги там маяк!');
          return;
        }
        if (p.id === S.data.planet) { G.go('home'); return; }
        this.fly(p);
        return;
      }
    }
  },
  fly(p) {
    const [tx, ty] = MAP_POS[p.id];
    this.travel = { from: { x: this.ship.x, y: this.ship.y }, to: { x: tx, y: ty - 70 }, k: 0, p };
    Sound.whoosh(); Voice.say('Летим на планету ' + p.name + '!');
    G.tween(this.travel, { k: 1 }, 2.2, G.ease.inOutQuad, () => {
      S.data.planet = p.id; S.save();
      Sound.preload(p.id);
      const first = !PS(p.id).visited;
      G.go(first ? 'intro' : 'home', { planet: p.id });
    });
  },
  update(dt) {
    const tr = this.travel;
    if (tr) {
      const k = tr.k, x = M.lerp(tr.from.x, tr.to.x, k), y = M.lerp(tr.from.y, tr.to.y, k) - Math.sin(k * Math.PI) * 140;
      this.ship.rot = Math.atan2(y - this.ship.y, x - this.ship.x) + Math.PI / 2;
      this.ship.x = x; this.ship.y = y;
      if (Math.random() < 0.5) G.burst(x, y, { kind: 'dot', n: 1, colors: ['#ffd23f', '#ff9a3c'], speed: 40, g: 0, life: 0.6, size: 8 });
    }
  },
  draw(ctx) {
    const t = G.t, v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, '#04021a'); g.addColorStop(1, '#1a0f4a');
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    // туманности
    for (const [nx, ny, r, c] of [[300, 200, 300, '#ff7eb6'], [900, 400, 360, '#4fb7ff'], [640, 650, 300, '#b07cff']]) { ctx.save(); ctx.globalAlpha = 0.18; Art.ell(ctx, nx, ny, r, r * 0.6); ctx.fillStyle = Art.rg(ctx, nx, ny, r, c, 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore(); }
    Art.stars(ctx, 91, 220, t);
    UI.text(ctx, 'Карта галактики', 640, 60, 44, '#ffd6f0', 'center', true);
    // лучи маяков между планетами
    for (let i = 0; i < PLANETS.length - 1; i++) {
      const a = PLANETS[i], b = PLANETS[i + 1];
      const [ax, ay] = MAP_POS[a.id], [bx, by] = MAP_POS[b.id];
      const lit = S.data.planets[a.id].beacon;
      let k = lit ? 1 : 0;
      if (this.reveal === b.id) k = this.revealK;
      ctx.save(); ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.restore();
      if (k > 0) {
        const ex = M.lerp(ax, bx, k), ey = M.lerp(ay, by, k);
        ctx.save(); ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.lineWidth = 26; ctx.strokeStyle = '#fff3a0'; ctx.stroke();
        ctx.globalAlpha = 0.9; ctx.lineWidth = 6; ctx.strokeStyle = '#fff8d0'; ctx.stroke();
        ctx.restore();
        if (k < 1) Art.sparkle(ctx, ex, ey, 22, '#ffffff');
      }
    }
    // планеты
    for (const p of PLANETS) {
      const [px, py] = MAP_POS[p.id], open = S.data.unlocked.includes(p.id) && !(this.reveal === p.id && this.revealK < 1);
      const cur = p.id === S.data.planet, r = 58 + (cur ? 6 : 0);
      ctx.save(); if (!open) ctx.globalAlpha = 0.4;
      if (open) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 2 + p.order) * 0.1; Art.ell(ctx, px, py, r * 1.6, r * 1.6); ctx.fillStyle = Art.rg(ctx, px, py, r * 1.6, p.sky[2], 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore(); }
      Art.planet(ctx, px, py, r, p.sky[2], p.ground[1], p.id === 'nyam' || p.id === 'ice' ? 'rgba(255,240,200,0.7)' : null);
      ctx.restore();
      if (open) {
        const ps = S.data.planets[p.id];
        if (ps.level > 0 || ps.visited) Art.dragon(ctx, px + 46, py + 40, 0.22, { planet: p.id, t, level: Math.max(0, ps.level) });
        if (ps.beacon) Art.roundStar(ctx, px - 50, py - 44, 14, '#ffd23f', '#2a1650');
      } else Art.icon(ctx, 'lock', px, py, 1.1);
      UI.text(ctx, p.name, px, py + r + 26, 26, open ? '#ffffff' : '#9a8ac0', 'center', true);
    }
    // ракета
    const sh = this.ship;
    Art.rocket(ctx, sh.x, sh.y + 40, 0.16, { t, flame: this.travel ? 1 : 0.3, rot: this.travel ? sh.rot : 0, pilot: true });
  },
  drawTop(ctx) { },
};
