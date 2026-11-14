// Достижения. Чтобы добавить новое:
//   1) скопируйте один из объектов ниже, задайте уникальный id, title, description, icon;
//   2) выберите правило (rule) и поставьте enabled: true.
// Поддерживаемые правила:
//   { type: 'visited_count', min: N }       — открыто не меньше N страниц
//   { type: 'visited_all' }                 — открыты все страницы каталога
//   { type: 'visited_pages', slugs: [...] } — открыты конкретные страницы
const { PAGES } = require('./pages');

const ACHIEVEMENTS = [
  {
    id: 'pioneer',
    title: 'Первооткрыватель',
    description: 'Откройте первую страницу с информацией',
    icon: '🧭',
    enabled: true,
    rule: { type: 'visited_count', min: 1 },
  },
  {
    id: 'explorer',
    title: 'Исследователь',
    description: 'Откройте все страницы с информацией',
    icon: '🗺️',
    enabled: true,
    rule: { type: 'visited_all' },
  },
  // ---- пустые шаблоны (пока не выдаются никому) ----
  {
    id: 'template_1',
    title: 'Скоро появится',
    description: 'Это достижение ещё готовится',
    icon: '🔒',
    enabled: false,
    rule: null,
  },
  {
    id: 'template_2',
    title: 'Скоро появится',
    description: 'Это достижение ещё готовится',
    icon: '🔒',
    enabled: false,
    rule: null,
  },
];

const TOTAL = PAGES.length;

function isUnlocked(ach, visitedSet) {
  if (!ach.enabled || !ach.rule) return false;
  const r = ach.rule;
  switch (r.type) {
    case 'visited_count': return visitedSet.size >= r.min;
    case 'visited_all': return visitedSet.size >= TOTAL;
    case 'visited_pages': return r.slugs.every((s) => visitedSet.has(s));
    default: return false;
  }
}

// Для полоски прогресса на странице достижений
function progressOf(ach, visitedSet) {
  if (!ach.enabled || !ach.rule) return null;
  const r = ach.rule;
  switch (r.type) {
    case 'visited_count': return { current: Math.min(visitedSet.size, r.min), target: r.min };
    case 'visited_all': return { current: visitedSet.size, target: TOTAL };
    case 'visited_pages': return { current: r.slugs.filter((s) => visitedSet.has(s)).length, target: r.slugs.length };
    default: return null;
  }
}

module.exports = { ACHIEVEMENTS, isUnlocked, progressOf };
