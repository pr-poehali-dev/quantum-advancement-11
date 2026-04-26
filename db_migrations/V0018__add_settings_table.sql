CREATE TABLE IF NOT EXISTS t_p42417384_quantum_advancement_.settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p42417384_quantum_advancement_.settings (key, value)
VALUES ('payment_details', '')
ON CONFLICT (key) DO NOTHING;