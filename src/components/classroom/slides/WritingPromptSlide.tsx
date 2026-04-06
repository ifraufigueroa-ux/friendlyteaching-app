// FriendlyTeaching.cl — WritingPromptSlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function WritingPromptSlide({ slide }: Props) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
      </div>

      {slide.prompt && (
        <div className="mb-6 bg-[#F0E5FF]/40 rounded-2xl p-5">
          <p className="text-2xl mb-2">✍️</p>
          <p className="text-lg font-semibold text-gray-800">{slide.prompt}</p>
        </div>
      )}

      {slide.content && (
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">{slide.content}</p>
      )}

      {slide.blanks && slide.blanks.length > 0 && (
        <div className="mb-4 text-sm text-gray-500">
          <p className="font-medium text-[#5A3D7A] mb-2">Palabras clave:</p>
          <div className="flex flex-wrap gap-2">
            {slide.blanks.map((word, i) => (
              <span key={i} className="bg-[#C8A8DC]/20 text-[#5A3D7A] px-3 py-1 rounded-full text-xs font-semibold">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {!submitted ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            rows={5}
            className="flex-1 w-full rounded-2xl border-2 border-gray-200 focus:border-[#C8A8DC] focus:outline-none p-4 text-gray-700 resize-none text-sm"
          />
          <button
            onClick={() => text.trim() && setSubmitted(true)}
            disabled={!text.trim()}
            className="mt-3 px-6 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Enviar ✓
          </button>
        </>
      ) : (
        <div className="flex-1 bg-green-50 rounded-2xl border border-green-200 p-5">
          <p className="text-xs font-bold text-green-600 mb-2">✅ Respuesta enviada</p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{text}</p>
          <button
            onClick={() => { setSubmitted(false); setText(''); }}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Editar respuesta
          </button>
        </div>
      )}
    </div>
  );
}
