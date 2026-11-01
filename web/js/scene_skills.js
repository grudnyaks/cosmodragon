// Умения Дракоши: открытые и те, что откроются на следующих уровнях
'use strict';
G.scenes.skills = {
  enter() {
    this.cards = [];
    for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
      const i = lvl - 2;
      this.cards.push({ lvl, x: 640 + ((i % 3) - 1) * 360, y: 230 + Math.floor(i / 3) * 170, pop: 0 });
    }
    this.cards.forEach((c, i) => G.tween(c, { pop: 1 }, 0.35, G.ease.outBack, null, i * 0.05));
    UI.homeButton(this);
    const have = this.cards.filter(c => S.data.level >= c.lvl).length;
    Voice.say(have ? 'Это умения Дракоши. Нажми на умение, чтобы узнать, что оно делает.' : 'Корми Дракошу, и у него появятся умения!');
  },
  down(x, y) {
    for (const c of this.cards) {
      if (Math.abs(x - c.x) < 165 && Math.abs(y - c.y) < 72) {
        c.pop = 0.85; G.tween(c, { pop: 1 }, 0.4, G.ease.outElastic);
        const L = LEVELS[c.lvl];
        if (S.data.level >= c.lvl) { Sound.chime(); Voice.say(L.title + '. ' + L.short + '.'); }
        else { Sound.boing(); Voice.say(L.title + '. Откроется, когда Дракоша вырастет до уровня ' + c.lvl + '.'); }
        return;
      }
    }
  },
  draw(ctx) {
    const t = G.t, d = S.data;
    Art.sky(ctx, '#22175e', '#4a2a90', '#8a5ad8');
    Art.stars(ctx, 61, 90, t);
    UI.text(ctx, 'Умения Дракоши', 640, 66, 46, '#ffd6f0', 'center', true);
    for (const c of this.cards) {
      const L = LEVELS[c.lvl], open = d.level >= c.lvl;
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.pop, c.pop);
      Art.rr(ctx, -160, -66 + 6, 320, 132, 30); ctx.fillStyle = 'rgba(20,8,50,0.35)'; ctx.fill();
      Art.rr(ctx, -160, -66, 320, 132, 30);
      ctx.fillStyle = open ? '#fff6fb' : 'rgba(80,60,130,0.75)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = open ? '#ffd23f' : '#2a1650'; ctx.stroke();
      Art.ell(ctx, -100, 0, 48, 48, open ? '#8f6cf2' : '#5a4a80'); ctx.lineWidth = 4; ctx.strokeStyle = '#2a1650'; ctx.stroke();
      ctx.save(); if (!open) ctx.globalAlpha = 0.35;
      Art.icon(ctx, L.icon, -100, 0, 1.05, t);
      ctx.restore();
      if (!open) Art.icon(ctx, 'lock', -70, 28, 0.7);
      UI.text(ctx, L.title, 52, -18, L.title.length > 12 ? 21 : 26, open ? '#5a3fa0' : '#d6c8ff', 'center', false);
      UI.text(ctx, 'уровень ' + c.lvl, 52, 26, 22, open ? '#ff7eb6' : '#b8a8e0', 'center', false);
      ctx.restore();
    }
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
