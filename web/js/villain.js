// Злодей игры — Змей Шипун: главы сюжета, похищения, спасения и финал-дружба
'use strict';
const VILLAIN_NAME = 'Шипун';
// who: 'dark' | 'light' | 'both' | 'one' (случайный из двух); mode — механика спасения (scene_rescue)
const VILLAIN_CHAPTERS = [
  { title: 'Шипун выходит на охоту', who: 'dark', mode: 'feed',
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

const Villain = {
  // номер текущей (или следующей) главы, 0..6; после финала — null
  chapter() { const v = V(); return v.friend ? null : Math.min(v.ch, VILLAIN_CHAPTERS.length - 1); },
  // пора ли Шипуну снова кого-нибудь похитить
  due() { const v = V(); return !v.taken.length && v.wins >= v.next; },
  // кого и как похищаем сейчас
  plan() {
    const v = V(), c = this.chapter();
    let who, mode;
    if (c != null) { who = VILLAIN_CHAPTERS[c].who; mode = VILLAIN_CHAPTERS[c].mode; }
    else { who = M.pick(['dark', 'light', 'both', 'dark', 'light']); mode = M.pick(RESCUE_MODES); }
    if (who === 'one') who = M.pick(['dark', 'light']);
    return { ids: who === 'both' ? ['dark', 'light'] : [who], mode };
  },
  start(p) {
    const v = V();
    v.taken = p.ids.slice(); v.keys = 0; v.mode = p.mode; v.wins = 0; v.line = p.line || this.sayLine(this.chapter());
    stat('kidnapped');
    S.save();
  },
  // спасение удалось
  rescued() {
    const v = V(), c = this.chapter();
    v.taken = []; v.keys = 0; v.wins = 0; v.rescues++;
    v.next = M.ri(3, 5);
    if (c != null) { if (!v.seen.includes(c)) v.seen.push(c); v.ch = c + 1; if (VILLAIN_CHAPTERS[c].finale) v.friend = true; }
    stat('rescued'); S.save();
    return c;
  },
  sayLine(c) { return c != null ? VILLAIN_CHAPTERS[c].say : M.pick(VILLAIN_HIDE.say); },
  loseLine(c) { return c != null ? VILLAIN_CHAPTERS[c].lose : M.pick(VILLAIN_HIDE.lose); },
  // «Найди три ключа, чтобы спасти …»
  task(ids) {
    const n = ids.length > 1 ? 'Дракошу и Пушка' : DRAGON_BY_ID[ids[0]].acc;
    return 'Выигрывай игры и найди три ключа, чтобы спасти ' + n + '!';
  },
  taunt() {
    const v = V();
    if (v.taken.length) return v.keys >= 3 ? 'Ш-ш-ш! Ключи нашлись? Ну попробуй, отбери дракончиков!' : 'Ш-ш-ш! Сначала найди три ключа!';
    return M.pick(v.friend ? VILLAIN_FRIEND : VILLAIN_TAUNTS);
  },
};
