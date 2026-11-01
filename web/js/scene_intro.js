// Общий мир планеты Ням-Ням и сюжетное вступление
'use strict';
const World = {
  GROUND: 560,
  bg(ctx, t, opt) {
    opt = opt || {};
    const lit = S.data.beacon;
    Art.sky(ctx, lit ? '#2a2386' : '#22175e', lit ? '#8a5ad8' : '#6a40b8', '#ff9ad5');
    Art.stars(ctx, 11, lit ? 160 : 70, t, World.GROUND);
    Art.planet(ctx, 250, 130, 62, '#ffd0f0', '#ff7eb6', 'rgba(255,240,180,0.8)');
    Art.planet(ctx, 980, 90, 26, '#d4fff6', '#38d6c3');
    Art.planet(ctx, 1060, 170, 14, '#fff3c0', '#ffb23a');
    // далёкие горы
    const v = G.view;
    ctx.fillStyle = '#9b6fe0';
    ctx.beginPath(); ctx.moveTo(v.x0, 520);
    for (let x = v.x0; x <= v.x1 + 40; x += 40) ctx.lineTo(x, 470 + Math.sin(x * 0.011) * 30 + Math.sin(x * 0.027) * 18);
    ctx.lineTo(v.x1, 600); ctx.lineTo(v.x0, 600); ctx.closePath(); ctx.fill();
    if (!opt.noBeacon) Art.beacon(ctx, 1150, 505, 0.8, lit, t);
    Art.ground(ctx, World.GROUND, t);
    if (!opt.noDecor) {
      Art.mushroom(ctx, 70, 580, 0.6, '#7ee8ff', t);
      Art.crystal(ctx, 1240, 600, 0.7, '#ff9be0');
      Art.bush(ctx, 1010, 575, 0.6, '#ffb23a', t);
      Art.mushroom(ctx, 1255, 700, 0.5, '#ffd23f', t);
    }
  },
};

G.scenes.intro = {
  slides: [
    { text: 'Жил-был отважный космонавт. Однажды он полетел на своей ракете к далёким звёздам.' },
    { text: 'Вдруг — метеоритный дождь! Ракета закружилась и полетела к незнакомой планете.' },
    { text: 'Бум! Ракета приземлилась на планете Ням-Ням. Тут растут конфетные кусты и светятся грибы.' },
    { text: 'Из кустов выглянул маленький дракончик. Он был грустный и голодный: метеоритная буря разбросала все вкусняшки по планете.' },
    { text: 'Космонавт угостил дракончика вкусняшкой. Мур-р-р! Так они стали друзьями. Дракончика зовут Дракоша.' },
    { text: 'Видишь Звёздный маяк? Буря его погасила. Корми Дракошу вкусняшками — он вырастет большим и снова зажжёт маяк!' },
  ],
  enter() {
    this.i = 0; this.st = 0;
    this.meteors = [];
    for (let i = 0; i < 9; i++) this.meteors.push({ x: M.rnd(1300, 2400), y: M.rnd(-100, 700), r: M.rnd(14, 38), v: M.rnd(300, 520), rot: 0, seed: i + 3 });
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    this.say();
  },
  say() { Voice.say(this.slides[this.i].text); },
  next() {
    this.i++; this.st = 0;
    if (this.i >= this.slides.length) { S.data.introSeen = true; S.save(); Voice.stop(); G.go('home'); return; }
    Sound.whoosh();
    this.say();
  },
  down() { if (this.st > 0.8) this.next(); },
  update(dt) {
    this.st += dt;
    for (const m of this.meteors) { m.x -= m.v * dt; m.y += m.v * 0.35 * dt; m.rot += dt; if (m.x < -200) { m.x = M.rnd(1350, 1800); m.y = M.rnd(-200, 500); } }
    if (this.i === 4 && Math.floor(this.st * 2) !== Math.floor((this.st - dt) * 2) && this.st < 4) {
      G.burst(700, 300, { kind: 'heart', n: 3, colors: ['#ff5e9a', '#ff9ad5'], up: true, g: -60, speed: 120 });
    }
  },
  draw(ctx) {
    const t = G.t, st = this.st, i = this.i;
    if (i <= 1) {
      Art.sky(ctx, '#0c0830', '#2a1a6e', '#4a2a90');
      Art.stars(ctx, 5, 180, t);
      Art.planet(ctx, 1040, 560, 120, '#9ff0e0', '#2a8f8a', 'rgba(255,180,230,0.8)');
      Art.planet(ctx, 180, 140, 40, '#ffe0a0', '#ff8a2a');
      if (i === 0) {
        const x = 300 + Math.sin(t * 0.8) * 40 + st * 30, y = 420 + Math.sin(t * 1.3) * 20;
        Art.rocket(ctx, x, y, 0.6, { t, flame: 1, rot: 0.9, pilot: true });
      } else {
        for (const m of this.meteors) Art.meteor(ctx, m.x, m.y, m.r, m.rot, m.seed);
        const x = 640 + Math.sin(st * 2) * 120 + st * 60, y = 360 + Math.cos(st * 3) * 60 + st * 25;
        Art.rocket(ctx, x, y, 0.55, { t, flame: 0.7, rot: st * 4, pilot: true });
      }
    } else {
      World.bg(ctx, t);
      if (i === 2) {
        const k = Math.min(1, st / 2.2), y = M.lerp(-100, World.GROUND + 20, G.ease.outQuad(k));
        Art.rocket(ctx, 380, y, 0.75, { t, flame: k < 1 ? 1 : 0, glowBase: k >= 1 });
        if (k >= 1 && !this.dust) { this.dust = true; G.burst(380, World.GROUND + 10, { kind: 'smoke', n: 20, colors: ['#ffffff', '#ffd6f0'], g: -20, speed: 200, size: 18 }); Sound.bump(); }
        Art.bush(ctx, 820, 580, 1.1, '#ff7eb6', t);
      } else {
        this.dust = false;
        Art.rocket(ctx, 200, World.GROUND + 20, 0.75, { t, glowBase: true });
        if (i === 3) {
          const k = M.clamp((st - 0.6) / 1.2, 0, 1);
          Art.astronaut(ctx, 470, 610, 1.1, { t });
          Art.dragon(ctx, 820, 600 + (1 - k) * 160, 0.75, { t, level: 1, look: -0.6, tilt: -0.15, blink: (t % 3 < 0.15) ? 1 : 0 });
          Art.bush(ctx, 820, 620, 1.25, '#ff7eb6', t * 4 * (1 - k));
          if (st > 1.6) { ctx.save(); ctx.globalAlpha = 0.85; UI.text(ctx, '?', 900, 300, 70, '#fff', 'center', true); ctx.restore(); }
        } else if (i === 4) {
          const eat = st > 1.2;
          Art.astronaut(ctx, 520, 610, 1.1, { t, holding: eat ? null : 0, wave: !eat });
          Art.dragon(ctx, 720, 600, 0.8, { t, level: 1, look: -0.5, happy: eat, mouth: !eat && st > 0.6 ? 0.8 : (eat && st < 2 ? Math.abs(Math.sin(st * 12)) * 0.5 : 0), squash: eat ? Math.sin(st * 10) * 0.2 * Math.max(0, 1 - (st - 1.2)) : 0 });
          if (eat && !this.purred) { this.purred = true; Sound.chomp(); setTimeout(() => Sound.purr(2), 500); }
        } else if (i === 5) {
          this.purred = false;
          Art.astronaut(ctx, 560, 610, 1.1, { t, flip: false });
          Art.dragon(ctx, 760, 600, 0.8, { t, level: 1, look: 1, blink: (t % 4 < 0.15) ? 1 : 0 });
          ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
          ctx.beginPath(); ctx.arc(1150, 355, 60, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd23f'; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }
    // субтитры для родителей
    const s = this.slides[i];
    if (s) {
      ctx.save();
      ctx.font = 'bold 30px ' + UI.font;
      const lines = wrap(ctx, s.text, 980);
      const h = lines.length * 40 + 30;
      Art.rr(ctx, 120, G.H - h - 18, 1000, h, 26); ctx.fillStyle = 'rgba(30,14,70,0.72)'; ctx.fill();
      lines.forEach((ln, k) => UI.text(ctx, ln, 620, G.H - h + 4 + k * 40 + 18, 30, '#fff', 'center', false));
      ctx.restore();
    }
    // точки-страницы
    for (let k = 0; k < this.slides.length; k++) Art.ell(ctx, 640 - (this.slides.length - 1) * 15 + k * 30, 40, 8, 8, k === i ? '#ffd23f' : 'rgba(255,255,255,0.4)');
  },
};

function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
