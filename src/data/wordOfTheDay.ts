// FriendlyTeaching.cl — Word of the Day data
//
// Rotating daily vocabulary. `getWordOfTheDay(level)` returns a word
// deterministically for today, filtered to the student's zone of
// proximal development (ZPD): their own level + one notch above. An
// A0 student sees A0/A1 words, a B1 student sees B1/B2 words, and a
// C1 student sees C1/C2 words. When no level is passed (login page,
// pre-hydration, teacher accounts) the function falls back to the
// full pool so the rotation still works.

export interface WordEntry {
  word: string;
  ipa: string;           // IPA pronunciation
  type: string;          // noun, verb, adjective, etc.
  level: string;         // CEFR level — A0, A1, A2, B1, B1+, B2, B2+, C1, C2
  meaning: string;       // Spanish translation
  example: string;       // Example sentence
  tip?: string;          // Optional learning tip
}

const WORDS: WordEntry[] = [
  { word: 'Serendipity', ipa: '/ˌser.ənˈdɪp.ɪ.ti/', type: 'noun', level: 'C1', meaning: 'Un hallazgo afortunado e inesperado', example: 'Finding that café was pure serendipity.', tip: 'Viene de un cuento persa sobre tres príncipes de Serendip.' },
  { word: 'Overcome', ipa: '/ˌoʊ.vɚˈkʌm/', type: 'verb', level: 'B1', meaning: 'Superar, vencer', example: 'She overcame her fear of public speaking.', tip: 'Past: overcame. Past participle: overcome.' },
  { word: 'Cozy', ipa: '/ˈkoʊ.zi/', type: 'adjective', level: 'A2', meaning: 'Acogedor, cálido y cómodo', example: 'This room feels so cozy with the fireplace on.', tip: 'En inglés británico se escribe "cosy".' },
  { word: 'Barely', ipa: '/ˈber.li/', type: 'adverb', level: 'B1', meaning: 'Apenas, casi no', example: 'I could barely hear the music from outside.', tip: 'No confundir con "barley" (cebada).' },
  { word: 'Thrive', ipa: '/θraɪv/', type: 'verb', level: 'B2', meaning: 'Prosperar, florecer', example: 'Plants thrive in sunny environments.', tip: 'Sinónimos: flourish, prosper.' },
  { word: 'Wholesome', ipa: '/ˈhoʊl.səm/', type: 'adjective', level: 'B2', meaning: 'Sano, saludable, positivo', example: "That's such a wholesome story about the community.", tip: 'Muy usado en redes sociales para describir contenido positivo.' },
  { word: 'Awkward', ipa: '/ˈɑː.kwɚd/', type: 'adjective', level: 'B1', meaning: 'Incómodo, torpe', example: 'There was an awkward silence after his joke.', tip: 'La "w" es muda: /ˈɑːk.wərd/.' },
  { word: 'Reliable', ipa: '/rɪˈlaɪ.ə.bəl/', type: 'adjective', level: 'B1', meaning: 'Confiable, fiable', example: 'She is the most reliable person on the team.', tip: 'Del verbo "to rely on" (depender de).' },
  { word: 'Throughout', ipa: '/θruːˈaʊt/', type: 'preposition', level: 'B2', meaning: 'A lo largo de, durante todo', example: 'It rained throughout the entire weekend.', tip: 'Through + out = por completo, de principio a fin.' },
  { word: 'Wander', ipa: '/ˈwɑːn.dɚ/', type: 'verb', level: 'B1', meaning: 'Deambular, pasear sin rumbo', example: 'We wandered through the streets of the old town.', tip: 'No confundir con "wonder" (preguntarse/maravilla).' },
  { word: 'Subtle', ipa: '/ˈsʌt.əl/', type: 'adjective', level: 'B2', meaning: 'Sutil, delicado', example: 'There was a subtle difference between the two paintings.', tip: 'La "b" es muda: /ˈsʌt.əl/.' },
  { word: 'Gather', ipa: '/ˈɡæð.ɚ/', type: 'verb', level: 'A2', meaning: 'Reunir, recoger, juntar', example: 'We gathered around the table for dinner.', tip: 'También significa "deducir": I gather you agree.' },
  { word: 'Breathtaking', ipa: '/ˈbreθˌteɪ.kɪŋ/', type: 'adjective', level: 'B2', meaning: 'Impresionante, que quita el aliento', example: 'The view from the mountain was breathtaking.', tip: 'Literalmente: "que te quita la respiración".' },
  { word: 'Meanwhile', ipa: '/ˈmiːn.waɪl/', type: 'adverb', level: 'B1', meaning: 'Mientras tanto, entretanto', example: 'The kids played; meanwhile, I cooked dinner.', tip: 'Perfecto como conector temporal en escritura.' },
  { word: 'Struggle', ipa: '/ˈstrʌɡ.əl/', type: 'verb', level: 'B1', meaning: 'Luchar, esforzarse', example: 'Many students struggle with English pronunciation.', tip: 'También es sustantivo: "a daily struggle".' },
  { word: 'Cheer up', ipa: '/tʃɪr ʌp/', type: 'phrasal verb', level: 'A2', meaning: 'Animarse, alegrarse', example: 'Cheer up! Everything will be okay.', tip: 'Phrasal verb separable: "cheer someone up".' },
  { word: 'Accomplish', ipa: '/əˈkɑːm.plɪʃ/', type: 'verb', level: 'B2', meaning: 'Lograr, conseguir, cumplir', example: 'She accomplished all her goals this year.', tip: 'Sustantivo: accomplishment (logro).' },
  { word: 'Indeed', ipa: '/ɪnˈdiːd/', type: 'adverb', level: 'B1', meaning: 'De hecho, en efecto, ciertamente', example: 'This is indeed the best solution.', tip: 'Muy formal. Úsalo para enfatizar una afirmación.' },
  { word: 'Daunting', ipa: '/ˈdɑːn.tɪŋ/', type: 'adjective', level: 'B2', meaning: 'Intimidante, abrumador', example: 'Learning a new language can feel daunting at first.', tip: 'Sinónimos: intimidating, overwhelming.' },
  { word: 'Hang out', ipa: '/hæŋ aʊt/', type: 'phrasal verb', level: 'A2', meaning: 'Pasar el rato, juntarse', example: "Let's hang out at the park after class.", tip: 'Informal. Past: hung out.' },
  { word: 'Resilient', ipa: '/rɪˈzɪl.i.ənt/', type: 'adjective', level: 'C1', meaning: 'Resiliente, capaz de recuperarse', example: 'Children are often more resilient than adults.', tip: 'Sustantivo: resilience.' },
  { word: 'Broad', ipa: '/brɑːd/', type: 'adjective', level: 'B1', meaning: 'Amplio, ancho, extenso', example: 'She has a broad range of interests.', tip: 'Opuesto: narrow (estrecho).' },
  { word: 'Eager', ipa: '/ˈiː.ɡɚ/', type: 'adjective', level: 'B1', meaning: 'Ansioso, entusiasmado por hacer algo', example: 'The students were eager to start the project.', tip: '"Eager to" + verbo. No confundir con "anxious".' },
  { word: 'Nevertheless', ipa: '/ˌnev.ɚ.ðəˈles/', type: 'adverb', level: 'B2', meaning: 'Sin embargo, no obstante', example: 'It was raining; nevertheless, they went hiking.', tip: 'Más formal que "however". Excelente para essays.' },
  { word: 'Glimpse', ipa: '/ɡlɪmps/', type: 'noun', level: 'B2', meaning: 'Vistazo rápido, atisbo', example: 'I caught a glimpse of the sunset before it disappeared.', tip: '"Catch/get a glimpse of" es la colocación más común.' },
  { word: 'Lively', ipa: '/ˈlaɪv.li/', type: 'adjective', level: 'B1', meaning: 'Animado, lleno de vida', example: 'The market was lively with music and colors.', tip: 'Cuidado: "lively" es adjetivo, no adverbio.' },
  { word: 'Worn out', ipa: '/wɔːrn aʊt/', type: 'adjective', level: 'B1', meaning: 'Agotado, desgastado', example: "I'm completely worn out after today's workout.", tip: 'Para personas = exhausted. Para objetos = desgastado.' },
  { word: 'Fulfilling', ipa: '/fʊlˈfɪl.ɪŋ/', type: 'adjective', level: 'B2', meaning: 'Gratificante, satisfactorio', example: 'Teaching can be an incredibly fulfilling career.', tip: 'Del verbo "fulfill" (cumplir, satisfacer).' },
  { word: 'Look forward to', ipa: '/lʊk ˈfɔːr.wɚd tuː/', type: 'phrasal verb', level: 'A2', meaning: 'Esperar con ilusión', example: "I'm looking forward to the holidays!", tip: '¡Siempre seguido de sustantivo o gerundio (-ing)!' },
  { word: 'Stunning', ipa: '/ˈstʌn.ɪŋ/', type: 'adjective', level: 'B1', meaning: 'Impresionante, deslumbrante', example: 'She looked stunning in her new dress.', tip: 'Más coloquial que "breathtaking". Muy versátil.' },
  { word: 'Carry on', ipa: '/ˈkær.i ɑːn/', type: 'phrasal verb', level: 'A2', meaning: 'Continuar, seguir adelante', example: "Carry on with your work, I'll wait.", tip: 'En aviones: "carry-on" = equipaje de mano.' },

  // ── A0 (survival vocabulary that still teaches something new) ──
  { word: 'Hungry',   ipa: '/ˈhʌŋ.ɡri/',   type: 'adjective', level: 'A0', meaning: 'Que tiene hambre',             example: "I'm hungry. Let's eat.",                    tip: 'Siempre con "be": I AM hungry. Nunca "I have hungry".' },
  { word: 'Tired',    ipa: '/taɪrd/',       type: 'adjective', level: 'A0', meaning: 'Cansado, cansada',             example: 'She was tired after the long trip.',        tip: '"Tired of" = harto de algo. "Tired from" = cansado por.' },
  { word: 'Later',    ipa: '/ˈleɪ.tɚ/',     type: 'adverb',    level: 'A0', meaning: 'Más tarde',                    example: "I'll call you later.",                      tip: '"See you later" = Nos vemos luego. Super útil al despedirse.' },
  { word: 'Also',     ipa: '/ˈɑːl.soʊ/',    type: 'adverb',    level: 'A0', meaning: 'También',                      example: 'I like pizza. I also like pasta.',          tip: 'Va antes del verbo, o después del verbo "be".' },
  { word: 'Together', ipa: '/təˈɡeð.ɚ/',    type: 'adverb',    level: 'A0', meaning: 'Juntos, juntas',               example: "Let's study together tonight.",             tip: 'Pronuncia la "th" sonora (como zumbido), no como /t/.' },
  { word: 'Already',  ipa: '/ɔːlˈred.i/',   type: 'adverb',    level: 'A0', meaning: 'Ya',                           example: "I've already had lunch.",                   tip: 'Para preguntas y negativas suele usarse "yet", no "already".' },

  // ── A1 (extension vocab — feelings, time, simple actions) ──
  { word: 'Borrow',    ipa: '/ˈbɔːr.oʊ/',      type: 'verb',         level: 'A1', meaning: 'Pedir prestado',          example: 'Can I borrow your pen?',                      tip: 'Borrow = recibir prestado. Lend = prestar. ¡No los confundas!' },
  { word: 'Choose',    ipa: '/tʃuːz/',          type: 'verb',         level: 'A1', meaning: 'Elegir, escoger',         example: 'You can choose any color.',                   tip: 'Pasado: chose. Participio: chosen. "Choice" es el sustantivo.' },
  { word: 'Lonely',    ipa: '/ˈloʊn.li/',       type: 'adjective',    level: 'A1', meaning: 'Solitario, que se siente solo', example: 'He feels lonely sometimes.',           tip: 'No es "alone": "lonely" implica tristeza; "alone" solo soledad física.' },
  { word: 'Suddenly',  ipa: '/ˈsʌd.ən.li/',     type: 'adverb',       level: 'A1', meaning: 'De repente, de golpe',    example: 'Suddenly, it started to rain.',               tip: 'Perfecto para contar historias y dar color a narraciones.' },
  { word: 'Afford',    ipa: '/əˈfɔːrd/',         type: 'verb',         level: 'A1', meaning: 'Poder permitirse (económicamente)', example: "I can't afford a new car right now.",  tip: 'Siempre con "can/can\'t". No decir "I afford": siempre "I can afford".' },
  { word: 'Save up',   ipa: '/seɪv ʌp/',         type: 'phrasal verb', level: 'A1', meaning: 'Ahorrar (dinero para algo)', example: "She's saving up for a trip to Europe.",    tip: 'Separable: "save money up". Siempre con un objetivo (for + sustantivo).' },

  // ── B1+ (bridge between B1 and B2) ──
  { word: 'Figure out',  ipa: '/ˈfɪɡ.jɚ aʊt/', type: 'phrasal verb', level: 'B1+', meaning: 'Resolver, darse cuenta de, averiguar', example: "I can't figure out how to fix this.", tip: 'Separable: "figure it out". Muy común en conversación diaria.' },
  { word: 'Get along',   ipa: '/ɡɛt əˈlɔːŋ/',  type: 'phrasal verb', level: 'B1+', meaning: 'Llevarse bien con alguien',               example: 'I get along with my coworkers.',       tip: '"Get along with someone". "Get along without" = arreglárselas sin.' },
  { word: 'Rely on',     ipa: '/rɪˈlaɪ ɑːn/',  type: 'phrasal verb', level: 'B1+', meaning: 'Depender de, confiar en',                 example: 'You can rely on her to meet deadlines.', tip: 'Base del adjetivo "reliable". Más formal que "count on".' },
  { word: 'Mindful',     ipa: '/ˈmaɪnd.fəl/',  type: 'adjective',    level: 'B1+', meaning: 'Consciente, atento',                      example: 'Be mindful of the time.',             tip: '"Mindfulness" es el concepto de meditación/conciencia plena.' },

  // ── B2+ (near-advanced — precision + register) ──
  { word: 'Compelling',   ipa: '/kəmˈpel.ɪŋ/',    type: 'adjective', level: 'B2+', meaning: 'Convincente, cautivador, irresistible', example: 'She made a compelling argument for the change.', tip: 'Más fuerte que "convincing". Úsalo cuando algo literalmente te obliga a creerlo.' },
  { word: 'Nuance',       ipa: '/ˈnuː.ɑːns/',     type: 'noun',       level: 'B2+', meaning: 'Matiz, sutileza',                        example: "There's a subtle nuance between those two words.", tip: 'Palabra elegante y exacta para hablar de diferencias finas.' },
  { word: 'Overlook',     ipa: '/ˌoʊ.vɚˈlʊk/',   type: 'verb',       level: 'B2+', meaning: 'Pasar por alto; dar vistas a',           example: 'We overlooked an important detail in the contract.', tip: 'Dos sentidos: ignorar algo (negativo) o tener vistas a (hotel/casa).' },
  { word: 'Mitigate',     ipa: '/ˈmɪt.ɪ.ɡeɪt/',  type: 'verb',       level: 'B2+', meaning: 'Mitigar, reducir',                        example: 'We need to mitigate the risks before launching.', tip: 'Formal. Perfecto para contextos de trabajo y escritura académica.' },

  // ── C1 refuerzo ──
  { word: 'Resourceful',  ipa: '/rɪˈsɔːrs.fəl/', type: 'adjective', level: 'C1',  meaning: 'Ingenioso, que encuentra soluciones',   example: 'She\'s incredibly resourceful under pressure.', tip: 'Elogio alto en entrevistas de trabajo. Sustantivo: resourcefulness.' },
  { word: 'Overarching',  ipa: '/ˌoʊ.vɚˈɑːr.tʃɪŋ/', type: 'adjective', level: 'C1', meaning: 'Dominante, general, que lo abarca todo', example: 'The overarching goal of the project is sustainability.', tip: 'Útil para introducir la idea principal de un argumento.' },
  { word: 'Incentivize',  ipa: '/ɪnˈsen.tɪ.vaɪz/', type: 'verb',    level: 'C1',  meaning: 'Incentivar, motivar con un incentivo',    example: 'The policy aims to incentivize electric vehicle adoption.', tip: 'Vocabulario corporativo/economía. Sustantivo: incentive.' },

  // ── C2 (stretch zone para C1) ──
  { word: 'Ubiquitous',     ipa: '/juːˈbɪk.wɪ.təs/',     type: 'adjective', level: 'C2', meaning: 'Omnipresente, que está en todas partes', example: 'Smartphones have become ubiquitous in modern life.', tip: 'Sinónimo formal de "everywhere". Ideal para academic writing.' },
  { word: 'Quintessential', ipa: '/ˌkwɪn.tɪˈsen.ʃəl/',   type: 'adjective', level: 'C2', meaning: 'Quintaesencial, el ejemplo perfecto de algo', example: "He's the quintessential English gentleman.", tip: 'Marca el "arquetipo" más puro de algo. Muy sofisticado.' },
  { word: 'Serendipitous',  ipa: '/ˌser.ənˈdɪp.ɪ.təs/', type: 'adjective', level: 'C2', meaning: 'Fortuito, afortunadamente casual',       example: 'Our serendipitous meeting changed everything.',   tip: 'Adjetivo derivado de "serendipity". Súper literario.' },
  { word: 'Ephemeral',      ipa: '/ɪˈfem.ɚ.əl/',         type: 'adjective', level: 'C2', meaning: 'Efímero, de muy corta duración',         example: 'Fame is often ephemeral.',                         tip: 'Del griego ephēmeros = "que dura un día". Opuesto: enduring, lasting.' },
];

// ── ZPD (Zone of Proximal Development) mapping ──────────────────
//
// For each CEFR level, the eligible word pool is the student's own
// level (consolidation) plus one step above (stretch). Exactly as
// Vygotsky's ZPD — the zone the student can reach with support.

const ZPD: Record<string, readonly string[]> = {
  A0:    ['A0', 'A1'],
  A1:    ['A1', 'A2'],
  A2:    ['A2', 'B1'],
  B1:    ['B1', 'B1+', 'B2'],
  'B1+': ['B1+', 'B2'],
  B2:    ['B2', 'B2+', 'C1'],
  'B2+': ['B2+', 'C1'],
  C1:    ['C1', 'C2'],
  C2:    ['C1', 'C2'],
};

/** Returns the word of the day for a student at the given level.
 *  Filters the pool to the student's ZPD (their level + one notch up)
 *  so an A0 learner never gets "serendipity" and a C1 learner isn't
 *  stuck re-practising A2 words. Falls back to the full pool when no
 *  level is passed (login page, hydration-lag, teacher accounts). */
export function getWordOfTheDay(level?: string | null): WordEntry {
  const allowed = level ? ZPD[level] : undefined;
  const pool =
    allowed && allowed.length > 0
      ? WORDS.filter(w => allowed.includes(w.level))
      : WORDS;
  // Safety net: if a level somehow has zero words in the pool, fall
  // back to the whole catalogue rather than crash on `pool[0]`.
  const base = pool.length > 0 ? pool : WORDS;
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return base[dayIndex % base.length];
}
