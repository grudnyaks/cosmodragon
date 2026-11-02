// Главный экран планеты: дракон (или яйцо), космонавт, ракета, кормление, рост, маяк, воришка и змей
'use strict';
const ASTRO_ANIMS = ['wave', 'jump', 'dance', 'salute', 'spin', 'cheer'];
const ASTRO_PHRASES = ['Привет!', 'Полетели за вкусняшками!', 'Дракончик — мой лучший друг!', 'Смотри, как я умею!', 'Космос такой большой!',
  'Я самый смелый космонавт!', 'Ура, приключения!', 'Давай поиграем!', 'Мой шлем блестит!', 'Звёзды мне подмигивают!',
  'Кто тут самый весёлый? Я!', 'Скорее зажжём маяк!', 'Здесь так красиво!', 'Опа! Прыжок!', 'Вперёд, к новым планетам!'];
const ROCKET_PHRASES = ['Бортовой компьютер: все системы в норме!', 'Топливо: сто процентов!', 'Ракета готова к полёту!',
  'Проверка двигателей. Отлично!', 'Внимание! Обнаружены вкусняшки!', 'Связь с Землёй установлена!', 'Курс на звёзды проложен!'];

G.scenes.home = {
  enter() {
    const pd = P(), ps = PS();
    ps.visited = true;
    // если маяк уже горит, а следующая планета не открыта — открыть
    const nx = nextPlanet(pd.id);
    if (ps.beacon && nx && !S.data.unlocked.includes(nx.id)) S.data.unlocked.push(nx.id);
    S.save();
    Sound.preload(pd.id);
    this.dr = { x: 650, y: 590, lift: 0, squash: 0, mouth: 0, happyT: 0, fire: 0, flying: false, look: 0, tilt: 0, gone: ps.serpent === 'kidnapped', flash: 0 };
    this.as = { anim: 'idle', at: 0, until: 0, phrase: 0 };
    this.rk = { lift: 0, flame: 0, busy: false, act: 0, pilotWave: 0, lights: 0 };
    this.blinkT = 2; this.blink = 0; this.taps = 0;
    this.banner = null; this.busy = false;
    // кнопки игр
    const games = pd.games, n = games.length, step = n > 7 ? 108 : 130, r = n > 7 ? 47 : 52;
    const x0 = 640 - (n - 1) * step / 2 - 30;
    this.gameBtns = games.map((g, i) => UI.add(this, { x: x0 + i * step, y: 662, r, icon: g.icon, color: g.color, bob: true, iconScale: 1.12,
      onTap: () => { Voice.stop(); G.go(g.scene); } }));
    this.feedBtn = UI.add(this, { x: 950, y: 400, r: 58, icon: 'feed', color: '#ffd23f', onTap: () => this.feed() });
    const tx = i => G.view.x0 + 58 + i * 84;
    UI.add(this, { x: tx(0), y: 56, r: 35, icon: S.data.music ? 'music' : 'musicOff', color: '#38d6c3', onTap() { Sound.setMusic(!S.data.music); this.icon = S.data.music ? 'music' : 'musicOff'; } });
    UI.add(this, { x: tx(1), y: 56, r: 35, icon: 'book', color: '#ff9a3c', onTap: () => { Voice.stop(); G.go('intro', { planet: pd.id }); } });
    UI.add(this, { x: tx(2), y: 56, r: 35, icon: 'skills', color: '#ffd23f', onTap: () => { Voice.stop(); G.go('skills'); } });
    UI.add(this, { x: tx(3), y: 56, r: 35, icon: 'trophy', color: '#ff7eb6', onTap: () => { Voice.stop(); G.go('ach'); } });
    this.mapBtn = UI.add(this, { x: tx(4), y: 56, r: 35, icon: 'galaxy', color: '#8f6cf2', badge: null, onTap: () => { Voice.stop(); G.go('map'); } });
    this.updBtn = UI.add(this, { x: tx(5), y: 56, r: 35, icon: 'update', color: '#41d982', pulse: true, hidden: !G.updateReady, onTap: () => { if (window.Android && Android.reload) Android.reload(); else location.reload(); } });
    this.flyBtn = UI.add(this, { x: 640, y: 420, w: 520, h: 84, label: 'Лететь дальше!', icon: 'galaxy', iconX: -200, fontSize: 34, color: '#8f6cf2', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('map', { reveal: (nextPlanet(P().id) || {}).id }); } });
    this.rescueBtn = UI.add(this, { x: 650, y: 430, w: 460, h: 84, label: 'Спасти ' + (pd.id === 'jungle' ? 'Листика' : ''), icon: 'sword', iconX: -170, fontSize: 34, color: '#ff3b5c', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('serpent'); } });
    // воришка (Радуга)
    this.th = pd.special === 'thief' ? { state: 'wait', t: M.rnd(14, 26), x: 0, flip: false, loot: 0 } : null;
    // змей (Джунгли)
    this.sp = null;
    if (pd.special === 'serpent' && ps.serpent === 'none' && ps.level >= 4) setTimeout(() => this.kidnap(), 1500);
    if (!this.greeted) { this.greeted = true; setTimeout(() => this.hello(), 700); }
  },
  hello() {
    if (G.sceneName !== 'home') return;
    const ps = PS(), pd = P();
    if (ps.serpent === 'kidnapped') { Voice.say(ps.keys >= 3 ? 'Все ключи найдены! Нажми на кнопку, чтобы спасти Листика!' : 'Листика похитил Змей! Выигрывай игры, чтобы найти ключи: ' + ps.keys + ' из трёх.'); return; }
    if (ps.level === 0) Voice.say(ps.treats > 0 ? 'Согрей яйцо! Нажми на кнопку с угощением.' : 'Поиграй в игры, чтобы найти угощение для яйца!');
    else if (ps.treats > 0 && ps.level < MAX_LEVEL) Voice.say(pd.dragon.name + ' хочет кушать! Нажми на угощение.');
  },
  dragonScale() { return PS().level === 0 ? 1 : 0.78 + (PS().level - 1) * 0.04; },
  dragonHit(x, y) {
    if (this.dr.gone) return false;
    const s = this.dragonScale(), d = this.dr;
    return Math.abs(x - d.x) < 110 * s && y < d.y - d.lift + 10 && y > d.y - d.lift - 250 * s;
  },
  down(x, y) {
    if (this.banner && this.banner.tapClose && G.t - this.banner.t0 > 1) { this.banner = null; return; }
    if (this.th && (this.th.state === 'sneak' || this.th.state === 'flee') && Math.abs(x - this.th.x) < 70 && y > 430 && y < 640) return this.scareThief();
    if (this.dragonHit(x, y)) return this.petDragon();
    if (Math.abs(x - 470) < 55 && y > 420 && y < 630) return this.tapAstro();
    if (Math.abs(x - 190) < 85 && y > 120 - this.rk.lift && y < 600 - this.rk.lift) return this.tapRocket();
  },
  // ---------- космонавт ----------
  tapAstro() {
    const a = this.as;
    a.anim = ASTRO_ANIMS[(ASTRO_ANIMS.indexOf(a.anim) + 1 + M.ri(0, 2)) % ASTRO_ANIMS.length];
    a.at = 0; a.until = a.anim === 'spin' ? 0.75 : 1.8;
    Sound.boing(); stat('astro');
    const list = ASTRO_PHRASES.concat(['На планете ' + P().name + ' так интересно!']);
    a.phrase = (a.phrase + 1 + M.ri(0, 4)) % list.length;
    Voice.say(list[a.phrase]);
    if (a.anim === 'cheer' || a.anim === 'jump') G.burst(470, 450, { kind: 'star', n: 8, up: true, speed: 200 });
  },
  // ---------- ракета ----------
  tapRocket() {
    const rk = this.rk; if (rk.busy) return;
    rk.busy = true; rk.act = (rk.act + 1) % 3;
    if (rk.act === 1) { // настоящий запуск с обратным отсчётом
      Voice.say('Три! Два! Один! Пуск!'); stat('launch');
      G.wait(2.4, () => {
        rk.flame = 1; Sound.rumble(2.5); Sound.whoosh();
        for (let i = 0; i < 8; i++) setTimeout(() => G.burst(190 + M.rnd(-60, 60), 590, { kind: 'smoke', n: 4, colors: ['#ffffff', '#d8d0f0'], g: -30, speed: 120, size: 22 }), i * 120);
        G.tween(rk, { lift: 900 }, 1.8, x => x * x, () => {
          G.wait(1.2, () => { rk.flame = 0.7; G.tween(rk, { lift: 0 }, 2.2, G.ease.outQuad, () => { rk.flame = 0; rk.busy = false; Sound.bump(); G.burst(190, 600, { kind: 'smoke', n: 14, colors: ['#ffffff'], g: -20, speed: 180, size: 18 }); }); });
        });
      });
    } else if (rk.act === 2) { // прыжок с огоньками
      Sound.whoosh(); rk.flame = 1; rk.lights = 2;
      G.tween(rk, { lift: 70 }, 0.6, G.ease.outQuad, () => G.tween(rk, { lift: 0 }, 0.8, G.ease.outBounce, () => { rk.flame = 0; rk.busy = false; }));
    } else { // бортовой компьютер
      Sound.beep(); rk.pilotWave = 2.2; rk.lights = 2.2;
      Voice.say(M.pick(ROCKET_PHRASES));
      G.wait(1.2, () => { rk.busy = false; });
    }
  },
  // ---------- дракон ----------
  petDragon() {
    const d = this.dr, ps = PS(), lvl = ps.level;
    if (this.busy) return;
    this.taps++; stat('pet');
    if (lvl === 0) { Sound.purr(0.9, { gain: 0.5, rate: 0.85 }); d.squash = 0.8; G.tween(d, { squash: 0 }, 0.8, G.ease.outElastic); Voice.say(M.pick(['Тук-тук! Кто там?', 'Яйцо шевелится!', 'Скоро вылупится!'])); return; }
    Sound.purr(1.6);
    d.happyT = 1.8;
    G.burst(d.x, d.y - 230 * this.dragonScale() - d.lift, { kind: 'heart', n: 5, colors: ['#ff5e9a', '#ff9ad5', '#ffb3d0'], up: true, g: -80, speed: 160, size: 20 });
    d.squash = 0.6; G.tween(d, { squash: 0 }, 0.6, G.ease.outElastic);
    if (lvl >= 4 && this.taps % 3 === 0) {
      Sound.fire(); d.fire = 0.01; G.tween(d, { fire: 1 }, 0.3, G.ease.outQuad, () => G.tween(d, { fire: 0 }, 0.5, G.ease.linear, null, 0.4));
    } else if (lvl >= 2 && this.taps % 2 === 0) {
      d.flying = true;
      G.tween(d, { lift: 110 + lvl * 10 }, 0.6, G.ease.outQuad, () => G.tween(d, { lift: 0 }, 0.7, G.ease.inOutQuad, () => { d.flying = false; }, 0.4));
    }
  },
  feed() {
    const ps = PS(), dr = this.dr, pd = P();
    if (this.busy) return;
    if (dr.gone) { Voice.say('Листика нет дома! Его похитил Змей. Найди три ключа, чтобы его спасти!'); return; }
    if (ps.treats <= 0) {
      Voice.say('Угощение закончилось! Поиграй в игры, чтобы найти ещё.');
      dr.tilt = 0.25; G.tween(dr, { tilt: 0 }, 1.2, G.ease.outElastic);
      for (const b of this.gameBtns) { b.pulse = true; setTimeout(() => { b.pulse = false; }, 3000); }
      return;
    }
    ps.treats--; S.save(); stat('fed');
    const s = this.dragonScale();
    const egg = ps.level === 0;
    const mx = dr.x, my = egg ? dr.y - 90 : dr.y + Art.dragonHeadY(ps.level, s) - dr.lift;
    if (!egg) { dr.mouth = 0; G.tween(dr, { mouth: 1 }, 0.3); }
    UI.flyTreat(M.ri(0, 5), this.feedBtn.x, this.feedBtn.y, mx, my, 0, () => {
      if (egg) { Sound.chime(0.9); dr.squash = 0.6; G.tween(dr, { squash: 0 }, 0.7, G.ease.outElastic); G.burst(mx, my, { kind: 'heart', n: 6, speed: 140, colors: ['#ffb3d0', '#fff3a0'] }); }
      else { Sound.chomp(); dr.mouth = 1; G.tween(dr, { mouth: 0 }, 0.5); dr.squash = 0.5; G.tween(dr, { squash: 0 }, 0.7, G.ease.outElastic); G.burst(mx, my, { kind: 'star', n: 8, speed: 180, size: 12 }); dr.happyT = 1.5; }
      if (ps.level >= MAX_LEVEL) { Sound.purr(1.2); return; }
      ps.fed++; S.save();
      if (ps.fed >= levelNeed(ps.level)) setTimeout(() => egg ? this.hatch() : this.levelUp(), 600);
      else if (!egg) setTimeout(() => Sound.purr(1.0), 400);
    });
  },
  hatch() {
    const ps = PS(), dr = this.dr, pd = P();
    this.busy = true;
    Voice.say('Ой! Яйцо трещит!');
    let k = 0;
    const shake = setInterval(() => { k++; dr.squash = (k % 2 ? 0.5 : -0.5) * Math.min(1, k / 8); Sound.pop(0.6 + k * 0.03); if (k > 14) { clearInterval(shake); finish(); } }, 110);
    const finish = () => {
      if (G.sceneName !== 'home') { ps.level = 1; ps.fed = 0; S.save(); return; }
      dr.flash = 1; G.tween(dr, { flash: 0 }, 1.2, G.ease.outQuad);
      ps.level = 1; ps.fed = 0; S.save(); stat('hatched');
      dr.squash = -0.8; G.tween(dr, { squash: 0 }, 1.2, G.ease.outElastic);
      Sound.levelUp(); setTimeout(() => Sound.purr(1.8), 700);
      G.burst(dr.x, dr.y - 100, { kind: 'star', n: 40, speed: 380 });
      for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(300, 1000), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
      this.banner = { t0: G.t, title: 'Вылупился ' + pd.dragon.name + '!', sub: 'Корми его, и он будет расти', hatch: true };
      Voice.say('Ура! Вылупился ' + pd.dragon.name + '! Привет, малыш!');
      this.busy = false;
      setTimeout(() => { if (this.banner && this.banner.hatch) this.banner.tapClose = true; }, 1500);
    };
  },
  levelUp() {
    const ps = PS(), pd = P();
    ps.level = Math.min(MAX_LEVEL, ps.level + 1); ps.fed = 0; S.save(); stat('lvl');
    Sound.levelUp();
    const dr = this.dr;
    dr.squash = -0.8; G.tween(dr, { squash: 0 }, 1.2, G.ease.outElastic);
    for (let i = 0; i < 4; i++) setTimeout(() => G.burst(M.rnd(300, 1000), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
    this.banner = { t0: G.t, title: pd.dragon.name + ' вырос!', sub: '★ ' + LEVELS[ps.level].title + ' ★', lvl: ps.level };
    Voice.say(pd.dragon.name + ' вырос! ' + (LEVELS[ps.level].ability || ''));
    if (ps.level >= MAX_LEVEL && !ps.beacon) setTimeout(() => this.lightBeacon(), 6500);
    else setTimeout(() => { if (this.banner && this.banner.lvl === ps.level) this.banner.tapClose = true; }, 1500);
    if (pd.special === 'serpent' && ps.serpent === 'none' && ps.level >= 4) setTimeout(() => this.kidnap(), 5000);
  },
  lightBeacon() {
    if (G.sceneName !== 'home') return;
    const dr = this.dr, pd = P(), ps = PS(); this.busy = true; this.banner = null;
    dr.flying = true;
    Voice.say('Полетели к маяку!');
    G.tween(dr, { x: 980, lift: 220 }, 2.2, G.ease.inOutQuad, () => {
      dr.look = 1; Sound.fire(); dr.fire = 0.01;
      G.tween(dr, { fire: 1 }, 0.4, G.ease.outQuad, () => {
        ps.beacon = true;
        const nx = nextPlanet(pd.id);
        if (nx && !S.data.unlocked.includes(nx.id)) S.data.unlocked.push(nx.id);
        S.save(); stat('beacons');
        Sound.win(); Sound.magic();
        for (let i = 0; i < 8; i++) setTimeout(() => { G.burst(M.rnd(200, 1100), M.rnd(80, 350), { kind: 'star', n: 26, speed: 340, g: 120 }); Sound.chime(M.rnd(0.8, 1.4)); }, i * 350);
        Voice.say(pd.beaconText || 'Маяк зажёгся! Все звёзды вернулись на небо. Луч маяка показал путь к новой планете!');
        this.banner = { t0: G.t, title: 'Маяк зажёгся!', sub: nx ? 'Луч показал путь на планету ' + nx.name : 'Все маяки галактики горят!', final: true, tapClose: false };
        G.tween(dr, { fire: 0 }, 0.6, G.ease.linear, () => {
          G.tween(dr, { x: 650, lift: 0 }, 2.2, G.ease.inOutQuad, () => { dr.flying = false; dr.look = 0; this.busy = false; if (this.banner) this.banner.tapClose = true; }, 1.5);
        }, 0.8);
      });
    });
  },
  // ---------- воришка ----------
  scareThief() {
    const th = this.th;
    Sound.boing(); stat('thiefScared');
    if (th.state === 'flee' && th.loot > 0) {
      PS().treats += th.loot; S.save();
      G.floatText(th.x, 430, '+' + th.loot, '#ffd23f'); Voice.say('Ура! Ты отобрал вкусняшки обратно!');
      G.burst(th.x, 520, { kind: 'star', n: 14, speed: 220 }); th.loot = 0;
    } else Voice.say(M.pick(['Ой-ой! Убегаю!', 'Не трогай мои вкусняшки! Ой, то есть твои!', 'Эх, поймали!']));
    th.state = 'flee'; th.flip = true; th.scared = 1;
  },
  updateThief(dt) {
    const th = this.th; if (!th) return;
    th.scared = Math.max(0, (th.scared || 0) - dt);
    const ps = PS();
    if (th.state === 'wait') {
      th.t -= dt;
      if (th.t <= 0 && !this.busy && ps.treats >= 3) { th.state = 'sneak'; th.x = G.view.x0 - 80; th.flip = false; Sound.giggle(); Voice.say('Хи-хи-хи! Сейчас стащу вкусняшки!'); }
      else if (th.t <= 0) th.t = 10;
    } else if (th.state === 'sneak') {
      th.x += 75 * dt;
      if (th.x >= 300) { // добрался до корзинки
        const n = M.clamp(Math.round(ps.treats * 0.15), 1, 10);
        ps.treats = Math.max(0, ps.treats - n); S.save(); th.loot = n; stat('thiefStole', n);
        th.state = 'flee'; th.flip = true; Sound.giggle(); Voice.say('Хи-хи-хи! Мои вкусняшки! Догони, если сможешь!');
        G.floatText(320, 470, '−' + n, '#ff8fa0');
      }
    } else if (th.state === 'flee') {
      th.x -= 240 * dt;
      if (th.x < G.view.x0 - 120) { th.state = 'wait'; th.t = M.rnd(30, 55); th.loot = 0; }
    }
  },
  // ---------- змей ----------
  kidnap() {
    const ps = PS();
    if (G.sceneName !== 'home' || this.busy || ps.serpent !== 'none') return;
    this.busy = true; this.banner = null;
    const sp = this.sp = { head: G.view.x1 + 100, y: 560, phase: 'in', carry: false };
    Sound.hiss(); Voice.say('Ой! Кто это шипит в кустах?');
    G.tween(sp, { head: 760 }, 2.5, G.ease.inOutQuad, () => {
      Sound.hiss(); sp.carry = true; this.dr.gone = true;
      Voice.say('Злой Змей схватил Листика! Нужно его спасти! Выигрывай игры в джунглях и найди три ключа.');
      G.tween(sp, { head: G.view.x1 + 600 }, 3, G.ease.inOutQuad, () => {
        this.sp = null; ps.serpent = 'kidnapped'; ps.keys = 0; S.save(); this.busy = false;
      }, 1.2);
    });
  },
  serpentPts(headX, y, t) {
    const pts = [];
    for (let i = 0; i < 26; i++) pts.push([headX + i * 22, y - 40 + Math.sin(t * 4 - i * 0.6) * 22]);
    return pts;
  },
  update(dt) {
    const d = this.dr, ps = PS();
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blink = 1; if (this.blinkT < -0.14) { this.blink = 0; this.blinkT = M.rnd(2, 4.5); } }
    d.happyT = Math.max(0, d.happyT - dt);
    const a = this.as; a.at += dt; if (a.anim !== 'idle' && a.at > a.until) a.anim = 'idle';
    this.rk.pilotWave = Math.max(0, this.rk.pilotWave - dt); this.rk.lights = Math.max(0, this.rk.lights - dt);
    if (!this.busy) d.look += (M.clamp((G.pointer.x - d.x) / 400, -1, 1) - d.look) * dt * 3;
    this.updBtn.hidden = !G.updateReady;
    this.updateThief(dt);
    const nx = nextPlanet(P().id);
    this.flyBtn.hidden = !(ps.beacon && nx && !(PS(nx.id).visited) && !this.busy);
    this.rescueBtn.hidden = !(ps.serpent === 'kidnapped' && ps.keys >= 3 && !this.busy);
    this.feedBtn.hidden = d.gone;
    this.mapBtn.pulse = !!(nx && S.data.unlocked.includes(nx.id) && !PS(nx.id).visited);
  },
  draw(ctx) {
    const t = G.t, ps = PS(), pd = P();
    World.bg(ctx, t);
    const rk = this.rk;
    Art.rocket(ctx, 190, World.GROUND + 25 - rk.lift, 0.8, { t, flame: rk.flame, glowBase: rk.lift < 5, pilot: rk.pilotWave > 0, pilotWave: rk.pilotWave > 0 });
    if (rk.lights > 0) for (let i = 0; i < 4; i++) { const on = Math.sin(t * 16 + i) > 0; if (on) { ctx.save(); ctx.globalAlpha = 0.6; Art.ell(ctx, 190 + (i - 1.5) * 40, World.GROUND + 25 - rk.lift - 140 - (i % 2) * 120, 14, 14, ['#ff3b5c', '#41ff82', '#ffe14a', '#7ee8ff'][i]); ctx.restore(); } }
    // корзинка с вкусняшками (на Радуге её караулит воришка)
    if (this.th) { const n = Math.min(8, Math.ceil(ps.treats / 5)); for (let i = 0; i < n; i++) Art.treat(ctx, i % 6, 300 + (i % 4) * 18 - 27, 612 - Math.floor(i / 4) * 16, 0.32, t);
      Art.cel(ctx, () => { ctx.beginPath(); ctx.moveTo(262, 606); ctx.lineTo(338, 606); ctx.lineTo(328, 640); ctx.lineTo(272, 640); ctx.closePath(); }, '#c8a070', '#8a6a40', null, 3.5, 5); }
    Art.astronaut(ctx, 470, 600, 1.1, { t, anim: this.as.anim, at: this.as.at, look: M.clamp((G.pointer.x - 470) / 500, -1, 1) });
    const dr = this.dr;
    if (!dr.gone) Art.dragon(ctx, dr.x, dr.y, this.dragonScale(), {
      t, blink: this.blink, mouth: dr.mouth, look: dr.look, squash: dr.squash, crack: ps.level === 0 ? ps.fed / levelNeed(0) : 0,
      happy: dr.happyT > 0 && dr.mouth < 0.1, lift: dr.lift, flying: dr.flying, fire: dr.fire, tilt: dr.tilt,
    });
    else if (!this.sp) { // пустое гнездо и следы змея
      Art.ell(ctx, 650, 590, 90, 22, '#6a4a2a'); Art.stroke(ctx, 3);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); for (let x = 700; x < 1250; x += 10) ctx.lineTo(x, 600 + Math.sin(x * 0.03) * 12); Art.stroke(ctx, 10, '#3a2a1a'); ctx.restore();
      UI.text(ctx, '?', 650, 450, 90, '#fff', 'center', true);
      for (let i = 0; i < 3; i++) { Art.ell(ctx, 560 + i * 90, 360, 36, 36, i < ps.keys ? '#ffd23f' : 'rgba(30,14,70,0.6)'); Art.stroke(ctx, 3); ctx.save(); if (i >= ps.keys) ctx.globalAlpha = 0.35; Art.icon(ctx, 'key', 560 + i * 90, 360, 0.8, t); ctx.restore(); }
    }
    if (this.sp) {
      const pts = this.serpentPts(this.sp.head, this.sp.y, t);
      Art.serpent(ctx, pts, t, { open: !this.sp.carry, r: 36 });
      if (this.sp.carry) Art.dragon(ctx, this.sp.head + 40, this.sp.y - 70, 0.55, { t, level: ps.level, tilt: 0.5, blink: 0, look: -1, mouth: 0.8 });
    }
    if (this.th && this.th.state !== 'wait') Art.thief(ctx, this.th.x, 610, 0.95, t, { run: this.th.state === 'flee', flip: this.th.flip, sack: this.th.loot > 0 });
    if (dr.flash > 0) { const v = G.view; ctx.save(); ctx.globalAlpha = dr.flash; ctx.fillStyle = '#fff'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
    this.drawGrowth(ctx);
  },
  drawGrowth(ctx) {
    const ps = PS(), pd = P(), cx = 640;
    Art.rr(ctx, cx - 230, 14, 460, 104, 30); ctx.fillStyle = 'rgba(30,14,70,0.62)'; ctx.fill(); Art.stroke(ctx, 3, 'rgba(255,214,240,0.6)');
    UI.text(ctx, (ps.level === 0 ? 'Яйцо: ' : '') + pd.dragon.name + ' · ' + pd.name, cx, 42, 28, '#ffd6f0', 'center', true);
    if (ps.level === 0) {
      UI.progress(ctx, cx - 190, 68, 380, 32, ps.fed / levelNeed(0), '#ffd23f');
      UI.text(ctx, 'Согрей яйцо: ' + ps.fed + '/' + levelNeed(0), cx, 85, 20, '#fff', 'center', true);
      return;
    }
    for (let i = 1; i <= MAX_LEVEL; i++) Art.roundStar(ctx, cx - 202 + (i - 1) * 22, 88, 10, i <= ps.level ? '#ffd23f' : 'rgba(255,255,255,0.25)', '#2a1650');
    if (ps.level < MAX_LEVEL) {
      UI.progress(ctx, cx + 20, 72, 190, 32, ps.fed / levelNeed(ps.level), '#ff7eb6');
      UI.text(ctx, ps.fed + '/' + levelNeed(ps.level), cx + 115, 89, 20, '#fff', 'center', true);
    } else UI.text(ctx, ps.beacon ? 'Маяк сияет!' : 'Звёздный дракон!', cx + 118, 88, 19, '#ffd23f', 'center', true);
  },
  drawTop(ctx) {
    UI.drawCounterTopRight(ctx);
    ctx.save(); ctx.globalAlpha = 0.45; UI.text(ctx, 'версия ' + G.webVersion, G.view.x1 - 20, G.view.y1 - 18, 18, '#fff', 'right', false); ctx.restore();
    const b = this.banner;
    if (b) {
      const k = Math.min(1, (G.t - b.t0) / 0.5), sc = G.ease.outBack(k);
      ctx.save(); ctx.translate(b.final ? 560 : 640, 215); ctx.scale(sc * 0.85, sc * 0.85);
      Art.rr(ctx, -340, -90, 680, 180, 50); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#8f6cf2'; ctx.stroke();
      UI.text(ctx, b.title, 0, -36, 48, '#8f6cf2', 'center', false);
      if (b.sub) UI.text(ctx, b.sub, 0, 22, 32, '#ff7eb6', 'center', false);
      if (b.lvl && LEVELS[b.lvl].short) UI.text(ctx, LEVELS[b.lvl].short, 0, 64, 22, '#5a3fa0', 'center', false);
      ctx.restore();
    }
  },
};
