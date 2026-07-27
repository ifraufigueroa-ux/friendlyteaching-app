// FriendlyTeaching.cl — TOEFL Academic Simulator dashboard
//
// Landing page for the teacher: choose which sections to include (classes
// are 45-50 min so the full mock rarely fits) and launch the runner in a
// new tab with the selection in the URL.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { TOEFL_SECTION_META, TOEFL_SECTIONS, type TOEFLSection } from '@/types/toefl';

interface Preset {
  id:       string;
  label:    string;
  desc:     string;
  sections: TOEFLSection[];
}

const PRESETS: Preset[] = [
  { id: 'full',    label: 'Full mock',                desc: 'Las 4 secciones (~80 min).',              sections: ['reading', 'listening', 'speaking', 'writing'] },
  { id: 'rw',     label: 'Reading + Writing',        desc: 'Receptivo + productivo (~50 min).',       sections: ['reading', 'writing'] },
  { id: 'ls',     label: 'Listening + Speaking',     desc: 'Oral compacto (~28 min).',                sections: ['listening', 'speaking'] },
  { id: 'lsw',    label: 'Listening + Speaking + W', desc: 'Sin Reading (~43 min).',                  sections: ['listening', 'speaking', 'writing'] },
  { id: 'rls',    label: 'Reading + Listening',      desc: 'Solo comprensión (~55 min).',             sections: ['reading', 'listening'] },
  { id: 'sw',     label: 'Speaking + Writing',       desc: 'Solo productivo (~23 min).',              sections: ['speaking', 'writing'] },
];

export default function TOEFLDashboardPage() {
  const [teacherId, setTeacherId] = useState('');
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) { setTeacherId(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (u) => setTeacherId(u?.uid ?? ''));
    return () => unsub();
  }, []);

  const [selectedPreset, setSelectedPreset] = useState<string>('rw');
  const [sections, setSections] = useState<Set<TOEFLSection>>(new Set(['reading', 'writing']));

  function applyPreset(preset: Preset) {
    setSelectedPreset(preset.id);
    setSections(new Set(preset.sections));
  }
  function toggleSection(s: TOEFLSection) {
    setSelectedPreset('custom');
    setSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  const orderedSelected = useMemo(
    () => TOEFL_SECTIONS.filter(s => sections.has(s)),
    [sections],
  );
  const estimatedMin = useMemo(
    () => orderedSelected.reduce((sum, s) => sum + TOEFL_SECTION_META[s].minutes, 0),
    [orderedSelected],
  );

  const launchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (teacherId) params.set('teacherId', teacherId);
    if (orderedSelected.length > 0 && orderedSelected.length < TOEFL_SECTIONS.length) {
      params.set('sections', orderedSelected.join(','));
    }
    const qs = params.toString();
    return `/toefl-mock/mock-1${qs ? '?' + qs : ''}`;
  }, [teacherId, orderedSelected]);

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
            'radial-gradient(45rem 30rem at 10% 90%, rgba(232,181,71,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="TOEFL Academic Simulator"
          subtitle="Elegí qué secciones evaluar según el tiempo de clase"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'TOEFL' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
              TOEFL Simulator
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              TOEFL iBT<span className="text-[#E8B547]">®</span> Mock
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Scoring 0-120 estilo ETS. AI grading para Writing y Speaking. Cortá el mock a lo que entre en tu clase.
            </p>
          </div>

          {/* Presets */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">
                Presets rápidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => {
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
                {TOEFL_SECTIONS.map((s) => {
                  const meta = TOEFL_SECTION_META[s];
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
                <strong>{orderedSelected.length}</strong> sección{orderedSelected.length !== 1 ? 'es' : ''} — {orderedSelected.map(s => TOEFL_SECTION_META[s].label).join(' → ') || 'ninguna'}
              </p>
              <p className="text-xs font-bold text-[#5A3D7A] tabular-nums">≈ {estimatedMin} min</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-3 flex-wrap">
            {orderedSelected.length > 0 ? (
              <a
                href={launchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
              >
                ▶ Empezar {orderedSelected.length === 4 ? 'full mock' : `práctica (${orderedSelected.length} secc.)`}
              </a>
            ) : (
              <button disabled className="px-6 py-3 rounded-full text-sm font-bold text-white opacity-40 cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
                Elegí al menos una sección
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-gray-400 max-w-md mx-auto">
            💡 Los audios de Listening se generan una vez y quedan cacheados en el bucket.
            Writing y Speaking se califican con Claude + Whisper (~$0.06 por session completa).
          </p>
        </div>
      </div>
    </div>
  );
}
