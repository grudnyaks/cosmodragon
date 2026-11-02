// Интерфейс: круглые кнопки-пузыри, текст с обводкой, счётчик вкусняшек
'use strict';
const UI = {
  font: '"Comic Sans MS","Baloo 2","Nunito",system-ui,sans-serif',
  hit(b, x, y, pad) {
    pad = pad || 0;
    if (b.w) return x >= b.x - b.w / 2 - pad && x <= b.x + b.w / 2 + pad && y >= b.y - b.h / 2 - pad && y <= b.y + b.h / 2 + pad;
    return Math.hypot(x - b.x, y - b.y) <= b.r + 8 + pad;
  },
  add(scene, b) { scene.buttons.push(b); return b; },
  drawButton(ctx, b) {
    const t = G.t;
    let sc = 1;
    if (G.pointer.btn === b) sc = 0.9;
    else if (b.pressT && t - b.pressT < 0.3) sc = 0.9 + 0.1 * G.ease.outBack((t - b.pressT) / 0.3);
    if (b.pulse) sc *= 1 + Math.sin(t * 5) * 0.06;
    if (b.appear != null) sc *= b.appear;
    ctx.save(); ctx.translate(b.x, b.y + (b.bob ? Math.sin(t * 2 + b.x) * 4 : 0)); ctx.scale(sc, sc);
    if (b.disabled) ctx.globalAlpha = 0.45;
    const c = b.color || '#8f6cf2';
    if (b.w) {
      Art.rr(ctx, -b.w / 2, -b.h / 2 + 6, b.w, b.h, b.h / 2); ctx.fillStyle = 'rgba(30,10,60,0.35)'; ctx.fill();
      Art.rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2); ctx.fillStyle = c; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#2a1650'; ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.3; Art.rr(ctx, -b.w / 2 + 10, -b.h / 2 + 6, b.w - 20, b.h * 0.35, b.h * 0.2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    } else {
      Art.ell(ctx, 0, 6, b.r, b.r, 'rgba(30,10,60,0.35)');
      Art.ell(ctx, 0, 0, b.r, b.r); ctx.fillStyle = Art.rg(ctx, 0, 0, b.r * 1.2, UI.lighten(c), c); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#2a1650'; ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.35; Art.ell(ctx, -b.r * 0.25, -b.r * 0.45, b.r * 0.5, b.r * 0.25, '#fff', -0.3); ctx.restore();
    }
    if (b.icon) Art.icon(ctx, b.icon, b.iconX || 0, 0, (b.iconScale || 1) * (b.w ? b.h / 80 : b.r / 46), t);
    if (b.draw) b.draw(ctx, b);
    if (b.label) UI.text(ctx, b.label, b.icon ? 26 : 0, 2, b.fontSize || 34, '#fff', 'center', true);
    if (b.badge) {
      Art.ell(ctx, b.r * 0.7, -b.r * 0.7, 20, 20, '#ff3b5c'); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1650'; ctx.stroke();
      UI.text(ctx, String(b.badge), b.r * 0.7, -b.r * 0.7 + 1, 24, '#fff', 'center', false);
    }
    ctx.restore();
  },
  lighten(c) {
    const n = parseInt(c.slice(1), 16);
    const r = Math.min(255, (n >> 16) + 70), g = Math.min(255, ((n >> 8) & 255) + 70), b = Math.min(255, (n & 255) + 70);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  },
  text(ctx, str, x, y, size, color, align, stroke) {
    ctx.save();
    ctx.font = 'bold ' + size + 'px ' + UI.font;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#2a1650'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  },
  // счётчик вкусняшек в левом/правом верхнем углу
  counter(ctx, x, y, n, bump) {
    const sc = 1 + (bump || 0) * 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    Art.rr(ctx, -10, -32, 170, 64, 32); ctx.fillStyle = 'rgba(42,22,80,0.75)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffd6f0'; ctx.stroke();
    Art.treat(ctx, 0, 22, 2, 0.62);
    UI.text(ctx, String(n), 100, 2, 40, '#fff', 'center', true);
    ctx.restore();
  },
  progress(ctx, x, y, w, h, k, color) {
    Art.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(42,22,80,0.7)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    if (k > 0) { Art.rr(ctx, x + 4, y + 4, Math.max(h - 8, (w - 8) * Math.min(1, k)), h - 8, (h - 8) / 2); ctx.fillStyle = color || '#ffd23f'; ctx.fill(); }
  },
  homeButton(scene) {
    return UI.add(scene, { x: G.view.x0 + 70, y: 70, r: 46, icon: 'home', color: '#ff7eb6', onTap: () => G.go('home') });
  },
  // летящая вкусняшка к счётчику
  flyTreat(type, x0, y0, x1, y1, delay, done) {
    const o = { x: x0, y: y0, k: 0, type };
    G.flying = G.flying || [];
    G.flying.push(o);
    G.tween(o, { k: 1 }, 0.7, G.ease.inOutQuad, () => { G.flying.splice(G.flying.indexOf(o), 1); done && done(); }, delay || 0);
    o.x0 = x0; o.y0 = y0; o.x1 = x1; o.y1 = y1;
  },
  drawFlying(ctx) {
    if (!G.flying) return;
    for (const o of G.flying) {
      if (o.k <= 0) continue;
      const x = M.lerp(o.x0, o.x1, o.k), y = M.lerp(o.y0, o.y1, o.k) - Math.sin(o.k * Math.PI) * 140;
      Art.treat(ctx, o.type, x, y, 0.6 - o.k * 0.15, G.t);
    }
  },
  // Награда: вкусняшки летят в счётчик
  reward(n, x, y) {
    const cx = G.view.x1 - 140, cy = 60;
    S.addTreats(n); UI.pending += n; // сохраняем сразу, счётчик догоняет анимацию
    for (let i = 0; i < n; i++) {
      UI.flyTreat(i % 5, x + M.rnd(-40, 40), y + M.rnd(-30, 30), cx, cy, i * 0.12, () => {
        UI.pending = Math.max(0, UI.pending - 1); Sound.coin(); UI.counterBump = 1;
      });
    }
  },
  counterBump: 0, pending: 0,
  reset() { UI.pending = 0; G.flying = []; },
  drawCounterTopRight(ctx) {
    UI.counterBump = Math.max(0, UI.counterBump - G.dt * 4);
    UI.counter(ctx, G.view.x1 - 190, 60, PS().treats - UI.pending, UI.counterBump);
    UI.drawFlying(ctx);
  },
};
