interface Props {
  bookId: string;
  bookTitle: string;
}

export default function InscripcionesCerradas({ bookId, bookTitle }: Props) {
  return (
    <div className="flow-panel max-w-lg mx-auto text-center px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink-900">Inscripciones cerradas</h1>
      <p className="mt-4 text-gray-600">
        En este momento no recibimos nuevas participaciones para <strong>{bookTitle}</strong>.
        Si ya enviaste tu trabajo, puedes consultar tu estado con tu DNI en la sección de ayuda.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <a href={`/libro/${bookId}/`} className="btn-primary inline-flex justify-center px-6 py-3">
          Volver al libro
        </a>
        <a
          href="/ayuda/consultar/"
          className="rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold hover:bg-gray-50"
        >
          Consultar mi participación
        </a>
      </div>
    </div>
  );
}
