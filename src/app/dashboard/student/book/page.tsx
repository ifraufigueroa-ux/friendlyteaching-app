// FriendlyTeaching.cl — Student Booking Page (authenticated)
// Registered students with an approved teacher request new class time slots.
// Shows teacher's schedule with available / blocked slots — no student names.
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection, addDoc, serverTimestamp,
  query, where, onSnapshot,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { Booking } from '@/types/firebase';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS      = [1, 2, 3, 4, 5, 6];                      // Mon–Sat
const HOURS     = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00–21:00

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlotKey { dow: number; hour: number }

interface StudentBookingRequest {
  id: string;
  requestedDow: number;
  requestedHour: number;
  isRecurring: boolean;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slotId(dow: number, hour: number) { return `${dow}-${hour}`; }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentBookPage() {
  const { firebaseUser, role, isInitialized, profile } = useAuthStore();
  const router = useRouter();

  const teacherId    = profile?.studentData?.approvedByTeacherId ?? '';
  const studentName  = profile?.fullName ?? '';
  const studentEmail = profile?.email    ?? '';

  // ── Schedule data ─────────────────────────────────────────────────────────

  // Set of "dow-hour" strings that teacher's recurring bookings occupy
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());
  const [schedLoading, setSchedLoading]   = useState(true);

  // My own pending/approved requests (to avoid duplicates + show status)
  const [myRequests, setMyRequests] = useState<StudentBookingRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────

  const [selected,    setSelected]    = useState<SlotKey | null>(null);
  const [isRecurring, setIsRecurring] = useState(true);
  const [message,     setMessage]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  // ── Auth guard ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isInitialized) return;
    if (!firebaseUser)                router.replace('/auth/login');
    else if (role === 'teacher')      router.replace('/dashboard/teacher');
  }, [isInitialized, firebaseUser, role, router]);

  // ── Load teacher recurring bookings → occupied map ───────────────────────

  useEffect(() => {
    if (!teacherId) { setSchedLoading(false); return; }

    // Query all bookings — filter client-side for this teacher's recurring slots
    const q = query(collection(db, 'bookings'));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const slots = new Set<string>();
        snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          const b = d.data() as Booking;
          if (
            b.teacherId === teacherId &&
            b.isRecurring &&
            b.status !== 'cancelled'
          ) {
            slots.add(slotId(b.dayOfWeek, b.hour));
          }
        });
        setOccupiedSlots(slots);
        setSchedLoading(false);
      },
      () => setSchedLoading(false),
    );
    return unsub;
  }, [teacherId]);

  // ── Load student's own booking requests ──────────────────────────────────

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, 'bookingRequests'),
      where('studentId', '==', firebaseUser.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setMyRequests(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as StudentBookingRequest)),
        );
        setReqLoading(false);
      },
      () => setReqLoading(false),
    );
    return unsub;
  }, [firebaseUser]);

  // ── Submit booking request ────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selected || !firebaseUser || !teacherId) return;
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'bookingRequests'), {
        studentId:    firebaseUser.uid,
        teacherId,
        studentName,
        studentEmail,
        requestedDow:  selected.dow,
        requestedHour: selected.hour,
        isRecurring,
        message:      message.trim(),
        status:       'pending',
        createdAt:    serverTimestamp(),
      });
      setDone(true);
    } catch {
      setError('Hubo un error. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [selected, firebaseUser, teacherId, studentName, studentEmail, isRecurring, message]);

  // ── Derived state ─────────────────────────────────────────────────────────

  // Map of slot key → pending request (so we can show "Solicitado")
  const pendingMap = new Map<string, StudentBookingRequest>();
  myRequests.forEach((r) => {
    if (r.status === 'pending' || r.status === 'approved') {
      pendingMap.set(slotId(r.requestedDow, r.requestedHour), r);
    }
  });

  const loading = schedLoading || reqLoading || !isInitialized;

  // ── Render states ─────────────────────────────────────────────────────────

  if (!isInitialized || !firebaseUser) return null;

  if (!teacherId) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-lg font-bold text-[#5A3D7A] mb-2">Sin profesor asignado</h2>
          <p className="text-sm text-gray-500 mb-4">
            Aún no tienes un profesor asignado. Una vez que tu cuenta sea aprobada podrás solicitar clases.
          </p>
          <Link
            href="/dashboard/student"
            className="inline-block px-5 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold hover:bg-[#9B7CB8] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
          <h2 className="text-xl font-extrabold text-[#5A3D7A] mb-2">¡Solicitud enviada!</h2>
          <p className="text-sm text-gray-500 mb-1">
            Has solicitado el horario del{' '}
            <strong>{DAY_NAMES[selected?.dow ?? 1]} a las {selected?.hour}:00</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Tu profesor revisará la solicitud y te confirmará por correo o WhatsApp.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setDone(false); setSelected(null); setMessage(''); }}
              className="w-full py-2.5 bg-[#F0E5FF] text-[#5A3D7A] rounded-xl text-sm font-bold hover:bg-[#E0D5FF] transition-colors"
            >
              Solicitar otro horario
            </button>
            <Link
              href="/dashboard/student/schedule"
              className="w-full py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold hover:bg-[#9B7CB8] transition-colors text-center"
            >
              Ver mi horario
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Build the schedule grid ───────────────────────────────────────────────

  // Find which days actually have at least some occupied slots
  // (to show a more compact view)
  const activeDays = DAYS.filter((d) =>
    HOURS.some((h) => occupiedSlots.has(slotId(d, h))),
  );
  // If no data yet (teacher has no recurring bookings), show all days
  const displayDays = activeDays.length > 0 ? activeDays : DAYS;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FFFCF7]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard/student/schedule" className="text-[#9B7CB8] hover:text-[#5A3D7A] text-sm font-semibold transition-colors">
            ← Mi horario
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#5A3D7A]">📅 Solicitar clase</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Elige un horario disponible y tu profesor confirmará la solicitud.
        </p>
      </div>

      {/* Legend */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex flex-wrap gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#F0E5FF] border-2 border-[#C8A8DC]" />
            <span className="text-gray-600">Disponible — puedes solicitar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gray-100 border border-gray-200" />
            <span className="text-gray-400">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-50 border-2 border-amber-300" />
            <span className="text-amber-600">Solicitud pendiente</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Schedule Grid ──────────────────────────────────────────────── */}
          <div className="px-6 mb-6 overflow-x-auto">
            <div
              className="inline-grid gap-1.5 min-w-full"
              style={{ gridTemplateColumns: `auto repeat(${displayDays.length}, minmax(68px, 1fr))` }}
            >
              {/* Header row — day names */}
              <div />
              {displayDays.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">
                  {DAY_SHORT[d]}
                </div>
              ))}

              {/* Hour rows */}
              {HOURS.map((h) => {
                // Only show hour row if at least one cell has content (occupied OR available near occupied times)
                const hasAny = displayDays.some(
                  (d) => occupiedSlots.has(slotId(d, h)) || pendingMap.has(slotId(d, h)),
                );
                if (!hasAny && activeDays.length > 0) return null;

                return (
                  <>
                    {/* Hour label */}
                    <div
                      key={`h-${h}`}
                      className="flex items-center justify-end pr-2 text-[10px] font-bold text-gray-300 select-none"
                    >
                      {h}:00
                    </div>

                    {/* Cells */}
                    {displayDays.map((d) => {
                      const key   = slotId(d, h);
                      const isOcc = occupiedSlots.has(key);
                      const isPending = pendingMap.has(key);
                      const isSel = selected?.dow === d && selected?.hour === h;

                      if (isOcc) {
                        // Blocked slot
                        return (
                          <div
                            key={key}
                            className="rounded-xl h-10 bg-gray-100 border border-gray-200 flex items-center justify-center"
                            title="Ocupado"
                          >
                            <span className="text-gray-300 text-sm select-none">🔒</span>
                          </div>
                        );
                      }

                      if (isPending) {
                        const req = pendingMap.get(key)!;
                        return (
                          <div
                            key={key}
                            className="rounded-xl h-10 bg-amber-50 border-2 border-amber-300 flex items-center justify-center"
                            title={`Solicitud ${req.status === 'approved' ? 'aprobada' : 'pendiente'}`}
                          >
                            <span className="text-amber-500 text-[10px] font-bold select-none">
                              {req.status === 'approved' ? '✅' : '⏳'}
                            </span>
                          </div>
                        );
                      }

                      // Available slot
                      return (
                        <button
                          key={key}
                          onClick={() => setSelected(isSel ? null : { dow: d, hour: h })}
                          className={`rounded-xl h-10 border-2 flex items-center justify-center transition-all text-[10px] font-bold ${
                            isSel
                              ? 'bg-[#C8A8DC] border-[#9B7CB8] text-white scale-105 shadow-md'
                              : 'bg-[#F0E5FF] border-[#C8A8DC] text-[#9B7CB8] hover:bg-[#E0D5FF] hover:scale-105'
                          }`}
                          title={`${DAY_NAMES[d]} ${h}:00`}
                        >
                          {isSel ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>

          {/* ── My pending requests ────────────────────────────────────────── */}
          {myRequests.length > 0 && (
            <div className="px-6 mb-6">
              <h2 className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-2">
                Mis solicitudes
              </h2>
              <div className="space-y-2">
                {myRequests
                  .sort((a, b) => a.requestedDow - b.requestedDow || a.requestedHour - b.requestedHour)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F0E5FF] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-[#5A3D7A] leading-none">{DAY_SHORT[r.requestedDow]}</span>
                        <span className="text-[9px] text-[#9B7CB8] leading-none">{r.requestedHour}h</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">
                          {DAY_NAMES[r.requestedDow]} · {r.requestedHour}:00 – {r.requestedHour + 1}:00
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {r.isRecurring ? '🔁 Semanal' : '📌 Una vez'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                        r.status === 'pending'  ? 'bg-amber-50 text-amber-600' :
                        r.status === 'approved' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-500'
                      }`}>
                        {r.status === 'pending' ? '⏳ Pendiente' : r.status === 'approved' ? '✅ Aprobada' : '✗ Rechazada'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Request confirmation panel ─────────────────────────────────── */}
          {selected && (
            <div className="px-6 pb-8">
              <div className="bg-white rounded-3xl shadow-lg p-5 border-2 border-[#C8A8DC]">
                <h3 className="font-bold text-[#5A3D7A] text-base mb-4">Confirmar solicitud</h3>

                {/* Selected slot summary */}
                <div className="bg-[#F0E5FF] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-sm font-bold text-[#5A3D7A]">
                      {DAY_NAMES[selected.dow]} · {selected.hour}:00 – {selected.hour + 1}:00
                    </p>
                    <p className="text-[10px] text-[#9B7CB8]">
                      Tu profesor confirmará la disponibilidad
                    </p>
                  </div>
                </div>

                {/* Recurring toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-gray-600">Tipo de clase:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRecurring(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isRecurring
                          ? 'bg-[#C8A8DC] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      🔁 Semanal
                    </button>
                    <button
                      onClick={() => setIsRecurring(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !isRecurring
                          ? 'bg-[#C8A8DC] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      📌 Una sola vez
                    </button>
                  </div>
                </div>

                {/* Optional message */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Mensaje para tu profesor (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Ej: Me gustaría empezar desde la próxima semana..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
                  />
                </div>

                {/* Student info (read-only) */}
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1">Tu información</p>
                  <p className="text-xs font-bold text-gray-700">{studentName}</p>
                  <p className="text-[10px] text-gray-500">{studentEmail}</p>
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelected(null); setMessage(''); setError(''); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Enviando...' : '✉️ Enviar solicitud'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state — no occupied slots at all */}
          {!loading && activeDays.length === 0 && (
            <div className="px-6 pb-8">
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-sm text-gray-500">El horario de tu profesor aún no está configurado.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Puedes enviar tu preferencia de horario y tu profesor lo confirmará.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
