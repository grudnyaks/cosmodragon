// Пять новых планет: Цветения, Песчания, Робоград, Грибландия, Сумрак — фоны, украшения, частицы и вкусняшки
'use strict';
(function () {
  const TAU = Math.PI * 2, ell = Art.ell, LINE = '#2a1650';
  // заливка с объёмом и контуром
  function cel(c, path, fill, shade, lw) {
    path(); const g = c.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, Art.mix(fill, '#ffffff', 0.25)); g.addColorStop(0.6, fill); g.addColorStop(1, shade || Art.mix(fill, '#000000', 0.3));
    c.fillStyle = g; c.fill(); c.lineWidth = lw || 3.5; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke();
  }
  const gloss = (c, x, y, rx, ry) => { c.save(); c.globalAlpha = 0.6; ell(c, x, y, rx, ry, '#ffffff'); c.restore(); };

  // ---------- вкусняшки ----------
  const X = {
    honey(c) { cel(c, () => { Art.rr(c, -24, -14, 48, 48, 12); }, '#ffb21a', '#d07a0a'); cel(c, () => { Art.rr(c, -28, -30, 56, 18, 6); }, '#c8823a', '#8a5a2a', 3); c.save(); c.beginPath(); c.moveTo(-24, -12); c.quadraticCurveTo(-14, 4, -6, -6); c.quadraticCurveTo(4, 10, 12, -4); c.quadraticCurveTo(18, 6, 24, -10); c.lineWidth = 5; c.strokeStyle = '#ffe07a'; c.stroke(); c.restore(); gloss(c, -12, 14, 5, 9); },
    flowercandy(c, t) { c.save(); c.rotate((t || 0) * 0.5); for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * TAU / 6); cel(c, () => { c.beginPath(); c.ellipse(0, -22, 13, 18, 0, 0, TAU); }, ['#ff9ad5', '#ffb3e0'][i % 2], '#d0609a', 3); c.restore(); } c.restore(); cel(c, () => { c.beginPath(); c.arc(0, 0, 14, 0, TAU); }, '#ffd23f', '#d8a020', 3); gloss(c, -4, -5, 4, 3); },
    honeycomb(c) { for (const [x, y] of [[-16, -10], [16, -10], [0, 16], [-32, 16], [32, 16], [0, -36]]) { if (Math.abs(x) > 30 && y < 0) continue; cel(c, () => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; c.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15); } c.closePath(); }, '#ffc83a', '#d08a1a', 2.5); ell(c, x, y, 6, 6, '#ffe58a'); } },
    date(c) { cel(c, () => { c.beginPath(); c.ellipse(0, 0, 18, 32, 0.3, 0, TAU); }, '#8a3a1a', '#4a1a0a'); c.save(); c.globalAlpha = 0.5; c.beginPath(); c.moveTo(-6, -20); c.quadraticCurveTo(0, 0, -4, 20); c.lineWidth = 2; c.strokeStyle = '#c86a3a'; c.stroke(); c.restore(); gloss(c, -6, -14, 4, 8); },
    sandcake(c) { cel(c, () => { c.beginPath(); c.moveTo(-34, 28); c.lineTo(0, -34); c.lineTo(34, 28); c.closePath(); }, '#f0c070', '#c08a40'); for (const y of [-6, 12]) { c.beginPath(); c.moveTo(-26 + (12 - y) * 0.2, y); c.lineTo(26 - (12 - y) * 0.2, y); c.lineWidth = 4; c.strokeStyle = '#ff9ad5'; c.stroke(); } Art.roundStar(c, 0, -34, 7, '#ffd23f'); },
    cactusjelly(c) { cel(c, () => { Art.rr(c, -14, -34, 28, 64, 14); }, '#5ad86a', '#2a8a3a'); for (const side of [-1, 1]) cel(c, () => { Art.rr(c, side > 0 ? 12 : -30, -10, 18, 24, 9); }, '#5ad86a', '#2a8a3a', 3); for (const [x, y] of [[-6, -20], [6, -6], [-4, 10], [6, 20]]) ell(c, x, y, 2, 2, '#fff6a0'); ell(c, 0, -36, 7, 5, '#ff7eb6'); c.lineWidth = 2; c.strokeStyle = LINE; c.stroke(); },
    gearcookie(c, t) { c.save(); c.rotate((t || 0) * 0.6); cel(c, () => { c.beginPath(); for (let i = 0; i < 24; i++) { const a = i * TAU / 24, r = i % 2 ? 26 : 34; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, '#d8a860', '#a8783a'); ell(c, 0, 0, 10, 10, '#ff9ad5'); c.lineWidth = 2.5; c.strokeStyle = LINE; c.stroke(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ell(c, Math.cos(a) * 18, Math.sin(a) * 18, 3, 3, '#6a3a1a'); } c.restore(); },
    battery(c, t) { cel(c, () => { Art.rr(c, -18, -30, 36, 62, 8); }, '#41d982', '#1a8a4a'); cel(c, () => { Art.rr(c, -8, -38, 16, 9, 3); }, '#c8d0e0', '#8a92a8', 2.5); c.fillStyle = '#ffffff'; c.fillRect(-12, -4, 24, 5); c.fillRect(-2.5, -14, 5, 24); const k = (Math.sin((t || 0) * 3) + 1) / 2; c.save(); c.globalAlpha = 0.5; c.fillStyle = '#e0ffe8'; c.fillRect(-14, 28 - 52 * k, 28, 4); c.restore(); },
    boltjelly(c) { cel(c, () => { c.beginPath(); c.moveTo(-6, -38); c.lineTo(18, -38); c.lineTo(4, -6); c.lineTo(20, -6); c.lineTo(-12, 38); c.lineTo(-2, 4); c.lineTo(-18, 4); c.closePath(); }, '#ffe14a', '#d8a020'); gloss(c, 4, -26, 4, 6); },
    glowberry(c, t) { const k = 0.6 + Math.sin((t || 0) * 3) * 0.3; c.save(); c.globalAlpha = 0.45 * k; c.fillStyle = Art.rg(c, 0, 0, 44, '#7effc8', 'rgba(126,255,200,0)', 0, 0); ell(c, 0, 0, 44, 44); c.fill(); c.restore(); for (const [x, y] of [[-12, 6], [12, 6], [0, -12]]) { cel(c, () => { c.beginPath(); c.arc(x, y, 14, 0, TAU); }, '#7effc8', '#2aa878', 3); gloss(c, x - 4, y - 5, 4, 3); } },
    mushcandy(c) { cel(c, () => { Art.rr(c, -10, -4, 20, 34, 8); }, '#fff2e0', '#d8c0a0', 3); cel(c, () => { c.beginPath(); c.moveTo(-34, 0); c.bezierCurveTo(-34, -44, 34, -44, 34, 0); c.closePath(); }, '#ff5a7a', '#c0204a'); for (const [x, y, r] of [[-16, -16, 6], [8, -26, 5], [20, -10, 4]]) ell(c, x, y, r, r, '#ffffff'); },
    acorn(c) { cel(c, () => { c.beginPath(); c.ellipse(0, 8, 22, 26, 0, 0, TAU); }, '#c8843a', '#8a5a1a'); cel(c, () => { c.beginPath(); c.moveTo(-26, -6); c.bezierCurveTo(-26, -34, 26, -34, 26, -6); c.closePath(); }, '#8a5a32', '#5a3a1a', 3); c.beginPath(); c.moveTo(0, -28); c.lineTo(4, -40); c.lineWidth = 4; c.strokeStyle = '#5a3a1a'; c.stroke(); gloss(c, -8, 6, 4, 8); },
    mooncookie(c) { cel(c, () => { c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.arc(14, -10, 26, 0, TAU, true); }, '#ffe9a8', '#d8b860'); for (const [x, y] of [[-18, 4], [-8, 18], [-20, -12]]) ell(c, x, y, 3, 3, '#a87a3a'); },
    starcandy(c, t) { c.save(); c.rotate(Math.sin((t || 0) * 2) * 0.2); c.lineJoin = 'round'; cel(c, () => { Art.starPath(c, 0, 0, 34, 16, 5); }, '#fff06a', '#d8b020'); c.restore(); gloss(c, -8, -10, 5, 3); },
    nightberry(c) { for (const [x, y] of [[-12, 6], [12, 6], [0, -12]]) { cel(c, () => { c.beginPath(); c.arc(x, y, 15, 0, TAU); }, '#5a4ad8', '#2a1a8a', 3); Art.roundStar(c, x + 3, y - 3, 3.5, '#fff6b0'); } c.beginPath(); c.moveTo(0, -26); c.lineTo(-4, -36); c.lineWidth = 4; c.strokeStyle = '#2a8a5a'; c.stroke(); },
  };
  const oldNamed = Art.treatNamed;
  Art.treatNamed = function (ctx, name, x, y, s, t) {
    if (!X[name]) return oldNamed(ctx, name, x, y, s, t);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    X[name](ctx, t || 0);
    ctx.restore();
  };

  // ---------- фон ----------
  const SUN = {
    flower: [240, 110, 64, '#fffbd0', '#ffe14a'], sand: [1000, 120, 92, '#fff4c0', '#ff9a3c'], robo: [230, 120, 52, '#e0fbff', '#41c8ff', 'rgba(200,250,255,0.6)'],
    shroom: [1020, 120, 46, '#e8d0ff', '#b07cff', 'rgba(200,255,230,0.6)'], night: [1000, 120, 50, '#fffbe0', '#c8c0a0'],
  };
  World.SUN_EXTRA = SUN;
  World.newPlanet = id => !!SUN[id];
  // полный фон новой планеты (вызывается из World.bg)
  World.bg2 = function (ctx, t, pd, opt, lit) {
    const v = G.view, id = pd.id;
    const g = ctx.createLinearGradient(0, v.y0, 0, World.GROUND);
    g.addColorStop(0, pd.sky[0]); g.addColorStop(0.55, pd.sky[1]); g.addColorStop(1, pd.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    if (['robo', 'shroom', 'night'].includes(id)) Art.stars(ctx, 31 + pd.order, id === 'night' && !lit ? 40 : 110, t, World.GROUND - 120);
    const sun = SUN[id];
    if (id !== 'night' || lit) World.rays(ctx, sun[0], sun[1], t, '#fff6d0');
    ctx.save(); ctx.globalAlpha = id === 'night' && !lit ? 0.2 : 0.5; ell(ctx, sun[0], sun[1], sun[2] * 1.8, sun[2] * 1.8); ctx.fillStyle = Art.rg(ctx, sun[0], sun[1], sun[2] * 1.8, sun[3], 'rgba(255,255,255,0)', 0, 0); ctx.fill(); ctx.restore();
    if (id === 'night') { ctx.save(); if (!lit) ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(sun[0], sun[1], sun[2], 0, TAU); ctx.arc(sun[0] + 22, sun[1] - 12, sun[2] * 0.85, 0, TAU, true); ctx.fillStyle = sun[3]; ctx.fill('evenodd'); ctx.restore(); }
    else Art.planet(ctx, sun[0], sun[1], sun[2], sun[3], sun[4], sun[5] || null);
    // облака
    const cc = { flower: ['#ffffff', '#ffd8f0'], sand: ['#fff0d8', '#e8c8a0'], robo: ['#c8d8f0', '#8a9ab8'], shroom: ['#7a5ab8', '#4a2a8a'], night: ['#3a3a6a', '#22224a'] }[id];
    for (let i = 0; i < 3; i++) {
      const sp = 8 + i * 4, w = v.x1 - v.x0 + 400;
      const cx = v.x0 - 200 + ((i * 397 + t * sp) % w), cy = 90 + (i % 3) * 70;
      ctx.save(); ctx.globalAlpha = id === 'shroom' || id === 'night' ? 0.6 : 0.9; Art.cloud(ctx, cx, cy, 0.7 + (i % 3) * 0.25, cc[0], cc[1]); ctx.restore();
    }
    // дальний план
    if (id === 'sand') World.pyramids(ctx);
    if (id === 'robo') World.roboCity(ctx, t);
    World.ridge(ctx, 470, 0.011, 30, pd.mount2, 1.0, false);
    if (id === 'shroom') World.giantShrooms(ctx, t);
    if (id === 'flower') World.bigFlowers(ctx, t);
    if (id === 'sand') World.dunes(ctx);
    else World.ridge(ctx, 505, 0.017, 22, pd.mount, 0.8, false);
    if (opt.beacon) Art.beacon(ctx, 1150, 505, 0.8, lit, t, pd.beacon);
    World.ground(ctx, World.GROUND, t, pd.ground, id);
    if (!opt.noDecor) World.decor2(ctx, t, id);
    World.ambient2(ctx, t, id, lit);
    // Сумрак без маяка — тёмная пелена
    if (id === 'night' && !lit && !opt.bright) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#02020e'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
  };
  World.pyramids = function (ctx) {
    for (const [x, h, w] of [[340, 190, 200], [600, 130, 140], [880, 160, 170]]) {
      ctx.beginPath(); ctx.moveTo(x - w, 520); ctx.lineTo(x, 520 - h); ctx.lineTo(x + w, 520); ctx.closePath(); ctx.fillStyle = '#e8b870'; ctx.fill(); Art.stroke(ctx, 3);
      ctx.beginPath(); ctx.moveTo(x, 520 - h); ctx.lineTo(x + w, 520); ctx.lineTo(x + w * 0.25, 520); ctx.closePath(); ctx.fillStyle = 'rgba(160,90,30,0.35)'; ctx.fill();
    }
  };
  World.dunes = function (ctx) {
    const v = G.view;
    ctx.beginPath(); ctx.moveTo(v.x0, 600);
    for (let x = v.x0; x <= v.x1 + 30; x += 30) ctx.lineTo(x, 500 + Math.sin(x * 0.008) * 26 + Math.sin(x * 0.02) * 8);
    ctx.lineTo(v.x1, 600); ctx.closePath(); ctx.fillStyle = '#f0b868'; ctx.fill();
  };
  World.roboCity = function (ctx, t) {
    for (let i = 0; i < 9; i++) {
      const x = 80 + i * 140, h = 120 + ((i * 53) % 90), w = 70;
      ctx.fillStyle = i % 2 ? '#22345a' : '#2a3e6a'; Art.rr(ctx, x - w / 2, 520 - h, w, h, 8); ctx.fill();
      for (let r = 0; r < Math.floor(h / 30); r++) for (let k = 0; k < 2; k++) { const on = Math.sin(t * 1.5 + i * 3 + r * 2 + k) > -0.3; ctx.fillStyle = on ? '#ffe68a' : '#3a4a7a'; ctx.fillRect(x - 22 + k * 28, 520 - h + 14 + r * 30, 14, 12); }
      ctx.beginPath(); ctx.moveTo(x, 520 - h); ctx.lineTo(x, 500 - h); ctx.lineWidth = 3; ctx.strokeStyle = '#8a9ab8'; ctx.stroke();
      ell(ctx, x, 498 - h, 4, 4, Math.sin(t * 4 + i) > 0 ? '#ff5a6a' : '#5a2a3a');
    }
  };
  World.giantShrooms = function (ctx, t) {
    for (const [x, h, r, c] of [[300, 220, 120, '#b07cff'], [760, 170, 90, '#7effc8'], [1000, 250, 130, '#ff9ad5']]) {
      ctx.fillStyle = '#d8c8e8'; Art.rr(ctx, x - 16, 520 - h, 32, h, 12); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 1.5 + x) * 0.1; ctx.fillStyle = Art.rg(ctx, x, 520 - h, r * 1.6, c, 'rgba(0,0,0,0)', 0, 0); ell(ctx, x, 520 - h, r * 1.6, r); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(x - r, 520 - h + 20); ctx.bezierCurveTo(x - r, 520 - h - r * 0.8, x + r, 520 - h - r * 0.8, x + r, 520 - h + 20); ctx.closePath(); ctx.fillStyle = Art.mix(c, '#2a1a52', 0.35); ctx.fill();
      for (let k = 0; k < 5; k++) ell(ctx, x - r * 0.6 + k * r * 0.3, 520 - h - 10 - (k % 2) * 24, 8, 6, 'rgba(255,255,255,0.5)');
    }
  };
  World.bigFlowers = function (ctx, t) {
    for (const [x, h, c] of [[260, 200, '#ff9ad5'], [520, 150, '#ffd23f'], [820, 230, '#b07cff']]) {
      ctx.beginPath(); ctx.moveTo(x, 520); ctx.quadraticCurveTo(x + 20, 520 - h / 2, x, 520 - h); ctx.lineWidth = 10; ctx.strokeStyle = '#5ab84a'; ctx.stroke();
      ctx.save(); ctx.translate(x, 520 - h); ctx.rotate(Math.sin(t * 0.8 + x) * 0.08);
      for (let i = 0; i < 7; i++) { ctx.save(); ctx.rotate(i * TAU / 7); ell(ctx, 0, -38, 20, 34, c); ctx.restore(); }
      ell(ctx, 0, 0, 22, 22, '#ffb21a'); ctx.restore();
    }
  };
  World.flower = function (ctx, x, y, s, c, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -60, 0, -120); Art.stroke(ctx, 8, '#3a9a3a');
    ell(ctx, 18, -50, 18, 8, '#5ac84a'); Art.stroke(ctx, 2);
    ctx.translate(0, -120); ctx.rotate(Math.sin(t + x) * 0.1);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * TAU / 6); ell(ctx, 0, -26, 15, 24, c); Art.stroke(ctx, 2.5); ctx.restore(); }
    ell(ctx, 0, 0, 15, 15, '#ffd23f'); Art.stroke(ctx, 2.5);
    ctx.restore();
  };
  World.hive = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 4; i++) { const w = 46 - Math.abs(i - 1.5) * 10; Art.rr(ctx, -w, -30 - i * 28, w * 2, 30, 14); ctx.fillStyle = '#ffc83a'; ctx.fill(); Art.stroke(ctx, 3); }
    ell(ctx, 0, -40, 9, 9, '#5a3a1a');
    for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; ell(ctx, Math.cos(a) * 60, -80 + Math.sin(a * 1.3) * 30, 5, 4, '#2a1a0a'); ell(ctx, Math.cos(a) * 60, -84 + Math.sin(a * 1.3) * 30, 4, 3, 'rgba(255,255,255,0.8)'); }
    ctx.restore();
  };
  World.cactus = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const part = (px, py, w, h) => { Art.rr(ctx, px - w / 2, py - h, w, h, w / 2); ctx.fillStyle = '#4ab85a'; ctx.fill(); Art.stroke(ctx, 3); };
    part(-34, -40, 22, 60); part(34, -60, 22, 70); part(0, 0, 34, 150);
    ctx.fillStyle = '#4ab85a'; ctx.fillRect(-34, -52, 30, 14); ctx.fillRect(4, -72, 30, 14);
    ell(ctx, 0, -150, 10, 7, '#ff7eb6'); Art.stroke(ctx, 2);
    ctx.restore();
  };
  World.lamp = function (ctx, x, y, s, t, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#5a6a80'; ctx.fillRect(-5, -150, 10, 150); Art.stroke(ctx, 2);
    ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.1; ctx.fillStyle = Art.rg(ctx, 0, -160, 60, c, 'rgba(0,0,0,0)', 0, 0); ell(ctx, 0, -160, 60, 60); ctx.fill(); ctx.restore();
    ell(ctx, 0, -160, 16, 16, c); Art.stroke(ctx, 2.5);
    ctx.restore();
  };
  World.decor2 = function (ctx, t, id) {
    switch (id) {
      case 'flower': World.flower(ctx, 70, 610, 1.1, '#ff7eb6', t); World.flower(ctx, 1010, 590, 0.8, '#b07cff', t); World.hive(ctx, 1250, 680, 0.6, t); break;
      case 'sand': World.cactus(ctx, 70, 610, 0.8); World.cactus(ctx, 1010, 590, 0.55); Art.treatNamed(ctx, 'date', 1240, 680, 0.6); break;
      case 'robo': World.lamp(ctx, 70, 610, 1, t, '#7ee8ff'); World.lamp(ctx, 1010, 590, 0.8, t + 1, '#41d982'); Art.treatNamed(ctx, 'gearcookie', 1240, 670, 0.8, t); break;
      case 'shroom': Art.mushroom(ctx, 70, 600, 0.9, '#7effc8', t); Art.mushroom(ctx, 1010, 585, 0.7, '#ff9ad5', t); Art.mushroom(ctx, 1250, 690, 0.6, '#b07cff', t); break;
      case 'night': Art.crystal(ctx, 70, 610, 0.7, '#8f6cf2'); World.lamp(ctx, 1010, 590, 0.7, t, '#fff3a0'); Art.crystal(ctx, 1240, 620, 0.6, '#5a5ad8'); break;
    }
  };
  World.ambient2 = function (ctx, t, id, lit) {
    const v = G.view, rnd = Art.seeded(91 + id.length), W = v.x1 - v.x0, H = v.y1 - v.y0;
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const bx = rnd(), by = rnd(), sp = 0.3 + rnd() * 0.7, ph = rnd() * 10;
      let x, y;
      switch (id) {
        case 'flower': x = v.x0 + ((bx * W + t * 40 * sp) % W); y = v.y0 + by * H * 0.8 + Math.sin(t * 1.5 + ph) * 26; ctx.globalAlpha = 0.8; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + ph); ell(ctx, 0, 0, 6, 3.5, i % 2 ? '#ffb3e0' : '#ffe68a'); ctx.restore(); break;
        case 'sand': x = v.x0 + ((bx * W + t * 160 * sp) % W); y = 300 + by * 380 + Math.sin(t * 3 + ph) * 6; ctx.globalAlpha = 0.5; ell(ctx, x, y, 2 + sp * 2, 1.5, '#fff0c0'); break;
        case 'robo': x = v.x0 + bx * W + Math.sin(t + ph) * 8; y = v.y1 - ((by * H + t * 50 * sp) % H); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + ph); ell(ctx, x, y, 2.5, 2.5, i % 2 ? '#7ee8ff' : '#41d982'); break;
        case 'shroom': x = v.x0 + bx * W + Math.sin(t * 0.8 + ph) * 20; y = v.y1 - ((by * H + t * 22 * sp) % H); ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + ph)); ell(ctx, x, y, 3.5, 3.5, i % 3 ? '#7effc8' : '#ff9ad5'); ctx.globalAlpha *= 0.4; ell(ctx, x, y, 10, 10, '#7effc8'); break;
        case 'night': if (!lit && i > 8) break; x = v.x0 + bx * W + Math.sin(t * 0.7 + ph) * 30; y = 260 + by * 400 + Math.cos(t * 0.9 + ph) * 20; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + ph)); ell(ctx, x, y, 3.5, 3.5, '#fff6a0'); ctx.globalAlpha *= 0.4; ell(ctx, x, y, 11, 11, '#fff6a0'); break;
      }
    }
    ctx.restore();
  };
  // новые планеты подключаются к общему фону
  const oldBg = World.bg;
  World.bg = function (ctx, t, opt) {
    opt = opt || {};
    const pd = PLANET_BY_ID[opt.planet || S.data.planet] || PLANETS[0];
    if (!SUN[pd.id]) return oldBg.call(World, ctx, t, opt);
    const lit = !opt.beaconOff && (S.data.planets[pd.id] || {}).beacon;
    World.bg2(ctx, t, pd, opt, lit);
  };
})();
