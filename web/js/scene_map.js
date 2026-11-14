// Карта галактики: 12 планет, лучи маяков, перелёты (и Шипун, который тайком летит в ракете)
'use strict';
const MAP_POS = {
  nyam: [170, 600], water: [480, 600], fire: [790, 600], wind: [1100, 600],
  ice: [1100, 390], rainbow: [790, 390], jungle: [480, 390], flower: [170, 390],
  sand: [170, 180], robo: [480, 180], shroom: [790, 180], night: [1100, 180],
};
G.scenes.map = {
  enter(args) {
    args = args || {};
    this.reveal = args.reveal && S.data.unlocked.includes(args.reveal) ? args.reveal : null;
    this.revealK = this.reveal ? 0 : 1;
    this.travel = null;
    const [sx, sy] = MAP_POS[S.data.planet];
    this.ship = { x: sx, y: sy - 64, rot: 0 };
    UI.homeButton(this);
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
      if (Math.hypot(x - px, y - py) < 72) {
        if (!S.data.unlocked.includes(p.id)) {
          Sound.boing();
          const prev = PLANETS[p.order - 1];
          Voice.say('Планета ' + p.name + ' пока закрыта. Собери ' + BEACON_GOAL + ' ' + prev.treatGen + ' на планете ' + prev.name + ' и зажги там маяк!');
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
    this.travel = { from: { x: this.ship.x, y: this.ship.y }, to: { x: tx, y: ty - 64 }, k: 0, p, snake: 0 };
    Sound.whoosh(); Voice.say('Летим на планету ' + p.name + '!');
    // Шипун незаметно заползает в ракету
    G.wait(0.6, () => { if (this.travel) { this.travel.snake = 1; Sound.hiss(); } });
    G.tween(this.travel, { k: 1 }, 2.6, G.ease.inOutQuad, () => {
      S.data.planet = p.id; S.save();
      Sound.preload();
      const first = !PS(p.id).visited;
      G.go(first ? 'arrive' : 'home', { planet: p.id });
    });
  },
  update(dt) {
    const tr = this.travel;
    if (tr) {
      const k = tr.k, x = M.lerp(tr.from.x, tr.to.x, k), y = M.lerp(tr.from.y, tr.to.y, k) - Math.sin(k * Math.PI) * 120;
      if (Math.hypot(x - this.ship.x, y - this.ship.y) > 0.5) this.ship.rot = Math.atan2(y - this.ship.y, x - this.ship.x) + Math.PI / 2;
      this.ship.x = x; this.ship.y = y;
      if (Math.random() < 0.5) G.burst(x, y + 20, { kind: 'dot', n: 1, colors: ['#ffd23f', '#ff9a3c'], speed: 40, g: 0, life: 0.6, size: 8 });
    }
  },
  draw(ctx) {
    const t = G.t, v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, '#04021a'); g.addColorStop(1, '#1a0f4a');
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    for (const [nx, ny, r, c] of [[300, 200, 300, '#ff7eb6'], [900, 400, 360, '#4fb7ff'], [640, 650, 300, '#b07cff']]) { ctx.save(); ctx.globalAlpha = 0.16; Art.ell(ctx, nx, ny, r, r * 0.6); ctx.fillStyle = Art.rg(ctx, nx, ny, r, c, 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore(); }
    Art.stars(ctx, 91, 200, t);
    UI.text(ctx, 'Карта галактики', 640, 52, 38, '#ffd6f0', 'center', true);
    // лучи маяков между планетами
    for (let i = 0; i < PLANETS.length - 1; i++) {
      const a = PLANETS[i], b = PLANETS[i + 1];
      const [ax, ay] = MAP_POS[a.id], [bx, by] = MAP_POS[b.id];
      let k = S.data.planets[a.id].beacon ? 1 : 0;
      if (this.reveal === b.id) k = this.revealK;
      ctx.save(); ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.restore();
      if (k > 0) {
        const ex = M.lerp(ax, bx, k), ey = M.lerp(ay, by, k);
        ctx.save(); ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.lineWidth = 22; ctx.strokeStyle = a.beacon[0]; ctx.stroke();
        ctx.globalAlpha = 0.9; ctx.lineWidth = 5; ctx.strokeStyle = '#fff8d0'; ctx.stroke();
        ctx.restore();
        if (k < 1) Art.sparkle(ctx, ex, ey, 22, '#ffffff');
      }
    }
    // планеты
    for (const p of PLANETS) {
      const [px, py] = MAP_POS[p.id], open = S.data.unlocked.includes(p.id) && !(this.reveal === p.id && this.revealK < 1);
      const cur = p.id === S.data.planet, r = 46 + (cur ? 6 : 0);
      ctx.save(); if (!open) ctx.globalAlpha = 0.4;
      if (open) { ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 2 + p.order) * 0.1; Art.ell(ctx, px, py, r * 1.6, r * 1.6); ctx.fillStyle = Art.rg(ctx, px, py, r * 1.6, p.sky[2], 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore(); }
      Art.planet(ctx, px, py, r, p.sky[2], p.ground[1], ['nyam', 'ice', 'robo'].includes(p.id) ? 'rgba(255,240,200,0.7)' : null);
      ctx.restore();
      if (open) {
        const ds = dragonsOf(p.id);
        ds.forEach((d, i) => Art.dragon(ctx, px + 44 + i * 34, py + 34, 0.17, { kind: d.id, t: t + i }));
        if (S.data.planets[p.id].beacon) Art.roundStar(ctx, px - 44, py - 38, 13, '#ffd23f', '#2a1650');
      } else Art.icon(ctx, 'lock', px, py, 1);
      UI.text(ctx, p.name, px, py + r + 22, 22, open ? '#ffffff' : '#9a8ac0', 'center', true);
    }
    // ракета (и хвост Шипуна, который заполз внутрь)
    const sh = this.ship, tr = this.travel;
    if (tr && tr.snake && !Egg.hatched()) {
      ctx.save(); ctx.translate(sh.x, sh.y + 40); ctx.rotate(sh.rot);
      const w = Math.sin(t * 8) * 6;
      ctx.beginPath(); ctx.moveTo(-6, 14); ctx.quadraticCurveTo(-26 + w, 34, -14 - w, 52); ctx.lineWidth = 9; ctx.strokeStyle = '#5b3a8c'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#d8e88a'; ctx.stroke();
      ctx.restore();
    }
    Egg.ride(ctx, sh.x, sh.y + 40, 0.15, t, { flame: tr ? 1 : 0.3, rot: tr ? sh.rot : 0, pilot: true });
  },
};

// Первое прибытие на планету: посадка, дракончик выбегает навстречу, Шипун тайком уползает в пещеру
G.scenes.arrive = {
  enter(args) {
    const pd = this.pd = PLANET_BY_ID[(args && args.planet) || S.data.planet];
    PS(pd.id).visited = true; S.save();
    this.rk = { y: -300, flame: 1 };
    this.as = { x: 300, show: 0 };
    this.ds = dragonsOf(pd.id).map((d, i) => ({ id: d.id, x: 1500 + i * 200, y: 600, tx: 700 + i * 190, lift: 200, happy: 0 }));
    this.sn = { k: 0, on: false };
    const v = V();
    const snakeLine = Egg.hatched() ? 'Шипун прилетел с нами, удобно устроившись на спине у Космика, и сразу уполз в пещеру.' : v.friend ? 'Смотри! Из ракеты выполз Шипун. Он полетел с нами в гости и поселился в пещере.' : 'Ой! Кто это выполз из ракеты и юркнул в пещеру? Похоже, Шипун тайком полетел с нами!';
    const eggLine = Egg.snake();
    this.slides = (pd.intro || []).map(x => Egg.text(x)).concat([snakeLine + (eggLine ? ' ' + eggLine : '')]);
    this.i = -1;
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    Sound.rumble(2); Sound.whoosh();
    G.tween(this.rk, { y: World.GROUND + 25 }, 2.2, G.ease.outQuad, () => {
      this.rk.flame = 0; Sound.bump(); G.burst(170, 600, { kind: 'smoke', n: 16, colors: ['#ffffff'], g: -20, speed: 180, size: 18 });
      G.tween(this.as, { show: 1 }, 0.5);
      this.next();
    });
  },
  next() {
    if (this.rk.flame > 0) return;
    this.i++;
    if (this.i >= this.slides.length) { Voice.stop(); G.go('home'); return; }
    Voice.say(this.slides[this.i]);
    if (this.i === this.slides.length - 2 || (this.slides.length === 1)) {
      // дракончики прилетают
      this.ds.forEach((d, k) => G.tween(d, { x: d.tx, lift: 0 }, 1.6, G.ease.outQuad, () => { d.happy = 2; Sound.purr(1.4, { dragon: d.id }); G.burst(d.x, d.y - 150, { kind: 'heart', n: 6, up: true, g: -80, speed: 160 }); }, k * 0.4));
    }
    if (this.i === this.slides.length - 1) {
      this.sn.on = true; Sound.hiss();
      G.tween(this.sn, { k: 1 }, 3, G.ease.inOutQuad);
    }
  },
  update(dt) { for (const d of this.ds) d.happy = Math.max(0, d.happy - dt); },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { planet: this.pd.id, bright: true });
    Art.lair(ctx, CAVE_X, 612, 1, t, { eyes: this.sn.k >= 1, friend: V().friend });
    Egg.ride(ctx, 170, this.rk.y, 0.8, t, { flame: this.rk.flame, rider: this.rk.flame > 0 });
    if (this.as.show > 0) { ctx.save(); ctx.globalAlpha = this.as.show; Art.astronaut(ctx, 300 + this.as.show * 60, 600, 1.1, { t, anim: this.i >= 0 ? 'wave' : 'idle', at: t }); ctx.restore(); }
    for (const d of this.ds) Art.dragon(ctx, d.x, d.y, 0.68, { kind: d.id, t: t + d.tx, lift: d.lift, flying: d.lift > 5, happy: d.happy > 0, look: -1 });
    // Шипун ползёт от ракеты к пещере
    if (this.sn.on && this.sn.k < 1) {
      const hx = M.lerp(230, CAVE_X, this.sn.k), pts = [];
      for (let i = 0; i < 16; i++) pts.push([hx - i * 20, 610 + Math.sin(t * 6 - i * 0.7) * 10]);
      Art.serpent(ctx, pts, t, { r: 22, friend: V().friend });
    }
    const s = this.slides[this.i];
    if (s) {
      Art.rr(ctx, 140, 30, 1000, 130, 30); ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#8f6cf2'; ctx.stroke();
      UI.wrap(ctx, s, 640, 84, 940, 28, '#3a2a6a', 34);
    }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
