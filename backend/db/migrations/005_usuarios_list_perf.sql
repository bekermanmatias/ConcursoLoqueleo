-- Listado paginado de usuarios internos

CREATE INDEX IF NOT EXISTS idx_usuarios_internos_rol ON usuarios_internos (rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_nombre ON usuarios_internos (nombre);

CREATE INDEX IF NOT EXISTS idx_usuarios_internos_nombre_trgm
  ON usuarios_internos USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_usuarios_internos_email_trgm
  ON usuarios_internos USING gin (email gin_trgm_ops);
