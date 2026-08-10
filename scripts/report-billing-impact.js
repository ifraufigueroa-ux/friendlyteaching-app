// FriendlyTeaching.cl — Show which student/plan counts are inflated by
// classHistory duplicates. Read-only. Never writes.
//
// For each duplicate group (same teacher + booking + calendar date), we
// count how many attended=true copies exist beyond the first. Grouped
// by studentName to make the billing impact obvious.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

initAdmin();
const db = getFirestore();

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
  return null;
}

(async () => {
  const snap = await db.collection('classHistory').get();
  const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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

  // Aggregate impact per (teacherId, studentName)
  const byStudent = new Map();
  for (const [, arr] of dupGroups) {
    const attendedCount = arr.filter(e => e.attended === true).length;
    if (attendedCount <= 1) continue; // no over-count if only 1 is attended
    const surplus = attendedCount - 1;
    const first = arr[0];
    const key = `${first.teacherId}|${first.studentName}`;
    const cur = byStudent.get(key) ?? { teacherId: first.teacherId, studentName: first.studentName, extraClasses: 0, dates: [] };
    cur.extraClasses += surplus;
    const d = tsToDate(arr[0].date);
    if (d) cur.dates.push(d.toISOString().slice(0, 10));
    byStudent.set(key, cur);
  }

  const rows = [...byStudent.values()].sort((a, b) => b.extraClasses - a.extraClasses);
  console.log(`Students with inflated class counts due to duplicates:\n`);
  console.log(`${'Student'.padEnd(28)}${'Extra'.padStart(6)}   Dates`);
  console.log('─'.repeat(90));
  let totalSurplus = 0;
  for (const r of rows) {
    console.log(`${(r.studentName || '(unknown)').padEnd(28)}${String(r.extraClasses).padStart(6)}   ${r.dates.join(', ')}`);
    totalSurplus += r.extraClasses;
  }
  console.log('─'.repeat(90));
  console.log(`Total extra classes counted across all students: ${totalSurplus}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
