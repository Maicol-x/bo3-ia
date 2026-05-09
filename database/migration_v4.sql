-- Migration v4: eliminar columna juggernog (reemplazada por perks TEXT[])
ALTER TABLE games DROP COLUMN juggernog;
