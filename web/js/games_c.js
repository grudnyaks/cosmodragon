// Новые игры: Джунгария (лианы, бананы), Цветения (пчёлка, букет), Песчания (раскопки, узоры каравана)
'use strict';
(function () {
  const ell = Art.ell, TAU = Math.PI * 2, LINE = '#2a1650';
  const NUM = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
  const banana = (ctx, x, y, s, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-30, -10); ctx.quadraticCurveTo(0, 30, 32, -12); ctx.quadraticCurveTo(0, 12, -30, -10); ctx.closePath(); ctx.fillStyle = '#ffe14a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore(); };

  // ================= Джунгария: Прыжки по лианам =================
  MG.game('vines', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-14, -30); ctx.quadraticCurveTo(-24, 0, -6, 24); ctx.moveTo(16, -30); ctx.quadraticCurveTo(26, 0, 10, 24); ctx.lineWidth = 5; ctx.strokeStyle = '#2a8a3a'; ctx.stroke(); ell(ctx, -6, 24, 7, 7, '#a8742a'); },
    init() { this.xs = [180, 400, 620, 840, 1060]; this.i = 0; this.ph = 0; this.fly = null; this.need = this.xs.length - 1; this.speed = 2.2 + this.lvl * 0.25; },
    say: 'Прыгай с лианы на лиану! Нажимай, когда лиана качнётся вперёд и засветится зелёным!',
    ang() { return Math.sin(this.ph) * 0.6; },
    good() { return Math.cos(this.ph) > 0.15; },
    pos() { const L = 330, a = this.ang(), x0 = this.xs[this.i]; return { x: x0 + Math.sin(a) * L, y: 90 + Math.cos(a) * L }; },
    down() {
      if (this.fly) return;
      const p = this.pos();
      if (this.good()) {
        Sound.whoosh();
        const tgt = this.xs[this.i + 1];
        this.fly = { x: p.x, y: p.y, sx: p.x, sy: p.y, tx: tgt, ty: 90 + 330, k: 0, ok: true };
        G.tween(this.fly, { k: 1 }, 0.55, G.ease.inOutQuad, () => {
          this.i++; this.ph = Math.PI * 1.5; this.fly = null; Sound.pop(1.1); Sound.chime(1 + this.i * 0.1);
          if (this.i >= this.xs.length - 1) { G.burst(1060, 300, { kind: 'star', n: 20, speed: 260 }); this.win('Ура! Ты допрыгал до бананов! Как настоящая обезьянка!'); }
        });
      } else {
        Sound.boing(); Voice.say(M.pick(['Подожди, пока лиана качнётся вперёд!', 'Рано! Жди зелёного огонька!']));
      }
    },
    tick(dt) { if (!this.fly) this.ph += dt * this.speed; else { const f = this.fly; f.x = M.lerp(f.sx, f.tx, f.k); f.y = M.lerp(f.sy, f.ty, f.k) - Math.sin(f.k * Math.PI) * 120; } },
    render(ctx, t) {
      // листва сверху
      for (let i = 0; i < 14; i++) ell(ctx, i * 100, 70 + (i % 2) * 20, 80, 50, i % 2 ? '#2e8b3e' : '#3caa4a');
      // лианы
      this.xs.forEach((x0, k) => {
        const a = k === this.i && !this.fly ? this.ang() : Math.sin(t * 1.2 + k) * 0.08, L = 330;
        const ex = x0 + Math.sin(a) * L, ey = 90 + Math.cos(a) * L;
        ctx.beginPath(); ctx.moveTo(x0, 90); ctx.quadraticCurveTo((x0 + ex) / 2 + 10, (90 + ey) / 2, ex, ey); ctx.lineWidth = 8; ctx.strokeStyle = k === this.i && !this.fly && this.good() && !this.won ? '#7aff7a' : '#2a8a3a'; ctx.stroke();
        for (let j = 1; j < 4; j++) ell(ctx, M.lerp(x0, ex, j / 4) + 8, M.lerp(90, ey, j / 4), 10, 6, '#4cc85a');
      });
      // бананы в конце
      for (let k = 0; k < 4; k++) banana(ctx, 1170 + (k % 2) * 30, 360 + k * 26, 0.9, 0.4);
      // дракончик
      const p = this.fly || this.pos();
      Art.dragon(ctx, p.x, p.y + 110, 0.45, { kind: this.dr, t, flying: !!this.fly, lift: 0, happy: this.won, look: 1 });
      // кусты внизу
      for (let i = 0; i < 9; i++) ell(ctx, i * 160, 700, 120, 60, '#2a7a3a');
      MG.bar(ctx, this.i / this.need, 'Лианы: ' + this.i + ' из ' + this.need, '#7aff7a');
    },
  });

  // ================= Джунгария: Сколько бананов? =================
  MG.game('bananas', {
    icon(ctx) { banana(ctx, -6, 4, 0.7, 0.3); banana(ctx, 6, -6, 0.7, 0.1); },
    init() { this.round = 0; this.rounds = 4; this.newRound(); },
    newRound() {
      const max = Math.min(10, 3 + this.lvl + this.round);
      this.n = M.ri(2, max); this.got = 0; this.busy = false;
      this.tree = []; for (let i = 0; i < 10; i++) this.tree.push({ x: 300 + (i % 5) * 90 + (i > 4 ? 45 : 0), y: 200 + Math.floor(i / 5) * 80 + M.rnd(-10, 10), on: true, fall: null });
      Voice.say('Обезьянка просит ' + this.n + ' ' + (this.n === 1 ? 'банан' : this.n < 5 ? 'банана' : 'бананов') + '. Нажимай на бананы и считай!');
    },
    say: '',
    down(x, y) {
      if (this.busy) return;
      for (const b of this.tree) {
        if (!b.on || Math.hypot(x - b.x, y - b.y) > 50) continue;
        b.on = false; this.got++; Sound.pop(1 + this.got * 0.06);
        b.fall = { x: b.x, y: b.y }; G.tween(b.fall, { x: 920 + M.rnd(-50, 50), y: 560 - Math.min(this.got, 6) * 6 }, 0.5, G.ease.inOutQuad);
        Voice.say(NUM[this.got].charAt(0).toUpperCase() + NUM[this.got].slice(1) + '!');
        if (this.got === this.n) {
          this.busy = true;
          G.wait(0.9, () => { Sound.chomp(); Sound.magic(); G.burst(1080, 420, { kind: 'heart', n: 10, up: true, g: -80, speed: 160 }); Voice.say(M.pick(['Ровно ' + this.n + '! Спасибо!', 'Правильно! Обезьянка довольна!']));
            G.wait(1.6, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Все обезьянки накормлены! Ты отлично считаешь!'); else this.newRound(); }); });
        }
        return;
      }
    },
    render(ctx, t) {
      // пальма
      ctx.beginPath(); ctx.moveTo(500, 720); ctx.quadraticCurveTo(470, 450, 520, 260); ctx.lineWidth = 40; ctx.strokeStyle = '#a8742a'; ctx.stroke();
      for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(520, 230); ctx.rotate(-Math.PI + i * 0.5); ell(ctx, 160, 0, 170, 34, '#3caa4a'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore(); }
      for (const b of this.tree) if (b.on) banana(ctx, b.x, b.y, 1, 0.5);
      // корзинка
      Art.rr(ctx, 820, 540, 200, 100, 24); ctx.fillStyle = '#c8843a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      for (const b of this.tree) if (!b.on && b.fall) banana(ctx, b.fall.x, b.fall.y, 0.9, 0.2);
      // обезьянка с табличкой
      Art.critter(ctx, 'monkey', 1110, 640, 0.8, t, this.busy ? 1 : 0);
      Art.rr(ctx, 1040, 300, 150, 110, 18); ctx.fillStyle = '#fff8e0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      UI.text(ctx, String(this.n), 1080, 380, 64, '#a8742a', 'center', false); banana(ctx, 1150, 356, 0.6, 0.3);
      UI.text(ctx, this.got + ' из ' + this.n, 920, 520, 30, '#fff', 'center', true);
      MG.bar(ctx, this.round / this.rounds, 'Обезьянки: ' + this.round + ' из ' + this.rounds, '#ffe14a');
    },
  });

  // ================= Цветения: Пчёлка-опылитель =================
  const FL = [COLORS[0], COLORS[2], COLORS[4], COLORS[6], { id: 'pink', name: 'розовый', acc: 'розовую', c: '#ff8ad0' }];
  const flower = (ctx, x, y, s, c, t, glow) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, 50, 0, 110); ctx.lineWidth = 7; ctx.strokeStyle = '#3a9a3a'; ctx.stroke();
    ctx.rotate(Math.sin(t * 1.5 + x) * 0.08);
    if (glow) { ctx.save(); ctx.globalAlpha = 0.4; ell(ctx, 0, 0, 70, 70, '#ffffff'); ctx.restore(); }
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * TAU / 6); ell(ctx, 0, -26, 16, 24, c); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore(); }
    ell(ctx, 0, 0, 15, 15, '#ffb21a'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.restore();
  };
  MG.game('bee', {
    icon(ctx) { ell(ctx, 0, 0, 20, 15, '#ffd23f'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.fillStyle = LINE; ctx.fillRect(-6, -14, 5, 28); ctx.fillRect(4, -14, 5, 28); ctx.save(); ctx.globalAlpha = 0.7; ell(ctx, -4, -20, 10, 8, '#ffffff'); ell(ctx, 8, -20, 10, 8, '#ffffff'); ctx.restore(); },
    init() {
      this.goal = 8 + this.lvl; this.bee = { x: 640, y: 200 }; this.flying = false;
      this.fl = []; const n = 7; for (let i = 0; i < n; i++) this.fl.push({ x: 180 + i * 150, y: 470 + (i % 2) * 60, c: FL[i % FL.length], hit: 0 });
      M.shuffle(this.fl).forEach((f, i) => { f.x = 180 + i * 150; });
      this.ask();
    },
    ask() { this.want = M.pick(this.fl.map(f => f.c)); Voice.say('Пчёлка, лети на ' + this.want.acc + ' цветочек!'); },
    say: '',
    down(x, y) {
      if (this.flying) return;
      for (const f of this.fl) {
        if (Math.hypot(x - f.x, y - f.y) > 70) continue;
        if (f.c === this.want) {
          this.flying = true; Sound.whoosh();
          G.tween(this.bee, { x: f.x, y: f.y - 40 }, 0.8, G.ease.inOutQuad, () => {
            this.score++; f.hit = 1; Sound.chime(1 + (this.score % 5) * 0.1); G.burst(f.x, f.y, { kind: 'dot', n: 14, colors: ['#ffe14a', '#fff6a0'], speed: 160 });
            G.wait(0.5, () => { this.flying = false; if (this.score >= this.goal) this.win('Ура! Пчёлка опылила все цветы! Будет много мёда!'); else this.ask(); });
          });
        } else { Sound.boing(); Voice.say('Это ' + f.c.name + '. А нужен ' + this.want.name + '!'); }
        return;
      }
    },
    anim(dt) { for (const f of this.fl || []) f.hit = Math.max(0, f.hit - dt); },
    render(ctx, t) {
      for (const f of this.fl) flower(ctx, f.x, f.y, 1, f.c.c, t, f.hit > 0);
      // пчёлка — дракончик-пчёлка, если мы на Цветении
      const b = this.bee, bob = Math.sin(t * 6) * 8;
      Art.dragon(ctx, b.x, b.y + bob + 90, 0.3, { kind: this.dr, t, flying: true, lift: 0, happy: this.won });
      // какой цвет нужен
      Art.rr(ctx, 450, 90, 380, 64, 32); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      if (this.want) { ell(ctx, 500, 122, 22, 22, this.want.c); ctx.stroke(); UI.text(ctx, this.want.name[0].toUpperCase() + this.want.name.slice(1), 660, 132, 30, '#3a2a6a', 'center', false); }
      MG.bar(ctx, this.score / this.goal, 'Мёд: ' + this.score + ' / ' + this.goal, '#ffd23f');
    },
  });

  // ================= Цветения: Букет =================
  const KINDS = [
    { id: 'daisy', one: 'ромашку', few: 'ромашки', many: 'ромашек', c: '#ffffff' }, { id: 'tulip', one: 'тюльпан', few: 'тюльпана', many: 'тюльпанов', c: '#ff4d5e' },
    { id: 'bell', one: 'колокольчик', few: 'колокольчика', many: 'колокольчиков', c: '#7a7ae8' },
  ];
  const plural = (n, k) => n === 1 ? k.one : n < 5 ? k.few : k.many;
  const kindDraw = (ctx, id, x, y, s, t) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.lineWidth = 6; ctx.strokeStyle = '#3a9a3a'; ctx.stroke();
    if (id === 'daisy') { for (let i = 0; i < 10; i++) { ctx.save(); ctx.rotate(i * TAU / 10); ell(ctx, 0, -20, 7, 16, '#ffffff'); ctx.lineWidth = 2; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore(); } ell(ctx, 0, 0, 10, 10, '#ffd23f'); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); }
    if (id === 'tulip') { ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-10, -4); ctx.lineTo(0, -24); ctx.lineTo(10, -4); ctx.lineTo(20, -20); ctx.quadraticCurveTo(22, 14, 0, 14); ctx.quadraticCurveTo(-22, 14, -20, -20); ctx.closePath(); ctx.fillStyle = '#ff4d5e'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); }
    if (id === 'bell') { ctx.beginPath(); ctx.moveTo(-6, -24); ctx.quadraticCurveTo(-16, -10, -22, 12); ctx.quadraticCurveTo(0, 6, 22, 12); ctx.quadraticCurveTo(16, -10, 6, -24); ctx.closePath(); ctx.fillStyle = '#7a7ae8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); }
    ctx.restore();
  };
  MG.game('bouquet', {
    icon(ctx, t) { kindDraw(ctx, 'tulip', -10, -4, 0.6, t); kindDraw(ctx, 'daisy', 12, -10, 0.6, t); },
    init() { this.round = 0; this.rounds = 3; this.newRound(); },
    newRound() {
      const kinds = M.shuffle(KINDS.slice()).slice(0, this.lvl > 1 ? 3 : 2), max = Math.min(5, 2 + this.lvl + this.round);
      this.order = kinds.map(k => ({ k, n: M.ri(1, max), got: 0 }));
      // на поляне 14 цветов: нужных видов всегда хватает (на один больше), остальные — любые
      const kinds14 = []; for (const o of this.order) for (let i = 0; i <= o.n; i++) kinds14.push(o.k);
      while (kinds14.length < 14) kinds14.push(M.pick(KINDS));
      M.shuffle(kinds14);
      this.field = kinds14.slice(0, 14).map((k, i) => ({ k, x: 160 + (i % 7) * 145 + M.rnd(-20, 20), y: 420 + Math.floor(i / 7) * 150 + M.rnd(-15, 15), on: true }));
      Voice.say('Собери букет: ' + this.order.map(o => o.n + ' ' + plural(o.n, o.k)).join(' и ') + '!');
    },
    say: '',
    down(x, y) {
      for (const f of this.field) {
        if (!f.on || Math.hypot(x - f.x, y - (f.y - 10)) > 55) continue;
        const o = this.order.find(o => o.k === f.k);
        if (!o || o.got >= o.n) { Sound.boing(); Voice.say(o ? 'Таких уже хватит!' : 'Такие цветы в букет не нужны!'); return; }
        f.on = false; o.got++; Sound.pop(1.1); Sound.chime(1 + o.got * 0.1);
        if (this.order.every(o => o.got >= o.n)) { Sound.magic(); G.wait(0.8, () => { this.round++; Voice.say('Какой красивый букет!'); if (this.round >= this.rounds) this.win('Ура! Три чудесных букета! Ты настоящий садовник!'); else G.wait(1.2, () => this.newRound()); }); }
        return;
      }
    },
    render(ctx, t) {
      for (const f of this.field) if (f.on) kindDraw(ctx, f.k.id, f.x, f.y, 1.1, t);
      // карточка заказа
      Art.rr(ctx, 300, 100, 680, 160, 26); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      this.order.forEach((o, i) => { const x = 390 + i * 210; kindDraw(ctx, o.k.id, x, 160, 1, t); UI.text(ctx, o.got + '/' + o.n, x + 70, 190, 34, o.got >= o.n ? '#41c862' : '#3a2a6a', 'center', false); });
      // букет в вазе
      const picked = []; this.order.forEach(o => { for (let i = 0; i < o.got; i++) picked.push(o.k.id); });
      picked.forEach((id, i) => kindDraw(ctx, id, 1130 + (i - picked.length / 2) * 16, 470 - (i % 2) * 20, 0.8, t));
      Art.rr(ctx, 1080, 500, 100, 110, 20); ctx.fillStyle = '#7ec8ff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      MG.bar(ctx, this.round / this.rounds, 'Букеты: ' + this.round + ' из ' + this.rounds, '#ff9ad5');
    },
  });

  // ================= Песчания: Раскопки =================
  const FINDS = ['bone', 'skull', 'amber', 'shell', 'coin'];
  const findDraw = (ctx, id, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 4; ctx.strokeStyle = LINE;
    if (id === 'bone') { Art.rr(ctx, -40, -9, 80, 18, 9); ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.stroke(); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ell(ctx, sx * 42, sy * 9, 12, 12, '#fff6e0'); ctx.stroke(); } }
    if (id === 'skull') { ell(ctx, 0, -6, 38, 32, '#fff6e0'); ctx.stroke(); Art.rr(ctx, -20, 16, 40, 18, 6); ctx.fill(); ctx.stroke(); ell(ctx, -14, -6, 9, 10, LINE); ell(ctx, 14, -6, 9, 10, LINE); }
    if (id === 'amber') { ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(28, -6); ctx.lineTo(18, 26); ctx.lineTo(-18, 26); ctx.lineTo(-28, -6); ctx.closePath(); ctx.fillStyle = '#ffb21a'; ctx.fill(); ctx.stroke(); ell(ctx, -6, -6, 8, 5, 'rgba(255,255,255,0.6)'); }
    if (id === 'shell') { ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.4, r = 2 + i * 0.75; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fillStyle = '#e8c8a0'; ctx.fill(); ctx.stroke(); }
    if (id === 'coin') { ell(ctx, 0, 0, 28, 28, '#ffd23f'); ctx.stroke(); Art.roundStar(ctx, 0, 0, 12, '#e0a020'); }
    ctx.restore();
  };
  MG.game('dig', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(14, -14); ctx.lineWidth = 6; ctx.strokeStyle = '#8a5a2a'; ctx.stroke(); Art.rr(ctx, 8, -28, 22, 18, 4); ctx.fillStyle = '#c8d0e0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); },
    init() {
      this.cs = 40; this.gx = 26; this.gy = 11; this.ox = 120; this.oy = 230;
      this.cells = []; for (let i = 0; i < this.gx * this.gy; i++) this.cells.push(1);
      const n = Math.min(5, 3 + Math.floor(this.lvl / 2));
      this.finds = []; const ids = M.shuffle(FINDS.slice());
      for (let i = 0; i < n; i++) { let x, y, ok; do { x = M.rnd(this.ox + 90, this.ox + this.gx * this.cs - 90); y = M.rnd(this.oy + 70, this.oy + this.gy * this.cs - 70); ok = this.finds.every(f => Math.hypot(f.x - x, f.y - y) > 200); } while (!ok); this.finds.push({ id: ids[i], x, y, found: false, fly: null }); }
      this.last = null;
    },
    say: 'Раскопки! Води пальцем по песку, как кисточкой, и найди спрятанные сокровища древних драконов!',
    down(x, y) { this.last = { x, y }; this.brush(x, y); },
    move(x, y) { if (this.last) { const d = Math.hypot(x - this.last.x, y - this.last.y), n = Math.ceil(d / 15); for (let i = 1; i <= n; i++) this.brush(M.lerp(this.last.x, x, i / n), M.lerp(this.last.y, y, i / n)); this.last = { x, y }; } },
    up() { this.last = null; },
    brush(x, y) {
      const r = 46; let any = false;
      for (let gy = 0; gy < this.gy; gy++) for (let gx = 0; gx < this.gx; gx++) {
        const cx = this.ox + gx * this.cs + this.cs / 2, cy = this.oy + gy * this.cs + this.cs / 2, d = Math.hypot(cx - x, cy - y);
        if (d < r) { const i = gy * this.gx + gx; if (this.cells[i] > 0) { this.cells[i] = Math.max(0, this.cells[i] - (d < r / 2 ? 0.5 : 0.25)); any = true; } }
      }
      if (any && Math.random() < 0.3) { Sound.dig ? Sound.dig() : 0; G.burst(x, y, { kind: 'dot', n: 2, colors: ['#e8b870', '#c8944a'], speed: 120, g: 300, life: 0.5, size: 6 }); }
      for (const f of this.finds) {
        if (f.found) continue;
        let tot = 0, clr = 0;
        for (let gy = 0; gy < this.gy; gy++) for (let gx = 0; gx < this.gx; gx++) { const cx = this.ox + gx * this.cs + this.cs / 2, cy = this.oy + gy * this.cs + this.cs / 2; if (Math.hypot(cx - f.x, cy - f.y) < 50) { tot++; clr += 1 - this.cells[gy * this.gx + gx]; } }
        if (tot && clr / tot > 0.7) {
          f.found = true; this.score++; Sound.magic(); Sound.chime(1 + this.score * 0.1); G.burst(f.x, f.y, { kind: 'star', n: 16, speed: 220 });
          Voice.say(M.pick(['Нашёл! Вот это находка!', 'Ух ты! Сокровище!', 'Ещё одна находка!']));
          f.fly = { x: f.x, y: f.y }; const slot = this.score - 1;
          G.tween(f.fly, { x: 330 + slot * 150, y: 160 }, 0.8, G.ease.inOutQuad, null, 0.6);
          if (this.score >= this.finds.length) G.wait(1.5, () => this.win('Ура! Все сокровища найдены! Ты настоящий археолог!'));
        }
      }
    },
    render(ctx, t) {
      // находки под песком
      Art.rr(ctx, this.ox - 10, this.oy - 10, this.gx * this.cs + 20, this.gy * this.cs + 20, 20); ctx.fillStyle = '#a8743a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = LINE; ctx.stroke();
      for (const f of this.finds) if (!f.fly) findDraw(ctx, f.id, f.x, f.y, 1.2);
      // песок клеточками
      for (let gy = 0; gy < this.gy; gy++) for (let gx = 0; gx < this.gx; gx++) {
        const v = this.cells[gy * this.gx + gx]; if (v <= 0) continue;
        ctx.globalAlpha = Math.min(1, v * 1.3); ctx.fillStyle = (gx + gy) % 2 ? '#f0c878' : '#e8bc6a';
        ctx.fillRect(this.ox + gx * this.cs - 1, this.oy + gy * this.cs - 1, this.cs + 2, this.cs + 2);
      }
      ctx.globalAlpha = 1;
      // полка находок
      Art.rr(ctx, 250, 120, 780, 80, 20); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
      this.finds.forEach((f, i) => { if (!f.fly) { ctx.save(); ctx.globalAlpha = 0.3; ell(ctx, 330 + i * 150, 160, 30, 30, '#ffffff'); ctx.restore(); } });
      for (const f of this.finds) if (f.fly) findDraw(ctx, f.id, f.fly.x, f.fly.y, 0.8);
      Art.dragon(ctx, 1180, 700, 0.34, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.score / this.finds.length, 'Находки: ' + this.score + ' из ' + this.finds.length, '#ffb21a');
    },
  });

  // ================= Песчания: Узоры каравана =================
  const SH = [{ id: 'circle', c: '#ff4d5e' }, { id: 'tri', c: '#ffd23f' }, { id: 'square', c: '#3fb8ff' }, { id: 'star', c: '#41c862' }];
  const shapeDraw = (ctx, s, x, y, k) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(k || 1, k || 1); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.fillStyle = s.c;
    if (s.id === 'circle') { ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (s.id === 'tri') { ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(32, 26); ctx.lineTo(-32, 26); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (s.id === 'square') { Art.rr(ctx, -28, -28, 56, 56, 8); ctx.fill(); ctx.stroke(); }
    if (s.id === 'star') { Art.roundStar(ctx, 0, 0, 34, s.c, LINE); }
    ctx.restore();
  };
  MG.game('pattern', {
    icon(ctx) { shapeDraw(ctx, SH[0], -18, 0, 0.4); shapeDraw(ctx, SH[1], 0, 0, 0.4); shapeDraw(ctx, SH[0], 18, 0, 0.4); },
    init() { this.round = 0; this.rounds = 5; this.newRound(); },
    say: 'Верблюды везут сокровища по порядку. Посмотри на узор и угадай, что будет дальше!',
    newRound() {
      const types = this.lvl < 1 ? ['AB'] : this.lvl < 3 ? ['AB', 'AAB', 'ABB'] : ['AB', 'AAB', 'ABC', 'ABB'];
      const pat = M.pick(types), pool = M.shuffle(SH.slice()), map = { A: pool[0], B: pool[1], C: pool[2] };
      const seq = []; for (let i = 0; i < 7; i++) seq.push(map[pat[i % pat.length]]);
      this.seq = seq.slice(0, 6); this.ans = seq[6];
      this.opts = M.shuffle([this.ans, ...pool.filter(s => s !== this.ans).slice(0, 2)]).map((s, i) => ({ s, x: 440 + i * 200, y: 610, sh: 0 }));
      this.placed = false; this.cx = 0;
    },
    down(x, y) {
      if (this.placed) return;
      for (const o of this.opts) {
        if (Math.hypot(x - o.x, y - o.y) > 70) continue;
        if (o.s === this.ans) {
          this.placed = true; Sound.chime(1.3); Sound.magic(); G.burst(1000, 330, { kind: 'star', n: 14, speed: 200 });
          G.wait(1, () => { G.tween(this, { cx: 1 }, 1.2, G.ease.inOutQuad, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Караван доехал! Ты отлично видишь узоры!'); else { this.newRound(); } }); });
        } else { o.sh = 1; Sound.boing(); Voice.say('Не подходит. Посмотри: что идёт после этого?'); }
        return;
      }
    },
    anim(dt) { for (const o of this.opts || []) o.sh = Math.max(0, o.sh - dt * 3); },
    render(ctx, t) {
      const ox = -this.cx * 1400;
      for (let i = 0; i < 7; i++) {
        const x = 160 + i * 140 + ox, y = 400 + Math.sin(t * 4 + i) * 3;
        // верблюжонок
        ell(ctx, x, y + 20, 56, 36, '#d8a050'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
        ell(ctx, x, y - 10, 26, 20, '#d8a050'); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 44, y + 10); ctx.quadraticCurveTo(x + 66, y - 30, x + 60, y - 50); ctx.lineWidth = 14; ctx.strokeStyle = '#d8a050'; ctx.stroke(); ell(ctx, x + 62, y - 54, 16, 12, '#d8a050'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, x + 66, y - 58, 3, 3, LINE);
        for (const lx of [-34, -12, 14, 36]) { ctx.beginPath(); ctx.moveTo(x + lx, y + 50); ctx.lineTo(x + lx, y + 90); ctx.lineWidth = 8; ctx.strokeStyle = '#c08a40'; ctx.stroke(); }
        if (i < 6) shapeDraw(ctx, this.seq[i], x, y - 60, 0.8);
        else if (this.placed) shapeDraw(ctx, this.ans, x, y - 60, 0.8);
        else { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3; ell(ctx, x, y - 60, 34, 34); ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore(); UI.text(ctx, '?', x, y - 46, 40, '#fff', 'center', true); }
      }
      for (const o of this.opts) { const sx = Math.sin(o.sh * 25) * 10 * o.sh; ell(ctx, o.x + sx, o.y, 62, 62, 'rgba(255,255,255,0.85)'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); shapeDraw(ctx, o.s, o.x + sx, o.y, 1); }
      Art.dragon(ctx, 1170, 690, 0.34, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.round / this.rounds, 'Караваны: ' + this.round + ' из ' + this.rounds, '#ffb21a');
    },
  });
})();
