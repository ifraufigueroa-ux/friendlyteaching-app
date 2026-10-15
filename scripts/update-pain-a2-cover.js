// La portada actual del A2 Pain usa `type: "cover"` → cae en CoverSlide
// (genérico). Debe usar `type: "clip_cover"` → ClipCoverSlide (cinematic
// Netflix-style con thumbnail de YouTube de fondo, logo Friendlyflix,
// pill de nivel coloreado, "Watch & Learn" footer).
//
// Replica la estructura de la portada de AI2027 (movieLessons/o1MIyhVForfaxeUcPlL0):
//   {
//     phase: "pre",
//     type: "clip_cover",
//     title: "<clip title>",
//     subtitle: "<source / show name>",
//     content: "<level>",
//     id: "clip-cover",
//     clipData: { title, source, youtubeUrl, dialogue, timings, ... }
//   }
//
// Hace backup antes de escribir.
//
// Usage: node scripts/update-pain-a2-cover.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'AzWWulamRJ1HMdvjjUN9';

(async () => {
  initAdmin();
  const db = getFirestore();

  await backupLessonDoc(db, LESSON_ID, 'pre-rebuild-cover-clip');

  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const data = snap.data();

  const clip = data.clip || {};
  const newCover = {
    phase:    'pre',
    type:     'clip_cover',
    id:       'clip-cover',
    title:    clip.title || "Pain's Cycle of Hatred",
    subtitle: clip.source || 'Naruto',
    content:  'A2',
    clipData: {
      title:          clip.title,
      source:         clip.source,
      youtubeUrl:     clip.youtubeUrl,
      dialogue:       clip.dialogue,
      timings:        clip.timings,
      captionsSource: clip.captionsSource,
    },
  };

  const newSlides = data.slides.map(s =>
    (s.type === 'cover' || s.type === 'clip_cover') ? newCover : s
  );

  await ref.update({
    slides: newSlides,
    updatedAt: new Date(),
  });

  console.log('\n✓ Rebuilt cover for', LESSON_ID);
  console.log('  type     :', newCover.type);
  console.log('  title    :', newCover.title);
  console.log('  subtitle :', newCover.subtitle);
  console.log('  level    :', newCover.content);
  console.log('  youtube  :', newCover.clipData.youtubeUrl);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
