// Аниме-фоны планет: небо, свет, облака, горы, земля, декор и частицы
'use strict';
const World = {
  GROUND: 560,
  bg(ctx, t, opt) {
    opt = opt || {};
    const pd = PLANET_BY_ID[opt.planet || S.data.planet] || PLANETS[0];
    const lit = !opt.beaconOff && (S.data.planets[pd.id] || {}).beacon;
    const v = G.view;
    // небо
    const g = ctx.createLinearGradient(0, v.y0, 0, World.GROUND);
    g.addColorStop(0, pd.sky[0]); g.addColorStop(0.55, pd.sky[1]); g.addColorStop(1, pd.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    if (['nyam', 'fire', 'ice'].includes(pd.id)) Art.stars(ctx, 11 + pd.order, lit ? 140 : 70, t, World.GROUND - 120);
    if (pd.id === 'ice') World.aurora(ctx, t);
    // светило и лучи
    const sun = { nyam: [250, 130, 62, '#ffd0f0', '#ff7eb6', 'rgba(255,240,180,0.8)'], water: [1000, 120, 70, '#fff8d0', '#ffd23f'], fire: [980, 150, 90, '#ffe08a', '#ff5a1a'],
      wind: [220, 110, 66, '#ffffff', '#ffe68a'], ice: [1020, 110, 40, '#ffffff', '#bfe8ff', 'rgba(255,255,255,0.6)'], rainbow: [230, 120, 60, '#fff8d0', '#ffb3e0'], jungle: [1050, 100, 70, '#fffbd0', '#ffe14a'] }[pd.id];
    World.rays(ctx, sun[0], sun[1], t, pd.id === 'fire' ? '#ffb070' : '#fff6d0');
    ctx.save(); ctx.globalAlpha = 0.5; Art.ell(ctx, sun[0], sun[1], sun[2] * 1.8, sun[2] * 1.8); ctx.fillStyle = Art.rg(ctx, sun[0], sun[1], sun[2] * 1.8, sun[3], 'rgba(255,255,255,0)', 0, 0); ctx.fill(); ctx.restore();
    Art.planet(ctx, sun[0], sun[1], sun[2], sun[3], sun[4], sun[5] || null);
    if (pd.id === 'rainbow') World.rainbowArc(ctx, 640, World.GROUND + 80, 520, 0.55);
    // облака
    const cloudCols = { fire: ['#8a4a4a', '#5a2a30'], ice: ['#e8f6ff', '#a8c8e8'], rainbow: ['#ffffff', '#ffc8e8'], jungle: ['#f4fff0', '#c8e8c0'] }[pd.id] || ['#ffffff', '#c8d4f0'];
    const nC = pd.id === 'wind' ? 6 : 3;
    for (let i = 0; i < nC; i++) {
      const sp = 8 + i * 4, w = v.x1 - v.x0 + 400;
      const cx = v.x0 - 200 + ((i * 397 + t * sp) % w), cy = 90 + (i % 3) * 70 + (pd.id === 'wind' ? (i % 2) * 140 : 0);
      ctx.save(); ctx.globalAlpha = pd.id === 'fire' ? 0.7 : 0.92; Art.cloud(ctx, cx, cy, 0.7 + (i % 3) * 0.25, cloudCols[0], cloudCols[1]); ctx.restore();
    }
    if (pd.id === 'wind') World.islands(ctx, t);
    // дальние и ближние горы
    World.ridge(ctx, 470, 0.011, 30, pd.mount2, 1.0, pd.id === 'fire');
    if (pd.id === 'water') World.sea(ctx, t);
    else World.ridge(ctx, 505, 0.017, 22, pd.mount, 0.8, false);
    if (pd.id === 'fire') World.volcanoes(ctx, t);
    if (opt.beacon) Art.beacon(ctx, 1150, 505, 0.8, lit, t, pd.beacon);
    // земля
    World.ground(ctx, World.GROUND, t, pd.ground, pd.id);
    if (!opt.noDecor) World.decor(ctx, t, pd.id);
    World.ambient(ctx, t, pd.id);
  },
  rays(ctx, x, y, t, c) {
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = c;
    for (let i = 0; i < 7; i++) {
      const a = 0.3 + i * 0.32 + Math.sin(t * 0.2 + i) * 0.03;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 1500, y + Math.sin(a) * 1500); ctx.lineTo(x + Math.cos(a + 0.08) * 1500, y + Math.sin(a + 0.08) * 1500); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  ridge(ctx, y, f, amp, color, k, jag) {
    const v = G.view;
    ctx.beginPath(); ctx.moveTo(v.x0, World.GROUND + 60);
    for (let x = v.x0; x <= v.x1 + 30; x += 30) {
      let yy = y + Math.sin(x * f) * amp + Math.sin(x * f * 2.7) * amp * 0.5;
      if (jag) yy -= Math.abs(Math.sin(x * f * 3)) * 25;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(v.x1, World.GROUND + 60); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    // световой край
    ctx.save(); ctx.globalAlpha = 0.35; ctx.beginPath();
    for (let x = v.x0; x <= v.x1 + 30; x += 30) { let yy = y + Math.sin(x * f) * amp + Math.sin(x * f * 2.7) * amp * 0.5; if (jag) yy -= Math.abs(Math.sin(x * f * 3)) * 25; x === v.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
  },
  ground(ctx, y, t, p, id) {
    const v = G.view;
    const layers = [[y - 40, p[0], 0.004, 40], [y, p[1], 0.006, 26], [y + 70, p[2], 0.009, 16]];
    for (const [yy, c, f, a] of layers) {
      const edge = x => yy + Math.sin(x * f + yy) * a;
      ctx.beginPath(); ctx.moveTo(v.x0, v.y1 + 10);
      for (let x = v.x0; x <= v.x1 + 20; x += 20) ctx.lineTo(x, edge(x));
      ctx.lineTo(v.x1, v.y1 + 10); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      ctx.beginPath(); for (let x = v.x0; x <= v.x1 + 20; x += 20) x === v.x0 ? ctx.moveTo(x, edge(x)) : ctx.lineTo(x, edge(x));
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(26,16,48,0.6)'; ctx.stroke();
      ctx.save(); ctx.translate(0, 5); ctx.globalAlpha = 0.35; ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
    }
    if (id === 'fire') { // лавовые трещины
      ctx.save(); ctx.globalAlpha = 0.8 + Math.sin(t * 3) * 0.15;
      for (const [x0, y0] of [[160, 640], [760, 700], [1080, 650]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 40, y0 - 8); ctx.lineTo(x0 + 70, y0 + 6); ctx.lineTo(x0 + 120, y0 - 4); Art.stroke(ctx, 7, '#ff5a1a'); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 40, y0 - 8); ctx.lineTo(x0 + 70, y0 + 6); ctx.lineTo(x0 + 120, y0 - 4); Art.stroke(ctx, 2.5, '#fff27a'); }
      ctx.restore();
    }
  },
  sea(ctx, t) {
    const v = G.view;
    const g = ctx.createLinearGradient(0, 480, 0, 560); g.addColorStop(0, '#2aa8e8'); g.addColorStop(1, '#1a6ab8');
    ctx.fillStyle = g; ctx.fillRect(v.x0, 488, v.x1 - v.x0, 100);
    ctx.save(); ctx.globalAlpha = 0.6;
    for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let x = v.x0; x <= v.x1; x += 16) { const yy = 498 + r * 18 + Math.sin(x * 0.03 + t * 2 + r) * 3; x === v.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.lineWidth = 3; ctx.strokeStyle = '#bff5ff'; ctx.stroke(); }
    ctx.restore();
  },
  volcanoes(ctx, t) {
    for (const [x, h, w] of [[380, 170, 170], [820, 120, 130]]) {
      ctx.beginPath(); ctx.moveTo(x - w, 520); ctx.lineTo(x - 26, 520 - h); ctx.lineTo(x + 26, 520 - h); ctx.lineTo(x + w, 520); ctx.closePath();
      ctx.fillStyle = '#4a1e22'; ctx.fill(); Art.stroke(ctx, 3);
      ctx.beginPath(); ctx.moveTo(x - 26, 520 - h); ctx.lineTo(x - 14, 520 - h + 40); ctx.lineTo(x, 520 - h + 18); ctx.lineTo(x + 16, 520 - h + 50); ctx.lineTo(x + 26, 520 - h); ctx.closePath(); ctx.fillStyle = '#ff5a1a'; ctx.fill();
      for (let i = 0; i < 4; i++) { const k = ((t * 0.3 + i / 4) % 1); ctx.save(); ctx.globalAlpha = 0.5 * (1 - k); Art.ell(ctx, x + Math.sin(k * 6 + i) * 20, 520 - h - k * 160, 20 + k * 40, 16 + k * 30, '#5a4a52'); ctx.restore(); }
    }
  },
  islands(ctx, t) {
    for (const [x, y, s] of [[420, 210, 0.8], [880, 300, 0.6]]) {
      const yy = y + Math.sin(t + x) * 8;
      ctx.beginPath(); ctx.moveTo(x - 90 * s, yy); ctx.quadraticCurveTo(x, yy + 110 * s, x + 90 * s, yy); ctx.closePath(); ctx.fillStyle = '#a8865a'; ctx.fill(); Art.stroke(ctx, 3);
      Art.ell(ctx, x, yy, 92 * s, 18 * s, '#8be06a'); Art.stroke(ctx, 3);
      Art.bush(ctx, x - 30 * s, yy - 4, 0.4 * s, '#6fc35a', t);
    }
  },
  aurora(ctx, t) {
    ctx.save(); ctx.globalAlpha = 0.35;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = G.view.x0; x <= G.view.x1; x += 20) { const yy = 120 + k * 40 + Math.sin(x * 0.006 + t * 0.6 + k) * 40; x === G.view.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.lineWidth = 34 - k * 8; ctx.strokeStyle = ['#41ffb0', '#7ee8ff', '#c87eff'][k]; ctx.stroke();
    }
    ctx.restore();
  },
  rainbowArc(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a;
    ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'].forEach((c, i) => { ctx.beginPath(); ctx.arc(x, y, r - i * 24, Math.PI, 0); ctx.lineWidth = 25; ctx.strokeStyle = c; ctx.stroke(); });
    ctx.restore();
  },
  decor(ctx, t, id) {
    switch (id) {
      case 'nyam':
        Art.mushroom(ctx, 70, 580, 0.6, '#7ee8ff', t); Art.crystal(ctx, 1240, 600, 0.7, '#ff9be0'); Art.bush(ctx, 1010, 575, 0.6, '#ffb23a', t); Art.mushroom(ctx, 1255, 700, 0.5, '#ffd23f', t); break;
      case 'water':
        World.palm(ctx, 60, 600, 1, t); World.coral(ctx, 1010, 580, 0.8, '#ff7eb6'); World.coral(ctx, 1250, 650, 0.6, '#ffb23a');
        Art.treatNamed(ctx, 'shell', 1180, 700, 0.5); Art.treatNamed(ctx, 'starfish', 120, 700, 0.55); break;
      case 'fire':
        Art.crystal(ctx, 70, 600, 0.7, '#ff5a3a'); Art.crystal(ctx, 1240, 610, 0.6, '#ffb23a'); Art.rock(ctx, 1010, 585, 0.6, '#5a3a3a'); break;
      case 'wind':
        World.windmill(ctx, 1010, 570, 0.8, t); Art.bush(ctx, 70, 590, 0.6, '#9be37a', t); Art.treatNamed(ctx, 'dandelion', 1240, 640, 0.9, t); break;
      case 'ice':
        World.pine(ctx, 70, 600, 0.9); World.pine(ctx, 1000, 580, 0.7); Art.crystal(ctx, 1240, 610, 0.8, '#bff5ff'); break;
      case 'rainbow':
        World.lollitree(ctx, 70, 600, 0.9, '#ff7eb6'); World.lollitree(ctx, 1010, 580, 0.7, '#7ec0ff'); Art.treatNamed(ctx, 'swirlpop', 1240, 640, 0.9, t); break;
      case 'jungle':
        World.palm(ctx, 70, 610, 1.1, t); World.palm(ctx, 1020, 590, 0.8, t); World.bigLeaf(ctx, 1260, 720, 1.3, -0.5); World.bigLeaf(ctx, G.view.x0 + 10, 730, 1.1, 0.5);
        World.vines(ctx, t); break;
    }
  },
  palm(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-20, -90, 6, -170); ctx.lineTo(18, -168); ctx.quadraticCurveTo(-4, -90, 10, 0); ctx.closePath(); ctx.fillStyle = '#a8742a'; ctx.fill(); Art.stroke(ctx, 3);
    for (let i = 0; i < 6; i++) { const a = -Math.PI + i * 0.6 + Math.sin(t * 1.5 + i) * 0.05; ctx.save(); ctx.translate(12, -170); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -24, 90, 10); ctx.quadraticCurveTo(40, 6, 0, 0); ctx.fillStyle = i % 2 ? '#3aa848' : '#4cc85a'; ctx.fill(); Art.stroke(ctx, 2.5); ctx.restore(); }
    Art.ell(ctx, 6, -164, 9, 9, '#8a5a3a'); Art.ell(ctx, 20, -162, 9, 9, '#8a5a3a');
    ctx.restore();
  },
  coral(ctx, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const [a, l] of [[-0.5, 70], [0, 95], [0.5, 75], [-0.2, 50]]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -l); Art.stroke(ctx, 18, '#1a1030'); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -l); Art.stroke(ctx, 12, c); Art.ell(ctx, 0, -l, 9, 9, c); ctx.restore(); }
    ctx.restore();
  },
  windmill(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-14, -130); ctx.lineTo(14, -130); ctx.lineTo(26, 0); ctx.closePath(); ctx.fillStyle = '#fff4e0'; ctx.fill(); Art.stroke(ctx, 3);
    ctx.beginPath(); ctx.moveTo(-20, -130); ctx.lineTo(0, -160); ctx.lineTo(20, -130); ctx.closePath(); ctx.fillStyle = '#ff7a5a'; ctx.fill(); Art.stroke(ctx, 3);
    ctx.translate(0, -132); ctx.rotate(t * 1.5);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); Art.rr(ctx, -9, -90, 18, 78, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); Art.stroke(ctx, 2.5); ctx.restore(); }
    Art.ell(ctx, 0, 0, 7, 7, '#8a5a3a');
    ctx.restore();
  },
  pine(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-8, -20, 16, 22);
    for (let i = 0; i < 3; i++) { const w = 60 - i * 14, yy = -20 - i * 40; ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(0, yy - 70); ctx.lineTo(w, yy); ctx.closePath(); ctx.fillStyle = '#2a7a5a'; ctx.fill(); Art.stroke(ctx, 3);
      ctx.beginPath(); ctx.moveTo(-w * 0.6, yy - 26); ctx.lineTo(0, yy - 70); ctx.lineTo(w * 0.6, yy - 26); ctx.quadraticCurveTo(0, yy - 40, -w * 0.6, yy - 26); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    ctx.restore();
  },
  lollitree(ctx, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ffffff'; Art.rr(ctx, -6, -110, 12, 110, 6); ctx.fill(); Art.stroke(ctx, 3);
    Art.ell(ctx, 0, -140, 48, 48, c); Art.stroke(ctx, 3.5);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -140, 46, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < 30; i++) { const a = i * 0.5, r = i * 1.6; Art.ell(ctx, Math.cos(a) * r, -140 + Math.sin(a) * r, 5, 5, '#ffffff'); }
    ctx.restore();
    ctx.restore();
  },
  bigLeaf(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-70, -120, 0, -230); ctx.quadraticCurveTo(70, -120, 0, 0); ctx.closePath(); ctx.fillStyle = '#2e9a3e'; ctx.fill(); Art.stroke(ctx, 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -220); for (let i = 1; i < 6; i++) { ctx.moveTo(0, -i * 38); ctx.lineTo(-30, -i * 38 - 26); ctx.moveTo(0, -i * 38); ctx.lineTo(30, -i * 38 - 26); } Art.stroke(ctx, 2.5, '#1e6a2e');
    ctx.restore();
  },
  vines(ctx, t) {
    const v = G.view;
    for (const [x, len] of [[v.x0 + 120, 160], [420, 110], [880, 140], [v.x1 - 220, 190]]) {
      ctx.beginPath(); ctx.moveTo(x, v.y0); for (let k = 0; k <= len; k += 10) ctx.lineTo(x + Math.sin(k * 0.05 + t) * 10, v.y0 + k); Art.stroke(ctx, 6, '#2a6a2a');
      for (let k = 30; k < len; k += 40) { const lx = x + Math.sin(k * 0.05 + t) * 10; ctx.beginPath(); ctx.ellipse(lx + 10, v.y0 + k, 12, 6, 0.5, 0, 7); ctx.fillStyle = '#4cc85a'; ctx.fill(); Art.stroke(ctx, 2); }
    }
  },
  // атмосферные частицы
  ambient(ctx, t, id) {
    const v = G.view, rnd = Art.seeded(77 + id.length);
    const W = v.x1 - v.x0, H = v.y1 - v.y0;
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const bx = rnd(), by = rnd(), sp = 0.3 + rnd() * 0.7, ph = rnd() * 10;
      let x, y;
      switch (id) {
        case 'water': x = v.x0 + bx * W + Math.sin(t + ph) * 10; y = v.y1 - ((by * H + t * 40 * sp) % H); ctx.globalAlpha = 0.5; Art.ell(ctx, x, y, 5 + sp * 5, 5 + sp * 5); ctx.lineWidth = 2; ctx.strokeStyle = '#e8fbff'; ctx.stroke(); break;
        case 'fire': x = v.x0 + bx * W + Math.sin(t * 2 + ph) * 14; y = v.y1 - ((by * H + t * 60 * sp) % H); ctx.globalAlpha = 0.7 * (y / v.y1); Art.ell(ctx, x, y, 3 + sp * 2, 3 + sp * 2, i % 2 ? '#ffb23a' : '#ff5a1a'); break;
        case 'wind': x = v.x0 + ((bx * W + t * 120 * sp) % W); y = v.y0 + by * H * 0.8 + Math.sin(t * 2 + ph) * 20; ctx.globalAlpha = 0.8; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + ph); Art.ell(ctx, 0, 0, 8, 4, i % 2 ? '#8be06a' : '#ffd08a'); ctx.restore(); break;
        case 'ice': x = v.x0 + bx * W + Math.sin(t + ph) * 20; y = v.y0 + ((by * H + t * 50 * sp) % H); ctx.globalAlpha = 0.85; Art.ell(ctx, x, y, 2 + sp * 3, 2 + sp * 3, '#ffffff'); break;
        case 'rainbow': x = v.x0 + bx * W; y = v.y0 + by * H * 0.85; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + ph); Art.sparkle(ctx, x, y, 5 + sp * 6, ['#ff7eb6', '#ffe14a', '#7ee8ff', '#b07cff'][i % 4]); break;
        case 'jungle': x = v.x0 + bx * W + Math.sin(t * 0.7 + ph) * 30; y = 260 + by * 400 + Math.cos(t * 0.9 + ph) * 20; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + ph)); Art.ell(ctx, x, y, 4, 4, '#fff6a0'); ctx.globalAlpha *= 0.4; Art.ell(ctx, x, y, 12, 12, '#fff6a0'); break;
        default: if (i > 10) break; x = v.x0 + bx * W; y = v.y0 + by * H * 0.6; ctx.globalAlpha = 0.6 * Math.abs(Math.sin(t * 2 + ph)); Art.sparkle(ctx, x, y, 6 + sp * 5, '#ffffff');
      }
    }
    ctx.restore();
  },
  // спокойный фон для игр с полем: планета + затемнение
  calm(ctx, t, a) {
    World.bg(ctx, t, { noDecor: true, noBeacon: true });
    const v = G.view; ctx.save(); ctx.globalAlpha = a == null ? 0.3 : a; ctx.fillStyle = '#140a30'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore();
  },
  // космос, подкрашенный цветом планеты
  space(ctx, t, deep) {
    const pd = P(), v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1);
    g.addColorStop(0, '#04021a'); g.addColorStop(0.6, deep ? '#0e0a40' : '#16104a'); g.addColorStop(1, Art.mix(pd.sky[0], '#16104a', 0.4));
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, 900, 200, 420, 180); ctx.fillStyle = Art.rg(ctx, 900, 200, 420, pd.sky[1], 'rgba(0,0,0,0)', 0, 0); ctx.fill();
    Art.ell(ctx, 250, 560, 380, 160); ctx.fillStyle = Art.rg(ctx, 250, 560, 380, pd.sky[2], 'rgba(0,0,0,0)', 0, 0); ctx.fill(); ctx.restore();
    Art.stars(ctx, 41, 180, t);
  },
  // нарисовать сцену в отдельный холст (для пазлов)
  paintTo(ctx, w, h, fn) {
    const saved = G.view;
    const sc = Math.max(w / G.W, h / G.H);
    ctx.save(); ctx.scale(sc, sc);
    G.view = { x0: 0, y0: 0, x1: w / sc, y1: h / sc };
    try { fn(ctx); } finally { G.view = saved; ctx.restore(); }
  },
};
