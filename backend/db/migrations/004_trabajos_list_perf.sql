-- Rendimiento del listado de trabajos (filtros + paginación, ~10k filas)

CREATE INDEX IF NOT EXISTS idx_trabajos_fecha_envio ON trabajos (fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado_fecha ON trabajos (estado, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_trabajos_tipo_archivo ON trabajos (tipo_archivo);
CREATE INDEX IF NOT EXISTS idx_participantes_colegio ON participantes (colegio_id);
CREATE INDEX IF NOT EXISTS idx_participantes_grado ON participantes (grado_id);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_departamento ON ubicaciones (departamento);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_provincia ON ubicaciones (provincia);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_distrito ON ubicaciones (distrito);

-- Búsqueda ILIKE (%texto%) en panel interno
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_participantes_concursante_trgm
  ON participantes USING gin (concursante gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_participantes_dni_trgm
  ON participantes USING gin (dni_estudiante gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_trabajos_codigo_entrega_trgm
  ON trabajos USING gin (codigo_entrega gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_colegios_nombre_trgm
  ON colegios USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_retos_nombre_obra_trgm
  ON retos USING gin (nombre_obra gin_trgm_ops);
