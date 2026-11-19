'use client';
import { useEffect, useState } from 'react';

// Heuristic: detect the stale-chunk error that happens right after a deploy
// when the browser still has an old HTML/SW pointing at JS hashes that no
// longer exist. Covers Next/Turbopack phrasings we have seen in prod.
function isStaleChunkError(err: Error): boolean {
  const msg = `${err.name} ${err.message}`.toLowerCase();
  return (
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk') ||
    msg.includes("failed to load chunk") ||
    msg.includes('loading css chunk') ||
    msg.includes("can't find variable: webpackchunk")
  );
}

async function nukeClientCachesAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch { /* best-effort */ }
  // Bust any HTTP cache for the current URL too.
  const url = new URL(window.location.href);
  url.searchParams.set('_r', Date.now().toString(36));
  window.location.replace(url.toString());
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    console.error('[FT] Global error:', error);
    if (isStaleChunkError(error)) {
      setRecovering(true);
      nukeClientCachesAndReload();
    }
  }, [error]);

  if (recovering) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #E0D5FF 50%, #FFE8F0 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5A3D7A] font-semibold text-sm">Actualizando la app…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #E0D5FF 50%, #FFE8F0 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#5A3D7A] mb-2">Algo salió mal</h2>
        <p className="text-gray-500 text-sm mb-4">
          Ocurrió un error inesperado. Por favor, intenta de nuevo.
        </p>
        <details className="text-left mb-4">
          <summary className="text-[11px] font-semibold text-[#9B7CB8] cursor-pointer select-none mb-2">
            Ver detalle del error
          </summary>
          <pre className="text-xs bg-red-50 border border-red-200 rounded-xl p-3 overflow-auto max-h-60 text-red-700 whitespace-pre-wrap break-words">
            {error.message}
            {error.digest && `\n\n[digest: ${error.digest}]`}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl font-bold text-sm transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={nukeClientCachesAndReload}
            className="px-6 py-2 text-[11px] font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors"
          >
            Limpiar caché y recargar
          </button>
        </div>
      </div>
    </div>
  );
}
