// FriendlyTeaching.cl — repair: link orphan bookings to their uid
//
// Some bookings in the system carry `studentName` only, with
// `studentId: null`. The teacher's weekly schedule matches by name
// and surfaces them; the student dashboard filters strictly by
// studentId === uid and does not. Guillermo and Fernando have both
// been bitten by this when their schedule was edited this week.
//
// This script sweeps every orphan (studentId falsy + studentName set)
// and stamps studentId + studentEmail from the matching user. Guard:
// only writes when EXACTLY one user has that fullName — otherwise the
// attribution is ambiguous and the booking is left alone.
//
// Usage:
//   node scripts/link-orphan-bookings.js                 # dry-run report
//   node scripts/link-orphan-bookings.js --apply         # write changes
//   node scripts/link-orphan-bookings.js --name "Fernando" --apply
//
// Idempotent and safe to re-run.

const { initAdmin } = require('./_lessonBackup');
const { getFirestore } = require('firebase-admin/firestore');
initAdmin();
const db = getFirestore();

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const nameFlagIdx = args.indexOf('--name');
const ONLY_NAME = nameFlagIdx >= 0 ? args[nameFlagIdx + 1] : null;

(async () => {
  // Build fullName → user lookup (with ambiguity flag).
  const usersSnap = await db.collection('users').get();
  const byName = new Map();
  for (const d of usersSnap.docs) {
    const data = d.data();
    const name = (data.fullName || '').trim();
    if (!name) continue;
    const existing = byName.get(name);
    if (existing) { existing.ambiguous = true; existing.list.push({ uid: data.uid, email: data.email }); }
    else byName.set(name, { ambiguous: false, list: [{ uid: data.uid, email: data.email }] });
  }

  // Pull orphan bookings.
  const bSnap = await db.collection('bookings').get();
  const orphans = bSnap.docs
    .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
    .filter(b => !b.studentId && b.studentName && (!ONLY_NAME || b.studentName === ONLY_NAME));

  console.log(`Scanned ${bSnap.size} bookings.  Orphans: ${orphans.length}${ONLY_NAME ? ` (filter: ${ONLY_NAME})` : ''}`);

  // Group by studentName for reporting + batching.
  const grouped = new Map();
  for (const b of orphans) {
    const g = grouped.get(b.studentName) || { name: b.studentName, bookings: [] };
    g.bookings.push(b);
    grouped.set(b.studentName, g);
  }

  let linkableBookings  = 0;
  let ambiguousNames    = 0;
  let unmatchedNames    = 0;
  const toWrite = []; // { ref, uid, email, name }

  for (const [name, g] of grouped) {
    const u = byName.get(name);
    if (!u) {
      unmatchedNames += 1;
      console.log(`  × no user named "${name}" — ${g.bookings.length} bookings left alone`);
      continue;
    }
    if (u.ambiguous) {
      ambiguousNames += 1;
      console.log(`  ! name "${name}" is ambiguous (${u.list.length} users) — ${g.bookings.length} bookings left alone`);
      continue;
    }
    const target = u.list[0];
    linkableBookings += g.bookings.length;
    console.log(`  ✓ "${name}" → uid=${target.uid}  (${g.bookings.length} bookings)`);
    for (const b of g.bookings) {
      toWrite.push({ ref: b.ref, uid: target.uid, email: target.email || '', name });
    }
  }

  console.log(`\nSummary: ${linkableBookings} linkable · ${unmatchedNames} unmatched name groups · ${ambiguousNames} ambiguous.`);

  if (!APPLY) {
    console.log('\n(dry run — pass --apply to write changes)');
    process.exit(0);
  }
  if (toWrite.length === 0) {
    console.log('Nothing to write.');
    process.exit(0);
  }

  let written = 0;
  for (let i = 0; i < toWrite.length; i += 400) {
    const slice = toWrite.slice(i, i + 400);
    const batch = db.batch();
    for (const w of slice) {
      const update = { studentId: w.uid };
      if (w.email) update.studentEmail = w.email;
      batch.update(w.ref, update);
    }
    await batch.commit();
    written += slice.length;
    console.log(`  committed batch — total: ${written}`);
  }
  console.log(`\nDone. Linked ${written} bookings.`);
  process.exit(0);
})();
