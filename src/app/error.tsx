"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en la app:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <h2 className="mb-2 text-3xl font-bold text-yellow-400">Algo falló</h2>
      <p className="mb-6 max-w-xl text-sm text-zinc-200 sm:text-base">
        Ocurrió un error inesperado. Puedes reintentar sin recargar toda la página.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-yellow-400 px-5 py-2 font-semibold text-black transition hover:bg-yellow-500"
      >
        Reintentar
      </button>
    </div>
  );
}
