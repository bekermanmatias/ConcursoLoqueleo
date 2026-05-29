import { books, type Book } from "../data/books";
import type { Grado } from "../data/locations";

export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export function getBookByGrade(grade: Grado): Book | undefined {
  return books.find((b) => b.grade === grade);
}

export function formatGradeLabel(grade: Grado): string {
  return grade.replace(/^(\d)(ro|do|to)/, "$1.°");
}

export function getAllBookIds(): string[] {
  return books.map((b) => b.id);
}
