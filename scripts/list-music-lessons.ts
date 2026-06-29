// Lists music lessons from Firestore.
// Usage: npx tsx scripts/list-music-lessons.ts [--full]
//
// Auth: either
//   1) GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service-account JSON, or
//   2) ./firebase-service-account.json at repo root (gitignored).
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SA_PATH = resolve(process.cwd(), 'firebase-service-account.json');

if (existsSync(SA_PATH)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(SA_PATH, 'utf8'))) });
} else {
  initializeApp({ credential: applicationDefault() });
}

const db   = getFirestore();
const full = process.argv.includes('--full');

interface SongDoc {
  title?: string;
  artist?: string;
  level?: string;
  songData?: { title?: string; artist?: string; youtubeUrl?: string };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId?: string;
  teacherId?: string;
}

async function main() {
  const snap = await db.collection('musicLessons')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  console.log(`Found ${snap.size} music lesson(s) (most recent first):\n`);
  snap.forEach(doc => {
    const d = doc.data() as SongDoc;
    const title  = d.title  ?? d.songData?.title  ?? '(no title)';
    const artist = d.artist ?? d.songData?.artist ?? '(no artist)';
    const ts = d.createdAt?.toDate?.()?.toISOString?.()?.slice(0, 16).replace('T', ' ') ?? '';
    console.log(`${doc.id}`);
    console.log(`  ${title} — ${artist}`);
    console.log(`  level: ${d.level ?? '?'}  created: ${ts}`);
    if (d.songData?.youtubeUrl) console.log(`  yt: ${d.songData.youtubeUrl}`);
    if (full) console.log('  raw:', JSON.stringify(d, null, 2).slice(0, 500));
    console.log();
  });
}

main().catch(err => { console.error(err); process.exit(1); });
