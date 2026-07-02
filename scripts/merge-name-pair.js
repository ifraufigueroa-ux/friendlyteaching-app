// One-shot: manually merge a pair (or list of pairs) of student names in a
// teacher's classHistory + bookings. Use for typos that the auto-detector
// misses (e.g. "Daniela Lamas" → "Daniela Lanas", one-letter difference).
//
// Edit MERGES below and run:
//   node scripts/merge-name-pair.js           # dry run
//   node scripts/merge-name-pair.js --apply   # write

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

const TEACHER_UID = 'oc08NBSoyIel8zoWD6rp7RJxfRx2'; // Aranxa Bruna

// Each entry: { from: 'typo variant', to: 'canonical name' }
const MERGES = [
  { from: 'Daniela Lamas', to: 'Daniela Lanas' },
];

const APPLY = process.argv.includes('--apply');

(async () => {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  for (const { from, to } of MERGES) {
    console.log(`── "${from}"  →  "${to}"`);

    const [historySnap, bookingSnap] = await Promise.all([
      db.collection('classHistory')
        .where('teacherId', '==', TEACHER_UID)
        .where('studentName', '==', from).get(),
      db.collection('bookings')
        .where('teacherId', '==', TEACHER_UID)
        .where('studentName', '==', from).get(),
    ]);

    console.log(`   ${historySnap.size} classHistory · ${bookingSnap.size} bookings match "${from}"`);

    if (!APPLY) {
      console.log(`   (dry run — no writes)\n`);
      continue;
    }

    // classHistory batch update
    const hDocs = historySnap.docs;
    for (let i = 0; i < hDocs.length; i += 400) {
      const batch = db.batch();
      hDocs.slice(i, i + 400).forEach(d =>
        batch.update(d.ref, { studentName: to, updatedAt: FieldValue.serverTimestamp() })
      );
      await batch.commit();
    }
    // bookings batch update
    const bDocs = bookingSnap.docs;
    for (let i = 0; i < bDocs.length; i += 400) {
      const batch = db.batch();
      bDocs.slice(i, i + 400).forEach(d =>
        batch.update(d.ref, { studentName: to, updatedAt: FieldValue.serverTimestamp() })
      );
      await batch.commit();
    }
    console.log(`   ✓ Renamed ${hDocs.length} history + ${bDocs.length} bookings\n`);
  }
})().catch(e => { console.error('ERR:', e); process.exit(1); });
