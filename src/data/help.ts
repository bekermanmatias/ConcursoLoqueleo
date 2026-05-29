export interface HelpScenario {
  id: string;
  text: string;
  accent: string;
  suffix?: string;
}

export const helpSectionTitle = "Ayuda";

export const helpSectionSubtitle =
  "Si ya mandaste tu trabajo, aquí puedes ver cómo va, bajar otra vez tu constancia o subir uno nuevo si te pidieron corregirlo.";

export const helpIntroLead =
  "Busca con el DNI con el que te inscribiste.";

export const helpConsultTitle = "Consultar mi participación";

export const helpConsultDescription =
  "Escribe tu DNI para ver tu entrega, tu constancia o subir un archivo corregido.";

export const helpConsultPath = "/ayuda/consultar";

export const helpScenarios: HelpScenario[] = [
  {
    id: "estado",
    text: "Ya envié mi trabajo y quiero saber el ",
    accent: "estado",
  },
  {
    id: "constancia",
    text: "Quiero ",
    accent: "reimprimir mi constancia",
    suffix: " de participación",
  },
  {
    id: "corregir",
    text: "Me dijeron que debo ",
    accent: "corregir mi archivo",
    suffix: " y volver a subirlo",
  },
];

export const helpDemoNote =
  "Prueba con DNI 12345678, 87654321 o 11223344 (este último permite corregir el archivo).";
