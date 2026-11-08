// Объёмная «мягкая» графика: два дракончика Ням-Ням, космонавт в чёрном шлеме, Змей Шипун и его пещера.
// Рисует поверх аниме-версий из anime_dragon.js / anime_world.js с теми же параметрами.
'use strict';
(function () {
  const TAU = Math.PI * 2;
  const ell = Art.ell, mix = Art.mix;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  // объёмная заливка: свет сверху-слева, тень снизу-справа
  function vol(ctx, path, cx, cy, r, hi, base, shade, outline) {
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r * 1.25);
    g.addColorStop(0, hi); g.addColorStop(0.5, base); g.addColorStop(1, shade);
    path(); ctx.fillStyle = g; ctx.fill();
    if (outline) { path(); ctx.lineWidth = outline; ctx.strokeStyle = rgba(mix(shade, '#000000', 0.5), 0.55); ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  // мягкая тень-«затемнение» в местах стыка
  function ao(ctx, x, y, rx, ry, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
    ctx.beginPath(); ctx.arc(x, y, rx, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }
  const E = (ctx, x, y, rx, ry, rot) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };

  // ================== ДРАКОНЧИК ==================
  // o: {kind, t, blink, mouth, look, squash, flap, fire, happy, lift, flying, tilt, glow}
  Art.dragon = function (ctx, x, y, s, o) {
    o = o || {};
    let D = DRAGON_BY_ID[o.kind] || DRAGON_BY_ID[typeof buddy === 'function' ? buddy() : 'dark'] || DRAGONS[0];
    if (o.colors) D = paletteFrom(D, o.colors);
    if (o.outfit === undefined && o.kind && typeof Care !== 'undefined' && DRAGON_BY_ID[o.kind]) o = Object.assign({}, o, { outfit: Care.outfit(o.kind) });
    const t = o.t || 0, look = M.clamp(o.look || 0, -1, 1);
    const sq = o.squash || 0, breathe = Math.sin(t * 2.2) * 0.012;
    const lift = o.lift || 0, fly = !!o.flying;
    ctx.save(); ctx.translate(x, y);
    // тень на земле
    ctx.save(); ctx.globalAlpha = 0.28 * Math.max(0.3, 1 - lift / 400); ell(ctx, 0, 0, 105 * s * (1 - lift / 600), 17 * s, '#0a0520'); ctx.restore();
    ctx.translate(0, -lift);
    ctx.scale(s * (1 + sq * 0.12 + breathe * 0.3), s * (1 - sq * 0.12 + breathe));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.glow) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.1; ctx.fillStyle = Art.rg(ctx, 0, -130, 240, 'rgba(255,245,190,0.95)', 'rgba(255,220,255,0)', 0, 0); ell(ctx, 0, -130, 240, 240); ctx.fill(); ctx.restore(); }
    const flapA = fly ? Math.sin(t * 11) * 0.55 + 0.2 : (o.flap || 0) + Math.sin(t * 1.6) * 0.04;

    tail(ctx, D, t, fly);
    for (const side of [-1, 1]) wing(ctx, D, side, flapA, fly);
    // туловище
    const body = () => { ctx.beginPath(); ctx.moveTo(0, -158); ctx.bezierCurveTo(52, -158, 66, -96, 60, -52); ctx.bezierCurveTo(56, -14, 30, -2, 0, -2); ctx.bezierCurveTo(-30, -2, -56, -14, -60, -52); ctx.bezierCurveTo(-66, -96, -52, -158, 0, -158); ctx.closePath(); };
    vol(ctx, body, 0, -82, 72, D.hi, D.body, D.shade, 2.4);
    // животик с мягкими пластинками
    const belly = E(ctx, 0, -66, 36, 56);
    vol(ctx, belly, 0, -70, 56, D.bellyHi, D.belly, mix(D.belly, D.shade, 0.45), 0);
    ctx.save(); belly(); ctx.clip(); ctx.globalAlpha = 0.18;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(0, -112 + i * 17, 40, 7, 0, 0.15, Math.PI - 0.15); ctx.lineWidth = 2; ctx.strokeStyle = mix(D.belly, '#000000', 0.5); ctx.stroke(); }
    ctx.restore();
    marks(ctx, D, 'body', t);
    // задние лапы
    for (const side of [-1, 1]) {
      const fy = fly ? 14 : 0;
      vol(ctx, E(ctx, side * 56, -38 + fy * 0.4, 38, 36, side * 0.3), side * 56, -40, 38, D.hi, D.body, D.shade, 2.2);
      ao(ctx, side * 56, -10, 36, 10, 0.25);
      foot(ctx, D, side * 64, -6 + fy, side);
    }
    // передние лапки
    for (const side of [-1, 1]) {
      const sway = fly ? 0.25 : Math.sin(t * 1.5 + side) * 0.03;
      ctx.save(); ctx.translate(side * 40, -124); ctx.rotate(side * (-0.12 + sway));
      vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-16, 30, -11, 50); ctx.lineTo(11, 50); ctx.quadraticCurveTo(16, 30, 13, 0); ctx.closePath(); }, 0, 22, 26, D.hi, D.body, D.shade, 2);
      foot(ctx, D, 0, 54, side, 0.7);
      ctx.restore();
    }
    // шея
    vol(ctx, E(ctx, 0, -158, 38, 30), 0, -160, 36, D.hi, D.body, D.shade, 0);
    ao(ctx, 0, -140, 40, 12, 0.18);
    if (o.dirt) dirt(ctx, o.dirt.filter(d => !d.head));
    if (o.outfit && o.outfit.neck && Art.outfitItem) Art.outfitItem(ctx, o.outfit.neck, 0, -150, 1, o.t || 0);
    head(ctx, D, t, look, (o.tilt || 0) + Math.sin(t * 1.3) * 0.02, o);
    if (o.fire > 0) fire(ctx, o.fire, t, look);
    ctx.restore();
  };
  Art.dragonHeadY = function (lvl, s) { return -170 * s; };

  function foot(ctx, D, x, y, side, k) {
    k = k || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    vol(ctx, E(ctx, 0, 0, 26, 13), 0, -2, 24, D.hi, D.body, D.shade, 2);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 10 - 4, 8); ctx.quadraticCurveTo(i * 11, 17, i * 10 + 4, 8); ctx.closePath();
      ctx.fillStyle = D.claw; ctx.fill();
    }
    ctx.restore();
  }

  function marks(ctx, D, part, t) {
    t = t || 0;
    const body = part === 'body';
    ctx.save();
    switch (D.marks) {
      case 'spots': {
        ctx.globalAlpha = 0.55;
        const sp = body ? [[-38, -120, 9, 6], [-46, -92, 6, 5], [42, -128, 7, 5], [48, -100, 10, 7], [-52, -50, 8, 6], [54, -60, 6, 5], [-60, -34, 6, 4], [62, -30, 8, 5]]
          : [[-40, -26, 7, 5], [44, -30, 8, 5], [-10, -42, 6, 4], [16, -44, 5, 4], [50, -8, 5, 4]];
        for (const [x, y, rx, ry] of sp) { ctx.fillStyle = Art.rg(ctx, x, y, rx, D.spot, rgba(D.spot, 0), 0, 0); ell(ctx, x, y, rx, ry); ctx.fill(); }
        break;
      }
      case 'freckles':
        if (body) break;
        ctx.globalAlpha = 0.7;
        for (const side of [-1, 1]) for (const [x, y] of [[34, 20], [42, 26], [37, 31], [46, 18]]) ell(ctx, side * x, y, 2.4, 2.4, D.spot);
        break;
      case 'stripes': case 'bee': {
        const bee = D.marks === 'bee';
        ctx.globalAlpha = bee ? 0.85 : 0.6; ctx.lineCap = 'round'; ctx.strokeStyle = D.spot;
        if (body) for (const y of bee ? [-132, -100, -68, -38] : [-128, -98, -68]) for (const side of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(side * 62, y - 6); ctx.quadraticCurveTo(side * 48, y + 4, side * 34, y + 2); ctx.lineWidth = bee ? 13 : 7; ctx.stroke();
        }
        else for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 8, -46); ctx.quadraticCurveTo(side * 14, -32, side * 10, -22); ctx.lineWidth = 5; ctx.stroke(); }
        break;
      }
      case 'scales': {
        ctx.globalAlpha = 0.4; ctx.strokeStyle = D.spot; ctx.lineWidth = 2.2;
        const pts = body ? [[-50, -120], [-56, -100], [-50, -80], [-58, -60], [50, -120], [56, -100], [50, -80], [58, -60], [-44, -138], [44, -138]] : [[-36, -30], [-44, -16], [36, -30], [44, -16], [0, -40]];
        for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, 7, 0.2, Math.PI - 0.2); ctx.stroke(); }
        break;
      }
      case 'swirl': {
        ctx.globalAlpha = 0.6; ctx.strokeStyle = D.spot; ctx.lineWidth = 3;
        for (const [x, y, k] of body ? [[-48, -110, 1], [50, -90, -1], [-54, -52, 1], [52, -46, -1]] : [[-38, -22, 1], [40, -24, -1]]) {
          ctx.beginPath(); for (let i = 0; i <= 20; i++) { const a = i * 0.5 * k, r = 2 + i * 0.6; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
        }
        break;
      }
      case 'frost': {
        ctx.globalAlpha = 0.75; ctx.strokeStyle = D.spot; ctx.lineWidth = 2;
        for (const [x, y, r] of body ? [[-46, -116, 8], [50, -96, 7], [-54, -56, 6], [54, -50, 8], [40, -136, 5]] : [[-40, -24, 6], [42, -28, 5]]) {
          for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
        }
        break;
      }
      case 'hearts': {
        ctx.globalAlpha = 0.75;
        for (const [x, y, r] of body ? [[-48, -112, 7], [50, -94, 8], [-54, -54, 6], [54, -48, 7]] : [[-40, -22, 5], [42, -26, 5]]) Art.heart(ctx, x, y, r * 1.6, D.spot);
        break;
      }
      case 'diamonds': {
        ctx.globalAlpha = 0.55; ctx.fillStyle = D.spot;
        for (const [x, y] of body ? [[-52, -118], [-58, -92], [-56, -64], [52, -118], [58, -92], [56, -64]] : [[0, -42]]) { ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill(); }
        break;
      }
      case 'rivets': {
        if (body) {
          ctx.globalAlpha = 0.5; ctx.strokeStyle = D.shade; ctx.lineWidth = 2;
          for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 44, -146); ctx.quadraticCurveTo(side * 62, -90, side * 50, -30); ctx.stroke(); }
          ctx.globalAlpha = 0.9;
          for (const [x, y] of [[-50, -120], [-56, -86], [-52, -52], [50, -120], [56, -86], [52, -52]]) { ell(ctx, x, y, 3.5, 3.5, D.hi); ctx.lineWidth = 1; ctx.stroke(); }
          // огонёк на груди
          ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3; ctx.fillStyle = Art.rg(ctx, 0, -120, 16, '#c8ffe0', rgba(D.spot, 0), 0, 0); ell(ctx, 0, -120, 16, 16); ctx.fill();
          ctx.globalAlpha = 1; ell(ctx, 0, -120, 6, 6, D.spot);
        } else { ctx.globalAlpha = 0.9; for (const side of [-1, 1]) ell(ctx, side * 46, -16, 3, 3, D.hi); }
        break;
      }
      case 'glow': case 'stars': {
        const star = D.marks === 'stars';
        for (const [x, y, r, ph] of body ? [[-48, -116, 6, 0], [50, -98, 5, 1], [-56, -64, 5, 2], [54, -54, 6, 3], [-30, -140, 4, 4], [36, -138, 4, 5]] : [[-40, -24, 4, 1], [42, -28, 4, 2], [0, -44, 3, 3]]) {
          const k = 0.55 + Math.sin(t * 3 + ph) * 0.35;
          ctx.globalAlpha = k * 0.6; ctx.fillStyle = Art.rg(ctx, x, y, r * 3, D.spot, rgba(D.spot, 0), 0, 0); ell(ctx, x, y, r * 3, r * 3); ctx.fill();
          ctx.globalAlpha = Math.min(1, k + 0.3);
          if (star) Art.roundStar(ctx, x, y, r * 1.3, D.spot); else ell(ctx, x, y, r, r, mix(D.spot, '#ffffff', 0.4));
        }
        break;
      }
    }
    ctx.restore();
  }

  // необычные крылья: плавники, перья, листья, крылья пчёлки
  const WINGS = {
    fin(ctx, D, k) {
      const mem = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(40 * k, -90, 110 * k, -100, 124 * k, -64); ctx.bezierCurveTo(118 * k, -30, 70 * k, 10, 0, 22); ctx.closePath(); };
      const g = ctx.createLinearGradient(0, 0, 120 * k, -80); g.addColorStop(0, D.wing); g.addColorStop(1, rgba(D.wingMem, 0.75));
      mem(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(mix(D.wing, '#000000', 0.4), 0.6); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(4, 6); ctx.quadraticCurveTo((30 + i * 14) * k, -60 + i * 8, (112 - i * 14) * k, -70 + i * 22); ctx.stroke(); }
    },
    feather(ctx, D, k) {
      for (let i = 5; i >= 0; i--) {
        const a = -0.2 - i * 0.22, L = (70 + i * 12) * k;
        ctx.save(); ctx.rotate(a);
        vol(ctx, E(ctx, L * 0.55, 0, L * 0.55, 14), L * 0.5, -4, L * 0.5, '#ffffff', D.wingMem, mix(D.wing, '#000000', 0.1), 1.5);
        ctx.restore();
      }
    },
    leaf(ctx, D, k) {
      const leaf = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(50 * k, -110, 130 * k, -96); ctx.quadraticCurveTo(110 * k, -20, 0, 20); ctx.closePath(); };
      vol(ctx, leaf, 60 * k, -50, 80, D.wingMem, mix(D.wing, D.wingMem, 0.4), D.wing, 2);
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(60 * k, -50, 126 * k, -94); ctx.lineWidth = 3; ctx.strokeStyle = rgba(D.shade, 0.6); ctx.stroke();
      for (let i = 1; i < 5; i++) { const x = i * 24 * k, y = 8 - i * 22; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 * k, y - 26); ctx.moveTo(x, y); ctx.lineTo(x + 24 * k, y + 4); ctx.lineWidth = 1.5; ctx.stroke(); }
    },
    bee(ctx, D, k) {
      for (const [rot, L, w] of [[-0.9, 96, 34], [-0.25, 74, 26]]) {
        ctx.save(); ctx.rotate(rot);
        ctx.globalAlpha = 0.55; ell(ctx, L * 0.55 * k, 0, L * 0.55 * k, w, '#e8f8ff');
        ctx.globalAlpha = 0.8; ctx.lineWidth = 2; ctx.strokeStyle = '#8aa8c8'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L * 0.9 * k, 0); ctx.moveTo(L * 0.4 * k, 0); ctx.lineTo(L * 0.7 * k, -w * 0.6); ctx.moveTo(L * 0.4 * k, 0); ctx.lineTo(L * 0.7 * k, w * 0.6); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.globalAlpha = 0.6; ell(ctx, L * 0.4 * k, -w * 0.4, L * 0.14, w * 0.18, '#ffffff');
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  };

  function wing(ctx, D, side, a, fly) {
    if (D.wingType && WINGS[D.wingType]) { ctx.save(); ctx.translate(side * 40, -128); ctx.scale(side, 1); ctx.rotate(-0.15 - a * 0.9); WINGS[D.wingType](ctx, D, fly ? 1.2 : 1); ctx.restore(); return; }
    ctx.save(); ctx.translate(side * 40, -128); ctx.scale(side, 1); ctx.rotate(-0.15 - a * 0.9);
    const spread = fly ? 1.25 : 1;
    const ex = 70 * spread, ey = -70, wx = 120 * spread, wy = -96;
    // перепонка
    const mem = () => {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ex * 0.6, ey - 10, ex, ey); ctx.lineTo(wx, wy);
      ctx.quadraticCurveTo(wx + 8, wy + 40, wx - 6, wy + 80);
      ctx.quadraticCurveTo(wx - 22, wy + 70, wx - 34, wy + 96);
      ctx.quadraticCurveTo(wx - 52, wy + 84, wx - 70, wy + 108);
      ctx.quadraticCurveTo(40, 30, 0, 22); ctx.closePath();
    };
    const g = ctx.createLinearGradient(0, 0, wx, wy);
    g.addColorStop(0, D.wing); g.addColorStop(0.6, D.wingMem); g.addColorStop(1, mix(D.wingMem, '#ffffff', 0.2));
    mem(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(mix(D.wing, '#000000', 0.5), 0.5); ctx.stroke();
    // косточки
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ex * 0.6, ey - 10, ex, ey); ctx.lineTo(wx, wy);
    ctx.moveTo(ex, ey); ctx.lineTo(wx - 6, wy + 80); ctx.moveTo(ex, ey); ctx.lineTo(wx - 34, wy + 96); ctx.moveTo(ex, ey); ctx.lineTo(wx - 70, wy + 108);
    ctx.lineWidth = 6; ctx.strokeStyle = D.body; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(D.hi, 0.5); ctx.stroke();
    ell(ctx, wx, wy, 4, 4, D.claw);
    ctx.restore();
  }

  function tail(ctx, D, t, fly) {
    const sw = Math.sin(t * 1.8) * 10;
    const P0 = [40, -30], P1 = [150, -40 + (fly ? 30 : 0)], P2 = [130 + sw, 30 + (fly ? 40 : 0)];
    const n = 18, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; pts.push([a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1]]); }
    const L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const p = pts[i], q = pts[Math.min(n, i + 1)], r0 = pts[Math.max(0, i - 1)];
      const dx = q[0] - r0[0], dy = q[1] - r0[1], len = Math.hypot(dx, dy) || 1, w = 22 * (1 - i / n * 0.8);
      L.push([p[0] - dy / len * w, p[1] + dx / len * w]); R.push([p[0] + dy / len * w, p[1] - dx / len * w]);
    }
    const path = () => { ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const p of L) ctx.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); };
    vol(ctx, path, 110, -10, 80, D.hi, D.body, D.shade, 2);
    // кончик хвоста
    const tip = pts[n], pre = pts[n - 2], ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
    ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(ang);
    if (TIPS[D.tip]) TIPS[D.tip](ctx, D, t);
    else if (D.tip === 'spade') {
      vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-4, 0); ctx.bezierCurveTo(4, -22, 22, -18, 30, 0); ctx.bezierCurveTo(22, 18, 4, 22, -4, 0); ctx.closePath(); }, 12, 0, 22, mix(D.spot, '#ffffff', 0.3), D.spot, D.shade, 2);
    } else {
      for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.32; ctx.save(); ctx.rotate(a); vol(ctx, E(ctx, 14, 0, 18, 7), 12, 0, 18, '#fff3cf', D.spot, mix(D.spot, '#7a5a20', 0.4), 0); ctx.restore(); }
    }
    ctx.restore();
  }

  // кончики хвостов
  const TIPS = {
    fin(ctx, D) { vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(20, -8, 34, -30); ctx.quadraticCurveTo(26, 0, 34, 30); ctx.quadraticCurveTo(20, 8, -2, 0); ctx.closePath(); }, 18, 0, 26, D.wingMem, mix(D.wingMem, D.body, 0.4), D.body, 2); },
    flame(ctx, D, t) {
      for (let i = 0; i < 3; i++) { const f = Math.sin(t * 12 + i) * 4; ctx.beginPath(); ctx.moveTo(0, -10 + i * 3); ctx.quadraticCurveTo(28 - i * 6, -22 + f, 44 - i * 10 + f, 0); ctx.quadraticCurveTo(28 - i * 6, 22 - f, 0, 10 - i * 3); ctx.closePath(); ctx.fillStyle = ['#ff5a1a', '#ffb23a', '#fff6a0'][i]; ctx.fill(); }
    },
    cloud(ctx, D) { for (const [x, y, r] of [[10, -6, 12], [22, 6, 13], [26, -10, 10], [36, 0, 11]]) vol(ctx, E(ctx, x, y, r, r), x, y, r, '#ffffff', D.wingMem, mix(D.body, '#ffffff', 0.2), 1.5); },
    snowflake(ctx, D) {
      ctx.translate(20, 0); ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); for (const sx of [-1, 1]) { ctx.moveTo(sx * 11, 0); ctx.lineTo(sx * 16, -5); ctx.moveTo(sx * 11, 0); ctx.lineTo(sx * 16, 5); } ctx.lineWidth = 7; ctx.strokeStyle = D.hornShade; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore(); }
    },
    rainbow(ctx) { ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'].forEach((c, i) => { ctx.save(); ctx.rotate((i - 2.5) * 0.24); ell(ctx, 18, 0, 20, 6, c); ctx.restore(); }); },
    leaf(ctx, D) { vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(18, -22, 42, 0); ctx.quadraticCurveTo(18, 22, -2, 0); ctx.closePath(); }, 20, 0, 22, D.wingMem, '#4cc85a', '#1e7a2e', 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(38, 0); ctx.lineWidth = 2; ctx.strokeStyle = '#1e6a2a'; ctx.stroke(); },
    flower(ctx) { ctx.translate(18, 0); for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * TAU / 5); ell(ctx, 10, 0, 10, 6.5, '#ff9ad5'); ctx.restore(); } ell(ctx, 0, 0, 6, 6, '#ffd23f'); },
    sun(ctx) { ctx.translate(18, 0); for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * TAU / 8); ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(19, 0); ctx.lineTo(10, 4); ctx.fillStyle = '#ff9a3c'; ctx.fill(); ctx.restore(); } vol(ctx, E(ctx, 0, 0, 11, 11), 0, 0, 11, '#fff6b0', '#ffd23f', '#e09a1a', 1.5); },
    bolt(ctx, D) { ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(22, -14); ctx.lineTo(16, -2); ctx.lineTo(36, -6); ctx.lineTo(12, 14); ctx.lineTo(18, 2); ctx.lineTo(0, 6); ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#b8901a'; ctx.stroke(); },
    glow(ctx, D, t) {
      const k = 0.7 + Math.sin(t * 3) * 0.3;
      ctx.globalAlpha = 0.5 * k; ctx.fillStyle = Art.rg(ctx, 16, 0, 34, D.spot, rgba(D.spot, 0), 0, 0); ell(ctx, 16, 0, 34, 34); ctx.fill();
      ctx.globalAlpha = 1; vol(ctx, E(ctx, 16, 0, 12, 12), 16, 0, 12, '#ffffff', D.spot, mix(D.spot, '#000000', 0.3), 1.5);
    },
    moon(ctx, D, t) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.15; ctx.fillStyle = Art.rg(ctx, 18, 0, 30, D.spot, rgba(D.spot, 0), 0, 0); ell(ctx, 18, 0, 30, 30); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(18, 0, 14, 0, TAU); ctx.arc(24, -4, 11, 0, TAU, true); ctx.fillStyle = D.spot; ctx.fill('evenodd');
    },
  };
  // особенности головы: позади (back) и поверх (front)
  const EXTRAS = {
    earfins: { back(ctx, D) { for (const side of [-1, 1]) { ctx.save(); ctx.scale(side, 1); vol(ctx, () => { ctx.beginPath(); ctx.moveTo(52, -10); ctx.quadraticCurveTo(96, -40, 104, -6); ctx.quadraticCurveTo(92, 6, 104, 22); ctx.quadraticCurveTo(80, 20, 54, 14); ctx.closePath(); }, 80, 0, 30, D.wingMem, mix(D.wingMem, D.body, 0.4), D.body, 2); ctx.restore(); } } },
    mane: { back(ctx, D, t) { ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'].forEach((c, i) => { const a = -2.4 + i * 0.22, w = Math.sin(t * 2 + i) * 0.05; ctx.save(); ctx.rotate(a + w); ell(ctx, 0, -62, 12, 26, c); ctx.restore(); }); } },
    bigears: { noHorns: true, back(ctx, D) { for (const side of [-1, 1]) { ctx.save(); ctx.scale(side, 1); vol(ctx, () => { ctx.beginPath(); ctx.moveTo(24, -36); ctx.quadraticCurveTo(70, -120, 96, -96); ctx.quadraticCurveTo(84, -50, 54, -14); ctx.closePath(); }, 60, -60, 50, D.hi, D.body, D.shade, 2); ctx.beginPath(); ctx.moveTo(36, -36); ctx.quadraticCurveTo(70, -100, 86, -90); ctx.quadraticCurveTo(76, -54, 54, -24); ctx.closePath(); ctx.fillStyle = '#ffb3a0'; ctx.fill(); ctx.restore(); } } },
    crystals: { front(ctx) { for (const [x, h, c] of [[-12, 30, '#d8f8ff'], [4, 44, '#9ae0ff'], [18, 28, '#ffffff']]) { ctx.beginPath(); ctx.moveTo(x - 8, -44); ctx.lineTo(x, -44 - h); ctx.lineTo(x + 8, -44); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a9ad8'; ctx.stroke(); } } },
    sprout: { front(ctx, D, t) { ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(4, -64, 0, -76); ctx.lineWidth = 4; ctx.strokeStyle = '#2a8a3a'; ctx.stroke(); for (const side of [-1, 1]) { ctx.save(); ctx.translate(0, -74); ctx.rotate(side * (0.9 + Math.sin(t * 2) * 0.1)); ell(ctx, 0, -12, 7, 13, '#7ae06a'); ctx.restore(); } } },
    antennae: { noHorns: true, front(ctx, D, t) { for (const side of [-1, 1]) { const w = Math.sin(t * 3 + side) * 4; ctx.beginPath(); ctx.moveTo(side * 16, -44); ctx.quadraticCurveTo(side * 28, -84, side * 44 + w, -96); ctx.lineWidth = 4; ctx.strokeStyle = '#3a2a1a'; ctx.stroke(); vol(ctx, E(ctx, side * 44 + w, -98, 9, 9), side * 44, -98, 9, '#ffe9a0', '#ffc83a', '#a8701a', 1.5); } } },
    antenna: { front(ctx, D, t) { ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -86); ctx.lineWidth = 5; ctx.strokeStyle = '#5a6a80'; ctx.stroke(); const on = Math.sin(t * 5) > 0; if (on) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = Art.rg(ctx, 0, -92, 22, '#ff5a6a', 'rgba(255,90,106,0)', 0, 0); ell(ctx, 0, -92, 22, 22); ctx.fill(); ctx.restore(); } ell(ctx, 0, -92, 9, 9, on ? '#ff5a6a' : '#a83a4a'); ctx.lineWidth = 2; ctx.strokeStyle = '#3a2a3a'; ctx.stroke(); } },
    cap: { noHorns: true, front(ctx, D) { vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-74, -24); ctx.bezierCurveTo(-70, -100, 70, -100, 74, -24); ctx.quadraticCurveTo(0, -36, -74, -24); ctx.closePath(); }, 0, -60, 70, '#ff9ad5', '#d0408a', '#7a1a5a', 2); for (const [x, y, r] of [[-38, -52, 9], [0, -72, 11], [36, -50, 8], [-14, -44, 5], [56, -36, 5]]) { ctx.save(); ctx.globalAlpha = 0.9; ell(ctx, x, y, r, r * 0.8, '#fff6fb'); ctx.restore(); } } },
  };

  function head(ctx, D, t, look, tilt, o) {
    ctx.save(); ctx.translate(look * 7, -200); ctx.rotate(tilt);
    const X = EXTRAS[D.extra] || {};
    if (X.back) { ctx.save(); X.back(ctx, D, t); ctx.restore(); }
    // гребень
    for (let i = 0; i < 3; i++) {
      const y = -48 + i * 16, h = 16 - i * 3;
      ctx.beginPath(); ctx.moveTo(-6, y + 6); ctx.quadraticCurveTo(0, y - h, 6, y + 6); ctx.closePath();
      ctx.fillStyle = mix(D.horn, D.body, 0.35); ctx.fill();
    }
    // рожки
    if (!X.noHorns) for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      const horn = () => { ctx.beginPath(); ctx.moveTo(18, -36); ctx.bezierCurveTo(30, -70, 54, -88, 72, -86); ctx.bezierCurveTo(58, -78, 46, -58, 40, -30); ctx.closePath(); };
      const g = ctx.createLinearGradient(20, -30, 70, -86); g.addColorStop(0, D.hornShade); g.addColorStop(0.5, D.horn); g.addColorStop(1, mix(D.horn, '#ffffff', 0.4));
      horn(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(D.hornShade, 0.8); ctx.stroke();
      ctx.globalAlpha = 0.35; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(22 + i * 8, -40 - i * 11); ctx.lineTo(32 + i * 8, -36 - i * 11); ctx.lineWidth = 1.5; ctx.strokeStyle = D.hornShade; ctx.stroke(); }
      ctx.restore();
    }
    // щёчные шипики
    for (const side of [-1, 1]) for (const [y, l] of [[0, 20], [16, 15]]) {
      ctx.beginPath(); ctx.moveTo(side * 54, y - 7); ctx.quadraticCurveTo(side * (58 + l), y, side * (56 + l), y + 4); ctx.lineTo(side * 52, y + 8); ctx.closePath();
      ctx.fillStyle = mix(D.body, D.hi, 0.3); ctx.fill();
    }
    // голова
    const skull = () => { ctx.beginPath(); ctx.moveTo(0, -50); ctx.bezierCurveTo(44, -50, 64, -22, 60, 8); ctx.bezierCurveTo(56, 40, 30, 56, 0, 56); ctx.bezierCurveTo(-30, 56, -56, 40, -60, 8); ctx.bezierCurveTo(-64, -22, -44, -50, 0, -50); ctx.closePath(); };
    vol(ctx, skull, 0, 0, 62, D.hi, D.body, D.shade, 2.4);
    // мордочка
    const muz = E(ctx, 0, 30, 40, 25);
    vol(ctx, muz, 0, 28, 40, mix(D.hi, '#ffffff', 0.15), mix(D.body, D.hi, 0.35), D.body, 0);
    marks(ctx, D, 'head', t);
    // ноздри
    for (const side of [-1, 1]) { ctx.save(); ctx.globalAlpha = 0.75; ell(ctx, side * 10, 22, 4, 2.6, mix(D.shade, '#000000', 0.5), side * 0.4); ctx.restore(); }
    // рот
    const m = o.mouth || 0;
    if (m > 0.05) {
      ctx.beginPath(); ctx.ellipse(0, 40, 16 + m * 4, 4 + m * 12, 0, 0, TAU); ctx.fillStyle = '#5a1a2a'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 40, 16 + m * 4, 4 + m * 12, 0, 0, TAU); ctx.clip(); ell(ctx, 0, 48 + m * 6, 12, 8, '#e86a8a'); ctx.restore();
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 9, 36 - m * 6); ctx.lineTo(side * 6, 42 - m * 4); ctx.lineTo(side * 3, 36 - m * 6); ctx.fillStyle = '#fff8ea'; ctx.fill(); }
    } else {
      const sad = o.mood === 'sad' && !o.happy;
      ctx.beginPath(); ctx.moveTo(-20, sad ? 42 : 36); ctx.quadraticCurveTo(0, o.happy ? 50 : sad ? 32 : 44, 20, sad ? 42 : 36);
      ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(mix(D.shade, '#000000', 0.5), 0.75); ctx.stroke();
    }
    // румянец
    ctx.save(); ctx.globalAlpha = o.happy ? 0.35 : 0.15; ell(ctx, -38, 18, 11, 6, '#ff8fb0'); ell(ctx, 38, 18, 11, 6, '#ff8fb0'); ctx.restore();
    // глаза
    for (const side of [-1, 1]) eye(ctx, D, side * 27, -6, side, look, o);
    if (o.mood === 'sad' && !o.sleep) for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 12, -26); ctx.lineTo(side * 40, -18); ctx.lineWidth = 4; ctx.strokeStyle = rgba(mix(D.shade, '#000000', 0.5), 0.85); ctx.stroke();
    }
    if (o.dirt) dirt(ctx, o.dirt.filter(d => d.head));
    if (X.front && !(o.outfit && o.outfit.head)) { ctx.save(); X.front(ctx, D, t); ctx.restore(); }
    if (o.outfit && Art.outfitItem) {
      if (o.outfit.face) Art.outfitItem(ctx, o.outfit.face, 0, -6, 1, o.t || 0);
      if (o.outfit.head) Art.outfitItem(ctx, o.outfit.head, 0, -46, 1, o.t || 0);
    }
    ctx.restore();
  }
  function dirt(ctx, list) {
    for (const d of list) {
      if (d.a <= 0.02) continue;
      ctx.save(); ctx.globalAlpha = d.a * 0.85;
      ctx.fillStyle = Art.rg(ctx, d.x, d.y, d.r, '#7a5228', 'rgba(110,70,30,0)', 0, 0); ell(ctx, d.x, d.y, d.r, d.r * 0.8); ctx.fill();
      ell(ctx, d.x - d.r * 0.2, d.y, d.r * 0.5, d.r * 0.4, '#6a4420');
      ctx.restore();
    }
  }
  function paletteFrom(D, c) {
    const body = c.body || D.body, belly = c.belly || D.belly, wing = c.wing || D.wingMem, horn = c.horn || D.horn, eye = c.eye || D.iris[1];
    return Object.assign({}, D, {
      body, hi: mix(body, '#ffffff', 0.35), shade: mix(body, '#000000', 0.45), belly, bellyHi: mix(belly, '#ffffff', 0.4),
      wing: mix(body, '#000000', 0.15), wingMem: wing, horn, hornShade: mix(horn, '#000000', 0.35), claw: horn,
      iris: [mix(eye, '#ffffff', 0.6), eye, mix(eye, '#000000', 0.55)], spot: c.spot || mix(body, '#ffffff', 0.35), marks: 'spots',
    });
  }

  function eye(ctx, D, x, y, side, look, o) {
    const rx = 16, ry = 15;
    ctx.save(); ctx.translate(x, y);
    // глазница
    ao(ctx, 0, -2, rx + 8, ry + 6, 0.22);
    if (o.sleep) {
      ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, 8, rx, 0);
      ctx.lineWidth = 4; ctx.strokeStyle = rgba(mix(D.shade, '#000000', 0.6), 0.9); ctx.stroke();
      ctx.restore(); return;
    }
    if (o.happy) {
      ctx.beginPath(); ctx.moveTo(-rx, 2); ctx.quadraticCurveTo(0, -ry, rx, 2);
      ctx.lineWidth = 4; ctx.strokeStyle = rgba(mix(D.shade, '#000000', 0.6), 0.9); ctx.stroke();
      ctx.restore(); return;
    }
    const shape = () => { ctx.beginPath(); ctx.moveTo(-rx, 2); ctx.bezierCurveTo(-rx, -ry * 1.1, rx * 0.8, -ry * 1.15, rx, -2); ctx.bezierCurveTo(rx * 1.05, ry * 0.9, -rx * 0.7, ry * 1.1, -rx, 2); ctx.closePath(); };
    ctx.save(); if (side < 0) ctx.scale(-1, 1); shape(); ctx.restore();
    const ig = ctx.createRadialGradient(look * 4, 2, 1, look * 4, 0, rx * 1.1);
    ig.addColorStop(0, D.iris[0]); ig.addColorStop(0.55, D.iris[1]); ig.addColorStop(1, D.iris[2]);
    ctx.fillStyle = ig; ctx.fill();
    ctx.save(); ctx.clip();
    // зрачок-щёлочка
    ell(ctx, look * 5, 1, 3.6, 11, '#0c0814');
    // тень от века
    const lg = ctx.createLinearGradient(0, -ry, 0, 0); lg.addColorStop(0, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, ry);
    // блики
    ell(ctx, -5 + look * 3, -6, 4, 3.4, 'rgba(255,255,255,0.95)');
    ell(ctx, 6 + look * 3, 6, 1.8, 1.8, 'rgba(255,255,255,0.6)');
    // моргание: веко опускается сверху
    const b = Math.max(o.blink || 0, o.mood === 'sad' ? 0.3 : 0);
    if (b > 0) { ctx.fillStyle = D.body; ctx.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, (ry * 2 + 4) * b); }
    ctx.restore();
    ctx.save(); if (side < 0) ctx.scale(-1, 1); shape(); ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(mix(D.shade, '#000000', 0.6), 0.8); ctx.stroke();
    if (b > 0.5) { ctx.beginPath(); ctx.moveTo(-rx, 2); ctx.quadraticCurveTo(0, 7, rx, 2); ctx.lineWidth = 2.5; ctx.stroke(); }
    // надбровная дуга
    ctx.beginPath(); ctx.moveTo(-rx - 2, -ry + 1); ctx.quadraticCurveTo(0, -ry - 7, rx + 3, -ry + 3);
    ctx.lineWidth = 3; ctx.strokeStyle = rgba(D.hi, 0.35); ctx.stroke();
    ctx.restore();
  }

  function fire(ctx, k, t, look) {
    ctx.save(); ctx.translate(look * 7, -160); ctx.globalAlpha = Math.min(1, k * 1.5);
    for (let i = 6; i >= 0; i--) {
      const d = 30 + i * 26 * k, r = 14 + i * 7 * k, wob = Math.sin(t * 30 + i) * 6;
      ctx.fillStyle = Art.rg(ctx, d * 0.7 + wob, d * 0.6, r, i < 2 ? '#fffbd0' : '#ffd23f', i < 3 ? 'rgba(255,140,40,0.85)' : 'rgba(255,80,30,0)', 0, 0);
      ell(ctx, d * 0.7 + wob, d * 0.6, r, r); ctx.fill();
    }
    ctx.restore();
  }

  // ================== КОСМОНАВТ (прозрачный шлем; o.dark — тёмное стекло воришки) ==================
  // o.anim: idle | wave | jump | dance | salute | spin | cheer | walk ; o.at — время анимации
  Art.astronaut = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0, an = o.anim || (o.wave ? 'wave' : o.walk ? 'walk' : 'idle'), at = o.at != null ? o.at : t;
    let lift = o.lift || 0, rot = 0, sx = 1, armL = 0.35, armR = -0.35, legL = 0, legR = 0;
    switch (an) {
      case 'wave': armR = -2.6 + Math.sin(at * 12) * 0.45; break;
      case 'jump': lift += Math.abs(Math.sin(at * 5)) * 70; armL = 2.6; armR = -2.6; legL = -0.3; legR = 0.3; break;
      case 'dance': rot = Math.sin(at * 8) * 0.18; armL = 1.5 + Math.sin(at * 8) * 1.1; armR = -1.5 + Math.sin(at * 8) * 1.1; lift += Math.abs(Math.sin(at * 8)) * 12; legL = Math.sin(at * 8) * 0.3; legR = -legL; break;
      case 'salute': armR = -2.3; break;
      case 'spin': sx = Math.cos(at * 9); lift += Math.sin(Math.min(1, at / 0.7) * Math.PI) * 40; armL = 1.2; armR = -1.2; break;
      case 'cheer': armL = 2.7 + Math.sin(at * 14) * 0.2; armR = -2.7 - Math.sin(at * 14) * 0.2; lift += Math.abs(Math.sin(at * 7)) * 20; break;
      case 'walk': legL = Math.sin(t * 10) * 0.4; legR = -legL; armL = 0.35 - legL; armR = -0.35 - legL; break;
      default: armL = 0.35 + Math.sin(t * 2) * 0.05; armR = -0.35 - Math.sin(t * 2) * 0.05;
    }
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.28; ell(ctx, 0, 0, 46 * s * (1 - lift / 300), 9 * s, '#0a0520'); ctx.restore();
    ctx.translate(0, -lift); ctx.scale(s * (sx === 1 ? 1 : (Math.abs(sx) < 0.15 ? 0.15 * Math.sign(sx || 1) : sx)), s);
    if (o.flip) ctx.scale(-1, 1);
    ctx.rotate(rot);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const dk = !!o.dark;
    const W = dk ? '#4a4660' : '#f4f5f9', WH = dk ? '#7a7494' : '#ffffff', WS = dk ? '#24203a' : '#a9afc4', OR = dk ? '#ffd23f' : '#ff8a2a';
    // хвостик, торчащий из-под скафандра (подсказка, кто прячется у воришки внутри)
    if (o.tail) {
      const D = DRAGON_BY_ID.tenek, w = Math.sin(t * 3) * 6;
      ctx.beginPath(); ctx.moveTo(-14, -50); ctx.quadraticCurveTo(-60, -40 + w, -66, -8 + w); ctx.lineWidth = 12; ctx.strokeStyle = D.body; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = D.hi; ctx.stroke();
      ctx.beginPath(); ctx.arc(-68, -4 + w, 9, 0, TAU); ctx.arc(-64, -8 + w, 7, 0, TAU, true); ctx.fillStyle = D.spot; ctx.fill('evenodd');
    }
    // ранец
    vol(ctx, () => Art.rr(ctx, -38, -120, 26, 60, 9), -25, -90, 34, dk ? '#6a6488' : '#f0f2f8', dk ? '#4a4660' : '#d8dcea', dk ? '#24203a' : '#9aa0b8', 1.5);
    if (o.jet) for (const jx of [-30, -20]) { const f = 0.7 + Math.sin(t * 30 + jx) * 0.3; ctx.beginPath(); ctx.moveTo(jx - 5, -60); ctx.quadraticCurveTo(jx, -60 + 40 * f * o.jet, jx + 5, -60); ctx.fillStyle = '#ffb23a'; ctx.fill(); }
    // ноги
    for (const [side, lg] of [[-1, legL], [1, legR]]) {
      ctx.save(); ctx.translate(side * 12, -48); ctx.rotate(lg);
      vol(ctx, () => Art.rr(ctx, -10, 0, 20, 34, 9), 0, 14, 24, WH, W, WS, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-10, 16, 20, 3);
      vol(ctx, () => { ctx.beginPath(); ctx.moveTo(-12, 28); ctx.lineTo(12, 28); ctx.quadraticCurveTo(side * 19, 30, side * 17, 43); ctx.lineTo(-side * 13, 43); ctx.closePath(); }, 0, 36, 18, '#6a6f86', '#4a4e62', '#24263a', 1.5);
      ctx.restore();
    }
    // туловище
    const torso = () => { ctx.beginPath(); ctx.moveTo(-25, -108); ctx.quadraticCurveTo(-31, -62, -23, -44); ctx.lineTo(23, -44); ctx.quadraticCurveTo(31, -62, 25, -108); ctx.closePath(); };
    vol(ctx, torso, 0, -78, 44, WH, W, WS, 1.8);
    // складки ткани
    ctx.save(); torso(); ctx.clip(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#5a6080'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18, -70); ctx.quadraticCurveTo(-8, -66, -2, -72); ctx.moveTo(6, -66); ctx.quadraticCurveTo(14, -62, 20, -68); ctx.stroke(); ctx.restore();
    ctx.fillStyle = OR; ctx.fillRect(-25, -58, 50, 6); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-25, -53, 50, 1.5);
    vol(ctx, () => Art.rr(ctx, -12, -98, 24, 20, 4), 0, -88, 16, '#e8ebf5', '#c8cee0', '#8a92ac', 1.2);
    ell(ctx, -5, -88, 2.8, 2.8, '#ff4f6d'); ell(ctx, 3, -88, 2.8, 2.8, '#41d982'); ell(ctx, 6, -82, 2, 2, '#3fa9ff');
    // руки
    for (const [side, ang] of [[-1, armL], [1, armR]]) {
      ctx.save(); ctx.translate(side * 23, -102); ctx.rotate(ang);
      vol(ctx, () => Art.rr(ctx, -8, 0, 16, 36, 8), 0, 16, 22, WH, W, WS, 1.5);
      vol(ctx, E(ctx, 0, 39, 9.5, 9.5), 0, 38, 10, '#7a7f96', '#4a4e62', '#24263a', 1.2);
      if (side === 1 && o.holding != null) Art.treat(ctx, o.holding, 0, 56, 0.45, t);
      ctx.restore();
    }
    // воротник
    vol(ctx, E(ctx, 0, -106, 28, 8), 0, -108, 28, '#ffffff', '#dfe3ee', '#9aa0b8', 1.5);
    // шлем: белая оболочка и чёрное непрозрачное стекло
    const hy = -142;
    vol(ctx, E(ctx, 0, hy, 44, 42), 0, hy, 44, dk ? '#8a84a8' : '#ffffff', dk ? '#5a5478' : '#eceef4', dk ? '#2a2640' : '#a4abc0', 2);
    const visor = () => { ctx.beginPath(); ctx.moveTo(-34, hy - 6); ctx.bezierCurveTo(-34, hy - 32, 34, hy - 32, 34, hy - 6); ctx.bezierCurveTo(34, hy + 22, 20, hy + 30, 0, hy + 30); ctx.bezierCurveTo(-20, hy + 30, -34, hy + 22, -34, hy - 6); ctx.closePath(); };
    const look = (o.look || 0) * 6;
    if (o.dark) {
      // тёмное непрозрачное стекло (у воришки)
      const vg = ctx.createLinearGradient(-20, hy - 30, 20, hy + 30);
      vg.addColorStop(0, '#3a3d4a'); vg.addColorStop(0.35, '#121318'); vg.addColorStop(1, '#030305');
      visor(); ctx.fillStyle = vg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a5e6e'; ctx.stroke();
      ctx.save(); visor(); ctx.clip();
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(-12 + look, hy - 14, 16, 7, -0.5, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(18 + look, hy - 20, 4, 2.4, -0.5, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      if (o.eyes) { ctx.globalAlpha = 0.9; ell(ctx, -9 + look, hy + 2, 4, 3, '#ffd23f'); ell(ctx, 9 + look, hy + 2, 4, 3, '#ffd23f'); }
      ctx.restore();
    } else {
      // прозрачное стекло: видно лицо космонавта
      visor(); ctx.fillStyle = '#bfe4ff'; ctx.fill();
      ctx.save(); visor(); ctx.clip();
      const fx = look * 0.8, fy = hy + 4;
      vol(ctx, E(ctx, fx, fy, 26, 28), fx, fy, 28, '#ffe8d8', '#ffd2b4', '#e0a080', 0);
      // волосы-чёлка
      ctx.beginPath(); ctx.moveTo(fx - 28, fy - 4); ctx.bezierCurveTo(fx - 26, fy - 36, fx + 26, fy - 38, fx + 28, fy - 6);
      ctx.quadraticCurveTo(fx + 14, fy - 18, fx + 4, fy - 12); ctx.quadraticCurveTo(fx - 6, fy - 22, fx - 14, fy - 10); ctx.quadraticCurveTo(fx - 20, fy - 16, fx - 28, fy - 4); ctx.closePath();
      ctx.fillStyle = '#8a5a32'; ctx.fill();
      // глаза
      const bl = (t % 4) < 0.12;
      for (const side of [-1, 1]) {
        if (bl || an === 'cheer') { ctx.beginPath(); ctx.moveTo(fx + side * 10 - 5, fy + 2); ctx.quadraticCurveTo(fx + side * 10, fy - 4, fx + side * 10 + 5, fy + 2); ctx.lineWidth = 2.5; ctx.strokeStyle = '#3a2a2a'; ctx.stroke(); }
        else { ell(ctx, fx + side * 10 + look * 0.4, fy + 1, 4.5, 5.5, '#2a1e2a'); ell(ctx, fx + side * 10 + look * 0.4 - 1.5, fy - 1, 1.6, 1.6, '#ffffff'); }
      }
      ctx.globalAlpha = 0.45; ell(ctx, fx - 17, fy + 10, 5.5, 3.5, '#ff8fa0'); ell(ctx, fx + 17, fy + 10, 5.5, 3.5, '#ff8fa0'); ctx.globalAlpha = 1;
      // улыбка
      ctx.beginPath();
      if (an === 'cheer' || an === 'jump' || an === 'wave' || o.mouth) { ctx.moveTo(fx - 7, fy + 12); ctx.quadraticCurveTo(fx, fy + 22, fx + 7, fy + 12); ctx.closePath(); ctx.fillStyle = '#a83a4a'; ctx.fill(); }
      else { ctx.moveTo(fx - 7, fy + 13); ctx.quadraticCurveTo(fx, fy + 19, fx + 7, fy + 13); ctx.lineWidth = 2.5; ctx.strokeStyle = '#8a3a3a'; ctx.stroke(); }
      // стекло поверх лица: лёгкий голубой отлив и блики
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#7ec8ff'; visor(); ctx.fill();
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(-16 + look, hy - 16, 12, 5, -0.6, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.ellipse(20 + look, hy - 18, 3.5, 2, -0.5, 0, TAU); ctx.fill();
      ctx.restore();
      visor(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a92ac'; ctx.stroke();
    }
    // фонарик и антенна
    vol(ctx, () => Art.rr(ctx, -46, hy - 6, 10, 18, 4), -41, hy + 2, 10, '#d8dcea', '#b8bed2', '#7a8098', 1);
    ell(ctx, 0, hy - 44, 5, 5, OR);
    ctx.restore();
  };

  // ================== ЗМЕЙ ШИПУН ==================
  const SN = { body: '#5b3a8c', hi: '#9a78d0', shade: '#2a1648', belly: '#d8e88a', mark: '#2e1a52', eye: '#ffb526' };
  Art.serpent = function (ctx, pts, t, o) {
    o = o || {};
    const n = pts.length, R = o.r || 34, angry = !!o.angry;
    const body = angry ? '#7a2a6a' : SN.body;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = n - 1; i >= 1; i--) {
      const [x, y] = pts[i], r = R * (1 - i / n * 0.72);
      vol(ctx, E(ctx, x, y, r, r), x, y, r, SN.hi, body, SN.shade, 0);
      // брюшко
      ctx.save(); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(x, y + r * 0.45, r * 0.7, r * 0.42, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = r * 0.22; ctx.strokeStyle = SN.belly; ctx.stroke(); ctx.restore();
      // ромбики на спине
      if (i % 3 === 0) { ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(x, y - r * 0.25); ctx.rotate(Math.PI / 4); ctx.fillStyle = SN.mark; ctx.fillRect(-r * 0.22, -r * 0.22, r * 0.44, r * 0.44); ctx.restore(); }
      if (o.weak && o.weak.includes(i)) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 10) * 0.3; ell(ctx, x, y, r * 0.75, r * 0.75, '#ffe14a'); ctx.restore(); Art.sparkle(ctx, x, y, r * 0.6, '#ffffff'); }
    }
    const [hx, hy] = pts[0], [nx, ny] = pts[1];
    const ang = Math.atan2(hy - ny, hx - nx);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang + Math.PI / 2);
    serpentHead(ctx, R, t, o, body);
    ctx.restore();
    ctx.restore();
  };
  function serpentHead(ctx, R, t, o, body) {
    // голова вытянутая, вверх по оси -y
    const headP = () => { ctx.beginPath(); ctx.moveTo(0, -R * 1.75); ctx.bezierCurveTo(R * 0.9, -R * 1.7, R * 1.25, -R * 0.6, R * 1.0, R * 0.2); ctx.bezierCurveTo(R * 0.8, R * 0.8, -R * 0.8, R * 0.8, -R * 1.0, R * 0.2); ctx.bezierCurveTo(-R * 1.25, -R * 0.6, -R * 0.9, -R * 1.7, 0, -R * 1.75); ctx.closePath(); };
    vol(ctx, headP, 0, -R * 0.5, R * 1.3, SN.hi, body, SN.shade, 2);
    // рожки
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * R * 0.35, -R * 0.75); ctx.quadraticCurveTo(side * R * 1.0, -R * 0.9, side * R * 1.25, -R * 1.45); ctx.quadraticCurveTo(side * R * 0.95, -R * 0.75, side * R * 0.75, -R * 0.45); ctx.closePath();
      const g = ctx.createLinearGradient(side * R * 0.4, -R * 0.6, side * R * 1.25, -R * 1.45); g.addColorStop(0, '#c8a040'); g.addColorStop(1, '#fff0b0'); ctx.fillStyle = g; ctx.fill();
    }
    // узор на макушке
    ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(0, -R * 1.2); ctx.lineTo(R * 0.3, -R * 0.6); ctx.lineTo(0, -R * 0.1); ctx.lineTo(-R * 0.3, -R * 0.6); ctx.closePath(); ctx.fillStyle = SN.mark; ctx.fill(); ctx.restore();
    // глаза
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * R * 0.55, -R * 0.55); ctx.rotate(side * 0.35);
      const eg = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.3); eg.addColorStop(0, '#fff3a0'); eg.addColorStop(0.6, SN.eye); eg.addColorStop(1, '#b85a10');
      ctx.beginPath(); ctx.ellipse(0, 0, R * 0.3, R * 0.2, 0, 0, TAU); ctx.fillStyle = eg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0a2a'; ctx.stroke();
      if (o.friend) ell(ctx, 0, 0, R * 0.1, R * 0.1, '#1a0a2a'); else ell(ctx, 0, 0, R * 0.05, R * 0.17, '#1a0a2a');
      ell(ctx, -R * 0.1, -R * 0.07, R * 0.05, R * 0.04, 'rgba(255,255,255,0.9)');
      if (!o.friend) { ctx.beginPath(); ctx.moveTo(-R * 0.35, -R * 0.28 * side * side - (side > 0 ? 0 : 0)); ctx.lineTo(R * 0.3, -R * 0.12); ctx.lineWidth = R * 0.12; ctx.strokeStyle = rgba(SN.shade, 0.9); ctx.stroke(); }
      ctx.restore();
    }
    // ноздри
    for (const side of [-1, 1]) ell(ctx, side * R * 0.18, -R * 1.45, R * 0.06, R * 0.04, '#1a0a2a');
    // пасть — внизу головы (в сторону шеи) смотрится как улыбка у «морды», рисуем у кончика
    if (o.open) {
      ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 1.25); ctx.quadraticCurveTo(0, -R * 0.55, R * 0.45, -R * 1.25); ctx.quadraticCurveTo(0, -R * 1.05, -R * 0.45, -R * 1.25); ctx.closePath();
      ctx.fillStyle = '#6a1030'; ctx.fill();
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * R * 0.32, -R * 1.18); ctx.lineTo(side * R * 0.26, -R * 0.92); ctx.lineTo(side * R * 0.2, -R * 1.15); ctx.fillStyle = '#fffbe8'; ctx.fill(); }
      const tg = Math.sin(t * 14) * 0.3; ctx.beginPath(); ctx.moveTo(0, -R * 1.6); ctx.lineTo(Math.sin(tg) * 6, -R * 2.1); ctx.lineTo(-6, -R * 2.3); ctx.moveTo(Math.sin(tg) * 6, -R * 2.1); ctx.lineTo(6, -R * 2.35); ctx.lineWidth = 3.5; ctx.strokeStyle = '#ff3b5c'; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 1.15); ctx.quadraticCurveTo(0, o.friend ? -R * 0.85 : -R * 1.0, R * 0.5, -R * 1.15);
      ctx.lineWidth = 3; ctx.strokeStyle = '#1a0a2a'; ctx.stroke();
    }
  }
  // Шипун свернулся кольцами, голова поднята
  Art.serpentCoil = function (ctx, x, y, s, t, o) {
    o = o || {};
    const fl = o.flee || 0;
    ctx.save(); ctx.translate(x - fl * 900, y); ctx.scale(s, s);
    ctx.save(); ctx.globalAlpha = 0.3; ell(ctx, 0, 6, 190, 30, '#000000'); ctx.restore();
    const pts = [];
    const sway = Math.sin(t * 1.6) * 14;
    // голова и шея
    for (let i = 0; i < 8; i++) { const u = i / 7; pts.push([60 + sway * (1 - u) - u * 30, -250 + u * 170 + Math.sin(u * 3) * 10]); }
    // кольца
    for (let i = 1; i <= 64; i++) { const a = -Math.PI / 2 + i * 0.19, r = 40 + i * 2.1; pts.push([Math.cos(a) * r * 1.25, -60 + Math.sin(a) * r * 0.38 + i * 0.4]); }
    Art.serpent(ctx, pts, t, { r: 40, open: o.open, friend: o.friend, angry: o.angry });
    ctx.restore();
  };
  // Вход в пещеру Шипуна на главном экране
  Art.lair = function (ctx, x, y, s, t, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // скала
    const rock = () => { ctx.beginPath(); ctx.moveTo(-170, 10); ctx.bezierCurveTo(-170, -120, -110, -230, -10, -236); ctx.bezierCurveTo(100, -240, 170, -140, 180, 10); ctx.closePath(); };
    vol(ctx, rock, -30, -130, 210, '#8a7aa8', '#5a4a78', '#2a2040', 2.5);
    ctx.save(); rock(); ctx.clip(); ctx.globalAlpha = 0.25;
    for (const [rx, ry, rr] of [[-110, -60, 30], [80, -170, 26], [120, -50, 34], [-60, -190, 22]]) vol(ctx, E(ctx, rx, ry, rr, rr * 0.7), rx, ry, rr, '#b0a0d0', '#6a5a88', '#3a2c58', 0);
    ctx.restore();
    // мох и конфетные грибочки
    for (const [mx, my, c] of [[-140, 0, '#ff7eb6'], [150, -4, '#7ee8ff'], [-80, 6, '#ffd23f']]) { vol(ctx, E(ctx, mx, my - 18, 16, 10), mx, my - 18, 16, '#ffffff', c, mix(c, '#000000', 0.3), 0); ctx.fillStyle = '#f8ecd8'; ctx.fillRect(mx - 3, my - 14, 6, 14); }
    // тёмный вход
    const hole = () => { ctx.beginPath(); ctx.moveTo(-80, 10); ctx.bezierCurveTo(-84, -90, -40, -150, 0, -150); ctx.bezierCurveTo(40, -150, 84, -90, 80, 10); ctx.closePath(); };
    const hg = ctx.createRadialGradient(0, -40, 10, 0, -40, 150); hg.addColorStop(0, '#05020c'); hg.addColorStop(1, '#2a1a40');
    hole(); ctx.fillStyle = hg; ctx.fill();
    // голова Шипуна выглядывает
    const pk = o.peek || 0;
    if (pk > 0) {
      ctx.save(); hole(); ctx.clip();
      const pts = []; for (let i = 0; i < 10; i++) pts.push([-10 - pk * 40 + i * 14, -60 + pk * 20 + i * 8 + Math.sin(t * 4 - i * 0.6) * 4]);
      ctx.restore();
      Art.serpent(ctx, pts.map(([px, py]) => [px, py]), t, { r: 26, open: o.talk, friend: o.friend });
    } else if (o.eyes !== false) {
      // светящиеся глаза в темноте
      const bl = (t % 4.2) < 0.15 ? 0.15 : 1;
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * 20, -70);
        ctx.globalAlpha = 0.35; ell(ctx, 0, 0, 16, 12 * bl, SN.eye); ctx.globalAlpha = 1;
        ell(ctx, 0, 0, 9, 6 * bl, SN.eye); if (bl > 0.5) ell(ctx, 0, 0, 1.8, 5, '#1a0a2a');
        ctx.restore();
      }
    }
    // табличка
    ctx.save(); ctx.translate(40, -238); ctx.rotate(0.08);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-4, 0, 8, 50);
    vol(ctx, () => Art.rr(ctx, -58, -30, 116, 40, 8), 0, -10, 60, '#d8a870', '#b07a40', '#7a4a20', 1.5);
    UI.text(ctx, 'Шипун', 0, -10, 20, '#3a1a0a', 'center', false);
    ctx.restore();
    ctx.restore();
  };
  // Внутри Тёмной пещеры
  Art.caveInside = function (ctx, t, o) {
    o = o || {};
    const v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1);
    if (o.warm) { g.addColorStop(0, '#3a1e4a'); g.addColorStop(0.6, '#6a3a5a'); g.addColorStop(1, '#8a5a4a'); }
    else { g.addColorStop(0, '#0e0820'); g.addColorStop(0.6, '#2a1a44'); g.addColorStop(1, '#3a2a50'); }
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    // стены и сталактиты
    ctx.fillStyle = '#1a1030';
    ctx.beginPath(); ctx.moveTo(v.x0, v.y0); for (let x = v.x0; x <= v.x1 + 60; x += 60) { const h = 40 + ((x * 37) % 90); ctx.lineTo(x + 30, v.y0 + h); ctx.lineTo(x + 60, v.y0 + 20); } ctx.lineTo(v.x1, v.y0); ctx.closePath(); ctx.fill();
    // пол
    const fg = ctx.createLinearGradient(0, 600, 0, v.y1); fg.addColorStop(0, '#4a3a60'); fg.addColorStop(1, '#2a1e3a');
    ctx.beginPath(); ctx.moveTo(v.x0, 610); for (let x = v.x0; x <= v.x1; x += 80) ctx.quadraticCurveTo(x + 40, 596 + ((x * 13) % 20), x + 80, 610); ctx.lineTo(v.x1, v.y1); ctx.lineTo(v.x0, v.y1); ctx.closePath(); ctx.fillStyle = fg; ctx.fill();
    // светящиеся кристаллы
    for (const [cx, cy, c] of [[90, 600, '#7ee8ff'], [1180, 610, '#ff7eb6'], [640, 640, '#b07cff'], [1000, 600, '#7ee8ff']]) {
      ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 2 + cx) * 0.1; ctx.fillStyle = Art.rg(ctx, cx, cy - 30, 90, c, rgba(c, 0), 0, 0); ell(ctx, cx, cy - 30, 90, 90); ctx.fill(); ctx.restore();
      Art.crystal(ctx, cx, cy, 0.7, c);
    }
    if (o.warm) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = Art.rg(ctx, 640, 300, 600, '#ffd8a0', 'rgba(255,200,150,0)', 0, 0); ell(ctx, 640, 300, 600, 600); ctx.fill(); ctx.restore(); }
  };
  // Клетка из лакричных прутьев
  Art.cage = function (ctx, x, y, s, t, open) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const W = 150, H = 230;
    vol(ctx, E(ctx, 0, H, W, 24), 0, H, W, '#9a6a3a', '#7a4a2a', '#4a2a1a', 2);
    for (let i = -6; i <= 6; i++) {
      const bx = i * (W / 6.5);
      ctx.save(); ctx.translate(bx, 0);
      if (open && i > 0) ctx.rotate(open * 0.5 * (i / 6));
      ctx.beginPath(); ctx.moveTo(0, -10 + Math.abs(i) * 4); ctx.lineTo(0, H);
      ctx.lineWidth = 9; ctx.strokeStyle = '#3a1a2a'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,140,170,0.45)'; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, W, 34, 0, Math.PI, TAU); ctx.lineWidth = 12; ctx.strokeStyle = '#3a1a2a'; ctx.stroke();
    if (!open) { ctx.save(); ctx.translate(W * 0.55, H * 0.55); vol(ctx, () => Art.rr(ctx, -16, -12, 32, 28, 6), 0, 0, 22, '#ffe68a', '#d8a020', '#8a5a10', 1.5); ctx.beginPath(); ctx.arc(0, -12, 10, Math.PI, TAU); ctx.lineWidth = 4; ctx.strokeStyle = '#8a8a9a'; ctx.stroke(); ctx.restore(); }
    ctx.restore();
  };
})();
