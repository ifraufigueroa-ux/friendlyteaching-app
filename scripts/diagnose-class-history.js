// FriendlyTeaching.cl — Diagnose the class registration flow.
//
// Looks for three concrete bugs in the data:
//   1. classHistory duplicates — same teacherId + bookingId + date recorded
//      more than once (would confirm the no-deduplication theory).
//   2. Date/day mismatch — classHistory entry.date's real weekday does not
//      match entry.dayOfWeek. Would confirm the getClassDate(dow) bug
//      driven by a stale currentWeekStart.
//   3. Bookings stuck in 'confirmed' while classHistory has an attended
//      entry for the same slot. Would confirm completeBooking failing
//      silently while recordClassSession succeeded.
//
// Usage: node scripts/diagnose-class-history.js
//         node scripts/diagnose-class-history.js --teacher <uid>

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

initAdmin();
const db = getFirestore();

const argv = process.argv.slice(2);
const tIdx = argv.indexOf('--teacher');
const teacherFilter = tIdx >= 0 ? argv[tIdx + 1] : null;

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
  return null;
}
const DOW_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

(async () => {
  let historyQ = db.collection('classHistory');
  if (teacherFilter) historyQ = historyQ.where('teacherId', '==', teacherFilter);
  const historySnap = await historyQ.get();
  console.log(`classHistory entries scanned: ${historySnap.size}`);

  const entries = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // ─── Bug 1: duplicates by (teacherId, bookingId, date-day) ────────────
  const groups = new Map();
  for (const e of entries) {
    const date = tsToDate(e.date);
    if (!date) continue;
    const dayStr = date.toISOString().slice(0, 10);
    const key = `${e.teacherId}|${e.bookingId || 'no-booking'}|${dayStr}|${e.hour}-${e.minute ?? 0}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }
  const dupGroups = [...groups.entries()].filter(([, arr]) => arr.length > 1);
  console.log(`\n─── Bug 1: Duplicates in classHistory ─────────────────`);
  console.log(`Duplicate groups: ${dupGroups.length}`);
  dupGroups.slice(0, 8).forEach(([key, arr]) => {
    console.log(`  · ${key}  x${arr.length}`);
    arr.forEach(e => {
      const created = tsToDate(e.createdAt);
      console.log(`      ${e.id}  student="${e.studentName}"  attended=${e.attended}  createdAt=${created?.toISOString() ?? '?'}`);
    });
  });
  if (dupGroups.length > 8) console.log(`  … and ${dupGroups.length - 8} more groups`);

  // ─── Bug 2: date/day mismatch ──────────────────────────────────────────
  const mismatched = [];
  for (const e of entries) {
    const date = tsToDate(e.date);
    if (!date) continue;
    const realDow = date.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
    // Our schema: dayOfWeek 1=Lun ... 6=Sáb. Sunday would be 7 but we don't use it.
    const storedDow = e.dayOfWeek;
    if (realDow !== storedDow) {
      // Also flag "close" (like off by 7 days = same weekday, different week)
      mismatched.push({ entry: e, realDow, storedDow, date });
    }
  }
  console.log(`\n─── Bug 2: Date does not match stored dayOfWeek ───────`);
  console.log(`Mismatched entries: ${mismatched.length}`);
  mismatched.slice(0, 10).forEach(({ entry, realDow, storedDow, date }) => {
    console.log(`  · ${entry.id}  student="${entry.studentName}"  stored dow=${storedDow} (${DOW_ES[storedDow]})  real=${realDow} (${DOW_ES[realDow]})  date=${date.toISOString().slice(0, 10)}`);
  });
  if (mismatched.length > 10) console.log(`  … and ${mismatched.length - 10} more`);

  // ─── Bug 3: bookings stuck in 'confirmed' with an attended history ────
  let bookingsQ = db.collection('bookings');
  if (teacherFilter) bookingsQ = bookingsQ.where('teacherId', '==', teacherFilter);
  const bookingsSnap = await bookingsQ.get();
  const bookingsById = new Map();
  bookingsSnap.forEach(d => bookingsById.set(d.id, d.data()));

  const orphanRecords = [];
  for (const e of entries) {
    if (!e.bookingId) continue;
    const b = bookingsById.get(e.bookingId);
    if (!b) continue;
    if (b.status === 'confirmed' && e.attended === true) {
      // Only worry about entries from the same week as the booking.
      const eDate = tsToDate(e.date);
      const bWk   = tsToDate(b.weekStart);
      if (eDate && bWk) {
        const sameWeek = Math.abs(eDate.getTime() - bWk.getTime()) < 8 * 24 * 60 * 60 * 1000;
        if (sameWeek) orphanRecords.push({ entry: e, booking: b });
      }
    }
  }
  console.log(`\n─── Bug 3: History says attended but booking still 'confirmed' ───`);
  console.log(`Orphan records: ${orphanRecords.length}`);
  orphanRecords.slice(0, 10).forEach(({ entry, booking }) => {
    console.log(`  · booking=${entry.bookingId}  student="${entry.studentName}"  history=${entry.id}  bookingStatus=${booking.status}`);
  });
  if (orphanRecords.length > 10) console.log(`  … and ${orphanRecords.length - 10} more`);

  console.log(`\n──── Summary ────`);
  console.log(`Bug 1 (duplicates):        ${dupGroups.length}`);
  console.log(`Bug 2 (date/day mismatch): ${mismatched.length}`);
  console.log(`Bug 3 (silent completeBooking fail): ${orphanRecords.length}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
