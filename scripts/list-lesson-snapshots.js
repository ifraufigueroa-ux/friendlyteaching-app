// List all snapshots stored for a given lesson, newest last.
//
//   node scripts/list-lesson-snapshots.js <lessonId>
const fs   = require('fs');
const path = require('path');
const { listSnapshots, SNAPSHOT_ROOT } = require('./_lessonBackup');

const [, , lessonId] = process.argv;
if (!lessonId) {
  console.error('Usage: node scripts/list-lesson-snapshots.js <lessonId>');
  process.exit(1);
}

const files = listSnapshots(lessonId);
if (files.length === 0) {
  console.log(`(no snapshots yet for ${lessonId} — checked ${path.join(SNAPSHOT_ROOT, lessonId)})`);
  process.exit(0);
}

for (const f of files) {
  const st = fs.statSync(f);
  const sizeKB = (st.size / 1024).toFixed(1);
  let note = '';
  try { note = JSON.parse(fs.readFileSync(f, 'utf8')).note || ''; } catch {}
  console.log(`  ${path.relative(process.cwd(), f)}  ·  ${sizeKB} KB${note ? `  ·  "${note}"` : ''}`);
}
console.log(`\n${files.length} snapshot(s).`);
