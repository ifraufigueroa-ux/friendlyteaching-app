// FriendlyTeaching.cl — TodayCarousel
// Carrusel de clases del día con botones "Se tomó" / "No se tomó" y deshacer
'use client';
import { useState, useEffect, useRef } from 'react';
import { completeBooking, updateBooking } from '@/hooks/useBookings';
import type { Booking } from '@/types/firebase';

interface Props {
  bookings: Booking[];
  todayDow: number; // 1=Lun … 6=Sáb
}

interface LastAction {
  id:          string;
  studentName: string;
  hour:        number;
  attendance:  'attended' | 'absent';
}

const UNDO_TTL = 10; // seconds the undo button stays visible

export default function TodayCarousel({ bookings, todayDow }: Props) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [loading, setLoading]           = useState(false);
  const [exiting, setExiting]           = useState(false);
  const [lastAction, setLastAction]     = useState<LastAction | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear countdown timer on unmount
  useEffect(() => () => { if (undoTimerRef.current) clearInterval(undoTimerRef.current); }, []);

  function startUndoCountdown() {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setUndoCountdown(UNDO_TTL);
    undoTimerRef.current = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(undoTimerRef.current!);
          undoTimerRef.current = null;
          setLastAction(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Only show real (non-fallback) confirmed classes for today
  const todayClasses = bookings
    .filter((b) =>
      b.dayOfWeek === todayDow &&
      b.status === 'confirmed' &&
      !b.id.startsWith('local-') &&
      !dismissedIds.has(b.id)
    )
    .sort((a, b) => a.hour - b.hour);

  // Nothing to show today
  if (todayClasses.length === 0) {
    if (dismissedIds.size === 0) return null;

    // All classes marked — show celebration + undo if applicable
    return (
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2.5 bg-[#E8F5E9] border border-[#A8E6A1] rounded-2xl px-4 py-3">
          <span className="text-xl">🎉</span>
          <p className="text-sm font-semibold text-[#2D6E2A]">¡Al día con las clases de hoy!</p>
        </div>
        {lastAction && (
          <UndoBanner lastAction={lastAction} countdown={undoCountdown} onUndo={handleUndo} />
        )}
      </div>
    );
  }

  const safeIdx = Math.min(currentIdx, todayClasses.length - 1);
  const current = todayClasses[safeIdx];
  const total   = todayClasses.length;

  async function handleMark(attendance: 'attended' | 'absent') {
    if (!current || loading || exiting) return;
    const snapshot: LastAction = {
      id:          current.id,
      studentName: current.studentName,
      hour:        current.hour,
      attendance,
    };
    setLoading(true);
    setExiting(true);
    try {
      await completeBooking(current.id, { attendance });
    } catch {
      setExiting(false);
      setLoading(false);
      return;
    }
    setTimeout(() => {
      setDismissedIds((prev) => { const n = new Set(prev); n.add(snapshot.id); return n; });
      setCurrentIdx((prev) => Math.max(0, Math.min(prev, total - 2)));
      setExiting(false);
      setLoading(false);
      setLastAction(snapshot);
      startUndoCountdown();
    }, 290);
  }

  async function handleUndo() {
    if (!lastAction) return;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setLastAction(null);
    setUndoCountdown(0);
    try {
      await updateBooking(lastAction.id, {
        status:      'confirmed',
        attendance:  null,
        completedAt: null,
      });
      setDismissedIds((prev) => { const n = new Set(prev); n.delete(lastAction.id); return n; });
    } catch { /* silent — Firestore will still hold completed, just re-add to dismissed */ }
  }

  return (
    <div className="mb-3 bg-[#FAF5FF] border border-[#E8D8F5] rounded-2xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
          📅 Clases de hoy
        </p>
        <span className="text-xs text-[#9B7CB8] font-medium">{safeIdx + 1} / {total}</span>
      </div>

      {/* Undo banner (inline, above action buttons) */}
      {lastAction && (
        <div className="mb-2">
          <UndoBanner lastAction={lastAction} countdown={undoCountdown} onUndo={handleUndo} />
        </div>
      )}

      {/* Card with slide-out animation */}
      <div
        className="bg-white rounded-xl p-3 shadow-sm border border-[#E8D8F5]"
        style={{
          transition: 'opacity 0.28s ease, transform 0.28s ease',
          opacity:    exiting ? 0 : 1,
          transform:  exiting ? 'translateX(24px) scale(0.97)' : 'translateX(0) scale(1)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Class info */}
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#5A3D7A] truncate">{current.studentName}</p>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
              <span className="text-xs text-[#9B7CB8]">🕐 {current.hour}:00</span>
              {current.isRecurring && (
                <span className="text-[10px] bg-[#F0E5FF] text-[#5A3D7A] px-1.5 py-0.5 rounded-full font-medium">
                  ↻ Recurrente
                </span>
              )}
            </div>
            {current.notes && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {current.notes}</p>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex gap-1 shrink-0 mt-0.5">
            <button
              onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
              disabled={safeIdx === 0}
              aria-label="Anterior"
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#F0E5FF] text-[#5A3D7A] text-base leading-none disabled:opacity-30 hover:bg-[#E0CCFF] transition-colors"
            >‹</button>
            <button
              onClick={() => setCurrentIdx((p) => Math.min(total - 1, p + 1))}
              disabled={safeIdx === total - 1}
              aria-label="Siguiente"
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#F0E5FF] text-[#5A3D7A] text-base leading-none disabled:opacity-30 hover:bg-[#E0CCFF] transition-colors"
            >›</button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleMark('attended')}
          disabled={loading || exiting}
          className="flex-1 py-2 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          ✅ Se tomó
        </button>
        <button
          onClick={() => handleMark('absent')}
          disabled={loading || exiting}
          className="flex-1 py-2 bg-[#FFD9D9] hover:bg-[#FFB8B8] text-red-600 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          ❌ No se tomó
        </button>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {todayClasses.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              aria-label={`Clase ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === safeIdx ? 'bg-[#5A3D7A]' : 'bg-[#D9C8F0]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Undo banner sub-component ─────────────────────────────────────────────────
function UndoBanner({
  lastAction,
  countdown,
  onUndo,
}: {
  lastAction: LastAction;
  countdown: number;
  onUndo: () => void;
}) {
  const label = lastAction.attendance === 'attended' ? 'asistió' : 'no asistió';
  return (
    <div className="flex items-center justify-between gap-2 bg-white border border-[#E8D8F5] rounded-xl px-3 py-2 text-xs">
      <span className="text-gray-500 truncate">
        <span className="font-semibold text-[#5A3D7A]">{lastAction.studentName}</span>
        {' '}marcada como {label}
      </span>
      <button
        onClick={onUndo}
        className="shrink-0 flex items-center gap-1 text-[#5A3D7A] font-semibold hover:text-[#9B7CB8] transition-colors"
      >
        ↩ Deshacer
        <span className="text-gray-400 font-normal">({countdown}s)</span>
      </button>
    </div>
  );
}
