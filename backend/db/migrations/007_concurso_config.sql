ALTER TABLE concursos
  ADD COLUMN IF NOT EXISTS terminos_pdf VARCHAR(512);

CREATE TABLE IF NOT EXISTS concurso_obras (
  id SERIAL PRIMARY KEY,
  concurso_id INT NOT NULL REFERENCES concursos (id) ON DELETE CASCADE,
  grado_id INT NOT NULL REFERENCES grados (id),
  nombre_obra VARCHAR(255) NOT NULL,
  tipo_reto VARCHAR(64) NOT NULL,
  cover_url VARCHAR(512),
  bases_pdf VARCHAR(512),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (concurso_id, grado_id)
);

CREATE INDEX IF NOT EXISTS idx_concurso_obras_concurso
  ON concurso_obras (concurso_id);

-- Obras de la edición 2026 (desde retos actuales + assets del sitio)
INSERT INTO concurso_obras (concurso_id, grado_id, nombre_obra, tipo_reto, cover_url, bases_pdf, activo)
SELECT c.id, r.grado_id, r.nombre_obra, r.tipo_reto, v.cover, v.bases, TRUE
FROM concursos c
JOIN retos r ON TRUE
JOIN grados g ON g.id = r.grado_id
JOIN LATERAL (
  SELECT
    CASE r.nombre_obra
      WHEN 'Tusuj, un cuy especial' THEN '/libro/1.png'
      WHEN 'La lonchera mentirosa' THEN '/libro/2.png'
      WHEN 'Libros revueltos' THEN '/libro/3.png'
      WHEN 'Tres gallinas contra un pícaro ladrón' THEN '/libro/4.png'
      WHEN 'El corazón de Misha' THEN '/libro/5.png'
      WHEN 'Comando Espacial 2' THEN '/libro/6.png'
      WHEN 'Yute & Tocuyo, El Salto a las Nubes' THEN '/libro/7.png'
      WHEN 'La maleta de la libertad' THEN '/libro/8.png'
      WHEN 'Ocho segundos' THEN '/libro/9.png'
      WHEN 'La tía Levita' THEN '/libro/10.png'
      WHEN 'Sol tan lejos' THEN '/libro/11.png'
      ELSE NULL
    END AS cover,
    CASE r.nombre_obra
      WHEN 'Tusuj, un cuy especial' THEN '/pdf/Bases LQL2026 Tusuj.pdf'
      WHEN 'La lonchera mentirosa' THEN '/pdf/Bases LQL2026 Lonchera.pdf'
      WHEN 'Libros revueltos' THEN '/pdf/Bases LQL2026 Libros revueltos.pdf'
      WHEN 'Tres gallinas contra un pícaro ladrón' THEN '/pdf/Bases LQL2026 Tres gallinas.pdf'
      WHEN 'El corazón de Misha' THEN '/pdf/Bases LQL2026 Misha.pdf'
      WHEN 'Comando Espacial 2' THEN '/pdf/Bases LQL2026 Comando.pdf'
      WHEN 'Yute & Tocuyo, El Salto a las Nubes' THEN '/pdf/Bases LQL2026 Yute.pdf'
      WHEN 'La maleta de la libertad' THEN '/pdf/Bases LQL2026 Maleta.pdf'
      WHEN 'Ocho segundos' THEN '/pdf/Bases LQL2026 Ocho segundos.pdf'
      WHEN 'La tía Levita' THEN '/pdf/Bases LQL2026 Tia Levita.pdf'
      WHEN 'Sol tan lejos' THEN '/pdf/Bases LQL2026 Sol tan lejos.pdf'
      ELSE NULL
    END AS bases
) AS v ON TRUE
WHERE c.codigo = 'LQL2026'
ON CONFLICT (concurso_id, grado_id) DO NOTHING;

UPDATE concursos
SET terminos_pdf = '/pdf/2025_TERMINOS-Y-CONDICIONES-CONCURSO-SOY-LOQUELEO-DIGITAL.pdf'
WHERE codigo = 'LQL2026' AND terminos_pdf IS NULL;
