// Аниме-стиль: космонавт, ракета, вкусняшки планет, препятствия, зверушки, злодеи, облака, маяк
'use strict';
(function () {
  const TAU = Math.PI * 2;
  const ell = Art.ell, rg = Art.rg, cel = Art.cel, stroke = Art.stroke, mix = Art.mix;
  const LINE = '#1a1030';
  const gloss = (ctx, x, y, rx, ry) => { ctx.save(); ctx.globalAlpha = 0.75; ell(ctx, x, y, rx, ry, '#ffffff', -0.5); ctx.restore(); };

  // ================== КОСМОНАВТ (аниме) ==================
  // o.anim: idle | wave | jump | dance | salute | spin | cheer | walk ; o.at — время анимации
  Art.astronaut = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0, an = o.anim || (o.wave ? 'wave' : o.walk ? 'walk' : 'idle'), at = o.at != null ? o.at : t;
    let lift = o.lift || 0, rot = 0, sx = 1, armL = 0.35, armR = -0.35, mouthOpen = false, legL = 0, legR = 0;
    switch (an) {
      case 'wave': armR = -2.6 + Math.sin(at * 12) * 0.45; mouthOpen = true; break;
      case 'jump': lift += Math.abs(Math.sin(at * 5)) * 70; armL = 2.6; armR = -2.6; mouthOpen = true; legL = -0.3; legR = 0.3; break;
      case 'dance': rot = Math.sin(at * 8) * 0.18; armL = 1.5 + Math.sin(at * 8) * 1.1; armR = -1.5 + Math.sin(at * 8) * 1.1; lift += Math.abs(Math.sin(at * 8)) * 12; mouthOpen = true; legL = Math.sin(at * 8) * 0.3; legR = -legL; break;
      case 'salute': armR = -2.3; break;
      case 'spin': sx = Math.cos(at * 9); lift += Math.sin(Math.min(1, at / 0.7) * Math.PI) * 40; armL = 1.2; armR = -1.2; break;
      case 'cheer': armL = 2.7 + Math.sin(at * 14) * 0.2; armR = -2.7 - Math.sin(at * 14) * 0.2; mouthOpen = true; lift += Math.abs(Math.sin(at * 7)) * 20; break;
      case 'walk': legL = Math.sin(t * 10) * 0.4; legR = -legL; armL = 0.35 - legL; armR = -0.35 - legL; break;
      default: armL = 0.35 + Math.sin(t * 2) * 0.05; armR = -0.35 - Math.sin(t * 2) * 0.05;
    }
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, 0, 0, 44 * s * (1 - lift / 300), 9 * s, '#0a0520'); ctx.restore();
    ctx.translate(0, -lift); ctx.scale(s * (sx === 1 ? 1 : (Math.abs(sx) < 0.15 ? 0.15 * Math.sign(sx || 1) : sx)), s);
    if (o.flip) ctx.scale(-1, 1);
    ctx.rotate(rot);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const W = '#fbfbff', WS = '#c7cce6', OR = '#ff8a2a', ORS = '#d85a10';
    // рюкзак
    cel(ctx, () => { Art.rr(ctx, -36, -118, 24, 56, 9); }, '#e8ebf8', WS, null, 3.5, 5);
    ell(ctx, -24, -108, 4, 4, '#41d982');
    // ноги
    for (const [side, lg] of [[-1, legL], [1, legR]]) {
      ctx.save(); ctx.translate(side * 12, -46); ctx.rotate(lg);
      cel(ctx, () => { Art.rr(ctx, -9, 0, 18, 32, 8); }, W, WS, null, 3.5, 5);
      cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-11, 28); ctx.lineTo(11, 28); ctx.quadraticCurveTo(side * 18, 30, side * 16, 42); ctx.lineTo(-side * 12, 42); ctx.closePath(); }, '#5a5f7a', '#383c52', null, 3.5, 4);
      ctx.fillStyle = OR; ctx.fillRect(-11, 38, 24, 4);
      ctx.restore();
    }
    // туловище
    const torso = () => { ctx.beginPath(); ctx.moveTo(-24, -106); ctx.quadraticCurveTo(-30, -60, -22, -44); ctx.lineTo(22, -44); ctx.quadraticCurveTo(30, -60, 24, -106); ctx.closePath(); };
    cel(ctx, torso, W, WS, '#ffffff', 3.5, 8);
    ctx.fillStyle = OR; ctx.fillRect(-25, -58, 50, 7);
    cel(ctx, () => { Art.rr(ctx, -12, -96, 24, 20, 5); }, '#dfe4f5', '#a8b0d0', null, 2.5, 3);
    ell(ctx, -5, -86, 3, 3, '#ff4f6d'); ell(ctx, 3, -86, 3, 3, '#41d982'); ell(ctx, 6, -80, 2, 2, '#3fa9ff');
    // руки
    for (const [side, ang] of [[-1, armL], [1, armR]]) {
      ctx.save(); ctx.translate(side * 22, -100); ctx.rotate(ang);
      cel(ctx, () => { Art.rr(ctx, -8, 0, 16, 34, 8); }, W, WS, null, 3.5, 4);
      cel(ctx, () => { ctx.beginPath(); ctx.arc(0, 38, 9, 0, TAU); }, '#5a5f7a', '#383c52', null, 3, 3);
      if (side === 1 && o.holding != null) Art.treat(ctx, o.holding, 0, 54, 0.45, t);
      ctx.restore();
    }
    // голова под прозрачным шлемом
    const hy = -140;
    ell(ctx, 0, hy + 34, 26, 7, '#e8ebf8'); stroke(ctx, 3);
    // лицо
    cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, hy + 4, 26, 27, 0, 0, TAU); }, '#ffe2cc', '#f2b89a', null, 3, 5);
    // волосы (тёмно-синие, с прядями)
    const hair = () => { ctx.beginPath(); ctx.moveTo(-28, hy + 6); ctx.quadraticCurveTo(-32, hy - 28, 0, hy - 30); ctx.quadraticCurveTo(32, hy - 28, 28, hy + 6);
      ctx.lineTo(22, hy - 4); ctx.lineTo(16, hy + 2); ctx.lineTo(10, hy - 10); ctx.lineTo(2, hy - 2); ctx.lineTo(-6, hy - 12); ctx.lineTo(-12, hy - 2); ctx.lineTo(-20, hy - 8); ctx.closePath(); };
    cel(ctx, hair, '#2a3a8a', '#16205a', '#5a7ae0', 3, 5);
    ctx.beginPath(); ctx.moveTo(-6, hy - 30); ctx.quadraticCurveTo(4, hy - 44, 14, hy - 38); stroke(ctx, 4, '#2a3a8a');
    // глаза
    const blink = (t % 4.3 < 0.12) ? 1 : 0;
    for (const side of [-1, 1]) Art.animeEye(ctx, side * 10, hy + 6, 6.5, 9, '#7ec8ff', '#1a4ab0', { side, blink, happy: an === 'cheer' || an === 'dance', look: o.look || 0 });
    Art.blush(ctx, -16, hy + 16, 5, '#ff8fa0'); Art.blush(ctx, 16, hy + 16, 5, '#ff8fa0');
    if (mouthOpen) { ctx.beginPath(); ctx.moveTo(-5, hy + 19); ctx.quadraticCurveTo(0, hy + 27, 5, hy + 19); ctx.closePath(); ctx.fillStyle = '#8a2a3a'; ctx.fill(); stroke(ctx, 2); }
    else { ctx.beginPath(); ctx.moveTo(-4, hy + 20); ctx.quadraticCurveTo(0, hy + 23, 4, hy + 20); stroke(ctx, 2); }
    // прозрачный шлем-пузырь
    ctx.save();
    ctx.beginPath(); ctx.arc(0, hy, 44, 0, TAU);
    ctx.fillStyle = 'rgba(180,220,255,0.18)'; ctx.fill(); stroke(ctx, 3.5);
    ctx.beginPath(); ctx.arc(0, hy, 38, Math.PI * 1.1, Math.PI * 1.45); stroke(ctx, 6, 'rgba(255,255,255,0.85)');
    ctx.beginPath(); ctx.arc(0, hy, 38, Math.PI * 1.55, Math.PI * 1.62); stroke(ctx, 6, 'rgba(255,255,255,0.85)');
    Art.sparkle(ctx, 26, hy - 24, 6, '#ffffff', 0.9);
    ctx.restore();
    ell(ctx, 0, hy - 48, 5, 5, OR); stroke(ctx, 2.5);
    ctx.restore();
  };

  // ================== РАКЕТА (аниме) ==================
  Art.rocket = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const OR = '#ff7a1a', ORS = '#c84a0a';
    const cyl = (x0, w) => { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#e9ecf8'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.65, '#e6e9f6'); g.addColorStop(1, '#a9b0d0'); return g; };
    if (o.flame) {
      const f = o.flame;
      for (const bx of [-52, 0, 52]) {
        const len = (bx === 0 ? 140 : 90) * f * (0.85 + Math.sin(t * 40 + bx) * 0.15);
        ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, bx, len * 0.4, 26, len * 0.6, '#ffb23a'); ctx.restore();
        ctx.beginPath(); ctx.moveTo(bx - 15, 0); ctx.quadraticCurveTo(bx, len * 1.25, bx + 15, 0); ctx.closePath(); ctx.fillStyle = '#ff5a3a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx - 9, 0); ctx.quadraticCurveTo(bx, len * 0.8, bx + 9, 0); ctx.closePath(); ctx.fillStyle = '#fff3a0'; ctx.fill();
      }
    }
    function booster(bx, h, front) {
      ctx.beginPath(); ctx.moveTo(bx - 12, -14); ctx.lineTo(bx - 18, 6); ctx.lineTo(bx + 18, 6); ctx.lineTo(bx + 12, -14); ctx.closePath();
      ctx.fillStyle = '#ffb23a'; ctx.fill(); stroke(ctx, 3);
      const bp = () => { ctx.beginPath(); ctx.moveTo(bx - 17, -14); ctx.lineTo(bx - 17, -h + 4); ctx.quadraticCurveTo(bx - 14, -h - 50, bx, -h - 62); ctx.quadraticCurveTo(bx + 14, -h - 50, bx + 17, -h + 4); ctx.lineTo(bx + 17, -14); ctx.closePath(); };
      bp(); ctx.fillStyle = cyl(bx - 17, 34); ctx.fill(); stroke(ctx, 3.5);
      ctx.fillStyle = LINE; ctx.fillRect(bx - 16, -h + 16, 32, 5); ctx.fillRect(bx - 16, -40, 32, 4);
      ctx.fillStyle = OR; ctx.fillRect(bx - 16, -h + 24, 32, 4);
      if (front) { const on = Math.sin(t * 4 + bx) > 0.3; ell(ctx, bx, -h - 34, 4, 4, on ? (bx < 0 ? '#ff3b5c' : '#41ff82') : '#5a5a6a'); if (on) { ctx.save(); ctx.globalAlpha = 0.4; ell(ctx, bx, -h - 34, 10, 10, bx < 0 ? '#ff3b5c' : '#41ff82'); ctx.restore(); } }
    }
    booster(-30, 160, false); booster(30, 160, false);
    ctx.beginPath(); ctx.moveTo(-16, -30); ctx.lineTo(-23, -6); ctx.lineTo(23, -6); ctx.lineTo(16, -30); ctx.closePath(); ctx.fillStyle = '#ffb23a'; ctx.fill(); stroke(ctx, 3);
    Art.rr(ctx, -30, -252, 60, 224, 10); ctx.fillStyle = cyl(-30, 60); ctx.fill(); stroke(ctx, 4.5);
    // панели
    ctx.globalAlpha = 0.5; for (const yy of [-200, -110, -70]) { ctx.beginPath(); ctx.moveTo(-29, yy); ctx.lineTo(29, yy); stroke(ctx, 1.5, '#8a90b0'); } ctx.globalAlpha = 1;
    for (const [rx, ry] of [[-22, -196], [22, -196], [-22, -114], [22, -114]]) ell(ctx, rx, ry, 1.8, 1.8, '#8a90b0');
    ctx.fillStyle = OR; ctx.fillRect(-29, -252, 58, 9);
    ctx.save(); ctx.beginPath(); ctx.rect(-29, -152, 58, 28); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-29, -152, 58, 28); ctx.fillStyle = LINE;
    for (let i = -4; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 14, -152); ctx.lineTo(i * 14 + 7, -152); ctx.lineTo(i * 14 + 35, -124); ctx.lineTo(i * 14 + 28, -124); ctx.fill(); }
    ctx.restore(); ctx.strokeStyle = LINE; ctx.lineWidth = 3.5; ctx.strokeRect(-29, -152, 58, 28);
    Art.roundStar(ctx, 0, -178, 12, OR, LINE);
    // верхняя ступень
    Art.rr(ctx, -37, -362, 74, 118, 14); ctx.fillStyle = cyl(-37, 74); ctx.fill(); stroke(ctx, 4.5);
    ctx.fillStyle = OR; ctx.fillRect(-36, -262, 72, 9);
    // иллюминатор со светом
    ell(ctx, 0, -320, 23, 23, OR); stroke(ctx, 3.5);
    const wg = ctx.createRadialGradient(-5, -326, 2, 0, -320, 16); wg.addColorStop(0, '#9fe8ff'); wg.addColorStop(1, '#1a3a8a');
    ell(ctx, 0, -320, 16, 16); ctx.fillStyle = wg; ctx.fill(); stroke(ctx, 2.5);
    if (o.pilot) { ell(ctx, 0, -317, 9, 9, '#ffe2cc'); ctx.beginPath(); ctx.arc(0, -319, 9, Math.PI, 0); ctx.fillStyle = '#2a3a8a'; ctx.fill(); ell(ctx, -3, -316, 1.5, 2, LINE); ell(ctx, 3, -316, 1.5, 2, LINE);
      if (o.pilotWave) { ctx.beginPath(); ctx.moveTo(8, -312); ctx.lineTo(12 + Math.sin(t * 14) * 3, -326); stroke(ctx, 3, '#fbfbff'); } }
    Art.sparkle(ctx, -6, -328, 5, '#ffffff', 0.9);
    // нос
    const nose = () => { ctx.beginPath(); ctx.moveTo(-37, -358); ctx.bezierCurveTo(-35, -402, -12, -430, 0, -438); ctx.bezierCurveTo(12, -430, 35, -402, 37, -358); ctx.closePath(); };
    nose(); ctx.fillStyle = cyl(-37, 74); ctx.fill(); stroke(ctx, 4.5);
    ctx.beginPath(); ctx.moveTo(-15, -421); ctx.quadraticCurveTo(0, -448, 15, -421); ctx.quadraticCurveTo(0, -414, -15, -421); ctx.closePath(); ctx.fillStyle = OR; ctx.fill(); stroke(ctx, 3.5);
    booster(-52, 140, true); booster(52, 140, true);
    if (o.glowBase) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 6) * 0.1; ell(ctx, 0, 4, 95, 18, '#ff3b3b'); ctx.restore(); }
    ctx.restore();
  };

  // ================== ВКУСНЯШКИ ПЛАНЕТ ==================
  const T = {};
  T.pearl = (c, t) => { cel(c, () => { c.beginPath(); c.moveTo(-34, 4); for (let i = 0; i <= 6; i++) { const a = Math.PI + i * Math.PI / 6; c.quadraticCurveTo(Math.cos(a - 0.26) * 40, Math.sin(a - 0.26) * 6 + 28, Math.cos(a) * 34, 4 + Math.abs(Math.sin(a)) * 0 + (i % 2 ? 26 : 18)); } c.lineTo(34, 4); c.closePath(); }, '#ff9ad5', '#d0609a', null, 3, 5);
    ell(c, 0, -6, 22, 22); c.fillStyle = rg(c, 0, -6, 26, '#ffffff', '#c8d0f0'); c.fill(); stroke(c, 3); gloss(c, -7, -14, 7, 5); Art.sparkle(c, 10, -16, 5, '#fff'); };
  T.fishjelly = (c) => { c.save(); c.globalAlpha = 0.92; cel(c, () => { c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-10, -26, 16, -12); c.lineTo(36, -24); c.lineTo(32, 0); c.lineTo(36, 24); c.lineTo(16, 12); c.quadraticCurveTo(-10, 26, -30, 0); c.closePath(); }, '#ffa94d', '#e0702a', '#ffe0a0', 3, 6); c.restore();
    ell(c, -14, -4, 5, 6, '#fff'); ell(c, -13, -3, 3, 4, LINE); gloss(c, -2, -10, 8, 3); };
  T.starfish = (c) => { c.save(); c.lineJoin = 'round'; cel(c, () => { Art.starPath(c, 0, 2, 36, 17, 5); }, '#ffb35c', '#e0802a', null, 3.5, 6); c.restore(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ell(c, Math.cos(a) * 18, Math.sin(a) * 18 + 2, 3, 3, '#fff3d0'); } ell(c, 0, 2, 4, 4, '#fff3d0'); };
  T.shell = (c) => { cel(c, () => { c.beginPath(); c.moveTo(0, 30); c.lineTo(-34, -6); c.quadraticCurveTo(0, -46, 34, -6); c.closePath(); }, '#9a5a2a', '#6a3a1a', '#d0905a', 3.5, 6); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 28); c.lineTo(i * 14, -22 + Math.abs(i) * 6); stroke(c, 2, '#5a2a10'); } };
  T.jelly = (c, t) => { const w = Math.sin((t || 0) * 6) * 2; c.save(); c.globalAlpha = 0.9; cel(c, () => { c.beginPath(); c.moveTo(-30 - w, 26); c.quadraticCurveTo(-34, -34, 0, -34 + w); c.quadraticCurveTo(34, -34, 30 + w, 26); c.closePath(); }, '#5ac8ff', '#2a8ad8', '#c8f0ff', 3.5, 7); c.restore(); gloss(c, -12, -16, 8, 12); ell(c, 8, 4, 4, 4, '#ffffff88'); };
  T.bubbletea = (c) => { c.beginPath(); c.moveTo(4, -40); c.lineTo(14, -14); stroke(c, 5, '#ff7eb6'); cel(c, () => { c.beginPath(); c.moveTo(-24, -18); c.lineTo(24, -18); c.lineTo(18, 34); c.lineTo(-18, 34); c.closePath(); }, '#e8d0ff', '#b89ae0', null, 3.5, 5); for (const [px, py] of [[-10, 22], [0, 26], [10, 22], [-4, 14], [8, 12]]) ell(c, px, py, 4.5, 4.5, '#4a2a5a'); ell(c, 0, -18, 24, 6, '#ffffff'); stroke(c, 3); };
  T.pepper = (c) => { cel(c, () => { c.beginPath(); c.moveTo(-14, -24); c.quadraticCurveTo(30, -20, 26, 10); c.quadraticCurveTo(18, 34, -22, 30); c.quadraticCurveTo(4, 14, -14, -24); c.closePath(); }, '#ff3a2a', '#b8180c', '#ff9a8a', 3.5, 6); c.beginPath(); c.moveTo(-14, -24); c.quadraticCurveTo(-18, -36, -8, -40); stroke(c, 6, '#2a8a3a'); gloss(c, 8, -10, 8, 3); };
  T.lavapie = (c) => { cel(c, () => { c.beginPath(); c.ellipse(0, 4, 34, 28, 0, 0, TAU); }, '#e8903a', '#a85a1a', '#ffd08a', 3.5, 6); c.beginPath(); c.moveTo(-18, -8); c.lineTo(-4, 4); c.lineTo(-10, 18); c.moveTo(-4, 4); c.lineTo(14, -2); c.lineTo(20, 14); stroke(c, 6, '#ff4a1a'); c.beginPath(); c.moveTo(-18, -8); c.lineTo(-4, 4); c.lineTo(-10, 18); c.moveTo(-4, 4); c.lineTo(14, -2); c.lineTo(20, 14); stroke(c, 2.5, '#fff27a'); };
  T.ember = (c, t) => { c.save(); c.globalAlpha = 0.5 + Math.sin((t || 0) * 5) * 0.2; ell(c, 0, 0, 40, 40); c.fillStyle = rg(c, 0, 0, 40, '#ffb23a', 'rgba(255,90,30,0)', 0, 0); c.fill(); c.restore(); cel(c, () => { c.beginPath(); c.moveTo(-26, 10); c.lineTo(-18, -22); c.lineTo(8, -30); c.lineTo(30, -6); c.lineTo(20, 24); c.lineTo(-10, 28); c.closePath(); }, '#3a2a30', '#1a1018', '#7a5a6a', 3.5, 5); ell(c, 2, 0, 10, 8, '#ff7a1a'); ell(c, 2, 0, 5, 4, '#fff27a'); };
  T.spark = (c, t) => { c.save(); c.rotate((t || 0) * 1.5); c.globalAlpha = 0.5; Art.sparkle(c, 0, 0, 44, '#ffe14a'); c.globalAlpha = 1; Art.sparkle(c, 0, 0, 32, '#ffd23f'); Art.sparkle(c, 0, 0, 18, '#ffffff'); c.restore(); };
  T.volcake = (c) => { cel(c, () => { c.beginPath(); c.moveTo(-32, 28); c.lineTo(-14, -18); c.lineTo(14, -18); c.lineTo(32, 28); c.closePath(); }, '#8a5a3a', '#5a3a22', '#c08a5a', 3.5, 5); cel(c, () => { c.beginPath(); c.moveTo(-16, -14); c.quadraticCurveTo(0, -36, 16, -14); c.lineTo(12, 0); c.quadraticCurveTo(8, 10, 4, 0); c.quadraticCurveTo(-2, 14, -6, 0); c.lineTo(-16, -14); c.closePath(); }, '#ff4a2a', '#c0200a', '#ffb08a', 3, 4); };
  T.fireberry = (c) => { for (const [px, py, r] of [[-12, 6, 15], [12, 6, 15], [0, -12, 15]]) { cel(c, () => { c.beginPath(); c.arc(px, py, r, 0, TAU); }, '#ff8a2a', '#c8500a', null, 3, 4); gloss(c, px - 5, py - 5, 4, 3); } c.beginPath(); c.moveTo(0, -26); c.lineTo(4, -36); stroke(c, 4, '#2a8a3a'); };
  T.cottoncandy = (c) => { c.beginPath(); c.moveTo(0, 6); c.lineTo(0, 40); stroke(c, 6, '#f0e0c0'); for (const [px, py, r] of [[-14, -6, 16], [12, -10, 18], [0, -24, 16], [-2, 2, 14], [16, 4, 12]]) { ell(c, px, py, r + 2.5, r + 2.5, LINE); } for (const [px, py, r] of [[-14, -6, 16], [12, -10, 18], [0, -24, 16], [-2, 2, 14], [16, 4, 12]]) ell(c, px, py, r, r, '#ffb3d9'); gloss(c, -6, -22, 8, 5); };
  T.marsh = (c) => { cel(c, () => { Art.rr(c, -26, -20, 52, 44, 14); }, '#ffffff', '#d6d0f0', null, 3.5, 6); ell(c, 0, -18, 26, 8, '#fff4fb'); stroke(c, 3); };
  T.feather = (c) => { c.save(); c.rotate(-0.5); cel(c, () => { c.beginPath(); c.moveTo(0, 38); c.quadraticCurveTo(-26, 0, 0, -38); c.quadraticCurveTo(26, 0, 0, 38); c.closePath(); }, '#ffd08a', '#e0a050', null, 3, 5); c.beginPath(); c.moveTo(0, 38); c.lineTo(0, -34); stroke(c, 2.5, '#a86a2a'); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, i * 12); c.lineTo(-14, i * 12 - 8); c.moveTo(0, i * 12); c.lineTo(14, i * 12 - 8); stroke(c, 1.5, '#c08040'); } c.restore(); };
  T.balloon = (c, t) => { c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(8 + Math.sin((t || 0) * 3) * 4, 32, 0, 42); stroke(c, 2.5); cel(c, () => { c.beginPath(); c.ellipse(0, -8, 26, 30, 0, 0, TAU); }, '#ff4a6a', '#c01a3a', '#ffa0b0', 3.5, 6); gloss(c, -9, -20, 6, 9); c.beginPath(); c.moveTo(-4, 22); c.lineTo(4, 22); c.lineTo(0, 27); c.closePath(); c.fillStyle = '#c01a3a'; c.fill(); };
  T.pinwheel = (c, t) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 42); stroke(c, 5, '#c8a070'); c.save(); c.rotate((t || 0) * 3); ['#ff5e9a', '#4fb7ff', '#ffd23f', '#41d982'].forEach((cc, i) => { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -30); c.quadraticCurveTo(22, -26, 14, -6); c.closePath(); c.fillStyle = cc; c.fill(); stroke(c, 2.5); c.restore(); }); c.restore(); ell(c, 0, 0, 5, 5, '#fff'); stroke(c, 2); };
  T.dandelion = (c) => { c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(4, 24, 0, 42); stroke(c, 4, '#4caf50'); c.save(); c.globalAlpha = 0.9; for (let i = 0; i < 16; i++) { const a = i * TAU / 16; c.beginPath(); c.moveTo(0, -8); c.lineTo(Math.cos(a) * 26, -8 + Math.sin(a) * 26); stroke(c, 1.5, '#d8d8e8'); ell(c, Math.cos(a) * 26, -8 + Math.sin(a) * 26, 4, 4, '#ffffff'); } c.restore(); ell(c, 0, -8, 7, 7, '#e8e0c0'); stroke(c, 2); };
  T.icecream = (c) => { cel(c, () => { c.beginPath(); c.moveTo(-18, 0); c.lineTo(0, 42); c.lineTo(18, 0); c.closePath(); }, '#e8b070', '#b8803a', null, 3, 4); c.save(); c.beginPath(); c.moveTo(-18, 0); c.lineTo(0, 42); c.lineTo(18, 0); c.clip(); for (let i = -3; i < 4; i++) { c.beginPath(); c.moveTo(i * 10 - 20, 0); c.lineTo(i * 10 + 20, 40); c.moveTo(i * 10 + 20, 0); c.lineTo(i * 10 - 20, 40); stroke(c, 1.5, '#a8702a'); } c.restore();
    cel(c, () => { c.beginPath(); c.arc(-6, -6, 17, 0, TAU); }, '#9ff0d0', '#5ac8a0', '#ffffff', 3, 4); cel(c, () => { c.beginPath(); c.arc(6, -22, 16, 0, TAU); }, '#ffb3d0', '#e07aa0', '#ffffff', 3, 4); ell(c, 8, -38, 5, 5, '#ff3b5c'); };
  T.snowcookie = (c) => { c.save(); for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); Art.rr(c, -7, -34, 14, 34, 7); c.fillStyle = '#e8c890'; c.fill(); stroke(c, 3); c.restore(); } ell(c, 0, 0, 14, 14, '#e8c890'); for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -28); stroke(c, 3, '#ffffff'); c.restore(); } c.restore(); };
  T.icecrystal = (c) => { c.beginPath(); c.moveTo(0, 14); c.lineTo(0, 42); stroke(c, 5, '#ffffff'); cel(c, () => { c.beginPath(); c.moveTo(0, -38); c.lineTo(22, -10); c.lineTo(0, 22); c.lineTo(-22, -10); c.closePath(); }, '#8ee0ff', '#3a9ad8', '#ffffff', 3.5, 6); c.beginPath(); c.moveTo(-22, -10); c.lineTo(22, -10); c.moveTo(0, -38); c.lineTo(0, 22); stroke(c, 1.5, '#ffffffaa'); };
  T.popsicle = (c) => { c.beginPath(); Art.rr(c, -5, 14, 10, 28, 4); c.fillStyle = '#e8c890'; c.fill(); stroke(c, 2.5); cel(c, () => { Art.rr(c, -20, -36, 40, 54, 18); }, '#7a6aff', '#4a3ac8', '#c8c0ff', 3.5, 6); c.fillStyle = '#ffb3d0'; c.fillRect(-19, -36 + 18, 38, 9); gloss(c, -9, -24, 4, 8); };
  T.snowball = (c) => { cel(c, () => { c.beginPath(); c.arc(0, 0, 30, 0, TAU); }, '#ffffff', '#c6dcf0', null, 3.5, 7); Art.sparkle(c, -10, -12, 8, '#bff5ff'); Art.sparkle(c, 12, 8, 5, '#bff5ff'); };
  T.frostberry = (c) => { for (const [px, py] of [[-12, 8], [12, 8], [0, -10]]) { cel(c, () => { c.beginPath(); c.arc(px, py, 15, 0, TAU); }, '#4a6aff', '#2a3ab8', null, 3, 4); c.save(); c.globalAlpha = 0.7; ell(c, px - 4, py - 5, 6, 4, '#e8f6ff'); c.restore(); } Art.sparkle(c, 14, -14, 6, '#ffffff'); };
  T.swirlpop = (c, t) => { c.beginPath(); c.moveTo(0, 14); c.lineTo(0, 44); stroke(c, 5, '#ffffff'); ell(c, 0, -10, 30, 30, '#ffffff'); stroke(c, 3.5); const cols = ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff']; c.save(); c.translate(0, -10); c.rotate((t || 0) * 0.8); for (let i = 0; i < 40; i++) { const a = i * 0.45, r = i * 0.7; ell(c, Math.cos(a) * r, Math.sin(a) * r, 4.5, 4.5, cols[i % 6]); } c.restore(); gloss(c, -10, -22, 7, 4); };
  T.rainbowstar = (c) => { c.save(); Art.starPath(c, 0, 2, 36, 17, 5); c.clip(); ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'].forEach((cc, i) => { c.fillStyle = cc; c.fillRect(-40, -36 + i * 13, 80, 14); }); c.restore(); c.lineJoin = 'round'; Art.starPath(c, 0, 2, 36, 17, 5); stroke(c, 3.5); gloss(c, -8, -10, 5, 3); };
  T.heartcandy = (c) => { c.save(); c.scale(2.1, 2.1); Art.heart(c, 0, 4, 30, '#ff4a8a'); c.restore(); c.beginPath(); c.moveTo(0, 12.6); c.bezierCurveTo(-31, -8, -22, -34, 0, -17); c.bezierCurveTo(22, -34, 31, -8, 0, 12.6); stroke(c, 3.5); gloss(c, -12, -12, 7, 5); };
  T.gummybear = (c) => { const col = '#ff9a3c'; c.save(); c.globalAlpha = 0.92; for (const [px, py, r] of [[-12, -30, 8], [12, -30, 8], [0, -18, 16], [0, 12, 20], [-20, 0, 8], [20, 0, 8], [-12, 30, 9], [12, 30, 9]]) { ell(c, px, py, r + 2.5, r + 2.5, LINE); } for (const [px, py, r] of [[-12, -30, 8], [12, -30, 8], [0, -18, 16], [0, 12, 20], [-20, 0, 8], [20, 0, 8], [-12, 30, 9], [12, 30, 9]]) ell(c, px, py, r, r, col); c.restore(); ell(c, -5, -20, 2, 2, LINE); ell(c, 5, -20, 2, 2, LINE); gloss(c, -6, 4, 6, 9); };
  T.rainbowjelly = (c) => { ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff'].forEach((cc, i) => { c.beginPath(); c.arc(0, 20, 36 - i * 6, Math.PI, 0); stroke(c, 7, cc); }); c.beginPath(); c.arc(0, 20, 39, Math.PI, 0); c.arc(0, 20, 9, 0, Math.PI, true); c.closePath(); stroke(c, 3); };
  T.dragee = (c) => { for (const [px, py, cc] of [[-14, 10, '#ff5e9a'], [14, 10, '#4fb7ff'], [0, -10, '#ffe14a'], [0, 20, '#41d982']]) { cel(c, () => { c.beginPath(); c.ellipse(px, py, 15, 11, 0.3, 0, TAU); }, cc, mix(cc, '#000000', 0.25), null, 3, 3); gloss(c, px - 5, py - 4, 4, 2.5); } };
  T.banana = (c) => { cel(c, () => { c.beginPath(); c.moveTo(-30, -18); c.quadraticCurveTo(-26, 30, 30, 18); c.quadraticCurveTo(30, 8, 22, 8); c.quadraticCurveTo(-16, 14, -22, -22); c.closePath(); }, '#ffe14a', '#d8a820', '#fff6b0', 3.5, 5); c.beginPath(); c.moveTo(-30, -18); c.lineTo(-24, -28); stroke(c, 5, '#6a4a1a'); };
  T.mango = (c) => { cel(c, () => { c.beginPath(); c.ellipse(0, 4, 30, 26, -0.4, 0, TAU); }, '#ffb23a', '#e0602a', '#ffe08a', 3.5, 6); c.save(); c.globalAlpha = 0.5; ell(c, 12, -6, 12, 9, '#ff5a3a'); c.restore(); c.beginPath(); c.moveTo(-14, -18); c.quadraticCurveTo(-24, -34, -6, -36); c.quadraticCurveTo(-4, -24, -14, -18); c.fillStyle = '#41d982'; c.fill(); stroke(c, 2.5); };
  T.coconut = (c) => { cel(c, () => { c.beginPath(); c.arc(0, 4, 30, 0, TAU); }, '#8a5a3a', '#5a3a22', null, 3.5, 5); ell(c, 0, -2, 22, 20, '#ffffff'); stroke(c, 2.5); ell(c, 0, -2, 14, 12, '#f4f0e8'); c.beginPath(); c.moveTo(2, -20); c.lineTo(10, -40); stroke(c, 3, '#ff7eb6'); };
  T.pineapple = (c) => { for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 6, -16); c.quadraticCurveTo(i * 18, -32, i * 10, -44); c.quadraticCurveTo(i * 4, -30, i * 6, -16); c.fillStyle = '#41d982'; c.fill(); stroke(c, 2.5); } cel(c, () => { c.beginPath(); c.ellipse(0, 10, 22, 28, 0, 0, TAU); }, '#ffc83a', '#d8901a', null, 3.5, 5); c.save(); c.beginPath(); c.ellipse(0, 10, 22, 28, 0, 0, TAU); c.clip(); for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 10 - 30, -20); c.lineTo(i * 10 + 30, 40); c.moveTo(i * 10 + 30, -20); c.lineTo(i * 10 - 30, 40); stroke(c, 1.8, '#a8701a'); } c.restore(); };
  T.grapes = (c) => { for (const [px, py] of [[-14, -10], [0, -14], [14, -10], [-8, 4], [8, 4], [0, 18]]) { cel(c, () => { c.beginPath(); c.arc(px, py, 11, 0, TAU); }, '#a86aff', '#6a3ac8', null, 2.5, 3); gloss(c, px - 4, py - 4, 3, 2); } c.beginPath(); c.moveTo(0, -24); c.lineTo(4, -36); stroke(c, 4, '#6a4a1a'); };
  T.watermelon = (c) => { c.beginPath(); c.moveTo(-34, -10); c.arc(0, -10, 34, 0, Math.PI); c.closePath(); c.fillStyle = '#41a84a'; c.fill(); stroke(c, 3.5); c.beginPath(); c.moveTo(-28, -10); c.arc(0, -10, 28, 0, Math.PI); c.closePath(); c.fillStyle = '#ff5a6a'; c.fill(); for (const [px, py] of [[-12, -2], [0, 4], [12, -2], [-4, 12], [8, 10]]) ell(c, px, py, 2, 3, LINE); };

  // старые вкусняшки Ням-Ням — оставляем, но рисуем через новую систему
  const NYAM = { cupcake: 0, cookie: 1, candy: 2, donut: 3, starpop: 4, strawberry: 5 };
  const oldTreat = Art.treat;
  Art.treatNamed = function (ctx, name, x, y, s, t) {
    if (NYAM[name] != null) return oldTreat(ctx, NYAM[name], x, y, s, t);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    (T[name] || T.snowball)(ctx, t || 0);
    ctx.restore();
  };
  // Art.treat(type) теперь рисует вкусняшку текущей планеты
  Art.treat = function (ctx, type, x, y, s, t, pid) {
    const pd = PLANET_BY_ID[pid || S.data.planet] || PLANETS[0];
    Art.treatNamed(ctx, pd.treats[((type % 6) + 6) % 6], x, y, s, t);
  };
  Art.TREAT_COLORS = ['#ff7eb6', '#e2a35c', '#4fb7ff', '#b07cff', '#ffd23f', '#e8233f'];

  // ================== ПРЕПЯТСТВИЯ ==================
  function angryEyes(c, x, y, r) {
    for (const side of [-1, 1]) { ell(c, x + side * r * 0.35, y, r * 0.2, r * 0.24, '#ffffff'); stroke(c, 2); ell(c, x + side * r * 0.32, y + r * 0.04, r * 0.1, r * 0.13, LINE);
      c.beginPath(); c.moveTo(x + side * r * 0.6, y - r * 0.32); c.lineTo(x + side * r * 0.12, y - r * 0.18); stroke(c, r * 0.09); }
  }
  Art.obstacle = function (ctx, kind, x, y, r, rot, t, seed) {
    kind = kind || P().obstacle;
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (kind) {
      case 'jelly': { // злая медуза
        const w = Math.sin((t || 0) * 4 + x) * 0.15;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.3, r * 0.1); ctx.bezierCurveTo(i * r * 0.3 + Math.sin((t || 0) * 5 + i) * 8, r * 0.6, i * r * 0.4 - 6, r * 0.9, i * r * 0.35, r * 1.3); stroke(ctx, 5, '#c83a9a'); }
        ctx.save(); ctx.globalAlpha = 0.92; cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-r, r * 0.2); ctx.quadraticCurveTo(-r * (1 + w), -r * 1.1, 0, -r); ctx.quadraticCurveTo(r * (1 + w), -r * 1.1, r, r * 0.2); ctx.quadraticCurveTo(0, r * 0.45, -r, r * 0.2); ctx.closePath(); }, '#ff7ad8', '#c83a9a', '#ffd0f0', 3.5, r * 0.25); ctx.restore();
        angryEyes(ctx, 0, -r * 0.3, r); break;
      }
      case 'lava': {
        ctx.rotate(rot || 0);
        ctx.save(); ctx.globalAlpha = 0.45; ell(ctx, 0, 0, r * 1.4, r * 1.4); ctx.fillStyle = rg(ctx, 0, 0, r * 1.4, '#ff7a1a', 'rgba(255,60,0,0)', 0, 0); ctx.fill(); ctx.restore();
        const rnd = Art.seeded(seed || 5);
        const lp = () => { ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (0.82 + rnd() * 0.3); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
        const r2 = Art.seeded(seed || 5); const lp2 = () => { ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = r * (0.82 + r2() * 0.3); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
        lp(); ctx.fillStyle = '#3a2228'; ctx.fill(); stroke(ctx, 3.5);
        ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.1, r * 0.1); ctx.lineTo(r * 0.2, -r * 0.4); ctx.moveTo(-r * 0.1, r * 0.1); ctx.lineTo(r * 0.1, r * 0.6); stroke(ctx, r * 0.16, '#ff5a1a'); ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.1, r * 0.1); ctx.lineTo(r * 0.2, -r * 0.4); ctx.moveTo(-r * 0.1, r * 0.1); ctx.lineTo(r * 0.1, r * 0.6); stroke(ctx, r * 0.06, '#fff27a');
        lp2; break;
      }
      case 'storm': {
        if (Math.sin((t || 0) * 3 + x) > 0.6) { ctx.beginPath(); ctx.moveTo(0, r * 0.3); ctx.lineTo(-r * 0.25, r * 0.8); ctx.lineTo(r * 0.05, r * 0.8); ctx.lineTo(-r * 0.15, r * 1.4); ctx.lineTo(r * 0.35, r * 0.65); ctx.lineTo(r * 0.05, r * 0.65); ctx.lineTo(r * 0.25, r * 0.3); ctx.closePath(); ctx.fillStyle = '#ffe14a'; ctx.fill(); stroke(ctx, 2.5); }
        Art.cloud(ctx, 0, r * 0.35, r / 55, '#6a6a8a', '#3a3a5a'); angryEyes(ctx, 0, -r * 0.05, r * 0.9); break;
      }
      case 'icicle': {
        ctx.rotate(rot || 0);
        cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 0.75, -r * 0.2); ctx.lineTo(r * 0.45, r * 0.8); ctx.lineTo(-r * 0.4, r * 0.85); ctx.lineTo(-r * 0.8, -r * 0.15); ctx.closePath(); }, '#9fe8ff', '#4f9fd8', '#ffffff', 3.5, r * 0.2);
        ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(-r * 0.1, r * 0.8); stroke(ctx, 2, '#ffffffaa'); angryEyes(ctx, 0, 0, r * 0.8); break;
      }
      case 'blot': {
        const w = (t || 0) * 3 + x;
        const bp = () => { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, rr = r * (0.85 + Math.sin(a * 5 + w) * 0.12); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); };
        cel(ctx, bp, '#2a1a3a', '#120a1a', '#6a4a8a', 3, r * 0.2);
        for (const side of [-1, 1]) { ell(ctx, side * r * 0.3, -r * 0.1, r * 0.17, r * 0.2, '#ff3b5c'); ell(ctx, side * r * 0.3, -r * 0.1, r * 0.07, r * 0.1, '#fff27a'); }
        ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.3); ctx.lineTo(-r * 0.1, r * 0.2); ctx.lineTo(r * 0.1, r * 0.3); ctx.lineTo(r * 0.3, r * 0.2); stroke(ctx, 3, '#ff3b5c'); break;
      }
      case 'thorn': {
        ctx.rotate(rot || 0);
        for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.2) * r * 0.75, Math.sin(a - 0.2) * r * 0.75); ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3); ctx.lineTo(Math.cos(a + 0.2) * r * 0.75, Math.sin(a + 0.2) * r * 0.75); ctx.fillStyle = '#c8e05a'; ctx.fill(); stroke(ctx, 2.5); }
        cel(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); }, '#4a9a3a', '#2a6a2a', '#8ad87a', 3.5, r * 0.2);
        ctx.rotate(-(rot || 0)); angryEyes(ctx, 0, 0, r * 0.85); break;
      }
      default: { // метеорит
        ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, 0, 0, r * 1.3, r * 1.3, '#ffb070'); ctx.restore();
        ctx.rotate(rot || 0);
        const rnd = Art.seeded(seed || 7), pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rr = r * (0.82 + rnd() * 0.3); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
        cel(ctx, () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }, '#a88a78', '#5a4038', '#e0c8b0', 3.5, r * 0.25);
        for (let i = 0; i < 3; i++) { const cx = (rnd() - 0.5) * r, cy = (rnd() - 0.5) * r; ell(ctx, cx, cy, r * 0.17, r * 0.14, '#6a5048'); ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.17, r * 0.14, 0, Math.PI * 0.1, Math.PI * 0.9); stroke(ctx, 2, '#c8b0a0'); }
      }
    }
    ctx.restore();
  };
  Art.meteor = function (ctx, x, y, r, rot, seed) { Art.obstacle(ctx, 'meteor', x, y, r, rot, G.t, seed); };

  // ================== ОБЛАКО ==================
  Art.cloud = function (ctx, x, y, s, c, shade) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const puffs = [[-44, 0, 26], [-16, -18, 34], [20, -14, 30], [46, 2, 22], [0, 6, 28]];
    const path = () => { ctx.beginPath(); for (const [px, py, r] of puffs) { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU); } };
    ctx.save(); path(); ctx.lineWidth = 7; ctx.strokeStyle = LINE; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.restore();
    path(); ctx.fillStyle = shade || '#c8d4f0'; ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.translate(-6, -12); path(); ctx.fillStyle = c || '#ffffff'; ctx.fill(); ctx.restore();
    ctx.restore();
  };

  // ================== ЗВЕРУШКИ ДЛЯ «ВЫГЛЯДЫВАЛОК» ==================
  Art.critter = function (ctx, kind, x, y, s, t, mood) {
    kind = kind || P().critter;
    const C = { bunny: ['#eefff9', '#a8e0d0', '#ffb3d0'], fish: ['#5ac8ff', '#2a8ad8', '#ffb23a'], sprite: ['#ffb23a', '#ff5a1a', '#fff27a'], bird: ['#ffe14a', '#e0a020', '#ff7a3a'],
      penguin: ['#2a2a4a', '#14142a', '#ffffff'], unicorn: ['#ffffff', '#e0c8f0', '#ffd23f'], monkey: ['#a8742a', '#7a4a1a', '#ffd8a8'] }[kind] || ['#ccc', '#999', '#fff'];
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wob = Math.sin((t || 0) * 6) * 0.1;
    // уши / особенности сзади
    if (kind === 'bunny') for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * 24, -108); ctx.rotate(side * (0.25 + wob));
      cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -36, 15, 40, 0, 0, TAU); }, C[0], C[1], null, 4, 5); ell(ctx, 0, -34, 7, 28, C[2]);
      Art.roundStar(ctx, 0, -84, 11, '#ffd23f', LINE); ctx.restore(); }
    if (kind === 'monkey') for (const side of [-1, 1]) { cel(ctx, () => { ctx.beginPath(); ctx.arc(side * 62, -66, 20, 0, TAU); }, C[0], C[1], null, 4, 4); ell(ctx, side * 62, -66, 11, 11, C[2]); }
    if (kind === 'fish') { cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -120); ctx.quadraticCurveTo(30, -150, 40, -130); ctx.quadraticCurveTo(24, -112, 0, -104); ctx.closePath(); }, C[2], '#d8701a', null, 3.5, 4); }
    if (kind === 'bird') for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * 58, -60); ctx.rotate(side * (0.6 + wob * 3)); cel(ctx, () => { ctx.beginPath(); ctx.ellipse(side * 14, 0, 24, 12, 0, 0, TAU); }, C[0], C[1], null, 3.5, 4); ctx.restore(); }
    if (kind === 'unicorn') ['#ff9ad5', '#9ad8ff', '#c8a8ff'].forEach((cc, i) => { ctx.save(); ctx.translate(-30 + i * 22, -112); ctx.rotate(-0.5 + i * 0.3 + wob); cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -10, 12, 22, 0, 0, TAU); }, cc, Art.mix(cc, '#000000', 0.2), null, 3, 3); ctx.restore(); });
    // тело
    const body = kind === 'sprite'
      ? () => { const f = Math.sin((t || 0) * 10) * 6; ctx.beginPath(); ctx.moveTo(-58, -20); ctx.quadraticCurveTo(-70, -90, -20, -110); ctx.quadraticCurveTo(-10, -150 + f, 6, -170 - f); ctx.quadraticCurveTo(14, -130, 30, -120); ctx.quadraticCurveTo(70, -90, 58, -20); ctx.quadraticCurveTo(0, 6, -58, -20); ctx.closePath(); }
      : () => { ctx.beginPath(); ctx.ellipse(0, -60, 62, 60, 0, 0, TAU); };
    cel(ctx, body, C[0], C[1], kind === 'penguin' ? '#5a5a8a' : '#ffffff', 5, 12);
    if (kind === 'penguin') { ell(ctx, 0, -48, 44, 46, C[2]); }
    if (kind === 'monkey' || kind === 'bird' || kind === 'unicorn') { ell(ctx, 0, -46, 40, 32, kind === 'monkey' ? C[2] : '#fff8e8'); }
    if (kind === 'fish') { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-20 + i * 20, -20, 12, Math.PI * 1.1, Math.PI * 1.9); Art.stroke(ctx, 2.5, '#2a8ad8'); } }
    // мордочка
    const blink = mood === 1;
    for (const side of [-1, 1]) Art.animeEye(ctx, side * 21, -68, 10, 13, kind === 'sprite' ? '#fff27a' : '#7ec8ff', kind === 'sprite' ? '#c0400a' : '#1a3a8a', { side, happy: blink });
    Art.blush(ctx, -36, -48, 8, '#ff8fbf'); Art.blush(ctx, 36, -48, 8, '#ff8fbf');
    if (kind === 'bird' || kind === 'penguin') { ctx.beginPath(); ctx.moveTo(-9, -52); ctx.lineTo(9, -52); ctx.lineTo(0, -40); ctx.closePath(); ctx.fillStyle = '#ff9a3c'; ctx.fill(); Art.stroke(ctx, 2.5); }
    else { ctx.beginPath(); ctx.moveTo(-8, -46); ctx.quadraticCurveTo(0, -38, 8, -46); Art.stroke(ctx, 3); }
    if (kind === 'unicorn') { cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, -112); ctx.lineTo(0, -150); ctx.lineTo(8, -112); ctx.closePath(); }, C[2], '#d89a10', null, 3, 3); }
    if (kind === 'bird') { cel(ctx, () => { ctx.beginPath(); ctx.ellipse(4, -126, 7, 16, 0.3, 0, TAU); }, '#ff7a3a', '#c84a1a', null, 2.5, 3); }
    ctx.restore();
  };

  // ================== ЗЛОЙ КОСМОНАВТ-ВОРИШКА ==================
  Art.thief = function (ctx, x, y, s, t, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, 0, 0, 40 * s, 8 * s, '#0a0520'); ctx.restore();
    const hop = o.run ? Math.abs(Math.sin(t * 16)) * 10 : Math.abs(Math.sin(t * 6)) * 4;
    ctx.translate(0, -hop); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const SU = '#5a3a8a', SS = '#3a2260';
    const leg = Math.sin(t * (o.run ? 16 : 8)) * 0.5;
    for (const [side, lg] of [[-1, leg], [1, -leg]]) { ctx.save(); ctx.translate(side * 12, -46); ctx.rotate(lg); cel(ctx, () => { Art.rr(ctx, -9, 0, 18, 30, 8); }, SU, SS, null, 3.5, 4); cel(ctx, () => { Art.rr(ctx, -12, 26, 26, 14, 6); }, '#2a2a3a', '#14141e', null, 3, 3); ctx.restore(); }
    // мешок
    if (o.sack) { cel(ctx, () => { ctx.beginPath(); ctx.ellipse(-34, -72, 26, 30, 0.3, 0, TAU); }, '#c8a070', '#8a6a40', null, 3.5, 5); ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = LINE; ctx.textAlign = 'center'; ctx.fillText('$', -34, -64); }
    cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-24, -104); ctx.quadraticCurveTo(-30, -60, -22, -44); ctx.lineTo(22, -44); ctx.quadraticCurveTo(30, -60, 24, -104); ctx.closePath(); }, SU, SS, '#8a6ac0', 3.5, 7);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(-25, -58, 50, 6);
    for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * 22, -98); ctx.rotate(side * (o.run ? 1.2 + leg : 0.5)); cel(ctx, () => { Art.rr(ctx, -8, 0, 16, 32, 8); }, SU, SS, null, 3.5, 4); ell(ctx, 0, 36, 9, 9, '#2a2a3a'); Art.stroke(ctx, 3); ctx.restore(); }
    // шлем с тёмным стеклом и злой ухмылкой
    ell(ctx, 0, -134, 40, 38, '#3a2a5a'); Art.stroke(ctx, 4);
    const vg = ctx.createLinearGradient(0, -160, 0, -110); vg.addColorStop(0, '#2a0a1a'); vg.addColorStop(1, '#5a0a2a');
    ell(ctx, 2, -132, 30, 24); ctx.fillStyle = vg; ctx.fill(); Art.stroke(ctx, 3);
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 22, -142); ctx.lineTo(side * 6, -134); ctx.lineTo(side * 20, -130); ctx.closePath(); ctx.fillStyle = '#ff3b5c'; ctx.fill(); ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, side * 15, -135, 10, 6, '#ff3b5c'); ctx.restore(); }
    ctx.beginPath(); ctx.moveTo(-14, -120); ctx.quadraticCurveTo(2, -108, 18, -122); Art.stroke(ctx, 3, '#ffe14a');
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 8, -117 + (i === 1 ? 3 : 0)); ctx.lineTo(-6 + i * 8, -113); Art.stroke(ctx, 2, '#ffe14a'); }
    // антенна-рожки
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 22, -166); ctx.lineTo(side * 32, -186); Art.stroke(ctx, 3); ell(ctx, side * 32, -188, 5, 5, '#ff3b5c'); Art.stroke(ctx, 2); }
    ctx.restore();
  };

  // ================== ЗЛОЙ ЗМЕЙ ==================
  // pts — точки тела от головы к хвосту
  Art.serpent = function (ctx, pts, t, o) {
    o = o || {};
    const n = pts.length, R = o.r || 34;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = n - 1; i >= 1; i--) {
      const [x, y] = pts[i], r = R * (1 - i / n * 0.7);
      const hit = o.weak && o.weak.includes(i);
      Art.cel(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }, i % 2 ? '#5a2a8a' : '#6a3aa0', '#3a1a5a', '#9a6ad8', 3.5, r * 0.3);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.6, 0.15 * Math.PI, 0.85 * Math.PI); Art.stroke(ctx, r * 0.18, '#c8e05a'); ctx.restore();
      if (hit) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 10) * 0.3; ell(ctx, x, y, r * 0.75, r * 0.75, '#ffe14a'); ctx.restore(); Art.sparkle(ctx, x, y, r * 0.6, '#ffffff'); }
    }
    const [hx, hy] = pts[0], [nx, ny] = pts[1];
    const ang = Math.atan2(hy - ny, hx - nx);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang + Math.PI / 2);
    // голова
    Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -R * 1.6); ctx.bezierCurveTo(R * 1.3, -R * 1.5, R * 1.3, R * 0.6, 0, R * 0.8); ctx.bezierCurveTo(-R * 1.3, R * 0.6, -R * 1.3, -R * 1.5, 0, -R * 1.6); ctx.closePath(); }, '#7a3ab8', '#4a1a7a', '#b88ae8', 4, R * 0.3);
    for (const side of [-1, 1]) { Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(side * R * 0.5, -R * 0.9); ctx.quadraticCurveTo(side * R * 1.2, -R * 1.9, side * R * 0.9, -R * 2.3); ctx.quadraticCurveTo(side * R * 0.8, -R * 1.5, side * R * 0.2, -R * 1.2); ctx.closePath(); }, '#ffd23f', '#c89a10', null, 3, 4); }
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * R * 0.45, -R * 0.45, R * 0.3, R * 0.2, side * 0.4, 0, TAU); ctx.fillStyle = '#ffe14a'; ctx.fill(); Art.stroke(ctx, 3); ell(ctx, side * R * 0.45, -R * 0.45, R * 0.06, R * 0.17, LINE);
      ctx.beginPath(); ctx.moveTo(side * R * 0.85, -R * 0.8); ctx.lineTo(side * R * 0.15, -R * 0.62); Art.stroke(ctx, 4); }
    if (o.open) { ctx.beginPath(); ctx.moveTo(-R * 0.5, R * 0.2); ctx.quadraticCurveTo(0, R * 1.2, R * 0.5, R * 0.2); ctx.closePath(); ctx.fillStyle = '#5a0a2a'; ctx.fill(); Art.stroke(ctx, 3);
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * R * 0.35, R * 0.25); ctx.lineTo(side * R * 0.28, R * 0.6); ctx.lineTo(side * R * 0.2, R * 0.25); ctx.fillStyle = '#fff'; ctx.fill(); Art.stroke(ctx, 1.5); } }
    else { ctx.beginPath(); ctx.moveTo(-R * 0.5, R * 0.25); ctx.quadraticCurveTo(0, R * 0.5, R * 0.5, R * 0.25); Art.stroke(ctx, 3); }
    const tg = Math.sin(t * 12) * 0.3; ctx.beginPath(); ctx.moveTo(0, R * 0.7); ctx.lineTo(Math.sin(tg) * 6, R * 1.2); ctx.lineTo(-6, R * 1.4); ctx.moveTo(Math.sin(tg) * 6, R * 1.2); ctx.lineTo(6, R * 1.45); Art.stroke(ctx, 3.5, '#ff3b5c');
    ctx.restore();
    ctx.restore();
  };

  // ================== МАЯК (в цветах планеты) ==================
  Art.beacon = function (ctx, x, y, s, lit, t, cols) {
    cols = cols || P().beacon;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
    if (lit) {
      ctx.save(); ctx.globalAlpha = 0.32 + Math.sin(t * 2) * 0.08;
      const a = t * 0.8;
      for (const d of [0, Math.PI]) {
        ctx.beginPath(); ctx.moveTo(0, -150);
        ctx.lineTo(Math.cos(a + d - 0.15) * 700, -150 + Math.sin(a + d - 0.15) * 200);
        ctx.lineTo(Math.cos(a + d + 0.15) * 700, -150 + Math.sin(a + d + 0.15) * 200);
        ctx.closePath(); ctx.fillStyle = '#fff3a0'; ctx.fill();
      }
      ctx.restore();
    }
    const tower = () => { ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-22, -120); ctx.lineTo(22, -120); ctx.lineTo(34, 0); ctx.closePath(); };
    tower(); const g = ctx.createLinearGradient(-34, 0, 34, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f0f0fa'); g.addColorStop(1, '#b8bcd8'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); tower(); ctx.clip(); ctx.fillStyle = cols[0] === '#ffffff' ? cols[1] : cols[0]; ctx.fillRect(-40, -40, 80, 18); ctx.fillRect(-40, -90, 80, 18); ctx.restore();
    tower(); stroke(ctx, 4.5);
    Art.rr(ctx, -26, -128, 52, 10, 4); ctx.fillStyle = cols[1]; ctx.fill(); stroke(ctx, 3.5);
    Art.rr(ctx, -18, -168, 36, 40, 8); ctx.fillStyle = lit ? '#fff3a0' : '#4a4070'; ctx.fill(); stroke(ctx, 3.5);
    ctx.beginPath(); ctx.moveTo(-24, -166); ctx.quadraticCurveTo(0, -200, 24, -166); ctx.closePath(); ctx.fillStyle = cols[1]; ctx.fill(); stroke(ctx, 3.5);
    Art.roundStar(ctx, 0, -150, 13, lit ? '#ffd23f' : '#7a6aa0', LINE);
    if (lit) Art.sparkle(ctx, 18, -176, 8, '#ffffff', 0.5 + Math.sin(t * 4) * 0.4);
    ctx.restore();
  };
})();
