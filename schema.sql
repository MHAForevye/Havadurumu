-- Kristal veritabanı (Cloudflare D1)
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,            -- 8 haneli Site ID
  token_hash TEXT NOT NULL,               -- gizli anahtarın SHA-256 özeti
  bal        INTEGER NOT NULL DEFAULT 0,
  earned     INTEGER NOT NULL DEFAULT 0,
  gift       INTEGER NOT NULL DEFAULT 0,
  spent      INTEGER NOT NULL DEFAULT 0,
  days       INTEGER NOT NULL DEFAULT 0,
  first      TEXT NOT NULL DEFAULT '',
  last       TEXT NOT NULL DEFAULT '',
  cam        TEXT NOT NULL DEFAULT '',
  pending    TEXT NOT NULL DEFAULT '',
  created    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reqs (
  no      TEXT PRIMARY KEY,
  uid     TEXT NOT NULL,
  pack    TEXT NOT NULL,
  cost    INTEGER NOT NULL,
  cam     TEXT NOT NULL,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  status  TEXT NOT NULL DEFAULT 'new'     -- new | done
);
CREATE INDEX IF NOT EXISTS reqs_uid ON reqs(uid, created);
CREATE TABLE IF NOT EXISTS codes (
  code    TEXT PRIMARY KEY,               -- 13 harflik hediye kodu
  to_id   TEXT NOT NULL,
  n       INTEGER NOT NULL,
  t       TEXT NOT NULL,
  created INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS codes_to ON codes(to_id);
CREATE TABLE IF NOT EXISTS log (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  uid   TEXT NOT NULL,
  kind  TEXT NOT NULL,                    -- daily | buy | redeem | admin_add
  delta INTEGER NOT NULL,
  ref   TEXT NOT NULL DEFAULT '',
  t     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS log_uid ON log(uid);
-- Günlük yeni hesap sınırı için (IP ham saklanmaz, günlük özet)
CREATE TABLE IF NOT EXISTS ipc (
  h TEXT NOT NULL,
  d TEXT NOT NULL,
  c INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (h, d)
);
