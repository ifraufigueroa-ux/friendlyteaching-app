// FriendlyTeaching.cl — OACI Preparation Programme · landing
//
// Índice del programa OACI. Muestra las 8 etapas con status (ready /
// pendiente) y expone las 4 clases de la Etapa 2 (Aviation Vocabulary)
// como cards clickeables. Las clases con slides: [] muestran chip
// "Próximamente" y no linkean.
'use client';

import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { ICAO_VOCAB_CLASSES } from '@/lib/data/icao/vocabulary';
import type { OACIStage } from '@/lib/data/icao/types';

const STAGES: OACIStage[] = [
  { id: 'diagnostic',   order: 1, title: 'Diagnostic & Aviation English', goal: 'Detectar fortalezas/debilidades',        classCount: 2 },
  { id: 'vocabulary',   order: 2, title: 'Aviation Vocabulary',           goal: 'Construir vocabulario aeronáutico',       classCount: 4, href: '/dashboard/teacher/icao#vocabulary' },
  { id: 'phraseology',  order: 3, title: 'ATC Phraseology',               goal: 'Familiarizarse con lenguaje ATC',         classCount: 4 },
  { id: 'listening',    order: 4, title: 'Listening',                     goal: 'Comprender comunicaciones reales/simuladas', classCount: 4 },
  { id: 'speaking',     order: 5, title: 'Speaking & Pronunciation',      goal: 'Hablar con claridad y precisión',         classCount: 4 },
  { id: 'non-routine',  order: 6, title: 'Non-routine Situations',        goal: 'Resolver situaciones inesperadas',        classCount: 4 },
  { id: 'competencies', order: 7, title: 'ICAO Competencies',             goal: 'Trabajar las 6 áreas de evaluación',      classCount: 4 },
  { id: 'mock-tests',   order: 8, title: 'Mock Tests',                    goal: 'Simular evaluación OACI',                 classCount: [2, 4] },
];

function formatClassCount(c: number | [number, number]): string {
  return Array.isArray(c) ? `${c[0]}–${c[1]}` : String(c);
}

export default function IcaoLandingPage() {
  const readyVocabClasses = ICAO_VOCAB_CLASSES.filter(c => c.slides.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5FF] to-white">
      <TopBar title="OACI Programme" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]">
              FriendlyTeaching
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Preparation Programme
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#2D1B4E] leading-tight">
            OACI Aviation English
          </h1>
          <p className="text-base text-gray-600 mt-2 max-w-2xl">
            Programa de preparación para la evaluación OACI Operational Level 4.
            8 etapas · alto rendimiento en contextos comunicativos radiales.
          </p>
        </div>

        {/* 8 stages overview */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#5A3D7A] mb-4">Etapas del programa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGES.map(stage => {
              const isVocab = stage.id === 'vocabulary';
              const isReady = isVocab && readyVocabClasses > 0;
              return (
                <div
                  key={stage.id}
                  className={`rounded-2xl border-2 p-4 transition-shadow ${
                    isReady
                      ? 'border-[#5A3D7A] bg-white shadow-sm hover:shadow-md'
                      : 'border-gray-200 bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                      isReady ? 'bg-[#5A3D7A] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stage.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className={`font-bold ${isReady ? 'text-[#2D1B4E]' : 'text-gray-500'}`}>
                          {stage.title}
                        </h3>
                        <span className={`text-[10px] font-mono ${isReady ? 'text-[#5A3D7A]' : 'text-gray-400'}`}>
                          {formatClassCount(stage.classCount)} {typeof stage.classCount === 'number' && stage.classCount === 1 ? 'clase' : 'clases'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isReady ? 'text-gray-600' : 'text-gray-400'}`}>
                        {stage.goal}
                      </p>
                      {!isReady && (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                          Próximamente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage 2: Vocabulary classes */}
        <div id="vocabulary" className="scroll-mt-6">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#5A3D7A]">Etapa 2 — Aviation Vocabulary</h2>
              <p className="text-sm text-gray-600">
                4 clases · CLT · vocabulario nuclear con contexto radial · nivel objetivo Operational 4
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {readyVocabClasses}/{ICAO_VOCAB_CLASSES.length} listas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ICAO_VOCAB_CLASSES.map(cls => {
              const ready = cls.slides.length > 0;
              const inner = (
                <div className={`rounded-2xl border-2 p-4 h-full transition-all ${
                  ready
                    ? 'border-[#5A3D7A] bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                    : 'border-dashed border-gray-300 bg-gray-50/50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      ready ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {cls.classNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className={`font-bold text-base ${ready ? 'text-[#2D1B4E]' : 'text-gray-500'}`}>
                          {cls.title}
                        </h3>
                        {ready ? (
                          <span className="text-[10px] font-mono text-[#5A3D7A]">
                            {cls.durationMinutes} min · {cls.slides.length} slides
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${ready ? 'text-gray-600' : 'text-gray-400'}`}>
                        {cls.subtitle}
                      </p>
                      <div className={`mt-2 text-[11px] leading-snug rounded-lg px-2 py-1.5 ${
                        ready ? 'bg-[#F0E5FF]/50 text-[#5A3D7A]' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <strong className="text-[10px] uppercase tracking-widest">Contexto radial:</strong> {cls.radialContext}
                      </div>
                    </div>
                  </div>
                </div>
              );

              return ready ? (
                <Link key={cls.id} href={`/dashboard/teacher/icao/vocabulary/${cls.id}`} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={cls.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
