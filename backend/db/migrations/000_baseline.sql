-- Esquema base idempotente (estado actual del modelo).
-- No usar DROP: las migraciones incrementales aplican cambios posteriores.

DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'jurado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_archivo AS ENUM ('pdf', 'mp4', 'imagen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_trabajo AS ENUM ('recibido', 'en_revision', 'finalista', 'ganador');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sexo AS ENUM ('M', 'F');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS usuarios_internos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL
);

CREATE TABLE IF NOT EXISTS departamentos (
  id INT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ubigeo VARCHAR(2) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS provincias (
  id INT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ubigeo VARCHAR(4) NOT NULL UNIQUE,
  departamento_id INT NOT NULL REFERENCES departamentos (id)
);

CREATE INDEX IF NOT EXISTS idx_provincias_departamento ON provincias (departamento_id);

CREATE TABLE IF NOT EXISTS distritos (
  id INT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ubigeo VARCHAR(6) NOT NULL UNIQUE,
  provincia_id INT NOT NULL REFERENCES provincias (id),
  departamento_id INT NOT NULL REFERENCES departamentos (id)
);

CREATE INDEX IF NOT EXISTS idx_distritos_provincia ON distritos (provincia_id);
CREATE INDEX IF NOT EXISTS idx_distritos_departamento ON distritos (departamento_id);

CREATE TABLE IF NOT EXISTS ubicaciones (
  id SERIAL PRIMARY KEY,
  departamento VARCHAR(255) NOT NULL,
  provincia VARCHAR(255) NOT NULL,
  distrito VARCHAR(255) NOT NULL,
  ubigeo VARCHAR(6) UNIQUE,
  UNIQUE (departamento, provincia, distrito)
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_ubigeo ON ubicaciones (ubigeo);

CREATE TABLE IF NOT EXISTS colegios (
  id SERIAL PRIMARY KEY,
  codigo_colegio VARCHAR(32) UNIQUE NOT NULL,
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
  nombre_obra VARCHAR(255) NOT NULL,
  tipo_reto VARCHAR(64) NOT NULL,
  grado_id INT NOT NULL REFERENCES grados (id),
  UNIQUE (nombre_obra, grado_id)
);

CREATE INDEX IF NOT EXISTS idx_retos_grado ON retos (grado_id);

CREATE TABLE IF NOT EXISTS participantes (
  id SERIAL PRIMARY KEY,
  dni_estudiante VARCHAR(8) UNIQUE NOT NULL,
  concursante VARCHAR(255) NOT NULL,
  sexo sexo NOT NULL,
  apoderado VARCHAR(255) NOT NULL,
  dni_apoderado VARCHAR(8) NOT NULL,
  celular_apoderado VARCHAR(32) NOT NULL,
  docente VARCHAR(255) NOT NULL,
  email_docente VARCHAR(255) NOT NULL,
  colegio_id INT NOT NULL REFERENCES colegios (id),
  grado_id INT NOT NULL REFERENCES grados (id)
);

CREATE INDEX IF NOT EXISTS idx_participantes_dni ON participantes (dni_estudiante);

CREATE TABLE IF NOT EXISTS trabajos (
  id SERIAL PRIMARY KEY,
  codigo_concurso VARCHAR(32) NOT NULL,
  codigo_entrega VARCHAR(64) UNIQUE NOT NULL,
  tipo_codigo VARCHAR(32) NOT NULL DEFAULT 'Real-A',
  participante_id INT UNIQUE NOT NULL REFERENCES participantes (id),
  reto_id INT NOT NULL REFERENCES retos (id),
  trabajo_enlace VARCHAR(2048) NOT NULL,
  forma_entrega VARCHAR(32) NOT NULL DEFAULT 'Digital',
  tipo_archivo tipo_archivo NOT NULL,
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado estado_trabajo NOT NULL DEFAULT 'recibido',
  permite_reenvio BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_trabajos_reto ON trabajos (reto_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos (estado);
CREATE INDEX IF NOT EXISTS idx_trabajos_codigo_entrega ON trabajos (codigo_entrega);

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluaciones_trabajo_jurado
  ON evaluaciones (trabajo_id, jurado_id);
