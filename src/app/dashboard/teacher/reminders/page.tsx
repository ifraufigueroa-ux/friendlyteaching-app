// FriendlyTeaching.cl — Class Reminders Page
// Send email + WhatsApp reminders to students before their upcoming classes.
'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { useBookings } from '@/hooks/useBookings';
import { useScheduleStore } from '@/store/scheduleStore';
import { BASE_SCHEDULE, type ScheduleEntry } from '@/data/teacherSchedule';
import TopBar from '@/components/layout/TopBar';
import type { FTUser } from '@/types/firebase';

const DAY_ES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// WhatsApp pre-filled message templates
function buildWhatsAppMsg(
  studentName: string,
  teacherName: string,
  day: string,
  hour: number,
  hoursUntil: number,
): string {
  const when = hoursUntil <= 1
    ? `en 1 hora (${hour}:00)`
    : `mañana ${day} a las ${hour}:00`;
  return encodeURIComponent(
    `¡Hola ${studentName}! 👋 Te recuerdo que tenemos clase de inglés ${when}. ¡Nos vemos! 🎓\n— ${teacherName}`
  );
}

function buildWhatsAppUrl(phone: string, msg: string): string {
  // Normalize Chilean numbers: remove spaces, leading 0, add country code if missing
  const clean = phone.replace(/\s+/g, '').replace(/^0/, '');
  const normalized = clean.startsWith('+') ? clean.replace('+', '') : `56${clean}`;
  return `https://wa.me/${normalized}?text=${msg}`;
}

// ── Reminder row ───────────────────────────────────────────────────────────────

function ReminderRow({
  entry,
  student,
  teacherName,
  teacherEmail,
}: {
  entry: ScheduleEntry & { matchedStudent?: FTUser };
  student: FTUser | null;
  teacherName: string;
  teacherEmail: string;
}) {
  const [sending24, setSending24] = useState(false);
  const [sending1, setSending1] = useState(false);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const day = DAY_ES[entry.dow] ?? '';
  const phone = student?.phone ?? '';
  const email = student?.email ?? '';

  async function sendEmail(hoursUntil: number) {
    const key = `email-${hoursUntil}`;
    if (!email) return;
    const isSending = hoursUntil === 24 ? sending24 : sending1;
    if (isSending) return;
    if (hoursUntil === 24) setSending24(true); else setSending1(true);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'class_reminder',
          to: email,
          studentName: entry.name,
          teacherName,
          classDay: day,
          classHour: entry.hour,
          hoursUntil,
        }),
      });
      setSent(s => ({ ...s, [key]: true }));
    } finally {
      if (hoursUntil === 24) setSending24(false); else setSending1(false);
    }
  }

  const wa24 = phone ? buildWhatsAppUrl(phone, buildWhatsAppMsg(entry.name, teacherName, day, entry.hour, 24)) : '';
  const wa1  = phone ? buildWhatsAppUrl(phone, buildWhatsAppMsg(entry.name, teacherName, day, entry.hour, 1)) : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
            {entry.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm">{entry.name}</p>
            <p className="text-xs text-gray-400">
              {day} · {entry.hour}:00 – {entry.hour + 1}:00
              {entry.isRecurring ? ' · ↻' : ' · •'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {phone && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">📱 WhatsApp</span>}
          {email && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">📧 Email</span>}
          {!phone && !email && <span className="text-[10px] text-gray-400 italic">Sin contacto</span>}
        </div>
      </div>

      {/* Reminder buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* 24h reminder */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">24 horas antes</p>
          <div className="flex gap-1.5">
            {phone && (
              <a
                href={wa24}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] rounded-lg text-[10px] font-bold text-center transition-colors"
              >
                📱 WhatsApp
              </a>
            )}
            {email && (
              <button
                onClick={() => sendEmail(24)}
                disabled={sending24 || !!sent['email-24']}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  sent['email-24']
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50'
                }`}
              >
                {sent['email-24'] ? '✓ Enviado' : sending24 ? '...' : '📧 Email'}
              </button>
            )}
          </div>
        </div>

        {/* 1h reminder */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">1 hora antes</p>
          <div className="flex gap-1.5">
            {phone && (
              <a
                href={wa1}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] rounded-lg text-[10px] font-bold text-center transition-colors"
              >
                📱 WhatsApp
              </a>
            )}
            {email && (
              <button
                onClick={() => sendEmail(1)}
                disabled={sending1 || !!sent['email-1']}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  sent['email-1']
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50'
                }`}
              >
                {sent['email-1'] ? '✓ Enviado' : sending1 ? '...' : '📧 Email'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { profile } = useAuthStore();
  const { currentWeekStart } = useScheduleStore();
  const teacherId = profile?.uid ?? '';
  const teacherName = profile?.fullName ?? 'Tu profesor';
  const teacherEmail = profile?.email ?? '';

  const { students } = useStudents();
  const { bookings } = useBookings(teacherId, currentWeekStart);

  const [dayFilter, setDayFilter] = useState<number | null>(null);

  const today = new Date();
  const todayDow = today.getDay() === 0 ? 7 : today.getDay();

  // Build class list: combine Firestore bookings + BASE_SCHEDULE fallback
  const scheduleEntries: ScheduleEntry[] = useMemo(() => {
    if (bookings.length > 0) {
      return bookings
        .filter(b => b.status === 'confirmed')
        .map(b => ({
          dow: b.dayOfWeek,
          hour: b.hour,
          name: b.studentName,
          isRecurring: b.isRecurring,
        }));
    }
    return BASE_SCHEDULE;
  }, [bookings]);

  // Only show upcoming classes (today and later this week)
  const upcoming = useMemo(() =>
    scheduleEntries
      .filter(e => e.dow >= todayDow)
      .sort((a, b) => a.dow - b.dow || a.hour - b.hour),
    [scheduleEntries, todayDow]
  );

  const filtered = dayFilter !== null ? upcoming.filter(e => e.dow === dayFilter) : upcoming;

  // Map student names to FTUser objects
  function findStudent(name: string): FTUser | null {
    return students.find(s =>
      s.fullName?.toLowerCase().includes(name.split(' ')[0].toLowerCase())
    ) ?? null;
  }

  const availableDays = [...new Set(upcoming.map(e => e.dow))].sort();

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="🔔 Recordatorios"
        subtitle="Envía recordatorios de clase por WhatsApp o email"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Recordatorios' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Info banner */}
        <div className="bg-[#F0E5FF] border border-[#C8A8DC] rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div className="text-xs text-[#5A3D7A]">
            <p className="font-bold mb-1">Recordatorios manuales</p>
            <p className="text-[#7A5A9A]">
              Los botones de WhatsApp abren una conversación pre-redactada en tu app de WhatsApp.
              Los botones de Email envían directamente usando Resend (requiere configurar RESEND_API_KEY).
              Para recordatorios automáticos, configura un Cloud Function de Firebase.
            </p>
          </div>
        </div>

        {/* Day filter */}
        {availableDays.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDayFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${dayFilter === null ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'}`}
            >
              Esta semana ({upcoming.length})
            </button>
            {availableDays.map(d => (
              <button
                key={d}
                onClick={() => setDayFilter(dayFilter === d ? null : d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  dayFilter === d ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                }`}
              >
                {DAY_ES[d]} ({upcoming.filter(e => e.dow === d).length})
              </button>
            ))}
          </div>
        )}

        {/* Class list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-500 text-sm">No hay más clases esta semana.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, i) => (
              <div key={i}>
                {/* Day separator */}
                {(i === 0 || filtered[i - 1].dow !== entry.dow) && (
                  <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-2 mt-3 first:mt-0">
                    {DAY_ES[entry.dow]} {entry.dow === todayDow ? '· hoy' : ''}
                  </p>
                )}
                <ReminderRow
                  entry={entry}
                  student={findStudent(entry.name)}
                  teacherName={teacherName}
                  teacherEmail={teacherEmail}
                />
              </div>
            ))}
          </div>
        )}

        {/* Students missing contact info */}
        {(() => {
          const missing = upcoming.filter(e => {
            const s = findStudent(e.name);
            return s && !s.phone && !s.email;
          });
          if (missing.length === 0) return null;
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Estudiantes sin datos de contacto</p>
              <p className="text-xs text-amber-600">
                {missing.map(e => e.name).join(', ')} — pídeles que actualicen su perfil.
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
