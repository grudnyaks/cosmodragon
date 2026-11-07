// Планета Ням-Ням: оформление, два дракончика, вкусняшки и 12 мини-игр
'use strict';
// g(scene, icon, color, title) — игра на планете; scene — механика, title — название на этой планете
const g = (scene, icon, color, title, hint) => ({ scene, icon, color, title, hint });

const PLANETS = [
  {
    id: 'nyam', order: 0, name: 'Ням-Ням', of: 'планеты Ням-Ням', mult: 1,
    sky: ['#1d1660', '#6a40c0', '#ff9ad5'], ground: ['#62d8c4', '#3fb8a9', '#2a8f8a'], mount: '#9b6fe0', mount2: '#7d55c8',
    decor: 'candy', treatName: 'вкусняшки', obstacle: 'meteor', critter: 'bunny', voice: 'nyam',
    beacon: ['#ff7eb6', '#8f6cf2'],
    dragon: { name: 'Дракоша', acc: 'Дракошу', muzzle: '#3c3b4c', body: '#262533', shade: '#141320', hi: '#4d4c60', belly: '#ffd6b0', bellyShade: '#e9a97e',
      horn: '#fff1c9', accent: '#9a9bab', accent2: '#6d6e7e', iris1: '#b49bff', iris2: '#4a2fc0', pattern: 'spots', patternColor: '#8d8e9e',
      crest: 'spikes', tail: 'star', wing: 'bat', wingColor: '#4a4a5e', wingMem: '#6c6c84' },
    treats: ['cupcake', 'cookie', 'candy', 'donut', 'starpop', 'strawberry'],
    games: [
      g('treasure', 'map', '#ffb23a', 'Сокровища'), g('puzzle', 'puzzle', '#3fb8ff', 'Пазлы'), g('catch', 'catch', '#41d982', 'Лови вкусняшки'),
      g('memory', 'memory', '#ff9a3c', 'Найди пару'), g('bowling', 'bowling', '#8f6cf2', 'Конфетный боулинг'), g('maze', 'maze', '#1f7fd0', 'Лабиринт'),
      g('pop', 'pop', '#ff7eb6', 'Пузырьки'), g('fishing', 'fishing', '#1fa0d0', 'Рыбалка'), g('simon', 'crystals', '#38d6c3', 'Поющие кристаллы'),
      g('stars', 'constellation', '#3a5ad8', 'Звёздные дорожки'), g('bunny', 'bunny', '#ffb23a', 'Космо-зайчики'), g('tower', 'tower', '#7ec0ff', 'Облачная башня'),
    ],
    intro: null,
  },
];
// Два дракончика Ням-Ням. Внешность — собственные дизайны игры.
const DRAGONS = [
  { id: 'dark', name: 'Дракоша', acc: 'Дракошу', gen: 'Дракоши', dat: 'Дракоше', voice: 'nyam',
    body: '#2a2833', hi: '#5a5868', shade: '#121119', belly: '#3d3a48', bellyHi: '#6a6678', spot: '#8d8c9c', horn: '#efe2c4', hornShade: '#b59f78',
    wing: '#24222c', wingMem: '#4a4658', iris: ['#d9c8ff', '#8a68e8', '#3a2490'], claw: '#efe2c4', tip: 'spade', marks: 'spots' },
  { id: 'light', name: 'Пушок', acc: 'Пушка', gen: 'Пушка', dat: 'Пушку', voice: 'wind',
    body: '#f3efe8', hi: '#ffffff', shade: '#b8b0c4', belly: '#fbf3df', bellyHi: '#fffaf0', spot: '#e3c17a', horn: '#e8c27a', hornShade: '#a8823c',
    wing: '#e9e3ee', wingMem: '#f8eef4', iris: ['#ffe9a8', '#f0a640', '#8a4a10'], claw: '#d8b46a', tip: 'tuft', marks: 'freckles' },
];
const DRAGON_BY_ID = { dark: DRAGONS[0], light: DRAGONS[1] };
const PLANET_BY_ID = {};
PLANETS.forEach(p => { PLANET_BY_ID[p.id] = p; });

S.load();
