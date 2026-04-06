// FriendlyTeaching.cl — Admin: Seed Teacher Schedule (one-time operation)
'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { seedTeacherSchedule } from '@/hooks/useBookings';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import TopBar from '@/components/layout/TopBar';

// ── Type ─────────────────────────────────────────────────────────────────────
type SlotDef = { dow: number; hour: number; minute?: number; name: string; isRecurring: boolean; bookingType?: 'class' | 'interview' };

// ── Ignacio's schedule ────────────────────────────────────────────────────────
// Red = Betzabé → isRecurring: false (única vez esta semana)
// 10:30 Joselin → registered at 10:00
const SCHEDULE_IGNACIO: SlotDef[] = [
  // ── Lunes ──
  { dow: 1, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 1, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 1, hour: 19, name: 'Felipes',    isRecurring: true  },
  // ── Martes ──
  { dow: 2, hour: 11, name: 'Andreina',   isRecurring: true  },
  { dow: 2, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 2, hour: 20, name: 'Guillermo',  isRecurring: true  },
  // ── Miércoles ──
  { dow: 3, hour: 11, name: 'Andreina',   isRecurring: true  },
  { dow: 3, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 3, hour: 16, name: 'Betzabé',    isRecurring: false }, // única vez
  { dow: 3, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 3, hour: 19, name: 'D. Ibaceta', isRecurring: true  },
  { dow: 3, hour: 20, name: 'Verónica',   isRecurring: true  },
  // ── Jueves ──
  { dow: 4, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 4, hour: 16, name: 'Betzabé',    isRecurring: false }, // única vez
  { dow: 4, hour: 18, name: 'Felipes',    isRecurring: true  },
  { dow: 4, hour: 19, name: 'C. Leon',    isRecurring: true  },
  { dow: 4, hour: 20, name: 'Guillermo',  isRecurring: true  },
  // ── Viernes ──
  { dow: 5, hour: 16, name: 'Abdón',      isRecurring: true  },
  { dow: 5, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 5, hour: 20, name: 'Verónica',   isRecurring: true  },
  // ── Sábado ──
  { dow: 6, hour:  9, name: 'Constanza L.', isRecurring: true  },
  { dow: 6, hour: 10, name: 'Joselin',      isRecurring: true  }, // 10:30 → 10:00
  { dow: 6, hour: 11, name: 'Guillermo',  isRecurring: true  },
  { dow: 6, hour: 12, name: 'Abdón',      isRecurring: true  },
  { dow: 6, hour: 13, name: 'Felipe',     isRecurring: true  },
];

// ── Aranxa's schedule ─────────────────────────────────────────────────────────
// Recurring = true for all except Dani Lanas and Carly (una vez)
const SCHEDULE_ARANXA: SlotDef[] = [
  // ── Lunes ──
  { dow: 1, hour: 9, minute: 30, name: 'Claudia Olave', isRecurring: true, bookingType: 'interview' },
  { dow: 1, hour: 17, name: 'Catalina',        isRecurring: true  },
  { dow: 1, hour: 18, name: 'Odette',          isRecurring: true  },
  { dow: 1, hour: 21, name: 'Beatriz Sepúlv',  isRecurring: true  },
  // ── Martes ──
  { dow: 2, hour: 10, name: 'Martin S',        isRecurring: true  },
  { dow: 2, hour: 11, name: 'Magdalena Barrios', isRecurring: true },
  { dow: 2, hour: 15, name: 'Dani Es',         isRecurring: true  },
  { dow: 2, hour: 16, name: 'Dani Lanas',      isRecurring: false },
  { dow: 2, hour: 17, name: 'Helena',          isRecurring: true  },
  { dow: 2, hour: 18, name: 'Juli Hur',        isRecurring: true  },
  // ── Miércoles ──
  { dow: 3, hour: 10, name: 'Barbara',         isRecurring: true  },
  { dow: 3, hour: 11, name: 'Maritza Quiero',  isRecurring: true  },
  { dow: 3, hour: 15, name: 'Cata Martinez',   isRecurring: true  },
  { dow: 3, hour: 16, name: 'Dani Lanas',      isRecurring: false },
  { dow: 3, hour: 17, name: 'Joaquín',         isRecurring: true  },
  { dow: 3, hour: 18, name: 'Mila Mo',         isRecurring: true  },
  { dow: 3, hour: 19, name: 'Andrée',          isRecurring: true  },
  { dow: 3, hour: 20, name: 'Beatriz Sepúlv',  isRecurring: true  },
  // ── Jueves ──
  { dow: 4, hour: 11, name: 'Elisa Cr',        isRecurring: true  },
  { dow: 4, hour: 12, name: 'Carly',           isRecurring: false },
  { dow: 4, hour: 16, name: 'Cata Martinez',   isRecurring: true  },
  { dow: 4, hour: 17, name: 'Helena',          isRecurring: true  },
  { dow: 4, hour: 18, name: 'Anto Ac',         isRecurring: true  },
  { dow: 4, hour: 19, name: 'Sofía Le',        isRecurring: true  },
  { dow: 4, hour: 20, name: 'Entrevis',        isRecurring: true  },
  // ── Viernes ──
  { dow: 5, hour: 10, name: 'Carly',           isRecurring: false },
  { dow: 5, hour: 11, name: 'Magdalena',       isRecurring: true  },
  { dow: 5, hour: 12, name: 'Dani Lanas',      isRecurring: false },
  { dow: 5, hour: 18, name: 'Fabricio',        isRecurring: true  },
  { dow: 5, hour: 19, name: 'Andrée',          isRecurring: true  },
  // ── Sábado ──
  { dow: 6, hour: 10, name: 'Carly',           isRecurring: false },
  { dow: 6, hour: 12, name: 'Benjamin',        isRecurring: true  },
];

// ── Schedule map: email → schedule ───────────────────────────────────────────
const SCHEDULES: Record<string, SlotDef[]> = {
  'ifraufigueroa@gmail.com': SCHEDULE_IGNACIO,
  'aranxa.brunam@gmail.com': SCHEDULE_ARANXA,
};

const TEACHER_NAMES: Record<string, string> = {
  'ifraufigueroa@gmail.com': 'Ignacio',
  'aranxa.brunam@gmail.com': 'Aranxa',
};

// ── Display helpers ───────────────────────────────────────────────────────────
const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS = [1, 2, 3, 4, 5, 6];

type Status = 'idle' | 'confirm' | 'running' | 'done' | 'error';

export default function SeedSchedulePage() {
  const { profile } = useAuthStore();
  const { currentWeekStart } = useScheduleStore();
  const [status, setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState('');
  const [result, setResult]   = useState<{ deleted: number; created: number } | null>(null);
  const [error, setError]     = useState('');

  const teacherUid   = profile?.uid ?? auth.currentUser?.uid ?? '';
  const teacherEmail = profile?.email ?? auth.currentUser?.email ?? '';
  const teacherName  = TEACHER_NAMES[teacherEmail] ?? teacherEmail;
  const SCHEDULE     = SCHEDULES[teacherEmail] ?? [];

  // ── History cleanup ───────────────────────────────────────────────────────
  type CleanupStatus = 'idle' | 'confirm' | 'running' | 'done' | 'error';
  const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus>('idle');
  const [cleanupCount, setCleanupCount]   = useState(0);
  const [cleanupError, setCleanupError]   = useState('');

  async function handleCleanupHistory() {
    if (!teacherUid) return;
    setCleanupStatus('running');
    try {
      // Delete all classHistory entries strictly before today (midnight local)
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      const snap = await getDocs(query(
        collection(db, 'classHistory'),
        where('teacherId', '==', teacherUid),
        where('date', '<', Timestamp.fromDate(todayMidnight)),
      ));

      if (snap.empty) { setCleanupCount(0); setCleanupStatus('done'); return; }

      const BATCH_CAP = 450;
      let batch = writeBatch(db);
      let ops = 0;
      for (const d of snap.docs) {
        batch.delete(d.ref);
        ops++;
        if (ops % BATCH_CAP === 0) { await batch.commit(); batch = writeBatch(db); }
      }
      if (ops % BATCH_CAP !== 0 || ops === 0) await batch.commit();
      setCleanupCount(snap.size);
      setCleanupStatus('done');
    } catch (e) {
      setCleanupError(e instanceof Error ? e.message : String(e));
      setCleanupStatus('error');
    }
  }

  const HOURS = [...new Set(SCHEDULE.map(s => s.hour))].sort((a, b) => a - b);

  // Build grid: { [hour]: { [dow]: entry | null } }
  const grid: Record<number, Record<number, SlotDef | null>> = {};
  for (const h of HOURS) {
    grid[h] = {};
    for (const d of DAYS) grid[h][d] = null;
  }
  for (const s of SCHEDULE) grid[s.hour][s.dow] = s;

  async function handleSeed() {
    if (!teacherUid) { setError('No se encontró el UID del profesor.'); setStatus('error'); return; }
    setStatus('running');
    setProgress('Iniciando…');
    try {
      const res = await seedTeacherSchedule(
        teacherUid,
        SCHEDULE,
        currentWeekStart,
        (msg) => setProgress(msg),
      );
      setResult(res);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  // ── Not configured yet ────────────────────────────────────────────────────
  if (SCHEDULE.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <TopBar
          title="Administración — Cargar Horario"
          subtitle={`Profesor: ${teacherName}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard/teacher' },
            { label: 'Administración' },
          ]}
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
            <p className="text-4xl">🗓️</p>
            <p className="font-bold text-gray-700 text-lg">Horario no configurado</p>
            <p className="text-sm text-gray-500">
              El horario de <strong>{teacherName}</strong> aún no ha sido cargado en el sistema.
              Proporciona los horarios y serán añadidos aquí para que puedas registrarlos.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-xs text-gray-500 font-mono">
              <p className="font-bold text-gray-600 mb-2">Formato esperado:</p>
              <p>{'{ dow: 1, hour: 10, name: "Estudiante", isRecurring: true }'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Administración — Cargar Horario"
        subtitle={`Profesor: ${teacherName} · Operación única: limpia y recarga el horario base`}
      />

      <div className="flex-1 p-6 overflow-auto space-y-6 max-w-5xl mx-auto w-full">

        {/* ── Info banner ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Esta operación es irreversible</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Se eliminarán <strong>todos</strong> los bookings actuales de <strong>{teacherName}</strong> y se crearán los{' '}
              <strong>{SCHEDULE.length} slots</strong> definidos abajo.
              Las clases recurrentes se generarán para las próximas <strong>52 semanas</strong>.
            </p>
          </div>
        </div>

        {/* ── Schedule preview table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <p className="font-bold text-gray-700 text-sm">Horario a registrar ({SCHEDULE.length} clases)</p>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C8A8DC] inline-block"/>↻ Recurrente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#FFB8D9] inline-block"/>• Única vez</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#FFB347] inline-block"/>🎙 Entrevista</span>
            </div>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F0E5FF]">
                <th className="px-3 py-2 text-left font-bold text-[#5A3D7A] w-16">Hora</th>
                {DAYS.map(d => (
                  <th key={d} className="px-2 py-2 text-center font-bold text-[#5A3D7A]">{DAY_NAMES[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h, i) => (
                <tr key={h} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 font-mono font-bold text-gray-500 text-xs">{h}:00</td>
                  {/* Note: :30 sub-slots appear as separate rows in this preview */}
                  {DAYS.map(d => {
                    const s = grid[h][d];
                    return (
                      <td key={d} className="px-1 py-1 text-center">
                        {s ? (
                          <span className={`inline-block px-2 py-1 rounded-lg font-semibold leading-tight ${
                            s.bookingType === 'interview'
                              ? s.isRecurring ? 'bg-[#FFB347] text-white' : 'bg-[#FFD4A8] text-[#7A3B00]'
                              : s.isRecurring ? 'bg-[#C8A8DC] text-white' : 'bg-[#FFB8D9] text-[#7A0040]'
                          }`}>
                            {s.name}
                            {s.minute ? <span className="block text-[9px] opacity-80">{s.hour}:{String(s.minute).padStart(2,'0')}</span> : null}
                            {s.bookingType === 'interview' && <span className="block text-[9px] opacity-80">entrevista</span>}
                            {!s.isRecurring && s.bookingType !== 'interview' && <span className="block text-[9px] opacity-80">única vez</span>}
                          </span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Action area ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

          {status === 'idle' && (
            <button
              onClick={() => setStatus('confirm')}
              className="w-full py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
            >
              Registrar este horario →
            </button>
          )}

          {status === 'confirm' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 text-center">
                ¿Confirmas que deseas <span className="text-red-600">eliminar todo el horario actual de {teacherName}</span> y reemplazarlo?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSeed}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Sí, limpiar y registrar
                </button>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">{progress}</p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="text-center space-y-3">
              <p className="text-4xl">🎉</p>
              <p className="font-bold text-[#5A3D7A] text-lg">¡Horario registrado exitosamente!</p>
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-red-500">{result.deleted}</p>
                  <p className="text-xs text-gray-500">bookings eliminados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-[#5A3D7A]">{result.created}</p>
                  <p className="text-xs text-gray-500">clases creadas</p>
                </div>
              </div>
              <a
                href="/dashboard/teacher/schedule"
                className="inline-block mt-2 px-6 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
              >
                Ver horario →
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="text-4xl">❌</p>
              <p className="font-bold text-red-600 text-sm">Error al registrar el horario</p>
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Volver a intentar
              </button>
            </div>
          )}
        </div>

        {/* ── History cleanup ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div>
            <p className="font-bold text-gray-700 text-sm">🗑️ Limpiar historial antiguo</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Elimina todos los registros de <code>classHistory</code> con fecha anterior a hoy.
            </p>
          </div>

          {cleanupStatus === 'idle' && (
            <button
              onClick={() => setCleanupStatus('confirm')}
              className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Eliminar registros anteriores a hoy →
            </button>
          )}

          {cleanupStatus === 'confirm' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 text-center">
                ¿Confirmas que deseas <span className="text-red-600 font-bold">eliminar todos los registros anteriores a hoy</span>?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCleanupStatus('idle')}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleCleanupHistory}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </div>
          )}

          {cleanupStatus === 'running' && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Eliminando registros…</p>
            </div>
          )}

          {cleanupStatus === 'done' && (
            <div className="text-center space-y-1">
              <p className="text-2xl">✅</p>
              <p className="text-sm font-bold text-gray-700">
                {cleanupCount === 0 ? 'No había registros anteriores a hoy.' : `${cleanupCount} registros eliminados.`}
              </p>
              <button onClick={() => setCleanupStatus('idle')}
                className="text-xs text-gray-400 underline">Cerrar</button>
            </div>
          )}

          {cleanupStatus === 'error' && (
            <div className="text-center space-y-1">
              <p className="text-xs text-red-500">{cleanupError}</p>
              <button onClick={() => setCleanupStatus('idle')}
                className="text-xs text-gray-400 underline">Reintentar</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
