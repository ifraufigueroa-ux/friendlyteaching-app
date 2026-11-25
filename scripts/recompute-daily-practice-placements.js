// One-off recompute: re-derive every student's Daily Practice CEFR
// placement using the new two-threshold bridge-up rule (shipped
// 2026-11-25). Historical placements used a single 0.6 threshold and
// could leave students one band below where their accuracy actually
// warranted (classic case: 80% A1/A2 + 50% B1/B2 placed at A2 instead
// of B1).
//
// What it reads:
//   · dailyPracticePlacement/{uid}  — status==='completed' only
//   · users/{uid}                   — for human-readable names in logs
//   · practiceProgress/{uid}        — to decide if we also need to bump
//                                     currentLevel
//
// What it writes (only with --apply):
//   · dailyPracticePlacement/{uid}  — placedLevel always re-derived
//                                     from the stored answers
//   · practiceProgress/{uid}        — placedLevel always re-derived;
//                                     currentLevel bumped UP only (never
//                                     demoted) so a student mid-course
//                                     at their old (too-low) level gets
//                                     promoted but someone already
//                                     above the new result keeps their
//                                     earned progress
//
// CLI:
//   node scripts/recompute-daily-practice-placements.js          # dry run
//   node scripts/recompute-daily-practice-placements.js --apply  # writes

const { initAdmin } = require('./_lessonBackup');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initAdmin();
const db = getFirestore();

const APPLY = process.argv.includes('--apply');

// ── Placement logic mirroring src/lib/placement/adaptiveRunner.ts ──

const LEVEL_SEQUENCE = ['A0', 'A1', 'A2', 'B1', 'B2', 'B2+', 'C1'];
const MASTERED_THRESHOLD = 0.70;
const PARTIAL_THRESHOLD  = 0.50;
const MIN_PER_LEVEL      = 5;

function levelUp(l) {
  const i = LEVEL_SEQUENCE.indexOf(l);
  return LEVEL_SEQUENCE[Math.min(i + 1, LEVEL_SEQUENCE.length - 1)];
}
function levelOrder(l) { return LEVEL_SEQUENCE.indexOf(l); }

function accuracyByLevel(answers) {
  const by = {};
  for (const lvl of LEVEL_SEQUENCE) by[lvl] = { answered: 0, correct: 0, pct: 0 };
  for (const a of answers || []) {
    const row = by[a.level];
    if (!row) continue;
    row.answered++;
    if (a.correct) row.correct++;
  }
  for (const lvl of LEVEL_SEQUENCE) {
    const r = by[lvl];
    r.pct = r.answered > 0 ? r.correct / r.answered : 0;
  }
  return by;
}

function highestMastered(answers) {
  if (!answers || answers.length === 0) return 'A0';
  const stats = accuracyByLevel(answers);
  let placed = 'A0';
  for (const lvl of LEVEL_SEQUENCE) {
    const r = stats[lvl];
    if (r.answered >= MIN_PER_LEVEL && r.pct >= MASTERED_THRESHOLD) placed = lvl;
  }
  return placed;
}

function determineFinalLevel(answers) {
  if (!answers || answers.length === 0) return 'A0';
  const floor = highestMastered(answers);
  const up = levelUp(floor);
  if (up === floor) return floor; // already at top
  const stats = accuracyByLevel(answers);
  const upStats = stats[up];
  if (upStats.answered >= MIN_PER_LEVEL && upStats.pct >= PARTIAL_THRESHOLD) return up;
  return floor;
}

// ── Main ─────────────────────────────────────────────────────

function formatPerLevel(stats) {
  return LEVEL_SEQUENCE.map(l => {
    const r = stats[l];
    if (r.answered === 0) return null;
    const pct = Math.round(r.pct * 100);
    return `${l}:${r.correct}/${r.answered}(${pct}%)`;
  }).filter(Boolean).join('  ');
}

(async () => {
  console.log(`Mode: ${APPLY ? 'APPLY (writes)' : 'DRY RUN (no writes — re-run with --apply to commit)'}\n`);

  const dpSnap = await db.collection('dailyPracticePlacement').get();
  console.log(`Scanned ${dpSnap.size} dailyPracticePlacement docs.`);

  const rows = [];
  for (const d of dpSnap.docs) {
    const data = d.data() || {};
    if (data.status !== 'completed') continue;
    const answers = data.answers || [];
    if (answers.length === 0) continue;

    const newPlaced = determineFinalLevel(answers);
    const oldPlaced = data.placedLevel || null;

    const userSnap = await db.collection('users').doc(d.id).get();
    const user = userSnap.exists ? userSnap.data() : {};
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ')
      || user.displayName
      || user.name
      || user.email
      || d.id.slice(0, 8);

    const ppSnap = await db.collection('practiceProgress').doc(d.id).get();
    const pp = ppSnap.exists ? ppSnap.data() : null;
    const oldCurrent   = pp?.currentLevel ?? null;
    const oldPPplaced  = pp?.placedLevel ?? null;

    // Bump currentLevel only when the new placement is strictly above
    // where the student is practicing today — never auto-demote.
    const willBumpCurrent =
      pp && oldCurrent &&
      LEVEL_SEQUENCE.includes(oldCurrent) &&
      levelOrder(newPlaced) > levelOrder(oldCurrent);

    const stats = accuracyByLevel(answers);
    rows.push({
      uid: d.id,
      name,
      oldPlaced, newPlaced,
      oldCurrent, oldPPplaced,
      willBumpCurrent,
      perLevel: formatPerLevel(stats),
      answersTotal: answers.length,
      placedChanged:   newPlaced !== oldPlaced,
      ppPlacedChanged: !!pp && newPlaced !== oldPPplaced,
    });
  }

  // Sort: changes first, then by name.
  rows.sort((a, b) => {
    const aAny = a.placedChanged || a.ppPlacedChanged || a.willBumpCurrent ? 0 : 1;
    const bAny = b.placedChanged || b.ppPlacedChanged || b.willBumpCurrent ? 0 : 1;
    if (aAny !== bAny) return aAny - bAny;
    return a.name.localeCompare(b.name);
  });

  const changing   = rows.filter(r => r.placedChanged || r.ppPlacedChanged || r.willBumpCurrent);
  const unchanged  = rows.filter(r => !(r.placedChanged || r.ppPlacedChanged || r.willBumpCurrent));

  console.log(`Completed placements scored: ${rows.length}`);
  console.log(`  · unchanged:         ${unchanged.length}`);
  console.log(`  · placedLevel diff:  ${rows.filter(r => r.placedChanged).length}`);
  console.log(`  · currentLevel bump: ${rows.filter(r => r.willBumpCurrent).length}\n`);

  for (const r of changing) {
    const arrow = `${(r.oldPlaced || '—').padStart(3)} → ${r.newPlaced.padEnd(3)}`;
    const bump  = r.willBumpCurrent
      ? `  currentLevel: ${r.oldCurrent} → ${r.newPlaced}`
      : '';
    console.log(`  · ${r.name.padEnd(28)}  placed: ${arrow}${bump}`);
    console.log(`      [${r.answersTotal} answers]  ${r.perLevel}`);
  }

  if (!APPLY) {
    console.log(`\nDry run complete. Re-run with --apply to commit the ${changing.length} changes.`);
    process.exit(0);
  }

  if (changing.length === 0) {
    console.log('\nNothing to apply.');
    process.exit(0);
  }

  console.log(`\nWriting ${changing.length} updates…`);
  // Firestore batch limit is 500; we're nowhere near it but split anyway.
  const CHUNK = 200;
  let written = 0;
  for (let i = 0; i < changing.length; i += CHUNK) {
    const batch = db.batch();
    for (const r of changing.slice(i, i + CHUNK)) {
      if (r.placedChanged) {
        batch.set(
          db.collection('dailyPracticePlacement').doc(r.uid),
          { placedLevel: r.newPlaced, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
      const ppPatch = { updatedAt: FieldValue.serverTimestamp() };
      if (r.ppPlacedChanged) ppPatch.placedLevel = r.newPlaced;
      if (r.willBumpCurrent) {
        ppPatch.currentLevel = r.newPlaced;
        // Clear the pointer so the landing picks a unit at the new
        // level instead of dropping the student back into the stale
        // next-unit they had at their old (too-low) band.
        ppPatch.nextUnitId   = null;
      }
      if (Object.keys(ppPatch).length > 1) {
        batch.set(
          db.collection('practiceProgress').doc(r.uid),
          ppPatch,
          { merge: true },
        );
      }
    }
    await batch.commit();
    written += Math.min(CHUNK, changing.length - i);
    console.log(`  … wrote ${written}/${changing.length}`);
  }
  console.log(`✓ Done. Updated ${changing.length} students.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
