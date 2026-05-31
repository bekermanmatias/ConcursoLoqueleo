import { ageUiStyles } from "../data/books";
import { formatGradeLabel } from "../lib/books";
import type { PublicBook } from "../types/public-book";

interface Props {
  book: PublicBook;
}

export default function BookCard({ book }: Props) {
  const { accent } = ageUiStyles[book.age];
  const bookUrl = `/libro/${book.id}/`;
  const gradeLabel = formatGradeLabel(book.grade);

  return (
    <article data-age={book.age} className="h-full">
      <div
        className="book-card flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_10px_28px_rgba(0,0,0,0.1)]"
        style={{ borderColor: accent }}
      >
        <a href={bookUrl} className="block w-full shrink-0">
          <div className="book-cover">
            <img
              src={book.cover}
              alt={`Tapa de ${book.title}`}
              width={200}
              height={267}
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>

        <div className="book-cover-fade" aria-hidden="true"></div>

        <div className="book-card-body">
          <div className="book-card-top">
            <p className="book-card-grade" style={{ color: accent }}>
              {gradeLabel}
            </p>
            <h3 className="book-card-title">{book.title}</h3>
            <p className="book-card-author">{book.author}</p>
            <div className="book-card-top-spacer" aria-hidden="true"></div>
          </div>

          <div className="book-card-footer">
            <div className="book-card-role">
              <span className="book-card-badge" style={{ background: accent }}>
                {book.age}
              </span>
              <p className="book-card-role-label" style={{ color: accent }}>
                {book.role}
              </p>
            </div>

            <a href={bookUrl} className="book-card-cta" style={{ background: accent }}>
              Ver reto
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
