-- Datos iniciales para desarrollo local (idempotente)

INSERT INTO grados (nombre, nivel) VALUES
  ('1ro', 'primaria'),
  ('2do', 'primaria'),
  ('3ro', 'primaria'),
  ('4to', 'primaria'),
  ('5to', 'primaria'),
  ('6to', 'primaria'),
  ('1ro', 'secundaria'),
  ('2do', 'secundaria'),
  ('3ro', 'secundaria'),
  ('4to', 'secundaria'),
  ('5to', 'secundaria')
ON CONFLICT (nombre, nivel) DO NOTHING;

INSERT INTO retos (nombre_obra, tipo_reto, grado_id)
SELECT v.obra, v.tipo, g.id
FROM (VALUES
  ('Tusuj, un cuy especial', 'Archivo PDF', '1ro', 'primaria'),
  ('La lonchera mentirosa', 'Archivo PDF', '2do', 'primaria'),
  ('Libros revueltos', 'Video', '3ro', 'primaria'),
  ('Tres gallinas contra un pícaro ladrón', 'Archivo PDF', '4to', 'primaria'),
  ('El corazón de Misha', 'Archivo PDF', '5to', 'primaria'),
  ('Comando Espacial 2', 'Video', '6to', 'primaria'),
  ('Yute & Tocuyo, El Salto a las Nubes', 'Archivo PDF', '1ro', 'secundaria'),
  ('La maleta de la libertad', 'Video', '2do', 'secundaria'),
  ('Ocho segundos', 'Video', '3ro', 'secundaria'),
  ('La tía Levita', 'Archivo PDF', '4to', 'secundaria'),
  ('Sol tan lejos', 'Archivo PDF', '5to', 'secundaria')
) AS v(obra, tipo, grado_nombre, grado_nivel)
JOIN grados g ON g.nombre = v.grado_nombre AND g.nivel = v.grado_nivel
ON CONFLICT (nombre_obra, grado_id) DO NOTHING;

INSERT INTO colegios (codigo_colegio, nombre, ubicacion_id)
SELECT v.codigo, v.nombre, u.id
FROM (VALUES
  ('0890123', 'IE San Martín de Porres', '150122'),
  ('0890456', 'Colegio Innovación School', '150131'),
  ('0890789', 'IE María Auxiliadora', '150140'),
  ('0891001', 'Colegio San Agustín', '150122'),
  ('0891002', 'IE Fe y Alegría N° 24', '150131'),
  ('0891003', 'Colegio Británico Peruano', '150140'),
  ('0891004', 'IE José Carlos Mariátegui', '150122'),
  ('0891005', 'Colegio Santa María', '150131'),
  ('0891006', 'IE Juan XXIII', '150140'),
  ('0891007', 'Colegio Alpamayo', '150122')
) AS v(codigo, nombre, ubigeo)
JOIN ubicaciones u ON u.ubigeo = v.ubigeo
ON CONFLICT (codigo_colegio) DO NOTHING;

-- Participantes demo (Ayuda)
INSERT INTO participantes (
  dni_estudiante, concursante, sexo,
  apoderado, dni_apoderado, celular_apoderado, docente, email_docente,
  colegio_id, grado_id
)
SELECT
  '12345678', 'Ana Demo García', 'F',
  'Rosa García', '45678901', '999111222', 'Prof. Carmen López', 'clopez@demo.edu.pe',
  c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '1ro' AND g.nivel = 'primaria'
WHERE c.codigo_colegio = '0890123'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni_estudiante = '12345678');

INSERT INTO trabajos (
  codigo_concurso, codigo_entrega, participante_id, reto_id,
  trabajo_enlace, tipo_archivo, fecha_envio, estado
)
SELECT
  'LQL2026', 'LQL2026-DEMO001', p.id, r.id,
  'local://entregables/demo/rima-tusuj.pdf', 'pdf',
  '2026-05-10T14:32:00Z'::timestamptz, 'finalista'::estado_trabajo
FROM participantes p
JOIN retos r ON r.nombre_obra = 'Tusuj, un cuy especial'
WHERE p.dni_estudiante = '12345678'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);

INSERT INTO participantes (
  dni_estudiante, concursante, sexo,
  apoderado, dni_apoderado, celular_apoderado, docente, email_docente,
  colegio_id, grado_id
)
SELECT
  '87654321', 'Luis Demo Torres', 'M',
  'Pedro Torres', '56789012', '999333444', 'Prof. Ana Ruiz', 'aruiz@demo.edu.pe',
  c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '3ro' AND g.nivel = 'primaria'
WHERE c.codigo_colegio = '0890456'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni_estudiante = '87654321');

INSERT INTO trabajos (
  codigo_concurso, codigo_entrega, participante_id, reto_id,
  trabajo_enlace, tipo_archivo, fecha_envio, estado
)
SELECT
  'LQL2026', 'LQL2026-DEMO002', p.id, r.id,
  'local://entregables/demo/recomendacion-libros.mp4', 'mp4',
  '2026-05-22T09:15:00Z'::timestamptz, 'en_revision'::estado_trabajo
FROM participantes p
JOIN retos r ON r.nombre_obra = 'Libros revueltos'
WHERE p.dni_estudiante = '87654321'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);

INSERT INTO participantes (
  dni_estudiante, concursante, sexo,
  apoderado, dni_apoderado, celular_apoderado, docente, email_docente,
  colegio_id, grado_id
)
SELECT
  '11223344', 'María Demo Quispe', 'F',
  'Juana Quispe', '67890123', '999555666', 'Prof. Luis Vega', 'lvega@demo.edu.pe',
  c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '2do' AND g.nivel = 'primaria'
WHERE c.codigo_colegio = '0890789'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni_estudiante = '11223344');

INSERT INTO trabajos (
  codigo_concurso, codigo_entrega, participante_id, reto_id,
  trabajo_enlace, tipo_archivo, fecha_envio, estado
)
SELECT
  'LQL2026', 'LQL2026-DEMO003', p.id, r.id,
  'local://entregables/demo/carta-borrador.pdf', 'pdf',
  '2026-05-18T11:40:00Z'::timestamptz, 'recibido'::estado_trabajo
FROM participantes p
JOIN retos r ON r.nombre_obra = 'La lonchera mentirosa'
WHERE p.dni_estudiante = '11223344'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);

-- Trabajos demo DEMO004–DEMO030 (27 adicionales; 30 en total con DEMO001–003)
WITH nums AS (
  SELECT n FROM generate_series(4, 30) AS n
),
colegios_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn, COUNT(*) OVER ()::int AS total FROM colegios
),
grados_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn, COUNT(*) OVER ()::int AS total FROM grados
),
prep AS (
  SELECT
    n.n,
    LPAD((90000000 + n.n)::text, 8, '0') AS dni_estudiante,
    'Estudiante Demo ' || LPAD(n.n::text, 2, '0') AS concursante,
    CASE WHEN n.n % 2 = 0 THEN 'M'::sexo ELSE 'F'::sexo END AS sexo,
    'Apoderado Demo ' || LPAD(n.n::text, 2, '0') AS apoderado,
    LPAD((91000000 + n.n)::text, 8, '0') AS dni_apoderado,
    '99' || LPAD((900000 + n.n)::text, 7, '0') AS celular_apoderado,
    'Prof. Docente Demo ' || LPAD(n.n::text, 2, '0') AS docente,
    'docente' || LPAD(n.n::text, 2, '0') || '@demo.edu.pe' AS email_docente,
    'LQL2026-DEMO' || LPAD(n.n::text, 3, '0') AS codigo_entrega,
    cl.id AS colegio_id,
    gl.id AS grado_id,
    (ARRAY['recibido', 'en_revision', 'finalista', 'ganador'])[1 + ((n.n - 4) % 4)] AS estado,
    (
      '2026-05-' || LPAD((1 + ((n.n - 4) % 28))::text, 2, '0')
      || 'T' || LPAD((8 + ((n.n * 3) % 12))::text, 2, '0') || ':00:00Z'
    )::timestamptz AS fecha_envio,
    CASE WHEN n.n % 2 = 0 THEN 'pdf'::tipo_archivo ELSE 'mp4'::tipo_archivo END AS tipo_archivo,
    CASE
      WHEN n.n % 2 = 0 THEN 'local://entregables/demo/carta-borrador.pdf'
      ELSE 'local://entregables/demo/recomendacion-libros.mp4'
    END AS trabajo_enlace,
    (n.n % 5 = 0) AS permite_reenvio
  FROM nums n
  JOIN colegios_list cl ON cl.rn = 1 + ((n.n - 4) % cl.total)
  JOIN grados_list gl ON gl.rn = 1 + ((n.n - 4) % gl.total)
),
prep_reto AS (
  SELECT p.*, r.id AS reto_id
  FROM prep p
  JOIN retos r ON r.grado_id = p.grado_id
)
INSERT INTO participantes (
  dni_estudiante, concursante, sexo,
  apoderado, dni_apoderado, celular_apoderado, docente, email_docente,
  colegio_id, grado_id
)
SELECT
  dni_estudiante, concursante, sexo,
  apoderado, dni_apoderado, celular_apoderado, docente, email_docente,
  colegio_id, grado_id
FROM prep_reto pr
WHERE NOT EXISTS (
  SELECT 1 FROM participantes p WHERE p.dni_estudiante = pr.dni_estudiante
);

WITH nums AS (
  SELECT n FROM generate_series(4, 30) AS n
),
colegios_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn, COUNT(*) OVER ()::int AS total FROM colegios
),
grados_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn, COUNT(*) OVER ()::int AS total FROM grados
),
prep AS (
  SELECT
    n.n,
    LPAD((90000000 + n.n)::text, 8, '0') AS dni_estudiante,
    'LQL2026-DEMO' || LPAD(n.n::text, 3, '0') AS codigo_entrega,
    cl.id AS colegio_id,
    gl.id AS grado_id,
    (ARRAY['recibido', 'en_revision', 'finalista', 'ganador'])[1 + ((n.n - 4) % 4)] AS estado,
    (
      '2026-05-' || LPAD((1 + ((n.n - 4) % 28))::text, 2, '0')
      || 'T' || LPAD((8 + ((n.n * 3) % 12))::text, 2, '0') || ':00:00Z'
    )::timestamptz AS fecha_envio,
    CASE WHEN n.n % 2 = 0 THEN 'pdf'::tipo_archivo ELSE 'mp4'::tipo_archivo END AS tipo_archivo,
    CASE
      WHEN n.n % 2 = 0 THEN 'local://entregables/demo/carta-borrador.pdf'
      ELSE 'local://entregables/demo/recomendacion-libros.mp4'
    END AS trabajo_enlace,
    (n.n % 5 = 0) AS permite_reenvio
  FROM nums n
  JOIN colegios_list cl ON cl.rn = 1 + ((n.n - 4) % cl.total)
  JOIN grados_list gl ON gl.rn = 1 + ((n.n - 4) % gl.total)
),
prep_reto AS (
  SELECT p.*, r.id AS reto_id
  FROM prep p
  JOIN retos r ON r.grado_id = p.grado_id
)
INSERT INTO trabajos (
  codigo_concurso, codigo_entrega, participante_id, reto_id,
  trabajo_enlace, tipo_archivo, fecha_envio, estado, permite_reenvio
)
SELECT
  'LQL2026',
  pr.codigo_entrega,
  p.id,
  pr.reto_id,
  pr.trabajo_enlace,
  pr.tipo_archivo,
  pr.fecha_envio,
  pr.estado::estado_trabajo,
  pr.permite_reenvio
FROM prep_reto pr
JOIN participantes p ON p.dni_estudiante = pr.dni_estudiante
WHERE NOT EXISTS (
  SELECT 1 FROM trabajos t WHERE t.codigo_entrega = pr.codigo_entrega
);

-- Usuarios internos demo (admin123 / jurado123)
INSERT INTO usuarios_internos (nombre, email, password_hash, rol) VALUES
  (
    'Admin Demo',
    'admin@loqueleo.test',
    '$2b$10$cP1G/TW7HXC9oVRk0ZMqO.k/OO.A20gKwT9ginVFwNNeDMxhLAapO',
    'admin'::rol_usuario
  ),
  (
    'Jurado Demo',
    'jurado@loqueleo.test',
    '$2b$10$lxpbgr2kwaodTM/7s3EQCeX/Qq7VSXzv8dCjWh3sletx2kB.v3uXS',
    'jurado'::rol_usuario
  ),
  (
    'María Jurado',
    'jurado2@loqueleo.test',
    '$2b$10$lxpbgr2kwaodTM/7s3EQCeX/Qq7VSXzv8dCjWh3sletx2kB.v3uXS',
    'jurado'::rol_usuario
  )
ON CONFLICT (email) DO NOTHING;

-- Evaluación demo de otro jurado (visible al abrir modal como jurado@)
INSERT INTO evaluaciones (trabajo_id, jurado_id, puntaje, comentarios, es_destacado, fecha_evaluacion)
SELECT t.id, u.id, 88, 'Buena interpretación del personaje. La rima fluye con naturalidad; revisar la última estrofa por ritmo.', TRUE, '2026-05-25T16:20:00Z'::timestamptz
FROM trabajos t
JOIN usuarios_internos u ON u.email = 'jurado2@loqueleo.test'
WHERE t.codigo_entrega = 'LQL2026-DEMO001'
ON CONFLICT (trabajo_id, jurado_id) DO NOTHING;

INSERT INTO evaluaciones (trabajo_id, jurado_id, puntaje, comentarios, es_destacado, fecha_evaluacion)
SELECT t.id, u.id, 72, 'Video claro y bien editado. Falta profundizar en la recomendación del segundo libro.', FALSE, '2026-05-26T10:05:00Z'::timestamptz
FROM trabajos t
JOIN usuarios_internos u ON u.email = 'jurado2@loqueleo.test'
WHERE t.codigo_entrega = 'LQL2026-DEMO002'
ON CONFLICT (trabajo_id, jurado_id) DO NOTHING;

