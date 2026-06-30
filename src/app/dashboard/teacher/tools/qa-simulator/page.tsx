// FriendlyTeaching.cl — Q&A Simulator index
// Lists every simulation defined in src/data/qa-simulations/.

import Link from 'next/link';
import { QA_SIMULATIONS, categoriesInSimulation } from '@/data/qa-simulations';

export default function QASimulatorIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] px-8 py-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative max-w-4xl mx-auto">
          <Link href="/dashboard/teacher/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 mb-3">
            ← Herramientas
          </Link>
          <p className="text-[#C8A8DC] text-xs font-bold uppercase tracking-widest mb-1">🎯 Q&A Simulator</p>
          <h1 className="text-3xl font-extrabold text-white mb-1">Biblioteca de simulaciones</h1>
          <p className="text-white/60 text-sm">Elige una simulación para practicar preguntas tipo foro internacional.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Sims grid ───────────────────────────────────── */}
        {QA_SIMULATIONS.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QA_SIMULATIONS.map(sim => {
              const cats = categoriesInSimulation(sim);
              return (
                <Link
                  key={sim.id}
                  href={`/dashboard/teacher/tools/qa-simulator/${sim.id}`}
                  className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-white border border-[#E8D5F0] hover:border-transparent hover:shadow-xl ${sim.glow} transition-all duration-200 overflow-hidden`}
                >
                  {/* Gradient top accent */}
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${sim.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sim.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      {sim.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A] border border-[#E8D5F0]">
                      {sim.questions.length} preguntas
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-[#2D1B4E] text-base mb-1 group-hover:text-[#5A3D7A] transition-colors">{sim.title}</p>
                    {sim.studentName && (
                      <p className="text-[11px] font-semibold text-[#9B7CB8] mb-1.5">para {sim.studentName}</p>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{sim.description}</p>
                  </div>

                  {/* Category chips */}
                  <div className="flex flex-wrap gap-1">
                    {cats.slice(0, 6).map(c => (
                      <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {c}
                      </span>
                    ))}
                    {cats.length > 6 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        +{cats.length - 6}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-[#9B7CB8] group-hover:text-[#5A3D7A] mt-auto transition-colors">
                    <span>Empezar simulación</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── How to add ──────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-dashed border-[#C8A8DC] p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">➕</div>
            <div className="flex-1 text-sm">
              <p className="font-bold text-[#5A3D7A] mb-1">¿Quieres agregar una nueva simulación?</p>
              <p className="text-gray-600 leading-relaxed">
                Crea un archivo <code className="bg-[#F0E5FF] px-1.5 py-0.5 rounded font-mono text-[12px]">.json</code> en
                <code className="bg-[#F0E5FF] px-1.5 py-0.5 rounded font-mono text-[12px] mx-1">src/data/qa-simulations/</code>
                con el formato <code className="bg-[#F0E5FF] px-1.5 py-0.5 rounded font-mono text-[12px]">QASimulation</code>
                y registra el import en <code className="bg-[#F0E5FF] px-1.5 py-0.5 rounded font-mono text-[12px]">index.ts</code>.
                Los campos requeridos son: <strong>id</strong>, <strong>title</strong>, <strong>description</strong>,
                <strong> icon</strong>, <strong>gradient</strong>, <strong>glow</strong>, <strong>questions</strong>.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] p-12 text-center">
      <div className="text-6xl mb-3">🗂️</div>
      <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Sin simulaciones todavía</h2>
      <p className="text-sm text-gray-500">
        Agrega un archivo JSON en <code className="bg-gray-100 px-1 rounded font-mono text-xs">src/data/qa-simulations/</code>
      </p>
    </div>
  );
}
