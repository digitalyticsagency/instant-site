-- Licences issued to white-label customers. One row per customer.
CREATE TABLE IF NOT EXISTS licences (
  key        TEXT PRIMARY KEY,      -- the licence key the customer pastes
  label      TEXT NOT NULL,         -- your name for them, e.g. "Auckland reseller"
  email      TEXT,
  status     TEXT NOT NULL DEFAULT 'active',   -- active | revoked
  created_at INTEGER NOT NULL,
  last_seen  INTEGER,
  uses       INTEGER NOT NULL DEFAULT 0
);

-- Usage events. Written by the app, read by you. Deliberately append-only.
CREATE TABLE IF NOT EXISTS events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  licence TEXT,                     -- may be null for unlicensed/free use
  client  TEXT,                     -- the ?ref= label from the client link
  kind    TEXT NOT NULL,            -- generate | download | verify | blog | export
  meta    TEXT,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_ts      ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_licence ON events(licence);
