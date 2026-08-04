// FriendlyTeaching.cl — One-shot inspection of Joselin's bookings
// Usage: node scripts/inspect-joselin-bookings.js
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

initAdmin();
const db = getFirestore();

const DOW_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtTs(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString().slice(0, 10);
  if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString().slice(0, 10);
  return null;
}

(async () => {
  const snap = await db.collection('bookings').get();
  const matches = [];
  snap.forEach(doc => {
    const d = doc.data();
    const name = (d.studentName || '').toLowerCase();
    if (name.includes('joselin') || name.includes('joselyn') || name.includes('joseline')) {
      matches.push({ id: doc.id, ...d });
    }
  });

  if (matches.length === 0) {
    console.log('No bookings found with name containing "joselin"');

    // Also check students collection
    const studSnap = await db.collection('students').get();
    console.log('\nSearching students collection…');
    studSnap.forEach(doc => {
      const d = doc.data();
      const name = (d.fullName || d.name || '').toLowerCase();
      if (name.includes('joselin') || name.includes('joselyn') || name.includes('joseline')) {
        console.log(`  Student: ${doc.id}  fullName="${d.fullName}"  approved=${d.approved}  teacherId=${d.teacherId}`);
      }
    });
    process.exit(0);
  }

  console.log(`Found ${matches.length} booking(s) matching "joselin"`);

  // Focus on current week (Monday 2026-08-03) and adjacent weeks so we can see
  // whether the planner is correctly picking the doc for THIS week.
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  const mondayMs = monday.getTime();
  const weekDaysMs = 7 * 24 * 60 * 60 * 1000;

  console.log(`Current week Monday: ${monday.toISOString().slice(0, 10)}\n`);

  const inWindow = matches.filter(b => {
    const ms = b.weekStart?.seconds ? b.weekStart.seconds * 1000 : 0;
    return ms >= mondayMs - weekDaysMs && ms <= mondayMs + weekDaysMs;
  });

  console.log(`In [prev, current, next] week window: ${inWindow.length}\n`);
  inWindow
    .sort((a, b) => {
      const aMs = a.weekStart?.seconds ?? 0;
      const bMs = b.weekStart?.seconds ?? 0;
      return aMs - bMs;
    })
    .forEach(b => {
      const dow = DOW_ES[b.dayOfWeek] ?? '?';
      const min = String(b.minute ?? 0).padStart(2, '0');
      console.log(`─ ${b.id}`);
      console.log(`   student:     ${b.studentName}  [studentId=${b.studentId || '—'}]`);
      console.log(`   slot:        ${dow} ${b.hour}:${min}  (dow=${b.dayOfWeek})`);
      console.log(`   weekStart:   ${fmtTs(b.weekStart)}`);
      console.log(`   isRecurring: ${b.isRecurring}`);
      console.log(`   status:      ${b.status}`);
      console.log(`   teacherId:   ${b.teacherId}`);
      console.log(`   bookingType: ${b.bookingType || '—'}`);
      console.log('');
    });

  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
