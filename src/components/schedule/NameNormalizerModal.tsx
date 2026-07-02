// FriendlyTeaching.cl — Name Normalizer Modal
// Combines auto-detection (accent / first-name prefix) with full manual grouping.
'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Booking } from '@/types/firebase';
import { groupSimilarNames, pickCanonicalName } from '@/lib/utils/nameUtils';
import { bulkRenameStudentBookings } from '@/hooks/useBookings';
import { bulkRenameClassHistory } from '@/hooks/useClassHistory';
import { useAuthStore } from '@/store/authStore';
import {
  collection, query, where, getDocs,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Props {
  allBookings: Booking[];
  onClose: () => void;
}

// A group the teacher has confirmed / created
interface MergeGroup {
  names: string[];      // all variants
  canonical: string;   // the name to keep
}

export default function NameNormalizerModal({ allBookings, onClose }: Props) {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';

  // ── Names that appear ONLY in classHistory (no active booking) ──
  // Without this the modal misses students who used to have classes
  // but no longer do, so their history-only variants ("Andrée", "Anto
  // Acuña" etc.) never showed up as merge candidates.
  const [historyOnlyNames, setHistoryOnlyNames] = useState<string[]>([]);
  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'classHistory'),
          where('teacherId', '==', teacherId),
        ));
        if (cancelled) return;
        const set = new Set<string>();
        snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          const n = (d.data().studentName ?? '').trim();
          if (n) set.add(n);
        });
        setHistoryOnlyNames([...set]);
      } catch (err) {
        console.warn('[NameNormalizerModal] classHistory read failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, [teacherId]);

  // ── Derive unique names + booking ID index ────────────────────
  const { byName, uniqueNames } = useMemo(() => {
    const byName: Record<string, string[]> = {};
    for (const b of allBookings) {
      const n = b.studentName?.trim();
      if (!n) continue;
      (byName[n] ??= []).push(b.id);
    }
    // Merge in history-only names (no booking IDs to point at, but still
    // eligible for renaming across classHistory rows).
    for (const n of historyOnlyNames) {
      if (!(n in byName)) byName[n] = [];
    }
    return { byName, uniqueNames: Object.keys(byName).sort() };
  }, [allBookings, historyOnlyNames]);

  // Auto-detected groups (accent / prefix / nickname rules)
  const autoGroups: MergeGroup[] = useMemo(() => {
    const similar = groupSimilarNames(uniqueNames);
    return similar.map(names => ({
      names,
      canonical: pickCanonicalName(names),
    }));
  }, [uniqueNames]);

  // Track which names are already in a confirmed group. Reset when
  // autoGroups changes (i.e. after historyOnlyNames finishes loading).
  const [groups, setGroups] = useState<MergeGroup[]>(autoGroups);
  useEffect(() => { setGroups(autoGroups); }, [autoGroups]);

  const assignedNames = useMemo(
    () => new Set(groups.flatMap(g => g.names)),
    [groups],
  );

  const ungroupedNames = useMemo(
    () => uniqueNames.filter(n => !assignedNames.has(n)),
    [uniqueNames, assignedNames],
  );

  // Multi-select state for manual grouping
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function createGroup() {
    if (selected.size < 2) return;
    const names = [...selected].sort();
    const canonical = pickCanonicalName(names);
    setGroups(prev => [...prev, { names, canonical }]);
    setSelected(new Set());
  }

  function removeGroup(i: number) {
    setGroups(prev => prev.filter((_, idx) => idx !== i));
  }

  function setCanonical(i: number, name: string) {
    setGroups(prev => prev.map((g, idx) => idx === i ? { ...g, canonical: name } : g));
  }

  // ── Save ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [mergedCount, setMergedCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');

  async function handleSave() {
    setSaving(true);
    let bookingTotal = 0;
    let historyTotal = 0;

    for (const group of groups) {
      const fromNames = group.names.filter(n => n !== group.canonical);
      if (fromNames.length === 0) continue;

      const bookingIds = fromNames.flatMap(n => byName[n] ?? []);

      setSaveStatus(`Actualizando clases de "${group.canonical}"…`);
      if (bookingIds.length > 0) {
        await bulkRenameStudentBookings(bookingIds, group.canonical);
        bookingTotal += bookingIds.length;
      }

      setSaveStatus(`Fusionando historial de "${group.canonical}"…`);
      const h = await bulkRenameClassHistory(teacherId, fromNames, group.canonical);
      historyTotal += h;
    }

    setMergedCount(bookingTotal + historyTotal);
    setSaveStatus('');
    setDone(true);
    setSaving(false);
  }

  const totalToRename = groups.reduce((s, g) =>
    s + g.names.filter(n => n !== g.canonical).reduce((s2, n) => s2 + (byName[n]?.length ?? 0), 0), 0,
  );

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#5A3D7A] text-base">🔗 Fusionar nombres duplicados</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Selecciona los nombres que son la misma persona y elige cuál conservar
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4">×</button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
            <p className="text-5xl mb-4">✅</p>
            <p className="font-bold text-gray-800 text-lg mb-1">
              {mergedCount > 0 ? `${mergedCount} registros actualizados` : 'Sin cambios'}
            </p>
            <p className="text-sm text-gray-500">Clases e historial unificados bajo un solo nombre.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A]"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-0 md:divide-x divide-gray-100 min-h-0">

                {/* Left: ungrouped names */}
                <div className="md:w-64 flex-shrink-0 p-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Nombres sin grupo
                    </p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {ungroupedNames.length}
                    </span>
                  </div>

                  {ungroupedNames.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">Todos agrupados ✓</p>
                  ) : (
                    <div className="space-y-1">
                      {ungroupedNames.map(name => {
                        const count = byName[name]?.length ?? 0;
                        const isSelected = selected.has(name);
                        return (
                          <button
                            key={name}
                            onClick={() => toggleSelect(name)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all border-2
                              ${isSelected
                                ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold'
                                : 'bg-white border-[#E0D5FF] text-gray-700 hover:border-[#C8A8DC] hover:bg-[#F9F5FF]'
                              }`}
                          >
                            <span className="truncate text-left">{name}</span>
                            <span className={`text-[10px] ml-1 flex-shrink-0 font-medium px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selected.size >= 2 && (
                    <button
                      onClick={createGroup}
                      className="w-full mt-2 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] transition-all flex items-center justify-center gap-1.5"
                    >
                      🔗 Agrupar {selected.size} nombres
                    </button>
                  )}
                  {selected.size === 1 && (
                    <p className="text-[11px] text-center text-gray-400 mt-1">
                      Selecciona al menos 2 para agrupar
                    </p>
                  )}
                </div>

                {/* Right: confirmed groups */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Grupos a fusionar
                    </p>
                    {groups.length > 0 && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {groups.length} grupo{groups.length !== 1 ? 's' : ''} · {totalToRename} clase{totalToRename !== 1 ? 's' : ''} se renombrarán
                      </span>
                    )}
                  </div>

                  {groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-3xl mb-2">👈</p>
                      <p className="text-sm text-gray-500">
                        Selecciona nombres de la izquierda y haz clic en "Agrupar"
                      </p>
                    </div>
                  ) : (
                    groups.map((group, i) => {
                      const variantCount = group.names
                        .filter(n => n !== group.canonical)
                        .reduce((s, n) => s + (byName[n]?.length ?? 0), 0);

                      return (
                        <div key={i} className="border border-[#E8DAFF] rounded-2xl p-3 bg-[#FAFAFE] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#9B7CB8]">
                              Grupo {i + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {variantCount > 0 && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  {variantCount} clase{variantCount !== 1 ? 's' : ''} se renombrarán
                                </span>
                              )}
                              <button
                                onClick={() => removeGroup(i)}
                                className="text-gray-300 hover:text-red-400 text-sm leading-none transition-colors"
                                title="Deshacer grupo"
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {group.names.map(name => {
                              const count = byName[name]?.length ?? 0;
                              const isCanonical = name === group.canonical;
                              return (
                                <button
                                  key={name}
                                  onClick={() => setCanonical(i, name)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all border-2
                                    ${isCanonical
                                      ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold'
                                      : 'bg-white border-[#E0D5FF] text-gray-500 hover:border-[#C8A8DC] line-through decoration-gray-400'
                                    }`}
                                >
                                  <span className="flex items-center gap-2">
                                    {isCanonical && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">conservar</span>}
                                    {name}
                                  </span>
                                  <span className={`text-[10px] flex-shrink-0 font-medium px-1.5 py-0.5 rounded-full ${isCanonical ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-[#7B5EA7]">
                            Toca el nombre que quieres conservar
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-gray-400">
                {totalToRename > 0
                  ? `Se actualizarán ${totalToRename} clases en Firestore`
                  : groups.length > 0 ? 'No hay cambios pendientes' : 'Sin grupos creados'}
              </p>
              <div className="flex items-center gap-2">
                {saving && saveStatus && (
                  <p className="text-xs text-[#7B5EA7] italic mr-2">{saveStatus}</p>
                )}
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || totalToRename === 0}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] disabled:opacity-40 flex items-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Guardando…' : `🔗 Fusionar${totalToRename > 0 ? ` (${totalToRename})` : ''}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
