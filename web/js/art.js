// Векторная графика: персонажи, вкусняшки, планеты, декорации, иконки
'use strict';
const Art = {};
(function () {
  const TAU = Math.PI * 2;

  // ---------- Примитивы ----------
  Art.starPath = function (ctx, x, y, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  };
  Art.roundStar = function (ctx, x, y, R, fill, stroke) {
    ctx.save(); ctx.lineJoin = 'round';
    Art.starPath(ctx, x, y, R, R * 0.5, 5);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = R * 0.18; ctx.strokeStyle = stroke; ctx.stroke(); }
    ctx.restore();
  };
  Art.heart = function (ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
    ctx.beginPath(); ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-14, -4, -10, -16, 0, -8);
    ctx.bezierCurveTo(10, -16, 14, -4, 0, 6);
    ctx.fillStyle = color || '#ff5e9a'; ctx.fill();
    ctx.restore();
  };
  Art.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  function ell(ctx, x, y, rx, ry, fill, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  Art.ell = ell;
  function outline(ctx, w, c) { ctx.lineWidth = w; ctx.strokeStyle = c || '#2a1650'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  Art.outline = outline;
  function rg(ctx, x, y, r, c0, c1, fx, fy) {
    const g = ctx.createRadialGradient(x + (fx || -0.3) * r, y + (fy || -0.35) * r, r * 0.1, x, y, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  }
  Art.rg = rg;
  // детерминированный ГСЧ
  Art.seeded = function (seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

  function spots(ctx, list) {
    for (const [x, y, rx, ry] of list) {
      ell(ctx, x, y, rx, ry, DC.spot);
      ell(ctx, x - rx * 0.25, y - ry * 0.3, rx * 0.45, ry * 0.4, DC.spotLight);
    }
  }
  // ---------- ДРАКОНЧИК (оригинальный персонаж) ----------
  // x,y — точка между лапками на земле. o: {t, level, blink, mouth, look, squash, flap, fire, happy}
  const DC = {
    body: '#24232e', bodyHi: '#4a4958', muzzle: '#3a3947', spot: '#8d8e9e', spotLight: '#a9aab8',
    belly: '#ffd6b0', bellyLine: '#f2b48a',
    horn: '#fff1c9', crest: '#9a9bab', crestDark: '#6d6e7e', wing: '#5a5a6c', wingDark: '#8d8e9e',
    eyeIris: '#6a4cff', cheek: '#ff8fbf', line: '#0f0d18', star: '#ffd23f',
  };
  Art.dragonColors = DC;
  Art.dragon = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0, lvl = o.level || 1;
    const sq = o.squash || 0; // >0 — сплющить, <0 — вытянуть
    const breathe = Math.sin(t * 2.2) * 0.02;
    ctx.save();
    ctx.translate(x, y);
    // тень
    ctx.save(); ctx.globalAlpha = 0.22; ell(ctx, 0, 0, 95 * s * (1 - (o.lift || 0) / 400), 16 * s, '#140a30'); ctx.restore();
    ctx.translate(0, -(o.lift || 0));
    ctx.scale(s * (1 + sq * 0.12 + breathe * 0.5), s * (1 - sq * 0.12 + breathe));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // сияние (уровень 3+)
    if (lvl >= 3 || o.glow) {
      const a = 0.35 + Math.sin(t * 3) * 0.12;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = rg(ctx, 0, -120, 190, 'rgba(255,240,150,0.9)', 'rgba(255,200,255,0)', 0, 0);
      ell(ctx, 0, -120, 190, 190); ctx.fill();
      ctx.restore();
    }

    // хвост со звёздочкой
    const sway = Math.sin(t * 2.5) * 12;
    ctx.beginPath();
    ctx.moveTo(40, -40);
    ctx.quadraticCurveTo(120, -20 + sway * 0.3, 135 + sway * 0.4, -70 + sway);
    ctx.lineWidth = 34; ctx.strokeStyle = DC.line; ctx.stroke();
    ctx.lineWidth = 26; ctx.strokeStyle = DC.body; ctx.stroke();
    spots(ctx, [[70, -34 + sway * 0.1, 7, 5], [104, -40 + sway * 0.3, 6, 5], [126 + sway * 0.3, -58 + sway * 0.7, 5, 4]]);
    // шипики на хвосте
    for (let i = 0; i < 2; i++) {
      const px = 85 + i * 28, py = -38 + sway * 0.25 * i - i * 10;
      ctx.beginPath(); ctx.moveTo(px - 9, py - 8); ctx.lineTo(px + 2, py - 24); ctx.lineTo(px + 9, py - 6); ctx.closePath();
      ctx.fillStyle = DC.crest; ctx.fill(); outline(ctx, 3, DC.line);
    }
    const sx = 140 + sway * 0.4, sy = -82 + sway;
    if (lvl >= 6) { // хвостик-магнит: звёздочка сияет
      ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(t * 5) * 0.2;
      ell(ctx, sx, sy, 44, 44); ctx.fillStyle = rg(ctx, sx, sy, 44, 'rgba(255,230,120,1)', 'rgba(255,230,120,0)', 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(t * 2.5) * 0.3);
    Art.roundStar(ctx, 0, 0, 26, DC.star, DC.line);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, -6, -7, 6, 4); ctx.fill();
    ctx.restore();

    // крылья
    const wingScale = lvl >= 2 ? 1.3 + Math.min(lvl - 2, 6) * 0.06 : 0.8;
    const flap = o.flap != null ? o.flap : Math.sin(t * (o.flying ? 14 : 1.8)) * (o.flying ? 0.5 : 0.08);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 40, -120);
      ctx.rotate(side * (-0.35 + flap));
      ctx.scale(side * wingScale, wingScale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(40, -70, 95, -60);
      ctx.quadraticCurveTo(80, -35, 88, -20);
      ctx.quadraticCurveTo(66, -18, 66, 2);
      ctx.quadraticCurveTo(46, -6, 38, 14);
      ctx.quadraticCurveTo(20, 10, 0, 20);
      ctx.closePath();
      ctx.fillStyle = DC.wing; ctx.fill(); outline(ctx, 5, DC.line);
      ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(88, -20); ctx.moveTo(4, 8); ctx.lineTo(64, 0);
      ctx.lineWidth = 3; ctx.strokeStyle = DC.wingDark; ctx.stroke();
      spots(ctx, [[30, -24, 6, 5], [58, -36, 5, 4], [72, -8, 4, 4]]);
      ctx.restore();
    }

    // лапки
    for (const side of [-1, 1]) {
      ell(ctx, side * 38, -14, 30, 20, DC.body); outline(ctx, 5, DC.line);
      spots(ctx, [[side * 48, -22, 6, 4]]);
      for (let k = -1; k <= 1; k++) ell(ctx, side * 38 + k * 11, -5, 5.5, 5, DC.horn);
    }
    // тело
    ell(ctx, 0, -72, 72, 68); ctx.fillStyle = rg(ctx, 0, -72, 90, DC.bodyHi, DC.body); ctx.fill();
    ctx.save(); ctx.clip();
    spots(ctx, [[-58, -100, 11, 8], [-62, -62, 8, 6], [-50, -30, 10, 7], [58, -96, 9, 7], [62, -56, 12, 8], [50, -26, 7, 5]]);
    ctx.restore();
    ell(ctx, 0, -72, 72, 68); outline(ctx, 6, DC.line);
    // животик
    ell(ctx, 0, -62, 46, 50, DC.belly);
    ctx.lineWidth = 3; ctx.strokeStyle = DC.bellyLine;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -100 + i * 18, 36 - Math.abs(i - 1.5) * 4, 6, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
    // ручки
    const wave = o.wave ? Math.sin(t * 10) * 0.5 : 0;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 58, -88); ctx.rotate(side * (0.7 + (side === 1 ? wave : 0)));
      ell(ctx, 0, 14, 14, 24, DC.body); outline(ctx, 5, DC.line);
      ctx.restore();
    }

    // голова
    const look = o.look || 0, tilt = (o.tilt || 0) + Math.sin(t * 1.3) * 0.03;
    ctx.save();
    ctx.translate(0, -150); ctx.rotate(tilt);
    // гребешок
    for (let i = -1; i <= 1; i++) {
      ctx.save(); ctx.translate(i * 18, -58 + Math.abs(i) * 6); ctx.rotate(i * 0.35);
      ctx.beginPath(); ctx.moveTo(-12, 8); ctx.quadraticCurveTo(-4, -20, 0, -24); ctx.quadraticCurveTo(6, -18, 12, 8); ctx.closePath();
      ctx.fillStyle = DC.crest; ctx.fill(); outline(ctx, 4, DC.line);
      ctx.restore();
    }
    // рожки
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 30, -42); ctx.quadraticCurveTo(side * 48, -70, side * 56, -84);
      ctx.quadraticCurveTo(side * 58, -60, side * 50, -36); ctx.closePath();
      ctx.fillStyle = DC.horn; ctx.fill(); outline(ctx, 4, DC.line);
    }
    // ушки-плавнички (круглые, не заострённые)
    for (const side of [-1, 1]) {
      ell(ctx, side * 62, -6, 16, 11, DC.crest, side * 0.4); outline(ctx, 4, DC.line);
    }
    // голова-шарик
    ell(ctx, 0, 0, 66, 60); ctx.fillStyle = rg(ctx, 0, 0, 80, DC.bodyHi, DC.body); ctx.fill();
    ctx.save(); ctx.clip();
    spots(ctx, [[-20, -46, 10, 7], [6, -52, 7, 5], [30, -40, 12, 8], [-54, -18, 7, 9], [56, -10, 8, 10], [-44, 40, 6, 5]]);
    ctx.restore();
    ell(ctx, 0, 0, 66, 60); outline(ctx, 6, DC.line);
    // мордочка
    ell(ctx, 0, 26, 40, 26, DC.muzzle);
    // щёчки
    ctx.save(); ctx.globalAlpha = 0.65; ell(ctx, -42, 20, 13, 8, DC.cheek); ell(ctx, 42, 20, 13, 8, DC.cheek); ctx.restore();
    // глаза
    const bl = o.blink || 0;
    for (const side of [-1, 1]) {
      const ex = side * 25, ey = -8;
      ctx.save(); ctx.translate(ex, ey); ctx.scale(1, Math.max(0.08, 1 - bl));
      if (o.happy && bl < 0.5) {
        ctx.beginPath(); ctx.arc(0, 6, 15, Math.PI * 1.1, Math.PI * 1.9); outline(ctx, 6, DC.line);
      } else {
        ell(ctx, 0, 0, 20, 24, '#ffffff'); outline(ctx, 4, DC.line);
        ell(ctx, look * 6, 3, 14, 17, DC.eyeIris);
        ell(ctx, look * 6, 5, 8, 10, '#120a2e');
        ell(ctx, look * 6 - 5, -4, 6, 7, '#ffffff');
        ell(ctx, look * 6 + 5, 9, 3, 3, '#ffffff');
      }
      ctx.restore();
    }
    // ноздри
    ell(ctx, -8, 20, 3, 2.5, DC.line); ell(ctx, 8, 20, 3, 2.5, DC.line);
    // рот
    const m = o.mouth || 0;
    if (m > 0.05) {
      ell(ctx, 0, 36, 14 + m * 4, 4 + m * 12, '#5a1440'); ctx.lineWidth = 3; ctx.strokeStyle = DC.line; ctx.stroke();
      ell(ctx, 0, 40 + m * 5, 8, 3 + m * 4, '#ff7aa8');
    } else {
      ctx.beginPath(); ctx.moveTo(-14, 33); ctx.quadraticCurveTo(0, 44, 14, 33); outline(ctx, 4, DC.line);
      // зубик
      ctx.beginPath(); ctx.moveTo(4, 37); ctx.lineTo(7, 44); ctx.lineTo(10, 36); ctx.fillStyle = '#fff'; ctx.fill();
    }
    ctx.restore();

    if (lvl >= 10) { // Звёздный дракон: звёздочки кружат над головой
      for (let i = 0; i < 5; i++) {
        const a = t * 1.2 + i * TAU / 5;
        Art.roundStar(ctx, Math.cos(a) * 80, -232 + Math.sin(a) * 16, 11, '#ffd23f', DC.line);
      }
    }
    // волшебный огонь (уровень 4+)
    if (o.fire > 0) {
      const f = o.fire;
      ctx.save(); ctx.translate(0, -112);
      for (let i = 0; i < 9; i++) {
        const k = i / 8, wob = Math.sin(t * 30 + i) * 6;
        const px = 30 + k * 190 * f, py = wob + 10 - k * 30, r = (14 + k * 28) * f;
        ctx.globalAlpha = 0.85 - k * 0.5;
        ell(ctx, px, py, r, r * 0.8, ['#fff6b0', '#ffd23f', '#ff9a3c', '#ff6ab0', '#b98bff'][Math.min(4, (k * 5) | 0)]);
      }
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------- КОСМОНАВТ ----------
  Art.astronaut = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.globalAlpha = 0.22; ell(ctx, 0, 0, 44 * s, 9 * s, '#140a30'); ctx.restore();
    ctx.translate(0, -(o.lift || 0));
    const bob = o.walk ? Math.abs(Math.sin(t * 10)) * 4 : Math.sin(t * 2) * 1.5;
    ctx.scale(s, s); ctx.translate(0, -bob);
    if (o.flip) ctx.scale(-1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = '#2b2350', W = '#fbfbff', W2 = '#dfe3f2', OR = '#ff8a2a';
    // рюкзак
    Art.rr(ctx, -34, -96, 22, 50, 8); ctx.fillStyle = W2; ctx.fill(); outline(ctx, 4, L);
    // ножки
    const st = o.walk ? Math.sin(t * 10) * 6 : 0;
    for (const side of [-1, 1]) {
      Art.rr(ctx, side * 12 - 9 + (side * st), -40, 18, 30, 7); ctx.fillStyle = W; ctx.fill(); outline(ctx, 4, L);
      Art.rr(ctx, side * 12 - 11 + (side * st), -16, 22, 16, 7); ctx.fillStyle = '#8a8fa8'; ctx.fill(); outline(ctx, 4, L);
    }
    // тело
    Art.rr(ctx, -26, -88, 52, 54, 18); ctx.fillStyle = W; ctx.fill(); outline(ctx, 4, L);
    ctx.fillStyle = OR; ctx.fillRect(-25, -46, 50, 7);
    Art.rr(ctx, -13, -78, 26, 20, 5); ctx.fillStyle = '#d9def0'; ctx.fill(); outline(ctx, 3, L);
    ell(ctx, -6, -68, 3.5, 3.5, '#ff4f6d'); ell(ctx, 3, -68, 3.5, 3.5, '#41d982'); ell(ctx, 7, -62, 2.5, 2.5, '#3fa9ff');
    // ручки
    const wave = o.wave ? Math.sin(t * 9) * 0.6 - 1.6 : 0.25;
    ctx.save(); ctx.translate(-24, -80); ctx.rotate(0.3);
    Art.rr(ctx, -8, 0, 16, 34, 8); ctx.fillStyle = W; ctx.fill(); outline(ctx, 4, L);
    ell(ctx, 0, 36, 9, 8, '#8a8fa8'); outline(ctx, 3, L); ctx.restore();
    ctx.save(); ctx.translate(24, -80); ctx.rotate(-wave);
    Art.rr(ctx, -8, 0, 16, 34, 8); ctx.fillStyle = W; ctx.fill(); outline(ctx, 4, L);
    ell(ctx, 0, 36, 9, 8, '#8a8fa8'); outline(ctx, 3, L);
    if (o.holding != null) Art.treat(ctx, o.holding, 0, 50, 0.5);
    ctx.restore();
    // шлем
    ell(ctx, 0, -116, 36, 34, W); outline(ctx, 4, L);
    ell(ctx, 2, -114, 26, 22); const vg = ctx.createLinearGradient(-20, -136, 20, -94);
    vg.addColorStop(0, '#3d4f9a'); vg.addColorStop(1, '#141a40'); ctx.fillStyle = vg; ctx.fill(); outline(ctx, 3, L);
    ctx.save(); ctx.globalAlpha = 0.85; ell(ctx, -8, -124, 9, 5, '#ffffff', -0.5); ell(ctx, 12, -104, 3, 3, '#ffffff'); ctx.restore();
    // глазки за стеклом
    if (!o.noFace) { ctx.save(); ctx.globalAlpha = 0.9; ell(ctx, -3, -114, 3, 4, '#ffe9a8'); ell(ctx, 10, -114, 3, 4, '#ffe9a8'); ctx.restore(); }
    ell(ctx, 0, -150, 4, 4, OR); ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(0, -146); outline(ctx, 3, L);
    ctx.restore();
  };

  // ---------- РАКЕТА (по мотивам игрушки) ----------
  Art.rocket = function (ctx, x, y, s, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = '#2b2350', W = '#fbfbff', W2 = '#e3e6f3', OR = '#ff7a1a', OR2 = '#ffb23a';
    // пламя
    if (o.flame) {
      const f = o.flame;
      for (const bx of [-52, 0, 52]) {
        const len = (bx === 0 ? 120 : 80) * f * (0.85 + Math.sin(t * 40 + bx) * 0.15);
        ctx.beginPath(); ctx.moveTo(bx - 14, 0); ctx.quadraticCurveTo(bx, len * 1.2, bx + 14, 0); ctx.closePath();
        ctx.fillStyle = 'rgba(255,90,60,0.85)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx - 8, 0); ctx.quadraticCurveTo(bx, len * 0.75, bx + 8, 0); ctx.closePath();
        ctx.fillStyle = '#fff3a0'; ctx.fill();
      }
    }
    // задние ускорители
    function booster(bx, h, shade) {
      ctx.beginPath(); ctx.moveTo(bx - 12, -14); ctx.lineTo(bx - 17, 6); ctx.lineTo(bx + 17, 6); ctx.lineTo(bx + 12, -14); ctx.closePath();
      ctx.fillStyle = OR2; ctx.fill(); outline(ctx, 3, L);
      Art.rr(ctx, bx - 17, -h, 34, h - 12, 6); ctx.fillStyle = shade; ctx.fill(); outline(ctx, 4, L);
      ctx.beginPath(); ctx.moveTo(bx - 17, -h + 2); ctx.quadraticCurveTo(bx, -h - 60, bx + 17, -h + 2); ctx.closePath();
      ctx.fillStyle = shade; ctx.fill(); outline(ctx, 4, L);
      ctx.fillStyle = L; ctx.fillRect(bx - 16, -h + 20, 32, 6); ctx.fillRect(bx - 16, -40, 32, 5);
    }
    booster(-30, 160, W2); booster(30, 160, W2);
    // основная ступень
    ctx.beginPath(); ctx.moveTo(-16, -30); ctx.lineTo(-22, -6); ctx.lineTo(22, -6); ctx.lineTo(16, -30); ctx.closePath();
    ctx.fillStyle = OR2; ctx.fill(); outline(ctx, 3, L);
    Art.rr(ctx, -30, -250, 60, 222, 10); ctx.fillStyle = W; ctx.fill(); outline(ctx, 5, L);
    // полосы
    ctx.fillStyle = OR; ctx.fillRect(-29, -250, 58, 8);
    ctx.save(); ctx.beginPath(); ctx.rect(-29, -150, 58, 28); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(-29, -150, 58, 28); ctx.fillStyle = L;
    for (let i = -4; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 14, -150); ctx.lineTo(i * 14 + 7, -150); ctx.lineTo(i * 14 + 35, -122); ctx.lineTo(i * 14 + 28, -122); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.strokeRect(-29, -150, 58, 28);
    // буква-эмблема
    ctx.fillStyle = OR; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', 0, -175);
    // верхняя ступень (шире)
    Art.rr(ctx, -36, -360, 72, 116, 14); ctx.fillStyle = W; ctx.fill(); outline(ctx, 5, L);
    ctx.fillStyle = OR; ctx.fillRect(-35, -258, 70, 8);
    // иллюминатор
    ell(ctx, 0, -320, 21, 21, OR); outline(ctx, 4, L);
    ell(ctx, 0, -320, 14, 14, '#1a1f4a');
    if (o.pilot) { ell(ctx, 0, -318, 9, 9, '#fbfbff'); ell(ctx, 1, -317, 6, 5, '#2d3c84'); }
    ctx.save(); ctx.globalAlpha = 0.8; ell(ctx, -5, -325, 4, 3, '#fff'); ctx.restore();
    // носовой обтекатель
    ctx.beginPath(); ctx.moveTo(-36, -356); ctx.bezierCurveTo(-34, -400, -12, -428, 0, -436);
    ctx.bezierCurveTo(12, -428, 34, -400, 36, -356); ctx.closePath();
    ctx.fillStyle = W; ctx.fill(); outline(ctx, 5, L);
    ctx.beginPath(); ctx.moveTo(-14, -420); ctx.quadraticCurveTo(0, -446, 14, -420); ctx.quadraticCurveTo(0, -414, -14, -420); ctx.closePath();
    ctx.fillStyle = OR; ctx.fill(); outline(ctx, 4, L);
    // передние ускорители
    booster(-52, 140, W); booster(52, 140, W);
    // огоньки снизу
    if (o.glowBase) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 6) * 0.1; ell(ctx, 0, 4, 90, 18, '#ff3b3b'); ctx.restore(); }
    ctx.restore();
  };

  // ---------- ВКУСНЯШКИ ----------
  // 0 капкейк, 1 печенька, 2 конфета, 3 пончик, 4 звёздный леденец
  Art.TREAT_COLORS = ['#ff7eb6', '#e2a35c', '#4fb7ff', '#b07cff', '#ffd23f', '#e8233f'];
  Art.treat = function (ctx, type, x, y, s, t) {
    if (type === 5) return Art.strawberry(ctx, x, y, s);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = '#3a1f4a';
    switch (type) {
      case 0: { // капкейк
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-22, 34); ctx.lineTo(22, 34); ctx.lineTo(30, 0); ctx.closePath();
        ctx.fillStyle = '#ffb35c'; ctx.fill(); outline(ctx, 4, L);
        ctx.strokeStyle = '#e08a2c'; ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 10, 3); ctx.lineTo(i * 8, 32); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-34, 2); ctx.quadraticCurveTo(-40, -16, -22, -20); ctx.quadraticCurveTo(-20, -38, 0, -36);
        ctx.quadraticCurveTo(20, -38, 22, -20); ctx.quadraticCurveTo(40, -16, 34, 2); ctx.closePath();
        ctx.fillStyle = rg(ctx, 0, -14, 40, '#ffc2dc', '#ff6fae'); ctx.fill(); outline(ctx, 4, L);
        ell(ctx, 0, -40, 9, 9, '#ff3b5c'); outline(ctx, 3, L);
        ell(ctx, -3, -43, 3, 2, '#fff');
        const sp = ['#fff', '#7ee8ff', '#ffe14a', '#8dff9a'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = sp[i % 4]; ctx.fillRect(-22 + i * 8, -18 + (i % 2) * 8, 5, 3); }
        break;
      }
      case 1: { // печенька
        ell(ctx, 0, 0, 34, 34); ctx.fillStyle = rg(ctx, 0, 0, 40, '#f6c98a', '#d4914a'); ctx.fill(); outline(ctx, 4, L);
        const pts = [[-14, -12], [10, -16], [16, 6], [-6, 4], [-16, 14], [4, 20], [-2, -24]];
        for (const p of pts) ell(ctx, p[0], p[1], 5, 4.5, '#5a321c');
        break;
      }
      case 2: { // конфета в фантике
        for (const side of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(side * 20, 0); ctx.lineTo(side * 42, -18); ctx.quadraticCurveTo(side * 36, 0, side * 42, 18); ctx.closePath();
          ctx.fillStyle = '#9ad8ff'; ctx.fill(); outline(ctx, 4, L);
        }
        ell(ctx, 0, 0, 26, 24); ctx.fillStyle = rg(ctx, 0, 0, 30, '#a8e2ff', '#2f8fff'); ctx.fill(); outline(ctx, 4, L);
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 24, 22, 0, 0, TAU); ctx.clip();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14 - 10, -26); ctx.lineTo(i * 14 + 10, 26); ctx.stroke(); }
        ctx.restore();
        break;
      }
      case 3: { // пончик
        ell(ctx, 0, 0, 34, 30, '#e8a25a'); outline(ctx, 4, L);
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const k = Math.sin(a) > 0 ? (i % 2 ? 0.86 : 0.95) : 0.92; ctx.lineTo(Math.cos(a) * 31 * k, Math.sin(a) * 27 * k - 3); }
        ctx.closePath(); ctx.fillStyle = '#c38bff'; ctx.fill();
        ell(ctx, 0, -2, 11, 9, '#5a2b7a'); outline(ctx, 3, L);
        const sp = ['#fff', '#7ee8ff', '#ffe14a', '#ff7eb6'];
        for (let i = 0; i < 10; i++) { const a = i * 0.63; ctx.save(); ctx.translate(Math.cos(a) * 20, Math.sin(a) * 16 - 2); ctx.rotate(a * 2); ctx.fillStyle = sp[i % 4]; ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
        break;
      }
      case 4: { // звёздный леденец
        ctx.fillStyle = '#fff'; Art.rr(ctx, -4, 6, 8, 40, 4); ctx.fill(); outline(ctx, 3, L);
        ctx.save(); ctx.rotate(Math.sin((t || 0) * 3) * 0.15);
        Art.roundStar(ctx, 0, -6, 36, '#ffd23f', L);
        ctx.fillStyle = '#ffef9e'; Art.starPath(ctx, 0, -6, 20, 10, 5); ctx.fill();
        ctx.restore();
        break;
      }
    }
    ctx.restore();
  };

  // клубничка (6-й вид вкусняшек)
  Art.strawberry = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 34); ctx.bezierCurveTo(-40, 10, -34, -26, 0, -20); ctx.bezierCurveTo(34, -26, 40, 10, 0, 34); ctx.closePath();
    ctx.fillStyle = rg(ctx, 0, 0, 40, '#ff8fa0', '#e8233f'); ctx.fill(); outline(ctx, 4, '#3a1f4a');
    for (const [sx, sy] of [[-12, -6], [8, -8], [-2, 6], [14, 6], [-14, 10], [2, 20]]) ell(ctx, sx, sy, 2.5, 3.5, '#fff3a0');
    for (let i = -2; i <= 2; i++) { ctx.save(); ctx.translate(i * 7, -22); ctx.rotate(i * 0.5); ell(ctx, 0, -6, 5, 10, '#41d982'); outline(ctx, 2.5, '#3a1f4a'); ctx.restore(); }
    ctx.restore();
  };

  // Космо-зайчик (житель планеты для игры «Космо-зайчики»). x,y — низ.
  Art.bunny = function (ctx, x, y, s, t, mood) {
    const L = '#3a1f4a';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wob = Math.sin((t || 0) * 6) * 0.08;
    for (const side of [-1, 1]) { // ушки со звёздочками
      ctx.save(); ctx.translate(side * 24, -110); ctx.rotate(side * (0.25 + wob));
      ell(ctx, 0, -36, 15, 40, '#e9fff8'); outline(ctx, 5, L); ell(ctx, 0, -34, 7, 28, '#ffb3d0');
      Art.roundStar(ctx, 0, -84, 11, '#ffd23f', L);
      ctx.restore();
    }
    ell(ctx, 0, -60, 62, 60); ctx.fillStyle = rg(ctx, 0, -60, 70, '#ffffff', '#bff5e6'); ctx.fill(); outline(ctx, 6, L);
    ctx.save(); ctx.globalAlpha = 0.6; ell(ctx, -36, -48, 11, 7, '#ff8fbf'); ell(ctx, 36, -48, 11, 7, '#ff8fbf'); ctx.restore();
    if (mood === 1) { // поймали — довольные глазки
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 20, -66, 10, Math.PI * 1.1, Math.PI * 1.9); outline(ctx, 5, L); }
    } else {
      for (const side of [-1, 1]) { ell(ctx, side * 20, -68, 11, 14, '#1d1240'); ell(ctx, side * 20 - 4, -73, 4, 5, '#fff'); }
    }
    ell(ctx, 0, -50, 5, 4, '#ff6f91');
    ctx.beginPath(); ctx.moveTo(-8, -42); ctx.quadraticCurveTo(0, -34, 8, -42); outline(ctx, 3, L);
    ctx.restore();
  };

  // ---------- ФОНЫ ----------
  Art.sky = function (ctx, c0, c1, c2) {
    const v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1);
    g.addColorStop(0, c0); g.addColorStop(0.6, c1); g.addColorStop(1, c2 || c1);
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  };
  const starCache = {};
  Art.stars = function (ctx, seed, n, t, yMax) {
    const v = G.view;
    if (!starCache[seed]) {
      const r = Art.seeded(seed), arr = [];
      for (let i = 0; i < n; i++) arr.push({ x: r() * 1.5 - 0.25, y: r() * 1.5 - 0.25, s: 1 + r() * 2.6, p: r() * 6, k: r() < 0.12 });
      starCache[seed] = arr;
    }
    for (const s of starCache[seed]) {
      const x = s.x * G.W, y = s.y * G.H;
      if (x < v.x0 || x > v.x1 || y < v.y0 || y > (yMax || v.y1)) continue;
      const a = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.2 + s.p));
      ctx.globalAlpha = a; ctx.fillStyle = '#fff';
      if (s.k) { Art.starPath(ctx, x, y, s.s * 3, s.s * 1.1, 4); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, y, s.s, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };
  Art.planet = function (ctx, x, y, r, c0, c1, ring, t) {
    ctx.save();
    if (ring) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.45, 0, Math.PI, TAU); ctx.lineWidth = r * 0.14; ctx.strokeStyle = ring; ctx.stroke(); ctx.restore(); }
    ell(ctx, x, y, r, r); ctx.fillStyle = rg(ctx, x, y, r * 1.1, c0, c1); ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
    ell(ctx, x - r * 0.3, y - r * 0.1, r * 0.5, r * 0.12); ctx.fill(); ell(ctx, x + r * 0.2, y + r * 0.35, r * 0.6, r * 0.1); ctx.fill();
    ctx.restore();
    if (ring) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.45, 0, 0, Math.PI); ctx.lineWidth = r * 0.14; ctx.strokeStyle = ring; ctx.stroke(); ctx.restore(); }
    ctx.restore();
  };
  // холмы планеты Ням-Ням
  Art.ground = function (ctx, y, t, palette) {
    const v = G.view, p = palette || ['#62d8c4', '#3fb8a9', '#2a8f8a'];
    const layers = [[y - 40, p[0], 0.004, 50], [y, p[1], 0.006, 30], [y + 60, p[2], 0.009, 20]];
    for (const [yy, c, f, a] of layers) {
      ctx.beginPath(); ctx.moveTo(v.x0, v.y1);
      for (let x = v.x0; x <= v.x1 + 20; x += 20) ctx.lineTo(x, yy + Math.sin(x * f + yy) * a);
      ctx.lineTo(v.x1, v.y1); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    }
  };
  Art.bush = function (ctx, x, y, s, color, t) {
    const c = color || '#ff7eb6';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const w = Math.sin((t || 0) * 2 + x) * 2;
    const puffs = [[-34, -22, 26], [0, -40, 32], [34, -22, 26], [-16, -14, 24], [18, -12, 24]];
    for (const p of puffs) { ell(ctx, p[0] + w, p[1], p[2] + 4, p[2] + 4, '#3a1f4a'); }
    for (const p of puffs) { ell(ctx, p[0] + w, p[1], p[2], p[2]); ctx.fillStyle = rg(ctx, p[0] + w, p[1], p[2] * 1.2, '#ffffff55', c); ctx.fill(); ell(ctx, p[0] + w, p[1], p[2], p[2], c); ctx.globalAlpha = 0.3; ell(ctx, p[0] + w - p[2] * 0.3, p[1] - p[2] * 0.3, p[2] * 0.4, p[2] * 0.3, '#fff'); ctx.globalAlpha = 1; }
    for (let i = 0; i < 4; i++) ell(ctx, -26 + i * 18 + w, -30 + (i % 2) * 14, 4, 4, '#fff6a8');
    ctx.restore();
  };
  Art.rock = function (ctx, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(-52, -40, -20, -52); ctx.quadraticCurveTo(10, -66, 36, -44); ctx.quadraticCurveTo(56, -24, 50, 0); ctx.closePath();
    ctx.fillStyle = rg(ctx, 0, -30, 60, '#c6b6ff', c || '#7d68c8'); ctx.fill(); outline(ctx, 5, '#3a1f4a');
    ell(ctx, -12, -30, 8, 6, '#00000022'); ell(ctx, 18, -18, 6, 5, '#00000022');
    ctx.restore();
  };
  Art.mushroom = function (ctx, x, y, s, c, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin((t || 0) * 2 + x) * 0.1; ell(ctx, 0, -50, 60, 50, c || '#7ee8ff'); ctx.restore();
    Art.rr(ctx, -12, -50, 24, 50, 10); ctx.fillStyle = '#fff4e0'; ctx.fill(); outline(ctx, 4, '#3a1f4a');
    ctx.beginPath(); ctx.moveTo(-44, -44); ctx.quadraticCurveTo(-40, -92, 0, -94); ctx.quadraticCurveTo(40, -92, 44, -44); ctx.closePath();
    ctx.fillStyle = c || '#7ee8ff'; ctx.fill(); outline(ctx, 4, '#3a1f4a');
    ell(ctx, -18, -66, 7, 6, '#fff'); ell(ctx, 12, -76, 6, 5, '#fff'); ell(ctx, 22, -56, 5, 4, '#fff');
    ctx.restore();
  };
  Art.crystal = function (ctx, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const shards = [[-22, 0, -30, -60, 0.2], [0, 0, 0, -90, 0], [22, 0, 28, -56, -0.2]];
    for (const [bx, by, tx, ty] of shards) {
      ctx.beginPath(); ctx.moveTo(bx - 14, by); ctx.lineTo(tx - 10, ty + 14); ctx.lineTo(tx, ty); ctx.lineTo(tx + 10, ty + 14); ctx.lineTo(bx + 14, by); ctx.closePath();
      ctx.fillStyle = c || '#ff9be0'; ctx.fill(); outline(ctx, 4, '#3a1f4a');
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.lineTo(tx - 3, ty + 14); ctx.lineTo(tx, ty + 4); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
  Art.crater = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ell(ctx, 0, 0, 60, 20, '#2a8f8a'); outline(ctx, 4, '#3a1f4a');
    ell(ctx, 0, 4, 44, 12, '#1f6f70');
    ctx.restore();
  };
  Art.chest = function (ctx, x, y, s, open, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const L = '#3a1f4a';
    if (open) {
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin((t || 0) * 6) * 0.2;
      ctx.fillStyle = rg(ctx, 0, -50, 90, 'rgba(255,240,120,1)', 'rgba(255,200,80,0)', 0, 0); ell(ctx, 0, -50, 90, 70); ctx.fill(); ctx.restore();
    }
    Art.rr(ctx, -48, -50, 96, 50, 8); ctx.fillStyle = '#c0703a'; ctx.fill(); outline(ctx, 5, L);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-48, -32, 96, 8); ctx.fillRect(-8, -50, 16, 50);
    if (open) {
      ctx.beginPath(); ctx.moveTo(-48, -50); ctx.lineTo(-40, -96); ctx.lineTo(40, -96); ctx.lineTo(48, -50); ctx.closePath();
      ctx.fillStyle = '#8a4a22'; ctx.fill(); outline(ctx, 5, L);
      for (let i = 0; i < 5; i++) Art.treat(ctx, i, -32 + i * 16, -56 - (i % 2) * 8, 0.32, t);
    } else {
      ctx.beginPath(); ctx.moveTo(-48, -50); ctx.quadraticCurveTo(0, -92, 48, -50); ctx.closePath();
      ctx.fillStyle = '#d98446'; ctx.fill(); outline(ctx, 5, L);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-8, -72, 16, 22);
      ell(ctx, 0, -42, 8, 8, '#ffd23f'); outline(ctx, 3, L);
    }
    ctx.restore();
  };
  Art.meteor = function (ctx, x, y, r, rot, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const rnd = Art.seeded(seed || 7);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rr = r * (0.82 + rnd() * 0.3); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath();
    ctx.fillStyle = rg(ctx, 0, 0, r * 1.2, '#b39a86', '#6b5246'); ctx.fill(); outline(ctx, 4, '#2b1a2a');
    for (let i = 0; i < 3; i++) { ell(ctx, (rnd() - 0.5) * r, (rnd() - 0.5) * r, r * 0.18, r * 0.15, '#5a4038'); }
    ctx.restore();
  };
  // Звёздный маяк
  Art.beacon = function (ctx, x, y, s, lit, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const L = '#3a1f4a';
    if (lit) {
      ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 2) * 0.1;
      const a = t * 0.8;
      for (const d of [0, Math.PI]) {
        ctx.beginPath(); ctx.moveTo(0, -150);
        ctx.lineTo(Math.cos(a + d - 0.15) * 700, -150 + Math.sin(a + d - 0.15) * 200);
        ctx.lineTo(Math.cos(a + d + 0.15) * 700, -150 + Math.sin(a + d + 0.15) * 200);
        ctx.closePath(); ctx.fillStyle = '#fff3a0'; ctx.fill();
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-22, -120); ctx.lineTo(22, -120); ctx.lineTo(34, 0); ctx.closePath();
    ctx.fillStyle = '#fbfbff'; ctx.fill(); outline(ctx, 5, L);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7eb6'; ctx.fillRect(-40, -40, 80, 18); ctx.fillRect(-40, -90, 80, 18); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-22, -120); ctx.lineTo(22, -120); ctx.lineTo(34, 0); ctx.closePath(); outline(ctx, 5, L);
    Art.rr(ctx, -26, -128, 52, 10, 4); ctx.fillStyle = '#8f6cf2'; ctx.fill(); outline(ctx, 4, L);
    Art.rr(ctx, -18, -168, 36, 40, 8); ctx.fillStyle = lit ? '#fff3a0' : '#4a4070'; ctx.fill(); outline(ctx, 4, L);
    ctx.beginPath(); ctx.moveTo(-24, -166); ctx.quadraticCurveTo(0, -200, 24, -166); ctx.closePath(); ctx.fillStyle = '#8f6cf2'; ctx.fill(); outline(ctx, 4, L);
    Art.roundStar(ctx, 0, -150, 13, lit ? '#ffd23f' : '#7a6aa0', L);
    ctx.restore();
  };

  // ---------- ИКОНКИ ДЛЯ КНОПОК ----------
  Art.icon = function (ctx, name, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = '#3a1f4a';
    switch (name) {
      case 'home':
        ctx.beginPath(); ctx.moveTo(-26, -2); ctx.lineTo(0, -26); ctx.lineTo(26, -2); ctx.lineTo(18, -2); ctx.lineTo(18, 24); ctx.lineTo(-18, 24); ctx.lineTo(-18, -2); ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 4, L);
        Art.rr(ctx, -6, 6, 12, 18, 3); ctx.fillStyle = '#ff7eb6'; ctx.fill(); break;
      case 'map':
        ctx.beginPath(); ctx.moveTo(-30, -22); ctx.lineTo(-10, -28); ctx.lineTo(10, -22); ctx.lineTo(30, -28); ctx.lineTo(30, 22); ctx.lineTo(10, 28); ctx.lineTo(-10, 22); ctx.lineTo(-30, 28); ctx.closePath();
        ctx.fillStyle = '#ffe9b0'; ctx.fill(); outline(ctx, 4, L);
        ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(-22, 16); ctx.quadraticCurveTo(-10, -14, 8, 4); ctx.lineWidth = 3; ctx.strokeStyle = '#c0703a'; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(22, -2); ctx.moveTo(22, -14); ctx.lineTo(10, -2); ctx.lineWidth = 6; ctx.strokeStyle = '#ff3b5c'; ctx.stroke(); break;
      case 'puzzle': {
        ctx.beginPath(); ctx.moveTo(-24, -24); ctx.lineTo(-6, -24); ctx.arc(0, -26, 8, Math.PI, 0); ctx.lineTo(24, -24); ctx.lineTo(24, -6);
        ctx.arc(26, 0, 8, -Math.PI / 2, Math.PI / 2); ctx.lineTo(24, 24); ctx.lineTo(-24, 24); ctx.closePath();
        ctx.fillStyle = '#7ee8ff'; ctx.fill(); outline(ctx, 4, L); break;
      }
      case 'match':
        Art.treat(ctx, 3, -18, 12, 0.42); Art.treat(ctx, 2, 18, 12, 0.42); Art.treat(ctx, 0, 0, -16, 0.42); break;
      case 'route':
        ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(-26, 22); ctx.bezierCurveTo(-10, -20, 10, 30, 24, -16); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.setLineDash([]);
        Art.meteor(ctx, -2, -14, 10, 0, 3);
        Art.planet(ctx, 24, -18, 11, '#ffd0f0', '#ff7eb6'); break;
      case 'feed': Art.treat(ctx, 0, 0, 4, 0.75); break;
      case 'music': case 'musicOff':
        ctx.fillStyle = '#fff';
        ell(ctx, -10, 16, 9, 7, '#fff'); outline(ctx, 3, L); ell(ctx, 14, 10, 9, 7, '#fff'); outline(ctx, 3, L);
        ctx.beginPath(); ctx.moveTo(-2, 16); ctx.lineTo(-2, -20); ctx.lineTo(22, -26); ctx.lineTo(22, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
        if (name === 'musicOff') { ctx.beginPath(); ctx.moveTo(-26, -26); ctx.lineTo(26, 26); ctx.lineWidth = 7; ctx.strokeStyle = '#ff3b5c'; ctx.stroke(); }
        break;
      case 'book':
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(-16, -26, -30, -20); ctx.lineTo(-30, 22); ctx.quadraticCurveTo(-16, 16, 0, 24); ctx.quadraticCurveTo(16, 16, 30, 22); ctx.lineTo(30, -20); ctx.quadraticCurveTo(16, -26, 0, -18); ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 4, L); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 24); outline(ctx, 3, L);
        Art.roundStar(ctx, -15, 0, 7, '#ffd23f'); Art.heart(ctx, 15, 2, 14, '#ff5e9a'); break;
      case 'next':
        ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(20, 0); ctx.lineTo(-14, 24); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 4, L); break;
      case 'replay':
        ctx.beginPath(); ctx.arc(0, 0, 20, -0.5, Math.PI * 1.5); ctx.lineWidth = 9; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -32); ctx.lineTo(18, -18); ctx.lineTo(0, -10); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); break;
      case 'update':
        ctx.beginPath(); ctx.arc(0, 0, 20, 0.3, Math.PI * 1.7); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
        Art.roundStar(ctx, 0, 0, 10, '#ffd23f'); break;
      case 'fire':
        ctx.beginPath(); ctx.moveTo(0, 28); ctx.bezierCurveTo(-30, 20, -24, -10, -8, -28); ctx.quadraticCurveTo(-6, -10, 4, -6); ctx.quadraticCurveTo(6, -22, 14, -26); ctx.bezierCurveTo(30, -4, 26, 22, 0, 28);
        ctx.fillStyle = '#ff9a3c'; ctx.fill(); outline(ctx, 4, L);
        ell(ctx, 0, 14, 9, 11, '#fff3a0'); break;
      case 'catch':
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        for (const lx of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(lx, -34); ctx.lineTo(lx, -20); ctx.stroke(); }
        Art.treat(ctx, 4, 0, -2, 0.42, t);
        ctx.beginPath(); ctx.moveTo(-26, 16); ctx.quadraticCurveTo(0, 40, 26, 16); ctx.lineWidth = 7; ctx.strokeStyle = '#3a1f4a'; ctx.stroke();
        break;
      case 'memory':
        ctx.save(); ctx.rotate(-0.2); Art.rr(ctx, -30, -24, 32, 44, 7); ctx.fillStyle = '#8f6cf2'; ctx.fill(); outline(ctx, 4, L);
        Art.roundStar(ctx, -14, -2, 9, '#ffd23f'); ctx.restore();
        ctx.save(); ctx.rotate(0.2); Art.rr(ctx, -2, -20, 32, 44, 7); ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 4, L);
        Art.heart(ctx, 14, 4, 20, '#ff5e9a'); ctx.restore();
        break;
      case 'wing':
        ctx.beginPath(); ctx.moveTo(-24, 18); ctx.quadraticCurveTo(-10, -30, 30, -26); ctx.quadraticCurveTo(20, -12, 26, -2);
        ctx.quadraticCurveTo(12, -2, 12, 10); ctx.quadraticCurveTo(0, 4, -6, 18); ctx.closePath();
        ctx.fillStyle = '#5a5a6c'; ctx.fill(); outline(ctx, 4, L);
        ell(ctx, 6, -12, 4, 3, '#a9aab8'); ell(ctx, 16, -4, 3, 3, '#a9aab8'); break;
      case 'glow':
        ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, 0, 0, 30, 30, '#fff3a0'); ctx.restore();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); }
        ell(ctx, 0, 0, 14, 14, '#ffd23f'); outline(ctx, 3, L); break;
      case 'paw':
        ell(ctx, 0, 8, 16, 13, '#24232e'); outline(ctx, 3, L);
        for (const [px, py] of [[-16, -10], [-5, -18], [7, -18], [17, -10]]) { ell(ctx, px, py, 6, 7, '#24232e'); outline(ctx, 3, L); }
        ell(ctx, 0, 9, 8, 6, '#ffd6b0');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (const lx of [-28, 26]) { ctx.beginPath(); ctx.moveTo(lx, -4); ctx.lineTo(lx + (lx < 0 ? -6 : 6), -4); ctx.moveTo(lx, 6); ctx.lineTo(lx + (lx < 0 ? -8 : 8), 6); ctx.stroke(); }
        break;
      case 'magnet':
        ctx.beginPath(); ctx.arc(0, -2, 20, Math.PI, 0); ctx.lineWidth = 14; ctx.strokeStyle = '#ff3b5c'; ctx.stroke();
        ctx.fillStyle = '#ff3b5c'; ctx.fillRect(-27, -2, 14, 16); ctx.fillRect(13, -2, 14, 16);
        ctx.fillStyle = '#e3e6f3'; ctx.fillRect(-27, 14, 14, 10); ctx.fillRect(13, 14, 14, 10);
        Art.roundStar(ctx, 0, 20, 7, '#ffd23f'); break;
      case 'eye':
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(0, -30, 30, 0); ctx.quadraticCurveTo(0, 30, -30, 0); ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 4, L);
        ell(ctx, 0, 0, 12, 12, '#6a4cff'); ell(ctx, 0, 0, 6, 6, '#120a2e'); ell(ctx, -4, -4, 3, 3, '#fff'); break;
      case 'shield':
        for (const [dx, sc] of [[-8, 0.85], [8, 1]]) {
          ctx.save(); ctx.translate(dx, 0); ctx.scale(sc, sc);
          ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(14, -18, 22, -18); ctx.quadraticCurveTo(22, 14, 0, 28); ctx.quadraticCurveTo(-22, 14, -22, -18); ctx.quadraticCurveTo(-14, -18, 0, -26); ctx.closePath();
          ctx.fillStyle = dx < 0 ? '#38d6c3' : '#7ee8ff'; ctx.fill(); outline(ctx, 4, L); ctx.restore();
        }
        Art.roundStar(ctx, 8, 0, 9, '#fff'); break;
      case 'bigfire':
        Art.icon(ctx, 'fire', -12, 4, 0.75); Art.icon(ctx, 'fire', 12, -2, 0.85); break;
      case 'star':
        Art.roundStar(ctx, 0, 2, 28, '#ffd23f', L); ell(ctx, -7, -6, 6, 4, 'rgba(255,255,255,0.7)'); break;
      case 'skills':
        ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-20, 28); ctx.lineTo(-8, 22); ctx.lineTo(0, 30); ctx.lineTo(4, 4); ctx.closePath(); ctx.fillStyle = '#ff7eb6'; ctx.fill(); outline(ctx, 3, L);
        ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(20, 28); ctx.lineTo(8, 22); ctx.lineTo(0, 30); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fillStyle = '#7ee8ff'; ctx.fill(); outline(ctx, 3, L);
        ell(ctx, 0, -8, 20, 20, '#ffd23f'); outline(ctx, 4, L); Art.roundStar(ctx, 0, -8, 11, '#fff3a0'); break;
      case 'lock':
        Art.rr(ctx, -18, -4, 36, 28, 6); ctx.fillStyle = '#9a9bab'; ctx.fill(); outline(ctx, 4, L);
        ctx.beginPath(); ctx.arc(0, -4, 12, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = L; ctx.stroke();
        ell(ctx, 0, 9, 4, 5, L); break;
      case 'crystals':
        Art.crystal(ctx, -12, 26, 0.36, '#ff9be0'); Art.crystal(ctx, 14, 26, 0.3, '#7ee8ff');
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♪', 18, -16); break;
      case 'constellation': {
        const pts = [[-24, 14], [-10, -12], [8, -2], [24, -22], [16, 20]];
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        for (const p of pts) Art.roundStar(ctx, p[0], p[1], 8, '#ffd23f', L);
        break;
      }
      case 'bunny': Art.bunny(ctx, 0, 26, 0.42, t, 0); break;
      case 'hint':
        ell(ctx, 0, -6, 18, 18, '#fff3a0'); outline(ctx, 4, L); Art.rr(ctx, -8, 12, 16, 12, 3); ctx.fillStyle = '#c6b6ff'; ctx.fill(); outline(ctx, 3, L); break;
    }
    ctx.restore();
  };
})();
