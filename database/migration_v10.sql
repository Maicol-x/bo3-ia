-- migration_v10: session_messages + session_id en games

-- 1. Añadir session_id a la tabla games (nullable, para partidas sin sala)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS session_id INT REFERENCES sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_games_session ON games(session_id);

-- 2. Tabla de mensajes de chat en tiempo real por sesión
CREATE TABLE IF NOT EXISTS session_messages (
  id         SERIAL PRIMARY KEY,
  session_id INT         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id    INT         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  username   VARCHAR(50) NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_sid ON session_messages(session_id, created_at);
