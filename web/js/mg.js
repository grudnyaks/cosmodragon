// Каркас для новых мини-игр: кнопки «домой» и «ещё раз», победа с наградой, табло, значки игр
'use strict';
const MG = {
  icons: {},
  // MG.game('key', { icon(ctx,t), init(), say, tick(dt), render(ctx,t), down/move/up, bg: false, ...свои методы })
  game(key, def) {
    const sc = Object.assign({}, def);
    sc.key = key;
    sc.enter = function (args) {
      this.lvl = GL(key); this.won = false; this.over = false; this.score = 0; this.T = 0;
      UI.homeButton(this);
      this.again = UI.add(this, { x: 640, y: 250, r: 64, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go(key) });
      this.dr = buddy();
      def.init && def.init.call(this, args || {});
      const say = typeof def.say === 'function' ? def.say.call(this) : def.say;
      if (say) Voice.say(say);
    };
    sc.win = function (text, n) {
      if (this.won || this.over) return;
      this.won = true; GW(key);
      Sound.win(); Sound.purr(1.4, { dragon: this.dr });
      UI.reward(n || 6, 640, 400);
      for (let i = 0; i < 3; i++) setTimeout(() => G.burst(M.rnd(250, 1050), M.rnd(150, 400), { kind: 'confetti', n: 30, speed: 380 }), i * 250);
      Voice.say(text || 'Ура! Получилось!');
      setTimeout(() => { if (G.scene === this) this.again.hidden = false; }, 1600);
    };
    sc.fail = function (text, n) {
      if (this.won || this.over) return;
      this.over = true;
      if (n) UI.reward(n, 640, 400);
      Voice.say(text || 'Почти получилось! Попробуй ещё раз!');
      setTimeout(() => { if (G.scene === this) this.again.hidden = false; }, 1200);
    };
    sc.update = function (dt) {
      this.T += dt;
      if (!this.won && !this.over && def.tick) def.tick.call(this, dt);
      if (def.anim) def.anim.call(this, dt);
    };
    sc.down = function (x, y) { if (!this.won && !this.over && def.down) def.down.call(this, x, y); };
    sc.move = function (x, y) { if (!this.won && !this.over && def.move) def.move.call(this, x, y); };
    sc.up = function (x, y) { if (def.up) def.up.call(this, x, y); };
    sc.draw = function (ctx) {
      const t = G.t;
      if (def.bg !== false) World.bg(ctx, t, { noDecor: !def.decor, noBeacon: true });
      def.render.call(this, ctx, t);
      if ((this.won || this.over) && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 150, 44, '#fff', 'center', true);
    };
    sc.drawTop = function (ctx) { UI.drawCounterTopRight(ctx); };
    G.scenes[key] = sc;
    if (def.icon) MG.icons[key] = def.icon;
  },
  // табло: полоска прогресса со счётом
  bar(ctx, k, label, color) {
    UI.progress(ctx, 400, 26, 480, 46, M.clamp(k, 0, 1), color || '#ff6f91');
    UI.text(ctx, label, 640, 50, 28, '#fff', 'center', true);
  },
  // часики
  clock(ctx, left, total) {
    const k = Math.max(0, left / total);
    Art.ell(ctx, 960, 50, 30, 30, '#fff'); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1650'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(960, 50); ctx.arc(960, 50, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.closePath(); ctx.fillStyle = k < 0.25 ? '#ff3b5c' : '#41d982'; ctx.fill();
    UI.text(ctx, String(Math.ceil(Math.max(0, left))), 1010, 52, 28, '#fff', 'left', true);
  },
  // подсказка-облачко сверху
  hint(ctx, text, y) {
    ctx.save(); ctx.globalAlpha = 0.9; Art.rr(ctx, 290, (y || 92) - 30, 700, 60, 30); ctx.fillStyle = 'rgba(30,14,70,0.65)'; ctx.fill(); ctx.restore();
    UI.text(ctx, text, 640, (y || 92) + 10, 28, '#fff', 'center', false);
  },
  // дракончик планеты в углу
  buddy(ctx, sc, x, y, s, o) { Art.dragon(ctx, x, y, s, Object.assign({ kind: sc.dr, t: G.t, happy: sc.won }, o || {})); },
};
const COLORS = [
  { id: 'red', name: 'красный', acc: 'красную', c: '#ff4d5e' }, { id: 'orange', name: 'оранжевый', acc: 'оранжевую', c: '#ff9a2a' },
  { id: 'yellow', name: 'жёлтый', acc: 'жёлтую', c: '#ffd23f' }, { id: 'green', name: 'зелёный', acc: 'зелёную', c: '#41c862' },
  { id: 'blue', name: 'голубой', acc: 'голубую', c: '#3fb8ff' }, { id: 'navy', name: 'синий', acc: 'синюю', c: '#3a5ad8' },
  { id: 'violet', name: 'фиолетовый', acc: 'фиолетовую', c: '#a05ae0' },
];
(function () {
  const old = Art.icon;
  Art.icon = function (ctx, name, x, y, s, t) {
    const f = MG.icons[name];
    if (!f) return old(ctx, name, x, y, s, t);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    f(ctx, t || 0);
    ctx.restore();
  };
})();
