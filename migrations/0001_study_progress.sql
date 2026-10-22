CREATE TABLE IF NOT EXISTS study_progress (
  learner_key TEXT PRIMARY KEY,
  last_topic TEXT NOT NULL DEFAULT '',
  last_section TEXT NOT NULL DEFAULT '',
  mastery INTEGER NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  actions_count INTEGER NOT NULL DEFAULT 0 CHECK (actions_count >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  topics_explored JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)