// Аниме-стиль: глаза, cel-тени, драконы семи планет и яйца
'use strict';
(function () {
  const TAU = Math.PI * 2;
  const ell = Art.ell, rg = Art.rg;
  const LINE = '#1a1030';
  function stroke(ctx, w, c) { ctx.lineWidth = w; ctx.strokeStyle = c || LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  Art.stroke = stroke;
  function mix(c1, c2, k) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
    const g = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
    const bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  Art.mix = mix;

  // Cel-заливка: тень снизу-справа, свет сверху-слева, обводка
  function cel(ctx, path, base, shade, hi, lw, off) {
    off = off || 10;
    path(); ctx.fillStyle = shade; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.translate(-off * 0.7, -off); path(); ctx.fillStyle = base; ctx.fill();
    ctx.restore();
    if (hi) { // световой ободок по верхнему-левому краю
      ctx.save(); path(); ctx.clip();
      ctx.translate(off * 0.45, off * 0.55); path(); ctx.globalAlpha = 0.6; ctx.lineWidth = off * 0.55; ctx.strokeStyle = hi; ctx.stroke();
      ctx.restore();
    }
    if (lw !== 0) { path(); stroke(ctx, lw || 4); }
  }
  Art.cel = cel;

  // Блёстка «кира-кира» (четырёхлучевая)
  Art.sparkle = function (ctx, x, y, r, color, a) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= (a == null ? 1 : a);
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r); ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fillStyle = color || '#fff'; ctx.fill();
    ctx.restore();
  };

  // Аниме-глаз. side: -1 левый, 1 правый
  Art.animeEye = function (ctx, x, y, w, h, c1, c2, o) {
    o = o || {};
    const look = o.look || 0, side = o.side || 1, line = o.line || LINE;
    ctx.save(); ctx.translate(x, y);
    if (o.happy) {
      ctx.beginPath(); ctx.moveTo(-w, h * 0.15); ctx.quadraticCurveTo(0, -h * 0.9, w, h * 0.15); stroke(ctx, h * 0.2, line);
      ctx.restore(); return;
    }
    if ((o.blink || 0) > 0.6) {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, h * 0.35, w, 0); stroke(ctx, h * 0.16, line);
      ctx.restore(); return;
    }
    ctx.scale(1, 1 - (o.blink || 0) * 0.9);
    // белок: верх чуть сплющен, наружный уголок приподнят
    const sclera = () => {
      ctx.beginPath();
      ctx.moveTo(-w * side, h * 0.1);
      ctx.bezierCurveTo(-w * side, -h * 0.9, w * 0.6 * side, -h * 1.05, w * side, -h * 0.35);
      ctx.bezierCurveTo(w * 1.05 * side, h * 0.5, w * 0.5 * side, h, 0, h);
      ctx.bezierCurveTo(-w * 0.7 * side, h, -w * side, h * 0.6, -w * side, h * 0.1);
      ctx.closePath();
    };
    sclera(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); sclera(); ctx.clip();
    const ix = look * w * 0.3, iy = h * 0.08;
    const g = ctx.createLinearGradient(0, iy - h * 0.9, 0, iy + h * 0.9);
    g.addColorStop(0, c2); g.addColorStop(0.55, mix(c2, c1, 0.5)); g.addColorStop(1, c1);
    ell(ctx, ix, iy, w * 0.74, h * 0.86); ctx.fillStyle = g; ctx.fill();
    ell(ctx, ix, iy - h * 0.05, w * 0.38, h * 0.5, mix(c2, '#000000', 0.55));
    ctx.beginPath(); ctx.ellipse(ix, iy + h * 0.25, w * 0.5, h * 0.35, 0, 0.2, Math.PI - 0.2); ctx.lineWidth = w * 0.12; ctx.strokeStyle = mix(c1, '#ffffff', 0.5); ctx.stroke();
    // тень от века
    ctx.globalAlpha = 0.25; ell(ctx, 0, -h * 0.95, w * 1.3, h * 0.45, mix(c2, '#000000', 0.4)); ctx.globalAlpha = 1;
    // блики
    ell(ctx, ix - w * 0.28, iy - h * 0.36, w * 0.3, h * 0.24, '#ffffff', -0.4);
    ell(ctx, ix + w * 0.32, iy + h * 0.38, w * 0.13, w * 0.13, '#ffffff');
    Art.sparkle(ctx, ix + w * 0.25, iy - h * 0.45, w * 0.16, '#ffffff', 0.9);
    ctx.restore();
    // верхнее веко (ресницы) с «хвостиком»
    ctx.beginPath();
    ctx.moveTo(-w * 1.02 * side, h * 0.12);
    ctx.bezierCurveTo(-w * side, -h * 0.95, w * 0.6 * side, -h * 1.1, w * 1.05 * side, -h * 0.38);
    ctx.lineTo(w * 1.3 * side, -h * 0.62);
    stroke(ctx, h * 0.17, line);
    ctx.beginPath(); ctx.moveTo(-w * 0.5 * side, h * 0.95); ctx.quadraticCurveTo(w * 0.3 * side, h * 1.05, w * 0.85 * side, h * 0.5); stroke(ctx, h * 0.06, line);
    ctx.restore();
  };

  // Румянец аниме-штрихами
  Art.blush = function (ctx, x, y, w, c) {
    ctx.save(); ctx.globalAlpha = 0.45; ell(ctx, x, y, w, w * 0.45, c || '#ff8fbf'); ctx.globalAlpha = 0.8;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.45 - w * 0.12, y + w * 0.18); ctx.lineTo(x + i * w * 0.45 + w * 0.12, y - w * 0.18); stroke(ctx, w * 0.1, c ? mix(c, '#ff0040', 0.3) : '#ff5c9a'); }
    ctx.restore();
  };

  // ================== ДРАКОН ==================
  // o: {t, level, planet, blink, mouth, look, squash, flap, fire, happy, lift, flying, tilt, glow}
  Art.dragon = function (ctx, x, y, s, o) {
    o = o || {};
    const pid = o.planet || S.data.planet, pd = PLANET_BY_ID[pid] || PLANETS[0];
    const D = pd.dragon;
    const t = o.t || 0;
    const lvl = o.level != null ? o.level : (S.data.planets[pid] ? S.data.planets[pid].level : 1);
    if (lvl <= 0) return Art.egg(ctx, x, y, s * 0.9, pid, { t, crack: o.crack || 0, wob: o.squash || 0, glow: o.glow });
    const a = M.clamp((lvl - 1) / 9, 0, 1);
    const sq = o.squash || 0, breathe = Math.sin(t * 2.2) * 0.015;
    ctx.save();
    ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, 0, 0, (90 + 30 * a) * s * (1 - (o.lift || 0) / 500), 15 * s, '#0a0520'); ctx.restore();
    ctx.translate(0, -(o.lift || 0));
    ctx.scale(s * (1 + sq * 0.12 + breathe * 0.4), s * (1 - sq * 0.12 + breathe));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const bRx = 54 + 14 * a, bRy = 56 + 4 * a, bCY = -bRy - 6;
    const bTop = bCY - bRy;
    const neck = 6 + 40 * a;
    const hR = 58 - 10 * a;
    const hY = bTop - neck - hR * 0.45;
    const look = o.look || 0, tilt = (o.tilt || 0) + Math.sin(t * 1.3) * 0.025;

    // аура
    if (lvl >= 3 || o.glow) {
      ctx.save(); ctx.globalAlpha = 0.28 + Math.sin(t * 3) * 0.1;
      ctx.fillStyle = rg(ctx, 0, hY + 40, 230, 'rgba(255,245,180,0.95)', 'rgba(255,200,255,0)', 0, 0);
      ell(ctx, 0, hY + 40, 230, 230); ctx.fill(); ctx.restore();
    }

    // ---- хвост ----
    const sway = Math.sin(t * 2.4) * (10 + 6 * a);
    const tl = 100 + 80 * a;
    const tp = (k) => { // точка вдоль хвоста
      const x0 = bRx * 0.55, y0 = bCY + bRy * 0.55;
      const x1 = x0 + tl * 0.7, y1 = y0 + 20, x2 = x0 + tl, y2 = y0 - tl * 0.45 + sway;
      const u = 1 - k;
      return [u * u * x0 + 2 * u * k * x1 + k * k * x2, u * u * y0 + 2 * u * k * y1 + k * k * y2];
    };
    const tailPath = () => {
      ctx.beginPath();
      const N = 14, top = [], bot = [];
      for (let i = 0; i <= N; i++) {
        const k = i / N, p = tp(k), q = tp(Math.min(1, k + 0.02)), ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2;
        const r = (22 + 4 * a) * (1 - k * 0.78);
        top.push([p[0] + Math.cos(ang) * r, p[1] + Math.sin(ang) * r]); bot.push([p[0] - Math.cos(ang) * r, p[1] - Math.sin(ang) * r]);
      }
      top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath();
    };
    cel(ctx, tailPath, D.body, D.shade, D.hi, 4, 7);
    // гребень на хвосте
    if (D.crest !== 'mane') for (let i = 1; i <= 3; i++) {
      const k = 0.25 + i * 0.17, p = tp(k), q = tp(k + 0.03);
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2, r = (22 + 4 * a) * (1 - k * 0.78);
      ctx.save(); ctx.translate(p[0] + Math.cos(ang) * r * 0.8, p[1] + Math.sin(ang) * r * 0.8); ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(0, -15 + i); ctx.lineTo(7, 2); ctx.closePath();
      ctx.fillStyle = D.accent; ctx.fill(); stroke(ctx, 2.5); ctx.restore();
    }
    const tip = tp(1);
    tailTip(ctx, D, tip[0], tip[1], t, a);

    // ---- крылья ----
    const ws = (lvl >= 2 ? 1 : 0.55) * (0.95 + a * 0.6);
    const flap = o.flap != null ? o.flap : Math.sin(t * (o.flying ? 13 : 1.7)) * (o.flying ? 0.45 : 0.07);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * bRx * 0.45, bTop + 26); ctx.rotate(side * (-0.25 + flap)); ctx.scale(side * ws, ws);
      wing(ctx, D, t, a);
      ctx.restore();
    }

    // ---- задние лапы ----
    for (const side of [-1, 1]) {
      const fx = side * (bRx * 0.62);
      cel(ctx, () => { ctx.beginPath(); ctx.ellipse(fx, -26, 26 + 4 * a, 30, side * 0.2, 0, TAU); }, D.body, D.shade, null, 4, 6);
      cel(ctx, () => { ctx.beginPath(); ctx.ellipse(fx + side * 6, -6, 24, 11, 0, 0, TAU); }, D.body, D.shade, null, 4, 4);
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(fx + side * 6 + k * 10 - 4, 2); ctx.lineTo(fx + side * 6 + k * 10, 10); ctx.lineTo(fx + side * 6 + k * 10 + 4, 2); ctx.fillStyle = D.horn; ctx.fill(); stroke(ctx, 2); }
    }
    // ---- тело ----
    const bodyPath = () => { ctx.beginPath(); ctx.ellipse(0, bCY, bRx, bRy, 0, 0, TAU); };
    cel(ctx, bodyPath, D.body, D.shade, D.hi, 4.5, 12);
    ctx.save(); bodyPath(); ctx.clip(); pattern(ctx, D, 0, bCY, bRx, bRy, 1); ctx.restore();
    // шея
    const neckPath = () => { ctx.beginPath(); ctx.moveTo(-bRx * 0.42, bTop + 22); ctx.quadraticCurveTo(-hR * 0.5, bTop - neck * 0.4, -hR * 0.42, hY + hR * 0.3); ctx.lineTo(hR * 0.42, hY + hR * 0.3); ctx.quadraticCurveTo(hR * 0.5, bTop - neck * 0.4, bRx * 0.42, bTop + 22); ctx.closePath(); };
    cel(ctx, neckPath, D.body, D.shade, null, 4.5, 8);
    // брюшные пластины
    const bellyPath = () => { ctx.beginPath(); ctx.moveTo(0, hY + hR * 0.55); ctx.quadraticCurveTo(-hR * 0.36, bTop, -bRx * 0.55, bCY + 6); ctx.quadraticCurveTo(-bRx * 0.5, bCY + bRy * 0.85, 0, bCY + bRy * 0.95); ctx.quadraticCurveTo(bRx * 0.5, bCY + bRy * 0.85, bRx * 0.55, bCY + 6); ctx.quadraticCurveTo(hR * 0.36, bTop, 0, hY + hR * 0.55); ctx.closePath(); };
    cel(ctx, bellyPath, D.belly, D.bellyShade, null, 3, 8);
    ctx.save(); bellyPath(); ctx.clip();
    for (let i = 0; i < 7; i++) { const yy = hY + hR * 0.6 + i * ((bCY + bRy - hY - hR * 0.6) / 7); ctx.beginPath(); ctx.moveTo(-bRx, yy); ctx.quadraticCurveTo(0, yy + 10, bRx, yy); stroke(ctx, 2.5, D.bellyShade); }
    ctx.restore();
    // передние лапки
    const wave = o.wave ? Math.sin(t * 10) * 0.6 : 0;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * bRx * 0.55, bTop + 36); ctx.rotate(side * (0.5 + (side === 1 ? wave : 0)) );
      cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 16, 12, 24, 0, 0, TAU); }, D.body, D.shade, null, 4, 5);
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 6 - 3, 36); ctx.lineTo(k * 6, 44); ctx.lineTo(k * 6 + 3, 36); ctx.fillStyle = D.horn; ctx.fill(); stroke(ctx, 1.8); }
      ctx.restore();
    }

    // ---- голова ----
    ctx.save(); ctx.translate(0, hY); ctx.rotate(tilt);
    crest(ctx, D, hR, t, a, 'back');
    // рога, зачёсанные назад
    const hl = 30 + 42 * a;
    for (const side of [-1, 1]) {
      const hp = () => { ctx.beginPath(); ctx.moveTo(side * hR * 0.35, -hR * 0.7); ctx.quadraticCurveTo(side * (hR * 0.75 + hl * 0.4), -hR * 1.05 - hl * 0.5, side * (hR * 0.95 + hl * 0.6), -hR * 0.85 - hl * 0.85);
        ctx.quadraticCurveTo(side * (hR * 0.8 + hl * 0.2), -hR * 0.8 - hl * 0.25, side * hR * 0.68, -hR * 0.45); ctx.closePath(); };
      cel(ctx, hp, D.horn, mix(D.horn, '#000000', 0.25), null, 3.5, 4);
    }
    // боковые «уши»-плавники
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * hR * 0.95, -hR * 0.05); ctx.rotate(side * (0.5 + Math.sin(t * 2 + side) * 0.05));
      const ep = () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(side * 34, -26, side * 40, -6); ctx.quadraticCurveTo(side * 26, 4, 0, 10); ctx.closePath(); };
      cel(ctx, ep, D.accent, D.accent2, null, 3, 4);
      ctx.restore();
    }
    // череп
    const skull = () => { ctx.beginPath(); ctx.moveTo(0, -hR * 0.92); ctx.bezierCurveTo(hR * 0.85, -hR * 0.92, hR * 1.02, -hR * 0.1, hR * 0.8, hR * 0.35);
      ctx.bezierCurveTo(hR * 0.62, hR * 0.85, hR * 0.3, hR * 0.95, 0, hR * 0.95); ctx.bezierCurveTo(-hR * 0.3, hR * 0.95, -hR * 0.62, hR * 0.85, -hR * 0.8, hR * 0.35);
      ctx.bezierCurveTo(-hR * 1.02, -hR * 0.1, -hR * 0.85, -hR * 0.92, 0, -hR * 0.92); ctx.closePath(); };
    cel(ctx, skull, D.body, D.shade, D.hi, 4.5, 10);
    ctx.save(); skull(); ctx.clip(); pattern(ctx, D, 0, -hR * 0.3, hR, hR * 0.6, 0.6); ctx.restore();
    // мордочка
    const muz = () => { ctx.beginPath(); ctx.ellipse(0, hR * 0.5, hR * 0.55, hR * 0.38, 0, 0, TAU); };
    cel(ctx, muz, D.muzzle || mix(D.body, D.belly, 0.35), D.shade, null, 0, 5);
    crest(ctx, D, hR, t, a, 'front');
    // глаза
    const ew = hR * (0.3 - 0.03 * a), eh = hR * (0.4 - 0.06 * a);
    const lk = M.clamp(look, -1, 1);
    for (const side of [-1, 1]) Art.animeEye(ctx, side * hR * 0.4, -hR * 0.05, ew, eh, D.iris1, D.iris2, { look: lk, blink: o.blink, happy: o.happy, side });
    // брови (у взрослых)
    if (a > 0.3 && !o.happy) for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * hR * 0.18, -hR * 0.5); ctx.lineTo(side * hR * 0.58, -hR * 0.6); stroke(ctx, 3.5, mix(D.shade, '#000000', 0.4)); }
    Art.blush(ctx, -hR * 0.6, hR * 0.3, hR * 0.18, '#ff8fbf'); Art.blush(ctx, hR * 0.6, hR * 0.3, hR * 0.18, '#ff8fbf');
    // ноздри
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * hR * 0.14, hR * 0.38, 3.5, 2.2, side * 0.5, 0, TAU); ctx.fillStyle = LINE; ctx.fill(); }
    // рот
    const m = o.mouth || 0;
    if (m > 0.05) {
      ctx.beginPath(); ctx.moveTo(-hR * 0.28, hR * 0.6); ctx.quadraticCurveTo(0, hR * 0.6 + 6 + m * 26, hR * 0.28, hR * 0.6); ctx.quadraticCurveTo(0, hR * 0.56, -hR * 0.28, hR * 0.6);
      ctx.fillStyle = '#5a1030'; ctx.fill(); stroke(ctx, 3);
      ell(ctx, 0, hR * 0.6 + 4 + m * 14, hR * 0.15, 3 + m * 5, '#ff7aa8');
    } else {
      ctx.beginPath(); ctx.moveTo(-hR * 0.24, hR * 0.6); ctx.quadraticCurveTo(-hR * 0.1, hR * 0.7, 0, hR * 0.62); ctx.quadraticCurveTo(hR * 0.1, hR * 0.7, hR * 0.24, hR * 0.6); stroke(ctx, 3);
      ctx.beginPath(); ctx.moveTo(hR * 0.1, hR * 0.66); ctx.lineTo(hR * 0.14, hR * 0.76); ctx.lineTo(hR * 0.18, hR * 0.64); ctx.fillStyle = '#fff'; ctx.fill(); stroke(ctx, 1.5);
    }
    ctx.restore();

    if (lvl >= 10) for (let i = 0; i < 5; i++) { const an = t * 1.2 + i * TAU / 5; Art.roundStar(ctx, Math.cos(an) * 90, hY - hR - 50 + Math.sin(an) * 16, 10, '#ffd23f', LINE); }
    // огонь (дыхание стихии)
    if (o.fire > 0) {
      const f = o.fire, cols = breathColors(pd.id);
      ctx.save(); ctx.translate(0, hY + hR * 0.62);
      for (let i = 0; i < 10; i++) {
        const k = i / 9, wob = Math.sin(t * 30 + i) * 6, px = 20 + k * 220 * f, py = wob + 6 - k * 30, r = (12 + k * 30) * f;
        ctx.globalAlpha = 0.85 - k * 0.5; ell(ctx, px, py, r, r * 0.8, cols[Math.min(cols.length - 1, (k * cols.length) | 0)]);
      }
      ctx.restore();
    }
    ctx.restore();
  };
  Art.dragonHeadY = function (lvl, s) { // для расчёта положения рта
    const a = M.clamp((lvl - 1) / 9, 0, 1), bRy = 56 + 4 * a, bTop = -2 * bRy - 6, hR = 58 - 10 * a;
    return (bTop - (6 + 40 * a) - hR * 0.45 + hR * 0.6) * s;
  };
  function breathColors(id) {
    return { water: ['#ffffff', '#bff5ff', '#7fd2ff', '#38a8ff'], wind: ['#ffffff', '#e8f6ff', '#c8e4ff', '#a6d0f5'], ice: ['#ffffff', '#d6f4ff', '#a8e8ff', '#7fd8ff'],
      rainbow: ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'], jungle: ['#fff6a8', '#c8f07a', '#8ef08a', '#41d982'] }[id]
      || ['#fff6b0', '#ffd23f', '#ff9a3c', '#ff5a3a', '#c83a8a'];
  }

  function pattern(ctx, D, cx, cy, rx, ry, k) {
    const c = D.patternColor;
    switch (D.pattern) {
      case 'spots': for (const [px, py, r] of [[-0.8, -0.5, 0.14], [-0.9, 0.1, 0.1], [-0.7, 0.6, 0.12], [0.8, -0.4, 0.12], [0.85, 0.25, 0.15], [0.6, 0.7, 0.09]]) {
        ell(ctx, cx + px * rx, cy + py * ry, r * rx * k + 3, r * ry * k * 0.75 + 2, c); ell(ctx, cx + px * rx - 2, cy + py * ry - 2, r * rx * k * 0.45, r * ry * k * 0.35, mix(c, '#ffffff', 0.35)); } break;
      case 'scales': ctx.globalAlpha = 0.55; for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) { if (Math.abs(i) < 2 && j > -2) continue; ctx.beginPath(); ctx.arc(cx + i * rx * 0.28 + (j % 2) * rx * 0.14, cy + j * ry * 0.35, rx * 0.1, 0.2, Math.PI - 0.2); stroke(ctx, 2.5, c); } ctx.globalAlpha = 1; break;
      case 'stripes': for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx + side * rx, cy - ry * 0.5 + i * ry * 0.45); ctx.quadraticCurveTo(cx + side * rx * 0.75, cy - ry * 0.4 + i * ry * 0.45, cx + side * rx * 0.55, cy - ry * 0.25 + i * ry * 0.45); stroke(ctx, 7 * k + 2, c); } break;
      case 'swirl': ctx.globalAlpha = 0.7; for (const side of [-1, 1]) { ctx.beginPath(); for (let i = 0; i < 30; i++) { const an = i * 0.35, r = i * 0.9 * k; ctx.lineTo(cx + side * rx * 0.7 + Math.cos(an) * r, cy - ry * 0.1 + Math.sin(an) * r); } stroke(ctx, 3, c); } ctx.globalAlpha = 1; break;
      case 'frost': for (const [px, py] of [[-0.75, -0.4], [0.7, -0.2], [-0.6, 0.5], [0.8, 0.5]]) Art.sparkle(ctx, cx + px * rx, cy + py * ry, 10 * k + 4, c, 0.9); break;
      case 'hearts': for (const [px, py, cc] of [[-0.75, -0.4, '#ff7eb6'], [0.75, -0.3, '#7ec0ff'], [-0.65, 0.5, '#ffd23f'], [0.7, 0.55, '#41d982']]) Art.heart(ctx, cx + px * rx, cy + py * ry + 6, 22 * k + 6, cc); break;
    }
  }

  function wing(ctx, D, t, a) {
    const L = 95, H = 105;
    if (D.wing === 'feather') {
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) {
        const an = -0.95 + i * 0.32 + row * 0.12, len = (L - row * 22) * (1 - i * 0.07);
        ctx.save(); ctx.rotate(an);
        const fp = () => { ctx.beginPath(); ctx.ellipse(len * 0.55, 0, len * 0.55, 13 - row * 2, 0, 0, TAU); };
        cel(ctx, fp, row === 2 ? D.wingMem : D.wingColor, mix(D.wingColor, '#7aa0d0', 0.5), null, 2.5, 4);
        ctx.restore();
      }
      return;
    }
    if (D.wing === 'leaf') {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate(-0.9 + i * 0.4);
        const lp = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -26, L * (1 - i * 0.12), 0); ctx.quadraticCurveTo(L * 0.5, 26, 0, 0); ctx.closePath(); };
        cel(ctx, lp, i === 1 ? D.wingMem : D.wingColor, D.shade, null, 3, 5);
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L * (0.95 - i * 0.12), 0); stroke(ctx, 2, D.shade);
        ctx.restore();
      }
      return;
    }
    if (D.wing === 'fin') {
      const fp = () => { ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(10, -H * 0.9, L * 0.95, -H * 0.55); ctx.quadraticCurveTo(L * 0.8, -10, L * 0.7, 18); ctx.quadraticCurveTo(L * 0.3, 6, 0, 16); ctx.closePath(); };
      ctx.save(); ctx.globalAlpha = 0.9; cel(ctx, fp, D.wingMem, D.wingColor, null, 3.5, 8); ctx.restore();
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(L * (0.25 + i * 0.17), -H * (0.75 - i * 0.12)); stroke(ctx, 2.5, D.wingColor); }
      return;
    }
    // перепончатое крыло дракона
    const tips = [[L * 0.3, -H], [L * 0.85, -H * 0.72], [L * 1.05, -H * 0.25], [L * 0.75, H * 0.05]];
    const mp = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tips[0][0], tips[0][1]);
      for (let i = 1; i < tips.length; i++) { const p = tips[i - 1], q = tips[i]; ctx.quadraticCurveTo((p[0] + q[0]) / 2 - 8, (p[1] + q[1]) / 2 + 14, q[0], q[1]); }
      ctx.quadraticCurveTo(L * 0.35, 10, 0, 18); ctx.closePath(); };
    const g = ctx.createLinearGradient(0, -H, L, 0); g.addColorStop(0, D.wingMem); g.addColorStop(1, mix(D.wingMem, D.wingColor, 0.6));
    mp(); ctx.fillStyle = g; ctx.fill(); stroke(ctx, 3.5);
    for (const tp of tips) { ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(tp[0] * 0.4, tp[1] * 0.6, tp[0], tp[1]); stroke(ctx, 5, LINE); ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(tp[0] * 0.4, tp[1] * 0.6, tp[0], tp[1]); stroke(ctx, 2.5, D.wingColor); }
    ctx.beginPath(); ctx.moveTo(tips[0][0], tips[0][1]); ctx.lineTo(tips[0][0] - 4, tips[0][1] - 10); stroke(ctx, 4, D.horn);
  }

  function crest(ctx, D, hR, t, a, layer) {
    const c = D.crest;
    if (layer === 'back') {
      if (c === 'spikes' || c === 'crystal') for (let i = -2; i <= 2; i++) {
        const big = c === 'crystal' ? 1.3 : 1;
        ctx.save(); ctx.translate(i * hR * 0.22, -hR * 0.88 + Math.abs(i) * 6); ctx.rotate(i * 0.3);
        const sp = () => { ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-3 * big, -(24 + 10 * a) * big + Math.abs(i) * 5); ctx.lineTo(3 * big, -(22 + 10 * a) * big + Math.abs(i) * 5); ctx.lineTo(9, 6); ctx.closePath(); };
        cel(ctx, sp, D.accent, D.accent2, null, 3, 4);
        if (c === 'crystal') { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(-1, -18); ctx.lineTo(1, 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; }
        ctx.restore();
      }
      if (c === 'fin') { const fp = () => { ctx.beginPath(); ctx.moveTo(-hR * 0.5, -hR * 0.7); ctx.quadraticCurveTo(0, -hR * 1.7 - 10 * a, hR * 0.5, -hR * 0.7); ctx.closePath(); }; cel(ctx, fp, D.accent, D.accent2, null, 3, 6);
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * hR * 0.18, -hR * 0.75); ctx.lineTo(i * hR * 0.12, -hR * 1.3); stroke(ctx, 2, D.accent2); } }
      if (c === 'flame') for (let i = -2; i <= 2; i++) {
        const fl = Math.sin(t * 9 + i * 1.7) * 6;
        ctx.save(); ctx.translate(i * hR * 0.2, -hR * 0.8);
        const fp = () => { ctx.beginPath(); ctx.moveTo(-12, 8); ctx.quadraticCurveTo(-14 + fl * 0.3, -20, fl * 0.5, -(38 + 12 * a) + Math.abs(i) * 8); ctx.quadraticCurveTo(14, -18, 12, 8); ctx.closePath(); };
        cel(ctx, fp, '#ffb23a', '#ff5a1a', '#fff27a', 2.5, 5); ctx.restore();
      }
      if (c === 'feather') for (let i = -1; i <= 1; i++) { ctx.save(); ctx.translate(i * 12, -hR * 0.85); ctx.rotate(i * 0.4 + Math.sin(t * 3) * 0.05);
        cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -24 - 6 * a, 9, 26 + 6 * a, 0, 0, TAU); }, D.accent, D.accent2, null, 2.5, 4); ctx.restore(); }
      if (c === 'leaf') for (let i = -1; i <= 1; i++) { ctx.save(); ctx.translate(i * 16, -hR * 0.85); ctx.rotate(i * 0.5 + Math.sin(t * 2 + i) * 0.06);
        cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-18, -20, 0, -46 - 10 * a); ctx.quadraticCurveTo(18, -20, 0, 6); ctx.closePath(); }, '#5ad86a', '#2a8a3a', null, 2.5, 4);
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -40); stroke(ctx, 1.5, '#2a8a3a'); ctx.restore(); }
      if (c === 'mane') { const cols = ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'];
        cols.forEach((cc, i) => { ctx.save(); ctx.translate(-hR * 0.55 + i * hR * 0.22, -hR * 0.75); ctx.rotate(-0.6 + i * 0.25 + Math.sin(t * 3 + i) * 0.06);
          cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -18, 11, 26, 0, 0, TAU); }, cc, mix(cc, '#000000', 0.25), null, 2.5, 4); ctx.restore(); }); }
    } else {
      if (c === 'mane') { // рог-звёздочка
        cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-8, -hR * 0.82); ctx.lineTo(0, -hR * 1.35 - 16 * a); ctx.lineTo(8, -hR * 0.82); ctx.closePath(); }, D.horn, '#e0a020', null, 3, 3);
      }
      if (c === 'leaf') { ctx.save(); ctx.translate(hR * 0.55, -hR * 0.7); Art.flower(ctx, 0, 0, 11, '#ff7eb6', t); ctx.restore(); }
    }
  }
  Art.flower = function (ctx, x, y, r, c, t) {
    for (let i = 0; i < 5; i++) { const an = i * TAU / 5 + (t || 0) * 0.3; ell(ctx, x + Math.cos(an) * r * 0.7, y + Math.sin(an) * r * 0.7, r * 0.6, r * 0.6, c); }
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = i * TAU / 5 + (t || 0) * 0.3; ctx.moveTo(x + Math.cos(an) * r * 1.3, y + Math.sin(an) * r * 1.3); ctx.arc(x + Math.cos(an) * r * 0.7, y + Math.sin(an) * r * 0.7, r * 0.6, an, an + 0.01); }
    ell(ctx, x, y, r * 0.42, r * 0.42, '#ffe14a'); stroke(ctx, 1.5);
  };

  function tailTip(ctx, D, x, y, t, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2.4) * 0.25);
    const k = 1 + a * 0.4;
    switch (D.tail) {
      case 'star':
        ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.15; ell(ctx, 0, 0, 40 * k, 40 * k); ctx.fillStyle = rg(ctx, 0, 0, 40 * k, 'rgba(255,230,120,1)', 'rgba(255,230,120,0)', 0, 0); ctx.fill(); ctx.restore();
        Art.roundStar(ctx, 0, 0, 22 * k, '#ffd23f', LINE); ell(ctx, -5, -6, 5, 3.5, 'rgba(255,255,255,0.8)'); break;
      case 'fin': cel(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -40 * k, 34 * k, -36 * k); ctx.quadraticCurveTo(20, -8, 40 * k, 14); ctx.quadraticCurveTo(14, 12, 0, 0); ctx.closePath(); }, D.accent, D.accent2, null, 3, 5); break;
      case 'flame': { const fl = Math.sin(t * 10) * 5; cel(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, 8); ctx.quadraticCurveTo(-16, -22, fl, -46 * k); ctx.quadraticCurveTo(18, -20, 14, 8); ctx.quadraticCurveTo(0, 16, -14, 8); ctx.closePath(); }, '#ffb23a', '#ff4d1a', '#fff27a', 3, 6);
        ell(ctx, 0, -6, 6, 10, '#fff6b0'); break; }
      case 'cloud': for (const [cx, cy, r] of [[-12, 0, 13], [6, -8, 16], [18, 6, 12], [0, 8, 12]]) { ell(ctx, cx, cy, r * k, r * k, '#ffffff'); stroke(ctx, 3); }
        for (const [cx, cy, r] of [[-12, 0, 13], [6, -8, 16], [18, 6, 12], [0, 8, 12]]) ell(ctx, cx, cy, r * k - 2, r * k - 2, '#ffffff'); break;
      case 'snowflake': ctx.rotate(t * 0.5); for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -24 * k); ctx.moveTo(0, -14 * k); ctx.lineTo(-7, -20 * k); ctx.moveTo(0, -14 * k); ctx.lineTo(7, -20 * k); stroke(ctx, 6, LINE); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -24 * k); ctx.moveTo(0, -14 * k); ctx.lineTo(-7, -20 * k); ctx.moveTo(0, -14 * k); ctx.lineTo(7, -20 * k); stroke(ctx, 3, '#bff5ff'); ctx.restore(); } break;
      case 'rainbow': ['#ff5e9a', '#ffb23a', '#ffe14a', '#41d982', '#4fb7ff', '#b07cff'].forEach((c, i) => { ctx.save(); ctx.rotate(-0.8 + i * 0.3 + Math.sin(t * 4 + i) * 0.08); cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -22 * k, 7, 22 * k, 0, 0, TAU); }, c, mix(c, '#000000', 0.25), null, 2, 3); ctx.restore(); }); break;
      case 'flower': Art.flower(ctx, 0, 0, 16 * k, '#ff7eb6', t); break;
    }
    ctx.restore();
  }

  // ================== ЯЙЦО ==================
  Art.egg = function (ctx, x, y, s, pid, o) {
    o = o || {};
    const pd = PLANET_BY_ID[pid] || PLANETS[0], D = pd.dragon, t = o.t || 0;
    const crack = o.crack || 0;
    const wob = Math.sin(t * (2 + crack * 10)) * (0.03 + crack * 0.08) + (o.wob || 0) * 0.15;
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.25; ell(ctx, 0, 0, 70 * s, 13 * s, '#0a0520'); ctx.restore();
    ctx.scale(s, s); ctx.rotate(wob);
    ctx.save(); ctx.globalAlpha = 0.3 + crack * 0.4 + Math.sin(t * 4) * 0.1;
    ctx.fillStyle = rg(ctx, 0, -80, 140, mix(D.hi, '#ffffff', 0.4), 'rgba(255,255,255,0)', 0, 0); ell(ctx, 0, -80, 140, 140); ctx.fill(); ctx.restore();
    const ep = () => { ctx.beginPath(); ctx.moveTo(0, -165); ctx.bezierCurveTo(70, -165, 78, -40, 72, -30); ctx.bezierCurveTo(64, 2, 30, 4, 0, 4); ctx.bezierCurveTo(-30, 4, -64, 2, -72, -30); ctx.bezierCurveTo(-78, -40, -70, -165, 0, -165); ctx.closePath(); };
    cel(ctx, ep, mix(D.body, '#ffffff', 0.25), D.shade, '#ffffff', 5, 14);
    ctx.save(); ep(); ctx.clip();
    // узор: полосы и пятна в цветах дракона
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-90, -110 + i * 50); for (let k = 0; k <= 12; k++) ctx.lineTo(-90 + k * 15, -110 + i * 50 + (k % 2 ? -10 : 10)); ctx.lineTo(90, -96 + i * 50); for (let k = 12; k >= 0; k--) ctx.lineTo(-90 + k * 15, -96 + i * 50 + (k % 2 ? -10 : 10)); ctx.closePath(); ctx.fillStyle = D.accent; ctx.fill(); }
    for (const [px, py, r] of [[-30, -140, 9], [32, -128, 7], [-40, -40, 10], [36, -46, 12], [0, -20, 7]]) ell(ctx, px, py, r, r, D.patternColor || D.accent2);
    // трещины
    if (crack > 0.15) {
      const cr = [[0, -165], [-8, -140], [6, -122], [-6, -100], [10, -84]];
      const n = Math.min(cr.length, 1 + Math.floor(crack * 5));
      ctx.beginPath(); cr.slice(0, n).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); stroke(ctx, 4);
      if (crack > 0.55) { ctx.beginPath(); ctx.moveTo(-6, -100); ctx.lineTo(-30, -92); ctx.lineTo(-44, -104); ctx.moveTo(10, -84); ctx.lineTo(34, -90); ctx.lineTo(50, -78); stroke(ctx, 4); }
      if (crack > 0.8) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 12) * 0.3; ctx.beginPath(); cr.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); stroke(ctx, 3, '#fff6a8'); ctx.restore(); }
    }
    ctx.restore();
    Art.sparkle(ctx, -36, -130, 10, '#ffffff', 0.5 + Math.sin(t * 3) * 0.4);
    ctx.restore();
  };
})();
