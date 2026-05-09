-- Migración v8: Vincular partidas a usuarios
-- Añade columna user_id a la tabla games (nullable para registros existentes)

ALTER TABLE games ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;

-- Índice para acelerar consultas por usuario
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
