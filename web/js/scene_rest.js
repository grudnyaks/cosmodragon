// Перерыв: дракончик спит, ребёнку предлагают подвигаться и отдохнуть от экрана
'use strict';
const REST_TIPS = ['Давай сделаем зарядку: попрыгай пять раз, как зайчик!', 'Потянись высоко-высоко, до самых звёзд!',
  'Покружись, как ракета перед полётом!', 'Попей водички, как дракончик после полёта.', 'Посмотри в окно: что там интересного?',
  'Пройдись на цыпочках, тихо-тихо, чтобы не разбудить дракона.', 'Помаши руками, как дракон крыльями!'];
G.scenes.rest = {
  enter() {
    const d = S.data;
    if (!d.restUntil || d.restUntil < Date.now()) { d.restUntil = Date.now() + 5 * 60 * 1000; S.save(); }
    this.hold = 0; this.tip = 0; this.nextTip = 0;
    this.zz = [];
    Voice.say('Дракончик устал и уснул. Давай и мы отдохнём немножко! ' + REST_TIPS[0]);
    this.nextTip = G.t + 25;
  },
  down(x, y) { if (Math.hypot(x - (G.view.x1 - 80), y - 80) < 60) this.holding = true; },
  up() { this.holding = false; this.hold = 0; },
  finish() {
    S.data.restUntil = 0; S.data.playSec = 0; S.save();
    G.go('home');
  },
  update(dt) {
    if (this.holding) { this.hold += dt; if (this.hold >= 3) { this.holding = false; this.finish(); return; } } // взрослый держит луну 3 секунды
    if (Date.now() >= S.data.restUntil && !this.awake) { this.awake = true; Sound.chime(1.2); Voice.say('Дракончик проснулся и снова готов играть!'); setTimeout(() => this.finish(), 3500); }
    if (G.t > this.nextTip && !this.awake) { this.tip = (this.tip + 1) % REST_TIPS.length; Voice.say(REST_TIPS[this.tip]); this.nextTip = G.t + 30; }
    if (Math.random() < dt * 1.2) this.zz.push({ x: 700, y: 430, age: 0 });
    for (const z of this.zz) z.age += dt;
    this.zz = this.zz.filter(z => z.age < 3);
  },
  draw(ctx) {
    const t = G.t, v = G.view;
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, '#05031e'); g.addColorStop(1, '#2a1a6e');
    ctx.fillStyle = g; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    Art.stars(ctx, 13, 160, t * 0.4);
    ctx.save(); ctx.globalAlpha = 0.25; Art.ell(ctx, 1060, 400, 120, 120, '#fff8d0'); ctx.restore(); Art.ell(ctx, 1060, 400, 60, 60, '#fff3c0');
    ctx.fillStyle = '#1a2a4a'; ctx.beginPath(); ctx.ellipse(640, 760, 900, 200, 0, 0, Math.PI * 2); ctx.fill();
    const awake = this.awake;
    Art.dragon(ctx, 640, 600, 0.85, { t, blink: awake ? 0 : 1, happy: awake, squash: Math.sin(t * 1.5) * 0.06, flap: 0 });
    for (const z of this.zz) { ctx.save(); ctx.globalAlpha = 1 - z.age / 3; UI.text(ctx, 'z', z.x + z.age * 30 + Math.sin(z.age * 3) * 10, z.y - z.age * 60, 30 + z.age * 12, '#d6ecff', 'center', true); ctx.restore(); }
    const left = Math.max(0, Math.ceil((S.data.restUntil - Date.now()) / 1000));
    UI.text(ctx, awake ? 'Доброе утро!' : 'Тс-с… дракончик спит', 640, 110, 52, '#ffd6f0', 'center', true);
    if (!awake) {
      UI.text(ctx, REST_TIPS[this.tip], 640, 180, 28, '#ffffff', 'center', true);
      UI.text(ctx, 'Проснётся через ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'), 640, 240, 32, '#ffe9a0', 'center', true);
    }
    // кнопка для взрослых: держать 3 секунды
    const bx = G.view.x1 - 80;
    Art.ell(ctx, bx, 80, 44, 44, 'rgba(60,40,110,0.9)'); Art.stroke(ctx, 3);
    Art.icon(ctx, 'moon', bx, 80, 0.9);
    if (this.hold > 0) { ctx.beginPath(); ctx.arc(bx, 80, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.hold / 3); Art.stroke(ctx, 7, '#ffd23f'); }
    ctx.save(); ctx.globalAlpha = 0.6; UI.text(ctx, 'взрослым: держать 3 сек', bx - 40, 140, 16, '#d6ecff', 'center', false); ctx.restore();
  },
};
