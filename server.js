require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const db = require('./db');
const { getPage } = require('./config/pages');

if (!process.env.JWT_SECRET) {
  console.error('Не задан JWT_SECRET. Скопируйте .env.example в .env и заполните его.');
  process.exit(1);
}

const PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const app = express();

app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/progress', require('./routes/progress'));

// Страницы с информацией (адрес из QR-кода): отдаём исходную вёрстку как есть
// и добавляем в конец меню + учёт открытия страницы.
const pageCache = new Map();
async function renderPage(slug) {
  if (PROD && pageCache.has(slug)) return pageCache.get(slug);
  const raw = await fs.readFile(path.join(__dirname, 'pages', `${slug}.html`), 'utf8');
  const inject =
    '<link rel="stylesheet" href="/css/menu.css">' +
    `<script>window.__PAGE_SLUG__=${JSON.stringify(slug)};</script>` +
    '<script src="/js/app.js" defer></script>';
  const i = raw.lastIndexOf('</body>');
  const html = i === -1 ? raw + inject : raw.slice(0, i) + inject + raw.slice(i);
  if (PROD) pageCache.set(slug, html);
  return html;
}

app.get('/p/:slug', async (req, res, next) => {
  try {
    if (!getPage(req.params.slug)) return res.status(404).type('text').send('Страница не найдена');
    res.type('html').send(await renderPage(req.params.slug));
  } catch (err) { next(err); }
});

app.get('/', (req, res) => res.redirect('/collection'));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((req, res) => res.status(404).type('text').send('Страница не найдена'));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

db.init()
  .then(() => app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Не удалось подключиться к PostgreSQL:', err.message);
    console.error('Проверьте DATABASE_URL в файле .env');
    process.exit(1);
  });
