// Поиск сокровищ: нажимай на кусты, камни и грибы — найди сундук
'use strict';
G.scenes.treasure = {
  enter() {
    const kinds = ['bush', 'rock', 'mushroom', 'crystal', 'bush', 'rock', 'mushroom', 'bush'];
    const pos = [[170, 470], [400, 450], [640, 470], [880, 450], [280, 640], [520, 650], [760, 640], [1000, 630]];
    const colors = ['#ff7eb6', '#ffb23a', '#7ee8ff', '#b07cff', '#8dff9a', '#ffd23f'];
    M.shuffle(kinds);
    const contents = M.shuffle(['chest', 'treat', 'treat', 'empty', 'empty', 'empty', 'empty', 'empty']);
    this.spots = pos.map((p, i) => ({ x: p[0], y: p[1], kind: kinds[i], color: M.pick(colors), what: contents[i], open: false, wob: 0, off: 0, a: 1, popK: 0 }));
    this.fails = 0; this.won = false; this.hintSpot = null;
    this.dr = { look: -1, happy: 0, squash: 0 };
    UI.homeButton(this);
    this.again = UI.add(this, { x: 640, y: 330, r: 70, icon: 'replay', color: '#41d982', pulse: true, hidden: true, onTap: () => G.go('treasure') });
    S.data.treasure++; S.save();
    Voice.say(hasAbility('glow') ? 'Найди сундук с вкусняшками! Дракоша светится и подскажет, где он.' : 'Найди сундук с вкусняшками! Нажимай на кустики, камушки и грибы.');
  },
  down(x, y) {
    if (this.won) return;
    for (const s of this.spots) {
      if (s.open) continue;
      if (Math.abs(x - s.x) < 80 && y < s.y + 20 && y > s.y - 120) { this.openSpot(s); return; }
    }
  },
  openSpot(s) {
    s.open = true; Sound.dig();
    G.burst(s.x, s.y - 20, { kind: 'smoke', n: 10, colors: ['#ffffff', '#d4fff6'], g: -40, speed: 150, size: 14 });
    G.tween(s, { off: 1 }, 0.45, G.ease.outQuad);
    G.tween(s, { popK: 1 }, 0.6, G.ease.outBack, null, 0.2);
    if (s.what === 'chest') {
      this.won = true;
      setTimeout(() => {
        Sound.win(); s.chestOpen = true;
        G.burst(s.x, s.y - 60, { kind: 'star', n: 30, speed: 380 });
        UI.reward(5, s.x, s.y - 60);
        Voice.say(M.pick(['Ура! Сундук с вкусняшками!', 'Нашёл! Молодец!', 'Вот это клад!']));
        this.dr.happy = 3; Sound.purr(1.5);
        setTimeout(() => { this.again.hidden = false; }, 1600);
      }, 700);
    } else if (s.what === 'treat') {
      s.treatType = M.ri(0, 4);
      setTimeout(() => { Sound.chime(); UI.reward(1, s.x, s.y - 60); s.taken = true; }, 600);
    } else {
      this.fails++;
      setTimeout(() => {
        Sound.boing();
        G.burst(s.x, s.y - 60, { kind: 'dot', n: 6, colors: ['#fff6a8', '#7ee8ff'], g: -100, speed: 90, size: 10 });
      }, 300);
      const need = hasAbility('glow') ? 1 : 3;
      if (this.fails >= need && !this.hintSpot) {
        this.hintSpot = this.spots.find(q => q.what === 'chest');
        if (hasAbility('glow')) Voice.say('Смотри, Дракоша светится! Сундук там, где искорки.');
      }
    }
  },
  update(dt) { this.dr.happy = Math.max(0, this.dr.happy - dt); },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, { noDecor: true });
    // подсветка подсказки
    if (this.hintSpot && !this.hintSpot.open) {
      const h = this.hintSpot;
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3;
      Art.ell(ctx, h.x, h.y - 40, 95, 75); ctx.fillStyle = Art.rg(ctx, h.x, h.y - 40, 95, 'rgba(255,240,120,0.9)', 'rgba(255,240,120,0)', 0, 0); ctx.fill();
      ctx.restore();
      if (Math.random() < 0.15) G.burst(h.x + M.rnd(-50, 50), h.y - M.rnd(20, 100), { kind: 'star', n: 1, g: -30, speed: 30, size: 10, colors: ['#ffd23f', '#fff'] });
    }
    const sorted = this.spots.slice().sort((a, b) => a.y - b.y);
    for (const s of sorted) {
      // что спрятано
      if (s.open) {
        const k = s.popK;
        if (s.what === 'chest') Art.chest(ctx, s.x, s.y, 0.2 + k * 0.85, s.chestOpen, t);
        else if (s.what === 'treat' && !s.taken) Art.treat(ctx, s.treatType, s.x, s.y - 40 - k * 30, k * 0.9, t);
        else if (s.what === 'empty') { ctx.save(); ctx.globalAlpha = 0.5; Art.crater(ctx, s.x, s.y, 0.7); ctx.restore(); }
      }
      // укрытие уезжает в сторону
      ctx.save(); ctx.globalAlpha = 1 - s.off;
      const ox = s.off * 70, oy = -s.off * 30;
      const wob = Math.sin(t * 3 + s.x) * 0.02;
      ctx.translate(s.x + ox, s.y + oy); ctx.rotate(wob + s.off * 0.5); ctx.translate(-s.x, -s.y);
      if (s.kind === 'bush') Art.bush(ctx, s.x, s.y, 1.2, s.color, t);
      else if (s.kind === 'rock') Art.rock(ctx, s.x, s.y, 1.2);
      else if (s.kind === 'mushroom') Art.mushroom(ctx, s.x, s.y, 1.05, s.color, t);
      else Art.crystal(ctx, s.x, s.y, 1.05, s.color);
      ctx.restore();
    }
    Art.dragon(ctx, 1170, 690, 0.55, { t, level: S.data.level, look: -1, happy: this.dr.happy > 0, blink: (t % 3.5 < 0.13) ? 1 : 0, glow: !!this.hintSpot && hasAbility('glow') });
  },
  drawTop(ctx) {
    UI.drawCounterTopRight(ctx);
    if (this.won && !this.again.hidden) UI.text(ctx, 'Ещё раз?', 640, 230, 48, '#fff', 'center', true);
  },
};
