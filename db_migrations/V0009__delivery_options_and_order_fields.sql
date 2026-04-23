-- Таблица вариантов доставки
CREATE TABLE delivery_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT,
  schedule TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Вставляем два адреса самовывоза
INSERT INTO delivery_options (name, description, address, schedule, sort_order) VALUES
  ('Самовывоз — офис на Ленина', 'Самовывоз из офиса', 'г. Москва, ул. Ленина, д. 1, офис 101', 'Пн–Пт: 10:00–19:00, Сб: 11:00–17:00', 1),
  ('Самовывоз — офис на Садовой', 'Самовывоз из офиса', 'г. Москва, ул. Садовая, д. 5, офис 32', 'Пн–Пт: 11:00–20:00, Вс: 12:00–16:00', 2);

-- Добавляем поля в orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_option_id INTEGER REFERENCES delivery_options(id),
  ADD COLUMN IF NOT EXISTS delivery_comment TEXT;
