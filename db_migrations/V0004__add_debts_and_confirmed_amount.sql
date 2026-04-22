-- Добавляем скорректированную сумму оплаты (то что реально принял модератор)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_amount NUMERIC(10,2);

-- Таблица долгов
-- type: 'client_owes' — клиент должен нам, 'we_owe' — мы должны клиенту
CREATE TABLE IF NOT EXISTS debts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('client_owes', 'we_owe')),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolve_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
