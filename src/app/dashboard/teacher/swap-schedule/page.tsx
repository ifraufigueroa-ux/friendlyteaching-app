// FriendlyTeaching.cl — One-time schedule swap utility
// Swaps Joselin ↔ Guillermo on Tuesdays and Thursdays:
//   Joselin  → 20:00   Guillermo → 19:00
'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth, db } from '@/lib/firebase/config';
import {
  collection, query, where, getDocs, writeBatch, serverTimestamp,
  doc, setDoc,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import TopBar from '@/components/layout/TopBar';

const TARGET = [
  { name: 'Joselin',   dow: 2, newHour: 20 },
  { name: 'Joselin',   dow: 4, newHour: 20 },
  { name: 'Guillermo', dow: 2, newHour: 19 },
  { name: 'Guillermo', dow: 4, newHour: 19 },
];

const DOW = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getThisMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

type BookingSnap = { id: string; studentName: string; dayOfWeek: number; hour: number; minute: number; isRecurring: boolean };

export default function SwapSchedulePage() {
  const { profile, firebaseUser } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'preview' | 'running' | 'done' | 'error'>('idle');
  const [found, setFound] = useState<BookingSnap[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const teacherId = firebaseUser?.uid ?? profile?.uid ?? auth.currentUser?.uid ?? '';

  async function handleScan() {
    setStatus('scanning');
    setLog([]);
    setFound([]);
    try {
      const snap = await getDocs(query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
      ));
      const candidates: BookingSnap[] = [];
      snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        if (data.status === 'cancelled') return;
        if (!['Joselin', 'Guillermo'].includes(data.studentName)) return;
        if (![2, 4].includes(data.dayOfWeek)) return;
        candidates.push({
          id: d.id,
          studentName: data.studentName,
          dayOfWeek: data.dayOfWeek,
          hour: data.hour,
          minute: data.minute ?? 0,
          isRecurring: data.isRecurring ?? false,
        });
      });
      setFound(candidates);
      setStatus('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
    }
  }

  async function handleSwap() {
    setStatus('running');
    const lines: string[] = [];
    try {
      const thisMonday = getThisMonday();
      const fromMs = thisMonday.getTime();

      // 1. Cancel all confirmed future bookings for Joselin & Guillermo on Tue/Thu
      const snap = await getDocs(query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
      ));

      const toCancel = snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        if (!['Joselin', 'Guillermo'].includes(data.studentName)) return false;
        if (![2, 4].includes(data.dayOfWeek)) return false;
        if (data.status !== 'confirmed') return false;
        const ws = data.weekStart;
        const wsMs = ws
          ? typeof ws.toDate === 'function' ? ws.toDate().getTime() : (ws.seconds ?? 0) * 1000
          : 0;
        return wsMs >= fromMs;
      });

      if (toCancel.length > 0) {
        const batch = writeBatch(db);
        toCancel.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data();
          lines.push(`❌ Cancelado: ${data.studentName} ${DOW[data.dayOfWeek]} ${data.hour}:00`);
          batch.update(d.ref, {
            status: 'cancelled',
            cancellationReason: 'Cambio de horario',
            cancelledAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      // 2. Create new bookings at target times
      // Get isRecurring from existing bookings (default true)
      const recurringMap: Record<string, boolean> = {};
      found.forEach(b => {
        const k = `${b.studentName}-${b.dayOfWeek}`;
        recurringMap[k] = b.isRecurring;
      });

      for (const t of TARGET) {
        const isRecurring = recurringMap[`${t.name}-${t.dow}`] ?? true;
        const ref = doc(collection(db, 'bookings'));
        await setDoc(ref, {
          teacherId,
          studentName: t.name,
          studentEmail: '',
          studentId: null,
          dayOfWeek: t.dow,
          hour: t.newHour,
          minute: 0,
          bookingType: 'class',
          status: 'confirmed',
          isRecurring,
          recurringName: null,
          notes: null,
          lessonId: null,
          weekStart: thisMonday,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Santiago',
          createdAt: serverTimestamp(),
        });
        lines.push(`✅ Creado: ${t.name} ${DOW[t.dow]} ${t.newHour}:00`);
      }

      setLog(lines);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setLog(lines);
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="🔄 Cambio de Horario"
        subtitle="Joselin → 20:00 · Guillermo → 19:00 (Martes y Jueves)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Cambio de Horario' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto space-y-4">

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">⚠️ Utilidad de un solo uso</p>
            <p>Cancela los turnos actuales de Joselin y Guillermo (Martes y Jueves) desde esta semana en adelante y crea los nuevos horarios:</p>
            <ul className="mt-2 space-y-0.5 list-disc list-inside">
              <li>Joselin → Martes 20:00 y Jueves 20:00</li>
              <li>Guillermo → Martes 19:00 y Jueves 19:00</li>
            </ul>
          </div>

          {status === 'idle' && (
            <button
              onClick={handleScan}
              className="w-full py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-2xl font-bold transition-colors"
            >
              Escanear horarios actuales
            </button>
          )}

          {status === 'scanning' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Escaneando...</p>
            </div>
          )}

          {status === 'preview' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="font-bold text-gray-700 text-sm mb-3">
                  Turnos encontrados ({found.length}):
                </p>
                {found.length === 0 ? (
                  <p className="text-gray-400 text-sm">No se encontraron turnos activos de Joselin o Guillermo en Martes/Jueves.</p>
                ) : (
                  <ul className="space-y-1">
                    {found.map(b => (
                      <li key={b.id} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-20 font-semibold">{b.studentName}</span>
                        <span className="text-gray-400">{DOW[b.dayOfWeek]}</span>
                        <span>{b.hour}:00</span>
                        {b.isRecurring && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Recurrente</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
                <p className="font-bold mb-2">Se crearán desde esta semana:</p>
                <ul className="space-y-0.5">
                  {TARGET.map((t, i) => (
                    <li key={i}>✅ {t.name} — {DOW[t.dow]} {t.newHour}:00</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSwap}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-bold transition-colors"
                >
                  Confirmar cambio
                </button>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aplicando cambios...</p>
            </div>
          )}

          {status === 'done' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="font-bold text-green-700 mb-3">✅ Cambio completado</p>
                <ul className="space-y-1">
                  {log.map((l, i) => <li key={i} className="text-sm text-gray-700">{l}</li>)}
                </ul>
              </div>
              <a
                href="/dashboard/teacher/schedule"
                className="block w-full py-3 text-center bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-2xl font-bold transition-colors"
              >
                Ver horario →
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="font-bold text-red-700 mb-2">Error</p>
                <p className="text-sm text-red-600">{errorMsg}</p>
                {log.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {log.map((l, i) => <li key={i} className="text-sm text-gray-600">{l}</li>)}
                  </ul>
                )}
              </div>
              <button onClick={() => setStatus('idle')} className="w-full py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50">
                Reintentar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
