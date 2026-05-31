function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatPeriodo(fechaInicio: string | null, fechaFin: string | null): string {
  if (!fechaInicio && !fechaFin) return "—";
  const start = fechaInicio ? toDateInputValue(fechaInicio) : "…";
  const end = fechaFin ? toDateInputValue(fechaFin) : "…";
  return `${start} → ${end}`;
}

export { toDateInputValue, formatPeriodo };
