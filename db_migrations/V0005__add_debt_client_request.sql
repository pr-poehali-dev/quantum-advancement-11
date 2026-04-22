-- Запросы клиента на действие с долгом
ALTER TABLE debts ADD COLUMN IF NOT EXISTS client_request VARCHAR(20);
  -- 'refund'  — запрос возврата
  -- 'credit'  — зачесть в следующий выкуп
ALTER TABLE debts ADD COLUMN IF NOT EXISTS client_card TEXT;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS client_request_at TIMESTAMP;
