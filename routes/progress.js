const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { getPage } = require('../config/pages');
const { cleanSlugs, recordVisits, buildState, stateForUser } = require('../services/progress');

const router = express.Router();

// Состояние коллекции и достижений.
// Вошедшему пользователю — из БД, гостю — по списку страниц, который хранится у него в браузере.
router.post('/state', optionalAuth, async (req, res, next) => {
  try {
    if (req.user) {
      const { state } = await stateForUser(req.user.id);
      return res.json({ ...state, user: req.user });
    }
    res.json({ ...buildState(cleanSlugs(req.body.visited), null), user: null });
  } catch (err) { next(err); }
});

// Вызывается со страницы с информацией при каждом открытии
router.post('/visit', optionalAuth, async (req, res, next) => {
  try {
    const slug = req.body.slug;
    if (!getPage(slug)) return res.status(400).json({ error: 'Неизвестная страница' });

    if (req.user) {
      await recordVisits(req.user.id, [slug]);
      const { state, newlyUnlocked } = await stateForUser(req.user.id);
      return res.json({ ...state, user: req.user, newlyUnlocked });
    }
    const visited = cleanSlugs([...(Array.isArray(req.body.visited) ? req.body.visited : []), slug]);
    // для гостя «новые» достижения определяет браузер (сравнивает с уже показанными)
    res.json({ ...buildState(visited, null), user: null, newlyUnlocked: null });
  } catch (err) { next(err); }
});

module.exports = router;
