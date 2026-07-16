// Floating right-side dictionary panel. Opens when a word is clicked in
// dictionary-mode. Shows Spanish translation on top (biggest hook for a B1
// learner), then IPA + English definitions + example.
'use client';
import { useEffect, useRef } from 'react';
import type { WordLookupResult } from './WordLookup';

interface Props {
  word: string | null;
  result: WordLookupResult | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export default function DictionaryPanel({ word, result, loading, error, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!word) return null;

  const notFound = result?.source === 'not_found';

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 shadow-2xl flex flex-col bg-white border-l border-[#E8D9BE] animate-[slideIn_0.2s_ease-out]">
      <div className="bg-gradient-to-r from-[#1B2C3F] to-[#4B6A85] px-5 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📖</span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Dictionary</p>
            <p className="font-serif font-bold text-2xl leading-tight truncate">{word}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none px-2">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-56 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        {!loading && !error && notFound && (
          <div className="text-sm text-[#4B6A85] italic">
            No hay resultados para <strong>{word}</strong>. Intenta con otra palabra.
          </div>
        )}

        {!loading && !error && result && !notFound && (
          <>
            {/* Spanish translation — biggest visual anchor for the learner */}
            {result.translationES && (
              <div className="rounded-2xl border border-[#E8D9BE] bg-[#F5EFE1] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B6A85] mb-1">Español</p>
                <p className="font-serif text-2xl font-semibold text-[#1B2C3F]">{result.translationES}</p>
              </div>
            )}

            {/* IPA + audio */}
            {(result.phonetic || result.audioUrl) && (
              <div className="flex items-center gap-3">
                {result.phonetic && (
                  <span className="text-[#5A3D7A] font-mono text-lg">{result.phonetic}</span>
                )}
                {result.audioUrl && (
                  <>
                    <audio ref={audioRef} src={result.audioUrl} preload="none" />
                    <button
                      onClick={() => audioRef.current?.play().catch(() => { /* browser blocked */ })}
                      className="text-[11px] font-semibold text-[#4B6A85] border border-[#E8D9BE] hover:bg-[#F5EFE1] rounded-full px-3 py-1"
                    >
                      ▶ Listen
                    </button>
                  </>
                )}
              </div>
            )}

            {/* English definitions */}
            {result.definitions.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B6A85] mb-2">English</p>
                <ol className="space-y-3">
                  {result.definitions.map((d, i) => (
                    <li key={i} className="text-sm text-[#1F2937]">
                      <span className="text-[10px] uppercase font-black text-[#B45309] mr-2 tracking-widest">
                        {d.pos}
                      </span>
                      {d.text}
                      {d.example && (
                        <p className="mt-1 italic text-[#4B6A85] text-[13px]">&ldquo;{d.example}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.source === 'partial' && (
              <p className="text-[10px] italic text-[#B45309]">
                Datos parciales — no encontramos todo para esta palabra.
              </p>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
