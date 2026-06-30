// FriendlyTeaching.cl — List Friendlyflix (movieLessons) lessons
// Usage: node scripts/list-movie-lessons.js [--search "english for devs"]
//
// Prints id + title + clip source + slide count for every lesson in the
// movieLessons collection. With --search, filters by case-insensitive
// substring match on title.
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY_PATH = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

const argv = process.argv.slice(2);
const searchIdx = argv.indexOf('--search');
const search = searchIdx >= 0 ? (argv[searchIdx + 1] || '').toLowerCase() : null;

(async () => {
  const snap = await db.collection('movieLessons').get();
  const rows = [];
  snap.forEach(doc => {
    const d = doc.data();
    rows.push({
      id:         doc.id,
      title:      d.title || '(untitled)',
      level:      d.level || '?',
      source:     d.clip?.source || '?',
      clipTitle:  d.clip?.title  || '?',
      youtubeUrl: d.clip?.youtubeUrl || '',
      slideCount: Array.isArray(d.slides) ? d.slides.length : 0,
      slideTypes: Array.isArray(d.slides) ? d.slides.map(s => s.type).join(',') : '',
    });
  });

  const filtered = search
    ? rows.filter(r => r.title.toLowerCase().includes(search) || r.clipTitle.toLowerCase().includes(search) || r.source.toLowerCase().includes(search))
    : rows;

  if (filtered.length === 0) {
    console.log(search ? `No lessons match "${search}"` : 'No movieLessons found');
    process.exit(0);
  }

  filtered.forEach(r => {
    console.log('─'.repeat(70));
    console.log(`id:        ${r.id}`);
    console.log(`title:     ${r.title}  [${r.level}]`);
    console.log(`clip:      ${r.source} — ${r.clipTitle}`);
    console.log(`youtube:   ${r.youtubeUrl}`);
    console.log(`slides:    ${r.slideCount}  (${r.slideTypes})`);
  });
  console.log('─'.repeat(70));
  console.log(`${filtered.length} lesson(s) shown${search ? ` (search: "${search}")` : ''}`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
