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

INSERT INTO retos (titulo_libro, tipo_entregable, grado_id)
SELECT v.titulo, v.tipo, g.id
FROM (VALUES
  ('Tusuj, un cuy especial', 'pdf', '1ro', 'primaria'),
  ('La lonchera mentirosa', 'pdf', '2do', 'primaria'),
  ('Libros revueltos', 'video', '3ro', 'primaria'),
  ('Tres gallinas contra un pícaro ladrón', 'pdf', '4to', 'primaria'),
  ('El corazón de Misha', 'pdf', '5to', 'primaria'),
  ('Comando Espacial 2', 'video', '6to', 'primaria'),
  ('Yute & Tocuyo, El Salto a las Nubes', 'pdf', '1ro', 'secundaria'),
  ('La maleta de la libertad', 'video', '2do', 'secundaria'),
  ('Ocho segundos', 'video', '3ro', 'secundaria'),
  ('La tía Levita', 'pdf', '4to', 'secundaria'),
  ('Sol tan lejos', 'pdf', '5to', 'secundaria')
) AS v(titulo, tipo, grado_nombre, grado_nivel)
JOIN grados g ON g.nombre = v.grado_nombre AND g.nivel = v.grado_nivel
ON CONFLICT (titulo_libro, grado_id) DO NOTHING;

INSERT INTO ubicaciones (departamento, ciudad, distrito) VALUES
  ('Lima', 'Lima', 'Miraflores'),
  ('Lima', 'Lima', 'San Isidro'),
  ('Lima', 'Lima', 'Surco')
ON CONFLICT (departamento, ciudad, distrito) DO NOTHING;

INSERT INTO colegios (nombre, ubicacion_id)
SELECT v.nombre, u.id
FROM (VALUES
  ('IE San Martín de Porres', 'Lima', 'Lima', 'Miraflores'),
  ('Colegio Innovación School', 'Lima', 'Lima', 'San Isidro'),
  ('IE María Auxiliadora', 'Lima', 'Lima', 'Surco'),
  ('Colegio San Agustín', 'Lima', 'Lima', 'Miraflores'),
  ('IE Fe y Alegría N° 24', 'Lima', 'Lima', 'San Isidro'),
  ('Colegio Británico Peruano', 'Lima', 'Lima', 'Surco'),
  ('IE José Carlos Mariátegui', 'Lima', 'Lima', 'Miraflores'),
  ('Colegio Santa María', 'Lima', 'Lima', 'San Isidro'),
  ('IE Juan XXIII', 'Lima', 'Lima', 'Surco'),
  ('Colegio Alpamayo', 'Lima', 'Lima', 'Miraflores')
) AS v(nombre, departamento, ciudad, distrito)
JOIN ubicaciones u
  ON u.departamento = v.departamento
 AND u.ciudad = v.ciudad
 AND u.distrito = v.distrito
WHERE NOT EXISTS (
  SELECT 1 FROM colegios c
  WHERE c.nombre = v.nombre AND c.ubicacion_id = u.id
);

-- Participantes y trabajos de demo (Ayuda / consulta)
INSERT INTO participantes (dni, nombre_completo, edad, colegio_id, grado_id)
SELECT '12345678', 'Ana Demo', 7, c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '1ro' AND g.nivel = 'primaria'
WHERE c.nombre = 'IE San Martín de Porres'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni = '12345678');

INSERT INTO trabajos (participante_id, reto_id, archivo_url, tipo_archivo, fecha_envio, estado)
SELECT p.id, r.id,
  'local://entregables/demo/rima-tusuj.pdf', 'pdf',
  '2026-05-10T14:32:00Z'::timestamptz, 'finalista'::estado_trabajo
FROM participantes p
JOIN retos r ON r.titulo_libro = 'Tusuj, un cuy especial'
WHERE p.dni = '12345678'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);

INSERT INTO participantes (dni, nombre_completo, edad, colegio_id, grado_id)
SELECT '87654321', 'Luis Demo', 9, c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '3ro' AND g.nivel = 'primaria'
WHERE c.nombre = 'Colegio Innovación School'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni = '87654321');

INSERT INTO trabajos (participante_id, reto_id, archivo_url, tipo_archivo, fecha_envio, estado)
SELECT p.id, r.id,
  'local://entregables/demo/recomendacion-libros.mp4', 'mp4',
  '2026-05-22T09:15:00Z'::timestamptz, 'en_revision'::estado_trabajo
FROM participantes p
JOIN retos r ON r.titulo_libro = 'Libros revueltos'
WHERE p.dni = '87654321'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);

INSERT INTO participantes (dni, nombre_completo, edad, colegio_id, grado_id)
SELECT '11223344', 'María Demo', 8, c.id, g.id
FROM colegios c
JOIN grados g ON g.nombre = '2do' AND g.nivel = 'primaria'
WHERE c.nombre = 'IE María Auxiliadora'
  AND NOT EXISTS (SELECT 1 FROM participantes p WHERE p.dni = '11223344');

INSERT INTO trabajos (participante_id, reto_id, archivo_url, tipo_archivo, fecha_envio, estado)
SELECT p.id, r.id,
  'local://entregables/demo/carta-borrador.pdf', 'pdf',
  '2026-05-18T11:40:00Z'::timestamptz, 'recibido'::estado_trabajo
FROM participantes p
JOIN retos r ON r.titulo_libro = 'La lonchera mentirosa'
WHERE p.dni = '11223344'
  AND NOT EXISTS (SELECT 1 FROM trabajos t WHERE t.participante_id = p.id);
