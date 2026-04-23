ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES forum_comments(id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_id);
