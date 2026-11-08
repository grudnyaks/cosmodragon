// Рисовалка: раскрась дракончика (заливка частей) и дорисуй кисточкой; рисунки сохраняются в альбом
'use strict';
const PAINT_COLORS = ['#ff3b5c', '#ff9a3c', '#ffd23f', '#41d982', '#38d6c3', '#3fb8ff', '#8f6cf2', '#ff7eb6', '#7a4a2a', '#2a2833', '#ffffff', '#c8c8d0'];
const PAINT_BLANK = { body: '#e4e4ea', belly: '#f4f4f6', wing: '#d8d8e0', horn: '#f0f0f0', eye: '#9a9aaa' };
const PAINT_X = 400, PAINT_Y = 660, PAINT_S = 1.05;
function paintPart(x, y) {
  const lx = (x - PAINT_X) / PAINT_S, ly = (y - PAINT_Y) / PAINT_S;
  const inE = (cx, cy, rx, ry) => ((lx - cx) / rx) ** 2 + ((ly - cy) / ry) ** 2 < 1;
  if (inE(-27, -206, 18, 17) || inE(27, -206, 18, 17)) return 'eye';
  if (ly < -232 && Math.abs(lx) > 14 && Math.abs(lx) < 80) return 'horn';
  if (inE(0, -66, 38, 58)) return 'belly';
  if (inE(0, -200, 64, 58) || inE(0, -82, 66, 82) || inE(-56, -38, 40, 38) || inE(56, -38, 40, 38) || (lx > 40 && lx < 190 && ly > -70 && ly < 50)) return 'body';
  if (Math.abs(lx) > 36 && Math.abs(lx) < 180 && ly > -270 && ly < -80) return 'wing';
  return null;
}
function drawPainting(ctx, p, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  Art.dragon(ctx, PAINT_X, PAINT_Y, PAINT_S, { kind: 'dark', t: 0, colors: p.colors, outfit: {}, look: 0 });
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const st of p.strokes) {
    ctx.beginPath(); st.p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    if (st.p.length === 1) ctx.lineTo(st.p[0][0] + 0.1, st.p[0][1]);
    ctx.lineWidth = st.w; ctx.strokeStyle = st.c; ctx.stroke();
  }
  ctx.restore();
}
G.scenes.paint = {
  enter() {
    UI.homeButton(this);
    this.p = { colors: Object.assign({}, PAINT_BLANK), strokes: [] };
    this.color = PAINT_COLORS[0]; this.tool = 'fill'; this.cur = null; this.saved = false;
    this.sw = PAINT_COLORS.map((c, i) => UI.add(this, { x: 880 + (i % 3) * 86, y: 170 + Math.floor(i / 3) * 86, r: 36, color: c, onTap: () => { this.color = c; Sound.pop(1.2); } }));
    this.tFill = UI.add(this, { x: 1180, y: 170, r: 38, icon: 'palette', color: '#ffffff', onTap: () => { this.tool = 'fill'; Voice.say('Нажимай на дракончика — он раскрасится.'); } });
    this.tBrush = UI.add(this, { x: 1180, y: 256, r: 38, icon: 'pencil', color: '#ffffff', onTap: () => { this.tool = 'brush'; Voice.say('Рисуй пальцем!'); } });
    UI.add(this, { x: 1180, y: 342, r: 38, icon: 'replay', color: '#ff9a3c', onTap: () => { this.p = { colors: Object.assign({}, PAINT_BLANK), strokes: [] }; this.saved = false; Sound.whoosh(); } });
    UI.add(this, { x: 960, y: 560, w: 300, h: 72, label: 'В альбом', icon: 'album', iconX: -105, fontSize: 28, color: '#41d982', onTap: () => this.save() });
    UI.add(this, { x: 960, y: 650, w: 300, h: 64, label: 'Мой альбом', fontSize: 24, color: '#8f6cf2', onTap: () => G.go('album') });
    Voice.say('Раскрась дракончика! Выбери цвет и нажми на дракончика. А кисточкой можно рисовать.');
  },
  down(x, y) {
    if (x > 780) return;
    if (this.tool === 'fill') {
      const part = paintPart(x, y);
      if (part) { this.p.colors[part] = this.color; this.saved = false; Sound.pop(1 + Math.random() * 0.5); G.burst(x, y, { kind: 'dot', n: 8, colors: [this.color], speed: 140, size: 8 }); }
    } else {
      if (this.p.strokes.reduce((a, s) => a + s.p.length, 0) > 4000) return;
      this.cur = { c: this.color, w: 14, p: [[Math.round(x), Math.round(y)]] }; this.p.strokes.push(this.cur); this.saved = false;
    }
  },
  move(x, y) {
    if (!this.cur) return;
    const l = this.cur.p[this.cur.p.length - 1];
    if (Math.hypot(x - l[0], y - l[1]) > 5) this.cur.p.push([Math.round(M.clamp(x, 0, 780)), Math.round(y)]);
  },
  up() { this.cur = null; },
  save() {
    if (this.saved) { Voice.say('Этот рисунок уже в альбоме!'); return; }
    const al = Care.data().album || (Care.data().album = []);
    al.push({ colors: Object.assign({}, this.p.colors), strokes: this.p.strokes.map(s => ({ c: s.c, w: s.w, p: s.p.slice() })), t: Date.now() });
    while (al.length > 12) al.shift();
    S.save(); this.saved = true; stat('paint');
    Sound.magic(); G.burst(400, 360, { kind: 'star', n: 18, speed: 260, size: 14 });
    Voice.say('Какая красота! Рисунок в альбоме.');
  },
  draw(ctx) {
    const t = G.t;
    const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#fff6e8'); g.addColorStop(1, '#ffe8d0');
    ctx.fillStyle = g; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0);
    Art.rr(ctx, 30, 110, 760, 590, 30); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e8c89a'; ctx.stroke();
    ctx.save(); Art.rr(ctx, 30, 110, 760, 590, 30); ctx.clip(); drawPainting(ctx, this.p, 0, 0, 1); ctx.restore();
    UI.text(ctx, 'Рисовалка', 640, 60, 42, '#8a4a2a', 'center', false);
    // выбранный цвет и инструмент
    const b = this.sw.find(s => s.color === this.color);
    if (b) { ctx.beginPath(); ctx.arc(b.x, b.y, 44, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = '#3a1f4a'; ctx.stroke(); }
    const tb = this.tool === 'fill' ? this.tFill : this.tBrush;
    ctx.beginPath(); ctx.arc(tb.x, tb.y, 46, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = this.color; ctx.stroke();
  },
};
G.scenes.album = {
  enter() {
    UI.homeButton(this);
    this.view = null;
    UI.add(this, { x: G.view.x1 - 170, y: 70, w: 260, h: 64, label: 'Рисовать', icon: 'palette', iconX: -90, fontSize: 24, color: '#41d982', onTap: () => G.go('paint') });
    const al = Care.data().album || [];
    Voice.say(al.length ? 'Это твой альбом. Нажми на рисунок, чтобы посмотреть.' : 'Альбом пока пустой. Нарисуй дракончика!');
  },
  pos(i) { return [230 + (i % 4) * 275, 220 + Math.floor(i / 4) * 175]; },
  down(x, y) {
    if (this.view != null) { this.view = null; return; }
    const al = Care.data().album || [];
    for (let i = 0; i < al.length; i++) { const [cx, cy] = this.pos(i); if (Math.abs(x - cx) < 120 && Math.abs(y - cy) < 80) { this.view = i; Sound.pop(1.2); return; } }
  },
  draw(ctx) {
    const al = (Care.data().album || []).slice();
    const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#fff6e8'); g.addColorStop(1, '#ffe8d0');
    ctx.fillStyle = g; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0);
    UI.text(ctx, 'Мой альбом', 640, 70, 46, '#8a4a2a', 'center', false);
    al.forEach((p, i) => {
      const [cx, cy] = this.pos(i);
      Art.rr(ctx, cx - 120, cy - 80, 240, 160, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e8c89a'; ctx.stroke();
      ctx.save(); Art.rr(ctx, cx - 120, cy - 80, 240, 160, 16); ctx.clip();
      drawPainting(ctx, p, cx - 128, cy - 110, 0.27);
      ctx.restore();
    });
    if (this.view != null && al[this.view]) {
      ctx.save(); ctx.fillStyle = 'rgba(40,20,20,0.6)'; ctx.fillRect(G.view.x0, G.view.y0, G.view.x1 - G.view.x0, G.view.y1 - G.view.y0); ctx.restore();
      Art.rr(ctx, 260, 60, 760, 620, 30); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.save(); Art.rr(ctx, 260, 60, 760, 620, 30); ctx.clip(); drawPainting(ctx, al[this.view], 230, -40, 1); ctx.restore();
    }
  },
};
