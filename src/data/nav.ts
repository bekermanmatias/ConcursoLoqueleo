export type NavItem = {
  label: string;
  href: string;
  section: string;
};

export const mainNav: NavItem[] = [
  { label: "Inicio", href: "/", section: "inicio" },
  { label: "¿Cómo participar?", href: "/#como-participar", section: "como-participar" },
  { label: "Retos", href: "/#retos", section: "retos" },
  { label: "Premios", href: "/#premios", section: "premios" },
  { label: "Ayuda", href: "/#ayuda", section: "ayuda" },
];
