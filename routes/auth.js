const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { optionalAuth, issueToken, clearToken } = require('../middleware/auth');
const { cleanSlugs, recordVisits, awardAchievements, getVisited } = require('../services/progress');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Слишком много попыток. Попробуйте позже.' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Переносим прогресс, накопленный гостем на устройстве, в аккаунт
async function mergeLocalProgress(userId, localVisited) {
  await recordVisits(userId, cleanSlugs(localVisited));
  await awardAchievements(userId, await getVisited(userId));
}

router.get('/me', optionalAuth, (req, res) => res.json({ user: req.user }));

router.post('/register', limiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!EMAIL_RE.test(email) || email.length > 255) return res.status(400).json({ error: 'Введите корректный email' });
    if (username.length < 2 || username.length > 40) return res.status(400).json({ error: 'Имя — от 2 до 40 символов' });
    if (password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Пароль — от 6 символов' });

    const hash = await bcrypt.hash(password, 10);
    let user;
    try {
      const { rows } = await db.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [email, username, hash]
      );
      user = rows[0];
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
      throw err;
    }

    await mergeLocalProgress(user.id, req.body.visited);
    issueToken(res, user.id);
    res.status(201).json({ user });
  } catch (err) { next(err); }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const { rows } = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1', [email]);
    const row = rows[0];
    const ok = row && (await bcrypt.compare(password, row.password_hash));
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    await mergeLocalProgress(row.id, req.body.visited);
    issueToken(res, row.id);
    res.json({ user: { id: row.id, username: row.username, email: row.email } });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

module.exports = router;
