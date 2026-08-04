// FriendlyTeaching.cl — Clean duplicate bookings for Joselin.
//
// Some slots have >1 booking doc for the same (dayOfWeek, hour, minute,
// weekStart). Historically this comes from reschedule flows that created
// a new doc without removing the previous one. Rule applied (conservative):
//
//   For each group of same-slot-same-week docs:
//     • If any doc has status ∈ {confirmed, completed}, delete every
//       CANCELLED doc in the group. Never delete confirmed/completed docs
//       even when they are duplicates — they may carry attendance history.
//     • All-cancelled duplicate groups: leave alone.
//
// Usage:
//   node scripts/dedup-joselin-bookings.js            # dry run
//   node scripts/dedup-joselin-bookings.js --apply    # actually delete
//
// Before deleting, every candidate doc is dumped to a JSON snapshot in
// scripts/booking-snapshots/<runId>.json so a restore is always possible.

const { getFirestore } = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');
const { initAdmin } = require('./_lessonBackup');

const APPLY = process.argv.includes('--apply');

const SNAPSHOT_ROOT = path.join(__dirname, 'booking-snapshots');

initAdmin();
const db = getFirestore();

function slotKey(b) {
  return `${b.dayOfWeek}|${b.hour}|${b.minute ?? 0}|${b.weekStart?.seconds ?? 0}`;
}

function isLive(b)      { return b.status === 'confirmed' || b.status === 'completed'; }
function isCancelled(b) { return b.status === 'cancelled'; }

(async () => {
  const snap = await db.collection('bookings').get();
  const joselin = [];
  snap.forEach(doc => {
    const d = doc.data();
    const name = (d.studentName || '').toLowerCase();
    if (name.includes('joselin') || name.includes('joselyn') || name.includes('joseline')) {
      joselin.push({ id: doc.id, ref: doc.ref, ...d });
    }
  });

  console.log(`Joselin bookings scanned: ${joselin.length}`);

  const groups = new Map();
  for (const b of joselin) {
    const key = slotKey(b);
    const arr = groups.get(key);
    if (arr) arr.push(b); else groups.set(key, [b]);
  }

  const toDelete = [];
  let liveDupSlots = 0;
  let cancelledOnlyDupSlots = 0;
  let multipleLiveSlots = 0;

  for (const [, arr] of groups.entries()) {
    if (arr.length < 2) continue;

    const live = arr.filter(isLive);
    const cancelled = arr.filter(isCancelled);

    if (live.length > 0) {
      liveDupSlots++;
      // Only ever delete cancelled duplicates. Never touch a confirmed or
      // completed doc even when duplicated — the second doc may carry
      // separate attendance/session notes.
      toDelete.push(...cancelled);
      if (live.length > 1) multipleLiveSlots++;
    } else if (cancelled.length > 1) {
      cancelledOnlyDupSlots++;
      // All-cancelled duplicates are historical noise but harmless. Leave
      // them alone so the audit trail stays intact.
    }
  }

  console.log(`Slot groups with live+cancelled duplicates:      ${liveDupSlots}`);
  console.log(`Slot groups with multiple live docs (kept all):  ${multipleLiveSlots}`);
  console.log(`Slot groups all-cancelled with duplicates (skip):${cancelledOnlyDupSlots}`);
  console.log(`Total docs queued for deletion:                  ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    process.exit(0);
  }

  if (!APPLY) {
    console.log('(dry run — pass --apply to snapshot + delete)');
    // Print a small sample so we can eyeball what would go.
    toDelete.slice(0, 10).forEach(d => {
      console.log(`  · ${d.id}  dow=${d.dayOfWeek} ${d.hour}:${String(d.minute ?? 0).padStart(2, '0')}  weekStart=${new Date((d.weekStart?.seconds ?? 0) * 1000).toISOString().slice(0, 10)}  status=${d.status}`);
    });
    if (toDelete.length > 10) console.log(`  … and ${toDelete.length - 10} more`);
    process.exit(0);
  }

  // Snapshot every doc we're about to delete.
  fs.mkdirSync(SNAPSHOT_ROOT, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(SNAPSHOT_ROOT, `dedup-joselin-${runId}.json`);
  const payload = {
    runId,
    capturedAt: new Date().toISOString(),
    student: 'joselin',
    rule: 'dedup-same-slot-same-week',
    deleted: toDelete.map(d => {
      // Strip firestore-only fields.
      const { ref, ...rest } = d;
      return rest;
    }),
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Snapshot: ${path.relative(process.cwd(), outPath)}`);

  // Delete in batches. In firebase-admin the batch factory lives on the db
  // instance (db.batch()), not as a standalone export like in the client SDK.
  const BATCH_CAP = 450;
  let batch = db.batch();
  let ops = 0;
  for (const d of toDelete) {
    batch.delete(d.ref);
    ops++;
    if (ops % BATCH_CAP === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (ops % BATCH_CAP !== 0 || ops === 0) await batch.commit();
  console.log(`Deleted ${toDelete.length} bookings.`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
