// FriendlyTeaching.cl — Corporate drill-down (editorial + mascot)
//
// Same visual language as the Master Account landing: Fraunces headings,
// mascot PNGs on stat cards, placement timeline with before→after arrow,
// per-lesson skill chips.

'use client';
import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, Award, TrendingUp } from 'lucide-react';
import {
  collection, doc, getDoc, getDocs, query, where,
  Timestamp, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useMyOrganization, useUserProfile } from '@/hooks/useOrganization';
import type { Booking, LessonLevel } from '@/types/firebase';

interface Props { params: Promise<{ uid: string }>; }

interface PlacementRow {
  id:         string;
  level:      LessonLevel | null;
  completedAt: Timestamp | null;
  score?: number;
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
      setPlacements(pSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        return {
          id: d.id,
          level: (data.level ?? null) as LessonLevel | null,
          completedAt: (data.completedAt ?? data.createdAt ?? null) as Timestamp | null,
          score: typeof data.score === 'number' ? data.score : undefined,
        };
      }));
      if (prSnap.exists()) {
        const d = prSnap.data();
        setPractice({
          currentStreak:   d.currentStreak ?? 0,
          longestStreak:   d.longestStreak ?? 0,
          totalXp:         d.totalXp ?? 0,
          currentLevel:    d.currentLevel ?? null,
          lastPracticedAt: d.lastPracticedAt ?? null,
        });
      } else setPractice(null);
      setExtrasLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.warn('[CorporateStudentPage]', err);
      setExtrasLoading(false);
    });
    return () => { cancelled = true; };
  }, [uid]);

  if (orgLoading || userLoading) return <Shell><Center>Cargando…</Center></Shell>;
  if (!isCorporateAdmin) return <Shell><Center>Esta vista es solo para cuentas corporativas.</Center></Shell>;
  if (!user || user.role !== 'student') return <Shell><Center>Empleado no encontrado.</Center></Shell>;

  const belongsToOrg = org?.studentUids.includes(user.uid);
  if (!belongsToOrg) return <Shell><Center>Este empleado no está asignado a tu organización.</Center></Shell>;

  const attended = bookings.filter(b => b.attendance === 'attended').length;
  const absent   = bookings.filter(b => b.attendance === 'absent').length;
  const attendancePct = (attended + absent) > 0 ? Math.round((attended / (attended + absent)) * 100) : 0;
  const sortedBookings = [...bookings].sort((a, b) => (b.weekStart?.toMillis() ?? 0) - (a.weekStart?.toMillis() ?? 0));
  const sortedPlacements = [...placements].sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0));
  const first = sortedPlacements[sortedPlacements.length - 1] ?? null;
  const last  = sortedPlacements[0] ?? null;

  const initials = user.fullName.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');
  const avatarBg = avatarGradient(user.uid);
  const joinedAt = user.studentData?.joinedAt?.toDate() ?? null;
  const joinedLabel = joinedAt ? joinedAt.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }).replace('.', '') : '—';

  return (
    <Shell>
      <div className="space-y-8">
        {/* Back link */}
        <Link href="/dashboard/corporate" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A3D7A] hover:text-[#2D1B4E] transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Volver al roster
        </Link>

        {/* Hero card */}
        <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm p-7 md:p-9">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full text-white font-bold text-3xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: avatarBg }}>
              {initials || '·'}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9B7CB8]">Empleado</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-[1.05]">
                {user.fullName}
              </h1>
              <p className="text-sm text-[#5A3D7A] inline-flex items-center gap-2">
                <Mail className="w-4 h-4" strokeWidth={2} /> {user.email}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap flex-shrink-0">
              <HeroPill label="Nivel actual" value={user.studentData?.level ?? last?.level ?? '—'} accent icon={<Award className="w-3.5 h-3.5" strokeWidth={2.5} />} />
              <HeroPill label="Alta" value={joinedLabel} icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} />} />
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <MiniStat
            label="Clases asistidas"
            value={attended.toString()}
            sub={`${bookings.length} agendadas en total`}
            iconBg="#F0E5FF"
            iconColor="#5A3D7A"
            iconLucide={<CalendarIcon />}
            mascot="/sidebar-icons/historial-clases.png"
          />
          <MiniStat
            label="Asistencia"
            value={bookings.length > 0 ? `${attendancePct}%` : '—'}
            sub={bookings.length > 0 ? `${attended} asistidas · ${absent} ausentes` : 'Sin clases'}
            iconBg="#DCFCE7"
            iconColor="#059669"
            iconLucide={<CheckIcon />}
            mascot="/sidebar-icons/tareas.png"
            valueColor="#059669"
          />
          <MiniStat
            label="Daily Practice"
            value={practice ? practice.currentStreak.toString() : '0'}
            sub={practice ? `Racha actual · ${practice.totalXp.toLocaleString()} XP totales` : 'No ha iniciado'}
            iconBg="#FFE4D6"
            iconColor="#C2410C"
            iconLucide={<FlameIcon />}
            mascot="/sidebar-icons/actividades.png"
            valueColor="#C2410C"
          />
          <MiniStat
            label="Mejor racha"
            value={practice ? practice.longestStreak.toString() : '0'}
            sub={practice?.lastPracticedAt ? `Último práctico: ${formatIso(practice.lastPracticedAt)}` : '—'}
            iconBg="#FEF3C7"
            iconColor="#B45309"
            iconLucide={<TrophyIcon />}
            mascot="/sidebar-icons/palabra-dia.png"
            valueColor="#B45309"
          />
        </div>

        {/* Placement tests */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] inline-flex items-center gap-3">
            Placement tests
            <span className="w-7 h-7 rounded-lg bg-[#F0E5FF] inline-flex items-center justify-center">📋</span>
          </h2>
          {extrasLoading ? (
            <Panel>Cargando historial…</Panel>
          ) : sortedPlacements.length === 0 ? (
            <Panel>Este empleado todavía no ha rendido ningún placement test.</Panel>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
              {first && last && first.id !== last.id && (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 md:px-7 py-5 bg-gradient-to-r from-[#F6EBFF] via-white to-[#F6EBFF] border-b border-[#E8D5F0]">
                  {/* Left: label */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center flex-shrink-0">🎓</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#2D1B4E] leading-tight">Último placement</p>
                      <p className="text-xs text-[#9B7CB8] mt-0.5">{last.completedAt ? formatTs(last.completedAt) : '—'}</p>
                    </div>
                  </div>
                  {/* Center: before → after */}
                  <div className="flex items-center gap-6 md:gap-8 flex-1 justify-center">
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B7CB8]">Inicial</p>
                      <p className="font-serif text-4xl font-bold text-rose-700 leading-none mt-1">{first.level ?? '—'}</p>
                      <p className="text-[10px] text-[#9B7CB8] mt-1 tabular-nums">{first.completedAt ? formatTs(first.completedAt, true) : '—'}</p>
                    </div>
                    <ArrowRight className="w-7 h-7 text-amber-500 flex-shrink-0" strokeWidth={2.5} />
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B7CB8]">Actual</p>
                      <p className="font-serif text-4xl font-bold text-emerald-700 leading-none mt-1">{last.level ?? '—'}</p>
                      <p className="text-[10px] text-[#9B7CB8] mt-1 tabular-nums">{last.completedAt ? formatTs(last.completedAt, true) : '—'}</p>
                    </div>
                  </div>
                  {/* Right: score + pill */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {last.score !== undefined && (
                      <span className="text-sm font-bold text-[#5A3D7A] tabular-nums">{last.score}%</span>
                    )}
                    <LevelPill level={last.level} />
                  </div>
                </div>
              )}
              <ul className="divide-y divide-gray-100">
                {sortedPlacements.map((p, idx) => {
                  const isLast = idx === 0;
                  const isFirst = idx === sortedPlacements.length - 1;
                  const label = isLast ? 'Último placement' : isFirst ? 'Primer placement' : `Placement #${sortedPlacements.length - idx}`;
                  return (
                    <li key={p.id} className="px-5 md:px-7 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#F6EBFF] text-[#5A3D7A] flex items-center justify-center text-base flex-shrink-0">{isFirst ? '🥇' : isLast ? '🎓' : '📝'}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#2D1B4E]">{label}</p>
                          <p className="text-xs text-gray-500">{p.completedAt ? formatTs(p.completedAt) : 'Sin fecha'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {p.score !== undefined && <span className="text-xs text-gray-500 tabular-nums">{p.score}%</span>}
                        <LevelPill level={p.level} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Class history */}
        <section className="space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] inline-flex items-center gap-3">
            Historial de clases
            <span className="w-7 h-7 rounded-lg bg-[#F0E5FF] inline-flex items-center justify-center">📚</span>
          </h2>
          {extrasLoading ? (
            <Panel>Cargando clases…</Panel>
          ) : sortedBookings.length === 0 ? (
            <Panel>Aún no tiene clases agendadas.</Panel>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {sortedBookings.slice(0, 10).map(b => (
                  <li key={b.id} className="px-5 md:px-7 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SkillIcon topic={b.topic} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2D1B4E] truncate">
                          {b.topic || b.notes || 'Clase'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {b.weekStart ? formatTs(b.weekStart) : '—'}
                          {b.hour !== undefined && ` · ${String(b.hour).padStart(2, '0')}:${String(b.minute ?? 0).padStart(2, '0')}`}
                        </p>
                      </div>
                    </div>
                    <AttendancePill status={b.attendance} fallback={b.status} />
                  </li>
                ))}
              </ul>
              {sortedBookings.length > 10 && (
                <p className="text-right text-xs text-[#9B7CB8] py-3 px-7 border-t border-gray-100 italic">
                  Mostrando las 10 más recientes · {sortedBookings.length} en total
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

// ── Shell + pieces ───────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFCF7] text-[#2D1B4E]">
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-[#9B7CB8] py-20">{children}</p>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm p-7 text-sm text-[#5A3D7A]">{children}</div>;
}

function HeroPill({
  label, value, accent, icon,
}: { label: string; value: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`${accent ? 'bg-[#F0E5FF] border-[#C8A8DC]' : 'bg-white border-[#E8D5F0]'} border rounded-2xl px-4 py-3 min-w-[110px] relative`}>
      {accent && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white shadow">★</span>
      )}
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#9B7CB8] inline-flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`font-serif text-xl font-bold leading-tight mt-1 ${accent ? 'text-[#5A3D7A]' : 'text-[#2D1B4E]'}`}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  iconLucide, iconBg, iconColor, label, value, sub, mascot, valueColor,
}: {
  iconLucide: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  mascot: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
            {iconLucide}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B7CB8] leading-tight">
            {label}
          </p>
        </div>
        <p className="font-serif text-5xl font-bold leading-none mb-1.5 tracking-tight" style={{ color: valueColor ?? '#2D1B4E' }}>
          {value}
        </p>
        <p className="text-[11px] text-[#5A3D7A]/70 leading-snug">{sub}</p>
      </div>
      <div className="flex-shrink-0 w-14 h-14 select-none pointer-events-none">
        <Image src={mascot} alt="" width={56} height={56} className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

function LevelPill({ level }: { level: LessonLevel | null | undefined }) {
  if (!level) return <span className="text-xs text-gray-400">—</span>;
  const tone =
    level === 'A0' ? 'bg-slate-50 text-slate-700 border-slate-200'
  : level === 'A1' ? 'bg-sky-50 text-sky-700 border-sky-200'
  : level === 'A2' ? 'bg-teal-50 text-teal-700 border-teal-200'
  : level === 'B1' || level === 'B1+' ? 'bg-violet-50 text-violet-700 border-violet-200'
  : level === 'B2' ? 'bg-rose-50 text-rose-700 border-rose-200'
                   : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center text-[12px] font-black px-3 py-1.5 rounded-full border ${tone}`}>
      {level}
    </span>
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
  const dot = label === 'attended' || label === 'completed' ? '✓' : label === 'absent' ? '✗' : '•';
  return (
    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${tone}`}>
      {human} <span className="opacity-80">{dot}</span>
    </span>
  );
}

/** Guess the skill from the lesson topic to pick a per-row colored chip. */
function SkillIcon({ topic }: { topic?: string }) {
  const t = (topic ?? '').toLowerCase();
  let bg = '#F0E5FF';
  let emoji = '📖';
  if (/listen|audio|podcast/.test(t))        { bg = '#DBEAFE'; emoji = '🎧'; }
  else if (/writ|email|report|essay/.test(t))     { bg = '#FEF3C7'; emoji = '✏️'; }
  else if (/speak|presentation|negoti|meeting/.test(t)) { bg = '#FEE2E2'; emoji = '🎙️'; }
  else if (/grammar|tense|verb|modal|conditional/.test(t)) { bg = '#E0F2FE'; emoji = '📐'; }
  else if (/read|comprehension|article/.test(t))  { bg = '#FFE4D6'; emoji = '📖'; }
  else if (/vocab|phrasal|idiom|business/.test(t)) { bg = '#F0E5FF'; emoji = '💬'; }
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>
      {emoji}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function avatarGradient(uid: string): string {
  const palettes = [
    'linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%)',
    'linear-gradient(135deg, #4C1D95 0%, #7E22CE 100%)',
    'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    'linear-gradient(135deg, #7B2CBF 0%, #C77DFF 100%)',
    'linear-gradient(135deg, #312E81 0%, #6366F1 100%)',
  ];
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

function formatIso(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
function formatTs(ts: Timestamp, short = false): string {
  return ts.toDate().toLocaleDateString('es-CL', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Tiny inline icons ────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
