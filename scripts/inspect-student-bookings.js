// Quick inspection: dump every booking a teacher has for a given student name.
// Usage:
//   node scripts/inspect-student-bookings.js <teacherUid> "<studentName substring>"
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

const [teacherUid, needleRaw] = process.argv.slice(2);
if (!teacherUid || !needleRaw) {
  console.error('Usage: node inspect-student-bookings.js <teacherUid> "<student substring>"');
  process.exit(1);
}
const needle = needleRaw.toLowerCase();

const DOW_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toISOString().slice(0, 10);
}

(async () => {
  const snap = await db.collection('bookings').where('teacherId', '==', teacherUid).get();
  const rows = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (!(d.studentName || '').toLowerCase().includes(needle)) return;
    rows.push({
      id: doc.id,
      studentName: d.studentName,
      dow: DOW_ES[d.dayOfWeek] ?? d.dayOfWeek,
      hour: d.hour,
      minute: d.minute ?? 0,
      status: d.status,
      attendance: d.attendance ?? '—',
      isRecurring: d.isRecurring,
      weekStart: fmtTs(d.weekStart),
      lessonId: d.lessonId ?? '—',
      cancelledAt: fmtTs(d.cancelledAt),
    });
  });

  rows.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  console.log(`Found ${rows.length} bookings for "${needleRaw}" under teacher ${teacherUid}\n`);

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  console.log('By status:', byStatus, '\n');

  console.log('First 20 (chronological):');
  console.table(rows.slice(0, 20));

  if (rows.length > 20) {
    console.log(`\nLast 20:`);
    console.table(rows.slice(-20));
  }
})().catch(e => { console.error('ERR:', e); process.exit(1); });
