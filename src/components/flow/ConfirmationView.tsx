import { useEffect, useState } from "react";

interface Inscripcion {
  bookId: string;
  bookTitle: string;
  code: string;
  colegio: string;
  grado: string;
  dni: string;
  fileName: string;
}

export default function ConfirmationView() {
  const [data, setData] = useState<Inscripcion | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("loqueleo-inscripcion");
    if (raw) {
      try {
        setData(JSON.parse(raw) as Inscripcion);
      } catch {
        setData(null);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="flow-panel max-w-lg mx-auto text-center">
        <p className="text-gray-600">No encontramos una inscripción reciente.</p>
        <a href="/" className="btn-primary inline-flex mt-6">
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="flow-panel max-w-lg mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
        ¡Tu trabajo fue enviado con éxito!
      </h1>
      <p className="mt-3 text-gray-600">
        Gracias por participar en <strong>Soy Loqueleo 2026</strong> con{" "}
        <em>{data.bookTitle}</em>.
      </p>

      <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-6 text-left space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Código de participación
        </p>
        <p className="text-xl font-mono font-bold text-[color:var(--color-brand-red)]">
          {data.code}
        </p>
        <hr className="border-gray-200" />
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-ink-800">Colegio:</span> {data.colegio}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-ink-800">Grado:</span> {data.grado}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-ink-800">Archivo:</span> {data.fileName}
        </p>
        <p className="text-sm text-gray-500 pt-2">
          Recibirás un correo de confirmación en los próximos minutos.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          className="rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold hover:bg-gray-50"
          onClick={() => window.print()}
        >
          Descargar constancia
        </button>
        <a href="/" className="btn-primary inline-flex justify-center py-3 px-6 text-sm">
          Explorar más libros
        </a>
      </div>
    </div>
  );
}
