// FriendlyTeaching.cl — Create or update a corporate organization
//
// One-shot setup script for the Master Account feature. Creates the
// Firestore org doc, flips (or creates) the admin user with role
// 'corporate', and attaches the listed students to the org by email.
//
// Usage:
//   node scripts/create-corporate-org.js \
//     --name "Empresa XYZ" \
//     --admin-email admin@xyz.cl \
//     --admin-name "Nombre Apellido" \
//     --admin-password "ClaveTemp123!" \         # only when creating fresh
//     --students "ana@xyz.cl,bruno@xyz.cl,..." \ # already-existing students
//     --plan standard \                           # basic | standard | premium
//     --classes 1 \                               # classes per week per student
//     [--org-id my-custom-id]                     # optional, else auto
//     [--dry-run]
//
// Prints the final org id + a short summary. Idempotent: re-running with
// the same --org-id updates the existing doc rather than duplicating.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ── Load service account ──────────────────────────────────────

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

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

const auth = getAuth();
const db   = getFirestore();

// ── Arg parsing ───────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true; // boolean flag
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function usage(msg) {
  if (msg) console.error('\nError: ' + msg + '\n');
  console.error('Usage:');
  console.error('  node scripts/create-corporate-org.js \\');
  console.error('    --name "Empresa XYZ" \\');
  console.error('    --admin-email admin@xyz.cl \\');
  console.error('    --admin-name "Nombre Apellido" \\');
  console.error('    [--admin-password "ClaveTemp123!"] \\');
  console.error('    [--students "a@xyz.cl,b@xyz.cl"] \\');
  console.error('    [--plan standard]        # basic | standard | premium');
  console.error('    [--classes 1]            # classes per week per student');
  console.error('    [--org-id my-id]');
  console.error('    [--dry-run]');
  console.error('');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (!args.name)         usage('--name is required');
if (!args['admin-email']) usage('--admin-email is required');
if (!args['admin-name'])  usage('--admin-name is required');

const name          = args.name;
const adminEmail    = String(args['admin-email']).toLowerCase().trim();
const adminName     = args['admin-name'];
const adminPassword = args['admin-password'] || null;
const studentEmails = typeof args.students === 'string'
  ? args.students.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  : [];
const plan          = args.plan     || 'standard';
const classesPerWk  = Number(args.classes) || 1;
const customOrgId   = args['org-id'] || null;
const dryRun        = !!args['dry-run'];

if (!['basic', 'standard', 'premium'].includes(plan)) {
  usage(`--plan must be one of: basic, standard, premium (got "${plan}")`);
}

// ── Helpers ───────────────────────────────────────────────────

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function getOrCreateAuthUser(email, name, password) {
  try {
    const user = await auth.getUserByEmail(email);
    return { uid: user.uid, created: false };
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  if (!password) {
    throw new Error(`${email} does not exist in Firebase Auth and --admin-password was not provided to create it.`);
  }
  const user = await auth.createUser({
    email,
    password,
    displayName: name,
    emailVerified: true,
  });
  return { uid: user.uid, created: true };
}

async function resolveStudentUidsByEmail(emails) {
  const resolved = [];
  const missing  = [];
  for (const email of emails) {
    try {
      const u = await auth.getUserByEmail(email);
      resolved.push({ email, uid: u.uid });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        missing.push(email);
      } else {
        throw err;
      }
    }
  }
  return { resolved, missing };
}

// ── Main ──────────────────────────────────────────────────────

(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  FriendlyTeaching.cl — Create corporate account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Org name:     ', name);
  console.log('Plan:         ', plan);
  console.log('Classes/week: ', classesPerWk);
  console.log('Admin:        ', adminEmail, '(' + adminName + ')');
  console.log('Students:     ', studentEmails.length);
  console.log('Dry-run:      ', dryRun ? 'YES — nothing will be written' : 'no');
  console.log('');

  // 1. Admin user
  console.log('→ Resolving admin user…');
  const { uid: adminUid, created: adminCreated } = await getOrCreateAuthUser(
    adminEmail, adminName, adminPassword,
  );
  console.log(`  admin uid: ${adminUid} ${adminCreated ? '(created new)' : '(already exists)'}`);

  // 2. Students
  console.log('→ Resolving students…');
  const { resolved: students, missing } = await resolveStudentUidsByEmail(studentEmails);
  console.log(`  resolved: ${students.length}, missing: ${missing.length}`);
  if (missing.length) {
    console.log('  ⚠ Not in Firebase Auth — invite them first, then re-run:');
    missing.forEach(e => console.log('    -', e));
  }

  // 3. Org id
  const orgId = customOrgId || `org-${slugify(name)}-${Date.now().toString(36)}`;
  console.log(`→ Org id: ${orgId}`);

  if (dryRun) {
    console.log('');
    console.log('Dry-run — no writes. Would create:');
    console.log('  organizations/' + orgId);
    console.log('  users/' + adminUid + '  (role=corporate, orgId=' + orgId + ')');
    students.forEach(s => console.log('  users/' + s.uid + '  (studentData.organizationId=' + orgId + ')'));
    return;
  }

  // 4. Write org doc
  console.log('→ Writing org doc…');
  const orgRef = db.collection('organizations').doc(orgId);
  const existing = await orgRef.get();
  if (existing.exists) {
    console.log('  org exists — merging in updates');
    await orgRef.set({
      name,
      adminUids:     FieldValue.arrayUnion(adminUid),
      studentUids:   FieldValue.arrayUnion(...students.map(s => s.uid)),
      plan,
      classesPerWeek: classesPerWk,
      updatedAt:     FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    await orgRef.set({
      name,
      adminUids:      [adminUid],
      studentUids:    students.map(s => s.uid),
      plan,
      classesPerWeek: classesPerWk,
      startedAt:      Timestamp.now(),
      createdAt:      FieldValue.serverTimestamp(),
      updatedAt:      FieldValue.serverTimestamp(),
    });
  }

  // 5. Flip admin profile → role 'corporate'
  console.log('→ Updating admin profile…');
  const adminUserRef = db.collection('users').doc(adminUid);
  const adminProfile = await adminUserRef.get();
  const adminBase = adminProfile.exists ? adminProfile.data() : {
    uid:       adminUid,
    email:     adminEmail,
    fullName:  adminName,
    status:    'active',
    createdAt: FieldValue.serverTimestamp(),
  };
  await adminUserRef.set({
    ...adminBase,
    uid:       adminUid,
    email:     adminEmail,
    fullName:  adminName,
    role:      'corporate',
    status:    adminBase.status || 'active',
    corporateData: {
      organizationId: orgId,
      corporateRole:  'admin',
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // 6. Attach organizationId to each student profile (studentData.organizationId)
  if (students.length) {
    console.log('→ Attaching organizationId to each student…');
    for (const s of students) {
      await db.collection('users').doc(s.uid).set({
        studentData: { organizationId: orgId },
        updatedAt:   FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('  ✓', s.email);
    }
  }

  // 7. Summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Done');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Organization: ' + name);
  console.log('  id:         ' + orgId);
  console.log('  admin:      ' + adminEmail + '  (uid ' + adminUid + ')');
  console.log('  students:   ' + students.length);
  console.log('');
  console.log('The admin can now sign in at friendlyteaching.cl/auth/login');
  if (adminCreated && adminPassword) {
    console.log('  → initial password: ' + adminPassword + '  (ask them to change it)');
  }
  console.log('and will land on /dashboard/corporate.');
  if (missing.length) {
    console.log('');
    console.log('⚠ Students not in Firebase Auth — invite them first, then re-run');
    console.log('  with --org-id ' + orgId + ' to attach them to this org.');
  }
})().catch(err => {
  console.error('');
  console.error('✗ FAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 5).join('\n'));
  process.exit(1);
});
