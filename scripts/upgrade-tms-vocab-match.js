// FriendlyTeaching.cl — Upgrade TMS clip_vocab_match slide to the
// English-For-Devs style: definitions in English + IPA pronunciation,
// examples preserved, subtitle added. Same gamification (component
// unchanged — just richer data).
//
// Usage: node scripts/upgrade-tms-vocab-match.js [--dry-run]

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN   = process.argv.includes('--dry-run');
const LESSON_ID = 'ehLwwdBg6XwBItvSaHqM'; // Logistics — TMS

// 10 terms, all fields required — matches ClipVocabMatchSlide contract.
// translation = English definition (this is what the right column shows).
const WORDS = [
  {
    word: 'freight',
    pronunciation: 'freɪt',
    translation: 'goods transported in bulk by truck, ship, train, or plane',
    example: 'The freight was delivered ahead of schedule.',
  },
  {
    word: 'shipment',
    pronunciation: 'ˈʃɪp.mənt',
    translation: 'a load of goods sent together as one delivery',
    example: 'Each shipment is tracked in real time.',
  },
  {
    word: 'carrier',
    pronunciation: 'ˈkær.i.ər',
    translation: 'a company that transports goods for others',
    example: 'The carrier reported a delay at the border.',
  },
  {
    word: 'fleet',
    pronunciation: 'fliːt',
    translation: 'a group of vehicles owned or operated by one company',
    example: 'We manage a fleet of over 200 trucks.',
  },
  {
    word: 'dispatch',
    pronunciation: 'dɪˈspætʃ',
    translation: 'to send goods or vehicles out on their way',
    example: 'Orders are dispatched within 24 hours.',
  },
  {
    word: 'route optimization',
    pronunciation: 'ruːt ˌɒp.tɪ.maɪˈzeɪ.ʃən',
    translation: 'the process of finding the most efficient path for deliveries',
    example: 'TMS software enables route optimization.',
  },
  {
    word: 'supply chain',
    pronunciation: 'səˈplaɪ tʃeɪn',
    translation: 'the full network from raw materials to the final customer',
    example: 'A resilient supply chain is a competitive advantage.',
  },
  {
    word: 'lead time',
    pronunciation: 'liːd taɪm',
    translation: 'the total time from placing an order to receiving the goods',
    example: 'Automation reduces lead time significantly.',
  },
  {
    word: 'bottleneck',
    pronunciation: 'ˈbɒt.əl.nek',
    translation: 'a stage that slows down the whole process',
    example: 'Customs clearance is often a bottleneck.',
  },
  {
    word: 'warehouse',
    pronunciation: 'ˈweə.haʊs',
    translation: 'a large building where goods are stored before distribution',
    example: 'Goods are stored in a central warehouse.',
  },
];

(async () => {
  initAdmin();
  const db = getFirestore();

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error(`✗ ${LESSON_ID} not found`); process.exit(1); }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];

  const idx = slides.findIndex(s => s.type === 'clip_vocab_match');
  if (idx < 0) { console.error('No clip_vocab_match slide found'); process.exit(1); }

  const nextSlide = {
    ...slides[idx],
    subtitle: 'Tap each card to reveal the meaning. You will hear these in the video.',
    words: WORDS,
  };

  console.log(`\n${LESSON_ID} — ${data.title}`);
  console.log(`slide[${idx}] (clip_vocab_match): upgrading ${slides[idx].words.length} words → ${WORDS.length}`);
  console.log('First 3 samples:');
  WORDS.slice(0, 3).forEach((w, j) => {
    console.log(`  [${j}] ${w.word} /${w.pronunciation}/`);
    console.log(`      def: ${w.translation}`);
    console.log(`      ex:  ${w.example}`);
  });

  if (DRY_RUN) { console.log('\n--dry-run — no writes.'); process.exit(0); }

  await backupLessonDoc(db, LESSON_ID, 'upgrade-vocab-match-to-en-ipa');
  const nextSlides = slides.map((s, i) => i === idx ? nextSlide : s);
  await ref.update({ slides: nextSlides });
  console.log('\n✓ Vocab match upgraded (EN + IPA + subtitle).');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
