import { termsAndConditionsPdfFallback } from "../data/legal";

/** URL pública del PDF de términos (BD o respaldo en /public). */
export function resolveTermsPdfUrl(url: string | null | undefined): string {
  return url?.trim() || termsAndConditionsPdfFallback;
}
