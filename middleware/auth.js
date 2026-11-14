const jwt = require('jsonwebtoken');
const db = require('../db');

const COOKIE = 'tq_token';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 дней

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  };
}

function issueToken(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, cookieOptions());
}

function clearToken(res) {
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined });
}

// Подставляет req.user, если пользователь вошёл; гостей пропускает дальше
async function optionalAuth(req, res, next) {
  req.user = null;
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return next();
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
    if (rows[0]) req.user = rows[0];
  } catch (_) { /* просроченный или подделанный токен — считаем гостем */ }
  next();
}

module.exports = { optionalAuth, issueToken, clearToken };
