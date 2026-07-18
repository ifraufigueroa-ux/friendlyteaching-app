// FriendlyTeaching.cl — Planner (rediseñado)
//
// Cuatro tabs:
//   Hoy       → clases de hoy con tema + material editables inline
//   Semana    → clases de esta semana agrupadas por día
//   Kanban    → kanban legacy de preparación de lecciones (backlog / próximas / listas / archivadas)
//   Por estudiante → clases agendadas agrupadas por estudiante
//
// El tab activo se persiste en la URL (?tab=…) para que un F5 mantenga contexto
// y para poder linkear directo a un tab específico desde otros lados de la app.
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import TopBar from '@/components/layout/TopBar';
import TodayTab       from '@/components/planner/TodayTab';
import WeekTab        from '@/components/planner/WeekTab';
import LessonKanbanTab from '@/components/planner/LessonKanbanTab';
import ByStudentTab   from '@/components/planner/ByStudentTab';

const TABS = [
  { id: 'hoy',      label: 'Hoy',           icon: '☀️',  subtitle: 'Clases de hoy'          },
  { id: 'semana',   label: 'Semana',        icon: '📅', subtitle: 'Agenda semanal'         },
  { id: 'kanban',   label: 'Kanban',        icon: '🗂️', subtitle: 'Preparación de material' },
  { id: 'estudiante', label: 'Por estudiante', icon: '👥', subtitle: 'Clases por alumno'  },
] as const;

type TabId = typeof TABS[number]['id'];

export default function PlannerPage() {
  // Read UID straight from Firebase Auth — the zustand store lags on hydration
  // and can leave profile.uid empty even when the user IS signed in, which
  // trapped the whole planner in a spinner loop (authStore hydration bug).
  const [teacherId, setTeacherId] = useState<string>('');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setTeacherId(auth.currentUser.uid);
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, user => {
      setTeacherId(user?.uid ?? '');
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const router = useRouter();
  const params = useSearchParams();

  const activeTab: TabId = useMemo(() => {
    const raw = params?.get('tab') ?? null;
    return (TABS.find(t => t.id === raw)?.id ?? 'hoy') as TabId;
  }, [params]);

  function setTab(id: TabId) {
    const next = new URLSearchParams(params?.toString() ?? '');
    next.set('tab', id);
    router.replace(`/dashboard/teacher/planner?${next.toString()}`, { scroll: false });
  }

  // Only show the full-page spinner while Firebase Auth is resolving. Once
  // auth resolves — with or without a user — render the tabs. Child tabs
  // handle empty teacherId gracefully (no subscription, empty state).
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="flex flex-col min-h-full bg-[#FFFCF7]">
      <TopBar
        title="🗂️ Planner"
        subtitle={currentMeta.subtitle}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Planner' },
        ]}
      />

      {/* Tab bar — Friendly Teaching palette (cream + purple) */}
      <div className="sticky top-0 z-30 bg-[#FFFCF7]/95 backdrop-blur border-b border-[#F0E5FF]">
        <div className="px-6 pt-4 pb-3">
          <div className="inline-flex bg-white rounded-2xl border border-[#F0E5FF] shadow-sm p-1 gap-1">
            {TABS.map(tab => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white shadow-md'
                      : 'text-gray-500 hover:text-[#5A3D7A] hover:bg-[#F0E5FF]'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'hoy'        && <TodayTab      teacherId={teacherId} />}
        {activeTab === 'semana'     && <WeekTab       teacherId={teacherId} />}
        {activeTab === 'kanban'     && <LessonKanbanTab teacherId={teacherId} />}
        {activeTab === 'estudiante' && <ByStudentTab  teacherId={teacherId} />}
      </div>
    </div>
  );
}
