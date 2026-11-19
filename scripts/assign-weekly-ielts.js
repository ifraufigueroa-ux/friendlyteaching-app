// FriendlyTeaching.cl — Assign Weekly IELTS to a student (CLI)
//
// Until the teacher-side UI ships, this script lets you create (or
// overwrite) a WeeklyIeltsAssignment doc for a given student with the
// intensity + plan shape you pick. The student's sidebar picks it up
// automatically on next render.
//
// Usage:
//   node scripts/assign-weekly-ielts.js --student <uidOrEmailOrName> \
//        [--teacher <teacherUidOrEmail>] \
//        [--intensity relaxed|regular|intensive] \
//        [--plan weekly|monthly] \
//        [--rotation academic-mock-1,academic-mock-2,academic-mock-3] \
//        [--archive]       # instead of creating, set status=archived
//        [--dry-run]
//
// Defaults: intensity=regular, plan=weekly, rotation=all three Academic
// mocks defined in src/lib/data/ielts/academicWeeklyMocks.ts.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}
if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
const auth = getAuth();
const db   = getFirestore();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; if (!a.startsWith('--')) continue;
    const key = a.slice(2); const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];

const DEFAULT_ROTATION = ['academic-mock-1', 'academic-mock-2', 'academic-mock-3'];
const VALID_INTENSITY  = ['relaxed', 'regular', 'intensive'];
const VALID_PLAN       = ['weekly', 'monthly'];

async function resolveUserByNeedle(needle, requireRole) {
  if (!needle) return null;
  // Try as uid first.
  const byUid = await db.collection('users').doc(needle).get();
  if (byUid.exists) {
    const d = byUid.data();
    if (!requireRole || d.role === requireRole) return { uid: byUid.id, ...d };
  }
  // Then email.
  if (needle.includes('@')) {
    const q = await db.collection('users').where('email', '==', needle).limit(2).get();
    if (q.size === 1) return { uid: q.docs[0].id, ...q.docs[0].data() };
    if (q.size > 1)  throw new Error(`Multiple users for email ${needle}.`);
  }
  // Then name substring (students only or role-matched).
  const pool = await db.collection('users').where('role', '==', requireRole ?? 'student').get();
  const hits = pool.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => String(u.fullName || '').toLowerCase().includes(needle.toLowerCase()));
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    console.error(`Multiple ${requireRole ?? 'user'} matches for "${needle}":`);
    for (const h of hits) console.error(`  uid=${h.uid}  "${h.fullName}"  ${h.email}`);
    throw new Error('Ambiguous — pass a uid or full email.');
  }
  return null;
}

(async () => {
  console.log(DRY ? '=== DRY RUN ===' : '=== EXECUTING ===');

  if (!args.student) throw new Error('--student <uidOrEmailOrName> is required');
  const student = await resolveUserByNeedle(args.student, 'student');
  if (!student) throw new Error(`No student found for "${args.student}".`);

  const teacherNeedle = args.teacher ?? student.studentData?.approvedByTeacherId;
  if (!teacherNeedle) throw new Error('No teacher to attribute — pass --teacher.');
  const teacher = await resolveUserByNeedle(teacherNeedle, 'teacher');
  if (!teacher) throw new Error(`No teacher found for "${teacherNeedle}".`);

  const intensity = (args.intensity ?? 'regular').toLowerCase();
  if (!VALID_INTENSITY.includes(intensity)) throw new Error(`--intensity must be one of ${VALID_INTENSITY.join(', ')}`);
  const planShape = (args.plan ?? 'weekly').toLowerCase();
  if (!VALID_PLAN.includes(planShape)) throw new Error(`--plan must be one of ${VALID_PLAN.join(', ')}`);

  const rotation = args.rotation
    ? String(args.rotation).split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ROTATION;
  if (rotation.length === 0) throw new Error('Rotation cannot be empty.');

  console.log(`Student: ${student.uid} · "${student.fullName}" · ${student.email}`);
  console.log(`Teacher: ${teacher.uid} · "${teacher.fullName}" · ${teacher.email}`);
  console.log(`Intensity=${intensity}  Plan=${planShape}  Rotation=[${rotation.join(', ')}]`);

  const ref = db.collection('weeklyIeltsAssignments').doc(student.uid);

  if (args.archive) {
    if (!DRY) await ref.set({ status: 'archived', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(`\n✓ Archived weeklyIeltsAssignments/${student.uid}${DRY ? ' (dry-run)' : ''}`);
    return;
  }

  const firstMockId = rotation[0];
  const payload = {
    studentId:   student.uid,
    teacherId:   teacher.uid,
    intensity,
    planShape,
    mockRotation: rotation,
    currentMockIndex: 0,
    currentMock: {
      mockId:    firstMockId,
      startedAt: Timestamp.now(),
      modulesCompleted: {},
    },
    completedMocks: [],
    assignedAt: FieldValue.serverTimestamp(),
    updatedAt:  FieldValue.serverTimestamp(),
    status: 'active',
  };

  if (!DRY) await ref.set(payload, { merge: false });
  console.log(`\n✓ Wrote weeklyIeltsAssignments/${student.uid}${DRY ? ' (dry-run)' : ''}`);
  console.log('   Student sidebar will show "Weekly IELTS" on next reload.');
})().catch((e) => { console.error('ERROR:', e.message || e); process.exit(1); });
