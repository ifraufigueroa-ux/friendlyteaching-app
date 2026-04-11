// FriendlyTeaching.cl — Word of the Day data
// Rotating vocabulary for the login page. Picks one word per day deterministically.

export interface WordEntry {
  word: string;
  ipa: string;           // IPA pronunciation
  type: string;          // noun, verb, adjective, etc.
  level: string;         // CEFR level
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
];

/** Returns the word of the day based on the current date. */
export function getWordOfTheDay(): WordEntry {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return WORDS[dayIndex % WORDS.length];
}
