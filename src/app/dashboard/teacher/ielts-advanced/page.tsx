// FriendlyTeaching.cl — IELTS GT Advanced (B2+/C1)
'use client';

import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { ADVANCED_LISTENING_MOCKS } from '@/lib/data/ielts/mocks';

function fmtDuration(sec: number): string {
  const min = Math.round(sec / 60);
  return `${min} min`;
}

export default function IELTSAdvancedPage() {
  const listeningMocks = ADVANCED_LISTENING_MOCKS;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(200,168,220,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 90% 90%, rgba(244,63,94,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="IELTS GT Advanced"
          subtitle="Simulacro con densidad léxica y distractores del examen real — nivel B2+/C1"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'IELTS GT Advanced' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#FEE2E2] border border-[#F43F5E]/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-pulse" />
              Nivel B2+ · C1 · CEFR
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              IELTS GT<span className="text-[#F43F5E]">®</span> Advanced
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Máximo nivel antes del simulacro Full IELTS. Densidad léxica de examen real, distractores más finos y preguntas mayormente inferenciales. Para alumnos apuntando a band 7+.
            </p>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-3xl border border-[#FEE2E2] shadow-md p-5 space-y-3">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
              Qué cambia en la versión Advanced
            </p>
            <ul className="space-y-2 text-sm text-[#2D1B4E]">
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>40 preguntas, ~22 min de audio</strong> — volumen y duración total prácticamente iguales al examen real.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>Velocidad 1.0x + pausas 0.4s</strong> — ritmo exacto del examen.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>Scripts más largos y densos</strong> — parciales, autoconstrucciones, giros idiomáticos, correcciones a mitad de frase.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>Preguntas mayormente inferenciales</strong> — S3 y S4 exigen leer la intención del hablante, no sólo la palabra literal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>Vocab de dominio C1</strong>: real estate, ciencia natural, metodología de investigación, economía conductual.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F43F5E] font-bold mt-0.5">✓</span>
                <span><strong>Plan-map de 6 opciones</strong> (vs 5 en B2) y multi-select con más red herrings.</span>
              </li>
            </ul>
          </div>

          {/* Listening mocks */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5A3D7A] to-[#F43F5E] text-white flex items-center justify-center text-xl shadow-md">
                🎧
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#2D1B4E]">Listening</h2>
                <p className="text-[11px] text-[#5A3D7A]/70">
                  {listeningMocks.length} mock{listeningMocks.length !== 1 ? 's' : ''} disponible{listeningMocks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {listeningMocks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#FEE2E2] p-6 text-center">
                <p className="text-sm text-gray-500">Todavía no hay mocks Advanced de Listening.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listeningMocks.map((m) => {
                  const totalMin = fmtDuration(m.totalDurationSec);
                  const href = `/dashboard/teacher/ielts/listening?mock=${encodeURIComponent(m.id)}`;
                  return (
                    <Link
                      key={m.id}
                      href={href}
                      className="group bg-white rounded-2xl border border-[#FEE2E2] hover:border-[#F43F5E]/40 hover:shadow-md transition-all p-4 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-[#F43F5E] uppercase tracking-widest">
                            {m.cefrLevel ?? 'C1'}
                          </span>
                          <span className="text-[10px] text-gray-400">·</span>
                          <span className="text-[10px] font-black text-[#5A3D7A]/60 uppercase tracking-widest tabular-nums">
                            {totalMin}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#2D1B4E] leading-tight">{m.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {m.sections.length} secciones · {m.totalQuestions} preguntas
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-br from-[#5A3D7A] to-[#F43F5E] group-hover:shadow-lg transition-shadow"
                      >
                        Abrir ↗
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coming soon */}
          <div className="bg-white/60 rounded-2xl border border-dashed border-[#FEE2E2] p-4 text-center">
            <p className="text-[10px] font-black text-[#5A3D7A]/60 uppercase tracking-[0.25em] mb-1">Próximamente</p>
            <p className="text-xs text-[#5A3D7A]/70">
              Reading, Writing y Speaking Advanced. Después de Advanced, el paso natural es el IELTS GT Simulator completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
