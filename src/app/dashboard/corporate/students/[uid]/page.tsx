// FriendlyTeaching.cl — Corporate drill-down for a single employee
//
// Opens when a corporate admin clicks a row on the Master Account roster.
// Shows: student profile, latest placement, class history, Daily Practice
// summary and a link to the full academic report (future). Access is
// gated to admins of the org the student belongs to.

'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  ArrowLeft, Flame, Trophy, Calendar, GraduationCap, FileText,
  Target, Mail,
} from 'lucide-react';
import {
  collection, doc, getDoc, getDocs, query, where,
  Timestamp, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useMyOrganization, useUserProfile } from '@/hooks/useOrganization';
import type { Booking, LessonLevel } from '@/types/firebase';

interface Props {
  params: Promise<{ uid: string }>;
}

interface PlacementRow {
  id:         string;
  level:      LessonLevel | null;
  completedAt: Timestamp | null;
  scoreLabel?: string;
}

interface PracticeSummary {
  currentStreak:  number;
  longestStreak:  number;
  totalXp:        number;
  currentLevel:   LessonLevel | null;
  lastPracticedAt: string | null;
}

export default function CorporateStudentPage({ params }: Props) {
  const { uid } = use(params);
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { user, loading: userLoading } = useUserProfile(uid);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [practice, setPractice] = useState<PracticeSummary | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setExtrasLoading(true);
    Promise.all([
      getDocs(query(collection(db, 'bookings'), where('studentId', '==', uid))),
      getDocs(query(collection(db, 'placementSessions'), where('studentId', '==', uid))),
      getDoc(doc(db, 'practiceProgress', uid)),
    ]).then(([bSnap, pSnap, prSnap]) => {
      if (cancelled) return;
      setBookings(bSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking)));
      setPlacements(
        pSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data();
          return {
            id:          d.id,
            level:       (data.level ?? null) as LessonLevel | null,
            completedAt: (data.completedAt ?? data.createdAt ?? null) as Timestamp | null,
            scoreLabel:  typeof data.score === 'number' ? `${data.score}%` : undefined,
          };
        })
      );
      if (prSnap.exists()) {
        const d = prSnap.data();
        setPractice({
          currentStreak:   d.currentStreak ?? 0,
          longestStreak:   d.longestStreak ?? 0,
          totalXp:         d.totalXp ?? 0,
          currentLevel:    d.currentLevel ?? null,
          lastPracticedAt: d.lastPracticedAt ?? null,
        });
      } else {
        setPractice(null);
      }
      setExtrasLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.warn('[CorporateStudentPage] fetch error:', err);
      setExtrasLoading(false);
    });
    return () => { cancelled = true; };
  }, [uid]);

  if (orgLoading || userLoading) {
    return <Shell><p className="text-center text-sm text-[#9B7CB8] py-20">Cargando…</p></Shell>;
  }

  if (!isCorporateAdmin) {
    return <Shell><Blocked body="Esta vista es solo para cuentas corporativas." /></Shell>;
  }

  if (!user || user.role !== 'student') {
    return <Shell><Blocked body="Empleado no encontrado." /></Shell>;
  }

  // Access control: student must belong to this admin's org.
  const belongsToOrg = org?.studentUids.includes(user.uid);
  if (!belongsToOrg) {
    return <Shell><Blocked body="Este empleado no está asignado a tu organización." /></Shell>;
  }

  const attended    = bookings.filter(b => b.attendance === 'attended').length;
  const absent      = bookings.filter(b => b.attendance === 'absent').length;
  const attendance  = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 0;
  const sortedBookings = [...bookings].sort(
    (a, b) => (b.weekStart?.toMillis() ?? 0) - (a.weekStart?.toMillis() ?? 0),
  );
  const sortedPlacements = [...placements].sort(
    (a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0),
  );
  const firstPlacement = sortedPlacements[sortedPlacements.length - 1] ?? null;
  const latestPlacement = sortedPlacements[0] ?? null;

  const initials = user.fullName.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');

  return (
    <Shell orgName={org?.name}>
      <div className="space-y-6">
        {/* Back + hero card */}
        <Link
          href="/dashboard/corporate"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A3D7A] hover:text-[#2D1B4E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Volver al roster
        </Link>

        <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              {initials || '·'}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9B7CB8]">Empleado</p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#2D1B4E] leading-tight">
                {user.fullName}
              </h1>
              <p className="text-sm text-[#5A3D7A] flex items-center gap-2">
                <Mail className="w-4 h-4" strokeWidth={2} /> {user.email}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {user.studentData?.level && (
                <Pill label="Nivel actual" value={user.studentData.level} />
              )}
              {user.studentData?.joinedAt && (
                <Pill
                  label="Alta"
                  value={user.studentData.joinedAt.toDate().toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat
            icon={<Calendar className="w-4 h-4" strokeWidth={2.5} />}
            label="Clases asistidas"
            value={attended.toString()}
            sub={`${bookings.length} agendadas en total`}
          />
          <MiniStat
            icon={<Target className="w-4 h-4" strokeWidth={2.5} />}
            label="Asistencia"
            value={bookings.length > 0 ? `${attendance}%` : '—'}
            sub={bookings.length > 0 ? `${attended} asistidas · ${absent} ausentes` : 'Sin clases aún'}
          />
          <MiniStat
            icon={<Flame className="w-4 h-4" strokeWidth={2.5} />}
            label="Daily Practice"
            value={practice ? `${practice.currentStreak}` : '0'}
            sub={practice ? `Racha actual · ${practice.totalXp} XP totales` : 'No ha iniciado'}
            accent="orange"
          />
          <MiniStat
            icon={<Trophy className="w-4 h-4" strokeWidth={2.5} />}
            label="Mejor racha"
            value={practice ? `${practice.longestStreak}` : '0'}
            sub={practice?.lastPracticedAt ? `Último práctico: ${formatDate(practice.lastPracticedAt)}` : '—'}
            accent="amber"
          />
        </div>

        {/* Placement timeline */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#2D1B4E]">
            Placement tests
          </h2>
          {extrasLoading ? (
            <SectionCard><p className="text-sm text-[#9B7CB8]">Cargando historial…</p></SectionCard>
          ) : sortedPlacements.length === 0 ? (
            <SectionCard><p className="text-sm text-gray-500">Este empleado todavía no ha rendido ningún placement test.</p></SectionCard>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm overflow-hidden">
              {firstPlacement && latestPlacement && firstPlacement.id !== latestPlacement.id && (
                <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-[#F0E5FF] to-[#FFF] px-6 py-5 border-b border-[#E8D5F0]">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B7CB8]">Inicial</p>
                    <p className="font-serif text-3xl font-bold text-rose-700 leading-none mt-1">{firstPlacement.level ?? '—'}</p>
                    <p className="text-[11px] text-[#9B7CB8] mt-1">{firstPlacement.completedAt ? formatTs(firstPlacement.completedAt) : '—'}</p>
                  </div>
                  <ArrowLeft className="w-6 h-6 text-amber-500 rotate-180" />
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B7CB8]">Actual</p>
                    <p className="font-serif text-3xl font-bold text-emerald-700 leading-none mt-1">{latestPlacement.level ?? '—'}</p>
                    <p className="text-[11px] text-[#9B7CB8] mt-1">{latestPlacement.completedAt ? formatTs(latestPlacement.completedAt) : '—'}</p>
                  </div>
                </div>
              )}
              <ul className="divide-y divide-gray-100">
                {sortedPlacements.map((p, idx) => (
                  <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <GraduationCap className="w-5 h-5 text-[#9B7CB8] flex-shrink-0" strokeWidth={2} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2D1B4E]">
                          {idx === 0 ? 'Último placement' : idx === sortedPlacements.length - 1 ? 'Primer placement' : `Placement #${sortedPlacements.length - idx}`}
                        </p>
                        <p className="text-xs text-gray-500">{p.completedAt ? formatTs(p.completedAt) : 'Sin fecha'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {p.scoreLabel && <span className="text-xs text-gray-500 tabular-nums">{p.scoreLabel}</span>}
                      <span className="inline-flex items-center text-[11px] font-black px-2.5 py-1 rounded-full border bg-[#F0E5FF] text-[#5A3D7A] border-[#C8A8DC]">
                        {p.level ?? '—'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Class history */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#2D1B4E]">
            Historial de clases
          </h2>
          {extrasLoading ? (
            <SectionCard><p className="text-sm text-[#9B7CB8]">Cargando clases…</p></SectionCard>
          ) : sortedBookings.length === 0 ? (
            <SectionCard><p className="text-sm text-gray-500">Aún no tiene clases agendadas.</p></SectionCard>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {sortedBookings.slice(0, 10).map(b => (
                  <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#2D1B4E] truncate">
                        {b.topic || b.notes || 'Clase'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.weekStart ? formatTs(b.weekStart) : '—'}
                        {b.hour !== undefined && ` · ${String(b.hour).padStart(2, '0')}:${String(b.minute ?? 0).padStart(2, '0')}`}
                      </p>
                    </div>
                    <AttendancePill status={b.attendance} fallback={b.status} />
                  </li>
                ))}
              </ul>
              {sortedBookings.length > 10 && (
                <p className="text-center text-xs text-[#9B7CB8] py-2 border-t border-gray-100">
                  Mostrando las 10 más recientes · {sortedBookings.length} en total
                </p>
              )}
            </div>
          )}
        </section>

        {/* Report CTA */}
        <section className="bg-white/60 rounded-2xl border border-dashed border-[#E8D5F0] p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#2D1B4E] mb-1">Reporte académico</p>
            <p className="text-xs text-[#5A3D7A]/80 leading-relaxed">
              El reporte académico mensual de este empleado se genera a fin de mes con la interpretación de la profesora. Si lo necesitas antes, pídelo a tu representante de FriendlyTeaching.
            </p>
          </div>
        </section>
      </div>
    </Shell>
  );
}

// ── UI pieces ────────────────────────────────────────────────

function Shell({ children, orgName }: { children: React.ReactNode; orgName?: string }) {
  return (
    <div className="min-h-screen bg-[#FFFCF7] text-[#2D1B4E]">
      <div className="p-6">
        <TopBar
          title={orgName ? `${orgName} · Empleado` : 'Empleado'}
          subtitle="Detalle individual del progreso"
          breadcrumbs={[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Master Account',  href: '/dashboard/corporate' },
            { label: 'Empleado' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function Blocked({ body }: { body: string }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-md border border-[#E8D5F0] p-8 text-center">
      <p className="text-sm text-[#5A3D7A]">{body}</p>
      <Link
        href="/dashboard/corporate"
        className="inline-block mt-4 text-xs font-bold text-[#5A3D7A] underline"
      >
        Volver
      </Link>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-6">{children}</div>;
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F0E5FF] border border-[#C8A8DC] rounded-xl px-3 py-2 min-w-[90px]">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B7CB8]">{label}</p>
      <p className="font-serif text-base font-bold text-[#2D1B4E] leading-tight">{value}</p>
    </div>
  );
}

function MiniStat({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: 'orange' | 'amber';
}) {
  const text = accent === 'orange' ? 'text-orange-700' : accent === 'amber' ? 'text-amber-700' : 'text-[#2D1B4E]';
  const iconBg = accent === 'orange' ? 'bg-orange-100 text-orange-600' : accent === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-[#F0E5FF] text-[#5A3D7A]';
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      </div>
      <p className={`font-serif text-2xl font-bold leading-tight ${text}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}

function AttendancePill({ status, fallback }: { status?: string; fallback?: string }) {
  const label = status ?? fallback ?? 'pending';
  const tone =
    label === 'attended'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
  : label === 'absent'    ? 'bg-rose-50 text-rose-700 border-rose-200'
  : label === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
  : label === 'confirmed' ? 'bg-sky-50 text-sky-700 border-sky-200'
  : label === 'cancelled' ? 'bg-gray-100 text-gray-500 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';
  const human = {
    attended: 'Asistió', absent: 'Faltó', completed: 'Hecha',
    confirmed: 'Confirmada', cancelled: 'Cancelada', pending: 'Pendiente', late: 'Tarde',
  }[label] ?? label;
  return (
    <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tone}`}>
      {human}
    </span>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
function formatTs(ts: Timestamp): string {
  return ts.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}
