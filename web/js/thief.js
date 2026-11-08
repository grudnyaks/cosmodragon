// Третья история: воришка в чёрном шлеме. Появляется на дальних планетах (с Радуги), крадёт вкусняшки,
// а в финале на планете Сумрак снимает шлем… и оказывается дракончиком Теньком.
'use strict';
const THIEF_CHAPTERS = [
  { title: 'Чёрный шлем', mode: 'tap',
    say: 'Хи-хи-хи! Какие вкусные {treats}! Заберу их себе!',
    lose: 'Ой! Поймал… Ладно, забирай свои вкусняшки. Но я ещё вернусь! Хи-хи!',
    clue: 'Кто же прячется под чёрным шлемом? Лица совсем не видно…' },
  { title: 'Вкусный след', mode: 'sparks',
    say: 'Хи-хи! Опять я! Мне нужно очень-очень много вкусняшек!',
    lose: 'Мой мешок опустел… Зачем ты всё собрал? Мне они нужнее!',
    clue: 'Интересно, зачем воришке так много вкусняшек?' },
  { title: 'Хвостик', mode: 'catch',
    say: 'Хи-хи! Я самый ловкий воришка галактики! Лови, если сможешь!',
    lose: 'Ой-ой! Только не смотри на меня сзади!',
    clue: 'Ой! Ты видел? Из-под скафандра у воришки торчит хвостик! Странный какой-то космонавт…' },
  { title: 'Тёмный дом', mode: 'tap',
    say: 'Хи-хи… Мне очень нужны вкусняшки. Сто штук! Тогда у меня дома снова станет светло…',
    lose: 'Опять поймал… У меня дома так темно и страшно. Я просто хотел, чтобы стало светло.',
    clue: 'Сто вкусняшек… Столько же нужно, чтобы зажечь маяк! Может, у воришки есть свой маяк?' },
  { title: 'Кто под шлемом?', mode: 'sparks', finale: true,
    say: 'Хи-хи… Это мой дом. Здесь всегда темно. Если поймаешь меня — я покажу, кто я такой.',
    lose: 'Всё… Ты меня поймал. Сейчас я сниму шлем.',
    clue: '' },
];
const THIEF_FINALE = [
  { who: 'narrator', text: 'Воришка медленно снял чёрный шлем… Да это же дракончик!' },
  { who: 'tenek', text: 'Меня зовут Тенёк. Я дракончик планеты Сумрак. Наш маяк давно погас, стало так темно, что я боялся даже летать.' },
  { who: 'tenek', text: 'Однажды я увидел тебя, смелого космонавта, и сшил себе такой же скафандр. В нём я совсем не боялся!' },
  { who: 'tenek', text: 'А вкусняшки я собирал, чтобы зажечь маяк. Ведь для этого нужно сто вкусняшек… Простите меня. Я больше не буду брать чужое.' },
  { who: 'narrator', text: 'Космонавт обнял Тенька. Все вкусняшки, которые собрал Тенёк, сложили в маяк, и он загорелся! Свет вернулся на планету Сумрак!' },
  { who: 'snake', text: 'Ш-ш-ш! Я тоже когда-то хулиганил. Добро пожаловать в нашу компанию, Тенёк!', needFriend: true },
  { who: 'tenek', text: 'Ура! Теперь у меня есть друзья. И я больше никогда не буду бояться темноты!' },
];
const Thief = {
  // появляется с планеты Радуга (6-я) и дальше, когда никого не похитили
  due() {
    const th = T(), v = V();
    if (th.friend || th.ch >= THIEF_CHAPTERS.length || v.taken.length) return false;
    if (P().order < PLANET_BY_ID.rainbow.order) return false;
    if (th.ch === THIEF_CHAPTERS.length - 1) return P().id === 'night';
    return th.wins >= th.next;
  },
  chapter() { return THIEF_CHAPTERS[Math.min(T().ch, THIEF_CHAPTERS.length - 1)]; },
  fill(text) { return text.replace('{treats}', P().treatName); },
  emptyLine() {
    const th = T();
    if (th.ch >= THIEF_CHAPTERS.length - 1) return 'Гнездо пустое… Рядом следы, как у космонавта. Кто-то прячется в темноте!';
    return 'Гнездо пустое… Где же дракончик планеты Сумрак? Играй в игры, может быть, он найдётся.';
  },
  // воришка прилетает на главный экран и утаскивает мешок вкусняшек
  appear(home) {
    if (G.scene !== home || home.busy) return;
    const th = T(), ch = this.chapter(), ps = PS();
    home.busy = true;
    const tf = home.tf = { x: G.view.x1 + 150, y: 200, sack: 0, flip: true };
    Sound.whoosh(); Voice.say('Ой! Кто это летит на реактивном ранце?');
    G.tween(tf, { x: 980, y: 420 }, 1.8, G.ease.outQuad, () => {
      Sound.giggle(); Voice.say(this.fill(ch.say));
      th.stolen = Math.min(ps.treats, 10 + th.ch * 3); ps.treats -= th.stolen; S.save();
      for (let i = 0; i < Math.min(8, th.stolen); i++) UI.flyTreat(i % 6, G.view.x1 - 140, 60, tf.x - 40, tf.y + 10, i * 0.12);
      G.tween(tf, { sack: 1 }, 1.2);
      G.wait(4.5, () => {
        Sound.whoosh(); tf.flip = false;
        G.tween(tf, { x: G.view.x0 - 300, y: 120 }, 1.8, x => x * x, () => {
          home.tf = null; home.busy = false;
          th.active = true; S.save();
          G.go('chase');
        });
      });
    });
  },
  // поймали в погоне
  caught(scene, text) {
    const th = T(), ch = this.chapter(), c = scene.cm;
    stat('thiefCaught');
    Sound.win(); Sound.magic();
    G.tween(c, { x: 640, y: 300 }, 1.2, G.ease.inOutQuad);
    const back = (th.stolen || 0) + 5;
    Voice.say(text + ' ' + ch.lose);
    G.wait(1.4, () => UI.reward(back, 640, 380));
    th.active = false; th.stolen = 0;
    if (!th.seen.includes(th.ch)) th.seen.push(th.ch);
    const fin = !!ch.finale;
    th.ch++; th.wins = 0; th.next = M.ri(4, 6); S.save();
    for (let i = 0; i < 5; i++) setTimeout(() => G.burst(M.rnd(200, 1100), M.rnd(120, 400), { kind: 'confetti', n: 30, speed: 380 }), 800 + i * 300);
    if (fin) { setTimeout(() => { if (G.scene === scene) G.go('unmask'); }, 6000); return; }
    setTimeout(() => { if (G.scene === scene) { Voice.say(ch.clue); scene.clueT = 1; } }, 6500);
    setTimeout(() => { if (G.scene === scene) G.go('home'); }, 12500);
  },
};

// Погоня за воришкой — та же сцена, что и за кометой
G.scenes.chase = {
  enter() {
    const ch = Thief.chapter(), C = G.scenes.comet;
    Object.assign(this, { buttons: [] });
    C.enter.call(this, { who: 'thief', mode: ch.mode, finale: !!ch.finale });
  },
};
for (const k of Object.keys(G.scenes.comet)) if (k !== 'enter') G.scenes.chase[k] = G.scenes.comet[k];

// Финал: воришка снимает шлем
G.scenes.unmask = {
  enter() {
    const th = T();
    this.slides = THIEF_FINALE.filter(s => !s.needFriend || V().friend);
    this.i = 0; this.st = 0; this.k = 0; this.lit = 0;
    UI.add(this, { x: G.view.x1 - 80, y: G.view.y1 - 80, r: 50, icon: 'next', color: '#38d6c3', pulse: true, onTap: () => this.next() });
    th.friend = true; th.active = false;
    S.data.unlocked.includes('night') || S.data.unlocked.push('night');
    S.save(); stat('tenek');
    G.tween(this, { k: 1 }, 1.6, G.ease.inOutQuad, null, 0.6);
    this.say();
  },
  say() { const s = this.slides[this.i]; Voice.say(s.text); if (s.who === 'snake') Sound.hiss(); if (s.who === 'tenek') Sound.purr(1, { dragon: 'tenek' }); },
  next() {
    if (G.fadeDir) return;
    this.i++; this.st = 0;
    const s = this.slides[this.i];
    if (!s) { Voice.stop(); G.go('home'); return; }
    if (s.text.includes('загорелся')) {
      const ps = PS('night'); ps.beacon = true; ps.earned = Math.max(ps.earned || 0, BEACON_GOAL); S.save(); stat('beacons');
      Sound.magic(); G.tween(this, { lit: 1 }, 2.5, G.ease.inOutQuad);
      for (let i = 0; i < 8; i++) setTimeout(() => { G.burst(M.rnd(200, 1100), M.rnd(80, 350), { kind: 'star', n: 26, speed: 340, g: 120 }); Sound.chime(M.rnd(0.8, 1.4)); }, i * 350);
    }
    this.say();
  },
  update(dt) { this.st += dt; },
  draw(ctx) {
    const t = G.t, s = this.slides[this.i] || this.slides[this.slides.length - 1];
    World.bg(ctx, t, { planet: 'night', beaconOff: this.lit < 0.5, bright: this.lit > 0.5 });
    Art.beacon(ctx, BEACON_X, 512, 0.55, this.lit > 0.3, t, PLANET_BY_ID.night.beacon);
    Art.astronaut(ctx, 420, 610, 1.1, { t, anim: this.i >= 4 ? 'cheer' : 'idle', at: t });
    // Тенёк: сначала в скафандре, потом шлем снимается
    const k = this.k, x = 780;
    if (k < 1) { ctx.save(); ctx.globalAlpha = 1 - k; Art.astronaut(ctx, x, 610, 1.1, { t, dark: true, tail: true, eyes: true }); ctx.restore(); }
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k;
      Art.dragon(ctx, x, 620, 0.62, { kind: 'tenek', t, look: -1, happy: this.i >= 4, mouth: this.st < 3 && s.who === 'tenek' && Math.sin(t * 14) > 0 ? 0.4 : 0, mood: this.i < 3 ? 'sad' : undefined });
      // снятый шлем лежит рядом
      Art.ell(ctx, x + 140, 600, 30, 28, '#5a5478'); Art.ell(ctx, x + 136, 598, 22, 18, '#121318'); Art.ell(ctx, x + 128, 590, 6, 3, 'rgba(255,255,255,0.5)');
      ctx.restore();
    }
    if (V().friend && this.i >= 5) Art.serpentCoil(ctx, 1080, 640, 0.5, t, { open: s.who === 'snake' && this.st < 3 && Math.sin(t * 14) > 0, friend: true });
    if (this.lit > 0 && this.lit < 1) { ctx.save(); ctx.globalAlpha = Math.sin(this.lit * Math.PI) * 0.5; ctx.fillStyle = '#fff8d0'; const v = G.view; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); ctx.restore(); }
    // реплика
    const who = s.who, bg = who === 'tenek' ? 'rgba(30,30,90,0.94)' : who === 'snake' ? 'rgba(40,12,60,0.92)' : 'rgba(255,255,255,0.94)';
    Art.rr(ctx, 140, 40, 1000, 150, 34); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = who === 'tenek' ? '#fff3a0' : '#8f6cf2'; ctx.stroke();
    if (who !== 'narrator') UI.text(ctx, who === 'tenek' ? 'Тенёк' : 'Змей Шипун', 180, 68, 24, who === 'tenek' ? '#fff3a0' : '#c8e05a', 'left', false);
    UI.wrap(ctx, s.text, 640, 118, 920, 28, who === 'narrator' ? '#3a2a6a' : '#ffffff', 34);
  },
};
