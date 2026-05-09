-- Schema principal de BO3-IA — Shadows of Evil
-- Ejecutar en una BD nueva: psql -U <usuario> -d bo3_ia -f schema.sql

CREATE TABLE IF NOT EXISTS games (
  id                      SERIAL PRIMARY KEY,

  -- Contexto de partida
  map                     TEXT NOT NULL DEFAULT 'shadows_of_evil',
  game_mode               TEXT NOT NULL DEFAULT 'solo',         -- solo | split_screen
  platform                TEXT NOT NULL DEFAULT 'pc',           -- pc | ps3 | ps4
  character               TEXT,                                  -- nero | jack | jessica | floyd

  -- Resultado
  round                   INT NOT NULL,
  zone                    TEXT NOT NULL,                         -- junction | canal_district | footlight_district | waterfront_district | the_rift
  cause_of_death          TEXT NOT NULL,                         -- zombie | margwa | parasite | meatball | keeper | unknown

  -- Perks al morir
  perks                   TEXT[] NOT NULL DEFAULT '{}',          -- quick_revive | juggernog | speed_cola | double_tap | widows_wine | mule_kick | stamin_up

  -- Armas: lista plana derivada de weapons_pap
  weapons                 TEXT[] NOT NULL DEFAULT '{}',

  -- Armas con detalle de Pack-a-Punch y AAT
  -- Formato: [{ "weapon": "KN-44", "pap_count": 2, "aat": "dead_wire" }, ...]
  weapons_pap             JSONB NOT NULL DEFAULT '[]',

  -- Buildables y progresión
  pack_a_punch            BOOLEAN NOT NULL DEFAULT FALSE,
  rituals_completed       INT NOT NULL DEFAULT 0,                -- 0-4
  has_apothicon_servant   BOOLEAN NOT NULL DEFAULT FALSE,
  has_apothicon_sword     BOOLEAN NOT NULL DEFAULT FALSE,
  has_rocket_shield       BOOLEAN NOT NULL DEFAULT FALSE,
  civil_protector_active  BOOLEAN NOT NULL DEFAULT FALSE,

  -- Economía
  points_at_death         INT,

  -- Anotación libre
  notes                   TEXT,

  -- Gobblegums usados
  gobblegums              TEXT[] NOT NULL DEFAULT '{}',

  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
