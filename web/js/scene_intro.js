// Сюжетные вступления: для Ням-Ням — история знакомства, для остальных планет — прилёт и яйцо
'use strict';
const NYAM_SLIDES = [
  { kind: 'space', text: 'Жил-был отважный космонавт. Однажды он полетел на своей ракете к далёким звёздам.' },
  { kind: 'meteors', text: 'Вдруг — метеоритный дождь! Ракета закружилась и полетела к незнакомой планете.' },
  { kind: 'land', text: 'Бум! Ракета приземлилась на планете Ням-Ням. Тут растут конфетные кусты и светятся грибы.' },
  { kind: 'peek', text: 'Из кустов выглянул маленький дракончик Дракоша. Он был грустный и голодный: метеоритная буря разбросала все вкусняшки.' },
  { kind: 'friends', text: 'Космонавт угостил дракончика вкусняшкой. Мур-р-р! Так они стали друзьями.' },
  { kind: 'beacon', text: 'Видишь Звёздный маяк? Буря его погасила. Корми Дракошу — он вырастет большим и снова зажжёт маяк! А луч маяка покажет дорогу к новым планетам.' },
  { kind: 'serpent', text: 'Но берегись: по планетам ползает злой Змей. Он похищает подросших дракончиков! Если такое случится — выигрывай игры, найди три ключа и спаси друга.' },
];
G.scenes.intro = {
  enter(args) {
    this.pid = args.planet || S.data.planet;
    if (this.pid !== S.data.planet) { S.data.planet = this.pid; S.save(); }
    const pd = PLANET_BY_ID[this.pid];
    this.slides = pd.intro ? [{ kind: 'land', text: pd.intro[0] }, { kind: 'egg', text: pd.intro[1] }] : NYAM_SLIDES;
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
      World.bg(ctx, t, { planet: this.pid });
      if (s.kind === 'land') {
        const k = Math.min(1, st / 2.2), y = M.lerp(-100, World.GROUND + 20, G.ease.outQuad(k));
        Art.rocket(ctx, 380, y, 0.75, { t, flame: k < 1 ? 1 : 0, glowBase: k >= 1, pilot: true });
        if (k >= 1 && !this.dust) { this.dust = true; G.burst(380, World.GROUND + 10, { kind: 'smoke', n: 20, colors: ['#ffffff', '#ffd6f0'], g: -20, speed: 200, size: 18 }); Sound.bump(); }
        if (k >= 1) Art.astronaut(ctx, 560, 610, 1.1, { t, anim: 'cheer', at: st });
      } else if (s.kind === 'egg') {
        Art.rocket(ctx, 200, World.GROUND + 20, 0.75, { t, glowBase: true });
        Art.astronaut(ctx, 470, 610, 1.1, { t, anim: st < 2 ? 'idle' : 'wave', at: st, look: 1 });
        Art.egg(ctx, 720, 610, 0.9, this.pid, { t, crack: 0 });
        if (st > 1) Art.sparkle(ctx, 760, 430, 20, '#ffffff', 0.5 + Math.sin(t * 5) * 0.4);
        if (pd.special === 'thief' && st > 2.5) Art.thief(ctx, 1080 - Math.min(80, (st - 2.5) * 60), 620, 0.9, t, {});
        if (pd.special === 'serpent' && st > 2.5) { ctx.save(); ctx.globalAlpha = Math.min(1, st - 2.5); for (const side of [-1, 1]) { Art.ell(ctx, 1040 + side * 26, 520, 14, 9, '#ffe14a'); Art.ell(ctx, 1040 + side * 26, 520, 3, 8, '#1a1030'); } ctx.restore(); World.bigLeaf(ctx, 1040, 640, 0.9, 0); }
      } else {
        Art.rocket(ctx, 200, World.GROUND + 20, 0.75, { t, glowBase: true });
        if (s.kind === 'peek') {
          const k = M.clamp((st - 0.6) / 1.2, 0, 1);
          Art.astronaut(ctx, 470, 610, 1.1, { t, look: 1 });
          Art.dragon(ctx, 820, 600 + (1 - k) * 160, 0.75, { t, planet: 'nyam', level: 1, look: -0.6, tilt: -0.15, blink: (t % 3 < 0.15) ? 1 : 0 });
          Art.bush(ctx, 820, 620, 1.25, '#ff7eb6', t * 4 * (1 - k));
          if (st > 1.6) { ctx.save(); ctx.globalAlpha = 0.85; UI.text(ctx, '?', 900, 300, 70, '#fff', 'center', true); ctx.restore(); }
        } else if (s.kind === 'friends') {
          const eat = st > 1.2;
          Art.astronaut(ctx, 520, 610, 1.1, { t, holding: eat ? null : 0, anim: eat ? 'cheer' : 'wave', at: st });
          Art.dragon(ctx, 740, 600, 0.8, { t, planet: 'nyam', level: 1, look: -0.5, happy: eat, mouth: !eat && st > 0.6 ? 0.8 : (eat && st < 2 ? Math.abs(Math.sin(st * 12)) * 0.5 : 0), squash: eat ? Math.sin(st * 10) * 0.2 * Math.max(0, 1 - (st - 1.2)) : 0 });
          if (eat && !this.purred) { this.purred = true; Sound.chomp(); setTimeout(() => Sound.purr(2, { planet: 'nyam' }), 500); }
        } else if (s.kind === 'serpent') {
          Art.astronaut(ctx, 470, 610, 1.1, { t, look: 1, anim: st > 2 ? 'salute' : 'idle', at: st });
          Art.dragon(ctx, 660, 600, 0.75, { t, planet: 'nyam', level: 2, look: 1, tilt: -0.1, blink: (t % 3 < 0.15) ? 1 : 0 });
          const hx = M.lerp(1400, 900, M.clamp(st / 2, 0, 1)), pts = [];
          for (let i = 0; i < 24; i++) pts.push([hx + i * 26, 470 + Math.sin(t * 3 - i * 0.5) * 18]);
          Art.serpent(ctx, pts, t, { open: Math.sin(t * 3) > 0.4, r: 36 });
          if (st > 1 && !this.hissed) { this.hissed = true; Sound.hiss(); }
        } else if (s.kind === 'beacon') {
          Art.astronaut(ctx, 560, 610, 1.1, { t, look: 1 });
          Art.dragon(ctx, 760, 600, 0.8, { t, planet: 'nyam', level: 1, look: 1, blink: (t % 4 < 0.15) ? 1 : 0 });
          ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
          ctx.beginPath(); ctx.arc(1150, 355, 60, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd23f'; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }
    // субтитры для родителей
    ctx.save();
    ctx.font = 'bold 28px ' + UI.font;
    const lines = wrap(ctx, s.text, 980);
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
