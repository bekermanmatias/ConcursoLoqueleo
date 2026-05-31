export function joinPersonName(nombres: string, apellidos: string): string {
  return [nombres.trim(), apellidos.trim()].filter(Boolean).join(" ");
}

export function requirePersonName(
  nombres: unknown,
  apellidos: unknown,
  label: string,
): { nombres: string; apellidos: string } {
  const n = String(nombres ?? "").trim();
  const a = String(apellidos ?? "").trim();
  if (!n || !a) {
    throw new Error(`INVALID_PERSON_NAME:${label}`);
  }
  return { nombres: n, apellidos: a };
}
