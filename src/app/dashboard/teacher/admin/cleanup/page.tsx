'use client';
// FriendlyTeaching.cl — One-time booking cleanup tool (teacher admin only)
import { useState } from 'react';
import {
  collection, query, where, getDocs,
  writeBatch, doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { Booking } from '@/types/firebase';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface SlotResult {
  slot: string;
  total: number;
  cancelled: number;
  duplicates: number;
  deleted: number;
}

export default function CleanupPage() {
  const { profile } = useAuthStore();
  const [results, setResults] = useState<SlotResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const teacherId = profile?.uid ?? '';

  async function runCleanup(dryRun: boolean) {
    if (!teacherId) return;
    setLoading(true);
    setResults([]);
    setDone(false);

    try {
      // Fetch all bookings for this teacher
      const snap = await getDocs(
        query(collection(db, 'bookings'), where('teacherId', '==', teacherId))
      );
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));

      // Group by slot key (dow-hour-minute-studentName)
      type BookingWithId = Booking & { id: string };
      const groups = new Map<string, BookingWithId[]>();
      all.forEach(b => {
        const key = `${b.dayOfWeek}-${b.hour}-${b.minute ?? 0}-${b.studentName}`;
        const arr = groups.get(key) ?? [];
        arr.push(b as BookingWithId);
        groups.set(key, arr);
      });

      const toDelete: string[] = [];
      const slotResults: SlotResult[] = [];

      groups.forEach((docs, key) => {
        const [dow, hour] = key.split('-');
        const slotLabel = `${DAY_NAMES[Number(dow)]} ${hour}:00 — ${docs[0].studentName}`;
        const cancelled = docs.filter(d => d.status === 'cancelled');
        const confirmed = docs.filter(d => d.status === 'confirmed');

        const idsToDelete: string[] = [];

        // Delete all cancelled bookings (they block the display of re-bookings)
        cancelled.forEach(d => idsToDelete.push(d.id));

        // Deduplicate confirmed: if more than 52, keep the 52 newest
        if (confirmed.length > 52) {
          const sorted = [...confirmed].sort((a, b) => {
            const ta = (a.createdAt as unknown as { seconds?: number })?.seconds ?? 0;
            const tb = (b.createdAt as unknown as { seconds?: number })?.seconds ?? 0;
            return tb - ta;
          });
          sorted.slice(52).forEach(d => idsToDelete.push(d.id));
        }

        if (idsToDelete.length > 0 || cancelled.length > 0) {
          slotResults.push({
            slot: slotLabel,
            total: docs.length,
            cancelled: cancelled.length,
            duplicates: Math.max(0, confirmed.length - 52),
            deleted: idsToDelete.length,
          });
          idsToDelete.forEach(id => toDelete.push(id));
        }
      });

      if (!dryRun && toDelete.length > 0) {
        // Delete in batches of 400
        for (let i = 0; i < toDelete.length; i += 400) {
          const batch = writeBatch(db);
          toDelete.slice(i, i + 400).forEach(id =>
            batch.delete(doc(db, 'bookings', id))
          );
          await batch.commit();
        }
      }

      setResults(slotResults);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#5A3D7A] mb-2">Limpieza de Bookings</h1>
        <p className="text-gray-500 text-sm mb-6">
          Elimina bookings cancelados y duplicados de tu horario. Los cancelados bloquean el re-agendamiento. Los duplicados ocurren cuando el mismo estudiante se agendó más de una vez en el mismo slot.
        </p>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => runCleanup(true)}
            disabled={loading || !teacherId}
            className="px-5 py-2.5 rounded-xl border-2 border-[#5A3D7A] text-[#5A3D7A] font-semibold text-sm hover:bg-[#F0E5FF] transition-colors disabled:opacity-40"
          >
            {loading ? 'Analizando...' : '🔍 Analizar (sin borrar)'}
          </button>
          <button
            onClick={() => runCleanup(false)}
            disabled={loading || !teacherId}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-40"
          >
            {loading ? 'Limpiando...' : '🗑 Limpiar ahora'}
          </button>
        </div>

        {done && results.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-medium">
            ✓ No se encontraron datos basura. Todo limpio.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Slots afectados ({results.length})
            </p>
            {results.map((r, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="font-semibold text-gray-800 mb-2">{r.slot}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">Total: <b>{r.total}</b></span>
                  {r.cancelled > 0 && <span className="text-red-500">Cancelados: <b>{r.cancelled}</b></span>}
                  {r.duplicates > 0 && <span className="text-orange-500">Duplicados extra: <b>{r.duplicates}</b></span>}
                  <span className="text-[#5A3D7A] font-bold">Eliminados: {r.deleted}</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 pt-2">
              Total eliminados: {results.reduce((s, r) => s + r.deleted, 0)} documentos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
