-- Migración v6: añade columna notes (anotación libre por partida)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS notes TEXT;
