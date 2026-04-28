-- Исправляем customer_code у shiva_va (tg-пользователь без кода)
UPDATE users SET customer_code = 'TG-00003' WHERE id = 3 AND customer_code = '';

-- Меняем unique constraint на customer_code: только для непустых значений
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_customer_code_key;
CREATE UNIQUE INDEX users_customer_code_key ON users (customer_code) WHERE customer_code != '';
