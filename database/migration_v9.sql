-- migration_v9.sql
-- Tablas para el sistema de salas multijugador (Fase 3)

CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(10) UNIQUE NOT NULL,
  leader_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'waiting',
    -- 'waiting' | 'in_progress' | 'finished'
  max_players INT NOT NULL DEFAULT 4,
  created_at  TIMESTAMP DEFAULT NOW(),
  started_at  TIMESTAMP,
  finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_members (
  session_id  INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sessions_code      ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_leader    ON sessions(leader_id);
CREATE INDEX IF NOT EXISTS idx_session_members_sid ON session_members(session_id);

-- El líder entra automáticamente como miembro al crear la sala
-- (se maneja en la capa de servicio, no aquí)
