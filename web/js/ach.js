// Достижения: условия, проверка и выдача
'use strict';
const ACH = (function () {
  const st = k => (S.data.stats[k] || 0);
  const list = [
    { id: 'feed1', title: 'Первое угощение', desc: 'Покорми дракончика', icon: 'feed', ok: () => st('fed') >= 1 },
    { id: 'feed100', title: 'Заботливый друг', desc: 'Скорми 100 вкусняшек', icon: 'feed', goal: 100, val: () => st('fed') },
    { id: 'feed500', title: 'Повар галактики', desc: 'Скорми 500 вкусняшек', icon: 'feed', goal: 500, val: () => st('fed') },
    { id: 'treats300', title: 'Копилка', desc: 'Собери 300 вкусняшек', icon: 'feed', goal: 300, val: () => st('treats') },
    { id: 'treats1500', title: 'Сокровищница', desc: 'Собери 1500 вкусняшек', icon: 'map', goal: 1500, val: () => st('treats') },
    { id: 'wins10', title: 'Игрок', desc: 'Выиграй 10 игр', icon: 'star', goal: 10, val: () => st('wins') },
    { id: 'wins50', title: 'Чемпион', desc: 'Выиграй 50 игр', icon: 'star', goal: 50, val: () => st('wins') },
    { id: 'wins200', title: 'Легенда', desc: 'Выиграй 200 игр', icon: 'trophy', goal: 200, val: () => st('wins') },
    { id: 'pet50', title: 'Мур-мур', desc: 'Погладь дракончика 50 раз', icon: 'skills', goal: 50, val: () => st('pet') },
    { id: 'astro20', title: 'Весельчак', desc: 'Нажми на космонавта 20 раз', icon: 'skills', goal: 20, val: () => st('astro') },
    { id: 'launch', title: 'Поехали!', desc: 'Запусти ракету', icon: 'route', ok: () => st('launch') >= 1 },
    { id: 'lvl5', title: 'Подрос!', desc: 'Вырасти дракона до 5 уровня', icon: 'wing', ok: () => PLANETS.some(p => S.data.planets[p.id].level >= 5) },
    { id: 'lvl10', title: 'Звёздный дракон', desc: 'Вырасти дракона до 10 уровня', icon: 'star', ok: () => PLANETS.some(p => S.data.planets[p.id].level >= 10) },
    { id: 'hatch1', title: 'Первое яйцо', desc: 'Выведи дракончика из яйца', icon: 'skills', ok: () => st('hatched') >= 1 },
    { id: 'thief', title: 'Сторож', desc: 'Прогони воришку 5 раз', icon: 'sword', goal: 5, val: () => st('thiefScared') },
    { id: 'rescue', title: 'Спаситель', desc: 'Спаси Листика от Змея', icon: 'sword', ok: () => st('rescued') >= 1 },
    { id: 'maze10', title: 'Следопыт', desc: 'Пройди 10 лабиринтов', icon: 'maze', goal: 10, val: () => sumGames('maze') },
    { id: 'fly10', title: 'Ас-пилот', desc: 'Выиграй 10 полётов', icon: 'flyer', goal: 10, val: () => sumGames('flyer') },
    { id: 'puzzle10', title: 'Мастер пазлов', desc: 'Собери 10 пазлов', icon: 'puzzle', goal: 10, val: () => sumGames('puzzle') },
    { id: 'count10', title: 'Умею считать', desc: 'Выиграй 10 игр со счётом', icon: 'pop', goal: 10, val: () => sumGames('pop') + sumGames('stars') },
    { id: 'music10', title: 'Музыкант', desc: 'Спой 10 мелодий', icon: 'crystals', goal: 10, val: () => sumGames('simon') },
    { id: 'moved', title: 'Большая семья', desc: 'Перевези дракона на Ням-Ням', icon: 'gather', ok: () => st('moved') >= 1 },
    { id: 'strike', title: 'Страйк!', desc: 'Сбей все кегли одним броском', icon: 'bowling', ok: () => st('strike') >= 1 },
    { id: 'planets', title: 'Путешественник', desc: 'Открой все планеты', icon: 'galaxy', goal: 7, val: () => S.data.unlocked.length },
  ];
  for (const p of PLANETS) list.push({ id: 'beacon_' + p.id, title: 'Маяк ' + p.of.replace('планеты ', ''), desc: 'Зажги маяк ' + p.of, icon: 'star', planet: p.id, ok: () => S.data.planets[p.id].beacon });
  function sumGames(k) { let s = 0; for (const p of PLANETS) s += (S.data.planets[p.id].games[k] || 0); return s; }
  return list;
})();

const Ach = {
  check() {
    if (!S.data) return;
    for (const a of ACH) {
      if (S.data.ach[a.id]) continue;
      const done = a.ok ? a.ok() : a.val() >= a.goal;
      if (done) {
        S.data.ach[a.id] = Date.now();
        if (typeof G !== 'undefined' && G.toast) { G.toast('Достижение: ' + a.title, a.icon); Sound.levelUp && Sound.chime(1.3); }
      }
    }
  },
  progress(a) { if (a.ok) return S.data.ach[a.id] ? 1 : 0; return Math.min(1, a.val() / a.goal); },
  count() { return ACH.filter(a => S.data.ach[a.id]).length; },
};
