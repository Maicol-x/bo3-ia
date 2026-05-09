-- Migración v3: agregar weapons_pap para tracking detallado de Pack-a-Punch y AATs
-- Ejecutar: psql -U postgres -d bo3_ia -f database/migration_v3.sql

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS weapons_pap JSONB NOT NULL DEFAULT '[]';

-- Comentario: weapons TEXT[] se mantiene como lista plana de nombres de arma.
-- weapons_pap JSONB almacena el detalle de cada arma:
--   [{ "weapon": "KN-44", "pap_count": 2, "aat": "dead_wire" }]
--
-- pap_count: 0 = sin PaP, 1 = PaP x1 (5000 pts), 2 = PaP x2 (2500 pts extra, cambia AAT)
-- aat: dead_wire | blast_furnace | turned | thunder_wall | fireworks | null
