-- Esquema Concurso Loqueleo 2026 (dbdiagram v2)
-- Recrear tablas en desarrollo (docker compose down -v si ya existía el esquema anterior)

DROP TABLE IF EXISTS evaluaciones CASCADE;
DROP TABLE IF EXISTS trabajos CASCADE;
DROP TABLE IF EXISTS participantes CASCADE;
DROP TABLE IF EXISTS retos CASCADE;
DROP TABLE IF EXISTS grados CASCADE;
DROP TABLE IF EXISTS colegios CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;
DROP TABLE IF EXISTS usuarios_internos CASCADE;
DROP TABLE IF EXISTS participations CASCADE;

DROP TYPE IF EXISTS sexo CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;
DROP TYPE IF EXISTS tipo_archivo CASCADE;
DROP TYPE IF EXISTS estado_trabajo CASCADE;

CREATE TYPE rol_usuario AS ENUM ('admin', 'jurado');
CREATE TYPE tipo_archivo AS ENUM ('pdf', 'mp4', 'imagen');
CREATE TYPE estado_trabajo AS ENUM ('recibido', 'en_revision', 'finalista', 'ganador');
CREATE TYPE sexo AS ENUM ('M', 'F');

CREATE TABLE usuarios_internos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL
);

CREATE TABLE ubicaciones (
  id SERIAL PRIMARY KEY,
  departamento VARCHAR(255) NOT NULL,
  provincia VARCHAR(255) NOT NULL,
  distrito VARCHAR(255) NOT NULL,
  UNIQUE (departamento, provincia, distrito)
);

CREATE TABLE colegios (
  id SERIAL PRIMARY KEY,
  codigo_colegio VARCHAR(32) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  ubicacion_id INT NOT NULL REFERENCES ubicaciones (id)
);

CREATE INDEX idx_colegios_ubicacion ON colegios (ubicacion_id);

CREATE TABLE grados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(64) NOT NULL,
  nivel VARCHAR(64) NOT NULL,
  UNIQUE (nombre, nivel)
);

CREATE TABLE retos (
  id SERIAL PRIMARY KEY,
  nombre_obra VARCHAR(255) NOT NULL,
  tipo_reto VARCHAR(64) NOT NULL,
  grado_id INT NOT NULL REFERENCES grados (id),
  UNIQUE (nombre_obra, grado_id)
);

CREATE INDEX idx_retos_grado ON retos (grado_id);

CREATE TABLE participantes (
  id SERIAL PRIMARY KEY,
  dni_estudiante VARCHAR(8) UNIQUE NOT NULL,
  concursante VARCHAR(255) NOT NULL,
  sexo sexo NOT NULL,
  edad INT NOT NULL,
  apoderado VARCHAR(255) NOT NULL,
  dni_apoderado VARCHAR(8) NOT NULL,
  telefono_apoderado VARCHAR(32),
  celular_apoderado VARCHAR(32) NOT NULL,
  docente VARCHAR(255) NOT NULL,
  email_docente VARCHAR(255) NOT NULL,
  colegio_id INT NOT NULL REFERENCES colegios (id),
  grado_id INT NOT NULL REFERENCES grados (id)
);

CREATE INDEX idx_participantes_dni ON participantes (dni_estudiante);

CREATE TABLE trabajos (
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
  estado estado_trabajo NOT NULL DEFAULT 'recibido'
);

CREATE INDEX idx_trabajos_reto ON trabajos (reto_id);
CREATE INDEX idx_trabajos_estado ON trabajos (estado);
CREATE INDEX idx_trabajos_codigo_entrega ON trabajos (codigo_entrega);

CREATE TABLE evaluaciones (
  id SERIAL PRIMARY KEY,
  trabajo_id INT NOT NULL REFERENCES trabajos (id),
  jurado_id INT NOT NULL REFERENCES usuarios_internos (id),
  es_destacado BOOLEAN NOT NULL DEFAULT FALSE,
  puntaje INT,
  comentarios TEXT,
  fecha_evaluacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evaluaciones_trabajo ON evaluaciones (trabajo_id);
CREATE INDEX idx_evaluaciones_jurado ON evaluaciones (jurado_id);
