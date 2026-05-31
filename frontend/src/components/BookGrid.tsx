import { useEffect, useState } from "react";
import AgeFilter from "./AgeFilter";
import BookCard from "./BookCard";
import { fetchPublicObras } from "../lib/concurso";
import type { PublicBook } from "../types/public-book";

interface Props {
  initialBooks?: PublicBook[];
}

export default function BookGrid({ initialBooks = [] }: Props) {
  const [books, setBooks] = useState<PublicBook[]>(initialBooks);
  const [loading, setLoading] = useState(initialBooks.length === 0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fresh = await fetchPublicObras();
      if (cancelled) return;
      if (fresh.length > 0) setBooks(fresh);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="retos" className="relative z-30 -mt-44 sm:-mt-52 lg:-mt-60 pb-14 sm:pb-20">
      <header className="mb-8 sm:mb-10">
        <h2 className="section-title">Explora los retos</h2>
        <p className="mt-3 text-sm sm:text-base text-[color:var(--color-ink-700)] max-w-2xl leading-relaxed">
          Cada grado tiene una obra y un reto. Busca el tuyo por el nombre del grado en la tarjeta
          (de 1.° primaria a 5.° secundaria).
        </p>
      </header>

      <AgeFilter />

      {loading && books.length === 0 ? (
        <p className="mt-10 text-sm text-[color:var(--color-ink-700)]">Cargando obras…</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-10 sm:mt-12 items-stretch">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
