// FriendlyTeaching.cl — IELTS GT Simulator: consolidated landing
//
// Single entry point for the four IELTS General Training sections. The
// section pages themselves (listening / reading / writing / cue-cards)
// still own their content and grading; this page just presents them as
// one product, with the same preset + toggle pattern the teacher already
// knows from the TOEFL Simulator.
'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  IELTS_SECTIONS, IELTS_SECTION_META, IELTS_PRESETS,
  type IELTSSection, type IELTSPreset,
} from '@/types/ielts-simulator';

// Human "Nh Nmin" formatter for the total-time chip.
function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export default function IELTSSimulatorPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('full-gt');
  const [sections, setSections] = useState<Set<IELTSSection>>(
    new Set(['listening', 'reading', 'writing', 'speaking']),
  );
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-clear the "opened" notice after a few seconds so it doesn't linger.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  function applyPreset(preset: IELTSPreset) {
    setSelectedPreset(preset.id);
    setSections(new Set(preset.sections));
  }
  function toggleSection(s: IELTSSection) {
    setSelectedPreset('custom');
    setSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  const orderedSelected = useMemo(
    () => IELTS_SECTIONS.filter(s => sections.has(s)),
    [sections],
  );
  const estimatedMin = useMemo(
    () => orderedSelected.reduce((sum, s) => sum + IELTS_SECTION_META[s].minutes, 0),
    [orderedSelected],
  );

  // Open every selected section in its own tab, in official IELTS order.
  // Browsers only allow multiple window.open calls right after a click,
  // so we do them synchronously inside the handler.
  function handleLaunchAll() {
    if (orderedSelected.length === 0) return;
    for (const s of orderedSelected) {
      const meta = IELTS_SECTION_META[s];
      window.open(meta.href, '_blank', 'noopener,noreferrer');
    }
    setNotice(
      orderedSelected.length === 1
        ? 'Sección abierta en una nueva pestaña.'
        : `${orderedSelected.length} secciones abiertas en pestañas separadas — orden oficial: ${orderedSelected.map(s => IELTS_SECTION_META[s].label).join(' → ')}.`,
    );
  }

  function handleLaunchOne(s: IELTSSection) {
    const meta = IELTS_SECTION_META[s];
    window.open(meta.href, '_blank', 'noopener,noreferrer');
  }

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
            'radial-gradient(45rem 30rem at 10% 90%, rgba(220,20,60,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="IELTS GT Simulator"
          subtitle="Todo el mock IELTS General Training en un solo lugar"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'IELTS GT' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC143C] animate-pulse" />
              IELTS General Training
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              IELTS GT<span className="text-[#DC143C]">®</span> Mock
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Listening + Reading + Writing + Speaking en el orden oficial.
              Band scoring 0–9. AI grading para Writing con band descriptors oficiales.
            </p>
          </div>

          {/* Presets */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">
                Presets rápidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IELTS_PRESETS.map((p) => {
                  const active = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      className={`text-left rounded-xl p-3 border-2 transition-all ${
                        active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
                      }`}
                    >
                      <p className="text-sm font-bold text-[#5A3D7A]">{p.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom section toggles */}
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-2">
                O personalizá
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IELTS_SECTIONS.map((s) => {
                  const meta = IELTS_SECTION_META[s];
                  const active = sections.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSection(s)}
                      className={`text-left rounded-xl p-3 border-2 transition-all ${
                        active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC] opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[11px] font-bold ${
                          active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
                        }`}>{active ? '✓' : ''}</span>
                        <span className="text-lg">{meta.icon}</span>
                      </div>
                      <p className="text-sm font-bold text-[#2D1B4E]">{meta.label}</p>
                      <p className="text-[10px] text-gray-500 tabular-nums">~{meta.minutes} min</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-[#5A3D7A]">
                <strong>{orderedSelected.length}</strong> sección{orderedSelected.length !== 1 ? 'es' : ''} — {orderedSelected.map(s => IELTS_SECTION_META[s].label).join(' → ') || 'ninguna'}
              </p>
              <p className="text-xs font-bold text-[#5A3D7A] tabular-nums">≈ {fmtDuration(estimatedMin)}</p>
            </div>
          </div>

          {/* Main CTA */}
          <div className="space-y-3">
            <div className="flex justify-center">
              {orderedSelected.length > 0 ? (
                <button
                  onClick={handleLaunchAll}
                  className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
                >
                  ▶ Iniciar Mock en Vivo
                  <span className="ml-2 opacity-80 font-normal text-[11px]">
                    ({orderedSelected.length} pestaña{orderedSelected.length !== 1 ? 's' : ''})
                  </span>
                </button>
              ) : (
                <button disabled className="px-6 py-3 rounded-full text-sm font-bold text-white opacity-40 cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
                  Elegí al menos una sección
                </button>
              )}
            </div>

            {notice && (
              <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                <p className="text-[11px] text-emerald-700">{notice}</p>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-gray-400 max-w-md mx-auto">
            💡 Cada sección se abre en su propia pestaña. Corré en el orden oficial (Listening → Reading → Writing → Speaking) para replicar la experiencia real del examen.
          </p>

          {/* Section detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {IELTS_SECTIONS.map((s) => {
              const meta = IELTS_SECTION_META[s];
              const active = sections.has(s);
              return (
                <div
                  key={s}
                  className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                    active ? 'border-[#5A3D7A]/40' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white flex items-center justify-center text-xl shadow-md flex-shrink-0">
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2D1B4E] leading-tight">
                          IELTS {meta.label}
                        </p>
                        <p className="text-[10px] font-black text-[#5A3D7A]/60 uppercase tracking-widest tabular-nums mt-0.5">
                          ~{meta.minutes} min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLaunchOne(s)}
                      className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0D0F5] transition-colors"
                    >
                      Abrir ↗
                    </button>
                  </div>
                  <p className="text-[11px] text-[#5A3D7A]/70 leading-relaxed">
                    {meta.summary}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
