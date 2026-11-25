// Friendlistenings® — B1 · OGMP 2.0 for electrical engineers
// Class 1 of the series: primer / onboarding — the ecosystem the
// student will walk into before we touch mitigation in Class 2.
//
// Pedagogical intent: a B1 engineer sitting in her first OGMP review
// needs the SCHEMA before the actions. "Mitigation" and "flaring"
// mean nothing until you know what OGMP is, what the five reporting
// levels demand, which assets count, and what the annual cycle
// looks like. This class front-loads that ecosystem so Class 2
// (mitigation, flaring, vent recovery) can focus on operational
// decisions instead of definitions.
//
// Audio: an onboarding call. Marion (already met in Class 2)
// walks Léa, a newly-hired engineer on the environment team, through
// the basics. Léa asks the "stupid" questions a B1 learner also
// wants to ask — gives the student permission to not know
// everything yet.
//
// 8-step arc, ~50-minute slot:
//   1. Lead-in     · 4 min — why methane / why OGMP
//   2. Vocab       · 10 min — 8 primer concepts
//   3. Prediction  · 3 min — what makes a company reach L5?
//   4. Gist        · 6 min — the core of OGMP in Marion's words
//   5. Detail      · 10 min — levels, asset types, reporting cycle
//   6. Awareness   · 7 min — 5 reusable discourse moves for primers
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 7 min — 90-sec "explain OGMP to a colleague"
//
// Speed: the player exposes 0.75× / 0.85× / 1×. Lead-in asks the
// student to start at 0.85× (closest to the teacher-requested
// 0.80× pacing).
//
// Voice cast off the non-saturated whitelist, kept consistent with
// Class 2 for continuity: Marion returns on Rachel; Léa on Jessica
// (young expressive female US, reads as a recent graduate).

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1OgmpIntroClass01: FLLesson = {
  id:           'b1-ogmp-intro-class-01',
  title:        'OGMP 2.0 · Class 1 · What is OGMP (and why does it matter)',
  subtitle:     'Primer for engineers — methane, levels, assets, baseline year',
  level:        'B1',
  topic:        'OGMP 2.0 fundamentals · reporting levels · quantification vs mitigation',
  scenario:     'Léa has just joined the environment team at a gas-transport company. Her manager Marion walks her through what OGMP 2.0 actually is, the five reporting levels, which assets count, and the annual review cycle — the schema every emissions meeting assumes but almost never explains. Core English for any engineer stepping into OGMP-aligned work for the first time.',
  estimatedMin: 50,
  tags:         ['business', 'engineering', 'ogmp', 'methane', 'onboarding', 'definitions'],
  createdAt:    '2026-11-25',

  cover: {
    accent: '#2563eb',
    emoji:  '📘',
  },

  audio: {
    // ~3:10 onboarding call.
    durationSec: 190,
    speakers: [
      {
        id: 'marion', displayName: 'Marion', accent: 'EU', gender: 'f',
        suggestedVoice: { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', note: 'ElevenLabs · calm female US — same voice as Class 2 for series continuity; measured, explains without being condescending' },
      },
      {
        id: 'lea', displayName: 'Léa', accent: 'EU', gender: 'f',
        suggestedVoice: { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', note: 'ElevenLabs · young expressive female US — reads as a recent graduate on day one of the job, curious and willing to ask basic questions' },
      },
    ],
    script: [
      { speakerId: 'marion', approxStartSec:   0, text: 'Welcome again, Léa. Before you sit in any of our review meetings, let me give you the ten-minute version of what OGMP is and why we spend so much time on it.' },
      { speakerId: 'lea',    approxStartSec:   8, text: 'Please. I know it stands for Oil and Gas Methane Partnership, but that is really all I have.' },
      { speakerId: 'marion', approxStartSec:  15, text: 'That is a fine starting point. OGMP 2.0 is a voluntary reporting framework from the UN. Member companies report their methane emissions every year, in a common format, and get a reporting level back from one to five.' },
      { speakerId: 'lea',    approxStartSec:  31, text: 'Why so much focus on methane specifically? I thought the big story was CO₂.' },
      { speakerId: 'marion', approxStartSec:  38, text: 'Methane leaks less, but over twenty years it traps far more heat than the same volume of CO₂. So cutting methane is the fastest way to slow down warming in the short term. That is why the industry has its own methane framework.' },
      { speakerId: 'lea',    approxStartSec:  57, text: 'And the levels one to five — what are they?' },
      { speakerId: 'marion', approxStartSec:  62, text: 'They describe how accurate your numbers are. Level one is generic emission factors — basically published averages. Level five is full site-level measurements, often using flyovers or continuous analyzers. We are reporting at level four on all operated assets, and we aim for level five this year.' },
      { speakerId: 'lea',    approxStartSec:  85, text: 'Operated assets — meaning the ones we run ourselves?' },
      { speakerId: 'marion', approxStartSec:  91, text: 'Exactly. We report on assets we operate, not assets we only have equity in. Among those, some are classified as material — the compressor stations and pipelines that account for most of our emissions. Material assets get the deepest level of reporting.' },
      { speakerId: 'lea',    approxStartSec: 109, text: 'So the compressor stations are where most of the methane actually leaves our system?' },
      { speakerId: 'marion', approxStartSec: 116, text: 'Yes, by a wide margin. Compressor stations, pipelines, metering and regulating sites, and LNG terminals — those are the four asset families. OGMP wants us to split the emissions across those categories so you can see where each gramme comes from.' },
      { speakerId: 'lea',    approxStartSec: 135, text: 'And the two pillars I keep seeing — quantification and mitigation — are two different conversations?' },
      { speakerId: 'marion', approxStartSec: 143, text: 'That is the right way to think about it. Quantification is measuring the number. Mitigation is bringing the number down. The annual report covers both, but internally they are run by different teams.' },
      { speakerId: 'lea',    approxStartSec: 160, text: 'One last one — I keep hearing "baseline year". What does that anchor?' },
      { speakerId: 'marion', approxStartSec: 167, text: 'Every reduction we claim — "down fifty percent", "down thirty percent" — is measured against a reference year. Ours is 2023. So when we say "on track to 2030", we mean on track against the 2023 baseline. Hold on to that — it will come back in every meeting.' },
      { speakerId: 'lea',    approxStartSec: 185, text: 'Understood. Thanks, Marion.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Today is your first OGMP 2.0 briefing. You will hear Marion explain the whole framework to a new hire — the vocabulary every methane meeting assumes but almost never defines. Start the audio at 0.85× for the first pass. Every concept in the dialogue is unpacked in Vocab below first.',
      hookEmoji: '📘',
      openQuestions: [
        { id: 'li1', prompt: 'Before today, what did you associate with the word "methane"? Natural gas? Cows? Something else?' },
        { id: 'li2', prompt: 'In your own company, who is responsible for climate or emissions reporting? Is it an engineering team, HSE, or a dedicated sustainability team?' },
        { id: 'li3', prompt: 'Why do you think the industry chose a REPORTING framework rather than a hard cap on emissions?', hint: 'Hint: a reporting level does not fine anyone — but it is public.' },
      ],
    },

    // ─── Step 2 · Vocab (the 8 primer concepts) ──────────────
    {
      kind:  'vocab',
      title: 'The 8 concepts for this class',
      intro: 'Learn these BEFORE the audio. Each one comes up explicitly in Marion\'s explanation. These are the foundations Class 2 (mitigation) will build on.',
      items: [
        { id: 'v1', word: 'methane (CH₄)',                         pos: 'noun', translation: 'Metano — el principal componente del gas natural; mucho más potente que el CO₂ en el corto plazo.',                                                   example: 'Cutting methane is the fastest way to slow down warming in the short term.',                                                   definition: 'the main component of natural gas; traps much more heat than CO₂ over a 20-year horizon' },
        { id: 'v2', word: 'OGMP 2.0 (Oil and Gas Methane Partnership)', pos: 'noun', translation: 'Oil and Gas Methane Partnership 2.0 — marco de reporte voluntario de la ONU para emisiones de metano del sector oil & gas.',                            example: 'OGMP 2.0 is a voluntary reporting framework from the UN.',                                                                      definition: 'a UN-led voluntary framework where oil and gas companies report their methane emissions in a common format' },
        { id: 'v3', word: 'reporting level (L1 → L5)',             pos: 'noun', translation: 'Nivel de reporte — de 1 (factores genéricos) a 5 (medición completa a nivel de sitio). Mide qué tan precisos son tus números, no cuánto emites.',       example: 'Level one is generic emission factors. Level five is full site-level measurements.',                                            definition: 'the accuracy grade OGMP gives your emissions report, from 1 (generic averages) to 5 (site-level measurement)' },
        { id: 'v4', word: 'operated asset',                        pos: 'noun', translation: 'Activo operado — una instalación que la empresa opera directamente (no basta con tener participación accionaria).',                                     example: 'We report on assets we operate, not assets we only have equity in.',                                                            definition: 'a facility the company runs itself; equity-only participation does not count' },
        { id: 'v5', word: 'material asset',                        pos: 'noun', translation: 'Activo material — dentro de los operados, los que concentran la mayor parte de las emisiones (típicamente estaciones compresoras y ductos principales).', example: 'Material assets get the deepest level of reporting.',                                                                           definition: 'the operated assets that account for most of the company\'s methane emissions and therefore need the deepest reporting' },
        { id: 'v6', word: 'asset families (compressor stations / pipelines / M&R / LNG)', pos: 'noun', translation: 'Familias de activos — las 4 categorías en que OGMP divide la operación: estaciones compresoras, ductos, sitios de medición y regulación (M&R), terminales LNG.', example: 'Compressor stations, pipelines, metering and regulating sites, and LNG terminals — those are the four asset families.', definition: 'the four OGMP categories: compressor stations, pipelines, metering and regulating sites, LNG terminals' },
        { id: 'v7', word: 'quantification vs. mitigation',         pos: 'noun', translation: 'Cuantificación vs. mitigación — las dos ramas del reporte: medir la cifra vs. bajar la cifra. Las conversaciones internas corren en paralelo.',         example: 'Quantification is measuring the number. Mitigation is bringing the number down.',                                               definition: 'the two pillars of an OGMP report: measuring the number (quantification) and reducing it (mitigation)' },
        { id: 'v8', word: 'baseline year',                         pos: 'noun', translation: 'Año base — año de referencia contra el cual se mide cualquier % de reducción. En nuestra empresa es 2023.',                                             example: 'Every reduction we claim is measured against a reference year. Ours is 2023.',                                                  definition: 'the reference year every "down X %" claim compares against; anchors all mitigation progress' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'Why does the industry have its OWN methane framework instead of just reporting CO₂?',
          options: [
            { id: 'a', text: 'Methane is cheaper to measure than CO₂.' },
            { id: 'b', text: 'Methane traps far more heat than CO₂ over 20 years, so cutting it is faster climate action.' },
            { id: 'c', text: 'CO₂ reporting is only for power plants, not gas transport.' },
          ],
          correct: 'b',
          explain: 'Methane leaks in smaller volumes but is roughly 80× more potent than CO₂ on a 20-year horizon. That is the whole reason OGMP 2.0 exists.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'The OGMP reporting LEVEL (L1 → L5) measures…',
          options: [
            { id: 'a', text: 'how much methane the company emits' },
            { id: 'b', text: 'how accurate the reported numbers are' },
            { id: 'c', text: 'how many assets the company operates' },
          ],
          correct: 'b',
          explain: 'The level is a quality grade on the DATA — L1 = generic emission factors, L5 = site-level measurement. A company at L5 may still emit a lot; it just reports it precisely.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Which assets must the company report on under OGMP 2.0?',
          options: [
            { id: 'a', text: 'every asset the company has any equity in' },
            { id: 'b', text: 'only LNG terminals' },
            { id: 'c', text: 'the assets the company itself operates; the material ones among them get the deepest reporting' },
          ],
          correct: 'c',
          explain: 'OGMP focuses on operated assets. Material = the subset that drives most of the emissions and therefore gets the full L4/L5 treatment.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Léa is new and is about to ask Marion the basic questions. Predict what Marion is likely to emphasise.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'When Léa asks "why methane specifically?", Marion will probably say…',
          options: [
            { id: 'a', text: 'because methane is cheaper to capture than CO₂' },
            { id: 'b', text: 'because methane traps more heat than CO₂ over the short term, so cutting it is the fastest way to slow warming' },
            { id: 'c', text: 'because the EU has banned CO₂ reporting' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What makes a reporting LEVEL higher?',
          options: [
            { id: 'a', text: 'reporting MORE emissions than last year' },
            { id: 'b', text: 'measuring your own emissions more directly (site-level measurement vs. generic factors)' },
            { id: 'c', text: 'having more employees on the environment team' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'Where will Marion say most of the methane leaves the system?',
          options: [
            { id: 'a', text: 'LNG terminals' },
            { id: 'b', text: 'compressor stations and pipelines' },
            { id: 'c', text: 'metering and regulating sites' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen ONCE at 0.85×. No pauses. Catch the shape of OGMP, not every definition.',
      listenFor: [
        'What OGMP 2.0 actually is in one sentence',
        'What the reporting levels measure',
        'The difference between quantification and mitigation',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'In Marion\'s words, OGMP 2.0 is best described as…',
          options: [
            { id: 'a', text: 'a UN tax on methane emissions' },
            { id: 'b', text: 'a voluntary reporting framework from the UN' },
            { id: 'c', text: 'an industry trade association' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'The reporting level one to five describes…',
          options: [
            { id: 'a', text: 'how much the company emits' },
            { id: 'b', text: 'how accurate the reported numbers are' },
            { id: 'c', text: 'how many years the company has been reporting' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Quantification and mitigation are two different conversations, run by different teams internally.',
          correct: 'T',
          explain: '"That is the right way to think about it… internally they are run by different teams."',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again. Pause when you need to. Transcript is available.',
      allowTranscript:  true,
      questions: [
        {
          kind: 'mcq',
          id: 'd1',
          prompt: 'How often do OGMP member companies report?',
          options: [
            { id: 'a', text: 'once a quarter' },
            { id: 'b', text: 'every year' },
            { id: 'c', text: 'only when a leak is detected' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd2',
          sentence: 'Marion says they currently report at level ___ on all operated assets and aim for level ___ this year.',
          answers:  ['4', '5'],
          alts:     [['four'], ['five']],
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Level 1 is based on…',
          options: [
            { id: 'a', text: 'flyover measurements' },
            { id: 'b', text: 'generic (published) emission factors' },
            { id: 'c', text: 'continuous analyzers on site' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'According to Marion, which assets get the DEEPEST level of reporting?',
          options: [
            { id: 'a', text: 'every asset the company has equity in' },
            { id: 'b', text: 'material assets' },
            { id: 'c', text: 'LNG terminals only' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'The four asset families Marion names are: compressor stations, pipelines, ___ and ___ sites, and ___ terminals.',
          answers:  ['metering', 'regulating', 'LNG'],
          alts:     [['Metering'], ['Regulating'], ['lng']],
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'The company\'s baseline year for reduction claims is 2023.',
          correct: 'T',
          explain: '"Ours is 2023. So when we say \\"on track to 2030\\", we mean on track against the 2023 baseline."',
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'Marion\'s advice about the baseline year is…',
          options: [
            { id: 'a', text: 'ignore it — it is just a technical detail' },
            { id: 'b', text: 'hold on to it — it will come back in every meeting' },
            { id: 'c', text: 'only use it when legal asks' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five reusable moves Marion makes to teach a complex topic without being condescending. You will reuse them whenever you need to explain OGMP to a colleague, a client, or yourself.',
      chunks: [
        {
          id:       'c1',
          chunk:    'let me give you the ten-minute version of…',
          category: 'discourse-marker',
          gloss:    'Te doy la versión corta de… — señala que viene una explicación acotada, no un tratado',
          example:  '"Let me give you the ten-minute version of what OGMP is."',
          notice:   'Managerial move. Promises a bounded explanation so the listener knows it will not drag on. Variants: "the thirty-second version", "the elevator pitch".',
        },
        {
          id:       'c2',
          chunk:    'that is a fine starting point',
          category: 'register',
          gloss:    '"Eso es un buen punto de partida" — valida a quien pregunta sin corregirla',
          example:  '"That is a fine starting point."',
          notice:   'Classic move for onboarding: never tell the newcomer they are wrong on day one. Softer than "correct" or "right" — leaves room to add nuance.',
        },
        {
          id:       'c3',
          chunk:    'the right way to think about it',
          category: 'discourse-marker',
          gloss:    '"La forma correcta de pensarlo" — anuncia el modelo mental que el otro debe adoptar',
          example:  '"That is the right way to think about it."',
          notice:   'Teaches a mental model without lecturing. You can also open with it: "The right way to think about it is X, not Y."',
        },
        {
          id:       'c4',
          chunk:    'by a wide margin',
          category: 'collocation',
          gloss:    'Por mucho — enfatiza una diferencia grande sin dar una cifra',
          example:  '"Compressor stations are where most of the methane leaves our system — by a wide margin."',
          notice:   'Use when the ranking is obvious even if you do not want to commit to a precise percentage. Compare "slightly more", "by far", "overwhelmingly".',
        },
        {
          id:       'c5',
          chunk:    'hold on to that — it will come back',
          category: 'discourse-marker',
          gloss:    '"Quédate con esto, va a reaparecer" — flagguea un concepto clave para el resto del curso',
          example:  '"Hold on to that — it will come back in every meeting."',
          notice:   'Flags a concept the listener will need again. Good move when you teach foundations: tells the student which parts are load-bearing vs. decorative.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the 8 primer concepts and the 5 discourse moves in short tasks.',
      activities: [
        {
          kind: 'mcq',
          id: 'cp1',
          prompt: 'A colleague asks "what\'s OGMP?". The most natural one-sentence answer is:',
          options: [
            { id: 'a', text: '"It is a UN voluntary reporting framework for methane emissions in oil and gas."' },
            { id: 'b', text: '"It is the fine the UN charges for methane leaks."' },
            { id: 'c', text: '"It is our internal maintenance system."' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: '"Compressor stations and pipelines account for most of our methane — ___ a wide ___ ."',
          answers:  ['by', 'margin'],
          hint:     'Fixed phrase for a clear ranking without a hard number.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: 'Which sentence uses "operated asset" correctly?',
          options: [
            { id: 'a', text: 'We have an operated asset in that joint venture — we hold 20% equity.' },
            { id: 'b', text: 'We report under OGMP on every asset we operate ourselves, not the ones where we only hold equity.' },
            { id: 'c', text: 'Operated assets are the ones the vendor runs for us.' },
          ],
          correct: 'b',
          explain: 'Operated = we run it ourselves. Equity-only does not count.',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '"Let me ___ ___ the ten-minute ___ of OGMP."',
          answers:  ['give', 'you', 'version'],
          hint:     'Bounded-explanation opener.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Quantification and mitigation are…',
          options: [
            { id: 'a', text: 'the same thing — two words for measuring emissions' },
            { id: 'b', text: 'two different pillars: measuring the number vs. bringing the number down' },
            { id: 'c', text: 'two different asset families' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'A new colleague just joined your team. In 90 seconds, explain what OGMP 2.0 is and why your company cares about it — the way Marion would.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) OGMP in one sentence, (2) why methane specifically and not CO₂, (3) what the reporting levels measure (and where your company is on the ladder), (4) operated vs. material assets, (5) the baseline year you anchor every reduction claim against. Use at least 3 of: "let me give you the ten-minute version", "that is a fine starting point", "the right way to think about it", "by a wide margin", "hold on to that — it will come back".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
