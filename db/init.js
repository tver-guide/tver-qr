// npm run db:init — создать таблицы вручную (сервер делает это и сам при старте)
const db = require('./index');
db.init()
  .then(() => { console.log('Таблицы созданы / уже существуют'); return db.pool.end(); })
  .catch((err) => { console.error('Ошибка инициализации БД:', err.message); process.exit(1); });
