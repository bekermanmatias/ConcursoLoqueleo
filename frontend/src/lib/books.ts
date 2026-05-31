import type { Grado } from "../data/locations";

export function formatGradeLabel(grade: Grado): string {
  return grade.replace(/^(\d)(ro|do|to)/, "$1.°");
}
