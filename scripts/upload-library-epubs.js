// FriendlyTeaching.cl — one-shot batch EPUB mirror for the Library
//
// Walks src/lib/data/library/novels.ts, derives each title's direct
// Standard Ebooks .epub URL, downloads the file, uploads it to
// Firebase Storage at `library/{bookId}.epub`, and writes a
// `libraryEpubs/{bookId}` Firestore doc pointing at the hosted URL.
//
// The browser then resolves the mirror via useLibraryEpubs() and
// hands it to epub.js instead of the SE URL — cross-origin reliable,
// cached indefinitely, zero cold-start download for the student.
//
// Usage:
//   node scripts/upload-library-epubs.js                 # skips books already mirrored
//   node scripts/upload-library-epubs.js --force         # redownload every book
//   node scripts/upload-library-epubs.js --book <id>     # only that book
//
// Idempotent: every write is keyed by bookId, and existing docs are
// left alone unless --force.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const bookFlagIdx = args.indexOf('--book');
const ONLY_BOOK = bookFlagIdx >= 0 ? args[bookFlagIdx + 1] : null;

function loadServiceAccount() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()), storageBucket: BUCKET });
}
const db = getFirestore();
const bucket = getStorage().bucket();

// ── Parse the catalogue without compiling TS ──────────────────
//
// Plain regex over the novels.ts source. Keeps the dependency tree
// tiny — no ts-node, no esbuild. Each entry:
//   { id: '…', level: '…', levelLabel: '…', title: '…', author: '…', pageUrl: '…' }

function parseCatalogue() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'data', 'library', 'novels.ts'),
    'utf8',
  );
  // Each object literal in the LIBRARY_BOOKS array lives on a single line.
  const regex = /\{\s*id:\s*'([^']+)',\s*level:\s*'([^']+)',\s*levelLabel:\s*'([^']+)',\s*title:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"),\s*author:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"),\s*pageUrl:\s*'([^']+)'/g;
  const out = [];
  let m;
  while ((m = regex.exec(src)) !== null) {
    const unquote = (s) => (s ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    out.push({
      id:       m[1],
      level:    m[2],
      title:    unquote(m[4] || m[5]),
      author:   unquote(m[6] || m[7]),
      pageUrl:  m[8],
    });
  }
  return out;
}

function pageToStandardEbooksEpub(pageUrl) {
  try {
    const u = new URL(pageUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const slugs = parts.slice(1);
    const fileSlug = slugs.join('_');
    return `${u.origin}/${parts.join('/')}/downloads/${fileSlug}.epub?source=download`;
  } catch { return null; }
}

async function downloadEpub(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':      'FriendlyTeaching-Mirror/1.0 (contact: ifraufigueroa@gmail.com)',
      'Accept':          'application/epub+zip, application/octet-stream;q=0.9, */*;q=0.1',
      'Accept-Language': 'en',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    const preview = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${preview.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadEpub(buf, bookId) {
  const storagePath = `library/${bookId}.epub`;
  const file = bucket.file(storagePath);
  await file.save(buf, {
    contentType: 'application/epub+zip',
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

(async () => {
  let books = parseCatalogue();
  if (ONLY_BOOK) books = books.filter(b => b.id === ONLY_BOOK);
  if (books.length === 0) {
    console.log(ONLY_BOOK ? `No book found with id "${ONLY_BOOK}".` : 'No books parsed from novels.ts.');
    process.exit(0);
  }

  console.log(`Catalogue size: ${books.length} book${books.length === 1 ? '' : 's'}.\n`);

  let skipped = 0, uploaded = 0, failed = 0;

  for (const b of books) {
    const ref = db.collection('libraryEpubs').doc(b.id);
    const existing = await ref.get();
    if (existing.exists && !FORCE) {
      skipped += 1;
      console.log(`· skip   ${b.id} — already mirrored`);
      continue;
    }
    const seUrl = pageToStandardEbooksEpub(b.pageUrl);
    if (!seUrl) {
      failed += 1;
      console.error(`  FAIL   ${b.id} — can't derive SE URL from ${b.pageUrl}`);
      continue;
    }
    try {
      console.log(`→ get    ${b.id}  (${b.title} · ${b.author})`);
      const buf = await downloadEpub(seUrl);
      const epubUrl = await uploadEpub(buf, b.id);
      await ref.set({
        bookId:     b.id,
        epubUrl,
        sourceUrl:  seUrl,
        pageUrl:    b.pageUrl,
        title:      b.title,
        author:     b.author,
        level:      b.level,
        size:       buf.length,
        uploadedAt: Timestamp.now(),
      });
      uploaded += 1;
      console.log(`  ok     ${epubUrl}  (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL   ${b.id}:`, err.message);
    }
  }

  console.log(`\nDone. uploaded=${uploaded}  skipped=${skipped}  failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
