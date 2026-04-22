
-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Товары (ароматы)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_ml NUMERIC(10,2) NOT NULL,
  bottle_ml INTEGER NOT NULL,
  booked_ml INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Атомайзеры (объём → цена)
CREATE TABLE atomizers (
  id SERIAL PRIMARY KEY,
  min_ml INTEGER NOT NULL,
  max_ml INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  name VARCHAR(100) NOT NULL
);

-- Начальные атомайзеры
INSERT INTO atomizers (min_ml, max_ml, price, name) VALUES
  (1, 3, 50, 'Пробник 1-3 мл'),
  (4, 10, 80, 'Атомайзер 4-10 мл'),
  (11, 30, 120, 'Атомайзер 11-30 мл'),
  (31, 100, 180, 'Атомайзер 31-100 мл');

-- Заказы
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  atomizer_id INTEGER REFERENCES atomizers(id),
  volume_ml INTEGER NOT NULL,
  price_per_ml NUMERIC(10,2) NOT NULL,
  atomizer_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'accepted',
  payment_amount NUMERIC(10,2),
  payment_date TIMESTAMP,
  payment_note TEXT,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  pickup_point TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Сессии
CREATE TABLE sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
