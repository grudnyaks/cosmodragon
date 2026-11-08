// Мини-движок: холст, масштаб, касания, сцены, анимации, частицы
'use strict';
const G = {
  W: 1280, H: 720,
  scenes: {}, scene: null, sceneName: '',
  t: 0, dt: 0,
  view: { x0: 0, y0: 0, x1: 1280, y1: 720 },
  particles: [], tweens: [], floaters: [],
  fade: 0, fadeDir: 0, pending: null,
  pointer: { x: 0, y: 0, down: false, id: null },
};

(function () {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  G.cv = cv; G.ctx = ctx;
  let scale = 1, ox = 0, oy = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    scale = Math.min(w / G.W, h / G.H);
    ox = (w - G.W * scale) / 2; oy = (h - G.H * scale) / 2;
    G.view = { x0: -ox / scale, y0: -oy / scale, x1: G.W + ox / scale, y1: G.H + oy / scale };
  }
  window.addEventListener('resize', resize);
  resize();

  function toV(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale };
  }

  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (typeof Sound !== 'undefined') Sound.unlock();
    // мультитач для игр на двоих: сцена получает все пальцы через pdown/pmove/pup
    if (G.scene && G.scene.pdown && G.fadeDir === 0) { const q = toV(e); G.scene.pdown(e.pointerId, q.x, q.y); }
    if (G.pointer.down) return; // один палец
    const p = toV(e);
    G.pointer = { x: p.x, y: p.y, down: true, id: e.pointerId, sx: p.x, sy: p.y, st: G.t };
    if (G.fadeDir !== 0) return;
    const s = G.scene; if (!s) return;
    // гость поверх сцены (Шипун выглядывает в мини-играх) перехватывает нажатие
    if (G.overlay && G.overlay.down && G.overlay.down(p.x, p.y)) { G.pointer.eaten = true; return; }
    // кнопки сцены
    if (s.buttons) {
      for (let i = s.buttons.length - 1; i >= 0; i--) {
        const b = s.buttons[i];
        if (b.hidden || b.disabled) continue;
        if (UI.hit(b, p.x, p.y)) { b.pressT = G.t; G.pointer.btn = b; return; }
      }
    }
    s.down && s.down(p.x, p.y);
  });
  cv.addEventListener('pointermove', e => {
    if (G.scene && G.scene.pmove) { const q = toV(e); G.scene.pmove(e.pointerId, q.x, q.y); }
    if (!G.pointer.down || e.pointerId !== G.pointer.id) return;
    const p = toV(e);
    G.pointer.x = p.x; G.pointer.y = p.y;
    if (G.pointer.btn || G.pointer.eaten) return;
    G.scene && G.scene.move && G.scene.move(p.x, p.y);
  });
  function up(e) {
    if (G.scene && G.scene.pup) G.scene.pup(e.pointerId);
    if (!G.pointer.down || e.pointerId !== G.pointer.id) return;
    const p = toV(e);
    const b = G.pointer.btn;
    const eaten = G.pointer.eaten;
    G.pointer.down = false; G.pointer.btn = null; G.pointer.eaten = false;
    if (eaten) return;
    if (b) {
      if (UI.hit(b, p.x, p.y, 30)) { Sound.pop(1.2); b.onTap && b.onTap(); }
      return;
    }
    G.scene && G.scene.up && G.scene.up(p.x, p.y);
  }
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);

  G.go = function (name, args) {
    if (G.fadeDir !== 0) return;
    G.pending = { name, args };
    G.fadeDir = 1;
  };
  function enter(name, args) {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.particles.length = 0; G.tweens.length = 0; G.floaters.length = 0;
    if (typeof UI !== 'undefined') UI.reset();
    G.scene = G.scenes[name]; G.sceneName = name;
    G.scene.buttons = [];
    G.scene.enter && G.scene.enter(args || {});
    if (G.overlay && G.overlay.enter) G.overlay.enter(name);
  }
  G.start = function (name, args) { enter(name, args); G.fade = 1; G.fadeDir = -1; };

  // Твины
  G.tween = function (obj, props, dur, ease, done, delay) {
    const tw = { obj, from: {}, to: props, dur, t: -(delay || 0), ease: ease || G.ease.outQuad, done };
    for (const k in props) tw.from[k] = obj[k];
    G.tweens.push(tw); return tw;
  };
  G.wait = function (dur, fn) { G.tweens.push({ obj: {}, from: {}, to: {}, dur, t: 0, ease: x => x, done: fn }); };
  G.ease = {
    linear: x => x,
    outQuad: x => 1 - (1 - x) * (1 - x),
    inOutQuad: x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outElastic: x => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1,
    outBounce: x => { const n1 = 7.5625, d1 = 2.75; if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + .75; if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + .9375; return n1 * (x -= 2.625 / d1) * x + .984375; },
  };

  // Частицы
  G.burst = function (x, y, opt) {
    opt = opt || {};
    const n = opt.n || 14, kind = opt.kind || 'star';
    const colors = opt.colors || ['#ffd84a', '#ff7eb6', '#7ee8ff', '#b28bff', '#8dff9a', '#ffa64a'];
    for (let i = 0; i < n; i++) {
      const a = opt.up ? -Math.PI / 2 + (Math.random() - .5) * 1.6 : Math.random() * Math.PI * 2;
      const sp = (opt.speed || 260) * (.4 + Math.random() * .8);
      G.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: opt.g == null ? 300 : opt.g,
        life: (opt.life || 1.1) * (.7 + Math.random() * .6), age: 0, kind,
        size: (opt.size || 14) * (.6 + Math.random() * .8), rot: Math.random() * 6, vr: (Math.random() - .5) * 8,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  };
  // всплывающее сообщение сверху (достижения, ключи и т.п.)
  G.toasts = [];
  G.toast = function (text, icon) { G.toasts.push({ text, icon: icon || 'trophy', age: 0, life: 3.2 }); };
  function drawToasts(ctx, dt) {
    const tt = G.toasts[0]; if (!tt) return;
    tt.age += dt;
    if (tt.age > tt.life) { G.toasts.shift(); return; }
    const k = Math.min(1, tt.age / 0.35, (tt.life - tt.age) / 0.35);
    ctx.save(); ctx.translate(640, -60 + k * 170);
    ctx.font = 'bold 30px ' + UI.font; const w = Math.max(420, ctx.measureText(tt.text).width + 140);
    Art.rr(ctx, -w / 2, -40, w, 80, 40); ctx.fillStyle = 'rgba(255,250,235,0.97)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    Art.ell(ctx, -w / 2 + 44, 0, 30, 30, '#8f6cf2'); Art.icon(ctx, tt.icon, -w / 2 + 44, 0, 0.75, G.t);
    UI.text(ctx, tt.text, 30, 2, 30, '#5a3fa0', 'center', false);
    ctx.restore();
  }
  G.floatText = function (x, y, text, color) {
    G.floaters.push({ x, y, text, color: color || '#fff', age: 0, life: 1.4 });
  };

  function drawParticles(ctx, dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.age += dt;
      if (p.age > p.life) { G.particles.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      p.vx *= .99;
      const a = 1 - p.age / p.life;
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.kind === 'star') Art.starPath(ctx, 0, 0, p.size, p.size * .45, 5), ctx.fill();
      else if (p.kind === 'heart') Art.heart(ctx, 0, 0, p.size, p.color);
      else if (p.kind === 'confetti') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.kind === 'smoke') { ctx.globalAlpha *= .5; ctx.beginPath(); ctx.arc(0, 0, p.size * (1 + p.age), 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i]; f.age += dt;
      if (f.age > f.life) { G.floaters.splice(i, 1); continue; }
      const a = 1 - f.age / f.life;
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 2);
      UI.text(ctx, f.text, f.x, f.y - f.age * 70, 44, f.color, 'center', true);
      ctx.restore();
    }
  }

  let last = performance.now();
  function frame(now) {
    // следующий кадр заказываем сразу: даже если в рисовании случится ошибка, игра не зависнет
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    G.dt = dt; G.t += dt;
    // твины
    for (let i = G.tweens.length - 1; i >= 0; i--) {
      const tw = G.tweens[i]; tw.t += dt;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.dur), e = tw.ease(k);
      for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
      if (k >= 1) { G.tweens.splice(G.tweens.indexOf(tw), 1); tw.done && tw.done(); }
    }
    // переход
    if (G.fadeDir === 1) {
      G.fade += dt * 3.5;
      if (G.fade >= 1) { G.fade = 1; G.fadeDir = -1; const p = G.pending; G.pending = null; enter(p.name, p.args); }
    } else if (G.fadeDir === -1) {
      G.fade -= dt * 3; if (G.fade <= 0) { G.fade = 0; G.fadeDir = 0; }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1b1240'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    const s = G.scene;
    if (s) {
      s.update && s.update(dt);
      s.draw && s.draw(ctx);
      if (s.buttons) for (const b of s.buttons) if (!b.hidden) UI.drawButton(ctx, b);
      s.drawTop && s.drawTop(ctx);
      if (G.overlay && G.overlay.frame) G.overlay.frame(ctx, dt);
    }
    drawParticles(ctx, dt);
    drawToasts(ctx, dt);
    if (G.fade > 0) {
      ctx.fillStyle = 'rgba(27,18,64,' + G.fade + ')';
      const v = G.view; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    }
  }
  G.run = function () { requestAnimationFrame(t => { last = t; frame(t); }); };

  // Системная кнопка «назад» на Android
  window.onAndroidBack = function () {
    if (G.sceneName !== 'home' && G.sceneName !== 'intro') { G.go('home'); return true; }
    return false;
  };
})();

// Вспомогательная математика
const M = {
  rnd: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  pick: arr => arr[(Math.random() * arr.length) | 0],
  shuffle: arr => { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
};
