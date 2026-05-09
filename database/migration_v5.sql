-- Migración v5: añade columna platform (pc | ps3 | ps4)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'pc';
