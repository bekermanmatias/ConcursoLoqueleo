export const colegiosMock = [
  { codigo: "0890123", nombre: "IE San Martín de Porres" },
  { codigo: "0890456", nombre: "Colegio Innovación School" },
  { codigo: "0890789", nombre: "IE María Auxiliadora" },
  { codigo: "0891001", nombre: "Colegio San Agustín" },
  { codigo: "0891002", nombre: "IE Fe y Alegría N° 24" },
  { codigo: "0891003", nombre: "Colegio Británico Peruano" },
  { codigo: "0891004", nombre: "IE José Carlos Mariátegui" },
  { codigo: "0891005", nombre: "Colegio Santa María" },
  { codigo: "0891006", nombre: "IE Juan XXIII" },
  { codigo: "0891007", nombre: "Colegio Alpamayo" },
] as const;

export type ColegioMock = (typeof colegiosMock)[number];

export const colegiosNombres = colegiosMock.map((c) => c.nombre);

export const grados = [
  "1ro primaria",
  "2do primaria",
  "3ro primaria",
  "4to primaria",
  "5to primaria",
  "6to primaria",
  "1ro secundaria",
  "2do secundaria",
  "3ro secundaria",
  "4to secundaria",
  "5to secundaria",
] as const;

export type Grado = (typeof grados)[number];

export type Sexo = "M" | "F";

/** DNI ya registrados (demo) */
export const dniRegistrados = new Set(["12345678", "87654321"]);
