// FriendlyTeaching.cl — Seed Skechers Chile demo
//
// One-shot seed for a corporate pitch demo. Creates:
//
//   • 10 Skechers employees with varied levels (A1 → B2), varied
//     attendance (45–100%), varied Daily Practice streaks.
//   • 12 weeks of class history per student (one class/week), with the
//     attendance mix matching each profile.
//   • Initial placement tests for all 10. A second placement test for 4
//     of them showing a 1-band CEFR improvement (makes the drill-down
//     slide look alive).
//   • Daily Practice progress docs for 6 of them.
//   • One corporate admin ("Carolina Martínez — HR Director").
//   • The `organizations/skechers-chile-demo` doc wiring everyone up.
//
// All timestamps are relative to today so the demo looks fresh forever.
// Idempotent: re-running updates the existing docs rather than
// duplicating. Bookings are keyed by `demo-skechers-<uid>-w<N>` so
// re-runs don't accumulate duplicates either.
//
// Usage:
//   node scripts/seed-skechers-demo.js --teacher-email you@friendlyteaching.cl
//   node scripts/seed-skechers-demo.js --dry-run
//
// After running, log in with the admin email + password printed at the
// end and open /dashboard/corporate.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ── Boot ──────────────────────────────────────────────────────

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}
if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
const auth = getAuth();
const db   = getFirestore();

// ── Args ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; }
    else { out[key] = next; i++; }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const dryRun       = !!args['dry-run'];
const teacherEmail = args['teacher-email'] || 'ifraufigueroa@gmail.com';
const STUDENT_PASS = args['student-password'] || 'SkechersDemo2026!';
const ADMIN_PASS   = args['admin-password']   || 'SkechersDemo2026!';

// ── Demo data ─────────────────────────────────────────────────

const ORG_ID    = 'skechers-chile-demo';
const ORG_NAME  = 'Skechers Chile';
const PROGRAM_WEEKS = 12;

const ADMIN = {
  email: 'rrhh@skechersdemo.cl',
  fullName: 'Carolina Martínez',
  title: 'HR Director — Skechers Chile',
};

/**
 * Each profile drives all the generated data for one student.
 *   level            → current CEFR level shown everywhere
 *   startLevel       → level at the initial placement 12 weeks ago
 *   attendancePct    → fraction of the 12 scheduled classes they attended
 *   practice         → null if they haven't started Daily Practice
 *   improved         → emit a second placement test showing bump to `level`
 *   role             → shown as a chip on the drill-down (future use)
 */
const STUDENTS = [
  { email: 'mjose.fuentes@skechersdemo.cl',  fullName: 'María José Fuentes', role: 'HR Manager',
    level: 'B2',  startLevel: 'B1',  attendancePct: 1.00, practice: { streak: 14, longest: 21, xp: 1240 }, improved: true },
  { email: 'diego.sanchez@skechersdemo.cl',  fullName: 'Diego Sánchez',      role: 'Store Manager Costanera',
    level: 'B1',  startLevel: 'A2',  attendancePct: 0.92, practice: { streak: 7,  longest: 12, xp: 680  }, improved: true },
  { email: 'camila.rojas@skechersdemo.cl',   fullName: 'Camila Rojas',       role: 'Marketing',
    level: 'B1',  startLevel: 'A2',  attendancePct: 0.88, practice: { streak: 21, longest: 21, xp: 1510 }, improved: true },
  { email: 'felipe.morales@skechersdemo.cl', fullName: 'Felipe Morales',     role: 'Finance',
    level: 'B1',  startLevel: 'B1',  attendancePct: 0.85, practice: null,                                   improved: false },
  { email: 'valentina.castro@skechersdemo.cl', fullName: 'Valentina Castro', role: 'HR Business Partner',
    level: 'B2',  startLevel: 'B2',  attendancePct: 0.95, practice: { streak: 10, longest: 18, xp: 980  }, improved: false },
  { email: 'matias.vargas@skechersdemo.cl',  fullName: 'Matías Vargas',      role: 'Operations',
    level: 'A2',  startLevel: 'A1',  attendancePct: 0.72, practice: { streak: 3,  longest: 6,  xp: 220  }, improved: true },
  { email: 'fernanda.rios@skechersdemo.cl',  fullName: 'Fernanda Ríos',      role: 'Retail Operations',
    level: 'A2',  startLevel: 'A1',  attendancePct: 0.90, practice: { streak: 15, longest: 15, xp: 1020 }, improved: true },
  { email: 'rodrigo.perez@skechersdemo.cl',  fullName: 'Rodrigo Pérez',      role: 'IT',
    level: 'B1+', startLevel: 'B1',  attendancePct: 1.00, practice: { streak: 28, longest: 28, xp: 2140 }, improved: false },
  { email: 'antonia.silva@skechersdemo.cl',  fullName: 'Antonia Silva',      role: 'E-commerce',
    level: 'A2',  startLevel: 'A2',  attendancePct: 0.68, practice: null,                                   improved: false },
  { email: 'sebastian.lopez@skechersdemo.cl',fullName: 'Sebastián López',    role: 'Logistics',
    level: 'A1',  startLevel: 'A1',  attendancePct: 0.45, practice: null,                                   improved: false },
];

const CLASS_TOPICS = [
  'Present simple — routines at work',
  'Past simple — storytelling',
  'Future with going to vs will',
  'Modals of obligation — company policies',
  'Present perfect — experience at Skechers',
  'Second conditional — hypothetical scenarios',
  'Business vocabulary — retail KPIs',
  'Phrasal verbs for meetings',
  'Email etiquette in English',
  'Giving a product presentation',
  'Negotiating with suppliers',
  'Customer complaints — handling tone',
];

// Spread class slots so students don't all land on Monday 10:00.
const CLASS_SLOTS = [
  { dayOfWeek: 1, hour: 9  },  // Lun 09:00
  { dayOfWeek: 1, hour: 18 },  // Lun 18:00
  { dayOfWeek: 2, hour: 10 },  // Mar 10:00
  { dayOfWeek: 2, hour: 17 },  // Mar 17:00
  { dayOfWeek: 3, hour: 12 },  // Mié 12:00
  { dayOfWeek: 3, hour: 19 },  // Mié 19:00
  { dayOfWeek: 4, hour: 9  },  // Jue 09:00
  { dayOfWeek: 4, hour: 18 },  // Jue 18:00
  { dayOfWeek: 5, hour: 11 },  // Vie 11:00
  { dayOfWeek: 5, hour: 16 },  // Vie 16:00
];

// Deterministic PRNG so re-runs produce the same demo data.
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Helpers ───────────────────────────────────────────────────

function todayStartOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysAgo(n) {
  const d = todayStartOfDay();
  d.setDate(d.getDate() - n);
  return d;
}
function mondayOf(date) {
  // JS getDay: 0=Sun, 1=Mon, … 6=Sat. We want Monday of that week.
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
function tsFromDate(d) { return Timestamp.fromDate(d); }

function levelToScore(level) {
  // Approx percentage shown in placement test result cards.
  return { A0: 22, A1: 38, A2: 54, B1: 68, 'B1+': 73, B2: 82, C1: 92 }[level] ?? 50;
}

async function getOrCreateAuthUser({ email, fullName, password }) {
  try {
    const u = await auth.getUserByEmail(email);
    return { uid: u.uid, created: false };
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  const u = await auth.createUser({
    email, password, displayName: fullName, emailVerified: true,
  });
  return { uid: u.uid, created: true };
}

// ── Seeders ───────────────────────────────────────────────────

async function seedStudent(student, teacherUid, orgId, programStart) {
  const { uid } = await getOrCreateAuthUser({
    email: student.email,
    fullName: student.fullName,
    password: STUDENT_PASS,
  });

  const prng = mulberry32(hashSeed(student.email));

  // Pick one weekly slot per student, consistent across the program.
  const slot = CLASS_SLOTS[Math.floor(prng() * CLASS_SLOTS.length)];

  // 1. User profile
  await db.collection('users').doc(uid).set({
    uid,
    email:    student.email,
    fullName: student.fullName,
    role:     'student',
    status:   'approved',
    language: 'es',
    studentData: {
      approvedByTeacherId: teacherUid,
      level: student.level,
      joinedAt: tsFromDate(programStart),
      organizationId: orgId,
      notes: `Rol en Skechers: ${student.role}`,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // 2. Bookings — one per week for PROGRAM_WEEKS weeks ending this week.
  // Idempotent via deterministic doc ids.
  const scheduled = PROGRAM_WEEKS;
  // Number of attended = round(attendancePct * scheduled). Pick which
  // weeks were attended using PRNG for believable "spread" absences.
  const attendedCount = Math.round(student.attendancePct * scheduled);
  const indices = Array.from({ length: scheduled }, (_, i) => i);
  // Shuffle via PRNG, take the first attendedCount as "attended".
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const attendedSet = new Set(indices.slice(0, attendedCount));

  for (let wk = 0; wk < scheduled; wk++) {
    const weeksBack = scheduled - wk - 1;
    const weekStartDate = mondayOf(daysAgo(weeksBack * 7));
    const didAttend = attendedSet.has(wk);
    const bookingId = `demo-skechers-${uid.slice(0, 8)}-w${wk}`;
    await db.collection('bookings').doc(bookingId).set({
      id: bookingId,
      teacherId:    teacherUid,
      studentId:    uid,
      studentName:  student.fullName,
      studentEmail: student.email,
      dayOfWeek:    slot.dayOfWeek,
      hour:         slot.hour,
      minute:       0,
      bookingType:  'class',
      weekStart:    tsFromDate(weekStartDate),
      status:       didAttend ? 'completed' : (prng() < 0.5 ? 'cancelled' : 'completed'),
      isRecurring:  true,
      recurringName: `Skechers · ${student.fullName.split(' ')[0]}`,
      attendance:   didAttend ? 'attended' : 'absent',
      topic:        CLASS_TOPICS[wk % CLASS_TOPICS.length],
      sessionNotes: didAttend ? `${student.fullName.split(' ')[0]} participó activamente. Práctica controlada + producción libre.` : null,
      createdAt:    tsFromDate(weekStartDate),
      updatedAt:    FieldValue.serverTimestamp(),
      completedAt:  didAttend ? tsFromDate(weekStartDate) : null,
    }, { merge: true });
  }

  // 3. Placement test(s)
  const initialPlacementAt = daysAgo(PROGRAM_WEEKS * 7 + 2);
  await db.collection('placementSessions').doc(`demo-skechers-${uid.slice(0, 8)}-initial`).set({
    studentId:   uid,
    studentEmail: student.email,
    level:       student.startLevel,
    score:       levelToScore(student.startLevel),
    completedAt: tsFromDate(initialPlacementAt),
    createdAt:   tsFromDate(initialPlacementAt),
    skills:      ['grammar'],
    isDemo:      true,
  }, { merge: true });

  if (student.improved) {
    const secondPlacementAt = daysAgo(14);
    await db.collection('placementSessions').doc(`demo-skechers-${uid.slice(0, 8)}-second`).set({
      studentId:   uid,
      studentEmail: student.email,
      level:       student.level,
      score:       levelToScore(student.level),
      completedAt: tsFromDate(secondPlacementAt),
      createdAt:   tsFromDate(secondPlacementAt),
      skills:      ['grammar', 'listening', 'reading'],
      isDemo:      true,
    }, { merge: true });
  }

  // 4. Daily Practice progress
  if (student.practice) {
    const lastPracticedDate = daysAgo(student.practice.streak > 0 ? 0 : 5);
    const y = lastPracticedDate.getFullYear();
    const m = String(lastPracticedDate.getMonth() + 1).padStart(2, '0');
    const d = String(lastPracticedDate.getDate()).padStart(2, '0');
    await db.collection('practiceProgress').doc(uid).set({
      studentId:            uid,
      currentLevel:         student.level === 'B1+' ? 'B2' : (student.level === 'C1' ? 'B2' : student.level),
      nextUnitId:           null,
      mastery:              {},
      currentStreak:        student.practice.streak,
      longestStreak:        student.practice.longest,
      lastPracticedAt:      `${y}-${m}-${d}`,
      totalXp:              student.practice.xp,
      startedFromPlacement: student.improved,
      createdAt:            tsFromDate(initialPlacementAt),
      updatedAt:            FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return uid;
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

// ── Main ──────────────────────────────────────────────────────

(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Skechers Chile — demo seed for the Master Account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Org id:         ', ORG_ID);
  console.log('Students:       ', STUDENTS.length);
  console.log('Admin:          ', ADMIN.email);
  console.log('Teacher of record', teacherEmail);
  console.log('Dry-run:        ', dryRun ? 'YES' : 'no');
  console.log('');

  // Teacher uid (bookings require teacherId)
  let teacherUid;
  try {
    const t = await auth.getUserByEmail(teacherEmail);
    teacherUid = t.uid;
  } catch {
    throw new Error(`Teacher ${teacherEmail} not found in Firebase Auth. Pass --teacher-email <existing teacher email>.`);
  }
  console.log('Teacher uid:    ', teacherUid);
  console.log('');

  if (dryRun) {
    console.log('Dry-run — would create:');
    console.log(`  organizations/${ORG_ID}`);
    console.log(`  1 admin: ${ADMIN.email}`);
    STUDENTS.forEach(s => {
      const bookings = PROGRAM_WEEKS;
      const atten = Math.round(s.attendancePct * bookings);
      console.log(`  ${s.fullName.padEnd(22)} ${s.startLevel}→${s.level}  ${atten}/${bookings} attended  streak:${s.practice?.streak ?? '-'}`);
    });
    return;
  }

  // Admin user
  console.log('→ Creating / resolving admin…');
  const { uid: adminUid, created: adminCreated } = await getOrCreateAuthUser({
    email: ADMIN.email, fullName: ADMIN.fullName, password: ADMIN_PASS,
  });
  console.log(`  admin uid ${adminUid} ${adminCreated ? '(new)' : '(reused)'}`);

  // Students
  console.log('→ Creating / resolving + seeding 10 students…');
  const programStart = daysAgo(PROGRAM_WEEKS * 7);
  const studentUids = [];
  for (const s of STUDENTS) {
    const uid = await seedStudent(s, teacherUid, ORG_ID, programStart);
    studentUids.push(uid);
    console.log(`  ✓ ${s.fullName.padEnd(22)} ${s.startLevel}→${s.level}  uid ${uid.slice(0, 10)}…`);
  }

  // Admin profile
  console.log('→ Writing admin profile (role=corporate)…');
  await db.collection('users').doc(adminUid).set({
    uid: adminUid,
    email: ADMIN.email,
    fullName: ADMIN.fullName,
    role: 'corporate',
    status: 'active',
    language: 'es',
    corporateData: {
      organizationId: ORG_ID,
      corporateRole: 'admin',
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Organization
  console.log('→ Writing organizations/' + ORG_ID + '…');
  await db.collection('organizations').doc(ORG_ID).set({
    name: ORG_NAME,
    primaryContactName:  ADMIN.fullName,
    primaryContactEmail: ADMIN.email,
    adminUids:   [adminUid],
    studentUids,
    plan: 'standard',
    classesPerWeek: 1,
    startedAt: tsFromDate(programStart),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isDemo: true,
  }, { merge: true });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Skechers Chile demo seeded');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Para la presentación:');
  console.log('  1. Abre https://friendlyteaching.cl/auth/login (o localhost)');
  console.log('  2. Login:');
  console.log('     email:    ' + ADMIN.email);
  console.log('     password: ' + ADMIN_PASS);
  console.log('  3. Aterriza directo en /dashboard/corporate');
  console.log('');
  console.log('Qué va a ver el cliente:');
  console.log('  • 10 empleados con niveles A1 → B2');
  console.log('  • Asistencia variada (45% al 100%) con barras de progreso');
  console.log('  • 4 empleados con progresión visible (ej. María José Fuentes B1→B2)');
  console.log('  • 6 empleados con racha de Daily Practice (3 a 28 días)');
  console.log('  • Click en cualquier fila → ficha completa con timeline de placement + historial de clases');
  console.log('');
})().catch(err => {
  console.error('');
  console.error('✗ FAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(1);
});
