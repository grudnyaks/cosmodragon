// Злодей игры — Змей Шипун: главы сюжета, похищения, спасения и финал-дружба
'use strict';
const VILLAIN_NAME = 'Шипун';
// who: 'dark' | 'light' | 'both' | 'one' (случайный из двух); mode — механика спасения (scene_rescue)
const VILLAIN_CHAPTERS = [
  { title: 'Шипун на охоте', who: 'dark', mode: 'feed',
    say: 'Ш-ш-ш! Я — Змей Шипун, самый хитрый змей галактики! Ваш Дракоша теперь мой!',
    lose: 'Ш-ш-ш! Я так объелся, что уснул… Ну ничего, я ещё вернусь!' },
  { title: 'Белый дракончик', who: 'light', mode: 'locks',
    say: 'Ш-ш-ш! Какой беленький, какой пушистый! Пушок будет жить в моей пещере!',
    lose: 'Ш-ш-ш! Мои замки! Ну погодите, в следующий раз я заберу обоих!' },
  { title: 'Оба дракончика', who: 'both', mode: 'shell',
    say: 'Ш-ш-ш! Я же говорил! Два дракончика лучше, чем один. Теперь оба мои!',
    lose: 'Ш-ш-ш! Как ты их нашёл? Я так хорошо их спрятал!' },
  { title: 'Лакричная ловушка', who: 'one', mode: 'weeds',
    say: 'Ш-ш-ш! Я сплёл ловушку из лакричных верёвок. Из неё никто не выберется!',
    lose: 'Ш-ш-ш! Мои верёвки порвались! Ничего, у меня есть план получше.' },
  { title: 'Перечная конфета', who: 'one', mode: 'cool',
    say: 'Ш-ш-ш! Я съел волшебную перечную конфету и стал горячим, как вулкан! Не подходите!',
    lose: 'Ш-ш-ш… Остыл… Ну и ладно. Зато я придумал кое-что ещё!' },
  { title: 'Крепкие кольца', who: 'one', mode: 'blow',
    say: 'Ш-ш-ш! Я обвился вокруг клетки. Меня теперь не сдвинуть!',
    lose: 'Ш-ш-ш! Сдуло! В следующий раз я заберу всех и навсегда!' },
  { title: 'Последняя битва', who: 'both', mode: 'fight', finale: true,
    say: 'Ш-ш-ш! Это последний раз! Я заберу обоих дракончиков на край галактики!',
    lose: 'Ш-ш-ш… Я проиграл…' },
];
const VILLAIN_FINALE = [
  { who: 'villain', text: 'Ш-ш-ш… Я просто хотел, чтобы со мной кто-нибудь дружил. Со мной никто не играет…' },
  { who: 'narrator', text: 'Космонавт протянул Шипуну вкусную конфету, а дракончики замурлыкали.' },
  { who: 'villain', text: 'Ш-ш-ш… Спасибо! Вы теперь мои друзья? Тогда давайте играть в прятки! Я буду иногда прятать дракончиков, а вы — искать!' },
];
// после финала Шипун похищает дракончиков понарошку — это игра в прятки
const VILLAIN_HIDE = {
  title: 'Прятки с Шипуном',
  say: ['Ш-ш-ш! Поиграем в прятки? Я спрятал дракончика!', 'Ш-ш-ш! Кто не спрятался, я не виноват! Ищите ключи!', 'Ш-ш-ш-ха-ха! Опять я вас обхитрил!'],
  lose: ['Ш-ш-ш! Нашли! Ты лучший искатель!', 'Ш-ш-ш! Ладно, ладно, отдаю. Но я ещё спрячу!'],
};
const VILLAIN_TAUNTS = ['Ш-ш-ш! Я слежу за вами!', 'Ш-ш-ш! Скоро ваши дракончики будут мои!', 'Ш-ш-ш! Не подходи к моей пещере!', 'Ш-ш-ш! Ха-ха! Ты меня не поймаешь!'];
const VILLAIN_FRIEND = ['Ш-ш-ш! Привет, друзья!', 'Ш-ш-ш! Скоро поиграем в прятки!', 'Ш-ш-ш! Угостишь конфеткой?'];
const RESCUE_MODES = ['feed', 'locks', 'shell', 'weeds', 'cool', 'blow', 'fight'];
VILLAIN_CHAPTERS.forEach(c => { c.villain = 'snake'; });

// ---------- Вторая история: комета-хулиганка Шкода ----------
// help — подсказка Шипуна, который теперь помогает космонавту
const COMET_NAME = 'Шкода';
const COMET_CHAPTERS = [
  { title: 'Комета Шкода', who: 'dark', mode: 'tap',
    say: 'Ж-ж-жух! Я комета Шкода, самая быстрая в галактике! Дракоша полетит со мной кататься!',
    help: 'Ш-ш-ш! Это комета-хулиганка Шкода! Не бойтесь, я помогу её поймать!',
    lose: 'Ой-ой-ой! Поймали! Ну и ладно, я ещё прилечу!' },
  { title: 'Звёздная пыль', who: 'light', mode: 'sparks',
    say: 'Ж-ж-жух! Пушок такой беленький, прямо как звёздочка! Он будет светиться в моём хвосте!',
    help: 'Ш-ш-ш! Собирай искорки из её хвоста! Без искорок она не сможет летать!',
    lose: 'Ой! Мои искорки! Я без них совсем медленная… Забирайте Пушка!' },
  { title: 'Двойной вжух', who: 'both', mode: 'catch',
    say: 'Ж-ж-жух! Двойной вжух! Теперь я катаю обоих дракончиков сразу!',
    help: 'Ш-ш-ш! Нажми на комету, и она уронит мешочек с искорками. Лови его облачком!',
    lose: 'Ой! Как ты их поймал? Это была моя лучшая шутка!' },
  { title: 'Ночной полёт', who: 'one', mode: 'tap',
    say: 'Ж-ж-жух! Ночью я лечу ещё быстрее! Попробуй-ка меня догнать!',
    help: 'Ш-ш-ш! Я вижу её! Она мелькает между звёздами. Нажимай скорее!',
    lose: 'Ой-ой! Догнали даже ночью! Ну вы и ловкие!' },
  { title: 'Большая гонка', who: 'both', mode: 'sparks', finale: true,
    say: 'Ж-ж-жух! Большая гонка! Если не поймаешь меня, я улечу с дракончиками на другой край галактики!',
    help: 'Ш-ш-ш! Это последняя гонка! Собирай все искорки, я в тебя верю!',
    lose: 'Ой… Ты меня поймал…' },
];
COMET_CHAPTERS.forEach(c => { c.villain = 'comet'; });
const COMET_FINALE = [
  { who: 'comet', text: 'Ж-ж-жух… Я просто хотела, чтобы меня заметили. Я пролетаю так быстро, что меня никто не видит…' },
  { who: 'snake', text: 'Ш-ш-ш… Я тоже раньше хулиганил, потому что мне было грустно одному. Давай дружить с нами!' },
  { who: 'comet', text: 'Правда? Ура! Тогда я буду прилетать в гости и катать дракончиков. Только понарошку!' },
];
const COMET_HIDE = {
  say: ['Ж-ж-жух! Я в гости! Покатаю дракончика, а ты собери три звезды!', 'Ж-ж-жух! Догонялки! Кто соберёт три звезды, тот меня поймает!'],
  lose: ['Ой-ой! Поймали! Ты самый быстрый!', 'Ж-ж-жух! Ладно, возвращаю! Было весело!'],
};
const COMET_MODES = ['tap', 'sparks', 'catch'];
// вся книга: 7 глав про Шипуна и 5 про Шкоду
const STORY = VILLAIN_CHAPTERS.concat(COMET_CHAPTERS);

const Villain = {
  // номер текущей (или следующей) главы, 0..6; после финала — null
  chapter() { const v = V(); return v.friend2 ? null : Math.min(v.ch, STORY.length - 1); },
  // кто сейчас хулиганит (или будет): 'snake' | 'comet'
  who() { const v = V(); return v.taken.length ? (v.villain || 'snake') : (this.chapter() != null ? STORY[this.chapter()].villain : (v.villain || 'snake')); },
  comet() { return this.who() === 'comet'; },
  // пора ли Шипуну снова кого-нибудь похитить
  due() { const v = V(); return !v.taken.length && v.wins >= v.next; },
  // кого и как похищаем сейчас
  plan() {
    const v = V(), c = this.chapter();
    let who, mode, villain;
    if (c != null) { who = STORY[c].who; mode = STORY[c].mode; villain = STORY[c].villain; }
    else { villain = M.pick(['snake', 'comet']); who = M.pick(['dark', 'light', 'both', 'dark', 'light']); mode = M.pick(villain === 'comet' ? COMET_MODES : RESCUE_MODES); }
    if (who === 'one') who = M.pick(['dark', 'light']);
    // драконы текущей планеты: «dark» — первый, «light» — второй
    const here = PD().map(d => d.id);
    let ids = who === 'both' ? here.slice() : [here[who === 'light' && here.length > 1 ? 1 : 0]];
    return { ids, mode, villain };
  },
  start(p) {
    const v = V();
    v.taken = p.ids.slice(); v.lastIds = p.ids.slice(); v.planet = S.data.planet; v.keys = 0; v.mode = p.mode; v.villain = p.villain || 'snake'; v.wins = 0; v.line = p.line || this.sayLine(this.chapter(), v.villain);
    stat('kidnapped');
    S.save();
  },
  // спасение удалось
  rescued() {
    const v = V(), c = this.chapter();
    v.taken = []; v.keys = 0; v.wins = 0; v.rescues++;
    v.next = M.ri(3, 5);
    if (c != null) {
      if (!v.seen.includes(c)) v.seen.push(c); v.ch = c + 1;
      if (STORY[c].finale) { if (STORY[c].villain === 'comet') v.friend2 = true; else v.friend = true; }
    } else v.hides = (v.hides || 0) + 1;
    stat('rescued'); S.save();
    return c;
  },
  sayLine(c, who, ids) { return this.adapt(c != null ? STORY[c].say : M.pick((who || V().villain) === 'comet' ? COMET_HIDE.say : VILLAIN_HIDE.say), ids); },
  loseLine(c, who, ids) { return this.adapt(c != null ? STORY[c].lose : M.pick((who || V().villain) === 'comet' ? COMET_HIDE.lose : VILLAIN_HIDE.lose), ids); },
  // главы написаны про Дракошу и Пушка; на других планетах подставляем имена здешних драконов
  adapt(text, ids) {
    ids = ids || (V().taken.length ? V().taken : V().lastIds) || [];
    if (!text || !ids.length || ids.every(id => id === 'dark' || id === 'light')) return text;
    const a = DRAGON_BY_ID[ids[0]], b = DRAGON_BY_ID[ids[1] || ids[0]];
    return text.replace(/Дракошу/g, a.acc).replace(/Дракоши/g, a.gen).replace(/Дракоше/g, a.dat).replace(/Дракоша/g, a.name)
      .replace(/Пушка/g, b.acc).replace(/Пушку/g, b.dat).replace(/Пушок/g, b.name).replace(/ такой беленький, прямо как звёздочка/g, ' такой красивый, прямо как звёздочка');
  },
  // где сейчас дракончики (для подсказок)
  where() { return V().villain === 'comet' ? 'Комета Шкода унесла дракончиков к звёздам!' : 'Шипун держит дракончиков в Тёмной пещере!'; },
  // «Найди три ключа, чтобы спасти …»
  task(ids) {
    const n = ids.length > 1 ? Care.both(ids) : Care.acc(ids[0]);
    if (V().villain === 'comet') return 'Выигрывай игры и собери три звезды, чтобы вернуть ' + n + '!';
    return 'Выигрывай игры и найди три ключа, чтобы спасти ' + n + '!';
  },
  taunt() {
    const v = V();
    if (v.taken.length && v.villain === 'comet') return 'Ш-ш-ш! Это Шкода опять хулиганит! Собери три звезды, и мы её поймаем!';
    if (v.taken.length) return v.keys >= 3 ? 'Ш-ш-ш! Ключи нашлись? Ну попробуй, отбери дракончиков!' : 'Ш-ш-ш! Сначала найди три ключа!';
    return M.pick(v.friend ? VILLAIN_FRIEND : VILLAIN_TAUNTS);
  },
};
