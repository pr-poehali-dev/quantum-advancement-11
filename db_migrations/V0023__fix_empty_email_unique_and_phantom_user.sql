-- Заменяем пустые email/phone у фантомного пользователя уникальными placeholder-значениями
UPDATE users SET email = 'telegram_user_3@internal', phone = 'tg_3' WHERE id = 3 AND email = '' AND phone = '';

-- Убираем ограничение через ALTER TABLE и пересоздаём как partial index
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
DROP INDEX IF EXISTS users_email_key;
CREATE UNIQUE INDEX users_email_key ON users (email) WHERE email NOT LIKE '%@internal';
