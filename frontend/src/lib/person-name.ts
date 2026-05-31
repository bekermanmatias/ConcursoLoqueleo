export function joinPersonName(nombres: string, apellidos: string): string {
  return [nombres.trim(), apellidos.trim()].filter(Boolean).join(" ");
}
