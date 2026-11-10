// Friendlistenings® — B2 · Off the beaten path
//
// A 3-min podcast-style interview with a solo backpacker who just returned
// from four months in Southeast Asia. The script is natural, conversational
// and packed with reusable chunks a B2 student would hit in authentic
// listening but might miss in a textbook — "end up —ing", "blow my mind",
// "off the beaten path", "hit a wall", "a bit of both".
//
// The 8-step arc is designed for a ~45-minute class slot (or self-study at
// the student's pace):
//   1. Lead-in     · 4 min — activate schema with solo-travel prompts
//   2. Vocab       · 6 min — pre-teach 8 items + 3-question check
//   3. Prediction  · 3 min — guess the content before pressing play
//   4. Gist        · 6 min — first listen, big-picture
//   5. Detail      · 10 min — second listen, specific info + transcript
//   6. Awareness   · 6 min — notice-the-gap on 5 chunks
//   7. Controlled  · 5 min — reuse the chunks in short tasks
//   8. Production  · 5 min — 60 sec speaking using 3+ target chunks

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2OffTheBeatenPath: FLLesson = {
  id:           'b2-off-the-beaten-path',
  title:        'Off the beaten path',
  subtitle:     'A travel podcast interview',
  level:        'B2',
  topic:        'Solo travel · Southeast Asia',
  scenario:     'Marco interviews Luna, a solo backpacker just back from 4 months in SE Asia.',
  estimatedMin: 45,
  tags:         ['travel', 'past-narratives', 'chunks', 'podcast'],
  createdAt:    '2026-11-10',

  cover: {
    accent: '#9B72B8',      // Carla-palette purple
    emoji:  '🎒',
  },

  audio: {
    durationSec: 210,       // ~3 min 30
    speakers: [
      {
        id: 'host', displayName: 'Marco', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'TBD', name: 'warm mid-30s male', note: 'podcast host, light NYC cadence' },
      },
      {
        id: 'guest', displayName: 'Luna', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'TBD', name: 'bright late-20s female', note: 'Latinx English, warm and expressive' },
      },
    ],
    script: [
      { speakerId: 'host',  approxStartSec:   0, text: 'Welcome back to Off the Beaten Path, the podcast that gets real about solo travel. I\'m Marco, and today I\'m talking to Luna Herrera. Luna, you just got back from a four-month trip around Southeast Asia. How are you feeling?' },
      { speakerId: 'guest', approxStartSec:  18, text: 'Honestly, kind of jet-lagged but on cloud nine. I only landed two days ago.' },
      { speakerId: 'host',  approxStartSec:  26, text: 'Four months is a long stretch. What made you decide to go for that long?' },
      { speakerId: 'guest', approxStartSec:  31, text: 'You know, it wasn\'t planned at all. I was supposed to take six weeks off between jobs, but things kept working out — I\'d meet someone who\'d say "you have to see this island," and I\'d just end up adding another stop. Before I knew it, four months had flown by.' },
      { speakerId: 'host',  approxStartSec:  54, text: 'That\'s the beauty of travelling solo, isn\'t it. Was there a moment that really blew your mind?' },
      { speakerId: 'guest', approxStartSec:  61, text: 'Oh, a hundred percent. I spent a week in a tiny village in northern Laos — no WiFi, no hot water — the kind of place that\'s really off the beaten path. One night the whole village came out for a lantern festival, and they just pulled me in. I didn\'t speak the language, they didn\'t speak mine, but we spent the whole night together. That blew me away.' },
      { speakerId: 'host',  approxStartSec:  92, text: 'Money-wise, were you splurging or watching every dollar?' },
      { speakerId: 'guest', approxStartSec:  97, text: 'A bit of both. Most days I\'d eat street food for two dollars and crash at hostel dorms. But every couple of weeks I\'d treat myself — one really nice dinner, or a beachfront bungalow for a night. That mix kept me sane.' },
      { speakerId: 'host',  approxStartSec: 118, text: 'Any moments where you really missed home?' },
      { speakerId: 'guest', approxStartSec: 123, text: 'Yeah, around month three I hit a wall. I was in Bangkok, overstimulated, and suddenly I just wanted my own bed and my mom\'s cooking. But the thing about feeling homesick on the road is — it passes. I caught a slow boat down the Mekong the next day, and by the time I got off, I was good again.' },
      { speakerId: 'host',  approxStartSec: 150, text: 'What\'s the one piece of advice you\'d give someone thinking of doing their first solo trip?' },
      { speakerId: 'guest', approxStartSec: 158, text: 'Pack half of what you think you need, double the money, and don\'t plan past the first week. The best stuff always happens when you leave room for it.' },
      { speakerId: 'host',  approxStartSec: 174, text: 'Luna, thanks for this. Where can people follow your travels?' },
      { speakerId: 'guest', approxStartSec: 180, text: 'You can find me on at-luna-hikes. I\'ll be posting pictures for weeks.' },
      { speakerId: 'host',  approxStartSec: 188, text: 'Perfect. Safe travels — or safe staying home. That\'s it for today\'s episode of Off the Beaten Path.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Antes de empezar',
      intro:     'Pensá por un momento en viajar solo/a. No importa si nunca lo hiciste — el solo pensamiento ya trae imágenes, deseos, miedos. Hoy vamos a escuchar una entrevista con Luna, una viajera que acaba de volver de cuatro meses en el sudeste asiático.',
      hookEmoji: '🎒',
      openQuestions: [
        { id: 'li1', prompt: '¿Alguna vez viajaste solo/a? ¿A dónde? ¿Si no, por qué no?' },
        { id: 'li2', prompt: 'Imaginá que tenés cuatro meses y presupuesto medio. ¿Qué parte del mundo elegirías? ¿Por qué?' },
        { id: 'li3', prompt: '¿Qué te costaría más de viajar tanto tiempo solo/a: la logística, la soledad o el dinero?', hint: 'Pensá en los últimos días de un viaje largo que hayas hecho.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Vocabulario clave',
      intro: 'Antes de escuchar, mirá estas 8 expresiones que Luna va a usar. Son chunks que un nativo suelta todo el tiempo y que son tu llave para entender a velocidad natural.',
      items: [
        { id: 'v1', word: 'jet-lagged',        pos: 'adjective', translation: 'con jet lag, desfasado/a horariamente', example: 'I\'m jet-lagged but on cloud nine.',           soundsLike: 'JET-lagd' },
        { id: 'v2', word: 'on cloud nine',     pos: 'idiom',     translation: 'feliz, "flotando"',                     example: 'On cloud nine after landing home.',             definition: 'extremely happy' },
        { id: 'v3', word: 'end up —ing',       pos: 'phrase',    translation: 'terminar haciendo (algo no planeado)',  example: 'I ended up adding another stop.',               soundsLike: 'end UP' },
        { id: 'v4', word: 'blow (sb\'s) mind', pos: 'idiom',     translation: 'volarle la cabeza a alguien, impactar', example: 'That village blew me away.',                    definition: 'to impress or amaze' },
        { id: 'v5', word: 'off the beaten path',pos:'idiom',     translation: 'fuera de los circuitos turísticos',     example: 'A place that\'s really off the beaten path.',   definition: 'unusual, not visited by many tourists' },
        { id: 'v6', word: 'to splurge',        pos: 'verb',      translation: 'darse un gusto caro',                   example: 'Every couple of weeks I\'d splurge.',           definition: 'to spend more than you usually do' },
        { id: 'v7', word: 'to crash',          pos: 'verb',      translation: 'dormir (informal), caer rendido',       example: 'I\'d crash at hostel dorms.',                   definition: 'to sleep in a casual / tired way' },
        { id: 'v8', word: 'to hit a wall',     pos: 'idiom',     translation: 'agotarse emocional/físicamente',        example: 'Around month three I hit a wall.',              definition: 'to reach a point of exhaustion' },
      ],
      quiz: [
        {
          id: 'vq1',
          prompt: 'Si alguien dice "I\'m on cloud nine", está…',
          options: [
            { id: 'a', text: 'muy triste' },
            { id: 'b', text: 'extremadamente feliz' },
            { id: 'c', text: 'confundida' },
          ],
          correct: 'b',
          explain: 'On cloud nine = extremely happy. Clásica.',
        },
        {
          id: 'vq2',
          prompt: '"I ended up buying a ticket" significa que…',
          options: [
            { id: 'a', text: 'lo tenía planeado desde el principio' },
            { id: 'b', text: 'terminó comprándolo aunque no era el plan' },
            { id: 'c', text: 'no lo compró' },
          ],
          correct: 'b',
          explain: '"End up —ing" implica resultado NO planeado.',
        },
        {
          id: 'vq3',
          prompt: 'Un restaurant "off the beaten path" es…',
          options: [
            { id: 'a', text: 'muy famoso y lleno de turistas' },
            { id: 'b', text: 'poco conocido, fuera del circuito turístico' },
            { id: 'c', text: 'cerrado permanentemente' },
          ],
          correct: 'b',
          explain: 'Es el opuesto a "tourist trap".',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: '¿Qué vas a escuchar?',
      intro: 'Sin apretar play todavía — con el título "Off the Beaten Path" y sabiendo que Luna volvió de cuatro meses en el sudeste asiático, adiviná.',
      questions: [
        {
          id: 'p1',
          prompt: '¿Qué tema creés que Luna va a mencionar primero?',
          options: [
            { id: 'a', text: 'Lo cansada que está' },
            { id: 'b', text: 'Un conflicto en un aeropuerto' },
            { id: 'c', text: 'El precio del pasaje' },
          ],
          correct: 'a',
        },
        {
          id: 'p2',
          prompt: '¿Qué momento creés que la impactó MÁS?',
          options: [
            { id: 'a', text: 'Una cena cara en un restaurant famoso' },
            { id: 'b', text: 'Un festival en un pueblo remoto' },
            { id: 'c', text: 'Un museo arqueológico' },
          ],
          correct: 'b',
        },
        {
          id: 'p3',
          prompt: '¿En qué momento del viaje creés que se sintió peor?',
          options: [
            { id: 'a', text: 'La primera semana' },
            { id: 'b', text: 'Alrededor del tercer mes' },
            { id: 'c', text: 'El día de volver' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Escucha general',
      intro:     'Apretá play y escuchá el audio completo UNA vez. No te preocupes por detalles — captá la idea principal.',
      listenFor: [
        'El tono general: ¿se arrepiente, está feliz, mixto?',
        'La actitud de Luna frente al presupuesto',
        'El mensaje final / consejo',
      ],
      allowTranscript: false,
      questions: [
        {
          id: 'g1',
          prompt: 'En general, ¿cómo describe Luna la experiencia?',
          options: [
            { id: 'a', text: 'Agotadora y arrepentida' },
            { id: 'b', text: 'Transformadora y positiva, aunque no sin momentos duros' },
            { id: 'c', text: 'Aburrida y predecible' },
          ],
          correct: 'b',
        },
        {
          id: 'g2',
          prompt: '¿Cuál es el mensaje central de Luna sobre viajar solo/a por mucho tiempo?',
          options: [
            { id: 'a', text: 'Hay que planificar cada día en detalle' },
            { id: 'b', text: 'Dejar espacio para lo que no está planeado' },
            { id: 'c', text: 'Es mejor viajar con amigos que solo/a' },
          ],
          correct: 'b',
        },
        {
          id: 'g3',
          prompt: '¿Cuál era el plan ORIGINAL de Luna?',
          options: [
            { id: 'a', text: 'Viajar seis meses' },
            { id: 'b', text: 'Tomarse seis semanas entre trabajos' },
            { id: 'c', text: 'Mudarse definitivamente a Asia' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Escucha detallada',
      intro:            'Ahora escuchalo otra vez, pausando cuando necesites. Ya podés mirar el transcript si te ayuda.',
      allowTranscript:  true,
      questions: [
        {
          id:       'd1',
          sentence: 'Luna pasó una semana en una aldea pequeña en el norte de ___.',
          answers:  ['Laos'],
          alts:     [['laos']],
        },
        {
          id: 'd2',
          prompt: 'Según Luna, ¿cómo pasaba la mayoría de los días a nivel comida?',
          options: [
            { id: 'a', text: 'Restaurantes caros con amigos' },
            { id: 'b', text: 'Street food por dos dólares' },
            { id: 'c', text: 'Cocinando en el hostel' },
          ],
          correct: 'b',
        },
        {
          id:       'd3',
          sentence: 'Luna "hit a wall" alrededor del mes ___, en la ciudad de ___.',
          answers:  ['three', 'Bangkok'],
          alts:     [['3', 'tres'], ['bangkok']],
        },
        {
          id: 'd4',
          prompt: 'Cuando se sintió mal en Bangkok, ¿qué hizo al día siguiente?',
          options: [
            { id: 'a', text: 'Volvió a casa en avión' },
            { id: 'b', text: 'Tomó un slow boat por el río Mekong' },
            { id: 'c', text: 'Se quedó una semana más en Bangkok' },
          ],
          correct: 'b',
        },
        {
          id: 'd5',
          prompt: '¿Cuál es el consejo de Luna sobre el dinero para alguien que viaja solo/a por primera vez?',
          options: [
            { id: 'a', text: 'Llevá lo justo' },
            { id: 'b', text: 'Doblá lo que creés que vas a necesitar' },
            { id: 'c', text: 'Pedí prestado' },
          ],
          correct: 'b',
        },
        {
          id:       'd6',
          prompt:   'Luna recomienda no planificar más allá de la primera semana del viaje.',
          correct:  'T',
          explain:  'Textual: "don\'t plan past the first week."',
        },
        {
          id:       'd7',
          prompt:   'Luna viajó con un amigo todo el tiempo.',
          correct:  'F',
          explain:  'Es un podcast sobre viajar SOLO/A.',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Fijate en estas expresiones',
      intro: 'Volvé al transcript y ubicá estas cinco expresiones. No son vocabulario aislado — son chunks que te permiten sonar natural sin pensar en gramática.',
      chunks: [
        {
          id:       'c1',
          chunk:    'to end up —ing',
          category: 'grammar-pattern',
          gloss:    'terminar haciendo algo (resultado no planeado)',
          example:  '"I\'d just end up adding another stop."',
          notice:   'Siempre + gerundio (-ing). Marca un resultado no planeado. Comparalo con "I decided to add another stop" — más intencional.',
        },
        {
          id:       'c2',
          chunk:    '(sth) blew my mind / away',
          category: 'idiom',
          gloss:    'me voló la cabeza / me dejó impactado',
          example:  '"That blew me away."',
          notice:   'Pasado simple de "blow" → BLEW, no "blowed". Es casi siempre con "mind" o "away".',
        },
        {
          id:       'c3',
          chunk:    'off the beaten path',
          category: 'idiom',
          gloss:    'fuera de los circuitos turísticos',
          example:  '"The kind of place that\'s really off the beaten path."',
          notice:   'Funciona como adjetivo (after a noun) o adverbio. Lo opuesto: "a tourist trap".',
        },
        {
          id:       'c4',
          chunk:    'a bit of both',
          category: 'discourse-marker',
          gloss:    'un poco de cada una / depende',
          example:  '"A bit of both."',
          notice:   'Respuesta corta para cuando alguien te pregunta "¿A o B?" y las dos son parcialmente ciertas. Muy natural.',
        },
        {
          id:       'c5',
          chunk:    'I\'d [verb] + I\'d [verb]',
          category: 'grammar-pattern',
          gloss:    '"would" para hábitos pasados',
          example:  '"I\'d eat street food... I\'d crash at hostel dorms."',
          notice:   '"Would" (= I\'d) describe hábitos del pasado, igual que "used to" pero más conversacional cuando ya estableciste el contexto temporal.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Práctica guiada',
      intro: 'Usá los chunks del paso anterior en estas mini-tareas.',
      activities: [
        {
          id:       'cp1',
          sentence: 'The concert last night ___ my mind — I\'ve never seen anything like it.',
          answers:  ['blew'],
          hint:     'Pasado simple del verbo correspondiente.',
        },
        {
          id:       'cp2',
          sentence: 'We were going to stay one night, but we ___ up staying for a week.',
          answers:  ['ended'],
          hint:     'Resultado no planeado.',
        },
        {
          id: 'cp3',
          prompt: '"Were you happy with the hotel OR the beach?" → la mejor respuesta sonando natural es:',
          options: [
            { id: 'a', text: 'Yes, I was.' },
            { id: 'b', text: 'A bit of both.' },
            { id: 'c', text: 'I don\'t know.' },
          ],
          correct: 'b',
        },
        {
          id:       'cp4',
          sentence: 'Back in college, I ___ study at the library every night and ___ grab coffee on the way home.',
          answers:  ['would', 'would'],
          alts:     [['\'d'], ['\'d']],
          hint:     'Hábito del pasado, contracted form OK.',
        },
        {
          id: 'cp5',
          prompt: '¿Cuál de estos lugares es "off the beaten path"?',
          options: [
            { id: 'a', text: 'Times Square, Nueva York' },
            { id: 'b', text: 'La Torre Eiffel' },
            { id: 'c', text: 'Un pueblo pescador sin nombre en el mapa' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Ahora vos',
      intro:        'Es tu turno de hablar como Luna. Vas a grabar 60 segundos — tratá de usar al menos 3 de los chunks de la lesson.',
      mode:         'speaking',
      prompt:       'Contá un viaje (real o inventado) donde terminaste haciendo algo que NO estaba planeado. ¿Qué pasó? ¿Cómo te sentiste? ¿Qué aprendiste? Minimo 60 segundos.',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
