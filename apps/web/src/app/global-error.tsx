'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Errore del Sistema</h1>
            <p className="text-gray-600 mb-8">
              Si è verificato un errore critico del sistema.
            </p>
            <div className="space-x-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => reset()}
              >
                Riprova
              </button>
              <a 
                href="/" 
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Torna alla Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}