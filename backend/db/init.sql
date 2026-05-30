-- Esquema Concurso Loqueleo 2026 (dbdiagram)
-- Limpieza de tabla legacy de desarrollo anterior
DROP TABLE IF EXISTS participations CASCADE;

-- ==========================================
-- ENUMS
-- ==========================================

DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'jurado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_archivo AS ENUM ('pdf', 'mp4', 'imagen');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_trabajo AS ENUM ('recibido', 'en_revision', 'finalista', 'ganador');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- TABLAS DE GESTIÓN INTERNA
-- ==========================================

CREATE TABLE IF NOT EXISTS usuarios_internos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL
);

-- ==========================================
-- TABLAS DE CONTEXTO Y CONCURSO
-- ==========================================

CREATE TABLE IF NOT EXISTS ubicaciones (
  id SERIAL PRIMARY KEY,
  departamento VARCHAR(255) NOT NULL,
  ciudad VARCHAR(255) NOT NULL,
  distrito VARCHAR(255) NOT NULL,
  UNIQUE (departamento, ciudad, distrito)
);

CREATE TABLE IF NOT EXISTS colegios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ubicacion_id INT NOT NULL REFERENCES ubicaciones (id)
);

CREATE INDEX IF NOT EXISTS idx_colegios_ubicacion ON colegios (ubicacion_id);

CREATE TABLE IF NOT EXISTS grados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(64) NOT NULL,
  nivel VARCHAR(64) NOT NULL,
  UNIQUE (nombre, nivel)
);

CREATE TABLE IF NOT EXISTS retos (
  id SERIAL PRIMARY KEY,
  titulo_libro VARCHAR(255) NOT NULL,
  tipo_entregable VARCHAR(64) NOT NULL,
  grado_id INT NOT NULL REFERENCES grados (id),
  UNIQUE (titulo_libro, grado_id)
);

CREATE INDEX IF NOT EXISTS idx_retos_grado ON retos (grado_id);

-- ==========================================
-- TABLAS DE FLUJO DE USUARIO (ALUMNOS)
-- ==========================================

CREATE TABLE IF NOT EXISTS participantes (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(8) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  edad INT NOT NULL,
  colegio_id INT NOT NULL REFERENCES colegios (id),
  grado_id INT NOT NULL REFERENCES grados (id)
);

CREATE INDEX IF NOT EXISTS idx_participantes_dni ON participantes (dni);

CREATE TABLE IF NOT EXISTS trabajos (
  id SERIAL PRIMARY KEY,
  participante_id INT UNIQUE NOT NULL REFERENCES participantes (id),
  reto_id INT NOT NULL REFERENCES retos (id),
  archivo_url VARCHAR(2048) NOT NULL,
  tipo_archivo tipo_archivo NOT NULL,
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado estado_trabajo NOT NULL DEFAULT 'recibido'
);

CREATE INDEX IF NOT EXISTS idx_trabajos_reto ON trabajos (reto_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos (estado);

-- ==========================================
-- TABLAS DE EVALUACIÓN (JURADO)
-- ==========================================

CREATE TABLE IF NOT EXISTS evaluaciones (
  id SERIAL PRIMARY KEY,
  trabajo_id INT NOT NULL REFERENCES trabajos (id),
  jurado_id INT NOT NULL REFERENCES usuarios_internos (id),
  es_destacado BOOLEAN NOT NULL DEFAULT FALSE,
  puntaje INT,
  comentarios TEXT,
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_trabajo ON evaluaciones (trabajo_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_jurado ON evaluaciones (jurado_id);
