// FriendlyTeaching.cl — Random Tongue Twisters
// Curated bank of English tongue twisters grouped by target sound and
// difficulty. Designed as a pronunciation warm-up tool: pick a sound to
// drill (/s-sh/, /th/, /r-l/, …), see a random twister, play it with TTS
// at slow/normal/fast speed, and track how many clean repetitions the
// student can nail in a row. Add twisters freely — the runner categorises
// visually by sound focus.

export type TwisterSound =
  | 's-sh'      // sibilants: /s/, /ʃ/, /z/
  | 'th'        // dental fricatives: /θ/, /ð/
  | 'r-l'       // liquids — classic ESL challenge pair
  | 'w-v'       // approximants, often confused by Spanish speakers
  | 'p-b'       // bilabial stops
  | 't-d'       // alveolar stops
  | 'k-g'       // velar stops
  | 'ch-j'      // affricates: /tʃ/, /dʒ/
  | 'mixed';    // multi-sound classics

export type TwisterDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Diabolic';

export const TWISTER_SOUNDS: TwisterSound[] = [
  's-sh', 'th', 'r-l', 'w-v', 'p-b', 't-d', 'k-g', 'ch-j', 'mixed',
];

export const TWISTER_DIFFICULTIES: TwisterDifficulty[] = [
  'Easy', 'Medium', 'Hard', 'Diabolic',
];

export interface TongueTwister {
  id:         string;
  sound:      TwisterSound;
  difficulty: TwisterDifficulty;
  text:       string;        // The twister itself
  hint?:      string;        // Short note on what to listen for
  ipa?:       string;        // Target phoneme shown prominently
}

export interface TwisterSoundMeta {
  label:    string;   // Human-readable label
  icon:     string;   // Emoji used in chips
  ipa:      string;   // Dominant phoneme(s) shown on the card
  gradient: string;   // Tailwind gradient classes for the card face
  chipBg:   string;   // Tailwind bg class for the small filter chip when active
  chipText: string;   // Tailwind text class for the small filter chip when active
  note:     string;   // One-line description of the sound challenge
}

export const TWISTER_SOUND_META: Record<TwisterSound, TwisterSoundMeta> = {
  's-sh':  { label: 'S / SH',   icon: '🐍', ipa: '/s/ /ʃ/',    gradient: 'from-cyan-500 to-blue-500',       chipBg: 'bg-cyan-500',    chipText: 'text-white', note: 'Sibilantes — mantén la lengua fija.' },
  'th':    { label: 'TH',       icon: '🦷', ipa: '/θ/ /ð/',    gradient: 'from-emerald-500 to-teal-600',    chipBg: 'bg-emerald-500', chipText: 'text-white', note: 'Lengua entre los dientes, no la S.' },
  'r-l':   { label: 'R / L',    icon: '🌊', ipa: '/r/ /l/',    gradient: 'from-rose-500 to-pink-600',       chipBg: 'bg-rose-500',    chipText: 'text-white', note: 'Clásico par difícil para hispanohablantes.' },
  'w-v':   { label: 'W / V',    icon: '🫧', ipa: '/w/ /v/',    gradient: 'from-sky-500 to-indigo-500',      chipBg: 'bg-sky-500',     chipText: 'text-white', note: 'Labios redondos vs. dientes y labio inferior.' },
  'p-b':   { label: 'P / B',    icon: '🫧', ipa: '/p/ /b/',    gradient: 'from-amber-500 to-orange-600',    chipBg: 'bg-amber-500',   chipText: 'text-white', note: 'Oclusivas bilabiales — aspira la P.' },
  't-d':   { label: 'T / D',    icon: '👅', ipa: '/t/ /d/',    gradient: 'from-fuchsia-500 to-purple-600',  chipBg: 'bg-fuchsia-500', chipText: 'text-white', note: 'Alveolares — toca el paladar justo detrás de los dientes.' },
  'k-g':   { label: 'K / G',    icon: '🔥', ipa: '/k/ /g/',    gradient: 'from-red-500 to-orange-500',      chipBg: 'bg-red-500',     chipText: 'text-white', note: 'Velares — la parte trasera de la lengua.' },
  'ch-j':  { label: 'CH / J',   icon: '🧃', ipa: '/tʃ/ /dʒ/',  gradient: 'from-violet-500 to-indigo-600',   chipBg: 'bg-violet-500',  chipText: 'text-white', note: 'Africadas — contacto breve y suelta de aire.' },
  'mixed': { label: 'Mixed',    icon: '🎭', ipa: 'mixed',      gradient: 'from-slate-600 to-slate-800',     chipBg: 'bg-slate-700',   chipText: 'text-white', note: 'Clásicos y rompe-lenguas de sonido variado.' },
};

export const TONGUE_TWISTERS: TongueTwister[] = [

  // ── S / SH ────────────────────────────────────────────────────────────
  {
    id: 's-seashells',
    sound: 's-sh',
    difficulty: 'Medium',
    text: 'She sells seashells by the seashore.',
    hint: 'Alternate crisp /s/ and softer /ʃ/.',
  },
  {
    id: 's-seashells-full',
    sound: 's-sh',
    difficulty: 'Hard',
    text: 'She sells seashells by the seashore, and the shells she sells are surely seashells.',
    hint: 'The classic extended version — pace yourself.',
  },
  {
    id: 's-sixth-sheep',
    sound: 's-sh',
    difficulty: 'Diabolic',
    text: 'The sixth sick sheik\'s sixth sheep\'s sick.',
    hint: 'Reportedly the hardest tongue twister in English.',
  },
  {
    id: 's-susie',
    sound: 's-sh',
    difficulty: 'Medium',
    text: 'Susie sits in a shoeshine shop, where she shines she sits, and where she sits she shines.',
  },
  {
    id: 's-sally-sold',
    sound: 's-sh',
    difficulty: 'Easy',
    text: 'Sally sold seven silver spoons.',
  },

  // ── TH ────────────────────────────────────────────────────────────────
  {
    id: 'th-thistle',
    sound: 'th',
    difficulty: 'Hard',
    text: 'I thought a thought, but the thought I thought wasn\'t the thought I thought I thought.',
    hint: 'Lengua entre los dientes — no digas /t/.',
  },
  {
    id: 'th-thirty-three',
    sound: 'th',
    difficulty: 'Medium',
    text: 'Thirty-three thirsty, thundering thoroughbreds thumped Mr. Thurston on Thursday.',
  },
  {
    id: 'th-this-thing',
    sound: 'th',
    difficulty: 'Easy',
    text: 'This thing, that thing, these things, those things.',
    hint: 'Voiced /ð/ — vibra la garganta.',
  },
  {
    id: 'th-truth',
    sound: 'th',
    difficulty: 'Medium',
    text: 'Truly rural, truly rural truth.',
  },

  // ── R / L ─────────────────────────────────────────────────────────────
  {
    id: 'rl-red-lorry',
    sound: 'r-l',
    difficulty: 'Hard',
    text: 'Red lorry, yellow lorry, red lorry, yellow lorry.',
    hint: 'Clásico — alterná /r/ y /l/ sin trabarte.',
  },
  {
    id: 'rl-really-leery',
    sound: 'r-l',
    difficulty: 'Medium',
    text: 'Larry really likes little lemons; little lemons Larry really likes.',
  },
  {
    id: 'rl-rolling-river',
    sound: 'r-l',
    difficulty: 'Medium',
    text: 'Rolling red wagons wobble round rocky roads.',
  },
  {
    id: 'rl-world-really',
    sound: 'r-l',
    difficulty: 'Hard',
    text: 'Really leery, rarely Larry, really leery, rarely Larry.',
  },
  {
    id: 'rl-irish-wristwatch',
    sound: 'r-l',
    difficulty: 'Diabolic',
    text: 'Irish wristwatch, Swiss wristwatch, Irish wristwatch, Swiss wristwatch.',
    hint: 'Combina /r/, /l/, /s/ y /ʃ/ — brutal.',
  },

  // ── W / V ─────────────────────────────────────────────────────────────
  {
    id: 'wv-two-witches',
    sound: 'w-v',
    difficulty: 'Medium',
    text: 'Two witches watch two watches. Which witch watches which watch?',
    hint: '/w/ con labios redondos — no digas /v/ ni /gw/.',
  },
  {
    id: 'wv-vincent-wove',
    sound: 'w-v',
    difficulty: 'Hard',
    text: 'Vincent vowed vengeance very vehemently, while William wove warm woolen vests.',
  },
  {
    id: 'wv-weather',
    sound: 'w-v',
    difficulty: 'Easy',
    text: 'Whether the weather is warm, whether the weather is hot, we have to put up with the weather, whether we like it or not.',
  },
  {
    id: 'wv-wayne-went',
    sound: 'w-v',
    difficulty: 'Easy',
    text: 'Wayne went to Wales to watch walruses.',
  },

  // ── P / B ─────────────────────────────────────────────────────────────
  {
    id: 'pb-peter-piper',
    sound: 'p-b',
    difficulty: 'Hard',
    text: 'Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked.',
    hint: 'Aspirá la /p/ al inicio de cada palabra.',
  },
  {
    id: 'pb-betty-bought',
    sound: 'p-b',
    difficulty: 'Hard',
    text: 'Betty Botter bought some butter, but she said the butter\'s bitter; if I put it in my batter it will make my batter bitter.',
  },
  {
    id: 'pb-blue-bug',
    sound: 'p-b',
    difficulty: 'Easy',
    text: 'A big black bug bit a big black bear.',
  },
  {
    id: 'pb-pink-pig',
    sound: 'p-b',
    difficulty: 'Easy',
    text: 'A proper copper coffee pot.',
    hint: 'Alterna /p/ aspirada con /k/ y /f/.',
  },

  // ── T / D ─────────────────────────────────────────────────────────────
  {
    id: 'td-tim-tom',
    sound: 't-d',
    difficulty: 'Medium',
    text: 'Tim, the thin twin tinsmith, told Tom the tubby twin tinsmith a terrible tale.',
  },
  {
    id: 'td-double-bubble',
    sound: 't-d',
    difficulty: 'Easy',
    text: 'Double bubble gum bubbles double.',
  },
  {
    id: 'td-toy-boat',
    sound: 't-d',
    difficulty: 'Hard',
    text: 'Toy boat. Toy boat. Toy boat.',
    hint: 'Fácil de leer, imposible de decir rápido tres veces.',
  },

  // ── K / G ─────────────────────────────────────────────────────────────
  {
    id: 'kg-cooks-cook',
    sound: 'k-g',
    difficulty: 'Medium',
    text: 'How many cookies could a good cook cook if a good cook could cook cookies?',
  },
  {
    id: 'kg-greek-grapes',
    sound: 'k-g',
    difficulty: 'Easy',
    text: 'Give me the gift of a grip-top sock.',
  },
  {
    id: 'kg-knapsack-strap',
    sound: 'k-g',
    difficulty: 'Hard',
    text: 'The knapsack strap snapped and the knapsack sank.',
  },
  {
    id: 'kg-unique-new-york',
    sound: 'k-g',
    difficulty: 'Hard',
    text: 'Unique New York. Unique New York. Unique New York.',
    hint: 'Dilo tres veces rápido — el /nj/ y la /k/ se traban.',
  },

  // ── CH / J ────────────────────────────────────────────────────────────
  {
    id: 'chj-chester-cheetah',
    sound: 'ch-j',
    difficulty: 'Medium',
    text: 'Chester Cheetah chews a chunk of cheap cheddar cheese.',
  },
  {
    id: 'chj-jolly-judges',
    sound: 'ch-j',
    difficulty: 'Medium',
    text: 'Jolly judges judging gentle giants justly.',
  },
  {
    id: 'chj-cheap-ship',
    sound: 'ch-j',
    difficulty: 'Hard',
    text: 'If a cheap ship trip is a cheap trip, then a cheap trip on a cheap ship is a cheap ship trip.',
  },

  // ── Mixed classics ────────────────────────────────────────────────────
  {
    id: 'mix-woodchuck',
    sound: 'mixed',
    difficulty: 'Hard',
    text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
    hint: 'El clásico de /w/, /tʃ/ y /k/ combinados.',
  },
  {
    id: 'mix-fuzzy-wuzzy',
    sound: 'mixed',
    difficulty: 'Medium',
    text: 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn\'t very fuzzy, was he?',
  },
  {
    id: 'mix-fresh-fried-fish',
    sound: 'mixed',
    difficulty: 'Diabolic',
    text: 'Fresh fried fish, fish fresh fried, fried fish fresh, fish fried fresh.',
  },
  {
    id: 'mix-six-slick',
    sound: 'mixed',
    difficulty: 'Hard',
    text: 'Six slippery snails slid slowly seaward.',
  },
  {
    id: 'mix-black-background',
    sound: 'mixed',
    difficulty: 'Hard',
    text: 'Black background, brown background, black background, brown background.',
  },
  {
    id: 'mix-pad-kid',
    sound: 'mixed',
    difficulty: 'Diabolic',
    text: 'Pad kid poured curd pulled cold.',
    hint: 'MIT lo calificó como "el trabalenguas más difícil del inglés" en 2013.',
  },
  {
    id: 'mix-mr-see-mr-soar',
    sound: 'mixed',
    difficulty: 'Hard',
    text: 'Mr. See owned a saw. Mr. Soar owned a seesaw. Now See\'s saw sawed Soar\'s seesaw before Soar saw See.',
  },
  {
    id: 'mix-flea-fly',
    sound: 'mixed',
    difficulty: 'Easy',
    text: 'A flea and a fly flew up in a flue.',
  },
];

export function tongueTwisterCounts(): Record<TwisterSound, number> {
  const c = {
    's-sh': 0, 'th': 0, 'r-l': 0, 'w-v': 0, 'p-b': 0,
    't-d': 0, 'k-g': 0, 'ch-j': 0, 'mixed': 0,
  } as Record<TwisterSound, number>;
  for (const t of TONGUE_TWISTERS) c[t.sound]++;
  return c;
}
