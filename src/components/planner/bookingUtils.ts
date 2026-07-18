// FriendlyTeaching.cl — Planner: booking dedup helpers.
//
// A recurring class in Firestore is materialised as 52 weekly documents
// (see project memory: "Booking model — recurring classes create 52
// weekly documents in Firestore, each with its own weekStart"). Naively
// filtering by dayOfWeek picks all 52 copies of the same class and blows
// the "Hoy" tab from 3 classes to 221.
//
// This helper collapses those 52 duplicates back into ONE row per slot,
// preferring the instance whose weekStart matches the CURRENT week (that
// carries the right status for today: completed / cancelled / etc.) and
// falling back to the recurring template otherwise.

import type { Booking } from '@/types/firebase';

// Read the ms-since-epoch out of a Firestore Timestamp-ish field.
function toMs(ts: unknown): number | null {
  const t = ts as { toDate?: () => Date; seconds?: number } | null | undefined;
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  return null;
}

// A slot is uniquely identified by (student, dayOfWeek, hour, minute).
// Prefer studentId; fall back to studentName so legacy bookings without
// a student link still dedupe correctly. Normalise both so subtle
// differences (trailing whitespace, casing) don't defeat the collapse.
function slotKey(b: Booking): string {
  const rawWho = (b.studentId || b.studentName || 'unknown').toString().trim().toLowerCase();
  const dow = Number(b.dayOfWeek) || 0;
  const hour = Number(b.hour) || 0;
  const minute = Number(b.minute ?? 0) || 0;
  return `${rawWho}|${dow}|${hour}|${minute}`;
}

/**
 * Collapse recurring duplicates. For each slot, keeps the booking whose
 * weekStart matches `weekStartMs` (the current week's Monday) — that's
 * the "instance with this week's status". If no such instance exists,
 * falls back to the recurring template (or the first booking in the
 * group). Cancelled bookings for OTHER weeks are dropped so they don't
 * shadow the recurring template.
 */
export function dedupeBookingsForWeek(bookings: Booking[], weekStartMs: number): Booking[] {
  const groups = new Map<string, Booking[]>();
  for (const b of bookings) {
    const arr = groups.get(slotKey(b));
    if (arr) arr.push(b); else groups.set(slotKey(b), [b]);
  }

  // One-shot sanity log so we can see in the console whether the dedup
  // is actually collapsing anything or if the raw data is genuinely that
  // large. Only fires when there's a suspicious ratio.
  if (typeof window !== 'undefined' && bookings.length > 40 && groups.size >= bookings.length * 0.9) {
    // eslint-disable-next-line no-console
    console.warn('[planner dedup] key not collapsing:', {
      total: bookings.length,
      unique: groups.size,
      sample: bookings.slice(0, 3).map(b => ({
        id: b.id, studentId: b.studentId, studentName: b.studentName,
        dayOfWeek: b.dayOfWeek, hour: b.hour, minute: b.minute,
      })),
    });
  }

  const out: Booking[] = [];
  for (const arr of groups.values()) {
    // 1. Cancelled this week wins — student explicitly cancelled this
    // week's instance, so the slot should NOT appear on the planner.
    const cancelledThisWeek = arr.find(b => toMs(b.weekStart) === weekStartMs && b.status === 'cancelled');
    if (cancelledThisWeek) continue;

    // 2. Prefer the instance whose weekStart is exactly this week.
    const thisWeek = arr.find(b => toMs(b.weekStart) === weekStartMs && b.status !== 'cancelled');
    if (thisWeek) { out.push(thisWeek); continue; }

    // 3. Fall back to the recurring template.
    const template = arr.find(b => b.isRecurring && b.status !== 'cancelled');
    if (template) { out.push(template); continue; }

    // 4. Last resort: first non-cancelled booking in the group.
    const first = arr.find(b => b.status !== 'cancelled');
    if (first) out.push(first);
  }
  return out;
}
