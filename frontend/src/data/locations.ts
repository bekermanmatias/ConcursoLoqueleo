export const departamentos = ["Lima", "Arequipa", "Cusco", "La Libertad", "Piura"];

export const ciudadesPorDepartamento: Record<string, string[]> = {
  Lima: ["Lima", "Huacho", "Cañete"],
  Arequipa: ["Arequipa", "Camaná"],
  Cusco: ["Cusco", "Sicuani"],
  "La Libertad": ["Trujillo", "Chepén"],
  Piura: ["Piura", "Sullana"],
};

export const distritosPorCiudad: Record<string, string[]> = {
  Lima: ["Miraflores", "San Isidro", "Surco", "Comas", "San Juan de Lurigancho"],
  Huacho: ["Huacho", "Huaura"],
  Cañete: ["San Vicente de Cañete", "Asia"],
  Arequipa: ["Cercado", "Cayma", "Yanahuara"],
  Camaná: ["Camaná"],
  Cusco: ["Cusco", "San Sebastián", "Wanchaq"],
  Sicuani: ["Sicuani"],
  Trujillo: ["Trujillo", "La Esperanza", "El Porvenir"],
  Chepén: ["Chepén"],
  Piura: ["Piura", "Castilla"],
  Sullana: ["Sullana"],
};

export const colegiosMock = [
  "IE San Martín de Porres",
  "Colegio Innovación School",
  "IE María Auxiliadora",
  "Colegio San Agustín",
  "IE Fe y Alegría N° 24",
  "Colegio Británico Peruano",
  "IE José Carlos Mariátegui",
  "Colegio Santa María",
  "IE Juan XXIII",
  "Colegio Alpamayo",
];

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

/** DNI ya registrados (demo) */
export const dniRegistrados = new Set(["12345678", "87654321"]);
