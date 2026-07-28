// One-shot recovery: list every ielts-listening MP3 in Firebase Storage
// that belongs to a given teacher, grouped by section. Prints signed
// download URLs (valid for 7 days) so you can bind them back manually
// or just download them.
//
// Usage:
//   node scripts/find-orphan-ielts-audios.js ifraufigueroa@gmail.com
//   node scripts/find-orphan-ielts-audios.js <teacherUid>

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');

const BUCKET = 'friendly-scheduling.firebasestorage.app';

// Read service account from .env.local (single-line JSON under
// FIREBASE_SERVICE_ACCOUNT_JSON) so we don't depend on a loose key file.
function loadServiceAccount() {
  const envPath = require('path').join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({
    credential: cert(loadServiceAccount()),
    storageBucket: BUCKET,
  });
}
const db = getFirestore();
const bucket = getStorage().bucket();

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node find-orphan-ielts-audios.js <email or uid>');
  process.exit(1);
}

async function resolveUid(input) {
  if (input.includes('@')) {
    const snap = await db.collection('users').where('email', '==', input).limit(1).get();
    if (snap.empty) throw new Error(`No user with email ${input}`);
    return snap.docs[0].id;
  }
  return input;
}

// Filenames follow one of two patterns:
//   audio/ielts-{section}-{teacherId}-{timestamp}.{ext}     (uploaded)
//   audio/ielts-{section}-dialogue-{teacherId}-{timestamp}.mp3  (generated)
function parseFilename(name) {
  const stripped = name.replace(/^audio\//, '');
  // Try dialogue (generated) pattern first
  let m = stripped.match(/^ielts-(\d+)-dialogue-([A-Za-z0-9]+)-(\d+)\.mp3$/);
  if (m) return { section: Number(m[1]), teacherId: m[2], ts: Number(m[3]), source: 'generated' };
  // Fallback: uploaded pattern
  m = stripped.match(/^ielts-(\d+)-([A-Za-z0-9]+)-(\d+)\.[a-zA-Z0-9]+$/);
  if (m) return { section: Number(m[1]), teacherId: m[2], ts: Number(m[3]), source: 'uploaded' };
  return null;
}

(async () => {
  const uid = await resolveUid(arg);
  console.log(`\n🔍 Buscando audios ielts para teacherId=${uid}\n`);

  const [files] = await bucket.getFiles({ prefix: 'audio/ielts-' });
  console.log(`Total ielts-* en el bucket: ${files.length}\n`);

  const mine = [];
  for (const f of files) {
    const parsed = parseFilename(f.name);
    if (!parsed) continue;
    if (parsed.teacherId !== uid) continue;
    mine.push({ ...parsed, path: f.name, size: Number(f.metadata.size ?? 0), created: f.metadata.timeCreated });
  }

  if (mine.length === 0) {
    console.log('No hay audios tuyos en el bucket.');
    return;
  }

  // Group by section
  const bySection = {};
  for (const m of mine) {
    (bySection[m.section] ??= []).push(m);
  }

  for (const section of [1, 2, 3, 4]) {
    const list = (bySection[section] ?? []).sort((a, b) => b.ts - a.ts);
    console.log(`\n── SECTION ${section} · ${list.length} audio${list.length !== 1 ? 's' : ''} ─────────────────`);
    for (const [i, m] of list.entries()) {
      const kb = (m.size / 1024).toFixed(1);
      const date = new Date(m.ts).toISOString();
      const [url] = await bucket.file(m.path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,   // 7 days
      });
      const tag = i === 0 ? '⭐ más reciente' : `  #${i + 1}`;
      console.log(`  ${tag} · ${m.source.padEnd(9)} · ${kb.padStart(7)} KB · ${date}`);
      console.log(`     ${m.path}`);
      console.log(`     ${url}\n`);
    }
  }

  console.log('\n💡 Los URLs firmados expiran en 7 días. Copiá los que quieras y pegalos en el runner');
  console.log('   ("Pegar URL" en cada sección) — cuando pegues, el sistema los persiste al binding.\n');
})();
