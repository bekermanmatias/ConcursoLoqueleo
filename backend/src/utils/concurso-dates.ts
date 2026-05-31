/** Convierte YYYY-MM-DD del admin al último instante de ese día (hora Perú). */
export function normalizeFechaFin(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59-05:00`;
  }
  return trimmed;
}

export function parseFechaFinMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}
