ALTER TABLE t_p42417384_quantum_advancement_.users
  ADD COLUMN IF NOT EXISTS customer_code varchar(20) UNIQUE;

UPDATE t_p42417384_quantum_advancement_.users
  SET customer_code = 'AR-' || LPAD(id::text, 5, '0')
  WHERE customer_code IS NULL;

ALTER TABLE t_p42417384_quantum_advancement_.users
  ALTER COLUMN customer_code SET NOT NULL,
  ALTER COLUMN customer_code SET DEFAULT '';