// Рисунки второй истории: комета-хулиганка Шкода, звёздное небо, пузырь с дракончиками, сундук Шипуна
'use strict';
(function () {
  const TAU = Math.PI * 2;
  const ell = Art.ell;
  const L = '#3a1f4a';

  // Комета Шкода. o: dir (направление полёта, рад), talk, mood ('cheeky'|'sad'|'happy'), tail (0..1.5), blink
  Art.comet = function (ctx, x, y, s, t, o) {
    o = o || {};
    const dir = o.dir == null ? 0 : o.dir, tl = o.tail == null ? 1 : o.tail;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // хвост — несколько светящихся лент позади
    ctx.save(); ctx.rotate(dir + Math.PI);
    const bands = [['#ff7eb6', 46, 0.5], ['#ffb23a', 36, 0.65], ['#fff3a0', 22, 0.8], ['#ffffff', 10, 0.9]];
    for (const [c, w, a] of bands) {
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, side * w * 0.3);
        const len = 330 * tl, wv = Math.sin(t * 7 + w) * 18;
        ctx.bezierCurveTo(len * 0.35, side * (w + wv), len * 0.7, side * (w * 0.8 - wv), len, side * w * 0.2 + wv);
        ctx.lineTo(len, 0);
        ctx.bezierCurveTo(len * 0.6, 0, len * 0.3, 0, 0, 0);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a * 0.6; ctx.fillStyle = g; ctx.fill();
      }
    }
    // искорки в хвосте
    for (let i = 0; i < 14; i++) {
      const u = ((t * 0.9 + i * 0.137) % 1), px = 40 + u * 300 * tl, py = Math.sin(i * 2.3 + t * 3) * (12 + u * 50);
      ctx.globalAlpha = (1 - u) * 0.9; Art.roundStar(ctx, px, py, 7 - u * 4, i % 3 ? '#fff6b0' : '#ffd0ec');
    }
    ctx.restore();
    // сияние
    ctx.save(); ctx.globalAlpha = 0.55;
    const gl = ctx.createRadialGradient(0, 0, 20, 0, 0, 120); gl.addColorStop(0, 'rgba(255,240,180,0.9)'); gl.addColorStop(1, 'rgba(255,160,200,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.fill(); ctx.restore();
    // ядро — бугристый светящийся шар
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = 62 + Math.sin(a * 5 + t * 3) * 4; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath();
    const cg = ctx.createRadialGradient(-18, -22, 6, 0, 0, 70); cg.addColorStop(0, '#fffef0'); cg.addColorStop(0.5, '#ffe27a'); cg.addColorStop(1, '#ff9a3c');
    ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#c8602a'; ctx.stroke();
    // волосы-вихры
    for (const k of [-1, 0, 1]) {
      ctx.beginPath(); ctx.moveTo(k * 18, -58); ctx.quadraticCurveTo(k * 26 + 8, -92 - Math.abs(k) * -10, k * 30 + 22 + Math.sin(t * 6 + k) * 4, -82 + Math.abs(k) * 12);
      ctx.lineWidth = 9; ctx.strokeStyle = '#ffb23a'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff3a0'; ctx.stroke();
    }
    // лицо
    const mood = o.mood || 'cheeky';
    const bl = o.blink != null ? o.blink : ((t % 3.6) < 0.13 ? 1 : 0);
    for (const side of [-1, 1]) {
      const ex = side * 22, ey = -8;
      ell(ctx, ex, ey, 13, 15 * (1 - bl * 0.9), '#ffffff'); ctx.lineWidth = 3; ctx.strokeStyle = L; ctx.stroke();
      if (bl < 0.5) { ell(ctx, ex + 3, ey + 2, 7.5, 9, '#5a2a8a'); ell(ctx, ex + 3, ey + 2, 3.5, 4.5, '#1a0a2a'); ell(ctx, ex + 6, ey - 2, 2.6, 2.6, '#fff'); }
      // брови: хитрые — домиком набок
      ctx.beginPath();
      if (mood === 'sad') { ctx.moveTo(ex - side * 12, ey - 20); ctx.lineTo(ex + side * 10, ey - 26); }
      else if (mood === 'cheeky') { ctx.moveTo(ex - 12, ey - 24 + (side > 0 ? 6 : 0)); ctx.lineTo(ex + 12, ey - 24 - (side > 0 ? 2 : -4)); }
      else { ctx.moveTo(ex - 11, ey - 24); ctx.quadraticCurveTo(ex, ey - 32, ex + 11, ey - 24); }
      ctx.lineWidth = 4.5; ctx.strokeStyle = '#a8401a'; ctx.stroke();
    }
    // румянец
    ctx.save(); ctx.globalAlpha = 0.45; ell(ctx, -38, 14, 10, 6, '#ff5e9a'); ell(ctx, 38, 14, 10, 6, '#ff5e9a'); ctx.restore();
    // рот
    const talk = o.talk ? (Math.sin(t * 16) > 0 ? 1 : 0.4) : 0;
    ctx.beginPath();
    if (mood === 'sad' && !talk) { ctx.moveTo(-14, 30); ctx.quadraticCurveTo(0, 20, 14, 30); ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.stroke(); }
    else if (talk) { ctx.ellipse(2, 26, 13, 6 + talk * 7, 0, 0, TAU); ctx.fillStyle = '#8a1a3a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = L; ctx.stroke(); }
    else {
      // хитрая кривая улыбка с язычком
      ctx.moveTo(-18, 20); ctx.quadraticCurveTo(4, 38, 22, 16); ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.stroke();
      if (mood === 'cheeky') { ctx.beginPath(); ctx.ellipse(10, 30, 6, 5, 0.3, 0, Math.PI); ctx.fillStyle = '#ff5e7a'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
    }
    ctx.restore();
  };

  // Звёздное небо (для сцен с кометой)
  Art.starSky = function (ctx, t, o) {
    o = o || {};
    const v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1);
    if (o.warm) { g.addColorStop(0, '#2a1a5a'); g.addColorStop(1, '#8a4a8a'); }
    else { g.addColorStop(0, '#070722'); g.addColorStop(0.7, '#1e1a5a'); g.addColorStop(1, '#3a2a7a'); }
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    for (let i = 0; i < 90; i++) {
      const sx = v.x0 + ((i * 397) % 1000) / 1000 * (v.x1 - v.x0), sy = v.y0 + ((i * 631) % 1000) / 1000 * (v.y1 - v.y0) * 0.85;
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); ell(ctx, sx, sy, 1.2 + (i % 3), 1.2 + (i % 3), '#ffffff');
    }
    ctx.globalAlpha = 1;
    // далёкие планеты
    ell(ctx, v.x0 + 140, 140, 46, 46, '#6a5ac8'); ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(v.x0 + 140, 140, 80, 14, -0.3, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = '#c8b8ff'; ctx.stroke(); ctx.restore();
    ell(ctx, v.x1 - 120, 560, 60, 60, '#ff9ad5'); ell(ctx, v.x1 - 136, 544, 16, 12, 'rgba(255,255,255,0.35)');
    // облачка снизу
    if (!o.noClouds) for (let i = 0; i < 7; i++) { const cx = v.x0 + i * 230 + Math.sin(t * 0.3 + i) * 20; ctx.save(); ctx.globalAlpha = 0.5; Art.cloud ? Art.cloud(ctx, cx, v.y1 - 20, 1.2) : ell(ctx, cx, v.y1, 140, 50, '#c8b8ff'); ctx.restore(); }
  };

  // Сверкающий пузырь, в котором Шкода катает дракончиков
  Art.bubble = function (ctx, x, y, r, t) {
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.75, 'rgba(180,220,255,0.12)'); g.addColorStop(1, 'rgba(255,170,230,0.5)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.8, -2.4, -1.7); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
    for (let i = 0; i < 5; i++) { const a = t * 1.3 + i * 1.26; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); Art.roundStar(ctx, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, 6, '#fff6b0'); }
    ctx.restore();
  };

  // Мешочек со звёздами (в нём дракончик падает с кометы)
  Art.sack = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 5) * 0.12);
    ctx.beginPath(); ctx.moveTo(-30, -26); ctx.bezierCurveTo(-60, 10, -50, 48, 0, 48); ctx.bezierCurveTo(50, 48, 60, 10, 30, -26); ctx.closePath();
    ctx.fillStyle = '#8f6cf2'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.stroke();
    for (const [sx, sy] of [[-18, 14], [16, 24], [4, -2]]) Art.roundStar(ctx, sx, sy, 7, '#ffd23f');
    ctx.beginPath(); ctx.ellipse(0, -30, 22, 8, 0, 0, TAU); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  // Сундук с сокровищами Шипуна
  Art.lairChest = function (ctx, x, y, s, t, open) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.save(); ctx.globalAlpha = 0.35; ell(ctx, 0, 6, 110, 18, '#000'); ctx.restore();
    Art.rr(ctx, -95, -80, 190, 86, 12); ctx.fillStyle = '#9a5a2a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a1a0a'; ctx.stroke();
    ctx.fillStyle = '#d8a030'; ctx.fillRect(-95, -50, 190, 12); ctx.fillRect(-60, -80, 14, 86); ctx.fillRect(46, -80, 14, 86);
    if (open > 0) {
      ctx.save(); ctx.globalAlpha = open * 0.8; const gg = ctx.createRadialGradient(0, -90, 10, 0, -90, 140); gg.addColorStop(0, 'rgba(255,240,150,1)'); gg.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gg; ell(ctx, 0, -90, 140, 120); ctx.fill(); ctx.restore();
      for (let i = 0; i < 5; i++) ell(ctx, -60 + i * 30, -84, 16, 10, '#ffd23f');
    }
    // крышка
    ctx.save(); ctx.translate(0, -80 - open * 46); ctx.rotate(-open * 0.25); ctx.scale(1, 1 - open * 0.65);
    ctx.beginPath(); ctx.moveTo(-95, 0); ctx.bezierCurveTo(-95, -60, 95, -60, 95, 0); ctx.closePath(); ctx.fillStyle = '#b06a32'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a1a0a'; ctx.stroke();
    ctx.fillStyle = '#d8a030'; ctx.fillRect(-60, -44, 14, 44); ctx.fillRect(46, -44, 14, 44);
    ctx.restore();
    if (open < 0.3) { Art.rr(ctx, -16, -92, 32, 30, 6); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a1a0a'; ctx.stroke(); ell(ctx, 0, -78, 4, 6, '#3a1a0a'); }
    ctx.restore();
  };

  // Гриб-прыгун
  Art.bouncyShroom = function (ctx, x, y, s, c, squash) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + (squash || 0) * 0.25), s * (1 - (squash || 0) * 0.3));
    Art.rr(ctx, -14, -50, 28, 52, 10); ctx.fillStyle = '#f8ecd8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = L; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-56, -42); ctx.bezierCurveTo(-56, -110, 56, -110, 56, -42); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
    for (const [dx, dy, r] of [[-26, -62, 9], [10, -80, 8], [30, -56, 7]]) ell(ctx, dx, dy, r, r, 'rgba(255,255,255,0.85)');
    ctx.restore();
  };

  // Картинка на стене пещеры: «Разыскиваются» или фото с друзьями
  Art.wallPicture = function (ctx, x, y, s, t, friend) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.04);
    Art.rr(ctx, -90, -80, 180, 160, 8); ctx.fillStyle = friend ? '#ffe6a8' : '#f0dcb0'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#7a4a20'; ctx.stroke();
    if (friend) {
      Art.rr(ctx, -74, -64, 148, 104, 4); ctx.fillStyle = '#9ad8ff'; ctx.fill();
      Art.dragon(ctx, -30, 36, 0.2, { kind: 'dark', t, happy: true }); Art.dragon(ctx, 30, 36, 0.2, { kind: 'light', t, happy: true });
      ctx.beginPath(); ctx.moveTo(-74, 30); ctx.quadraticCurveTo(0, -10, 74, 26); ctx.lineWidth = 12; ctx.strokeStyle = '#5b3a8c'; ctx.stroke();
      ell(ctx, 72, 22, 12, 10, '#5b3a8c');
      UI.text(ctx, 'Друзья!', 0, 62, 20, '#7a4a20', 'center', false);
    } else {
      UI.text(ctx, 'РАЗЫСКИВАЮТСЯ', 0, -58, 17, '#7a2a1a', 'center', false);
      Art.dragon(ctx, -36, 40, 0.22, { kind: 'dark', t }); Art.dragon(ctx, 36, 40, 0.22, { kind: 'light', t });
      UI.text(ctx, 'Награда: 100 конфет', 0, 64, 15, '#7a2a1a', 'center', false);
    }
    ctx.restore();
  };

  // значки
  const old = Art.icon;
  Art.icon = function (ctx, name, x, y, s, t) {
    if (name === 'comet') {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(-20, 18, -32, 30); ctx.quadraticCurveTo(-12, 22, 2, 10); ctx.closePath(); ctx.fillStyle = '#ff9ad5'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, -6); ctx.quadraticCurveTo(-22, 0, -34, 10); ctx.quadraticCurveTo(-14, 14, 4, 6); ctx.closePath(); ctx.fillStyle = '#ffb23a'; ctx.fill();
      ell(ctx, 8, -6, 17, 17, '#ffe27a'); ctx.lineWidth = 3; ctx.strokeStyle = L; ctx.stroke();
      ell(ctx, 3, -9, 3, 4, L); ell(ctx, 14, -9, 3, 4, L);
      ctx.beginPath(); ctx.moveTo(1, -1); ctx.quadraticCurveTo(9, 6, 16, -2); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore(); return;
    }
    if (name === 'chest') { Art.lairChest(ctx, x, y + 14 * s, s * 0.28, t || 0, 0); return; }
    if (name === 'cave') {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(-30, 22); ctx.bezierCurveTo(-30, -20, -14, -30, 0, -30); ctx.bezierCurveTo(14, -30, 30, -20, 30, 22); ctx.closePath(); ctx.fillStyle = '#7a6a98'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = L; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 22); ctx.bezierCurveTo(-14, -4, -6, -12, 0, -12); ctx.bezierCurveTo(6, -12, 14, -4, 14, 22); ctx.closePath(); ctx.fillStyle = '#1a0a2a'; ctx.fill();
      ell(ctx, -5, 2, 3, 2, '#ffb526'); ell(ctx, 5, 2, 3, 2, '#ffb526');
      ctx.restore(); return;
    }
    return old(ctx, name, x, y, s, t);
  };
})();
