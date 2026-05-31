const EMAIL_MAX_LENGTH = 255;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireDocenteEmail(value: unknown): string {
  const email = String(value ?? "").trim();
  if (!email) {
    throw new Error("EMAIL_INVALID");
  }
  if (!EMAIL_RE.test(email)) {
    throw new Error("EMAIL_INVALID");
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    throw new Error("EMAIL_TOO_LONG");
  }
  return email;
}
