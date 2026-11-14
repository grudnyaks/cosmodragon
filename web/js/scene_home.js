// Главный экран планеты: её драконы с потребностями (как тамагочи), космонавт, ракета, маяк, игры и пещера Змея Шипуна
'use strict';
const ASTRO_ANIMS = ['wave', 'jump', 'dance', 'salute', 'spin', 'cheer'];
const ASTRO_PHRASES = ['Привет!', 'Полетели за вкусняшками!', 'Дракончики — мои лучшие друзья!', 'Смотри, как я умею!', 'Космос такой большой!',
  'Я самый смелый космонавт!', 'Ура, приключения!', 'Давай поиграем!', 'Мой шлем блестит!', 'Звёзды мне подмигивают!',
  'Кто тут самый весёлый? Я!', 'Здесь так красиво!', 'Опа! Прыжок!', 'На этой планете так интересно!', 'Шипуна я не боюсь!'];
const ROCKET_PHRASES = ['Бортовой компьютер: все системы в норме!', 'Топливо: сто процентов!', 'Ракета готова к полёту!',
  'Проверка двигателей. Отлично!', 'Внимание! Обнаружены вкусняшки!', 'Связь с Землёй установлена!', 'Курс на звёзды проложен!'];
const BEACON_X = 292;
// места драконов: один — по центру, два — рядом
function dragonSpots(ids) { return ids.length > 1 ? [575, 865] : [720]; }
const CAVE_X = 1140;

G.scenes.home = {
  enter() {
    PS().visited = true; Care.tick(); S.save();
    Sound.preload();
    this.redirect = Care.asleep() ? 'sleeping' : null; this.tickT = 0; this.lateAsked = false;
    this.drs = {};
    this.here = PD(); const spots = dragonSpots(this.here);
    this.here.forEach((d, i) => { this.drs[d.id] = { id: d.id, x: spots[i], y: 600, lift: 0, squash: 0, mouth: 0, happyT: 0, fire: 0, flying: false, look: 0, tilt: 0,
      blinkT: M.rnd(1, 4), blink: 0, taps: 0, carried: false }; });
    this.bc = { light: 0 };
    this.as = { anim: 'idle', at: 0, until: 0, phrase: 0 };
    this.rk = { lift: 0, flame: 0, busy: false, act: 0, pilotWave: 0, lights: 0 };
    this.cave = { peek: 0, eyes: 1, talk: 0 };
    this.sp = null; this.cm = null; this.tf = null; this.busy = false; this.feedTurn = 0;
    // 12 игр в нижнем ряду
    const games = P().games.concat([{ scene: 'duo', icon: 'duo', color: '#ff9a3c' }]), n = games.length, step = 91, r = 39;
    const x0 = 640 - (n - 1) * step / 2;
    this.gameBtns = games.map((g, i) => UI.add(this, { x: x0 + i * step, y: 668, r, icon: g.icon, color: g.color, bob: true, iconScale: 1.1,
      onTap: () => { Voice.stop(); G.go(g.scene); } }));
    this.feedBtn = UI.add(this, { x: PD().length > 1 ? 720 : 900, y: 470, r: 44, color: '#ffd23f', draw: (ctx) => Art.treat(ctx, 0, 0, 4, 0.6, G.t), onTap: () => this.feed() });
    // имя и четыре потребности над каждым дракончиком
    this.petUI = {};
    for (const D of this.here) {
      const x = this.drs[D.id].x, ui = this.petUI[D.id] = {};
      ui.name = UI.add(this, { x, y: 330, w: 190, h: 44, label: Care.name(D.id), fontSize: 24, color: Art.mix(D.body, '#5a4a8a', 0.5),
        onTap: () => { Voice.stop(); G.go('name', { id: D.id }); } });
      ui.needs = [];
    }
    const tx = i => G.view.x0 + 52 + i * 78;
    UI.add(this, { x: tx(0), y: 56, r: 33, icon: S.data.music ? 'music' : 'musicOff', color: '#38d6c3', onTap() { Sound.setMusic(!S.data.music); this.icon = S.data.music ? 'music' : 'musicOff'; } });
    this.mapBtn = UI.add(this, { x: tx(1), y: 56, r: 33, icon: 'galaxy', color: '#8f6cf2', onTap: () => { Voice.stop(); G.go('map'); } });
    UI.add(this, { x: tx(2), y: 56, r: 33, icon: 'book', color: '#ff9a3c', onTap: () => { Voice.stop(); G.go('intro'); } });
    UI.add(this, { x: tx(3), y: 56, r: 33, icon: 'snake', color: '#5b3a8c', onTap: () => { Voice.stop(); G.go('story'); } });
    UI.add(this, { x: tx(4), y: 56, r: 33, icon: 'trophy', color: '#ff7eb6', onTap: () => { Voice.stop(); G.go('ach'); } });
    UI.add(this, { x: tx(5), y: 56, r: 33, icon: 'hat', color: '#ffd23f', onTap: () => { Voice.stop(); G.go('wardrobe'); } });
    UI.add(this, { x: tx(6), y: 56, r: 33, icon: 'palette', color: '#41d982', onTap: () => { Voice.stop(); G.go('paint'); } });
    this.bedBtn = UI.add(this, { x: 720, y: 190, w: 380, h: 80, label: 'Уложить спать', icon: 'moon', iconX: -140, fontSize: 30, color: '#5a4ab0', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('sleep', { mode: 'bedtime' }); } });
    this.updBtn = UI.add(this, { x: tx(7), y: 56, r: 33, icon: 'update', color: '#41d982', pulse: true, hidden: !G.updateReady, onTap: () => { if (window.Android && Android.reload) Android.reload(); else location.reload(); } });
    this.rescueBtn = UI.add(this, { x: 640, y: 180, w: 470, h: 84, label: 'Спасти дракончиков!', icon: 'sword', iconX: -185, fontSize: 32, color: '#ff3b5c', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go(V().villain === 'comet' ? 'comet' : 'rescue'); } });
    // маяк планеты
    this.beaconBtn = UI.add(this, { x: 640, y: 180, w: 440, h: 84, label: 'Зажечь маяк!', icon: 'star', iconX: -165, fontSize: 32, color: '#ffb23a', pulse: true, hidden: true, onTap: () => this.lightBeacon() });
    const nx = nextPlanet(P().id);
    this.flyBtn = UI.add(this, { x: 640, y: 180, w: 500, h: 84, label: nx ? 'Лететь: ' + nx.name : '', icon: 'galaxy', iconX: -190, fontSize: 30, color: '#8f6cf2', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('map', { reveal: nx && nx.id }); } });
    // злодеи: Шипун (или Шкода) — по победам; воришка — на дальних планетах
    if (Egg.due()) setTimeout(() => { if (G.scene === this && !this.busy) G.go('hatch'); }, 1200);
    else if (Villain.due() && this.here.length) setTimeout(() => this.kidnap(), 1600);
    else if (typeof Thief !== 'undefined' && Thief.due()) setTimeout(() => Thief.appear(this), 1600);
    else setTimeout(() => this.hello(), 700);
  },
  present() { return this.here.filter(d => !isTaken(d.id) && !this.drs[d.id].carried).map(d => d.id); },
  hello() {
    if (G.scene !== this || this.busy) return;
    const v = V();
    if (v.taken.length) { Voice.say(v.keys >= 3 ? (v.villain === 'comet' ? 'Все звёзды собраны! Нажми на красную кнопку и поймай комету!' : 'Все ключи найдены! Нажми на красную кнопку, чтобы спасти дракончиков!') : Villain.where() + ' ' + Villain.task(v.taken)); return; }
    if (!this.here.length) { Voice.say(typeof Thief !== 'undefined' ? Thief.emptyLine() : 'Гнездо пустое.'); return; }
    const ps = PS();
    if (!ps.beacon && (ps.earned || 0) >= BEACON_GOAL && this.canLight()) { Voice.say('Ты собрал ' + BEACON_GOAL + ' ' + P().treatGen + '! Нажми на кнопку, чтобы зажечь маяк!'); return; }
    if (Care.late()) { this.askBed(); return; }
    for (const D of this.here) { const n = Care.lowest(D.id, 35); if (n) { Voice.say(Care.ask(D.id, n.id)); this.pulseNeed(D.id, n.id); Care.data().lastCall = Date.now(); return; } }
    const nx = nextPlanet(P().id);
    if (ps.beacon && nx && !PS(nx.id).visited) { Voice.say('Маяк сияет! Нажми на кнопку и полетели на планету ' + nx.name + '!'); return; }
    Voice.say(this.here.length > 1 ? 'Привет! Дракончики рады тебя видеть!' : 'Привет! ' + Care.name(this.here[0].id) + ' рад тебя видеть!');
  },
  dragonHit(id, x, y) {
    const d = this.drs[id], s = 0.72;
    return Math.abs(x - d.x) < 100 * s && y < d.y - d.lift + 10 && y > d.y - d.lift - 270 * s;
  },
  down(x, y) {
    if (this.busy) return;
    for (const id of this.present()) if (this.dragonHit(id, x, y)) return this.pet(id);
    if (Math.abs(x - CAVE_X) < 110 && y > 420 && y < 640) return this.tapCave();
    if (Math.abs(x - 390) < 55 && y > 420 && y < 630) return this.tapAstro();
    if (Math.abs(x - BEACON_X) < 50 && y > 300 && y < 530) return this.tapBeacon();
    if (Math.abs(x - 170) < 85 && y > 120 - this.rk.lift && y < 600 - this.rk.lift) return this.tapRocket();
  },
  // ---------- пещера Шипуна ----------
  // нажатие на пещеру — заходим внутрь
  tapCave() {
    const c = this.cave;
    Sound.hiss(); c.peek = 0.01; c.talk = 1;
    G.tween(c, { peek: 1 }, 0.4, G.ease.outBack);
    this.busy = true;
    G.wait(0.7, () => { this.busy = false; Voice.stop(); G.go('lair'); });
  },
  // ---------- маяк ----------
  canLight() { return P().id !== 'night' || T().friend; },
  tapBeacon() {
    const ps = PS(), left = Math.max(0, BEACON_GOAL - (ps.earned || 0));
    Sound.chime(ps.beacon ? 1.2 : 0.7);
    if (ps.beacon) return Voice.say('Маяк сияет! Его луч показывает путь к новой планете.');
    if (!this.canLight()) return Voice.say('Маяк Сумрака не загорается… Кто-то унёс его свет. Может быть, воришка в чёрном шлеме знает, где он?');
    if (!left) return this.lightBeacon();
    Voice.say('Чтобы зажечь маяк, собери ещё ' + left + ' ' + P().treatGen + '. Играй в игры!');
  },
  lightBeacon() {
    const ps = PS();
    if (ps.beacon || this.busy || !this.canLight()) return;
    ps.beacon = true; this.bc.light = 0;
    const nx = nextPlanet(P().id);
    if (nx && !S.data.unlocked.includes(nx.id)) S.data.unlocked.push(nx.id);
    S.save(); stat('beacons');
    this.busy = true; Sound.magic();
    G.tween(this.bc, { light: 1 }, 2, G.ease.inOutQuad, () => { this.busy = false; });
    for (let i = 0; i < 8; i++) setTimeout(() => { G.burst(M.rnd(200, 1100), M.rnd(80, 350), { kind: 'star', n: 26, speed: 340, g: 120 }); Sound.chime(M.rnd(0.8, 1.4)); }, i * 350);
    Voice.say(P().beaconText);
    // ракета откликается на свет маяка
    if (!Egg.hatched() && Egg.stage() < 12) G.wait(6.5, () => { if (G.scene !== this) return; this.rk.shake = 1; Sound.bump(); setTimeout(() => Sound.bump(), 260); G.tween(this.rk, { shake: 0 }, 1.5, G.ease.outQuad); Voice.say('Ой! Ракета вздрогнула, когда загорелся маяк! ' + (Egg.hint() || '')); });
    if (Egg.due()) G.wait(7, () => { if (G.scene === this) G.go('hatch'); });
  },
  // Космик: катает, урчит, чихает звёздами
  tapKosmik() {
    const rk = this.rk; rk.busy = true; rk.act = (rk.act + 1) % 3;
    if (rk.act === 1) {
      Sound.whoosh(); Voice.say(M.pick(['Ура, полетели! Ж-ж-жух!', 'Держись крепче! Летим!']));
      G.tween(rk, { lift: 260 }, 1.2, G.ease.inOutQuad, () => G.tween(rk, { lift: 0 }, 1.2, G.ease.inOutQuad, () => { rk.busy = false; Sound.bump(); }));
    } else if (rk.act === 2) {
      rk.flame = 1; Sound.fire(); Voice.say('Смотри, я умею пускать звёздный огонь!');
      G.burst(300, 430, { kind: 'star', n: 24, speed: 320 });
      G.wait(1.4, () => { rk.flame = 0; rk.busy = false; });
    } else {
      rk.pilotWave = 2; Sound.purr(1.6, { dragon: 'kosmik' }); Voice.say(M.pick(['Мур-р-р! Я Космик! Я вылупился из ракеты!', 'Апчхи! Ой, я чихнул звёздочками!', 'Мне нравится возить тебя по галактике!']));
      G.burst(170, 380, { kind: 'star', n: 14, up: true, g: -60, speed: 200 });
      G.wait(1.4, () => { rk.busy = false; });
    }
  },
  // ---------- космонавт ----------
  tapAstro() {
    const a = this.as;
    a.anim = ASTRO_ANIMS[(ASTRO_ANIMS.indexOf(a.anim) + 1 + M.ri(0, 2)) % ASTRO_ANIMS.length];
    a.at = 0; a.until = a.anim === 'spin' ? 0.75 : 1.8;
    Sound.boing(); stat('astro');
    a.phrase = (a.phrase + 1 + M.ri(0, 4)) % ASTRO_PHRASES.length;
    Voice.say(ASTRO_PHRASES[a.phrase]);
    if (a.anim === 'cheer' || a.anim === 'jump') G.burst(390, 450, { kind: 'star', n: 8, up: true, speed: 200 });
  },
  // ---------- ракета ----------
  tapRocket() {
    const rk = this.rk; if (rk.busy) return;
    if (Egg.hatched()) return this.tapKosmik();
    // ракета-яйцо: подсказки
    if (Egg.stage() >= 1 && Math.random() < 0.6) {
      rk.busy = true; rk.shake = 1; Sound.bump(); setTimeout(() => Sound.bump(), 260);
      G.tween(rk, { shake: 0 }, 1.2, G.ease.outQuad, () => { rk.busy = false; });
      Voice.say(Egg.hint()); stat('eggTaps');
      return;
    }
    rk.busy = true; rk.act = (rk.act + 1) % 3;
    if (rk.act === 1) {
      Voice.say('Три! Два! Один! Пуск!'); stat('launch');
      G.wait(2.4, () => {
        rk.flame = 1; Sound.rumble(2.5); Sound.whoosh();
        for (let i = 0; i < 8; i++) setTimeout(() => G.burst(170 + M.rnd(-60, 60), 590, { kind: 'smoke', n: 4, colors: ['#ffffff', '#d8d0f0'], g: -30, speed: 120, size: 22 }), i * 120);
        G.tween(rk, { lift: 900 }, 1.8, x => x * x, () => {
          G.wait(1.2, () => { rk.flame = 0.7; G.tween(rk, { lift: 0 }, 2.2, G.ease.outQuad, () => { rk.flame = 0; rk.busy = false; Sound.bump(); G.burst(170, 600, { kind: 'smoke', n: 14, colors: ['#ffffff'], g: -20, speed: 180, size: 18 }); }); });
        });
      });
    } else if (rk.act === 2) {
      Sound.whoosh(); rk.flame = 1; rk.lights = 2;
      G.tween(rk, { lift: 70 }, 0.6, G.ease.outQuad, () => G.tween(rk, { lift: 0 }, 0.8, G.ease.outBounce, () => { rk.flame = 0; rk.busy = false; }));
    } else {
      Sound.beep(); rk.pilotWave = 2.2; rk.lights = 2.2;
      Voice.say(M.pick(ROCKET_PHRASES));
      G.wait(1.2, () => { rk.busy = false; });
    }
  },
  // ---------- дракончики ----------
  pet(id) {
    const d = this.drs[id], D = DRAGON_BY_ID[id];
    S.data.buddy = id; Care.add(id, 'fun', 8);
    d.taps++; stat('pet');
    Sound.purr(1.6, { dragon: id });
    d.happyT = 1.8;
    G.burst(d.x, d.y - 200 - d.lift, { kind: 'heart', n: 5, colors: ['#ff5e9a', '#ff9ad5', '#ffb3d0'], up: true, g: -80, speed: 160, size: 20 });
    d.squash = 0.6; G.tween(d, { squash: 0 }, 0.6, G.ease.outElastic);
    if (d.taps % 4 === 0) {
      Sound.fire(); d.fire = 0.01; G.tween(d, { fire: 1 }, 0.3, G.ease.outQuad, () => G.tween(d, { fire: 0 }, 0.5, G.ease.linear, null, 0.4));
    } else if (d.taps % 2 === 0) {
      d.flying = true;
      G.tween(d, { lift: 140 }, 0.6, G.ease.outQuad, () => G.tween(d, { lift: 0 }, 0.7, G.ease.inOutQuad, () => { d.flying = false; }, 0.4));
    } else if (d.taps === 1) Voice.say(Care.name(id) + ' любит, когда его гладят!');
  },
  feed() {
    if (this.busy) return;
    const here = this.present();
    if (!here.length) { Voice.say(Villain.where() + ' ' + Villain.task(V().taken)); return; }
    const ps = PS();
    if (ps.treats <= 0) {
      Voice.say('Угощение закончилось! Поиграй в игры, чтобы найти ещё.');
      for (const b of this.gameBtns) { b.pulse = true; setTimeout(() => { b.pulse = false; }, 3000); }
      return;
    }
    const id = here[this.feedTurn++ % here.length], d = this.drs[id];
    ps.treats--; Care.add(id, 'food', 12); Care.add(id, 'fun', 3); stat('fed');
    const mx = d.x, my = d.y - 150 * 0.72 - d.lift;
    d.mouth = 0; G.tween(d, { mouth: 1 }, 0.3);
    UI.flyTreat(M.ri(0, 5), this.feedBtn.x, this.feedBtn.y, mx, my, 0, () => {
      Sound.chomp(); d.mouth = 1; G.tween(d, { mouth: 0 }, 0.5); d.squash = 0.5; G.tween(d, { squash: 0 }, 0.7, G.ease.outElastic);
      G.burst(mx, my, { kind: 'star', n: 8, speed: 180, size: 12 }); d.happyT = 1.5;
      setTimeout(() => Sound.purr(1.2, { dragon: id }), 400);
    });
  },
  // ---------- потребности ----------
  drawNeed(ctx, id, N) {
    const v = Care.pet(id)[N.id] / 100;
    ctx.beginPath(); ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.strokeStyle = v < 0.3 ? '#ff3b5c' : v < 0.6 ? '#ffb23a' : N.color; ctx.stroke();
    Art.icon(ctx, N.icon, 0, 0, 0.5, G.t);
  },
  pulseNeed(id, need) {
    const b = this.petUI[id].needs.find(x => x.need === need); if (!b) return;
    b.pulse = true; setTimeout(() => { b.pulse = false; }, 4000);
  },
  needTap(id, N) {
    if (this.busy) return;
    S.data.buddy = id; S.save();
    if (N.id === 'fun') { this.pet(id); return; }
    if (N.id === 'energy' && Care.late()) { Voice.stop(); G.go('sleep', { mode: 'bedtime' }); return; }
    Voice.stop(); G.go(N.scene, { id });
  },
  askBed() {
    this.lateAsked = true; this.bedBtn.hidden = false;
    Voice.say('Уже поздно! Дракончики зевают. Пора укладываться спать!');
  },
  // ---------- похищение ----------
  kidnap() {
    if (G.scene !== this || this.busy || !Villain.due()) return;
    const plan = Villain.plan();
    plan.line = Villain.sayLine(Villain.chapter(), plan.villain, plan.ids);
    this.busy = true;
    if (plan.villain === 'comet') return this.cometKidnap(plan);
    const sp = this.sp = { head: CAVE_X + 60, y: 560, carry: [] };
    Sound.hiss(); Voice.say('Ой! Кто это шипит в пещере?');
    const grab = (i) => {
      const id = plan.ids[i], d = this.drs[id];
      G.tween(sp, { head: d.x + 30 }, 2.2, G.ease.inOutQuad, () => {
        Sound.hiss(); d.carried = true; sp.carry.push(id);
        if (i + 1 < plan.ids.length) grab(i + 1);
        else {
          Voice.say(plan.line);
          G.tween(sp, { head: CAVE_X + 700 }, 3.2, G.ease.inOutQuad, () => {
            Villain.start(plan);
            this.sp = null; this.busy = false;
            G.go('villain', { kind: 'kidnap' });
          }, 2.2);
        }
      }, i ? 0.3 : 1.4);
    };
    grab(0);
  },
  // Шкода пикирует с неба, сажает дракончиков в пузырь и улетает
  cometKidnap(plan) {
    const cm = this.cm = { x: G.view.x1 + 200, y: -100, dir: Math.PI * 0.8, carry: [] };
    Sound.whoosh(); Voice.say('Ой! Что это летит по небу?');
    const grab = (i) => {
      const id = plan.ids[i], d = this.drs[id];
      cm.dir = Math.atan2(d.y - 260 - cm.y, d.x - cm.x);
      G.tween(cm, { x: d.x + 40, y: d.y - 300 }, 1.6, G.ease.inOutQuad, () => {
        Sound.magic(); d.carried = true; cm.carry.push(id);
        G.burst(d.x, d.y - 100, { kind: 'star', n: 16, speed: 240 });
        if (i + 1 < plan.ids.length) grab(i + 1);
        else {
          Voice.say(plan.line);
          G.wait(4, () => {
            cm.dir = Math.atan2(-400, -900); Sound.whoosh();
            G.tween(cm, { x: G.view.x0 - 400, y: -250 }, 2, x => x * x, () => {
              Villain.start(plan);
              this.cm = null; this.busy = false;
              G.go('villain', { kind: 'kidnap' });
            });
          });
        }
      }, i ? 0.3 : 1.4);
    };
    grab(0);
  },
  serpentPts(headX, y, t) {
    const pts = [];
    for (let i = 0; i < 28; i++) pts.push([headX + i * 22, y - 40 + Math.sin(t * 4 - i * 0.6) * 20]);
    return pts;
  },
  update(dt) {
    if (this.redirect && G.fadeDir === 0) { const r = this.redirect; this.redirect = null; G.go(r); return; }
    this.tickT += dt;
    if (this.tickT > 2) {
      this.tickT = 0; Care.tick();
      const c = Care.data();
      if (!this.busy && !Voice.cur && Date.now() - (c.lastCall || 0) > 50000) {
        if (Care.late() && !this.lateAsked) this.askBed();
        else for (const D of this.here) { if (isTaken(D.id)) continue; const n = Care.lowest(D.id, 25); if (n) { Voice.say(Care.ask(D.id, n.id)); this.pulseNeed(D.id, n.id); break; } }
        c.lastCall = Date.now();
      }
    }
    for (const D of this.here) { const ui = this.petUI[D.id], hide = isTaken(D.id) || this.drs[D.id].carried; ui.name.hidden = hide; ui.name.label = Care.name(D.id); ui.needs.forEach(b => { b.hidden = hide; }); }
    for (const id in this.drs) {
      const d = this.drs[id];
      d.blinkT -= dt;
      if (d.blinkT < 0) { d.blink = 1; if (d.blinkT < -0.14) { d.blink = 0; d.blinkT = M.rnd(2, 4.5); } }
      d.happyT = Math.max(0, d.happyT - dt);
      if (!this.busy) d.look += (M.clamp((G.pointer.x - d.x) / 400, -1, 1) - d.look) * dt * 3;
    }
    const a = this.as; a.at += dt; if (a.anim !== 'idle' && a.at > a.until) a.anim = 'idle';
    this.rk.pilotWave = Math.max(0, this.rk.pilotWave - dt); this.rk.lights = Math.max(0, this.rk.lights - dt);
    this.cave.talk = Math.max(0, this.cave.talk - dt);
    this.updBtn.hidden = !G.updateReady;
    const v = V();
    this.rescueBtn.hidden = !(v.taken.length && v.keys >= 3 && !this.busy);
    if (v.taken.length) this.rescueBtn.label = 'Спасти ' + (v.taken.length > 1 ? 'дракончиков' : Care.custom(v.taken[0]) ? Care.name(v.taken[0]) : DRAGON_BY_ID[v.taken[0]].acc) + '!';
    this.feedBtn.hidden = !this.present().length || this.busy;
    const ps = PS(), nx = nextPlanet(P().id);
    this.beaconBtn.hidden = !(!ps.beacon && (ps.earned || 0) >= BEACON_GOAL && this.canLight() && !this.busy && this.rescueBtn.hidden);
    this.flyBtn.hidden = !(ps.beacon && nx && !PS(nx.id).visited && !this.busy && this.rescueBtn.hidden && this.beaconBtn.hidden);
    this.mapBtn.pulse = !!(nx && S.data.unlocked.includes(nx.id) && !PS(nx.id).visited);
    if (Care.late() && !this.busy) { this.bedBtn.hidden = false; this.rescueBtn.y = 270; }
  },
  draw(ctx) {
    const t = G.t, v = V();
    World.bg(ctx, t, { noBeacon: true });
    this.drawBeacon(ctx, t);
    Art.lair(ctx, CAVE_X, 612, 1, t, { peek: this.cave.peek, talk: this.cave.talk > 0, friend: v.friend, eyes: !this.sp });
    const rk = this.rk;
    if (Egg.hatched()) {
      // вместо ракеты — звёздный дракон Космик и скорлупки рядом
      for (const [sx, r] of [[70, 0.4], [250, -0.6], [110, 2.4]]) { ctx.save(); ctx.translate(sx, World.GROUND + 18); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-8, -16); ctx.lineTo(10, -10); ctx.lineTo(22, 6); ctx.lineTo(0, 10); ctx.closePath(); ctx.fillStyle = '#eef0f8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#6a6e8a'; ctx.stroke(); ctx.restore(); }
      Art.dragon(ctx, 160, World.GROUND + 20 - rk.lift, 0.7, { kind: 'kosmik', t, flying: rk.lift > 5, lift: 0, happy: rk.pilotWave > 0, fire: rk.flame > 0.9 && rk.act === 2, look: 1 });
    } else Art.rocket(ctx, 170, World.GROUND + 25 - rk.lift, 0.8, { t, flame: rk.flame, glowBase: rk.lift < 5, pilot: rk.pilotWave > 0, pilotWave: rk.pilotWave > 0, egg: Egg.stage(), shake: rk.shake || 0 });
    if (rk.lights > 0) for (let i = 0; i < 4; i++) { const on = Math.sin(t * 16 + i) > 0; if (on) { ctx.save(); ctx.globalAlpha = 0.6; Art.ell(ctx, 170 + (i - 1.5) * 40, World.GROUND + 25 - rk.lift - 140 - (i % 2) * 120, 14, 14, ['#ff3b5c', '#41ff82', '#ffe14a', '#7ee8ff'][i]); ctx.restore(); } }
    Art.astronaut(ctx, 390, 600, 1.1, { t, anim: this.as.anim, at: this.as.at, look: M.clamp((G.pointer.x - 390) / 500, -1, 1) });
    if (!this.here.length) this.drawNest(ctx, t);
    for (const D of this.here) {
      const d = this.drs[D.id];
      if (isTaken(D.id) || d.carried) { // пустое место и следы Шипуна
        ctx.save(); ctx.globalAlpha = 0.35; Art.ell(ctx, d.x, d.y, 80, 16, '#3a1a3a'); ctx.restore();
        continue;
      }
      const late = Care.late(), yawn = late && ((t + (D.id === 'light' ? 3 : 0)) % 7) < 1.2 ? Math.sin(((t + (D.id === 'light' ? 3 : 0)) % 7) / 1.2 * Math.PI) : 0;
      Art.dragon(ctx, d.x, d.y, 0.72, { kind: D.id, t: t + (D.id === 'light' ? 1.3 : 0), blink: yawn > 0.2 ? 0.8 : d.blink, mouth: Math.max(d.mouth, yawn), look: d.look, squash: d.squash,
        happy: d.happyT > 0 && d.mouth < 0.1, lift: d.lift, flying: d.flying, fire: d.fire, tilt: d.tilt, mood: d.happyT > 0 ? 'happy' : Care.mood(D.id) });
      const low = d.happyT > 0 ? null : Care.lowest(D.id, 30);
      const left = d.x < 700;
      if (low && !this.busy) this.thought(ctx, d.x + (left ? -110 : 110), d.y - 215 - d.lift, low, t, left ? 1 : -1);
    }
    if (this.sp) {
      const pts = this.serpentPts(this.sp.head, this.sp.y, t);
      Art.serpent(ctx, pts, t, { open: !this.sp.carry.length, r: 34 });
      this.sp.carry.forEach((id, i) => Art.dragon(ctx, this.sp.head + 50 + i * 70, this.sp.y - 60 - i * 10, 0.42, { kind: id, t, tilt: 0.5, look: -1, mouth: 0.8 }));
    }
    if (this.cm) {
      const cm = this.cm, n = cm.carry.length;
      cm.carry.forEach((id, i) => Art.dragon(ctx, cm.x - 150 + (n > 1 ? (i ? 36 : -36) : 0), cm.y + 175, 0.3, { kind: id, t: t + i, flying: true, mouth: 0.6 }));
      if (n) Art.bubble(ctx, cm.x - 150, cm.y + 125, n > 1 ? 100 : 78, t);
      Art.comet(ctx, cm.x, cm.y, 0.8, t, { dir: cm.dir, talk: !!Voice.cur });
    }
    if (this.tf) {
      const f = this.tf;
      Art.astronaut(ctx, f.x, f.y + 120, 0.9, { t, dark: true, jet: 1, eyes: true, tail: T().ch >= 2, flip: !f.flip });
      if (f.sack > 0) Art.sack(ctx, f.x + (f.flip ? -60 : 60), f.y + 60, 0.5 + f.sack * 0.4, t);
    }
    if (v.taken.length && !this.sp && !this.cm) this.drawKeys(ctx, t);
  },
  // маяк: башня наполняется светом по мере сбора вкусняшек
  drawBeacon(ctx, t) {
    const ps = PS(), k = Math.min(1, (ps.earned || 0) / BEACON_GOAL), lit = ps.beacon;
    Art.beacon(ctx, BEACON_X, 520, 0.72, lit, t, P().beacon);
    if (!lit) {
      const x = BEACON_X, y0 = 470, h = 120;
      Art.rr(ctx, x - 8, y0 - h, 16, h, 8); ctx.fillStyle = 'rgba(20,10,50,0.6)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
      if (k > 0) { Art.rr(ctx, x - 7, y0 - h * k + 2, 14, h * k - 4 > 6 ? h * k - 4 : 6, 7); ctx.fillStyle = k >= 1 ? '#ffe14a' : '#ffd23f'; ctx.fill(); }
      ctx.save(); ctx.globalAlpha = 0.85; Art.rr(ctx, x - 44, y0 + 32, 88, 28, 14); ctx.fillStyle = 'rgba(20,10,50,0.65)'; ctx.fill(); ctx.restore();
      UI.text(ctx, Math.min(BEACON_GOAL, ps.earned || 0) + '/' + BEACON_GOAL, x, y0 + 53, 19, '#ffe9a8', 'center', false);
    }
    if (this.bc.light > 0 && this.bc.light < 1) { ctx.save(); ctx.globalAlpha = Math.sin(this.bc.light * Math.PI) * 0.6; ctx.fillStyle = '#fff8d0'; const v = G.view; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
  },
  // пустое гнездо (на Сумраке, пока не раскрыта тайна воришки)
  drawNest(ctx, t) {
    Art.ell(ctx, 720, 610, 110, 28, '#5a3a2a'); Art.stroke(ctx, 3);
    for (let i = 0; i < 9; i++) { const a = i * 0.7; ctx.beginPath(); ctx.moveTo(620 + i * 22, 600 + Math.sin(a) * 6); ctx.quadraticCurveTo(640 + i * 22, 590, 660 + i * 22, 606); Art.stroke(ctx, 4, '#8a5a3a'); }
    ctx.save(); ctx.globalAlpha = 0.6; for (const [x, y] of [[560, 640], [520, 660], [480, 650]]) { Art.ell(ctx, x, y, 12, 7, '#1a1a3a'); } ctx.restore();
  },
  thought(ctx, x, y, N, t, dir) {
    const b = Math.sin(t * 3) * 4;
    ctx.save(); ctx.globalAlpha = 0.95;
    Art.ell(ctx, x + dir * 40, y + 46 + b, 7, 7, '#fff'); Art.ell(ctx, x + dir * 26, y + 32 + b, 10, 10, '#fff');
    Art.ell(ctx, x, y + b, 34, 30, '#fff');
    Art.icon(ctx, N.icon, x, y + b, 0.75, t);
    ctx.restore();
  },
  drawKeys(ctx, t) {
    const v = V(), cx = 820, star = v.villain === 'comet';
    Art.rr(ctx, cx - 210, 16, 420, 110, 30); ctx.fillStyle = 'rgba(30,14,70,0.7)'; ctx.fill();
    UI.text(ctx, star ? 'Звёзды, чтобы поймать Шкоду' : 'Ключи от пещеры Шипуна', cx, 44, 26, '#ffd6f0', 'center', true);
    for (let i = 0; i < 3; i++) {
      Art.ell(ctx, cx - 90 + i * 90, 92, 26, 26, i < v.keys ? '#ffd23f' : 'rgba(255,255,255,0.15)');
      ctx.save(); if (i >= v.keys) ctx.globalAlpha = 0.35; Art.icon(ctx, star ? 'star' : 'key', cx - 90 + i * 90, 92, 0.6, t); ctx.restore();
    }
  },
  drawTop(ctx) {
    UI.drawCounterTopRight(ctx);
    ctx.save(); ctx.globalAlpha = 0.45; UI.text(ctx, 'версия ' + G.webVersion, G.view.x1 - 20, G.view.y1 - 18, 18, '#fff', 'right', false); ctx.restore();
  },
};
