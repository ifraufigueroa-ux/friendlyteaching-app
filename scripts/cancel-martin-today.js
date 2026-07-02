// One-shot: cancel Martin Frau's booking for Thursday 2 July 2026 at 11:00
// in Aranxa Bruna's schedule. Leaves the rest of the recurring series intact.
//
// Pass --apply to write; without it the script only prints what it would do.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

const TEACHER_UID = 'oc08NBSoyIel8zoWD6rp7RJxfRx2';
const STUDENT_NAME = 'Martin Frau';
const TARGET_WEEK_START = '2026-06-29'; // Monday of the week containing Thu 2 Jul
const TARGET_DOW = 4;   // Thursday (1=Mon…7=Sun in this app)
const TARGET_HOUR = 11;
const TARGET_MIN = 0;

const APPLY = process.argv.includes('--apply');

(async () => {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Target: ${STUDENT_NAME} · Thu ${TARGET_WEEK_START}+ · ${TARGET_HOUR}:${String(TARGET_MIN).padStart(2, '0')}\n`);

  const snap = await db.collection('bookings')
    .where('teacherId', '==', TEACHER_UID)
    .where('studentName', '==', STUDENT_NAME)
    .get();

  const matches = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (d.dayOfWeek !== TARGET_DOW) return;
    if (d.hour !== TARGET_HOUR) return;
    if ((d.minute ?? 0) !== TARGET_MIN) return;

    const ws = d.weekStart;
    const wsDate = ws?.toDate ? ws.toDate() : new Date(ws?.seconds ? ws.seconds * 1000 : ws);
    const wsStr = wsDate.toISOString().slice(0, 10);
    if (wsStr !== TARGET_WEEK_START) return;

    matches.push({ id: doc.id, status: d.status, weekStart: wsStr });
  });

  if (matches.length === 0) {
    console.log('No matching booking found. Nothing to cancel.');
    return;
  }
  console.log(`Found ${matches.length} matching booking(s):`);
  console.table(matches);

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to cancel.');
    return;
  }

  for (const m of matches) {
    if (m.status === 'cancelled') {
      console.log(`  ${m.id}: already cancelled — skipping`);
      continue;
    }
    await db.collection('bookings').doc(m.id).update({
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${m.id} → cancelled`);
  }
})().catch(e => { console.error('ERR:', e); process.exit(1); });
