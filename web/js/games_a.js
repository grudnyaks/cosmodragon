// Новые игры: Ням-Ням (торт, рогатка), Аквария (ныряльщик, ракушки), Вулкания (лава, костёр)
'use strict';
(function () {
  const ell = Art.ell, TAU = Math.PI * 2, LINE = '#2a1650';

  // ================= Ням-Ням: Торт для дракончика =================
  const LAYERS = [
    { id: 'choco', name: 'шоколадный', c: '#7a4a2a' }, { id: 'straw', name: 'клубничный', c: '#ff8ab8' }, { id: 'vanilla', name: 'ванильный', c: '#ffe08a' },
    { id: 'mint', name: 'мятный', c: '#8ae8c0' }, { id: 'berry', name: 'черничный', c: '#7a7ae8' },
  ];
  const layerDraw = (ctx, x, y, w, L, top) => {
    Art.rr(ctx, x - w / 2, y - 34, w, 34, 10); ctx.fillStyle = L.c; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 8; i++) { const px = x - w / 2 + 6 + i * (w - 12) / 8; ctx.lineTo(px, y - 34 + (i % 2 ? 10 : 2)); } ctx.lineWidth = 5; ctx.strokeStyle = '#fff6ec'; ctx.stroke();
  };
  MG.game('cake', {
    icon(ctx) { [['#7a4a2a', 18], ['#ff8ab8', 2], ['#ffe08a', -14]].forEach(([c, y]) => { Art.rr(ctx, -24, y - 8, 48, 16, 5); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); }); ell(ctx, 0, -28, 7, 7, '#ff3b5c'); },
    init() { this.round = 0; this.rounds = 3; this.newCake(); },
    say() { return 'Испечём торт для дракончика! Посмотри на картинку и нажимай на слои по порядку, снизу вверх.'; },
    newCake() {
      const n = Math.min(5, 2 + this.lvl + this.round);
      this.recipe = []; for (let i = 0; i < n; i++) this.recipe.push(M.pick(LAYERS));
      this.stack = []; this.drop = null; this.cherry = 0; this.eat = 0;
      this.btns = M.shuffle(LAYERS.slice()).map((L, i) => ({ L, x: 300 + i * 170, y: 640, sh: 0 }));
    },
    down(x, y) {
      if (this.drop || this.eat) return;
      for (const b of this.btns) {
        if (Math.hypot(x - b.x, y - b.y) > 70) continue;
        const need = this.recipe[this.stack.length];
        if (b.L === need) {
          Sound.pop(1 + this.stack.length * 0.1);
          this.drop = { L: b.L, y: 160 };
          G.tween(this.drop, { y: 470 - this.stack.length * 34 }, 0.45, G.ease.outBounce || G.ease.outQuad, () => {
            this.stack.push(this.drop.L); this.drop = null;
            if (this.stack.length === this.recipe.length) this.done();
          });
        } else { Sound.boing(); b.sh = 1; Voice.say('Это ' + b.L.name + '. А нужен ' + need.name + ' слой!'); }
        return;
      }
    },
    done() {
      Sound.magic(); G.tween(this, { cherry: 1 }, 0.5, G.ease.outBack);
      G.burst(760, 300, { kind: 'star', n: 16, speed: 240 });
      Voice.say(M.pick(['Какой красивый торт!', 'Вкуснятина!', 'Ням-ням! Отличный торт!']));
      G.wait(1.4, () => {
        this.eat = 1; Sound.chomp(); Sound.purr(1, { dragon: this.dr });
        G.burst(760, 380, { kind: 'heart', n: 10, up: true, g: -80, speed: 180 });
        G.wait(1.2, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Три торта готовы! Дракончик сытый и счастливый!'); else this.newCake(); });
      });
    },
    anim(dt) { for (const b of this.btns || []) b.sh = Math.max(0, b.sh - dt * 3); },
    render(ctx, t) {
      // рецепт
      Art.rr(ctx, 70, 120, 230, 330, 22); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#ff9ad5'; ctx.stroke();
      UI.text(ctx, 'Рецепт', 185, 160, 26, '#a03a7a', 'center', false);
      this.recipe.forEach((L, i) => { const done = i < this.stack.length; ctx.save(); if (done) ctx.globalAlpha = 0.35; layerDraw(ctx, 185, 420 - i * 40, 150, L); ctx.restore(); if (done) UI.text(ctx, '✓', 280, 412 - i * 40, 26, '#41c862', 'center', true); });
      // стол и тарелка
      ell(ctx, 760, 480, 190, 34, '#ffffff'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      if (!this.eat) {
        this.stack.forEach((L, i) => layerDraw(ctx, 760, 470 - i * 34, 230 - i * 14, L));
        if (this.drop) layerDraw(ctx, 760, this.drop.y, 230 - this.stack.length * 14, this.drop.L);
        if (this.cherry > 0) { const y = 470 - this.stack.length * 34; ctx.save(); ctx.translate(760, y - 16); ctx.scale(this.cherry, this.cherry); ell(ctx, 0, 0, 16, 16, '#ff3b5c'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, -14); ctx.quadraticCurveTo(10, -30, 18, -32); ctx.stroke(); ctx.restore(); }
      } else for (let i = 0; i < 6; i++) ell(ctx, 700 + i * 24, 470 - (i % 2) * 6, 6, 4, '#ffe08a');
      Art.dragon(ctx, 1090, 600, 0.6, { kind: this.dr, t, look: -1, happy: !!this.eat || this.won, mouth: this.eat ? 0.6 : 0 });
      // кнопки-слои
      for (const b of this.btns) {
        const sx = Math.sin(b.sh * 20) * 8 * b.sh;
        ell(ctx, b.x + sx, b.y, 68, 68, 'rgba(255,255,255,0.9)'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
        layerDraw(ctx, b.x + sx, b.y + 18, 90, b.L);
      }
      MG.bar(ctx, this.round / this.rounds, 'Торты: ' + this.round + ' из ' + this.rounds, '#ff9ad5');
    },
  });

  // ================= Ням-Ням: Леденцовая рогатка =================
  MG.game('sling', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-6, 30); ctx.lineTo(-6, 4); ctx.lineTo(-22, -24); ctx.moveTo(-6, 4); ctx.lineTo(12, -24); ctx.lineWidth = 7; ctx.strokeStyle = '#8a5a2a'; ctx.stroke(); ell(ctx, -4, -14, 9, 9, '#ff5e9a'); ctx.lineWidth = 2; ctx.strokeStyle = LINE; ctx.stroke(); },
    init() {
      this.goal = 6 + this.lvl; this.shots = this.goal * 2 + 2; this.c = null; this.pull = null;
      this.mx = 640; this.mdir = 1; this.mouthY = 290; this.chomp = 0;
      this.speed = 80 + this.lvl * 25;
    },
    say: 'Оттяни леденец на рогатке назад и отпусти, чтобы попасть дракончику прямо в ротик!',
    down(x, y) { if (!this.c && Math.hypot(x - 640, y - 590) < 120) this.pull = { x, y }; },
    move(x, y) { if (this.pull) { const dx = x - 640, dy = y - 590, d = Math.hypot(dx, dy), k = d > 150 ? 150 / d : 1; this.pull = { x: 640 + dx * k, y: 590 + dy * k }; } },
    up() {
      if (!this.pull || this.won || this.over) { this.pull = null; return; }
      const vx = (640 - this.pull.x) * 7.5, vy = (590 - this.pull.y) * 7.5;
      if (Math.hypot(vx, vy) > 150) { this.c = { x: this.pull.x, y: this.pull.y, vx, vy, k: M.ri(0, 5) }; this.shots--; Sound.snap(); }
      this.pull = null;
    },
    tick(dt) {
      this.mx += this.mdir * this.speed * dt; if (this.mx > 1050 || this.mx < 230) this.mdir *= -1;
      this.chomp = Math.max(0, this.chomp - dt);
      const c = this.c; if (!c) return;
      c.vy += 900 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (Math.hypot(c.x - this.mx, c.y - this.mouthY) < 62 && c.vy > -400) {
        this.c = null; this.score++; this.chomp = 0.8; Sound.chomp(); Sound.chime(1 + this.score * 0.06);
        G.burst(this.mx, this.mouthY - 40, { kind: 'heart', n: 8, up: true, g: -80, speed: 160 });
        if (this.score >= this.goal) this.win('Ура! Дракончик наелся леденцов! Ты меткий стрелок!');
        return;
      }
      if (c.y > 760 || c.x < -100 || c.x > 1380) { this.c = null; Sound.boing(); if (this.shots <= 0) this.fail('Леденцы кончились! Попробуй ещё раз!', Math.floor(this.score / 2)); }
    },
    render(ctx, t) {
      const flying = true;
      Art.dragon(ctx, this.mx, this.mouthY + 200, 0.62, { kind: this.dr, t, flying, lift: 0, mouth: this.chomp > 0 ? 0.3 : 0.9, happy: this.chomp > 0, look: this.mdir });
      ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 6) * 0.15; ctx.beginPath(); ctx.arc(this.mx, this.mouthY, 62, 0, TAU); ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
      // рогатка
      const px = this.pull ? this.pull.x : 640, py = this.pull ? this.pull.y : 590;
      ctx.beginPath(); ctx.moveTo(640, 720); ctx.lineTo(640, 640); ctx.lineTo(590, 560); ctx.moveTo(640, 640); ctx.lineTo(690, 560); ctx.lineWidth = 18; ctx.strokeStyle = '#8a5a2a'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(590, 560); ctx.lineTo(px, py); ctx.lineTo(690, 560); ctx.lineWidth = 6; ctx.strokeStyle = '#ff5e7a'; ctx.stroke();
      if (!this.c) Art.treat(ctx, this.score % 6, px, py, 0.45, t);
      // пунктир полёта
      if (this.pull) {
        let x = this.pull.x, y = this.pull.y, vx = (640 - x) * 7.5, vy = (590 - y) * 7.5;
        ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 14; i++) { for (let k = 0; k < 4; k++) { vy += 900 * 0.016; x += vx * 0.016; y += vy * 0.016; } ell(ctx, x, y, 5, 5); ctx.fill(); }
        ctx.restore();
      }
      if (this.c) Art.treat(ctx, this.c.k, this.c.x, this.c.y, 0.45, t);
      MG.bar(ctx, this.score / this.goal, 'Попал: ' + this.score + ' из ' + this.goal, '#ff9ad5');
      UI.text(ctx, 'Леденцов: ' + Math.max(0, this.shots), 160, 700, 24, '#fff', 'center', true);
    },
  });

  // ================= Аквария: Ныряльщик =================
  MG.game('dive', {
    icon(ctx) { ell(ctx, 0, 0, 26, 26, '#3fb8ff'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, -6, 4, 7, 7, '#ffffff'); ell(ctx, 10, -10, 5, 5, '#ffffff'); ell(ctx, 6, 12, 4, 4, '#ffffff'); },
    init() { this.y = 300; this.vy = 0; this.hold = false; this.items = []; this.spawn = 0.5; this.time = 45; this.goal = 12 + this.lvl * 2; this.hurt = 0; this.speed = 240 + this.lvl * 25; },
    say: 'Держи палец на экране — дракончик ныряет вниз. Отпусти — всплывает. Собирай жемчужинки и не трогай медуз!',
    down() { this.hold = true; },
    up() { this.hold = false; },
    tick(dt) {
      this.time -= dt; if (this.time <= 0) return this.fail('Время вышло! Ты собрал ' + this.score + ' жемчужинок!', Math.floor(this.score / 2));
      this.hold = G.pointer.down;
      this.vy += (this.hold ? 520 : -420) * dt; this.vy = M.clamp(this.vy, -260, 260);
      this.y = M.clamp(this.y + this.vy * dt, 200, 640); if (this.y <= 200 || this.y >= 640) this.vy *= 0.3;
      this.hurt = Math.max(0, this.hurt - dt);
      this.spawn -= dt;
      if (this.spawn <= 0) { const jelly = Math.random() < 0.28 + this.lvl * 0.03; this.items.push({ x: 1400, y: M.rnd(210, 640), jelly, ph: M.rnd(0, 6) }); this.spawn = M.rnd(0.45, 0.8); }
      for (const it of this.items) { it.x -= this.speed * dt; it.y += Math.sin(this.T * 2 + it.ph) * 20 * dt; }
      for (const it of this.items) {
        if (it.got || Math.hypot(it.x - 330, it.y - this.y) > 58) continue;
        it.got = true;
        if (it.jelly) { if (!this.hurt) { this.hurt = 1; this.score = Math.max(0, this.score - 1); Sound.bump(); G.floatText(330, this.y - 90, '-1', '#ff8fa0'); } }
        else { this.score++; Sound.pop(1.3); Sound.chime(1 + (this.score % 5) * 0.1); G.burst(it.x, it.y, { kind: 'star', n: 6, speed: 140 }); if (this.score >= this.goal) this.win('Ура! Полная шкатулка жемчуга! Ты отличный ныряльщик!'); }
      }
      this.items = this.items.filter(it => it.x > -80 && !it.got);
    },
    render(ctx, t) {
      // вода
      const v = G.view; const g = ctx.createLinearGradient(0, 160, 0, 720); g.addColorStop(0, 'rgba(60,180,255,0.55)'); g.addColorStop(1, 'rgba(10,50,140,0.85)');
      ctx.fillStyle = g; ctx.fillRect(v.x0, 170, v.x1 - v.x0, 560);
      ctx.beginPath(); for (let x = v.x0; x <= v.x1; x += 20) ctx.lineTo(x, 170 + Math.sin(x * 0.03 + t * 3) * 6); ctx.lineWidth = 5; ctx.strokeStyle = '#d8f6ff'; ctx.stroke();
      for (let i = 0; i < 12; i++) { const bx = ((i * 137 - t * 60) % 1400 + 1400) % 1400 - 60, by = 700 - ((t * 40 + i * 77) % 520); ctx.save(); ctx.globalAlpha = 0.4; ell(ctx, bx, by, 5, 5, '#ffffff'); ctx.restore(); }
      for (const it of this.items) {
        if (it.jelly) { ctx.save(); ctx.translate(it.x, it.y); ctx.beginPath(); ctx.arc(0, 0, 32, Math.PI, 0); ctx.closePath(); ctx.fillStyle = 'rgba(255,120,200,0.85)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 10, 0); ctx.quadraticCurveTo(k * 10 + Math.sin(t * 6 + k) * 8, 22, k * 10, 44); ctx.lineWidth = 3; ctx.strokeStyle = '#ff9ad5'; ctx.stroke(); } ell(ctx, -10, -10, 4, 4, LINE); ell(ctx, 10, -10, 4, 4, LINE); ctx.restore(); }
        else { ctx.save(); ctx.globalAlpha = 0.4; ell(ctx, it.x, it.y, 30, 30, '#ffffff'); ctx.restore(); Art.treatNamed(ctx, 'pearl', it.x, it.y, 0.6, t); }
      }
      ctx.save(); if (this.hurt > 0 && Math.sin(t * 30) > 0) ctx.globalAlpha = 0.4;
      ctx.translate(330, this.y + 60); ctx.rotate(this.vy / 900);
      Art.dragon(ctx, 0, 0, 0.42, { kind: this.dr, t, flying: true, lift: 0, look: 1, happy: this.won });
      ctx.restore();
      MG.bar(ctx, this.score / this.goal, 'Жемчужинки: ' + this.score + ' / ' + this.goal, '#7ee8ff');
      MG.clock(ctx, this.time, 45);
    },
  });

  // ================= Аквария: Ракушки по росту =================
  const shell = (ctx, x, y, s, c, t) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 30); for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46 + 4); } ctx.closePath();
    ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
    for (let i = 1; i < 8; i++) { const a = Math.PI + i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40 + 4); ctx.lineWidth = 2; ctx.stroke(); }
    Art.rr(ctx, -12, 22, 24, 14, 5); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  MG.game('shells', {
    icon(ctx) { shell(ctx, -10, 8, 0.32, '#ffb3d0'); shell(ctx, 14, 4, 0.5, '#ffd8a8'); },
    init() { this.round = 0; this.rounds = 3; this.newRound(); },
    say: 'Нажимай на ракушки по порядку: от самой маленькой до самой большой!',
    newRound() {
      const n = Math.min(6, 3 + this.lvl + this.round);
      const sizes = []; for (let i = 0; i < n; i++) sizes.push(0.55 + i * (1.1 / n));
      const xs = M.shuffle([...Array(n).keys()]);
      this.sh = sizes.map((s, i) => ({ s, rank: i, x: 200 + xs[i] * (900 / Math.max(1, n - 1)), y: 420 + (xs[i] % 2) * 90, c: M.pick(['#ffb3d0', '#ffd8a8', '#c8e8ff', '#e0c8ff', '#fff0a8']), done: false, wig: 0, tx: 0, ty: 0 }));
      this.next = 0;
    },
    down(x, y) {
      for (const s of this.sh) {
        if (s.done || Math.hypot(x - s.x, y - (s.y - 10)) > 50 * s.s + 20) continue;
        if (s.rank === this.next) {
          s.done = true; this.next++; Sound.chime(0.8 + this.next * 0.12);
          G.tween(s, { x: 230 + (this.next - 1) * 150, y: 640 }, 0.5, G.ease.outBack);
          if (this.next === this.sh.length) { Sound.magic(); G.wait(1, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Все ракушки стоят по росту! Умница!'); else { Voice.say('Молодец! Ещё ракушки!'); this.newRound(); } }); }
        } else { s.wig = 1; Sound.boing(); Voice.say(M.pick(['Эта великовата. Найди поменьше!', 'Нет, есть ракушка ещё меньше!'])); }
        return;
      }
    },
    anim(dt) { for (const s of this.sh || []) s.wig = Math.max(0, s.wig - dt * 3); },
    render(ctx, t) {
      ctx.save(); ctx.globalAlpha = 0.5; Art.rr(ctx, 150, 590, 980, 100, 30); ctx.fillStyle = '#e8c88a'; ctx.fill(); ctx.restore();
      for (const s of this.sh) shell(ctx, s.x + Math.sin(s.wig * 25) * 10 * s.wig, s.y, s.s, s.c, t);
      Art.dragon(ctx, 1150, 420, 0.42, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.round / this.rounds, 'От маленькой к большой', '#7ee8ff');
    },
  });

  // ================= Вулкания: Потуши лаву =================
  MG.game('lava', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-28, 26); ctx.lineTo(-8, -14); ctx.lineTo(8, -14); ctx.lineTo(28, 26); ctx.closePath(); ctx.fillStyle = '#7a3a2a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, 0, -22, 9, 9, '#ff7a1a'); ell(ctx, -12, -32, 5, 5, '#ffb23a'); },
    init() { this.blobs = []; this.spawn = 1; this.time = 40; this.goal = 14 + this.lvl * 2; this.miss = 0; this.vx = 0; },
    say: 'Вулкан плюётся лавой! Нажимай на огненные капли, пока они не упали, и они превратятся в пар!',
    down(x, y) {
      for (const b of this.blobs) {
        if (b.dead || Math.hypot(x - b.x, y - b.y) > 70) continue;
        b.dead = true; this.score++; Sound.pop(0.8); Sound.chime(1 + (this.score % 5) * 0.1);
        G.burst(b.x, b.y, { kind: 'smoke', n: 10, colors: ['#ffffff', '#d8e8f0'], g: -60, speed: 120, size: 16 });
        if (this.score >= this.goal) this.win('Ура! Вулкан успокоился! Ты настоящий пожарный!');
        return;
      }
    },
    tick(dt) {
      this.time -= dt; if (this.time <= 0) return this.fail('Время вышло! Ты потушил ' + this.score + ' капель!', Math.floor(this.score / 3));
      this.spawn -= dt;
      if (this.spawn <= 0) { const n = Math.random() < 0.2 + this.lvl * 0.05 ? 2 : 1; for (let i = 0; i < n; i++) this.blobs.push({ x: 640, y: 330, vx: M.rnd(-330, 330), vy: M.rnd(-720, -560), r: M.rnd(22, 30) }); Sound.fire && Sound.fire(); this.spawn = M.rnd(0.7, 1.2) - this.lvl * 0.05; }
      for (const b of this.blobs) { b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > 650 && !b.dead) { b.dead = true; this.miss++; Sound.bump(); G.burst(b.x, 650, { kind: 'dot', n: 10, colors: ['#ff7a1a', '#ffd23f'], speed: 180 }); } }
      this.blobs = this.blobs.filter(b => !b.dead);
    },
    render(ctx, t) {
      ctx.beginPath(); ctx.moveTo(380, 680); ctx.lineTo(580, 340); ctx.lineTo(700, 340); ctx.lineTo(900, 680); ctx.closePath(); ctx.fillStyle = '#6a3028'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(580, 340); ctx.quadraticCurveTo(640, 380, 700, 340); ctx.lineTo(680, 400); ctx.quadraticCurveTo(640, 430, 600, 400); ctx.closePath(); ctx.fillStyle = '#ff7a1a'; ctx.fill();
      for (const b of this.blobs) { ctx.save(); ctx.globalAlpha = 0.4; ell(ctx, b.x, b.y, b.r * 1.8, b.r * 1.8, '#ffb23a'); ctx.restore(); ell(ctx, b.x, b.y, b.r, b.r, '#ff5a1a'); ctx.lineWidth = 3; ctx.strokeStyle = '#7a1a0a'; ctx.stroke(); ell(ctx, b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, b.r * 0.3, '#ffe08a'); }
      Art.dragon(ctx, 1110, 640, 0.5, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.score / this.goal, 'Потушено: ' + this.score + ' / ' + this.goal, '#7ee8ff');
      MG.clock(ctx, this.time, 40);
    },
  });

  // ================= Вулкания: Костёр и зефирки =================
  MG.game('campfire', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-26, 22); ctx.lineTo(26, 10); ctx.moveTo(-26, 10); ctx.lineTo(26, 22); ctx.lineWidth = 8; ctx.strokeStyle = '#8a5a2a'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-16, -16, 0, -30); ctx.quadraticCurveTo(16, -16, 14, 10); ctx.closePath(); ctx.fillStyle = '#ff7a1a'; ctx.fill(); ell(ctx, 0, 0, 6, 10, '#ffe08a'); },
    init() { this.fire = 0; this.phase = 'rub'; this.lastX = null; this.st = []; this.got = 0; this.need = 3; this.cur = null; },
    say: 'Разожги костёр! Быстро води пальцем туда-сюда по палочкам, чтобы появилась искра!',
    down(x, y) {
      if (this.phase === 'rub') { this.lastX = x; return; }
      if (this.cur) {
        const k = this.cur.k;
        if (k > 0.45 && k < 0.75) { this.got++; Sound.chomp(); Sound.chime(1.2); G.burst(640, 380, { kind: 'heart', n: 8, up: true, g: -80, speed: 160 }); Voice.say(M.pick(['Золотистая! Вкусно!', 'Идеальная зефирка!', 'Ням! Тёплая и мягкая!'])); }
        else if (k <= 0.45) { Sound.boing(); Voice.say('Ещё сырая! Подожди, пока станет золотистой.'); return; }
        else { Sound.bump(); Voice.say('Ой, подгорела! Следующую снимай раньше.'); }
        this.cur = null;
        if (this.got >= this.need) this.win('Ура! Костёр горит, зефирки поджарены! Как в настоящем походе!');
        else G.wait(0.8, () => { if (!this.won) this.cur = { k: 0 }; });
      }
    },
    move(x, y) {
      if (this.phase !== 'rub' || this.lastX == null || y < 380) return;
      const d = Math.abs(x - this.lastX); this.lastX = x;
      this.fire = Math.min(1, this.fire + d * 0.00045);
      if (Math.random() < d * 0.02) G.burst(640, 600, { kind: 'dot', n: 1, colors: ['#ffd23f', '#ff7a1a'], speed: 120, g: -40, life: 0.5, size: 6 });
      if (this.fire >= 1) { this.phase = 'roast'; Sound.fire && Sound.fire(); Sound.magic(); Voice.say('Огонь горит! Теперь поджарим зефирки. Снимай, когда зефирка станет золотистой!'); G.wait(2.5, () => { this.cur = { k: 0 }; }); }
    },
    up() { this.lastX = null; },
    tick(dt) {
      if (this.phase === 'rub') this.fire = Math.max(0, this.fire - dt * 0.05);
      if (this.cur) { this.cur.k += dt * (0.16 + this.lvl * 0.02); if (this.cur.k > 1.05) { Sound.bump(); Voice.say('Ой, подгорела! Нажимай, когда золотистая.'); this.cur = { k: 0 }; } }
    },
    render(ctx, t) {
      const f = this.phase === 'rub' ? this.fire : 1;
      // брёвна
      for (const [a, c] of [[0.25, '#8a5a2a'], [-0.25, '#7a4a20']]) { ctx.save(); ctx.translate(640, 610); ctx.rotate(a); Art.rr(ctx, -150, -18, 300, 36, 18); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); ctx.restore(); }
      // огонь
      if (f > 0.05) {
        const h = 40 + f * 200;
        ctx.save(); ctx.globalAlpha = 0.35 * f; ell(ctx, 640, 560, h, h * 0.8, '#ffb23a'); ctx.restore();
        [['#ff4a1a', 1], ['#ffa21a', 0.72], ['#ffe68a', 0.42]].forEach(([c, k]) => { const w = (60 + f * 60) * k, hh = h * k, wob = Math.sin(t * 9 + k * 5) * 10; ctx.beginPath(); ctx.moveTo(640 - w, 590); ctx.quadraticCurveTo(640 - w * 0.9, 590 - hh * 0.6, 640 + wob, 590 - hh); ctx.quadraticCurveTo(640 + w * 0.9, 590 - hh * 0.6, 640 + w, 590); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); });
      } else if (this.phase === 'rub') { ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, 640, 560, 30, 18, '#9a9aaa'); ctx.restore(); }
      if (this.phase === 'rub') {
        UI.progress(ctx, 400, 26, 480, 46, this.fire, '#ff7a1a'); UI.text(ctx, 'Искра', 640, 50, 28, '#fff', 'center', true);
        const hx = 640 + Math.sin(t * 6) * 120; ctx.save(); ctx.globalAlpha = 0.7; Art.ell(ctx, hx, 640, 16, 16, '#ffffff'); ctx.restore();
        UI.text(ctx, '← водите пальцем →', 640, 690, 26, '#fff', 'center', true);
      } else {
        // палочка с зефиркой
        if (this.cur) {
          const k = this.cur.k, col = k < 0.45 ? Art.mix('#ffffff', '#ffe0a0', k / 0.45) : k < 0.75 ? '#e8a850' : Art.mix('#8a4a1a', '#2a1a10', Math.min(1, (k - 0.75) / 0.3));
          ctx.beginPath(); ctx.moveTo(1000, 520); ctx.lineTo(680, 380); ctx.lineWidth = 7; ctx.strokeStyle = '#a8742a'; ctx.stroke();
          Art.rr(ctx, 620, 352, 64, 52, 18); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = LINE; ctx.stroke();
          UI.progress(ctx, 520, 280, 240, 26, k, k > 0.45 && k < 0.75 ? '#41c862' : '#ffb23a');
          ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(520 + 240 * 0.45, 276, 240 * 0.3, 34); ctx.restore();
        }
        MG.bar(ctx, this.got / this.need, 'Зефирки: ' + this.got + ' из ' + this.need, '#ffb23a');
      }
      Art.dragon(ctx, 1120, 640, 0.5, { kind: this.dr, t, look: -1, happy: this.won || f > 0.9, fire: this.phase === 'rub' && this.fire > 0.5 && Math.sin(t * 2) > 0.95 });
    },
  });
})();
