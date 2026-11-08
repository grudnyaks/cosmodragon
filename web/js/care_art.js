// Рисунки для заботы: наряды, еда, ванна, кроватка, новые значки
'use strict';
(function () {
  const TAU = Math.PI * 2, ell = Art.ell, mix = Art.mix;
  function shade(ctx, path, x, y, r, c) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.25);
    g.addColorStop(0, mix(c, '#ffffff', 0.45)); g.addColorStop(0.5, c); g.addColorStop(1, mix(c, '#000000', 0.35));
    path(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(40,20,40,0.45)'; ctx.stroke();
  }
  const E = (ctx, x, y, rx, ry, rot) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };

  // ---------- наряды (координаты головы/шеи дракончика) ----------
  Art.outfitItem = function (ctx, id, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (id) {
      case 'party': {
        ctx.translate(-8, 0); ctx.rotate(-0.12);
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-26, 6); ctx.lineTo(0, -78); ctx.lineTo(26, 6); ctx.quadraticCurveTo(0, 14, -26, 6); ctx.closePath(); }, 0, -30, 40, '#ff5e9a');
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 7, -6 - i * 22); ctx.lineTo(20 - i * 7, -6 - i * 22); ctx.lineWidth = 5; ctx.strokeStyle = '#ffe14a'; ctx.stroke(); }
        shade(ctx, E(ctx, 0, -80, 9, 9), 0, -80, 9, '#7ee8ff'); break;
      }
      case 'bow': {
        ctx.translate(30, 0); ctx.rotate(0.3);
        for (const sd of [-1, 1]) shade(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 30, -26, sd * 34, 0); ctx.quadraticCurveTo(sd * 30, 24, 0, 0); ctx.closePath(); }, sd * 18, 0, 24, '#ff4f8b');
        shade(ctx, E(ctx, 0, 0, 9, 9), 0, 0, 9, '#ff7eb6'); break;
      }
      case 'beanie': {
        shade(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 4, 50, 44, 0, Math.PI, TAU); ctx.closePath(); }, 0, -16, 50, '#38b6ff');
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 4, 50, 44, 0, Math.PI, TAU); ctx.clip();
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 18, 4); ctx.lineTo(i * 14, -40); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke(); }
        ctx.restore();
        shade(ctx, () => Art.rr(ctx, -54, -4, 108, 16, 8), 0, 4, 54, '#ffffff');
        shade(ctx, E(ctx, 0, -44, 14, 14), 0, -44, 14, '#ffe14a'); break;
      }
      case 'flower': {
        ctx.translate(-34, -2);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.3; shade(ctx, E(ctx, Math.cos(a) * 13, Math.sin(a) * 13, 10, 10), Math.cos(a) * 13, Math.sin(a) * 13, 10, '#fff2a8'); }
        shade(ctx, E(ctx, 0, 0, 9, 9), 0, 0, 9, '#ff9a3c'); break;
      }
      case 'cap': {
        shade(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 4, 48, 40, 0, Math.PI, TAU); ctx.closePath(); }, 0, -14, 48, '#ff3b5c');
        shade(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 6, 58, 13, 0, 0, Math.PI); ctx.lineTo(-58, 6); ctx.closePath(); }, 0, 10, 58, '#c8304a');
        shade(ctx, E(ctx, 0, -36, 6, 6), 0, -36, 6, '#ffffff');
        ctx.font = 'bold 22px ' + UI.font; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('★', 0, -6); break;
      }
      case 'crown': {
        const pts = [[-34, 4], [-38, -34], [-18, -14], [0, -42], [18, -14], [38, -34], [34, 4]];
        const g = ctx.createLinearGradient(0, -42, 0, 4); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffcc33'); g.addColorStop(1, '#c88a10');
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#8a5a10'; ctx.stroke();
        for (const [cx, cc] of [[-20, '#ff3b5c'], [0, '#3fb8ff'], [20, '#41d982']]) shade(ctx, E(ctx, cx, -4, 6, 6), cx, -4, 6, cc);
        if (Math.sin(t * 3) > 0.6) Art.sparkle(ctx, 22, -36, 8, '#ffffff');
        break;
      }
      case 'scarf': {
        shade(ctx, E(ctx, 0, 0, 46, 13), 0, 0, 46, '#ff3b5c');
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 46, 13, 0, 0, TAU); ctx.clip();
        for (let i = -3; i <= 3; i++) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(i * 14 - 3, -14, 6, 28); }
        ctx.restore();
        ctx.save(); ctx.translate(26, 8); ctx.rotate(0.25 + Math.sin(t * 2) * 0.06);
        shade(ctx, () => Art.rr(ctx, -9, 0, 18, 46, 5), 0, 22, 22, '#ff3b5c');
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-9, 14, 18, 6); ctx.fillRect(-9, 30, 18, 6);
        ctx.restore(); break;
      }
      case 'bowtie': {
        ctx.translate(0, 6);
        for (const sd of [-1, 1]) shade(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * 26, -14); ctx.lineTo(sd * 26, 14); ctx.closePath(); }, sd * 14, 0, 18, '#3a2a8a');
        shade(ctx, E(ctx, 0, 0, 7, 8), 0, 0, 7, '#5a4ab0');
        for (const sd of [-1, 1]) ell(ctx, sd * 16, -2, 2.5, 2.5, '#ffe14a');
        break;
      }
      case 'bell': {
        ctx.beginPath(); ctx.ellipse(0, -2, 40, 11, 0, 0, Math.PI); ctx.lineWidth = 7; ctx.strokeStyle = '#ff7eb6'; ctx.stroke();
        ctx.translate(0, 14); ctx.rotate(Math.sin(t * 5) * 0.15);
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, 16); ctx.quadraticCurveTo(-14, -6, 0, -8); ctx.quadraticCurveTo(14, -6, 14, 16); ctx.closePath(); }, 0, 4, 16, '#ffcc33');
        ell(ctx, 0, 17, 4, 4, '#8a5a10'); break;
      }
      case 'medal': {
        ctx.beginPath(); ctx.moveTo(-24, -6); ctx.lineTo(-6, 30); ctx.moveTo(24, -6); ctx.lineTo(6, 30); ctx.lineWidth = 9; ctx.strokeStyle = '#3fb8ff'; ctx.stroke();
        shade(ctx, E(ctx, 0, 40, 16, 16), 0, 40, 16, '#ffcc33');
        Art.roundStar(ctx, 0, 40, 9, '#fff6c0'); break;
      }
      case 'glasses': case 'shades': {
        const dark = id === 'shades';
        for (const sd of [-1, 1]) {
          ctx.beginPath(); ctx.arc(sd * 27, 0, 19, 0, TAU);
          ctx.fillStyle = dark ? 'rgba(20,20,30,0.88)' : 'rgba(200,230,255,0.18)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = dark ? '#111' : '#ff7eb6'; ctx.stroke();
          ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(sd * 27 - 6, -7, 6, 3, -0.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, -8, 8, -2); ctx.lineWidth = 4; ctx.strokeStyle = dark ? '#111' : '#ff7eb6'; ctx.stroke();
        break;
      }
    }
    ctx.restore();
  };

  // ---------- еда для обеда ----------
  const FOODS = ['apple', 'carrot', 'candy', 'cookie', 'cheese', 'banana'];
  Art.FOODS = FOODS;
  Art.food = function (ctx, type, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (FOODS[type] || type) {
      case 'apple':
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -20); ctx.bezierCurveTo(26, -34, 40, 6, 0, 30); ctx.bezierCurveTo(-40, 6, -26, -34, 0, -20); ctx.closePath(); }, 0, 0, 32, '#ff3b4a');
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(3, -36); ctx.lineWidth = 4; ctx.strokeStyle = '#6a3a1a'; ctx.stroke();
        shade(ctx, E(ctx, 12, -32, 10, 5, -0.4), 12, -32, 10, '#41d982'); break;
      case 'carrot':
        ctx.rotate(0.5);
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-12, -24); ctx.quadraticCurveTo(0, -30, 12, -24); ctx.lineTo(2, 34); ctx.lineTo(-2, 34); ctx.closePath(); }, 0, 0, 30, '#ff8a2a');
        for (const a of [-0.4, 0, 0.4]) { ctx.save(); ctx.translate(0, -26); ctx.rotate(a); shade(ctx, E(ctx, 0, -12, 5, 13), 0, -12, 10, '#41d982'); ctx.restore(); }
        break;
      case 'candy':
        for (const sd of [-1, 1]) shade(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 16, 0); ctx.lineTo(sd * 36, -14); ctx.lineTo(sd * 36, 14); ctx.closePath(); }, sd * 26, 0, 16, '#ffd23f');
        shade(ctx, E(ctx, 0, 0, 20, 16), 0, 0, 20, '#ff5e9a');
        ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(0, 0, -6, 13); ctx.moveTo(4, -14); ctx.quadraticCurveTo(14, 0, 8, 13); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); break;
      case 'cookie':
        shade(ctx, E(ctx, 0, 0, 28, 26), 0, 0, 28, '#d89a50');
        for (const [cx, cy] of [[-10, -8], [8, -12], [12, 8], [-6, 10], [0, -1]]) ell(ctx, cx, cy, 4, 3.5, '#5a3418'); break;
      case 'cheese':
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-30, 18); ctx.lineTo(30, 18); ctx.lineTo(30, -6); ctx.lineTo(-30, -22); ctx.closePath(); }, 0, 0, 30, '#ffd23f');
        for (const [cx, cy, r] of [[-12, 4, 5], [10, 6, 4], [16, -2, 3], [-2, -8, 3]]) ell(ctx, cx, cy, r, r, '#e0a820'); break;
      case 'banana':
        ctx.rotate(-0.3);
        shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-30, -14); ctx.quadraticCurveTo(0, 30, 32, -12); ctx.quadraticCurveTo(0, 14, -30, -14); ctx.closePath(); }, 0, 6, 30, '#ffe14a');
        ell(ctx, -30, -14, 3, 3, '#6a4a1a'); ell(ctx, 32, -12, 3, 3, '#6a4a1a'); break;
    }
    ctx.restore();
  };

  // ---------- ванна, губка, душ ----------
  Art.tub = function (ctx, x, y, s, front) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (!front) {
      shade(ctx, E(ctx, 0, -110, 230, 34), 0, -110, 230, '#e8f4ff');
      ell(ctx, 0, -108, 210, 26, '#9ad8ff');
    } else {
      shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-230, -110); ctx.quadraticCurveTo(-230, 10, -120, 14); ctx.lineTo(120, 14); ctx.quadraticCurveTo(230, 10, 230, -110); ctx.closePath(); }, 0, -60, 240, '#ffffff');
      for (const sd of [-1, 1]) shade(ctx, E(ctx, sd * 160, 26, 16, 14), sd * 160, 26, 16, '#ffcc33');
    }
    ctx.restore();
  };
  Art.sponge = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.2);
    shade(ctx, () => Art.rr(ctx, -36, -22, 72, 44, 14), 0, 0, 40, '#ffe14a');
    for (const [cx, cy] of [[-18, -6], [6, -10], [20, 8], [-6, 10], [-24, 10]]) ell(ctx, cx, cy, 4, 3, '#e0b020');
    ctx.restore();
  };
  Art.shower = function (ctx, x, y, s, on, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    shade(ctx, () => Art.rr(ctx, -10, -80, 20, 70, 8), 0, -45, 30, '#b8c4d8');
    shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(0, -30, 40, 0); ctx.closePath(); }, 0, -8, 40, '#d8e0ee');
    if (on) for (let i = 0; i < 14; i++) { const dx = -34 + (i % 7) * 11, dy = ((t * 400 + i * 47) % 160); ctx.globalAlpha = 0.7; ell(ctx, dx + dy * (dx / 120), 10 + dy, 3, 7, '#7ec8ff'); }
    ctx.restore();
  };
  // ---------- кроватка-подушка с одеялом ----------
  Art.bed = function (ctx, x, y, s, blanket, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    shade(ctx, E(ctx, 0, 0, 170, 46), 0, 0, 170, color || '#b07cff');
    ctx.restore();
  };
  Art.blanket = function (ctx, x, y, s, k, color) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const h = 125 * k;
    shade(ctx, () => { ctx.beginPath(); ctx.moveTo(-160, 30); ctx.lineTo(-150, 30 - h); ctx.quadraticCurveTo(0, 10 - h, 150, 30 - h); ctx.lineTo(160, 30); ctx.closePath(); }, 0, 30 - h / 2, 160, color || '#ff9ad5');
    ctx.save(); ctx.beginPath(); ctx.moveTo(-160, 30); ctx.lineTo(-150, 30 - h); ctx.quadraticCurveTo(0, 10 - h, 150, 30 - h); ctx.lineTo(160, 30); ctx.closePath(); ctx.clip();
    for (let i = 0; i < 12; i++) Art.roundStar(ctx, -130 + (i % 6) * 52, 10 - h + 40 + Math.floor(i / 6) * 70, 9, 'rgba(255,255,255,0.6)');
    ctx.restore(); ctx.restore();
  };

  // ---------- новые значки ----------
  const L = '#3a1f4a';
  const old = Art.icon;
  Art.icon = function (ctx, name, x, y, s, t) {
    const custom = { plate: 1, bath: 1, heart: 1, hat: 1, palette: 1, duo: 1, album: 1, bed: 1, pencil: 1 };
    if (!custom[name]) return old(ctx, name, x, y, s, t);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const out = (w) => { ctx.lineWidth = w || 3; ctx.strokeStyle = L; ctx.stroke(); };
    switch (name) {
      case 'plate':
        ctx.beginPath(); ctx.ellipse(0, 8, 28, 12, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); out();
        Art.food(ctx, 0, -6, -6, 0.42); Art.food(ctx, 1, 10, -4, 0.38); break;
      case 'bath':
        ctx.beginPath(); ctx.moveTo(-26, -2); ctx.lineTo(26, -2); ctx.quadraticCurveTo(26, 22, 0, 22); ctx.quadraticCurveTo(-26, 22, -26, -2); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); out();
        for (const [bx, by, r] of [[-12, -10, 8], [2, -14, 10], [16, -9, 7]]) { ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fillStyle = '#bfe8ff'; ctx.fill(); out(2.5); }
        break;
      case 'heart':
        ctx.beginPath(); ctx.moveTo(0, 22); ctx.bezierCurveTo(-34, 0, -22, -28, 0, -10); ctx.bezierCurveTo(22, -28, 34, 0, 0, 22); ctx.closePath(); ctx.fillStyle = '#ff5e9a'; ctx.fill(); out();
        ell(ctx, -9, -8, 5, 3.5, 'rgba(255,255,255,0.7)'); break;
      case 'hat':
        ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(0, -28); ctx.lineTo(18, 8); ctx.closePath(); ctx.fillStyle = '#ff5e9a'; ctx.fill(); out();
        ctx.beginPath(); ctx.ellipse(0, 10, 26, 8, 0, 0, TAU); ctx.fillStyle = '#ffd23f'; ctx.fill(); out();
        ctx.beginPath(); ctx.arc(0, -28, 6, 0, TAU); ctx.fillStyle = '#7ee8ff'; ctx.fill(); out(2.5); break;
      case 'palette':
        ctx.beginPath(); ctx.ellipse(0, 0, 28, 22, -0.2, 0, TAU); ctx.fillStyle = '#f4d8a8'; ctx.fill(); out();
        for (const [px, py, c] of [[-14, -8, '#ff3b5c'], [0, -12, '#ffd23f'], [14, -6, '#41d982'], [12, 8, '#3fb8ff']]) ell(ctx, px, py, 5.5, 5.5, c);
        ell(ctx, -8, 8, 5, 5, '#f8f0e0'); break;
      case 'duo':
        Art.treat(ctx, 0, -12, 0, 0.42); Art.treat(ctx, 3, 12, 0, 0.42);
        ctx.font = 'bold 18px ' + UI.font; ctx.fillStyle = L; ctx.textAlign = 'center'; ctx.fillText('×2', 0, 26); break;
      case 'album':
        Art.rr(ctx, -24, -22, 48, 44, 6); ctx.fillStyle = '#fff6e0'; ctx.fill(); out();
        Art.rr(ctx, -16, -14, 32, 22, 3); ctx.fillStyle = '#9ad8ff'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(-4, -4); ctx.lineTo(4, 4); ctx.lineTo(10, -2); ctx.lineTo(16, 8); ctx.closePath(); ctx.fillStyle = '#41d982'; ctx.fill();
        ell(ctx, 8, -8, 4, 4, '#ffd23f'); break;
      case 'bed':
        ctx.beginPath(); ctx.ellipse(0, 10, 28, 12, 0, 0, TAU); ctx.fillStyle = '#b07cff'; ctx.fill(); out();
        ctx.beginPath(); ctx.arc(0, -6, 16, 0.6, Math.PI * 2 - 0.6, false); ctx.quadraticCurveTo(-3, -6, 13, 3); ctx.closePath(); ctx.fillStyle = '#ffe9a0'; ctx.fill(); out(2.5); break;
      case 'pencil':
        ctx.rotate(0.7); Art.rr(ctx, -6, -24, 12, 40, 3); ctx.fillStyle = '#ffd23f'; ctx.fill(); out(2.5);
        ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(0, 28); ctx.lineTo(6, 16); ctx.closePath(); ctx.fillStyle = '#f4d8a8'; ctx.fill(); out(2.5); break;
    }
    ctx.restore();
  };
})();
