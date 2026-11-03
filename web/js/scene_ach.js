// Достижения и настройки для взрослых
'use strict';
const DIFFS = [[0, 'Легко'], [2, 'Средне'], [4, 'Сложно'], [6, 'Очень сложно']];
G.scenes.ach = {
  enter(args) {
    this.tab = args.tab || 'ach';
    UI.homeButton(this);
    this.tabA = UI.add(this, { x: 380, y: 64, w: 260, h: 66, label: 'Достижения', fontSize: 26, color: '#8f6cf2', onTap: () => this.setTab('ach') });
    this.tabL = UI.add(this, { x: 650, y: 64, w: 260, h: 66, label: 'Успехи', fontSize: 26, color: '#5a5a7a', onTap: () => this.setTab('learn') });
    this.tabS = UI.add(this, { x: 920, y: 64, w: 260, h: 66, label: 'Для взрослых', fontSize: 26, color: '#5a5a7a', onTap: () => this.setTab('set') });
    this.setBtns = [];
    DIFFS.forEach(([v, name], i) => this.setBtns.push(UI.add(this, { x: 330 + i * 210, y: 230, w: 196, h: 64, label: name, fontSize: name.length > 8 ? 22 : 26, color: '#5a5a7a', diff: v,
      onTap: () => { S.data.diff = v; S.save(); this.refresh(); } })));
    [[0, 'выкл'], [20, '20 мин'], [30, '30 мин'], [45, '45 мин']].forEach(([v, name], i) => this.setBtns.push(UI.add(this, { x: 520 + i * 170, y: 410, w: 156, h: 54, label: name, fontSize: 22, color: '#5a5a7a', brk: v,
      onTap: () => { S.data.breakMin = v; S.data.playSec = 0; S.save(); this.refresh(); } })));
    this.musicBtn = UI.add(this, { x: 435, y: 330, w: 300, h: 64, label: '', fontSize: 26, color: '#38d6c3', onTap: () => { Sound.setMusic(!S.data.music); this.refresh(); } });
    this.voiceBtn = UI.add(this, { x: 845, y: 330, w: 300, h: 64, label: '', fontSize: 26, color: '#38d6c3', onTap: () => { S.data.voice = !S.data.voice; S.save(); this.refresh(); } });
    this.updBtn = UI.add(this, { x: 640, y: 640, w: 420, h: 64, label: 'Проверить обновления', fontSize: 26, color: '#41d982',
      onTap: () => { if (window.Android && Android.checkUpdates) { Android.checkUpdates(); this.msg = 'Проверяю…'; setTimeout(() => this.readInfo(), 4000); } else this.msg = 'Доступно только в приложении'; } });
    this.resetBtn = UI.add(this, { x: 1105, y: 640, w: 290, h: 64, label: 'Сбросить прогресс', fontSize: 22, color: '#c8304a', onTap: () => this.openGate() });
    this.setBtns.push(this.musicBtn, this.voiceBtn, this.updBtn, this.resetBtn);
    // «взрослый» вопрос перед сбросом, чтобы ребёнок случайно не стёр игру
    this.gate = null;
    this.gateBtns = [0, 1, 2].map(i => UI.add(this, { x: 440 + i * 200, y: 430, w: 170, h: 80, label: '', fontSize: 34, color: '#8f6cf2', hidden: true, onTap: () => this.answerGate(i) }));
    this.gateCancel = UI.add(this, { x: 640, y: 560, w: 260, h: 64, label: 'Отмена', fontSize: 26, color: '#41d982', hidden: true, onTap: () => this.closeGate() });
    this.readInfo(); this.msg = '';
    this.setTab(this.tab);
  },
  openGate() {
    const a = M.ri(6, 9), b = M.ri(5, 9), r = a + b, opts = M.shuffle([r, r + M.pick([1, 2]), r - M.pick([1, 2, 3])]);
    this.gate = { a, b, r, opts };
    for (const btn of this.setBtns) btn.hidden = true;
    this.tabA.hidden = this.tabL.hidden = this.tabS.hidden = true;
    this.gateBtns.forEach((btn, i) => { btn.hidden = false; btn.label = String(opts[i]); });
    this.gateCancel.hidden = false;
  },
  closeGate() {
    this.gate = null;
    this.gateBtns.forEach(btn => { btn.hidden = true; }); this.gateCancel.hidden = true;
    this.tabA.hidden = this.tabL.hidden = this.tabS.hidden = false;
    this.setTab('set');
  },
  answerGate(i) {
    if (!this.gate) return;
    if (this.gate.opts[i] !== this.gate.r) { Sound.boing(); this.closeGate(); this.msg = 'Ответ неверный — прогресс не стёрт.'; return; }
    try { localStorage.removeItem(KEY); } catch (e) { }
    Voice.stop();
    location.reload();
  },
  readInfo() {
    this.info = null;
    try { if (window.Android && Android.updateInfo) this.info = JSON.parse(Android.updateInfo()); } catch (e) { }
    if (this.msg === 'Проверяю…') this.msg = '';
  },
  setTab(tab) {
    this.tab = tab;
    this.tabA.color = tab === 'ach' ? '#8f6cf2' : '#5a5a7a';
    this.tabS.color = tab === 'set' ? '#8f6cf2' : '#5a5a7a';
    this.tabL.color = tab === 'learn' ? '#8f6cf2' : '#5a5a7a';
    for (const b of this.setBtns) b.hidden = tab !== 'set';
    this.refresh();
  },
  refresh() {
    for (const b of this.setBtns) if (b.diff != null) b.color = S.data.diff === b.diff ? '#ff7eb6' : '#5a5a7a';
    for (const b of this.setBtns) if (b.brk != null) b.color = (S.data.breakMin || 0) === b.brk ? '#ff7eb6' : '#5a5a7a';
    this.musicBtn.label = S.data.music ? 'Музыка: вкл' : 'Музыка: выкл';
    this.voiceBtn.label = S.data.voice ? 'Голос: вкл' : 'Голос: выкл';
  },
  down(x, y) {
    if (this.tab !== 'ach') return;
    const a = this.hitCard(x, y);
    if (a) { Voice.say(a.title + '. ' + a.desc + '.'); Sound.pop(1); }
  },
  layout(i) { const c = i % 5, r = Math.floor(i / 5); return { x: 160 + c * 240, y: 148 + r * 84 }; },
  hitCard(x, y) {
    for (let i = 0; i < ACH.length; i++) { const p = this.layout(i); if (Math.abs(x - p.x) < 115 && Math.abs(y - p.y) < 38) return ACH[i]; }
    return null;
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.6);
    if (this.gate) {
      UI.text(ctx, 'Стереть весь прогресс?', 640, 170, 40, '#fff', 'center', true);
      UI.text(ctx, 'Все драконы, вкусняшки, достижения и успехи в школе пропадут. Отменить это нельзя.', 640, 235, 22, '#ffd6f0', 'center', false);
      UI.text(ctx, 'Вопрос для взрослых: сколько будет ' + this.gate.a + ' + ' + this.gate.b + '?', 640, 330, 30, '#ffd23f', 'center', true);
      return;
    }
    if (this.tab === 'learn') return this.drawLearn(ctx, t);
    if (this.tab === 'ach') {
      UI.text(ctx, 'Получено: ' + Ach.count() + ' из ' + ACH.length, 1170, 64, 19, '#ffd6f0', 'center', true);
      ACH.forEach((a, i) => {
        const p = this.layout(i), got = !!S.data.ach[a.id], k = Ach.progress(a);
        Art.rr(ctx, p.x - 115, p.y - 37, 230, 74, 18); ctx.fillStyle = got ? 'rgba(255,248,230,0.97)' : 'rgba(60,40,110,0.8)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = got ? '#ffd23f' : '#2a1650'; ctx.stroke();
        Art.ell(ctx, p.x - 80, p.y, 27, 27, got ? '#ffd23f' : '#4a3a70'); Art.stroke(ctx, 3);
        ctx.save(); if (!got) ctx.globalAlpha = 0.4; Art.icon(ctx, a.icon, p.x - 80, p.y, 0.56, t); ctx.restore();
        UI.text(ctx, a.title, p.x + 30, p.y - 14, a.title.length > 14 ? 17 : 20, got ? '#5a3fa0' : '#d6c8ff', 'center', false);
        if (!got && !a.ok) { UI.progress(ctx, p.x - 38, p.y + 6, 140, 22, k, '#ff7eb6'); }
        else UI.text(ctx, got ? '★ получено' : 'ещё нет', p.x + 30, p.y + 18, 17, got ? '#ff7eb6' : '#a898d0', 'center', false);
      });
    } else {
      UI.text(ctx, 'Сложность игр', 640, 170, 30, '#fff', 'center', true);
      UI.text(ctx, 'Сложность растёт сама с каждой победой; здесь — стартовый уровень.', 640, 280, 20, '#d6c8ff', 'center', false);
      UI.text(ctx, 'Перерыв:', 370, 412, 24, '#fff', 'center', true);
      const inf = this.info;
      let err = '';
      if (inf && inf.error) err = /404/.test(inf.error) ? 'Сервер обновлений недоступен (404): репозиторий на GitHub должен быть публичным.'
        : /Unknown|resolve|connect|timeout/i.test(inf.error) ? 'Нет связи с интернетом — проверим позже.' : 'Ошибка: ' + inf.error.slice(0, 70);
      const lines = inf ? [
        'Версия игры: ' + inf.webActive + '   (в APK: ' + inf.webBundled + ', скачано: ' + inf.webDownloaded + ')',
        'Версия приложения (APK): ' + inf.apk + (inf.remoteApk > inf.apk ? '   → доступна ' + inf.remoteApk : ''),
        'На сервере: игра ' + (inf.remoteWeb || '—') + '.  Статус: ' + inf.result,
      ].concat(err ? [err] : []) : ['Версия игры: ' + G.webVersion, 'Обновление по воздуху работает в Android-приложении.'];
      Art.rr(ctx, 140, 448, 1000, 170, 24); ctx.fillStyle = 'rgba(30,14,70,0.75)'; ctx.fill();
      lines.forEach((ln, i) => UI.text(ctx, ln, 640, 474 + i * 38, 20, i === 3 ? '#ffb3c8' : '#fff', 'center', false));
      if (this.msg) UI.text(ctx, this.msg, 640, 700, 22, '#ffd23f', 'center', true);
    }
  },
  // успехи в обучении: какие буквы и цифры ребёнок знает, а какие путает
  drawLearn(ctx, t) {
    const col = (kind, k, open) => { if (!open) return 'rgba(80,60,130,0.5)'; const r = Learn.data()[kind][k]; if (!r || !(r.ok + r.bad)) return '#9a8ac0'; if (r.bad > r.ok) return '#ff6f8a'; return Learn.known(kind, k) ? '#41d982' : '#ffd23f'; };
    UI.text(ctx, 'Буквы', 640, 128, 30, '#fff', 'center', true);
    const openL = LETTER_ORDER.slice(0, Learn.data().openL);
    ALPHABET.forEach((L, i) => { const x = 175 + (i % 11) * 93, y = 180 + Math.floor(i / 11) * 82;
      Art.rr(ctx, x - 38, y - 34, 76, 68, 16); ctx.fillStyle = col('L', L, openL.includes(L)); ctx.fill(); Art.stroke(ctx, 3);
      UI.text(ctx, L, x, y + 2, 40, '#ffffff', 'center', true); });
    UI.text(ctx, 'Цифры', 640, 452, 30, '#fff', 'center', true);
    NUMBERS.forEach((n, i) => { const x = 175 + i * 93, y = 505;
      Art.rr(ctx, x - 38, y - 34, 76, 68, 16); ctx.fillStyle = col('N', n, n <= Learn.data().openN); ctx.fill(); Art.stroke(ctx, 3);
      UI.text(ctx, String(n), x, y + 2, 40, '#ffffff', 'center', true); });
    const legend = [['#41d982', 'знает'], ['#ffd23f', 'учит'], ['#ff6f8a', 'путает'], ['#9a8ac0', 'ещё не спрашивали'], ['rgba(80,60,130,0.5)', 'откроется позже']];
    const lx = [170, 320, 460, 630, 900]; legend.forEach(([c, s], i) => { Art.ell(ctx, lx[i], 590, 13, 13, c); Art.stroke(ctx, 2); UI.text(ctx, s, lx[i] + 20, 591, 19, '#fff', 'left', false); });
    const trouble = ALPHABET.filter(L => { const r = Learn.data().L[L]; return r && r.bad > r.ok; }).concat(NUMBERS.filter(n => { const r = Learn.data().N[n]; return r && r.bad > r.ok; }).map(String));
    UI.text(ctx, (trouble.length ? 'Стоит повторить: ' + trouble.join(', ') : 'Путаницы пока нет — молодец!') + '   ·   Уроков пройдено: ' + Learn.data().sessions, 640, 640, 22, '#ffe9a0', 'center', true);
    const D = Learn.data(), syl = Object.values(D.S || {}).filter(r => r.ok > r.bad).length, words = Object.values(D.W || {}).filter(r => r.ok > 0).length;
    UI.text(ctx, 'Написал знаков: ' + Object.keys(D.T || {}).length + ' из 43  ·  Читает слогов: ' + syl + '  ·  Прочитал слов: ' + words + '  ·  Считает до ' + (D.openC || 20), 640, 680, 21, '#ffffff', 'center', true);
  },
  drawTop(ctx) { },
};
