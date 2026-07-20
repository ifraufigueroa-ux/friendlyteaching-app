// FriendlyTeaching.cl — Planner: one row per scheduled class.
// Used in Hoy, Semana and Por-estudiante tabs. Handles the inline
// editing of the class topic + material URL and writes back to
// Firestore on blur / Enter.
'use client';
import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { detectMaterialType } from './bookingUtils';
import type { Booking } from '@/types/firebase';

const STATUS_META: Record<string, { label: string; className: string }> = {
  confirmed:  { label: 'Confirmada', className: 'bg-green-50 text-green-700 border-green-200' },
  pending:    { label: 'Pendiente',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed:  { label: 'Realizada',  className: 'bg-[#F0E5FF] text-[#5A3D7A] border-[#D9C2EE]' },
  cancelled:  { label: 'Cancelada',  className: 'bg-red-50 text-red-600 border-red-200' },
};

function formatHour(hour: number, minute: number | undefined): string {
  const h = String(hour).padStart(2, '0');
  const m = String(minute ?? 0).padStart(2, '0');
  return `${h}:${m}`;
}

interface Props {
  booking: Booking;
  // Show the day label alongside the hour — useful in Week and per-student
  // views where multiple days are visible at once.
  showDay?: boolean;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ClassRow({ booking, showDay }: Props) {
  const [topic, setTopic]         = useState(booking.topic ?? '');
  const [materialUrl, setUrl]     = useState(booking.materialUrl ?? '');
  const [savingTopic, setSavingT] = useState(false);
  const [savingUrl,   setSavingU] = useState(false);
  const [saved, setSaved]         = useState<null | 'topic' | 'material'>(null);
  const initialTopicRef = useRef(booking.topic ?? '');
  const initialUrlRef   = useRef(booking.materialUrl ?? '');

  // Keep local state in sync if the underlying booking changes (e.g. someone
  // else edits it in a different tab). Only overwrite when NOT focused.
  useEffect(() => {
    setTopic(booking.topic ?? '');
    initialTopicRef.current = booking.topic ?? '';
  }, [booking.topic]);
  useEffect(() => {
    setUrl(booking.materialUrl ?? '');
    initialUrlRef.current = booking.materialUrl ?? '';
  }, [booking.materialUrl]);

  async function commitTopic() {
    if (topic === initialTopicRef.current) return;
    setSavingT(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        topic: topic.trim() || null,
        updatedAt: serverTimestamp(),
      });
      initialTopicRef.current = topic;
      setSaved('topic');
      setTimeout(() => setSaved(null), 1200);
    } finally {
      setSavingT(false);
    }
  }

  async function commitUrl() {
    if (materialUrl === initialUrlRef.current) return;
    setSavingU(true);
    try {
      const trimmed = materialUrl.trim();
      await updateDoc(doc(db, 'bookings', booking.id), {
        materialUrl: trimmed || null,
        materialType: trimmed ? detectMaterialType(trimmed).type : null,
        updatedAt: serverTimestamp(),
      });
      initialUrlRef.current = materialUrl;
      setSaved('material');
      setTimeout(() => setSaved(null), 1200);
    } finally {
      setSavingU(false);
    }
  }

  const status = STATUS_META[booking.status] ?? { label: booking.status, className: 'bg-gray-50 text-gray-500 border-gray-200' };
  const material = detectMaterialType(materialUrl);

  return (
    <div className="bg-white rounded-2xl border border-[#F0E5FF] shadow-sm hover:shadow-md hover:border-[#C8A8DC] transition-all p-4">
      {/* Top row — time · student · status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">
            {showDay ? DAY_LABELS[booking.dayOfWeek] : 'Hora'}
          </span>
          <span className="text-sm font-bold leading-none mt-0.5 tabular-nums">
            {formatHour(booking.hour, booking.minute)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1B2C3F] text-sm truncate">
            {booking.studentName || 'Sin nombre'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
              {status.label}
            </span>
            {booking.isRecurring && (
              <span className="text-[10px] text-gray-400">🔁 Recurrente</span>
            )}
            {booking.bookingType === 'interview' && (
              <span className="text-[10px] bg-[#FEF3D9] text-[#8A5A1A] font-semibold px-2 py-0.5 rounded-full">
                🎙 Entrevista
              </span>
            )}
          </div>
        </div>

        {/* Material badge — always visible when a URL exists, opens in new tab */}
        {materialUrl && material.type !== 'none' && (
          <a
            href={materialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0E5FF] hover:bg-[#E0C8F0] text-[#5A3D7A] text-[11px] font-bold border border-[#D9C2EE] transition-colors"
            title={materialUrl}
          >
            <span>{material.icon}</span>
            <span>{material.label}</span>
            <span className="opacity-60">↗</span>
          </a>
        )}
      </div>

      {/* Editable fields — topic + material URL */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
        <div>
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
            Tema {savingTopic && <span className="text-[#5A3D7A]">· guardando…</span>}
            {saved === 'topic' && <span className="text-green-600">· ✓ guardado</span>}
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onBlur={commitTopic}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder="Ej: Present simple be — questions"
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C8A8DC] focus:ring-1 focus:ring-[#C8A8DC]"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
            Link del material {savingUrl && <span className="text-[#5A3D7A]">· guardando…</span>}
            {saved === 'material' && <span className="text-green-600">· ✓ guardado</span>}
          </label>
          <input
            value={materialUrl}
            onChange={e => setUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder="https://… (off2class, ellii, drive, canva…)"
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:border-[#C8A8DC] focus:ring-1 focus:ring-[#C8A8DC]"
          />
        </div>
      </div>
    </div>
  );
}
