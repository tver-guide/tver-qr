-- Схема создаётся автоматически при старте сервера (все команды идемпотентны)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  username      VARCHAR(40)  NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

-- Какие страницы с информацией пользователь уже открывал
CREATE TABLE IF NOT EXISTS page_visits (
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_slug        VARCHAR(100) NOT NULL,
  first_visited_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, page_slug)
);

-- Полученные достижения
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  unlocked_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
