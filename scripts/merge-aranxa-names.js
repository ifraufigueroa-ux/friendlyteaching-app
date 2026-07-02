// One-shot: detect + merge duplicated student names in Aranxa's classHistory
// and bookings. Canonical form is:
//   1. The variant with the MOST tokens (Nombre + Apellido beats Nombre)
//   2. Among ties, the variant with MORE accented characters (tildes/diéresis)
//   3. Among ties, alphabetical
//
// Detection combines the app's own `areSimilarNames` (accent + first-name
// prefix) with a "same-first-token OR nickname-of + same-last-token" rule to
// catch pairs like "Anto Acuña" ↔ "Antonia Acuña" that the strict prefix
// rule misses.
//
// Pass --apply to write; without it the script only prints what it would do.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

const TEACHER_UID = 'oc08NBSoyIel8zoWD6rp7RJxfRx2'; // Aranxa Bruna
const APPLY = process.argv.includes('--apply');

// ── Helpers ────────────────────────────────────────────────────────────

function normalize(s) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function tokens(s) { return normalize(s).split(/\s+/).filter(Boolean); }
function tokenCount(s) { return tokens(s).length; }
function accentCount(s) {
  // Count code-points that decompose to letter + combining mark.
  const decomposed = s.normalize('NFD');
  return (decomposed.match(/[̀-ͯ]/g) || []).length;
}

function areSimilar(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  // Rule 1: normalized equality
  if (normalize(a) === normalize(b)) return true;

  const [shortT, longT] = ta.length <= tb.length ? [ta, tb] : [tb, ta];

  // Rule 2 (strict): same first token AND the shorter is a full-token prefix
  if (shortT[0] === longT[0]) {
    // e.g. ["andree"] vs ["andree","barraza"] — matches
    const shortStr = shortT.join(' ');
    const longStr  = longT.join(' ');
    if (longStr === shortStr || longStr.startsWith(shortStr + ' ')) return true;
  }

  // Rule 3 (lenient): if BOTH names have a last-token match AND the first
  // tokens are a prefix relationship, treat as same person.
  // Catches "Anto Acuña" ↔ "Antonia Acuña" (last token "acuña" matches,
  // "anto" is prefix of "antonia").
  if (shortT.length >= 2 && longT.length >= 2) {
    const shortLast = shortT[shortT.length - 1];
    const longLast  = longT[longT.length  - 1];
    if (shortLast === longLast) {
      const shortFirst = shortT[0];
      const longFirst  = longT[0];
      if (longFirst.startsWith(shortFirst) && longFirst !== shortFirst) return true;
    }
  }

  return false;
}

function groupSimilar(names) {
  const visited = new Set();
  const groups = [];
  for (const n of names) {
    if (visited.has(n)) continue;
    const g = names.filter(m => areSimilar(n, m));
    g.forEach(m => visited.add(m));
    if (g.length > 1) groups.push(g);
  }
  return groups;
}

function pickCanonical(names) {
  // Priority per teacher spec:
  //   1. Longest normalised name — "Antonia Acuña" > "Anto Acuña", full name > nickname
  //   2. Most accents — "Beatriz Sepúlveda" > "Beatriz Sepulveda"
  //   3. Most tokens — safety net for edge cases
  //   4. Alpha asc — deterministic tiebreak
  const sorted = [...names].sort((a, b) => {
    const lc = normalize(b).length - normalize(a).length;
    if (lc !== 0) return lc;
    const ac = accentCount(b) - accentCount(a);
    if (ac !== 0) return ac;
    const tc = tokenCount(b) - tokenCount(a);
    if (tc !== 0) return tc;
    return a.localeCompare(b, 'es');
  });
  return sorted[0];
}

// ── Main ───────────────────────────────────────────────────────────────

(async () => {
  console.log(`Teacher: Aranxa Bruna (${TEACHER_UID})`);
  console.log(`Mode: ${APPLY ? 'APPLY (writes to Firestore)' : 'DRY RUN (no writes)'}\n`);

  // 1. Load all classHistory + bookings for this teacher.
  const historySnap = await db.collection('classHistory')
    .where('teacherId', '==', TEACHER_UID).get();
  const bookingSnap = await db.collection('bookings')
    .where('teacherId', '==', TEACHER_UID).get();

  console.log(`Loaded: ${historySnap.size} classHistory entries · ${bookingSnap.size} bookings`);

  // 2. Collect unique student names + doc references.
  const nameToHistory = new Map(); // name → doc IDs
  const nameToBooking = new Map();
  historySnap.forEach(d => {
    const n = (d.data().studentName || '').trim();
    if (!n) return;
    if (!nameToHistory.has(n)) nameToHistory.set(n, []);
    nameToHistory.get(n).push(d.id);
  });
  bookingSnap.forEach(d => {
    const n = (d.data().studentName || '').trim();
    if (!n) return;
    if (!nameToBooking.has(n)) nameToBooking.set(n, []);
    nameToBooking.get(n).push(d.id);
  });

  const allNames = [...new Set([...nameToHistory.keys(), ...nameToBooking.keys()])].sort();
  console.log(`Unique names across both collections: ${allNames.length}\n`);

  // 3. Detect duplicate groups.
  const groups = groupSimilar(allNames);
  if (groups.length === 0) {
    console.log('No duplicate groups detected. Nothing to do.');
    return;
  }

  console.log(`Detected ${groups.length} duplicate group(s):\n`);
  const plans = [];
  for (const group of groups) {
    const canonical = pickCanonical(group);
    const merges = group.filter(n => n !== canonical);
    console.log(`  ✓ Keep:   "${canonical}"`);
    for (const m of merges) {
      const h = (nameToHistory.get(m) || []).length;
      const b = (nameToBooking.get(m) || []).length;
      console.log(`    ↳ Merge: "${m}"  (${h} history · ${b} bookings)`);
    }
    console.log('');
    plans.push({ canonical, merges });
  }

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write the changes.');
    return;
  }

  // 4. Apply merges in batched writes.
  console.log('Applying merges…');
  let historyUpdates = 0;
  let bookingUpdates = 0;

  for (const { canonical, merges } of plans) {
    for (const oldName of merges) {
      // classHistory rename
      const hIds = nameToHistory.get(oldName) || [];
      for (let i = 0; i < hIds.length; i += 400) {
        const batch = db.batch();
        const slice = hIds.slice(i, i + 400);
        slice.forEach(id => batch.update(db.collection('classHistory').doc(id), {
          studentName: canonical,
          updatedAt: FieldValue.serverTimestamp(),
        }));
        await batch.commit();
        historyUpdates += slice.length;
      }
      // bookings rename
      const bIds = nameToBooking.get(oldName) || [];
      for (let i = 0; i < bIds.length; i += 400) {
        const batch = db.batch();
        const slice = bIds.slice(i, i + 400);
        slice.forEach(id => batch.update(db.collection('bookings').doc(id), {
          studentName: canonical,
          updatedAt: FieldValue.serverTimestamp(),
        }));
        await batch.commit();
        bookingUpdates += slice.length;
      }
    }
  }

  console.log(`\n✓ Done. Updated ${historyUpdates} classHistory + ${bookingUpdates} bookings.`);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
