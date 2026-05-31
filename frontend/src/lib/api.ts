const API_BASE = (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/**
 * Normaliza rutas /api con barra final.
 * Astro dev usa trailingSlash: "always" y sin ella el proxy no llega al backend.
 */
export function apiUrl(path: string): string {
  const [pathname, query = ""] = path.split("?");
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const slashPath = base.endsWith("/") ? base : `${base}/`;
  const qs = query ? `?${query}` : "";
  return `${API_BASE}${slashPath}${qs}`;
}

export function getApiBase(): string {
  return API_BASE;
}
