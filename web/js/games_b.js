// Новые игры: Эолия (воздушный змей, парусник), Кристаллия (снеговик, льдины), Радуга (радуга, баночки)
'use strict';
(function () {
  const ell = Art.ell, TAU = Math.PI * 2, LINE = '#2a1650';
  const kite = (ctx, x, y, s, t, c) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2) * 0.1);
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(36, 0); ctx.lineTo(0, 64); ctx.lineTo(-36, 0); ctx.closePath(); ctx.fillStyle = c || '#ff5e7a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 64); ctx.moveTo(-36, 0); ctx.lineTo(36, 0); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 64); for (let i = 1; i <= 5; i++) ctx.lineTo(Math.sin(t * 5 + i) * 12, 64 + i * 16); ctx.lineWidth = 3; ctx.stroke();
    for (let i = 1; i <= 4; i++) { ctx.save(); ctx.translate(Math.sin(t * 5 + i) * 12, 64 + i * 16); ctx.rotate(0.7); ctx.fillStyle = ['#ffd23f', '#41c862', '#3fb8ff', '#ff9ad5'][i - 1]; ctx.fillRect(-6, -3, 12, 6); ctx.restore(); }
    ctx.restore();
  };

  // ================= Эолия: Воздушный змей =================
  MG.game('kite', {
    icon(ctx, t) { kite(ctx, 0, -6, 0.42, t || 0); },
    init() { this.ky = 360; this.ty = 360; this.items = []; this.spawn = 0.6; this.time = 40; this.goal = 12 + this.lvl * 2; this.hurt = 0; this.speed = 230 + this.lvl * 25; },
    say: 'Веди воздушного змея пальцем вверх и вниз! Собирай звёздочки и облетай грозовые тучи!',
    down(x, y) { this.ty = M.clamp(y, 150, 560); },
    move(x, y) { this.ty = M.clamp(y, 150, 560); },
    tick(dt) {
      this.time -= dt; if (this.time <= 0) return this.fail('Время вышло! Ты поймал ' + this.score + ' звёздочек!', Math.floor(this.score / 2));
      this.ky += (this.ty - this.ky) * Math.min(1, dt * 6);
      this.hurt = Math.max(0, this.hurt - dt);
      this.spawn -= dt;
      if (this.spawn <= 0) { const storm = Math.random() < 0.25 + this.lvl * 0.03; this.items.push({ x: 1420, y: M.rnd(150, 560), storm }); this.spawn = M.rnd(0.5, 0.9); }
      for (const it of this.items) it.x -= this.speed * dt * (it.storm ? 0.8 : 1);
      for (const it of this.items) {
        if (it.got || Math.hypot(it.x - 760, it.y - this.ky) > (it.storm ? 75 : 55)) continue;
        it.got = true;
        if (it.storm) { if (!this.hurt) { this.hurt = 1.2; this.score = Math.max(0, this.score - 1); Sound.bump(); G.floatText(760, this.ky - 80, '-1', '#ff8fa0'); } }
        else { this.score++; Sound.chime(1 + (this.score % 5) * 0.1); G.burst(it.x, it.y, { kind: 'star', n: 8, speed: 160 }); if (this.score >= this.goal) this.win('Ура! Змей собрал все звёзды! Вот это полёт!'); }
      }
      this.items = this.items.filter(it => it.x > -120 && !it.got);
    },
    render(ctx, t) {
      for (const it of this.items) {
        if (it.storm) { ctx.save(); ctx.globalAlpha = 0.95; Art.cloud(ctx, it.x, it.y, 0.9, '#6a6a8a', '#3a3a5a'); ctx.restore(); if (Math.sin(t * 10 + it.x) > 0.6) { ctx.beginPath(); ctx.moveTo(it.x, it.y + 20); ctx.lineTo(it.x - 12, it.y + 50); ctx.lineTo(it.x + 4, it.y + 50); ctx.lineTo(it.x - 8, it.y + 80); ctx.lineWidth = 5; ctx.strokeStyle = '#ffe14a'; ctx.stroke(); } }
        else Art.roundStar(ctx, it.x, it.y, 26, '#ffd23f', LINE);
      }
      // нитка от дракончика
      ctx.beginPath(); ctx.moveTo(330, 520); ctx.quadraticCurveTo(560, this.ky + 160, 760, this.ky + 50); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
      ctx.save(); if (this.hurt > 0 && Math.sin(t * 30) > 0) ctx.globalAlpha = 0.4; kite(ctx, 760, this.ky, 1, t); ctx.restore();
      Art.dragon(ctx, 300, 640, 0.6, { kind: this.dr, t, look: 1, happy: this.won });
      MG.bar(ctx, this.score / this.goal, 'Звёздочки: ' + this.score + ' / ' + this.goal, '#ffd23f');
      MG.clock(ctx, this.time, 40);
    },
  });

  // ================= Эолия: Парусник (дуй на кораблик) =================
  MG.game('sail', {
    icon(ctx) { ctx.beginPath(); ctx.moveTo(-28, 10); ctx.lineTo(28, 10); ctx.lineTo(18, 26); ctx.lineTo(-18, 26); ctx.closePath(); ctx.fillStyle = '#c8743a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -30); ctx.lineTo(22, 2); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); },
    init() { this.b = { x: 640, y: 620, vx: 0, vy: 0 }; this.flags = 0; this.need = 3; this.sw = null; this.newFlag(); this.rocks = []; for (let i = 0; i < Math.min(4, 1 + this.lvl); i++) this.rocks.push({ x: M.rnd(250, 1030), y: M.rnd(300, 520) }); },
    newFlag() { this.f = { x: M.rnd(220, 1060), y: M.rnd(200, 330) }; },
    say: 'Подуй на кораблик! Проведи пальцем по воде в ту сторону, куда ему плыть. Доплыви до флажка!',
    down(x, y) { this.sw = { x, y, t: this.T }; },
    move(x, y) {
      if (!this.sw) return;
      const dx = x - this.sw.x, dy = y - this.sw.y, d = Math.hypot(dx, dy);
      if (d > 40) { const k = Math.min(1, d / 200) * 260; this.b.vx += dx / d * k; this.b.vy += dy / d * k; this.sw = { x, y, t: this.T }; Sound.whoosh(); for (let i = 0; i < 3; i++) G.burst(x, y, { kind: 'dot', n: 1, colors: ['#ffffff'], speed: 60, g: 0, life: 0.5, size: 6 }); }
    },
    up() { this.sw = null; },
    tick(dt) {
      const b = this.b;
      b.vx *= Math.pow(0.35, dt); b.vy *= Math.pow(0.35, dt);
      const sp = Math.hypot(b.vx, b.vy); if (sp > 420) { b.vx *= 420 / sp; b.vy *= 420 / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 90 || b.x > 1190) { b.vx *= -0.6; b.x = M.clamp(b.x, 90, 1190); }
      if (b.y < 170 || b.y > 660) { b.vy *= -0.6; b.y = M.clamp(b.y, 170, 660); }
      for (const r of this.rocks) { const d = Math.hypot(b.x - r.x, b.y - r.y); if (d < 80) { const nx = (b.x - r.x) / d, ny = (b.y - r.y) / d; b.x = r.x + nx * 80; b.y = r.y + ny * 80; const dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; Sound.bump(); } } }
      if (Math.hypot(b.x - this.f.x, b.y - this.f.y) < 70) {
        this.flags++; Sound.magic(); G.burst(this.f.x, this.f.y, { kind: 'star', n: 20, speed: 260 });
        if (this.flags >= this.need) this.win('Ура! Кораблик доплыл до всех флажков! Ты настоящий ветер!');
        else { Voice.say(M.pick(['Ура, флажок! Теперь к следующему!', 'Отлично! Плывём дальше!'])); this.newFlag(); }
      }
    },
    render(ctx, t) {
      const v = G.view; ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = '#5ab8f0'; ctx.fillRect(v.x0, 150, v.x1 - v.x0, 570); ctx.restore();
      for (let i = 0; i < 16; i++) { const wx = (i * 173 + t * 30) % 1300 - 10, wy = 190 + (i * 97) % 500; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 15, wy - 8, wx + 30, wy); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke(); }
      for (const r of this.rocks) { ell(ctx, r.x, r.y, 60, 44, '#8a8aa0'); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, r.x - 16, r.y - 14, 18, 10, '#b0b0c8'); }
      // флажок на островке
      const f = this.f; ell(ctx, f.x, f.y + 20, 70, 26, '#f0d890'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(f.x, f.y + 20); ctx.lineTo(f.x, f.y - 60); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(f.x, f.y - 60); ctx.quadraticCurveTo(f.x + 30, f.y - 50 + Math.sin(t * 6) * 6, f.x + 50, f.y - 44); ctx.lineTo(f.x, f.y - 30); ctx.closePath(); ctx.fillStyle = '#ff5e7a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      // кораблик с дракончиком
      const b = this.b, tilt = M.clamp(b.vx / 900, -0.3, 0.3);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(tilt);
      Art.dragon(ctx, 0, 0, 0.26, { kind: this.dr, t, happy: this.won });
      ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(60, -10); ctx.lineTo(42, 20); ctx.lineTo(-42, 20); ctx.closePath(); ctx.fillStyle = '#c8743a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, -10); ctx.lineTo(30, -110); ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, -106); ctx.quadraticCurveTo(80 + b.vx * 0.03, -60, 34, -18); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.restore();
      MG.bar(ctx, this.flags / this.need, 'Флажки: ' + this.flags + ' из ' + this.need, '#ff5e7a');
    },
  });

  // ================= Кристаллия: Слепи снеговика =================
  const PARTS = [{ id: 'carrot', name: 'морковку-нос' }, { id: 'eyes', name: 'глазки-угольки' }, { id: 'hat', name: 'шапку' }, { id: 'scarf', name: 'шарфик' }];
  const drawPart = (ctx, id, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'carrot') { ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(40, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fillStyle = '#ff8a1a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); }
    if (id === 'eyes') { ell(ctx, -16, 0, 8, 8, '#2a2a3a'); ell(ctx, 16, 0, 8, 8, '#2a2a3a'); }
    if (id === 'hat') { Art.rr(ctx, -40, 0, 80, 14, 5); ctx.fillStyle = '#ff5e7a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); Art.rr(ctx, -26, -46, 52, 50, 10); ctx.fill(); ctx.stroke(); ell(ctx, 0, -50, 12, 12, '#ffffff'); ctx.stroke(); }
    if (id === 'scarf') { Art.rr(ctx, -56, -12, 112, 24, 12); ctx.fillStyle = '#3fb8ff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); Art.rr(ctx, 20, 0, 24, 56, 8); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  };
  MG.game('snowman', {
    icon(ctx) { ell(ctx, 0, 14, 20, 18, '#ffffff'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, 0, -14, 14, 13, '#ffffff'); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, -12); ctx.lineTo(0, -10); ctx.fillStyle = '#ff8a1a'; ctx.fill(); },
    init() {
      this.balls = [{ r: 110 }, { r: 80 }, { r: 58 }].map((b, i) => Object.assign(b, { rank: i, x: [260, 1020, 640][i], y: 640 - b.r * 0.5 + (i === 2 ? -40 : 0), placed: false }));
      M.shuffle(this.balls).forEach((b, i) => { b.x = [250, 1030, 470][i]; });
      this.parts = PARTS.map((p, i) => ({ id: p.id, name: p.name, x: 160 + i * 320, y: 140, placed: false, home: null }));
      this.parts.forEach(p => { p.home = { x: p.x, y: p.y }; });
      this.stage = 'balls'; this.drag = null; this.wave = 0;
    },
    say: 'Слепим снеговика! Перетащи снежные комы на полянку: сначала самый большой, потом поменьше, а сверху самый маленький.',
    stackY(i) { const b = this.balls.filter(x => x.placed).sort((a, b) => a.rank - b.rank); let y = 660; for (let k = 0; k < i; k++) y -= this.balls.find(x => x.rank === k).r * 1.7; return y - this.balls.find(x => x.rank === i).r; },
    target(id) {
      const head = this.balls[0].rank === 2 ? this.balls[0] : this.balls.find(b => b.rank === 2), mid = this.balls.find(b => b.rank === 1);
      return { carrot: [head.x + 10, head.y], eyes: [head.x, head.y - 20], hat: [head.x, head.y - head.r + 4], scarf: [mid.x, mid.y - mid.r + 10] }[id];
    },
    down(x, y) {
      const list = this.stage === 'balls' ? this.balls.filter(b => !b.placed) : this.parts.filter(p => !p.placed);
      for (const o of list) { const r = o.r || 60; if (Math.hypot(x - o.x, y - o.y) < r + 10) { this.drag = { o, dx: o.x - x, dy: o.y - y }; Sound.pop(1); return; } }
    },
    move(x, y) { if (this.drag) { this.drag.o.x = x + this.drag.dx; this.drag.o.y = y + this.drag.dy; } },
    up() {
      const d = this.drag; this.drag = null; if (!d || this.won) return;
      const o = d.o;
      if (this.stage === 'balls') {
        const next = this.balls.filter(b => b.placed).length;
        if (Math.abs(o.x - 640) < 200 && o.y > 200) {
          if (o.rank === next) { o.placed = true; G.tween(o, { x: 640, y: this.stackY(o.rank) }, 0.35, G.ease.outBack); Sound.chime(0.8 + next * 0.2); if (next === 2) { this.stage = 'parts'; G.wait(0.6, () => Voice.say('Отлично! Теперь наряди снеговика: морковка, глазки, шапка и шарфик!')); } }
          else { Sound.boing(); Voice.say(o.rank > next ? 'Этот ком маловат. Сначала нужен побольше!' : 'Этот ком великоват для верха!'); G.tween(o, { y: 600 }, 0.4, G.ease.outQuad); }
        }
      } else {
        const [tx, ty] = this.target(o.id);
        if (Math.hypot(o.x - tx, o.y - ty) < 110) {
          o.placed = true; G.tween(o, { x: tx, y: ty }, 0.25, G.ease.outBack); Sound.chime(1.2); G.burst(tx, ty, { kind: 'star', n: 10, speed: 160 });
          if (this.parts.every(p => p.placed)) { this.wave = 1; this.win('Ура! Какой красивый снеговик получился! Он машет тебе рукой!'); }
        } else G.tween(o, { x: o.home.x, y: o.home.y }, 0.4, G.ease.outQuad);
      }
    },
    render(ctx, t) {
      ctx.save(); ctx.globalAlpha = 0.6; ell(ctx, 640, 668, 220, 30, '#ffffff'); ctx.restore();
      if (this.stage === 'balls') { ctx.save(); ctx.setLineDash([12, 10]); ctx.globalAlpha = 0.6; ell(ctx, 640, 550, 140, 120); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore(); }
      // руки-веточки, когда готов
      if (this.stage === 'parts') { const mid = this.balls.find(b => b.rank === 1); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mid.x + s * mid.r * 0.9, mid.y); ctx.lineTo(mid.x + s * (mid.r + 70), mid.y - 40 - (s > 0 && this.wave ? Math.sin(t * 8) * 30 : 0)); ctx.lineWidth = 7; ctx.strokeStyle = '#7a4a20'; ctx.stroke(); } }
      for (const b of this.balls.slice().sort((a, c) => (a.placed === c.placed ? 0 : a.placed ? -1 : 1))) { const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8def0'); ell(ctx, b.x, b.y, b.r, b.r * 0.92); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); }
      if (this.stage === 'parts') { const head = this.balls.find(b => b.rank === 2); if (!this.parts.find(p => p.id === 'eyes').placed) {} ctx.beginPath(); ctx.arc(head.x, head.y + 10, 20, 0.3, Math.PI - 0.3); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); }
      for (const p of this.parts) { if (this.stage === 'balls') continue; if (!p.placed) { ell(ctx, p.home.x, p.home.y, 62, 62, 'rgba(255,255,255,0.5)'); } drawPart(ctx, p.id, p.x, p.y, 1); }
      Art.dragon(ctx, 1150, 650, 0.45, { kind: this.dr, t, look: -1, happy: this.won });
    },
  });

  // ================= Кристаллия: Пингвин на льдинах =================
  MG.game('floes', {
    icon(ctx) { ell(ctx, 0, 20, 28, 9, '#d8f4ff'); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, 0, 0, 13, 18, '#2a2a4a'); ell(ctx, 0, 4, 8, 12, '#ffffff'); ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(3, -6); ctx.lineTo(0, -1); ctx.fillStyle = '#ff9a1a'; ctx.fill(); },
    init() { this.cross = 0; this.need = 3; this.reset(); },
    reset() {
      this.rows = [580, 470, 360, 250].slice(0, Math.min(4, 3 + (this.lvl > 1 ? 1 : 0))).map((y, i) => {
        const dir = i % 2 ? -1 : 1, sp = (55 + this.lvl * 12 + i * 8) * dir, n = 3;
        return { y, sp, floes: [...Array(n)].map((_, k) => ({ x: k * 470 + M.rnd(0, 120), w: 190 })) };
      });
      this.pg = { row: -1, x: 640, y: 680, floe: null, jump: 0 };
    },
    say: 'Помоги пингвинчику перебраться к рыбке! Нажимай на льдину, которая рядом с ним, и он прыгнет.',
    down(x, y) {
      const p = this.pg; if (p.jump) return;
      const nr = p.row + 1;
      if (nr >= this.rows.length) return;
      const row = this.rows[nr];
      if (Math.abs(y - row.y) > 60) { if (y < row.y - 60) { Sound.boing(); Voice.say('Прыгать можно только на ближнюю льдину!'); } return; }
      const f = row.floes.find(f => Math.abs(this.wrap(f.x) - x) < f.w / 2 + 20);
      if (!f) return;
      if (Math.abs(this.wrap(f.x) - p.x) > 210) { Sound.boing(); Voice.say('Далеко! Подожди, пока льдина подплывёт.'); return; }
      p.jump = 1; Sound.whoosh();
      const sx = p.x, sy = p.y, tx = this.wrap(f.x), ty = row.y - 30;
      const o = { k: 0 };
      G.tween(o, { k: 1 }, 0.45, G.ease.inOutQuad, () => { p.jump = 0; p.row = nr; p.floe = f; p.off = p.x - this.wrap(f.x); Sound.pop(1.2);
        if (nr === this.rows.length - 1) G.wait(0.3, () => this.land()); });
      p.tw = o; p.sx = sx; p.sy = sy; p.tx = tx; p.ty = ty;
    },
    land() {
      const p = this.pg; p.jump = 1;
      G.tween(p, { y: 150 }, 0.4, G.ease.outQuad, () => {
        this.cross++; Sound.chomp(); Sound.magic(); G.burst(p.x, 150, { kind: 'heart', n: 10, up: true, g: -80, speed: 160 });
        if (this.cross >= this.need) this.win('Ура! Пингвинчик поймал все рыбки! Ты отличный помощник!');
        else { Voice.say('Рыбка поймана! Ещё раз!'); G.wait(1, () => this.reset()); }
      });
    },
    wrap(x) { return ((x % 1500) + 1500) % 1500 - 110; },
    tick(dt) {
      for (const r of this.rows) for (const f of r.floes) f.x += r.sp * dt;
      const p = this.pg;
      if (p.jump && p.tw) { const k = p.tw.k; p.x = M.lerp(p.sx, p.tx, k); p.y = M.lerp(p.sy, p.ty, k) - Math.sin(k * Math.PI) * 70; if (k >= 1) p.tw = null; }
      if (!p.jump && p.floe) {
        p.x = this.wrap(p.floe.x) + p.off;
        if (p.x < 30 || p.x > 1250) { Sound.splash ? Sound.splash() : Sound.bump(); G.burst(p.x, p.y, { kind: 'dot', n: 14, colors: ['#bfefff', '#ffffff'], speed: 200 }); Voice.say('Плюх! Пингвин уплыл на краешек. Начнём сначала!'); this.reset(); }
      }
    },
    render(ctx, t) {
      const v = G.view; ctx.fillStyle = '#2a7ac8'; ctx.fillRect(v.x0, 190, v.x1 - v.x0, 450);
      ctx.fillStyle = '#eaf8ff'; ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, 190); ctx.fillRect(v.x0, 640, v.x1 - v.x0, 100);
      for (let i = 0; i < 10; i++) { const wx = (i * 151 + t * 25) % 1300 - 10, wy = 220 + (i * 67) % 400; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 15, wy - 6, wx + 30, wy); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke(); }
      for (const r of this.rows) for (const f of r.floes) { const x = this.wrap(f.x); ell(ctx, x, r.y, f.w / 2, 26, '#e8f8ff'); ctx.lineWidth = 4; ctx.strokeStyle = '#6ab0d8'; ctx.stroke(); ell(ctx, x - 20, r.y - 6, f.w / 4, 8, '#ffffff'); }
      // рыбка на том берегу
      ctx.save(); ctx.translate(this.pg.x > 0 ? 640 : 640, 120); ell(ctx, 0, 0, 30, 16, '#ffb23a'); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(46, -14); ctx.lineTo(46, 14); ctx.closePath(); ctx.fillStyle = '#ffb23a'; ctx.fill(); ctx.stroke(); ell(ctx, -14, -4, 4, 4, LINE); ctx.restore();
      // подсветка следующего ряда
      const nr = this.pg.row + 1; if (nr < this.rows.length && !this.won) { ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 5) * 0.1; ctx.fillStyle = '#ffffff'; ctx.fillRect(v.x0, this.rows[nr].y - 40, v.x1 - v.x0, 80); ctx.restore(); }
      Art.critter(ctx, 'penguin', this.pg.x, this.pg.y, 0.5, t, this.won ? 1 : 0);
      Art.dragon(ctx, 1160, 700, 0.36, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.cross / this.need, 'Рыбки: ' + this.cross + ' из ' + this.need, '#ffb23a');
    },
  });

  // ================= Радуга: Раскрась радугу =================
  MG.game('rainbowpaint', {
    icon(ctx) { ['#ff4d5e', '#ffd23f', '#41c862', '#3fb8ff'].forEach((c, i) => { ctx.beginPath(); ctx.arc(0, 18, 30 - i * 7, Math.PI, 0); ctx.lineWidth = 7; ctx.strokeStyle = c; ctx.stroke(); }); },
    init() { this.round = 0; this.rounds = 2; this.newRb(); },
    newRb() { this.n = this.round === 0 && this.lvl < 2 ? 5 : 7; this.cols = this.n === 5 ? [0, 1, 2, 3, 5].map(i => COLORS[i]) : COLORS.slice(); this.k = 0; this.pots = M.shuffle(this.cols.slice()).map((c, i) => ({ c, x: 640 + (i - (this.n - 1) / 2) * 150, y: 640, sh: 0 })); this.fill = []; },
    say: 'Раскрасим радугу! Сверху вниз: красный, оранжевый, жёлтый, зелёный, голубой, синий, фиолетовый. Нажимай на краску!',
    down(x, y) {
      for (const p of this.pots) {
        if (Math.hypot(x - p.x, y - p.y) > 62) continue;
        const need = this.cols[this.k];
        if (p.c === need) { this.fill.push({ k: 0 }); G.tween(this.fill[this.fill.length - 1], { k: 1 }, 0.6, G.ease.inOutQuad); this.k++; Sound.note(this.k - 1); Voice.say(p.c.name[0].toUpperCase() + p.c.name.slice(1) + '!');
          if (this.k === this.n) { Sound.magic(); G.wait(1.2, () => { this.round++; if (this.round >= this.rounds) this.win('Ура! Радуга сияет всеми цветами! Какая красота!'); else { Voice.say('Красиво! А теперь радуга побольше!'); this.newRb(); } }); }
        } else { p.sh = 1; Sound.boing(); Voice.say('Это ' + p.c.name + '. А сейчас нужен ' + need.name + '!'); }
        return;
      }
    },
    anim(dt) { for (const p of this.pots || []) p.sh = Math.max(0, p.sh - dt * 3); },
    render(ctx, t) {
      const R = 420, w = (R - 150) / this.n;
      for (let i = 0; i < this.n; i++) {
        const r = R - i * w - w / 2;
        ctx.beginPath(); ctx.arc(640, 560, r, Math.PI, 0); ctx.lineWidth = w - 4; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke();
        if (i < this.fill.length) { const k = this.fill[i].k; ctx.beginPath(); ctx.arc(640, 560, r, Math.PI, Math.PI + Math.PI * k); ctx.lineWidth = w - 4; ctx.strokeStyle = this.cols[i].c; ctx.stroke(); }
        else if (i === this.k && !this.won) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 6) * 0.2; ctx.beginPath(); ctx.arc(640, 560, r, Math.PI, 0); ctx.lineWidth = w - 4; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore(); }
      }
      Art.cloud(ctx, 640 - R + 30, 560, 1.1); Art.cloud(ctx, 640 + R - 30, 560, 1.1);
      for (const p of this.pots) { const sx = Math.sin(p.sh * 25) * 10 * p.sh; Art.rr(ctx, p.x - 44 + sx, p.y - 30, 88, 74, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, p.x + sx, p.y - 30, 44, 16, p.c.c); ctx.stroke(); }
      Art.dragon(ctx, 1170, 450, 0.4, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.k / this.n, 'Цвета радуги', '#ff9ad5');
    },
  });

  // ================= Радуга: Цветные баночки =================
  MG.game('colorjars', {
    icon(ctx) { ['#ff4d5e', '#3fb8ff'].forEach((c, i) => { Art.rr(ctx, -30 + i * 32, -16, 28, 40, 7); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.stroke(); ell(ctx, -16 + i * 32, 12, 9, 7, c); }); },
    init() {
      const nJ = Math.min(4, 3 + (this.lvl > 1 ? 1 : 0));
      this.jcols = M.shuffle([0, 2, 3, 4, 6].map(i => COLORS[i])).slice(0, nJ);
      this.jars = this.jcols.map((c, i) => ({ c, x: 640 + (i - (nJ - 1) / 2) * 250, y: 560, n: 0, sh: 0 }));
      this.goal = 12; this.candies = []; for (let i = 0; i < this.goal; i++) this.candies.push({ c: M.pick(this.jcols), x: M.rnd(180, 1100), y: M.rnd(170, 360), hx: 0, hy: 0, done: false });
      this.candies.forEach(c => { c.hx = c.x; c.hy = c.y; });
      this.drag = null;
    },
    say: 'Разложи конфетки по баночкам: каждую — в баночку такого же цвета!',
    down(x, y) { for (const c of this.candies.slice().reverse()) if (!c.done && Math.hypot(x - c.x, y - c.y) < 50) { this.drag = c; Sound.pop(1.1); return; } },
    move(x, y) { if (this.drag) { this.drag.x = x; this.drag.y = y; } },
    up() {
      const c = this.drag; this.drag = null; if (!c) return;
      const j = this.jars.find(j => Math.abs(c.x - j.x) < 95 && c.y > 430);
      if (!j) return;
      if (j.c === c.c) { c.done = true; j.n++; this.score++; Sound.chime(1 + (this.score % 6) * 0.08); G.tween(c, { x: j.x + M.rnd(-30, 30), y: j.y + 30 - Math.min(5, j.n) * 10 }, 0.25, G.ease.outQuad); if (this.score >= this.goal) this.win('Ура! Все конфетки разложены по цветам! Умница!'); }
      else { j.sh = 1; Sound.boing(); Voice.say('Эта конфетка ' + c.c.name.replace(/ый$/, 'ая').replace(/ий$/, 'яя').replace(/ой$/, 'ая') + '. Найди баночку такого же цвета!'); G.tween(c, { x: c.hx, y: c.hy }, 0.4, G.ease.outQuad); }
    },
    anim(dt) { for (const j of this.jars || []) j.sh = Math.max(0, j.sh - dt * 3); },
    render(ctx, t) {
      for (const j of this.jars) { const sx = Math.sin(j.sh * 25) * 10 * j.sh; Art.rr(ctx, j.x - 85 + sx, j.y - 80, 170, 170, 26); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = LINE; ctx.stroke(); Art.rr(ctx, j.x - 92 + sx, j.y - 100, 184, 30, 10); ctx.fillStyle = j.c.c; ctx.fill(); ctx.stroke(); }
      for (const c of this.candies) { if (c === this.drag) continue; this.candy(ctx, c, t); }
      if (this.drag) this.candy(ctx, this.drag, t, 1.2);
      Art.dragon(ctx, 1180, 330, 0.36, { kind: this.dr, t, look: -1, happy: this.won });
      MG.bar(ctx, this.score / this.goal, 'Конфетки: ' + this.score + ' / ' + this.goal, '#ff9ad5');
    },
    candy(ctx, c, t, s) { s = s || 1; ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 24, 0); ctx.lineTo(sd * 44, -16); ctx.lineTo(sd * 44, 16); ctx.closePath(); ctx.fillStyle = c.c.c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke(); } ell(ctx, 0, 0, 28, 22, c.c.c); ctx.stroke(); ell(ctx, -8, -8, 8, 5, 'rgba(255,255,255,0.6)'); ctx.restore(); },
  });
})();
