// FriendlyTeaching.cl — TOEFL Academic Simulator dashboard
//
// Teacher-facing landing. Shows what's shipped (full mock, independent
// tasks only) + a "Start full mock" launcher. Individual-section practice
// will come in a follow-up phase.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { TOEFL_SECTION_META, TOEFL_SECTIONS } from '@/types/toefl';

export default function TOEFLDashboardPage() {
  const total = TOEFL_SECTIONS.reduce((sum, s) => sum + TOEFL_SECTION_META[s].minutes, 0);
  const [teacherId, setTeacherId] = useState('');
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) { setTeacherId(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (u) => setTeacherId(u?.uid ?? ''));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      {/* Ambient bg — matches IELTS Listening/Writing aesthetic */}
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
          subtitle="4 secciones · ~80 min mock · scoring 0-120 estilo ETS"
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
              TOEFL iBT<span className="text-[#E8B547]">®</span> Full Mock
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Las 4 secciones en orden. Timer por sección, AI grading para Writing y Speaking, resultado 0-120.
            </p>
          </div>

          {/* Section overview */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                  Mock 1 · Introductory
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#2D1B4E] mt-1">Full Academic Mock</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Independent tasks only · integrated tasks en la próxima fase
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
                ~{total} min
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TOEFL_SECTIONS.map((s, i) => {
                const meta = TOEFL_SECTION_META[s];
                return (
                  <div key={s} className="bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <div>
                        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                          Section {i + 1}
                        </p>
                        <p className="text-sm font-semibold text-[#2D1B4E]">{meta.label}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 tabular-nums">~{meta.minutes} min</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href={teacherId ? `/toefl-mock/mock-1?teacherId=${teacherId}` : '/toefl-mock/mock-1'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
            >
              ▶ Start full mock
            </Link>
          </div>

          <p className="text-center text-[10px] text-gray-400 max-w-md mx-auto">
            💡 Los audios de Listening se generan una vez por deployment y quedan cacheados en el bucket.
            Writing y Speaking se califican con Claude + Whisper (~$0.06 por session).
          </p>
        </div>
      </div>
    </div>
  );
}
