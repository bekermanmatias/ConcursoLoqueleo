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
  age: Exclude<AgeKey, "todo">;
}

/** Colores del bloque inferior de la tarjeta (como el mockup) */
export const ageCardColors: Record<Exclude<AgeKey, "todo">, string> = {
  "+6":  "#f5e6a8",
  "+8":  "#ddd0f0",
  "+10": "#f5d4b8",
  "+12": "#b8d4f5",
  "+14": "#f5c4cc",
};

export const books: Book[] = [
  {
    id: "tusuj-6",
    title: "Tusuj, un cuy especial",
    author: "Andrea y Claudia Paz",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80",
    age: "+6",
  },
  {
    id: "lonchera-6",
    title: "La lonchera mentirosa",
    author: "Jorge Eslava",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    age: "+6",
  },
  {
    id: "revueltos-8",
    title: "Libros revueltos",
    author: "Lorenzo Helguero",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80",
    age: "+8",
  },
  {
    id: "gallinas-8",
    title: "Tres gallinas contra un pícaro ladrón",
    author: "Vicky Canales",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80",
    age: "+8",
  },
  {
    id: "tusuj-10",
    title: "Tusuj, un cuy especial",
    author: "Andrea y Claudia Paz",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80",
    age: "+10",
  },
  {
    id: "lonchera-10",
    title: "La lonchera mentirosa",
    author: "Jorge Eslava",
    cover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80",
    age: "+10",
  },
  {
    id: "revueltos-12",
    title: "Libros revueltos",
    author: "Lorenzo Helguero",
    cover: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
    age: "+12",
  },
  {
    id: "gallinas-12",
    title: "Tres gallinas contra un pícaro ladrón",
    author: "Vicky Canales",
    cover: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&q=80",
    age: "+12",
  },
  {
    id: "ocho-14",
    title: "Ocho segundos",
    author: "María Fernanda Heredia",
    cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&q=80",
    age: "+14",
  },
  {
    id: "levita-14",
    title: "La tía Levita",
    author: "Javier Arévalo",
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
    age: "+14",
  },
  {
    id: "sol-14",
    title: "Sol tan lejos",
    author: "Jorge Eslava",
    cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80",
    age: "+14",
  },
];
