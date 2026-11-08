// Сюжетное вступление: космонавт, два дракончика и Змей Шипун
'use strict';
const NYAM_SLIDES = [
  { kind: 'space', text: 'Жил-был отважный космонавт. Однажды он полетел на своей ракете к далёким звёздам.' },
  { kind: 'meteors', text: 'Вдруг — метеоритный дождь! Ракета закружилась и полетела к незнакомой планете.' },
  { kind: 'land', text: 'Бум! Ракета приземлилась на планете Ням-Ням. Тут растут конфетные кусты и светятся грибы.' },
  { kind: 'peek', text: 'Из кустов выглянули два маленьких дракончика: чёрный Дракоша и белый Пушок. Они были голодные: метеоритная буря разбросала все вкусняшки.' },
  { kind: 'friends', text: 'Космонавт угостил дракончиков вкусняшками. Мур-р-р! Так они стали друзьями.' },
  { kind: 'serpent', text: 'Но берегись! За конфетными холмами, в Тёмной пещере, живёт Змей Шипун. Он хочет утащить дракончиков к себе!' },
  { kind: 'play', text: 'Играй в игры, собирай вкусняшки и корми дракончиков. Собери сто вкусняшек — и зажжёшь маяк, а его луч покажет дорогу к новой планете с новыми дракончиками!' },
];
G.scenes.intro = {
  enter(args) {
    this.pid = 'nyam';
    this.slides = NYAM_SLIDES;
    this.i = 0; this.st = 0;
    this.meteors = [];
    for (let i = 0; i < 9; i++) this.meteors.push({ x: M.rnd(1300, 2400), y: M.rnd(-100, 700), r: M.rnd(14, 38), v: M.rnd(300, 520), rot: 0, seed: i + 3 });
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    this.say();
  },
  say() { Voice.say(this.slides[this.i].text); },
  next() {
    this.i++; this.st = 0; this.dust = false; this.purred = false; this.hissed = false;
    if (this.i >= this.slides.length) { S.data.introSeen = true; PS().visited = true; S.save(); Voice.stop(); G.go('home'); return; }
    Sound.whoosh();
    this.say();
  },
  down() { if (this.st > 0.8) this.next(); },
  update(dt) {
    this.st += dt;
    for (const m of this.meteors) { m.x -= m.v * dt; m.y += m.v * 0.35 * dt; m.rot += dt; if (m.x < -200) { m.x = M.rnd(1350, 1800); m.y = M.rnd(-200, 500); } }
    const s = this.slides[this.i];
    if (s && s.kind === 'friends' && Math.floor(this.st * 2) !== Math.floor((this.st - dt) * 2) && this.st < 4)
      G.burst(720, 300, { kind: 'heart', n: 3, colors: ['#ff5e9a', '#ff9ad5'], up: true, g: -60, speed: 120 });
  },
  draw(ctx) {
    const t = G.t, st = this.st, s = this.slides[this.i] || this.slides[this.slides.length - 1], pd = PLANET_BY_ID[this.pid];
    if (s.kind === 'space' || s.kind === 'meteors') {
      Art.sky(ctx, '#05031e', '#1a1060', '#3a2490'); Art.stars(ctx, 5, 180, t);
      Art.planet(ctx, 1040, 560, 120, '#9ff0e0', '#2a8f8a', 'rgba(255,180,230,0.8)'); Art.planet(ctx, 180, 140, 40, '#ffe0a0', '#ff8a2a');
      if (s.kind === 'space') {
        const x = 300 + Math.sin(t * 0.8) * 40 + st * 30, y = 420 + Math.sin(t * 1.3) * 20;
        ctx.save(); ctx.globalAlpha = 0.25; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 200 - i * 30, y + 60 + i * 30); ctx.lineTo(x - 60 - i * 30, y - 40 + i * 30); Art.stroke(ctx, 3, '#ffffff'); } ctx.restore();
        Art.rocket(ctx, x, y, 0.6, { t, flame: 1, rot: 0.9, pilot: true });
      } else {
        for (const m of this.meteors) Art.obstacle(ctx, 'meteor', m.x, m.y, m.r, m.rot, t, m.seed);
        const x = 640 + Math.sin(st * 2) * 120 + st * 60, y = 360 + Math.cos(st * 3) * 60 + st * 25;
        Art.rocket(ctx, x, y, 0.55, { t, flame: 0.7, rot: st * 4, pilot: true });
      }
    } else {
      World.bg(ctx, t, { noBeacon: true, planet: 'nyam' });
      if (s.kind === 'land') {
        const k = Math.min(1, st / 2.2), y = M.lerp(-100, World.GROUND + 20, G.ease.outQuad(k));
        Art.rocket(ctx, 380, y, 0.75, { t, flame: k < 1 ? 1 : 0, glowBase: k >= 1, pilot: true });
        if (k >= 1 && !this.dust) { this.dust = true; G.burst(380, World.GROUND + 10, { kind: 'smoke', n: 20, colors: ['#ffffff', '#ffd6f0'], g: -20, speed: 200, size: 18 }); Sound.bump(); }
        if (k >= 1) Art.astronaut(ctx, 560, 610, 1.1, { t, anim: 'cheer', at: st });
      } else {
        Art.rocket(ctx, 200, World.GROUND + 20, 0.75, { t, glowBase: true });
        if (s.kind === 'peek') {
          const k = M.clamp((st - 0.6) / 1.2, 0, 1);
          Art.astronaut(ctx, 440, 610, 1.1, { t, look: 1 });
          Art.dragon(ctx, 760, 600 + (1 - k) * 160, 0.66, { kind: 'dark', t, look: -0.6, tilt: -0.15, blink: (t % 3 < 0.15) ? 1 : 0 });
          Art.dragon(ctx, 950, 600 + (1 - M.clamp(k * 1.4 - 0.4, 0, 1)) * 160, 0.66, { kind: 'light', t: t + 1, look: -0.8, tilt: 0.1, blink: (t % 3.4 < 0.15) ? 1 : 0 });
          Art.bush(ctx, 760, 620, 1.2, '#ff7eb6', t * 4 * (1 - k)); Art.bush(ctx, 950, 625, 1.2, '#b07cff', t * 3 * (1 - k));
          if (st > 1.6) { ctx.save(); ctx.globalAlpha = 0.85; UI.text(ctx, '?', 860, 280, 70, '#fff', 'center', true); ctx.restore(); }
        } else if (s.kind === 'friends') {
          const eat = st > 1.2;
          Art.astronaut(ctx, 480, 610, 1.1, { t, holding: eat ? null : 0, anim: eat ? 'cheer' : 'wave', at: st });
          for (const [id, x, ph] of [['dark', 700, 0], ['light', 900, 0.4]]) {
            const e = st > 1.2 + ph;
            Art.dragon(ctx, x, 600, 0.68, { kind: id, t: t + ph, look: -0.5, happy: e, mouth: !e && st > 0.6 ? 0.8 : (e && st < 2.2 + ph ? Math.abs(Math.sin(st * 12)) * 0.5 : 0), squash: e ? Math.sin(st * 10) * 0.2 * Math.max(0, 1 - (st - 1.2 - ph)) : 0 });
          }
          if (eat && !this.purred) { this.purred = true; Sound.chomp(); setTimeout(() => Sound.purr(2, { dragon: 'dark' }), 500); }
        } else if (s.kind === 'serpent') {
          Art.astronaut(ctx, 380, 610, 1.1, { t, look: 1, anim: st > 2 ? 'salute' : 'idle', at: st });
          Art.dragon(ctx, 560, 600, 0.6, { kind: 'dark', t, look: 1, tilt: -0.1, blink: (t % 3 < 0.15) ? 1 : 0 });
          Art.dragon(ctx, 720, 600, 0.6, { kind: 'light', t: t + 1, look: 1, tilt: 0.1, blink: (t % 3.3 < 0.15) ? 1 : 0 });
          Art.lair(ctx, 1090, 612, 1, t, { peek: M.clamp((st - 0.8) / 1, 0, 1), talk: st > 1.5 && Math.sin(t * 10) > 0, eyes: true });
          if (st > 1 && !this.hissed) { this.hissed = true; Sound.hiss(); }
        } else if (s.kind === 'play') {
          Art.astronaut(ctx, 420, 610, 1.1, { t, anim: 'dance', at: st });
          Art.dragon(ctx, 640, 600, 0.66, { kind: 'dark', t, happy: true, flying: true, lift: 40 + Math.sin(st * 3) * 20 });
          Art.dragon(ctx, 860, 600, 0.66, { kind: 'light', t: t + 1, happy: true, flying: true, lift: 40 + Math.sin(st * 3 + 1.5) * 20 });
          for (let i = 0; i < 3; i++) { Art.ell(ctx, 1040 + i * 60, 300, 24, 24, '#ffd23f'); Art.icon(ctx, 'key', 1040 + i * 60, 300, 0.6, t); }
      }
      }
    }
    // субтитры для родителей
    ctx.save();
    ctx.font = 'bold 28px ' + UI.font;
    const lines = wrap(ctx, Care.fill(s.text), 980);
    const h = lines.length * 38 + 28;
    Art.rr(ctx, 120, G.H - h - 18, 1000, h, 26); ctx.fillStyle = 'rgba(30,14,70,0.75)'; ctx.fill();
    lines.forEach((ln, k) => UI.text(ctx, ln, 620, G.H - h + 4 + k * 38 + 18, 28, '#fff', 'center', false));
    ctx.restore();
    for (let k = 0; k < this.slides.length; k++) Art.ell(ctx, 640 - (this.slides.length - 1) * 15 + k * 30, 40, 8, 8, k === this.i ? '#ffd23f' : 'rgba(255,255,255,0.4)');
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
