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
import { Lock, Check, Calendar, Clock, Repeat, Pin, X, Inbox, Send } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { Booking } from '@/types/firebase';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
      setError('Something went wrong. Please try again.');
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
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-sm">
          <div className="mb-4 flex justify-center text-gray-400"><Lock className="w-10 h-10" strokeWidth={2} /></div>
          <h2 className="text-lg font-bold text-[#5A3D7A] mb-2">No teacher assigned</h2>
          <p className="text-sm text-gray-500 mb-4">
            You don't have a teacher assigned yet. Once your account is approved, you'll be able to request classes.
          </p>
          <Link
            href="/dashboard/student"
            className="inline-block px-5 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold hover:bg-[#9B7CB8] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" strokeWidth={2.5} /></div>
          <h2 className="text-xl font-extrabold text-[#5A3D7A] mb-2">Request sent!</h2>
          <p className="text-sm text-gray-500 mb-1">
            You requested the slot on{' '}
            <strong>{DAY_NAMES[selected?.dow ?? 1]} at {selected?.hour}:00</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Your teacher will review the request and confirm by email or WhatsApp.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setDone(false); setSelected(null); setMessage(''); }}
              className="w-full py-2.5 bg-[#F0E5FF] text-[#5A3D7A] rounded-xl text-sm font-bold hover:bg-[#E0D5FF] transition-colors"
            >
              Request another slot
            </button>
            <Link
              href="/dashboard/student/schedule"
              className="w-full py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold hover:bg-[#9B7CB8] transition-colors text-center"
            >
              View my schedule
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard/student/schedule" className="text-[#9B7CB8] hover:text-[#5A3D7A] text-sm font-semibold transition-colors">
            ← My schedule
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#5A3D7A] inline-flex items-center gap-2"><Calendar className="w-6 h-6" strokeWidth={2.25} /> Request class</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pick an available slot and your teacher will confirm the request.
        </p>
      </div>

      {/* Legend */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex flex-wrap gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#F0E5FF] border-2 border-[#C8A8DC]" />
            <span className="text-gray-600">Available — you can request</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gray-100 border border-gray-200" />
            <span className="text-gray-400">Taken</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-50 border-2 border-amber-300" />
            <span className="text-amber-600">Pending request</span>
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
                            title="Taken"
                          >
                            <Lock className="w-3.5 h-3.5 text-gray-300 select-none" strokeWidth={2} />
                          </div>
                        );
                      }

                      if (isPending) {
                        const req = pendingMap.get(key)!;
                        return (
                          <div
                            key={key}
                            className="rounded-xl h-10 bg-amber-50 border-2 border-amber-300 flex items-center justify-center"
                            title={`Request ${req.status === 'approved' ? 'approved' : 'pending'}`}
                          >
                            <span className="text-amber-500 select-none">
                              {req.status === 'approved' ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Clock className="w-3.5 h-3.5" strokeWidth={2.25} />}
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
                          {isSel ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : '+'}
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
                My requests
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
                        <p className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                          {r.isRecurring ? <><Repeat className="w-2.5 h-2.5" strokeWidth={2.25} /> Weekly</> : <><Pin className="w-2.5 h-2.5" strokeWidth={2.25} /> One-off</>}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1 ${
                        r.status === 'pending'  ? 'bg-amber-50 text-amber-600' :
                        r.status === 'approved' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-500'
                      }`}>
                        {r.status === 'pending'
                          ? <><Clock className="w-2.5 h-2.5" strokeWidth={2.25} /> Pending</>
                          : r.status === 'approved'
                          ? <><Check className="w-2.5 h-2.5" strokeWidth={2.5} /> Approved</>
                          : <><X className="w-2.5 h-2.5" strokeWidth={2.5} /> Rejected</>}
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
                <h3 className="font-bold text-[#5A3D7A] text-base mb-4">Confirm request</h3>

                {/* Selected slot summary */}
                <div className="bg-[#F0E5FF] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
                  <div>
                    <p className="text-sm font-bold text-[#5A3D7A]">
                      {DAY_NAMES[selected.dow]} · {selected.hour}:00 – {selected.hour + 1}:00
                    </p>
                    <p className="text-[10px] text-[#9B7CB8]">
                      Your teacher will confirm availability
                    </p>
                  </div>
                </div>

                {/* Recurring toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-gray-600">Class type:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRecurring(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isRecurring
                          ? 'bg-[#C8A8DC] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1"><Repeat className="w-3 h-3" strokeWidth={2.25} /> Weekly</span>
                    </button>
                    <button
                      onClick={() => setIsRecurring(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !isRecurring
                          ? 'bg-[#C8A8DC] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1"><Pin className="w-3 h-3" strokeWidth={2.25} /> One-off</span>
                    </button>
                  </div>
                </div>

                {/* Optional message */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Message for your teacher (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="E.g. I'd like to start next week…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
                  />
                </div>

                {/* Student info (read-only) */}
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1">Your info</p>
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
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Sending…' : <span className="inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5" strokeWidth={2.25} /> Send request</span>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state — no occupied slots at all */}
          {!loading && activeDays.length === 0 && (
            <div className="px-6 pb-8">
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="mb-3 flex justify-center text-gray-400"><Inbox className="w-8 h-8" strokeWidth={2} /></div>
                <p className="text-sm text-gray-500">Your teacher's schedule isn't set up yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  You can send your preferred slot and your teacher will confirm.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
