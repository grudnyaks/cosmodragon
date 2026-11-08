// Пещера Шипуна изнутри: можно зайти в гости, поговорить с Шипуном, открыть сундук,
// поиграть на поющих кристаллах, попрыгать на грибах, угостить Шипуна и увидеть клетку с дракончиками
'use strict';
const LAIR_SAY = {
  grumpy: ['Ш-ш-ш! Кто разрешил входить в мою пещеру?', 'Ш-ш-ш! Не трогай мои кристаллы!', 'Ш-ш-ш! Я самый хитрый змей галактики!', 'Ш-ш-ш! Ты меня совсем не боишься?', 'Ш-ш-ш! Уходи! Хотя… можешь немножко посидеть.'],
  friend: ['Ш-ш-ш! Привет, друг! Заходи, будь как дома!', 'Ш-ш-ш! Поиграй на моих поющих кристаллах!', 'Ш-ш-ш! Я так рад гостям!', 'Ш-ш-ш! Жил-был змей, и не было у него друзей. А теперь есть! Это ты!', 'Ш-ш-ш! Попрыгай на грибочках, они пружинят!'],
  sky: ['Ш-ш-ш! Я видел в небе что-то быстрое и блестящее… Будь осторожен!', 'Ш-ш-ш! По ночам над пещерой кто-то пролетает. Ж-ж-жух!'],
  friend2: ['Ш-ш-ш! Шкода обещала прилететь в гости!', 'Ш-ш-ш! Мы со Шкодой играем в догонялки. Она всегда выигрывает!'],
};
const LAIR_CRYSTALS = [[330, 470, '#ff7eb6'], [430, 430, '#ffd23f'], [530, 455, '#41d982'], [760, 450, '#7ee8ff'], [860, 425, '#b07cff']];
const LAIR_SHROOMS = [[120, 655, '#ff5e7a'], [1180, 650, '#ffb23a'], [940, 668, '#8f6cf2']];
G.scenes.lair = {
  enter() {
    const v = V();
    stat('cave');
    this.sn = { talk: 0, happy: 0, chomp: 0 };
    this.chestK = { k: 0 };
    this.cr = LAIR_CRYSTALS.map(() => ({ glow: 0 }));
    this.sh = LAIR_SHROOMS.map(() => ({ sq: 0 }));
    this.lineI = 0;
    UI.homeButton(this);
    UI.add(this, { x: G.view.x0 + 140, y: 56, r: 33, icon: 'snake', color: '#8f6cf2', onTap: () => { Voice.stop(); G.go('story'); } });
    this.feedBtn = UI.add(this, { x: 830, y: 300, r: 40, color: '#ffd23f', draw: (ctx) => Art.treat(ctx, 0, 0, 4, 0.55, G.t), onTap: () => this.feed() });
    this.rescueBtn = UI.add(this, { x: 1020, y: 120, w: 360, h: 76, label: 'Спасти!', icon: 'sword', iconX: -130, fontSize: 30, color: '#ff3b5c', pulse: true, hidden: true,
      onTap: () => { Voice.stop(); G.go('rescue'); } });
    Sound.hiss();
    G.wait(0.4, () => this.greet());
  },
  today() { const d = new Date(); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); },
  caged() { const v = V(); return v.taken.length && v.villain !== 'comet' ? v.taken : []; },
  greet() {
    const v = V(), c = this.caged();
    let line;
    if (c.length) line = v.keys >= 3 ? 'Ш-ш-ш! Ты нашёл все ключи? Ну попробуй, спаси дракончиков!' : 'Ш-ш-ш! Дракончики сидят в моей клетке! Сначала найди три ключа!';
    else if (v.taken.length) line = 'Ш-ш-ш! Это Шкода опять хулиганит! Собери три звезды в играх, и мы её поймаем!';
    else if (v.friend) line = 'Ш-ш-ш! Привет, друг! Добро пожаловать в мою пещеру!';
    else line = 'Ш-ш-ш! Кто это пришёл в мою Тёмную пещеру? Смелый какой!';
    this.say(line);
  },
  say(text) { this.sn.talk = Math.min(5, 1 + text.length / 18); Voice.say(text); Sound.hiss(); },
  tapSnake() {
    const v = V();
    let pool = v.friend ? LAIR_SAY.friend.slice() : LAIR_SAY.grumpy;
    if (v.friend && !v.friend2 && Villain.chapter() != null) pool = pool.concat(LAIR_SAY.sky);
    if (v.friend2) pool = pool.concat(LAIR_SAY.friend2);
    if (v.taken.length) { this.greet(); return; }
    this.lineI = (this.lineI + 1 + M.ri(0, pool.length - 2)) % pool.length;
    this.say(pool[this.lineI]);
    if (v.friend) G.burst(640, 300, { kind: 'heart', n: 5, up: true, g: -60, speed: 140 });
  },
  feed() {
    const v = V(), ps = PS();
    if (ps.treats <= 0) { Voice.say('Вкусняшки закончились! Поиграй в игры, чтобы найти ещё.'); return; }
    ps.treats--; stat('snakeFed');
    this.sn.chomp = 0.6; this.sn.happy = 2.5;
    UI.flyTreat(M.ri(0, 5), this.feedBtn.x, this.feedBtn.y, 700, 250, 0, () => { Sound.chomp(); G.burst(700, 250, { kind: 'star', n: 10, speed: 200 }); });
    // накормленный Шипун добреет и придёт за дракончиками попозже
    if (!v.friend && !v.taken.length && v.wins > 0) v.wins--;
    S.save();
    G.wait(0.6, () => this.say(v.friend ? M.pick(['Ш-ш-ш! Спасибо, друг! Очень вкусно!', 'Ш-ш-ш! Ням-ням! Ты самый лучший!']) : M.pick(['Ш-ш-ш! Вкусно… Ладно, сегодня я добрый.', 'Ш-ш-ш! Ням! Может, я ещё немножко подожду с похищением…'])));
  },
  openChest() {
    const c = Care.data(), v = V();
    if (c.lairDay === this.today()) { Sound.boing(); Voice.say(v.friend ? 'Ш-ш-ш! Сундук пустой. Приходи завтра, я положу ещё!' : 'Ш-ш-ш! Пусто! Приходи завтра.'); this.sn.talk = 2; return; }
    c.lairDay = this.today(); stat('chest');
    const n = v.friend ? 3 : 1;
    G.tween(this.chestK, { k: 1 }, 0.6, G.ease.outBack);
    Sound.magic(); UI.reward(n, 230, 520);
    G.burst(230, 520, { kind: 'star', n: 20, up: true, speed: 260 });
    this.say(v.friend ? 'Ш-ш-ш! Это мои сокровища. Бери, друг, мне не жалко!' : 'Ш-ш-ш! Мой сундук! Ну ладно, возьми одну вкусняшку. Только одну!');
    S.save();
  },
  down(x, y) {
    if (Math.hypot(x - 230, y - 590) < 110) return this.openChest();
    for (let i = 0; i < LAIR_CRYSTALS.length; i++) {
      const [cx, cy] = LAIR_CRYSTALS[i];
      if (Math.abs(x - cx) < 45 && y > cy - 90 && y < cy + 10) { Sound.note(i); this.cr[i].glow = 1; G.burst(cx, cy - 40, { kind: 'star', n: 5, speed: 120, size: 10 }); return; }
    }
    for (let i = 0; i < LAIR_SHROOMS.length; i++) {
      const [mx, my] = LAIR_SHROOMS[i];
      if (Math.abs(x - mx) < 60 && y > my - 110 && y < my + 10) { Sound.boing(); const s = this.sh[i]; s.sq = 1; G.tween(s, { sq: 0 }, 0.7, G.ease.outElastic); G.burst(mx, my - 90, { kind: 'star', n: 6, up: true, speed: 200 }); return; }
    }
    if (Math.abs(x - 640) < 200 && y > 220 && y < 660) return this.tapSnake();
    if (Math.abs(x - 1040) < 140 && y > 180 && y < 520 && this.caged().length) {
      Sound.purr(1, { dragon: this.caged()[0] }); Voice.say(V().keys >= 3 ? 'Нажми на красную кнопку, чтобы открыть клетку!' : 'Дракончики ждут тебя! Найди три ключа в играх.');
    }
    if (Math.abs(x - 420) < 90 && Math.abs(y - 250) < 80) { Sound.pop(1); Voice.say(V().friend ? 'Это фото: Шипун и его друзья-дракончики!' : 'Ш-ш-ш! Это мой план: поймать всех дракончиков галактики!'); }
  },
  update(dt) {
    const s = this.sn;
    s.talk = Math.max(0, s.talk - dt); s.happy = Math.max(0, s.happy - dt); s.chomp = Math.max(0, s.chomp - dt);
    for (const c of this.cr) c.glow = Math.max(0, c.glow - dt * 1.5);
    const v = V();
    this.rescueBtn.hidden = !(this.caged().length && v.keys >= 3);
  },
  draw(ctx) {
    const t = G.t, v = V(), friend = v.friend;
    Art.caveInside(ctx, t, { warm: friend });
    // картинка на стене
    Art.wallPicture(ctx, 420, 250, 0.9, t, friend);
    // поющие кристаллы
    LAIR_CRYSTALS.forEach(([cx, cy, c], i) => {
      const g = this.cr[i].glow;
      ctx.save(); ctx.globalAlpha = 0.25 + g * 0.6; ctx.fillStyle = Art.rg(ctx, cx, cy - 40, 80 + g * 40, c, 'rgba(0,0,0,0)', 0, 0); Art.ell(ctx, cx, cy - 40, 80 + g * 40, 80 + g * 40); ctx.fill(); ctx.restore();
      Art.crystal(ctx, cx, cy, 0.8 + g * 0.1, c);
    });
    // гирлянда после дружбы
    if (friend) for (let i = 0; i < 14; i++) { const x = 150 + i * 75, y = 160 + Math.sin(i * 0.9) * 18; Art.ell(ctx, x, y, 9, 9, ['#ff7eb6', '#ffd23f', '#7ee8ff', '#41d982'][i % 4]); }
    // сундук
    Art.lairChest(ctx, 230, 620, 0.9, t, this.chestK.k);
    // грибы
    LAIR_SHROOMS.forEach(([mx, my, c], i) => Art.bouncyShroom(ctx, mx, my, 0.9, c, this.sh[i].sq));
    // клетка с дракончиками (если Шипун их утащил)
    const caged = this.caged();
    if (caged.length) {
      caged.forEach((id, i) => Art.dragon(ctx, 1040 + (caged.length > 1 ? (i ? 55 : -55) : 0), 455, 0.36, { kind: id, t: t + i, look: -1, mood: 'sad' }));
      Art.cage(ctx, 1040, 270, 0.85, t, 0);
    } else if (friend) {
      // дракончики пришли в гости
      PD().slice(0, 2).forEach((d, i) => Art.dragon(ctx, 1000 + i * 120, 640 - i * 10, 0.48, { kind: d.id, t: t + i, happy: this.sn.happy > 0, look: -1 }));
    }
    // Шипун
    const talk = this.sn.talk > 0 && Math.sin(t * 14) > 0;
    Art.serpentCoil(ctx, 640, 590, 0.85, t, { open: talk || this.sn.chomp > 0, friend: friend || this.sn.happy > 0, angry: !friend && caged.length > 0 });
    if (this.sn.happy > 0 && !friend) UI.text(ctx, '♥', 700, 300 - (2.5 - this.sn.happy) * 30, 40, '#ff7eb6', 'center', true);
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
