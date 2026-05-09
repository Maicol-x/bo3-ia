-- migration_v11: sistema de avatares de usuario

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(20) NOT NULL DEFAULT 'ghost';
