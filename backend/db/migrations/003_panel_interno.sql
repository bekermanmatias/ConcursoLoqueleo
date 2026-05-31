ALTER TABLE trabajos
  ADD COLUMN IF NOT EXISTS permite_reenvio BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluaciones_trabajo_jurado
  ON evaluaciones (trabajo_id, jurado_id);
