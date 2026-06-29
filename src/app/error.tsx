'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FT] Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #E0D5FF 50%, #FFE8F0 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#5A3D7A] mb-2">Algo salió mal</h2>
        <p className="text-gray-500 text-sm mb-2">
          Ocurrió un error inesperado. Por favor, intenta de nuevo.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-red-50 border border-red-200 rounded-xl p-3 mb-4 overflow-auto max-h-40 text-red-700">
            {error.message}
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl font-bold text-sm transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
