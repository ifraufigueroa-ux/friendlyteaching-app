// List every evaluationRequests doc (landing-page lead form submissions).
// Prints created date, name, email, status, whether the email was sent,
// and any error string captured by /api/notify.
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

(async () => {
  const snap = await db.collection('evaluationRequests').orderBy('createdAt', 'desc').get();
  console.log(`Total in evaluationRequests: ${snap.size}\n`);

  const rows = [];
  let sentCount = 0, failedCount = 0;
  snap.forEach(doc => {
    const d = doc.data();
    if (d.emailSent === true) sentCount++;
    else failedCount++;
    rows.push({
      created: fmt(d.createdAt),
      nombre: (d.nombre || '').slice(0, 20),
      email: (d.email || '').slice(0, 30),
      telefono: (d.telefono || '').slice(0, 15),
      status: d.status || '—',
      emailSent: d.emailSent === true ? '✓' : '✗',
      err: (d.emailError || '').slice(0, 40),
    });
  });

  console.table(rows.slice(0, 30));
  console.log(`\nemailSent=true: ${sentCount}   emailSent=false: ${failedCount}`);

  // Show the last 5 failed errors in full so we can diagnose Resend issues.
  const failures = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (d.emailSent !== true && d.emailError) failures.push({ id: doc.id, ts: fmt(d.createdAt), err: d.emailError });
  });
  if (failures.length > 0) {
    console.log('\n── Recent email-send failures (full error strings) ──');
    for (const f of failures.slice(0, 5)) {
      console.log(`\n[${f.ts}] ${f.id}`);
      console.log(`  ${f.err}`);
    }
  }
})().catch(e => { console.error('ERR:', e); process.exit(1); });
