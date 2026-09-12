CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  doc_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  content_text TEXT,
  content_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  instruction TEXT NOT NULL,
  summary TEXT,
  findings_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
