// Обед: положи на тарелку то, что хочет дракончик (и столько, сколько он просит)
'use strict';
// как сказать «N штук» в винительном падеже: [1, 2, 3]
const FOOD_SAY = {
  apple: ['одно яблоко', 'два яблока', 'три яблока'], carrot: ['одну морковку', 'две морковки', 'три морковки'],
  candy: ['одну конфету', 'две конфеты', 'три конфеты'], cookie: ['одно печенье', 'два печенья', 'три печенья'],
  cheese: ['один кусочек сыра', 'два кусочка сыра', 'три кусочка сыра'], banana: ['один банан', 'два банана', 'три банана'],
};
G.scenes.lunch = {
  enter(args) {
    this.id = (args && args.id) || buddy();
    UI.homeButton(this);
    this.round = 0; this.rounds = 3;
    this.tray = Art.FOODS.map((f, i) => ({ type: i, x: 130 + (i % 3) * 150, y: 450 + Math.floor(i / 3) * 140 }));
    this.plate = { x: 760, y: 590 };
    this.drag = null; this.onPlate = []; this.eating = false; this.mouth = 0; this.happy = 0; this.shake = 0;
    this.newRound(true);
  },
  newRound(first) {
    const types = M.shuffle([0, 1, 2, 3, 4, 5]).slice(0, this.round === 0 ? 1 : 2);
    this.want = types.map(tp => ({ type: tp, n: M.ri(1, this.round === 0 ? 2 : (types.length > 1 ? 2 : 3)) }));
    this.onPlate = []; this.eating = false;
    const parts = this.want.map((w, i) => (i ? 'И ещё ' : 'Положи на тарелку ') + FOOD_SAY[Art.FOODS[w.type]][w.n - 1] + '.');
    Voice.say((first ? Care.name(this.id) + ' проголодался! ' : '') + parts.join(' '));
  },
  count(type) { return this.onPlate.filter(p => p.type === type).length; },
  down(x, y) {
    if (this.eating) return;
    for (const f of this.tray) if (Math.hypot(x - f.x, y - f.y) < 60) { this.drag = { type: f.type, x, y, fx: f.x, fy: f.y }; Sound.pop(1.1); return; }
    if (x > 900 && y > 300) { Sound.purr(0.8, { dragon: this.id }); this.happy = 0.8; }
  },
  move(x, y) { if (this.drag) { this.drag.x = x; this.drag.y = y; } },
  up(x, y) {
    const d = this.drag; this.drag = null; if (!d) return;
    if (Math.hypot(x - this.plate.x, y - this.plate.y) > 130) return;
    const w = this.want.find(w => w.type === d.type);
    if (!w) { Sound.bump(); this.shake = 0.6; Voice.say('Нет, это не то! Посмотри в облачко.'); return; }
    if (this.count(d.type) >= w.n) { Sound.bump(); this.shake = 0.6; Voice.say('Хватит, больше не надо!'); return; }
    const k = this.onPlate.length;
    this.onPlate.push({ type: d.type, x: this.plate.x - 60 + (k % 3) * 60, y: this.plate.y - 14 - Math.floor(k / 3) * 26 });
    Sound.coin();
    Voice.say(VoiceNumbers[this.count(d.type)] || '');
    if (this.want.every(w => this.count(w.type) === w.n)) this.eat();
  },
  eat() {
    this.eating = true;
    G.wait(0.8, () => {
      Voice.say(M.pick(['Ням-ням! Спасибо!', 'Вкуснятина!', 'Мур-р! Как вкусно!']));
      const items = this.onPlate.slice();
      items.forEach((it, i) => G.wait(i * 0.45, () => {
        this.mouth = 1;
        G.tween(it, { x: 1040, y: 380 }, 0.35, G.ease.inQuad, () => {
          it.gone = true; Sound.chomp(); this.mouth = 0.3;
          G.burst(1040, 380, { kind: 'star', n: 6, speed: 150, size: 10 });
        });
      }));
      G.wait(items.length * 0.45 + 0.8, () => {
        this.mouth = 0; this.happy = 2; Sound.purr(1.5, { dragon: this.id });
        this.round++;
        if (this.round >= this.rounds) return this.finish();
        G.wait(1.6, () => this.newRound());
      });
    });
  },
  finish() {
    Care.add(this.id, 'food', 50); Care.add(this.id, 'fun', 5); stat('lunch');
    Sound.win(); UI.reward(2, 1040, 400);
    Voice.say(Care.name(this.id) + ' наелся! Спасибо, что накормил!');
    G.burst(1040, 380, { kind: 'heart', n: 16, colors: ['#ff5e9a', '#ff9ad5'], up: true, speed: 260, size: 22 });
    G.wait(4, () => { if (G.scene === this) G.go('home'); });
  },
  update(dt) {
    this.happy = Math.max(0, this.happy - dt); this.shake = Math.max(0, this.shake - dt);
    if (!this.eating && this.mouth > 0) this.mouth = Math.max(0, this.mouth - dt * 2);
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, {});
    // стол
    Art.rr(ctx, G.view.x0 - 20, 380, 640 - G.view.x0, 400, 30); ctx.fillStyle = '#c8885a'; ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 5; i++) ctx.fillRect(G.view.x0, 420 + i * 60, 640 - G.view.x0, 3);
    for (const f of this.tray) { Art.ell(ctx, f.x, f.y + 34, 48, 12, 'rgba(0,0,0,0.15)'); Art.food(ctx, f.type, f.x, f.y, 1.25 + Math.sin(t * 3 + f.type) * 0.03); }
    // дракончик и тарелка
    const sh = this.shake > 0 ? Math.sin(this.shake * 40) * 0.25 : 0;
    Art.dragon(ctx, 1040, 650, 0.8, { kind: this.id, t, mouth: Math.max(this.mouth, this.drag ? 0.5 : 0), happy: this.happy > 0 && this.mouth < 0.1, look: this.drag ? M.clamp((this.drag.x - 1040) / 300, -1, 1) : -0.6, tilt: sh, blink: (t % 3.3) < 0.13 ? 1 : 0 });
    ctx.save(); ctx.translate(this.plate.x, this.plate.y);
    Art.ell(ctx, 0, 10, 140, 34, 'rgba(0,0,0,0.15)'); Art.ell(ctx, 0, 0, 140, 36, '#ffffff'); Art.ell(ctx, 0, 0, 104, 24, '#eef2fa');
    ctx.restore();
    for (const p of this.onPlate) if (!p.gone) Art.food(ctx, p.type, p.x, p.y, 0.9);
    // облачко-заказ
    if (!this.eating) {
      const bx = 900, by = 150, w = 120 * this.want.length + 40;
      Art.ell(ctx, 1000, 300, 10, 10, '#fff'); Art.ell(ctx, 970, 255, 15, 15, '#fff');
      Art.rr(ctx, bx - w / 2, by - 70, w, 140, 60); ctx.fillStyle = '#fff'; ctx.fill();
      this.want.forEach((wt, i) => {
        const cx = bx - w / 2 + 80 + i * 120;
        Art.food(ctx, wt.type, cx - 10, by - 10, 0.9);
        const done = this.count(wt.type);
        for (let k = 0; k < wt.n; k++) Art.ell(ctx, cx - 22 + k * 20, by + 44, 8, 8, k < done ? '#41d982' : '#d8d0e8');
      });
    }
    if (this.drag) Art.food(ctx, this.drag.type, this.drag.x, this.drag.y, 1.35);
    UI.text(ctx, 'Обед ' + Math.min(this.round + 1, this.rounds) + ' из ' + this.rounds, 640, 60, 32, '#fff', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
const VoiceNumbers = ['', 'Один!', 'Два!', 'Три!'];
