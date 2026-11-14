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
    { id: 'pet50', title: 'Мур-мур', desc: 'Погладь дракончиков 50 раз', icon: 'skills', goal: 50, val: () => st('pet') },
    { id: 'astro20', title: 'Весельчак', desc: 'Нажми на космонавта 20 раз', icon: 'skills', goal: 20, val: () => st('astro') },
    { id: 'launch', title: 'Поехали!', desc: 'Запусти ракету', icon: 'route', ok: () => st('launch') >= 1 },
    { id: 'rescue', title: 'Спаситель', desc: 'Спаси дракончиков от Шипуна', icon: 'sword', ok: () => st('rescued') >= 1 },
    { id: 'rescue5', title: 'Гроза Шипуна', desc: 'Спаси дракончиков 5 раз', icon: 'sword', goal: 5, val: () => st('rescued') },
    { id: 'friend', title: 'Новый друг', desc: 'Подружись со Змеем Шипуном', icon: 'snake', ok: () => V().friend },
    { id: 'hide5', title: 'Мастер пряток', desc: 'Найди дракончиков в прятках 5 раз', icon: 'snake', goal: 5, val: () => V().hides || 0 },
    { id: 'friend2', title: 'Звёздная подруга', desc: 'Подружись с кометой Шкодой', icon: 'comet', ok: () => V().friend2 },
    { id: 'comet3', title: 'Ловец комет', desc: 'Поймай комету Шкоду 3 раза', icon: 'comet', goal: 3, val: () => st('cometCaught') },
    { id: 'cameo10', title: 'Зоркий глаз', desc: 'Заметь Шипуна в играх 10 раз', icon: 'snake', goal: 10, val: () => st('cameo') },
    { id: 'chest5', title: 'Кладоискатель', desc: 'Открой сундук в пещере 5 раз', icon: 'chest', goal: 5, val: () => st('chest') },
    { id: 'cave10', title: 'Смельчак', desc: 'Зайди в пещеру Шипуна 10 раз', icon: 'snake', goal: 10, val: () => st('cave') },
    { id: 'maze10', title: 'Следопыт', desc: 'Пройди 10 лабиринтов', icon: 'maze', goal: 10, val: () => sumGames('maze') },
    { id: 'puzzle10', title: 'Мастер пазлов', desc: 'Собери 10 пазлов', icon: 'puzzle', goal: 10, val: () => sumGames('puzzle') },
    { id: 'count10', title: 'Умею считать', desc: 'Выиграй 10 игр со счётом', icon: 'pop', goal: 10, val: () => sumGames('pop') + sumGames('stars') },
    { id: 'music10', title: 'Музыкант', desc: 'Спой 10 мелодий', icon: 'crystals', goal: 10, val: () => sumGames('simon') },
    { id: 'fish10', title: 'Рыболов', desc: 'Выиграй 10 рыбалок', icon: 'fishing', goal: 10, val: () => sumGames('fishing') },
    { id: 'tower10', title: 'Строитель', desc: 'Построй 10 облачных башен', icon: 'tower', goal: 10, val: () => sumGames('tower') },
    { id: 'strike', title: 'Страйк!', desc: 'Сбей все кегли одним броском', icon: 'bowling', ok: () => st('strike') >= 1 },
    { id: 'style5', title: 'Модник', desc: 'Купи 5 нарядов', icon: 'hat', goal: 5, val: () => st('outfits') },
    { id: 'paint5', title: 'Художник', desc: 'Нарисуй 5 картинок для альбома', icon: 'palette', goal: 5, val: () => st('paint') },
    { id: 'duo5', title: 'Команда', desc: 'Выиграй 5 игр вдвоём', icon: 'duo', goal: 5, val: () => sumGames('duo') },
    { id: 'allgames', title: 'Всё попробовал', desc: 'Выиграй во всех 12 играх', icon: 'trophy', goal: 12, val: () => ['treasure', 'puzzle', 'catch', 'memory', 'bowling', 'maze', 'pop', 'fishing', 'simon', 'stars', 'bunny', 'tower'].filter(k => sumGames(k) > 0).length },
    { id: 'beacon1', title: 'Первый маяк', desc: 'Зажги маяк на планете', icon: 'star', ok: () => st('beacons') >= 1 },
    { id: 'beacon6', title: 'Хранитель маяков', desc: 'Зажги 6 маяков', icon: 'star', goal: 6, val: () => PLANETS.filter(p => S.data.planets[p.id].beacon).length },
    { id: 'beacon12', title: 'Свет галактики', desc: 'Зажги все 12 маяков', icon: 'galaxy', goal: 12, val: () => PLANETS.filter(p => S.data.planets[p.id].beacon).length },
    { id: 'travel', title: 'Путешественник', desc: 'Побывай на всех планетах', icon: 'galaxy', goal: 12, val: () => PLANETS.filter(p => S.data.planets[p.id].visited).length },
    { id: 'thief1', title: 'Догонялки', desc: 'Догони воришку в чёрном шлеме', icon: 'star', ok: () => st('thiefCaught') >= 1 },
    { id: 'tenek', title: 'Тайна чёрного шлема', desc: 'Узнай, кто прятался под шлемом', icon: 'moon', ok: () => T().friend },
  ];
  // победы в игре на всех планетах вместе
  function sumGames(k) { let n = 0; for (const p of PLANETS) n += (S.data.planets[p.id].games[k] || 0); return n; }
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
