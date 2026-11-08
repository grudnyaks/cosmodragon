// Имя для дракончика: готовые варианты или своё (экранная клавиатура для взрослых)
'use strict';
const RU_KEYS = ['ЙЦУКЕНГШЩЗХ', 'ФЫВАПРОЛДЖЭ', 'ЯЧСМИТЬБЮЁЪ'];
G.scenes.name = {
  enter(args) {
    this.id = (args && args.id) || 'dark';
    this.text = Care.custom(this.id) ? Care.name(this.id) : '';
    this.kb = false;
    UI.homeButton(this);
    const ideas = NAME_IDEAS.filter(n => n !== Care.name(this.id === 'dark' ? 'light' : 'dark'));
    this.ideaBtns = ideas.slice(0, 10).map((n, i) => UI.add(this, { x: 520 + (i % 2) * 260, y: 180 + Math.floor(i / 2) * 82, w: 240, h: 64, label: n, fontSize: 26,
      color: n === Care.name(this.id) ? '#ff7eb6' : '#8f6cf2', onTap: () => this.pick(n) }));
    this.ownBtn = UI.add(this, { x: 1060, y: 180, w: 260, h: 64, label: 'Своё имя', icon: 'pencil', iconX: -95, fontSize: 24, color: '#38d6c3', onTap: () => this.openKb() });
    this.resetBtn = UI.add(this, { x: 1060, y: 262, w: 260, h: 64, label: 'Как было', fontSize: 24, color: '#5a5a7a', onTap: () => this.pick(DRAGON_BY_ID[this.id].name) });
    // клавиатура
    this.keys = [];
    RU_KEYS.forEach((row, r) => [...row].forEach((ch, i) => this.keys.push(UI.add(this, { x: 640 - (row.length - 1) * 46 + i * 92, y: 400 + r * 80, w: 84, h: 70, label: ch, fontSize: 30, color: '#5a5a7a', hidden: true,
      onTap: () => { if (this.text.length < 12) this.text += this.text ? ch.toLowerCase() : ch; } }))));
    this.keys.push(UI.add(this, { x: 460, y: 645, w: 200, h: 64, label: '⌫ Стереть', fontSize: 24, color: '#c8304a', hidden: true, onTap: () => { this.text = this.text.slice(0, -1); } }));
    this.keys.push(UI.add(this, { x: 690, y: 645, w: 200, h: 64, label: 'Пробел', fontSize: 24, color: '#5a5a7a', hidden: true, onTap: () => { if (this.text && this.text.length < 12) this.text += ' '; } }));
    this.keys.push(UI.add(this, { x: 920, y: 645, w: 200, h: 64, label: 'Готово', fontSize: 26, color: '#41d982', hidden: true, onTap: () => { const n = this.text.trim(); if (n) this.pick(n); } }));
    Voice.say('Как зовут дракончика? Выбери имя!');
  },
  openKb() {
    this.kb = true;
    for (const b of this.ideaBtns) b.hidden = true;
    this.ownBtn.hidden = this.resetBtn.hidden = true;
    for (const k of this.keys) k.hidden = false;
    Voice.say('Попроси взрослого напечатать имя.');
  },
  pick(n) {
    Care.setName(this.id, n === DRAGON_BY_ID[this.id].name ? '' : n);
    Sound.magic(); this.done = 0.01;
    G.burst(250, 380, { kind: 'heart', n: 14, colors: ['#ff5e9a', '#ffd23f', '#7ee8ff'], up: true, speed: 260, size: 22 });
    Sound.purr(1.4, { dragon: this.id });
    Voice.say('Привет, ' + n + '!');
    setTimeout(() => { if (G.scene === this) G.go('home'); }, 2400);
  },
  draw(ctx) {
    const t = G.t;
    World.bg(ctx, t, {});
    ctx.save(); ctx.fillStyle = 'rgba(20,10,50,0.35)'; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0); ctx.restore();
    if (!this.kb) {
      Art.dragon(ctx, 230, 620, 0.85, { kind: this.id, t, happy: !!this.done, look: 0.6, blink: (t % 3.2) < 0.13 ? 1 : 0 });
      UI.text(ctx, 'Как зовут дракончика?', 780, 90, 40, '#fff', 'center', true);
    } else {
      Art.dragon(ctx, 140, 330, 0.55, { kind: this.id, t, look: 0.6 });
      Art.rr(ctx, 400, 120, 560, 110, 30); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      UI.text(ctx, (this.text || '') + ((t % 1) < 0.5 ? '|' : ' '), 680, 175, 54, '#3a1f6a', 'center', false);
      UI.text(ctx, 'Напечатайте имя дракончика', 680, 270, 26, '#fff', 'center', true);
    }
  },
};
