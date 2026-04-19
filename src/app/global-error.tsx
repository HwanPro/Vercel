"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);

  return (
    <html lang="es">
      <body className="m-0 flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl text-center">
          <h1 className="mb-3 text-3xl font-bold text-yellow-400">
            Error crítico
          </h1>
          <p className="mb-6 text-zinc-200">
            La aplicación encontró un problema inesperado. Intenta reintentar.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-yellow-400 px-5 py-2 font-semibold text-black transition hover:bg-yellow-500"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
