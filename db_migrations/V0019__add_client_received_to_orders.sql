ALTER TABLE t_p42417384_quantum_advancement_.orders
  ADD COLUMN IF NOT EXISTS client_received boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_received_at timestamp NULL;