ALTER TABLE participantes
  ADD COLUMN IF NOT EXISTS concursante_nombres VARCHAR(128),
  ADD COLUMN IF NOT EXISTS concursante_apellidos VARCHAR(128),
  ADD COLUMN IF NOT EXISTS apoderado_nombres VARCHAR(128),
  ADD COLUMN IF NOT EXISTS apoderado_apellidos VARCHAR(128),
  ADD COLUMN IF NOT EXISTS docente_nombres VARCHAR(128),
  ADD COLUMN IF NOT EXISTS docente_apellidos VARCHAR(128);

UPDATE participantes SET
  concursante_nombres = COALESCE(NULLIF(split_part(trim(concursante), ' ', 1), ''), trim(concursante), ''),
  concursante_apellidos = CASE
    WHEN strpos(trim(concursante), ' ') > 0
    THEN trim(substring(trim(concursante) FROM strpos(trim(concursante), ' ') + 1))
    ELSE ''
  END,
  apoderado_nombres = COALESCE(NULLIF(split_part(trim(apoderado), ' ', 1), ''), trim(apoderado), ''),
  apoderado_apellidos = CASE
    WHEN strpos(trim(apoderado), ' ') > 0
    THEN trim(substring(trim(apoderado) FROM strpos(trim(apoderado), ' ') + 1))
    ELSE ''
  END,
  docente_nombres = COALESCE(NULLIF(split_part(trim(docente), ' ', 1), ''), trim(docente), ''),
  docente_apellidos = CASE
    WHEN strpos(trim(docente), ' ') > 0
    THEN trim(substring(trim(docente) FROM strpos(trim(docente), ' ') + 1))
    ELSE ''
  END
WHERE concursante IS NOT NULL;

ALTER TABLE participantes
  ALTER COLUMN concursante_nombres SET NOT NULL,
  ALTER COLUMN concursante_apellidos SET NOT NULL,
  ALTER COLUMN apoderado_nombres SET NOT NULL,
  ALTER COLUMN apoderado_apellidos SET NOT NULL,
  ALTER COLUMN docente_nombres SET NOT NULL,
  ALTER COLUMN docente_apellidos SET NOT NULL;

ALTER TABLE participantes
  DROP COLUMN IF EXISTS concursante,
  DROP COLUMN IF EXISTS apoderado,
  DROP COLUMN IF EXISTS docente;

DROP INDEX IF EXISTS idx_participantes_concursante_trgm;

CREATE INDEX IF NOT EXISTS idx_participantes_nombre_completo_trgm
  ON participantes USING gin (
    (concursante_nombres || ' ' || concursante_apellidos) gin_trgm_ops
  );
