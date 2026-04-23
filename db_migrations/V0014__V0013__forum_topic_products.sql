CREATE TABLE IF NOT EXISTS forum_topic_products (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(topic_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_topic_products_topic ON forum_topic_products(topic_id);
