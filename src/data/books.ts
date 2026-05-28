export type AgeKey = "todo" | "+6" | "+8" | "+10" | "+12" | "+14";

export interface AgeFilterItem {
  key: AgeKey;
  label: string;
  ring: string;
}

export const ageFilters: AgeFilterItem[] = [
  { key: "todo", label: "Todo",  ring: "var(--color-age-todo)" },
  { key: "+6",   label: "+6",    ring: "var(--color-age-6)"    },
  { key: "+8",   label: "+8",    ring: "var(--color-age-8)"    },
  { key: "+10",  label: "+10",   ring: "var(--color-age-10)"   },
  { key: "+12",  label: "+12",   ring: "var(--color-age-12)"   },
  { key: "+14",  label: "+14",   ring: "var(--color-age-14)"   },
];

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  role: string;
  age: Exclude<AgeKey, "todo">;
}

/** Color de acento por edad (borde, badge y botón) */
export const ageUiStyles: Record<Exclude<AgeKey, "todo">, { accent: string }> = {
  "+6":  { accent: "#dfcc56" },
  "+8":  { accent: "#7369a9" },
  "+10": { accent: "#dfa24d" },
  "+12": { accent: "#258ad1" },
  "+14": { accent: "#db3f52" },
};

/** Portadas en /public/libro/ (1.png … 11.png, mismo orden que este listado) */
export const books: Book[] = [
  // +6
  {
    id: "tusuj-6",
    title: "Tusuj, un cuy especial",
    author: "Andrea Paz / Claudia Paz",
    cover: "/libro/1.png",
    role: "Soy un(a) compositor(a).",
    age: "+6",
  },
  {
    id: "lonchera-6",
    title: "La lonchera mentirosa",
    author: "Jorge Eslava",
    cover: "/libro/2.png",
    role: "Soy un(a) amigo(a).",
    age: "+6",
  },
  // +8
  {
    id: "revueltos-8",
    title: "Libros revueltos",
    author: "Lorenzo Helguero",
    cover: "/libro/3.png",
    role: "Soy un(a) lector(a).",
    age: "+8",
  },
  {
    id: "gallinas-8",
    title: "Tres gallinas contra un pícaro ladrón",
    author: "Vicky Canales",
    cover: "/libro/4.png",
    role: "Soy un(a) reportero(a).",
    age: "+8",
  },
  // +10
  {
    id: "corazon-misha-10",
    title: "El corazón de Misha",
    author: "Jorge Eslava",
    cover: "/libro/5.png",
    role: "Soy un(a) propagandista.",
    age: "+10",
  },
  {
    id: "comando-espacial-10",
    title: "Comando Espacial 2",
    author: "Iván Bolaños Gamero",
    cover: "/libro/6.png",
    role: "Soy un(a) inventor(a).",
    age: "+10",
  },
  // +12
  {
    id: "yute-tocuyo-12",
    title: "Yute & Tocuyo, El Salto a las Nubes",
    author: "Rafael Lanfranco",
    cover: "/libro/7.png",
    role: "Soy un(a) escritor(a).",
    age: "+12",
  },
  {
    id: "maleta-libertad-12",
    title: "La maleta de la libertad",
    author: "Iván Thays",
    cover: "/libro/8.png",
    role: "Soy un(a) fabulador(a).",
    age: "+12",
  },
  // +14
  {
    id: "ocho-14",
    title: "Ocho segundos",
    author: "María Fernanda Heredia",
    cover: "/libro/9.png",
    role: "Soy un(a) booktoker.",
    age: "+14",
  },
  {
    id: "levita-14",
    title: "La tía Levita",
    author: "Javier Arévalo",
    cover: "/libro/10.png",
    role: "Soy un(a) periodista.",
    age: "+14",
  },
  {
    id: "sol-14",
    title: "Sol tan lejos",
    author: "Jorge Eslava",
    cover: "/libro/11.png",
    role: "Soy un(a) crítico(a).",
    age: "+14",
  },
];
