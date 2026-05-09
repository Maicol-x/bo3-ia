-- Migración: ampliar tabla games para Shadows of Evil
-- Ejecutar: psql -U postgres -d bo3_ia -f database/migration_v2.sql

ALTER TABLE games
  -- Contexto de partida
  ADD COLUMN IF NOT EXISTS map                    TEXT NOT NULL DEFAULT 'shadows_of_evil',
  ADD COLUMN IF NOT EXISTS game_mode              TEXT NOT NULL DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS character              TEXT,

  -- Zona y causa de muerte ya existen, solo documentamos valores válidos

  -- Armas
  ADD COLUMN IF NOT EXISTS weapons                TEXT[] NOT NULL DEFAULT '{}',

  -- Buildables y progresión
  ADD COLUMN IF NOT EXISTS pack_a_punch           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rituals_completed      INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_apothicon_servant  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_apothicon_sword    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_rocket_shield      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS civil_protector_active BOOLEAN NOT NULL DEFAULT FALSE,

  -- Economía
  ADD COLUMN IF NOT EXISTS points_at_death        INT,

  -- Gobblegums
  ADD COLUMN IF NOT EXISTS gobblegums             TEXT[] NOT NULL DEFAULT '{}';

-- Eliminar columna redundante juggernog (ahora está incluida en perks[])
-- NOTA: ejecuta esto solo si ya tienes juggernog dentro del array perks en tus registros
-- ALTER TABLE games DROP COLUMN IF EXISTS juggernog;
