ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS user_accuracy_feedback TEXT
    CHECK (user_accuracy_feedback IN ('accurate', 'inaccurate')),
  ADD COLUMN IF NOT EXISTS user_feedback_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scans_user_accuracy_feedback
  ON scans(user_accuracy_feedback);
