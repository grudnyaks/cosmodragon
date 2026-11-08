// Забота о дракончиках как в тамагочи: имена, потребности, наряды и вечерний сон
'use strict';
// Четыре потребности: сытость, чистота, радость, бодрость (0..100). Убывают со временем, ничего плохого при нуле не случается.
const NEEDS = [
  { id: 'food', icon: 'plate', color: '#ff9a3c', perHour: 5, scene: 'lunch' },
  { id: 'clean', icon: 'bath', color: '#3fb8ff', perHour: 4, scene: 'bath' },
  { id: 'fun', icon: 'heart', color: '#ff5e9a', perHour: 6, scene: null },
  { id: 'energy', icon: 'moon', color: '#8f6cf2', perHour: 3, scene: 'sleep' },
];
const NEED_BY_ID = {}; NEEDS.forEach(n => { NEED_BY_ID[n.id] = n; });
// Готовые имена для выбора без клавиатуры
const NAME_IDEAS = ['Дракоша', 'Пушок', 'Уголёк', 'Снежок', 'Звёздочка', 'Тучка', 'Ириска', 'Мармелад', 'Черныш', 'Пломбир', 'Кексик', 'Ветерок'];
// Наряды: слот head / neck / face, цена во вкусняшках
const OUTFITS = [
  { id: 'party', slot: 'head', name: 'Праздничный колпак', price: 10 },
  { id: 'bow', slot: 'head', name: 'Бантик', price: 10 },
  { id: 'beanie', slot: 'head', name: 'Шапочка с помпоном', price: 15 },
  { id: 'flower', slot: 'head', name: 'Цветочек', price: 15 },
  { id: 'cap', slot: 'head', name: 'Кепка', price: 20 },
  { id: 'crown', slot: 'head', name: 'Корона', price: 40 },
  { id: 'scarf', slot: 'neck', name: 'Шарфик', price: 15 },
  { id: 'bowtie', slot: 'neck', name: 'Бабочка', price: 15 },
  { id: 'bell', slot: 'neck', name: 'Колокольчик', price: 20 },
  { id: 'medal', slot: 'neck', name: 'Медаль героя', price: 30 },
  { id: 'glasses', slot: 'face', name: 'Очки', price: 20 },
  { id: 'shades', slot: 'face', name: 'Тёмные очки', price: 25 },
];
const OUTFIT_BY_ID = {}; OUTFITS.forEach(o => { OUTFIT_BY_ID[o.id] = o; });

const Care = {
  defaults() {
    const pets = {};
    for (const d of DRAGONS) pets[d.id] = { food: 80, clean: 80, fun: 80, energy: 90, name: '', outfit: {} };
    return { pets, owned: [], t: Date.now(), bedtime: '20:00', sleepUntil: 0, lastCall: 0 };
  },
  data() {
    if (!S.data.care) S.data.care = this.defaults();
    const c = S.data.care, def = this.defaults();
    for (const d of DRAGONS) c.pets[d.id] = Object.assign(def.pets[d.id], c.pets[d.id] || {});
    return c;
  },
  pet(id) { return this.data().pets[id]; },
  // ---------- имена ----------
  name(id) { const p = this.pet(id); return (p && p.name) || DRAGON_BY_ID[id].name; },
  custom(id) { const p = this.pet(id); return !!(p && p.name && p.name !== DRAGON_BY_ID[id].name); },
  // винительный падеж: для своих имён — «дракончика Тучка»
  acc(id) { return this.custom(id) ? 'дракончика ' + this.name(id) : DRAGON_BY_ID[id].acc; },
  both(ids) {
    ids = ids || ['dark', 'light'];
    if (ids.length < 2) return this.acc(ids[0]);
    return ids.some(id => this.custom(id)) ? 'обоих дракончиков' : DRAGON_BY_ID[ids[0]].acc + ' и ' + DRAGON_BY_ID[ids[1]].acc;
  },
  // подставляем свои имена в готовые фразы (там имена в именительном падеже)
  fill(text) {
    let s = text;
    if (this.custom('dark')) s = s.replace(/Дракоша/g, this.name('dark'));
    if (this.custom('light')) s = s.replace(/Пушок/g, this.name('light'));
    return s;
  },
  setName(id, n) { this.pet(id).name = n; S.save(); },
  // ---------- потребности ----------
  // убывание по времени; за время, пока игра закрыта, — не больше 35 пунктов
  tick() {
    const c = this.data(), now = Date.now();
    let hours = (now - (c.t || now)) / 3600000;
    c.t = now;
    if (hours <= 0) return;
    for (const d of DRAGONS) {
      const p = c.pets[d.id];
      if (isTaken(d.id)) continue;
      for (const n of NEEDS) p[n.id] = M.clamp(p[n.id] - Math.min(35, n.perHour * hours), 0, 100);
    }
  },
  add(id, need, v) { const p = this.pet(id); p[need] = M.clamp(p[need] + v, 0, 100); S.save(); },
  // самая острая потребность (если меньше порога)
  lowest(id, th) {
    const p = this.pet(id); let best = null;
    for (const n of NEEDS) if (p[n.id] < (th || 30) && (!best || p[n.id] < p[best.id])) best = n;
    return best;
  },
  mood(id) {
    const p = this.pet(id), m = Math.min(p.food, p.clean, p.fun, p.energy);
    return m < 20 ? 'sad' : (m > 65 ? 'happy' : 'ok');
  },
  // фраза-просьба
  ask(id, need) {
    const n = this.name(id);
    return { food: n + ' хочет кушать! Накорми его обедом.', clean: n + ' испачкался! Искупай его.',
      fun: n + ' скучает! Погладь его.', energy: n + ' устал. Уложи его поспать.' }[need];
  },
  // после мини-игры напарник веселеет, но немного устаёт
  played() { const b = buddy(); this.add(b, 'fun', 12); this.add(b, 'energy', -4); },
  // ---------- наряды ----------
  owned(oid) { return this.data().owned.includes(oid); },
  buy(oid) {
    const o = OUTFIT_BY_ID[oid];
    if (this.owned(oid)) return true;
    if (PS().treats < o.price) return false;
    PS().treats -= o.price; this.data().owned.push(oid); stat('outfits'); S.save();
    return true;
  },
  wear(id, oid) {
    const o = OUTFIT_BY_ID[oid], out = this.pet(id).outfit;
    out[o.slot] = out[o.slot] === oid ? null : oid; S.save();
    return out[o.slot] === oid;
  },
  outfit(id) { return this.pet(id).outfit; },
  // ---------- вечерний сон ----------
  bedMinutes() { const b = this.data().bedtime; if (!b) return null; const [h, m] = b.split(':').map(Number); return h * 60 + m; },
  // поздно ли (с времени сна и до 6 утра)
  late() {
    const bm = this.bedMinutes(); if (bm == null) return false;
    const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    return m >= bm || m < 6 * 60;
  },
  asleep() { return Date.now() < (this.data().sleepUntil || 0); },
  // уложили спать — игра «спит» до 7 утра
  goodnight() {
    const d = new Date(); d.setHours(7, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    const c = this.data(); c.sleepUntil = d.getTime();
    for (const id in c.pets) c.pets[id].energy = 100;
    stat('bedtime'); S.save();
  },
  wake() { this.data().sleepUntil = 0; S.save(); },
};
