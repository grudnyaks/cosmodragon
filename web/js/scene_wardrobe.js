// Гардероб: наряды для дракончиков за вкусняшки
'use strict';
G.scenes.wardrobe = {
  enter() {
    UI.homeButton(this);
    this.id = buddy();
    this.tabs = DRAGONS.map((D, i) => UI.add(this, { x: 150 + i * 220, y: 150, w: 200, h: 60, label: Care.name(D.id), fontSize: 24, color: '#5a5a7a', onTap: () => { this.id = D.id; this.sync(); Sound.purr(0.8, { dragon: D.id }); } }));
    this.items = OUTFITS.map((o, i) => UI.add(this, { x: 640 + (i % 4) * 150, y: 210 + Math.floor(i / 4) * 160, r: 62, color: '#ffffff', item: o.id,
      draw: (ctx) => this.drawItem(ctx, o), onTap: () => this.tap(o) }));
    this.sync();
    Voice.say('Это гардероб! Выбери наряд для дракончика. Новые наряды стоят вкусняшки.');
  },
  sync() {
    this.tabs.forEach((b, i) => { b.color = DRAGONS[i].id === this.id ? '#ff7eb6' : '#5a5a7a'; b.label = Care.name(DRAGONS[i].id); });
  },
  tap(o) {
    if (!Care.owned(o.id)) {
      if (!Care.buy(o.id)) { Sound.bump(); Voice.say('Не хватает вкусняшек! Поиграй в игры, чтобы собрать ещё.'); return; }
      Sound.coin(); Sound.magic(); Voice.say('Ура! Новый наряд: ' + o.name.toLowerCase() + '!');
      G.burst(250, 300, { kind: 'star', n: 16, speed: 260, size: 16 });
    }
    const on = Care.wear(this.id, o.id);
    if (on) { Sound.pop(1.3); this.happy = 1.6; setTimeout(() => Sound.purr(1, { dragon: this.id }), 300); }
    else Sound.pop(0.8);
  },
  drawItem(ctx, o) {
    const owned = Care.owned(o.id), worn = Care.outfit(this.id)[o.slot] === o.id;
    if (worn) { ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.lineWidth = 7; ctx.strokeStyle = '#41d982'; ctx.stroke(); }
    const y = o.slot === 'head' ? 18 : o.slot === 'face' ? 0 : -6, sc = o.slot === 'face' ? 0.75 : 0.8;
    Art.outfitItem(ctx, o.id, 0, y, sc, G.t);
    if (!owned) {
      Art.rr(ctx, -44, 34, 88, 34, 17); ctx.fillStyle = PS().treats >= o.price ? '#ffd23f' : '#c8c0d8'; ctx.fill();
      Art.treat(ctx, 4, -22, 51, 0.28, G.t);
      UI.text(ctx, String(o.price), 12, 51, 22, '#3a1f4a', 'center', false);
    }
  },
  update(dt) { this.happy = Math.max(0, (this.happy || 0) - dt); },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, {});
    ctx.save(); ctx.fillStyle = 'rgba(30,14,70,0.35)'; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0); ctx.restore();
    UI.text(ctx, 'Гардероб', 840, 80, 46, '#fff', 'center', true);
    Art.dragon(ctx, 260, 640, 0.95, { kind: this.id, t, happy: this.happy > 0, look: 0.5, blink: (t % 3.1) < 0.13 ? 1 : 0, squash: this.happy > 1.2 ? 0.3 : 0 });
  },
  drawTop(ctx) { UI.drawCounterTopRight(ctx); },
};
