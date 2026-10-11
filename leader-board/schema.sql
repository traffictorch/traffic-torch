-- Traffic Torch Leaderboard schema (D1)
-- Run: wrangler d1 execute traffic-torch-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS high_scores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name      TEXT    NOT NULL,
  url            TEXT    NOT NULL,
  domain         TEXT    NOT NULL,
  title          TEXT,
  overall_score  INTEGER NOT NULL,
  module_scores  TEXT,
  submitted_at   INTEGER NOT NULL,
  fingerprint    TEXT,
  is_hidden      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tool_score ON high_scores(tool_name, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_score      ON high_scores(overall_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dedupe ON high_scores(tool_name, url);
