// Сюжет «Ракета — это яйцо»: с каждым зажжённым маяком ракета всё больше похожа на яйцо —
// стучит, трескается, светится, мурлычет. Когда горят все 12 маяков, из неё вылупляется звёздный дракон Космик,
// и дальше космонавт летает на нём.
'use strict';
const EGG_HINTS = [
  null,
  ['Тук-тук… Ты слышал? В ракете кто-то стучит!', 'Ракета чуть-чуть качнулась. Странно…'],
  ['Ой, на ракете трещинка! Откуда она взялась?', 'Тук-тук… Опять кто-то стучит внутри ракеты!'],
  ['Трещинка стала длиннее. Может, ракета ударилась о метеорит?', 'Потрогай ракету: она тёплая! Тёплая, как печка.'],
  ['Ракета тёплая, а внутри: тук-тук, тук-тук. Как будто бьётся сердечко!', 'Трещинок всё больше… Что же там такое?'],
  ['Слышишь? Ракета сопит во сне! Хр-р… хр-р…', 'Ракета снова качнулась. Как будто кто-то внутри потягивается!'],
  ['Тук-тук-тук! Стук стал громче. Кто-то очень хочет выбраться!', 'Ракета тёплая-претёплая. Может, ей нравится свет маяков?'],
  ['Смотри! Из трещинок пробивается свет!', 'Внутри ракеты что-то светится. Что же это?'],
  ['Свет из трещинок мигает в такт: тук-тук, тук-тук…', 'Ракета чихнула искорками! Апчхи!'],
  ['Ракета мурлычет! Совсем как дракончик…', 'Мур-р-р… Это урчит не Дракоша. Это урчит ракета!'],
  ['Ракета вся в трещинках и светится! Наверное, скоро что-то случится!', 'Мур-р-р! Ракета урчит громче всех дракончиков!'],
  ['Осталось зажечь всего один маяк. Ракета дрожит от нетерпения!', 'Кажется, ракета ждёт, когда загорятся все маяки…'],
  ['Все маяки горят! Ракета дрожит!'],
];
// подсказки Шипуна: он ведь летает внутри ракеты
const EGG_SNAKE = [
  null, null, null,
  'Ш-ш-ш! Пока мы летели, в ракете кто-то сопел. И это был не я!',
  'Ш-ш-ш! В ракете так тепло, что я всю дорогу дремал. Только кто-то мне спать мешал: тук-тук!',
  'Ш-ш-ш! Я нашёл в ракете тёплую круглую стенку. Она шевелится!',
  'Ш-ш-ш! В ракете кто-то урчит, когда видит свет маяка.',
  'Ш-ш-ш! Из стенок ракеты светит свет. Я боюсь… немножко.',
  'Ш-ш-ш! Ракета сегодня всю дорогу мурлыкала. Ракеты так умеют?',
  'Ш-ш-ш! Если приложить ухо к ракете, слышно: тук-тук, тук-тук. Как сердечко!',
  'Ш-ш-ш! Трещины в ракете всё больше. Может, она… живая?',
  'Ш-ш-ш! Я понял! Ракета ждёт последний маяк!',
  null,
];
const EGG_HATCH = [
  { who: 'narrator', text: 'Все двенадцать маяков горят! Смотри, что творится с ракетой!' },
  { who: 'narrator', text: 'Ракета трясётся и трескается! Помоги ей: стучи по ракете — тук-тук!', tap: true },
  { who: 'kosmik', text: 'Апчхи! Ой… Привет! Я Космик, звёздный дракон!' },
  { who: 'narrator', text: 'Ракета была не ракетой, а яйцом звёздного дракона! Свет всех маяков согрел его, и малыш вылупился.' },
  { who: 'snake', text: 'Ш-ш-ш! Так вот кто сопел и урчал! А я ведь летал прямо внутри яйца!' },
  { who: 'kosmik', text: 'Ты возил меня по всей галактике, пока я спал. Теперь я буду возить тебя! Садись мне на спину!' },
  { who: 'narrator', text: 'Теперь космонавт путешествует на звёздном драконе Космике!' },
];
const Egg = {
  data() { if (!S.data.egg) S.data.egg = { hatched: false }; return S.data.egg; },
  stage() { return Math.min(12, PLANETS.filter(p => S.data.planets[p.id].beacon).length); },
  hatched() { return !!this.data().hatched; },
  due() { return !this.hatched() && this.stage() >= 12; },
  hint() { const h = EGG_HINTS[this.stage()]; return h ? M.pick(h) : null; },
  // тексты прилёта: после вылупления летаем не на ракете, а на Космике
  text(s) {
    if (!this.hatched() || !s) return s;
    return s.replace('Ракета мягко села', 'Космик мягко сел').replace(/Ракета (\S+?)лась/g, 'Космик $1лся').replace(/Ракета (\S+?)ла/g, 'Космик $1л').replace(/ракету/g, 'Космика');
  },
  snake() { return this.hatched() ? null : EGG_SNAKE[this.stage()] || null; },
  // ракета или Космик с космонавтом на спине — для карты и прилёта
  ride(ctx, x, y, s, t, o) {
    o = o || {};
    if (!this.hatched()) { Art.rocket(ctx, x, y, s, Object.assign({ t, egg: this.stage() }, o)); return; }
    ctx.save(); ctx.translate(x, y); ctx.rotate((o.rot || 0) * 0.3);
    const k = s / 0.8;
    Art.dragon(ctx, 0, 0, 0.62 * k, { kind: 'kosmik', t, flying: !!o.flame, lift: 0, happy: true, look: 1 });
    if (o.rider !== false) Art.astronaut(ctx, -6 * k, -150 * k, 0.42 * k, { t, anim: o.flame ? 'cheer' : 'idle', at: t });
    ctx.restore();
  },
};
// трещины на ракете (в координатах ракеты)
const EGG_CRACKS = [
  [[-30, -90], [-14, -104], [-20, -122], [-4, -134]],
  [[30, -200], [14, -212], [22, -228], [8, -240]],
  [[-37, -300], [-22, -308], [-28, -326], [-12, -336]],
  [[37, -380], [20, -386], [24, -402], [8, -412]],
  [[-30, -40], [-12, -52], [-18, -70], [2, -78], [-4, -96]],
  [[30, -140], [10, -150], [16, -170], [-2, -178], [4, -196]],
  [[-37, -260], [-16, -270], [-24, -290], [-2, -296]],
  [[37, -330], [16, -338], [22, -352], [2, -362]],
  [[-30, -220], [-8, -226], [-14, -246], [10, -252], [4, -272]],
  [[30, -60], [6, -66], [12, -86], [-12, -92]],
];
(function () {
  const old = Art.rocket;
  Art.rocket = function (ctx, x, y, s, o) {
    o = o || {};
    const st = o.egg || 0, t = o.t || 0;
    if (!st) return old(ctx, x, y, s, o);
    // покачивание: сначала редкое, потом чаще
    const per = Math.max(2.5, 8 - st * 0.5), ph = (t % per) / per;
    const wob = ph < 0.08 ? Math.sin(ph / 0.08 * Math.PI * 4) * (0.02 + st * 0.004) : 0;
    const o2 = Object.assign({}, o, { rot: (o.rot || 0) + wob + (o.shake || 0) * Math.sin(t * 50) * 0.04 });
    // тепло вокруг ракеты
    if (st >= 3) { ctx.save(); ctx.globalAlpha = Math.min(0.35, (st - 2) * 0.04) * (0.8 + Math.sin(t * 2.5) * 0.2); Art.ell(ctx, x, y - 220 * s, 150 * s, 260 * s); ctx.fillStyle = Art.rg(ctx, x, y - 220 * s, 260 * s, '#ffd28a', 'rgba(255,210,138,0)', 0, 0); ctx.fill(); ctx.restore(); }
    old(ctx, x, y, s, o2);
    ctx.save(); ctx.translate(x, y); ctx.rotate(o2.rot || 0); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const n = Math.min(EGG_CRACKS.length, Math.ceil((st - 1) * 0.9) + (st >= 2 ? 1 : 0));
    const glow = st >= 7, beat = 0.6 + 0.4 * Math.abs(Math.sin(t * 3.2));
    for (let i = 0; i < n; i++) {
      const c = EGG_CRACKS[i];
      const path = () => { ctx.beginPath(); c.forEach(([px, py], k) => k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); };
      if (glow) { ctx.save(); ctx.globalAlpha = 0.5 * beat * Math.min(1, (st - 6) / 4); path(); ctx.lineWidth = 14; ctx.strokeStyle = '#fff3a0'; ctx.stroke(); ctx.restore(); }
      path(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#3a2a4a'; ctx.stroke();
      if (glow) { path(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#fff8c0'; ctx.stroke(); }
    }
    // в иллюминаторе — глаз, который иногда моргает (с 9-го маяка)
    if (st >= 9 && Math.sin(t * 0.9) > 0.55) { Art.ell(ctx, 0, -320, 13, 13, '#2a1e8a'); Art.ell(ctx, 0, -320, 9, 11, '#7ee8ff'); Art.ell(ctx, 0, -320, 3, 9, '#0a0a2a'); Art.ell(ctx, -3, -324, 2.5, 2.5, '#ffffff'); }
    ctx.restore();
  };
})();

// Сцена вылупления Космика
G.scenes.hatch = {
  enter() {
    this.slides = EGG_HATCH; this.i = 0; this.st = 0; this.taps = 0; this.need = 6; this.k = 0; this.shake = 0.2; this.shells = [];
    this.nextBtn = UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    Sound.rumble(2); this.say();
  },
  say() { const s = this.slides[this.i]; Voice.say(s.text); if (s.who === 'snake') Sound.hiss(); if (s.who === 'kosmik') Sound.purr(1.5, { dragon: 'kosmik' }); },
  next() {
    if (G.fadeDir) return;
    if (this.slides[this.i].tap && this.k < 1) { Voice.say('Стучи по ракете!'); return; }
    this.i++; this.st = 0;
    if (this.i >= this.slides.length) { Voice.stop(); G.go('home'); return; }
    this.say();
  },
  down(x, y) {
    const s = this.slides[this.i];
    if (!s || !s.tap || this.k >= 1) return;
    if (Math.abs(x - 640) > 160 || y < 120 || y > 660) return;
    this.taps++; this.shake = 1; Sound.bump(); Sound.chime(0.7 + this.taps * 0.1);
    G.burst(x, y, { kind: 'star', n: 8, speed: 200 });
    for (let i = 0; i < 2; i++) this.shells.push({ x: 640 + M.rnd(-50, 50), y: M.rnd(250, 550), vx: M.rnd(-300, 300), vy: M.rnd(-500, -200), r: M.rnd(0, 6), vr: M.rnd(-6, 6), s: M.rnd(14, 30) });
    if (this.taps >= this.need) {
      this.hatchNow();
    }
  },
  hatchNow() {
    Sound.magic(); Sound.win();
    const e = Egg.data(); e.hatched = true; S.save(); stat('hatched');
    for (let i = 0; i < 18; i++) this.shells.push({ x: 640 + M.rnd(-60, 60), y: M.rnd(200, 600), vx: M.rnd(-600, 600), vy: M.rnd(-800, -300), r: M.rnd(0, 6), vr: M.rnd(-8, 8), s: M.rnd(20, 44) });
    G.tween(this, { k: 1 }, 1.2, G.ease.outBack);
    for (let i = 0; i < 6; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(120, 420), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    G.wait(1.6, () => this.next());
  },
  update(dt) {
    this.st += dt; this.shake = Math.max(0.15, this.shake - dt * 2);
    for (const p of this.shells) { p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; }
    this.shells = this.shells.filter(p => p.y < 800);
  },
  draw(ctx) {
    const t = G.t, s = this.slides[Math.min(this.i, this.slides.length - 1)];
    World.bg(ctx, t, { noBeacon: true, bright: true });
    // лучи маяков сходятся на ракете
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 2) * 0.05;
    for (let i = 0; i < 12; i++) { const a = -Math.PI + (i + 0.5) * Math.PI / 12; ctx.beginPath(); ctx.moveTo(640, 380); ctx.lineTo(640 + Math.cos(a) * 900, 380 + Math.sin(a) * 900); ctx.lineWidth = 26; ctx.strokeStyle = PLANETS[i].beacon[0]; ctx.stroke(); }
    ctx.restore();
    if (this.k < 1) {
      ctx.save(); ctx.globalAlpha = 1 - this.k;
      Art.rocket(ctx, 640, 640, 1.05 + this.taps * 0.01, { t, egg: 12, shake: this.shake });
      ctx.restore();
    }
    if (this.k > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.k * 1.5);
      Art.dragon(ctx, 640, 650, 0.6 + this.k * 0.35, { kind: 'kosmik', t, happy: true, mouth: s.who === 'kosmik' && this.st < 3 && Math.sin(t * 14) > 0 ? 0.4 : 0 });
      ctx.restore();
    }
    for (const p of this.shells) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.beginPath(); ctx.moveTo(-p.s, 0); ctx.lineTo(-p.s * 0.3, -p.s * 0.7); ctx.lineTo(p.s * 0.5, -p.s * 0.4); ctx.lineTo(p.s, p.s * 0.3); ctx.lineTo(0, p.s * 0.5); ctx.closePath(); ctx.fillStyle = '#eef0f8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#6a6e8a'; ctx.stroke(); ctx.restore(); }
    if (this.i >= 4) Art.serpentCoil(ctx, 1080, 650, 0.5, t, { open: s.who === 'snake' && this.st < 3 && Math.sin(t * 14) > 0, friend: V().friend });
    Art.astronaut(ctx, 300, 650, 1, { t, anim: this.k > 0 ? 'cheer' : 'idle', at: t });
    // реплика
    const who = s.who, bg = who === 'kosmik' ? 'rgba(42,30,138,0.94)' : who === 'snake' ? 'rgba(40,12,60,0.92)' : 'rgba(255,255,255,0.94)';
    Art.rr(ctx, 140, 30, 1000, 140, 34); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = who === 'kosmik' ? '#ffd23f' : '#8f6cf2'; ctx.stroke();
    if (who !== 'narrator') UI.text(ctx, who === 'kosmik' ? 'Космик' : 'Змей Шипун', 180, 58, 24, who === 'kosmik' ? '#ffd23f' : '#c8e05a', 'left', false);
    UI.wrap(ctx, s.text, 640, 104, 920, 28, who === 'narrator' ? '#3a2a6a' : '#ffffff', 34);
    if (s.tap && this.k < 1) { UI.progress(ctx, 440, 190, 400, 30, this.taps / this.need, '#ffd23f'); }
  },
};
