export const PERSON_NAME_MIN_LENGTH = 2;
export const PERSON_NAME_MAX_LENGTH = 128;

const PERSON_PART_RE = /^[\p{L}\s''\-]+$/u;

export function normalizePersonNamePart(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export type PersonNameError = "empty" | "short" | "long" | "invalid";

export function validatePersonNamePart(value: string): PersonNameError | null {
  const normalized = normalizePersonNamePart(value);
  if (!normalized) return "empty";
  if (normalized.length < PERSON_NAME_MIN_LENGTH) return "short";
  if (normalized.length > PERSON_NAME_MAX_LENGTH) return "long";
  if (!PERSON_PART_RE.test(normalized)) return "invalid";
  return null;
}

function personNameMessage(label: string, part: "nombres" | "apellidos", code: PersonNameError): string {
  const who =
    label === "concursante"
      ? "del estudiante"
      : label === "apoderado"
        ? "del apoderado"
        : "del docente";
  const field = part === "nombres" ? "nombre" : "apellido";
  switch (code) {
    case "empty":
      return `Completa el ${field} ${who}.`;
    case "short":
      return `El ${field} ${who} debe tener al menos ${PERSON_NAME_MIN_LENGTH} letras.`;
    case "long":
      return `El ${field} ${who} es demasiado largo (máximo ${PERSON_NAME_MAX_LENGTH} caracteres).`;
    case "invalid":
      return `El ${field} ${who} solo puede incluir letras, espacios, tildes, guiones y apóstrofes.`;
  }
}

export function requirePersonName(
  nombres: unknown,
  apellidos: unknown,
  label: string,
): { nombres: string; apellidos: string } {
  const nombresRaw = String(nombres ?? "");
  const apellidosRaw = String(apellidos ?? "");
  const nErr = validatePersonNamePart(nombresRaw);
  if (nErr) {
    throw new Error(personNameMessage(label, "nombres", nErr));
  }
  const aErr = validatePersonNamePart(apellidosRaw);
  if (aErr) {
    throw new Error(personNameMessage(label, "apellidos", aErr));
  }
  return {
    nombres: normalizePersonNamePart(nombresRaw),
    apellidos: normalizePersonNamePart(apellidosRaw),
  };
}

export function joinPersonName(nombres: string, apellidos: string): string {
  return [nombres.trim(), apellidos.trim()].filter(Boolean).join(" ");
}
