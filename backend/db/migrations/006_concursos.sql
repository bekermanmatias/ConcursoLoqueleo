CREATE TABLE IF NOT EXISTS concursos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(32) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  anio INT NOT NULL,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  inscripciones_abiertas BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_concursos_un_activo
  ON concursos (activo) WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_trabajos_codigo_concurso
  ON trabajos (codigo_concurso);

INSERT INTO concursos (codigo, nombre, anio, fecha_inicio, fecha_fin, inscripciones_abiertas, activo)
VALUES
  (
    'LQL2026',
    'Soy Loqueleo 2026',
    2026,
    '2026-01-01T05:00:00Z',
    '2026-08-31T23:59:59Z',
    TRUE,
    TRUE
  ),
  (
    'LQL2025',
    'Soy Loqueleo 2025',
    2025,
    '2025-01-01T05:00:00Z',
    '2025-08-31T23:59:59Z',
    FALSE,
    FALSE
  )
ON CONFLICT (codigo) DO NOTHING;
