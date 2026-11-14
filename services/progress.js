const db = require('../db');
const { PAGES, getPage } = require('../config/pages');
const { ACHIEVEMENTS, isUnlocked, progressOf } = require('../config/achievements');

// Оставляем только существующие slug-и без дублей
function cleanSlugs(list) {
  if (!Array.isArray(list)) return [];
  const out = new Set();
  for (const s of list.slice(0, 200)) {
    if (typeof s === 'string' && getPage(s)) out.add(s);
  }
  return [...out];
}

async function getVisited(userId) {
  const { rows } = await db.query('SELECT page_slug FROM page_visits WHERE user_id = $1', [userId]);
  return rows.map((r) => r.page_slug);
}

async function recordVisits(userId, slugs) {
  const clean = cleanSlugs(slugs);
  if (!clean.length) return;
  await db.query(
    'INSERT INTO page_visits (user_id, page_slug) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING',
    [userId, clean]
  );
}

async function getUnlocked(userId) {
  const { rows } = await db.query(
    'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
    [userId]
  );
  return new Map(rows.map((r) => [r.achievement_id, r.unlocked_at]));
}

// Выдаёт достижения, условия которых выполнены; возвращает id только что полученных
async function awardAchievements(userId, visited) {
  const set = new Set(visited);
  const existing = await getUnlocked(userId);
  const toAdd = ACHIEVEMENTS.filter((a) => !existing.has(a.id) && isUnlocked(a, set)).map((a) => a.id);
  if (!toAdd.length) return [];
  const { rows } = await db.query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING RETURNING achievement_id`,
    [userId, toAdd]
  );
  return rows.map((r) => r.achievement_id);
}

// Единый формат ответа для коллекции и достижений.
// unlockedMap = null → гость: достижения считаются «на лету» по списку страниц.
function buildState(visited, unlockedMap) {
  const set = new Set(visited);
  const pages = PAGES.map((p, i) =>
    set.has(p.slug)
      ? { number: i + 1, opened: true, slug: p.slug, title: p.title, summary: p.summary, thumb: p.thumb, url: `/p/${p.slug}` }
      : { number: i + 1, opened: false } // у закрытых страниц название и адрес не раскрываем
  );
  const achievements = ACHIEVEMENTS.map((a) => {
    const unlocked = unlockedMap ? unlockedMap.has(a.id) : isUnlocked(a, set);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      enabled: a.enabled,
      unlocked,
      unlockedAt: unlockedMap && unlocked ? unlockedMap.get(a.id) : null,
      progress: progressOf(a, set),
    };
  });
  return { total: PAGES.length, visitedCount: set.size, pages, achievements };
}

async function stateForUser(userId) {
  const visited = await getVisited(userId);
  const newlyUnlocked = await awardAchievements(userId, visited);
  const unlocked = await getUnlocked(userId);
  return { state: buildState(visited, unlocked), newlyUnlocked };
}

module.exports = { cleanSlugs, recordVisits, getVisited, awardAchievements, buildState, stateForUser };
