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

INSERT INTO ubicaciones (departamento, provincia, distrito) VALUES
  ('Lima', 'Lima', 'Miraflores'),
  ('Lima', 'Lima', 'San Isidro'),
  ('Lima', 'Lima', 'Surco')
ON CONFLICT (departamento, provincia, distrito) DO NOTHING;

INSERT INTO colegios (codigo_colegio, nombre, ubicacion_id)
SELECT v.codigo, v.nombre, u.id
FROM (VALUES
  ('0890123', 'IE San Martín de Porres', 'Lima', 'Lima', 'Miraflores'),
  ('0890456', 'Colegio Innovación School', 'Lima', 'Lima', 'San Isidro'),
  ('0890789', 'IE María Auxiliadora', 'Lima', 'Lima', 'Surco'),
  ('0891001', 'Colegio San Agustín', 'Lima', 'Lima', 'Miraflores'),
  ('0891002', 'IE Fe y Alegría N° 24', 'Lima', 'Lima', 'San Isidro'),
  ('0891003', 'Colegio Británico Peruano', 'Lima', 'Lima', 'Surco'),
  ('0891004', 'IE José Carlos Mariátegui', 'Lima', 'Lima', 'Miraflores'),
  ('0891005', 'Colegio Santa María', 'Lima', 'Lima', 'San Isidro'),
  ('0891006', 'IE Juan XXIII', 'Lima', 'Lima', 'Surco'),
  ('0891007', 'Colegio Alpamayo', 'Lima', 'Lima', 'Miraflores')
) AS v(codigo, nombre, departamento, provincia, distrito)
JOIN ubicaciones u
  ON u.departamento = v.departamento
 AND u.provincia = v.provincia
 AND u.distrito = v.distrito
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
