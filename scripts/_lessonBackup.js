// Shared backup helper for any script that mutates a movieLessons doc.
//
// THE CONVENTION
// --------------
// ANY script in this folder that writes to a `movieLessons` doc MUST call
// `backupLessonDoc(db, lessonId, 'short-task-description')` BEFORE its
// first write. Snapshots land in `scripts/lesson-snapshots/<lessonId>/`
// as plain JSON files and are git-trackable. This exists because a prior
// script silently overwrote a teacher's hand-crafted alternatives in
// Firestore — no backup, no recovery path. Never again.
//
// CLI USAGE
// ---------
//   node scripts/snapshot-lesson.js <lessonId> [note]
//   node scripts/list-lesson-snapshots.js <lessonId>
//   node scripts/restore-lesson.js <lessonId> <snapshotFile> --yes

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { Timestamp } = require('firebase-admin/firestore');
const fs    = require('fs');
const path  = require('path');

const ADMIN_KEY_PATH = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const SNAPSHOT_ROOT  = path.join(__dirname, 'lesson-snapshots');

// Load the admin service account. Prefer the standalone JSON file (kept
// for legacy scripts) and fall back to FIREBASE_SERVICE_ACCOUNT_JSON in
// .env.local, which is the value the Vercel deployment already uses.
function loadServiceAccount() {
  if (fs.existsSync(ADMIN_KEY_PATH)) {
    return JSON.parse(fs.readFileSync(ADMIN_KEY_PATH, 'utf8'));
  }
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    const raw = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    const line = raw.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
    if (line) return JSON.parse(line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length));
  }
  throw new Error(`No admin credentials found. Missing both ${ADMIN_KEY_PATH} and FIREBASE_SERVICE_ACCOUNT_JSON in .env.local`);
}

function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({ credential: cert(loadServiceAccount()) });
}

function slugifyNote(note) {
  if (!note) return '';
  return '--' + String(note).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

async function backupLessonDoc(db, lessonId, note) {
  const ref  = db.collection('movieLessons').doc(lessonId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${lessonId} not found — nothing to back up`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file  = `${stamp}${slugifyNote(note)}.json`;
  const dir   = path.join(SNAPSHOT_ROOT, lessonId);
  fs.mkdirSync(dir, { recursive: true });

  const out = path.join(dir, file);
  const payload = {
    lessonId,
    capturedAt: new Date().toISOString(),
    note: note || null,
    data: snap.data(),
  };
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`✓ Snapshot: ${path.relative(process.cwd(), out)}`);
  return out;
}

// Walk a JSON-revived payload and turn Firestore Timestamp shapes
// ({_seconds, _nanoseconds} or {seconds, nanoseconds}) back into real
// admin.firestore.Timestamp values so ordering/queries survive a restore.
function reviveTimestamps(value) {
  if (Array.isArray(value)) return value.map(reviveTimestamps);
  if (value && typeof value === 'object') {
    const sec = value._seconds ?? value.seconds;
    const nsec = value._nanoseconds ?? value.nanoseconds;
    const keys = Object.keys(value);
    const looksLikeTimestamp =
      typeof sec === 'number' &&
      typeof nsec === 'number' &&
      keys.length <= 2 &&
      keys.every(k => k === '_seconds' || k === '_nanoseconds' || k === 'seconds' || k === 'nanoseconds');
    if (looksLikeTimestamp) return new Timestamp(sec, nsec);
    const out = {};
    for (const k of keys) out[k] = reviveTimestamps(value[k]);
    return out;
  }
  return value;
}

function listSnapshots(lessonId) {
  const dir = path.join(SNAPSHOT_ROOT, lessonId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(dir, f));
}

async function restoreLessonDoc(db, lessonId, snapshotPath) {
  if (!fs.existsSync(snapshotPath)) throw new Error(`Snapshot not found: ${snapshotPath}`);
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  if (payload.lessonId !== lessonId) {
    throw new Error(`Snapshot lessonId "${payload.lessonId}" ≠ target "${lessonId}"`);
  }
  // Belt-and-braces: snapshot the CURRENT state before clobbering it,
  // so a bad restore is still reversible.
  await backupLessonDoc(db, lessonId, `pre-restore-from-${path.basename(snapshotPath).replace('.json', '')}`);
  const revived = reviveTimestamps(payload.data);
  await db.collection('movieLessons').doc(lessonId).set(revived);
  console.log(`✓ Restored movieLessons/${lessonId} from ${path.basename(snapshotPath)}`);
}

module.exports = {
  initAdmin,
  backupLessonDoc,
  restoreLessonDoc,
  listSnapshots,
  SNAPSHOT_ROOT,
};
