-- Добавляем поле stock_ml (реальный остаток на складе) к товарам
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_ml numeric(10,2) NOT NULL DEFAULT 0;

-- Таблица документов движения товаров (приход/списание)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    type VARCHAR(20) NOT NULL, -- 'income' | 'writeoff' | 'order_writeoff'
    amount_ml numeric(10,2) NOT NULL, -- всегда положительное
    document_number VARCHAR(100),     -- номер документа прихода / акта
    order_id INTEGER REFERENCES orders(id), -- для автосписания по заказу
    comment TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON stock_movements(order_id);
