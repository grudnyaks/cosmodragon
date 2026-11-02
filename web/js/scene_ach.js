// Достижения и настройки для взрослых
'use strict';
const DIFFS = [[0, 'Легко'], [2, 'Средне'], [4, 'Сложно'], [6, 'Очень сложно']];
G.scenes.ach = {
  enter(args) {
    this.tab = args.tab || 'ach';
    UI.homeButton(this);
    this.tabA = UI.add(this, { x: 480, y: 64, w: 300, h: 66, label: 'Достижения', fontSize: 28, color: '#8f6cf2', onTap: () => this.setTab('ach') });
    this.tabS = UI.add(this, { x: 800, y: 64, w: 300, h: 66, label: 'Для взрослых', fontSize: 28, color: '#5a5a7a', onTap: () => this.setTab('set') });
    this.setBtns = [];
    DIFFS.forEach(([v, name], i) => this.setBtns.push(UI.add(this, { x: 330 + i * 210, y: 230, w: 196, h: 64, label: name, fontSize: name.length > 8 ? 22 : 26, color: '#5a5a7a', diff: v,
      onTap: () => { S.data.diff = v; S.save(); this.refresh(); } })));
    this.musicBtn = UI.add(this, { x: 435, y: 350, w: 300, h: 64, label: '', fontSize: 26, color: '#38d6c3', onTap: () => { Sound.setMusic(!S.data.music); this.refresh(); } });
    this.voiceBtn = UI.add(this, { x: 845, y: 350, w: 300, h: 64, label: '', fontSize: 26, color: '#38d6c3', onTap: () => { S.data.voice = !S.data.voice; S.save(); this.refresh(); } });
    this.updBtn = UI.add(this, { x: 640, y: 640, w: 420, h: 64, label: 'Проверить обновления', fontSize: 26, color: '#41d982',
      onTap: () => { if (window.Android && Android.checkUpdates) { Android.checkUpdates(); this.msg = 'Проверяю…'; setTimeout(() => this.readInfo(), 4000); } else this.msg = 'Доступно только в приложении'; } });
    this.setBtns.push(this.musicBtn, this.voiceBtn, this.updBtn);
    this.readInfo(); this.msg = '';
    this.setTab(this.tab);
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
    for (const b of this.setBtns) b.hidden = tab !== 'set';
    this.refresh();
  },
  refresh() {
    for (const b of this.setBtns) if (b.diff != null) b.color = S.data.diff === b.diff ? '#ff7eb6' : '#5a5a7a';
    this.musicBtn.label = S.data.music ? 'Музыка: вкл' : 'Музыка: выкл';
    this.voiceBtn.label = S.data.voice ? 'Голос: вкл' : 'Голос: выкл';
  },
  down(x, y) {
    if (this.tab !== 'ach') return;
    const a = this.hitCard(x, y);
    if (a) { Voice.say(a.title + '. ' + a.desc + '.'); Sound.pop(1); }
  },
  layout(i) { const c = i % 5, r = Math.floor(i / 5); return { x: 160 + c * 240, y: 162 + r * 96 }; },
  hitCard(x, y) {
    for (let i = 0; i < ACH.length; i++) { const p = this.layout(i); if (Math.abs(x - p.x) < 115 && Math.abs(y - p.y) < 44) return ACH[i]; }
    return null;
  },
  draw(ctx) {
    const t = G.t;
    World.calm(ctx, t, 0.6);
    if (this.tab === 'ach') {
      UI.text(ctx, 'Получено: ' + Ach.count() + ' из ' + ACH.length, 1100, 64, 22, '#ffd6f0', 'center', true);
      ACH.forEach((a, i) => {
        const p = this.layout(i), got = !!S.data.ach[a.id], k = Ach.progress(a);
        Art.rr(ctx, p.x - 115, p.y - 42, 230, 84, 20); ctx.fillStyle = got ? 'rgba(255,248,230,0.97)' : 'rgba(60,40,110,0.8)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = got ? '#ffd23f' : '#2a1650'; ctx.stroke();
        Art.ell(ctx, p.x - 78, p.y, 30, 30, got ? '#ffd23f' : '#4a3a70'); Art.stroke(ctx, 3);
        ctx.save(); if (!got) ctx.globalAlpha = 0.4; Art.icon(ctx, a.icon, p.x - 78, p.y, 0.62, t); ctx.restore();
        UI.text(ctx, a.title, p.x + 30, p.y - 14, a.title.length > 14 ? 17 : 20, got ? '#5a3fa0' : '#d6c8ff', 'center', false);
        if (!got && !a.ok) { UI.progress(ctx, p.x - 38, p.y + 6, 140, 22, k, '#ff7eb6'); }
        else UI.text(ctx, got ? '★ получено' : 'ещё нет', p.x + 30, p.y + 18, 17, got ? '#ff7eb6' : '#a898d0', 'center', false);
      });
    } else {
      UI.text(ctx, 'Сложность игр', 640, 170, 30, '#fff', 'center', true);
      UI.text(ctx, 'Сложность растёт сама с каждой победой; здесь — стартовый уровень.', 640, 285, 20, '#d6c8ff', 'center', false);
      const inf = this.info;
      const lines = inf ? [
        'Версия игры: ' + inf.webActive + '   (в APK: ' + inf.webBundled + ', скачано: ' + inf.webDownloaded + ')',
        'Версия приложения (APK): ' + inf.apk + (inf.remoteApk > inf.apk ? '   → доступна ' + inf.remoteApk : ''),
        'Последняя версия на сервере: ' + (inf.remoteWeb || '—') + '   Статус: ' + inf.result + (inf.error ? ' (' + inf.error + ')' : ''),
      ] : ['Версия игры: ' + G.webVersion, 'Обновление по воздуху работает в Android-приложении.'];
      Art.rr(ctx, 180, 420, 920, 170, 24); ctx.fillStyle = 'rgba(30,14,70,0.75)'; ctx.fill();
      lines.forEach((ln, i) => UI.text(ctx, ln, 640, 456 + i * 44, 21, '#fff', 'center', false));
      if (this.msg) UI.text(ctx, this.msg, 640, 700, 22, '#ffd23f', 'center', true);
    }
  },
  drawTop(ctx) { },
};
