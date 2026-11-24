// Friendlistenings® — B1+ · Hot shipment (airplane cargo logistics)
//
// A ~3:00 tight turnaround call at SCL airport cargo. Marcela, duty
// manager at the ground handler, has a hot salmon export shipment for
// Miami on the next widebody freighter. The reefer trucks from the
// southern salmon processing plants are running 90 minutes late — the
// pallets have to be built, run through customs, and on the ramp before
// the uplift window closes, or 18 tonnes of salmon miss the flight.
// Omar is the cargo manager at the airline station. They work the
// problem together and decide what to roll.
//
// Business B1+ register for a student doing cargo / supply chain
// English: airport-cargo chunks the industry actually uses, polite but
// time-critical tone, modals + first conditional for scenario planning,
// hedged bad news, light decision-making.
//
// 8-step arc, ~50-minute slot:
//   1. Lead-in     · 4 min — air cargo + cold-chain schema
//   2. Vocab       · 8 min — 8 cargo-ops chunks + 3 checks
//   3. Prediction  · 3 min — what will they decide to do?
//   4. Gist        · 6 min — the core compromise
//   5. Detail      · 10 min — specifics (trucks, tonnes, times, flight)
//   6. Awareness   · 7 min — 5 ops chunks
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 7 min — 90-sec speaking: your own hot-shipment update

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1PlusAirplaneCargoHotSalmon: FLLesson = {
  id:           'b1plus-airplane-cargo-hot-salmon',
  title:        'Hot shipment · Chile → Miami',
  subtitle:     'Air cargo duty manager works a tight turnaround',
  level:        'B1+',
  topic:        'Airplane cargo logistics · cold chain · ULD build · uplift window',
  scenario:     'Marcela, duty manager at the SCL ground handler, calls Omar at the airline cargo station. The reefer trucks from the salmon plants are 90 minutes late, and the uplift window for the widebody freighter to Miami is closing. They decide what gets built, what rolls to the next flight, and how to protect the cold chain.',
  estimatedMin: 50,
  tags:         ['business', 'air-cargo', 'logistics', 'cold-chain', 'first-conditional'],
  createdAt:    '2026-11-24',

  cover: {
    accent: '#0F3D5C',
    emoji:  '✈️',
  },

  audio: {
    durationSec: 185,
    speakers: [
      {
        id: 'marcela', displayName: 'Marcela', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', note: 'ElevenLabs · warm female US — reads as a composed cargo duty manager, works under time pressure without losing control' },
      },
      {
        id: 'omar', displayName: 'Omar', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian', note: 'ElevenLabs · deep male US — airline cargo manager tone, matter-of-fact, decides quickly' },
      },
    ],
    script: [
      { speakerId: 'marcela', approxStartSec:   0, text: 'Omar, Marcela at SCL cargo. Quick one — we have a problem with tonight\'s Miami freighter. The reefers from Puerto Montt are ninety minutes behind. Customs cleared the plants on time, but the trucks hit traffic south of Chillán.' },
      { speakerId: 'omar',    approxStartSec:  18, text: 'How bad? Are we still making the uplift window?' },
      { speakerId: 'marcela', approxStartSec:  23, text: 'If we keep the full manifest — eighteen tonnes, six pallets — no. My build-up team can\'t turn that around and still get it cleared before the ramp cut-off. We\'d be about forty minutes short.' },
      { speakerId: 'omar',    approxStartSec:  38, text: 'Walk me through the options. What can you actually get on that aircraft?' },
      { speakerId: 'marcela', approxStartSec:  45, text: 'Four pallets, no problem. The last two are the issue — they\'re coming on the second truck. If we commit to four and roll the other two to the Thursday service, we protect the cold chain and we make the flight.' },
      { speakerId: 'omar',    approxStartSec:  61, text: 'Which customer sits on those last two?' },
      { speakerId: 'marcela', approxStartSec:  66, text: 'Both for AquaChile. They\'re on their own single AWB, so we can split it cleanly. I\'d rather roll AquaChile than break out of cold chain on all eighteen tonnes trying to force it.' },
      { speakerId: 'omar',    approxStartSec:  80, text: 'Agreed. The last thing we need is a temperature excursion on a salmon shipment going into Miami. Can you hold those two pallets in your reefer cells until Thursday?' },
      { speakerId: 'marcela', approxStartSec:  93, text: 'Yes — I have two slots in cold storage. Temperature logger stays on the whole time, so when Thursday\'s build-up starts we\'ve got the chain documented.' },
      { speakerId: 'omar',    approxStartSec: 105, text: 'Good. I\'ll call AquaChile\'s forwarder myself and explain. Better they hear it from me than from the airport. What time does your truck two actually arrive?' },
      { speakerId: 'marcela', approxStartSec: 118, text: 'ETA now is eleven forty. By the time we strip it and move to cold cells, that\'s twenty past midnight. The Miami freighter closes ramp at eleven thirty, so there was never any way.' },
      { speakerId: 'omar',    approxStartSec: 134, text: 'Understood. Send me the split manifest and the new Thursday pallet plan by… let\'s say ten tonight, so I can brief the Miami station before their shift starts.' },
      { speakerId: 'marcela', approxStartSec: 147, text: 'You\'ll have it. Anything you want me to flag to the customer besides the roll?' },
      { speakerId: 'omar',    approxStartSec: 155, text: 'Yes — put the temperature logger IDs in the note, so AquaChile sees we\'re documenting the cold chain for the two rolled pallets. That\'s what will land this well.' },
      { speakerId: 'marcela', approxStartSec: 169, text: 'Done. I\'ll start the build-up on the four now. Talk in an hour.' },
      { speakerId: 'omar',    approxStartSec: 177, text: 'Thanks, Marcela. Good call flagging this early.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Air cargo lives or dies by the uplift window — the few hours before a freighter closes its ramp. In this listening, a duty manager at Santiago airport cargo has to decide what makes the flight and what gets rolled, without breaking the cold chain on 18 tonnes of salmon.',
      hookEmoji: '✈️',
      openQuestions: [
        { id: 'li1', prompt: 'What do you think is the hardest part of running cargo at an airport: the time pressure, the paperwork, or the cold chain? Why?' },
        { id: 'li2', prompt: 'Have you ever had to decide what to ship first when you couldn\'t ship everything? What did you prioritise?' },
        { id: 'li3', prompt: 'If a truck is late and you can only put part of the shipment on the plane, is it better to force everything or split it? What depends on?', hint: 'Think about perishables vs. non-perishables.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'Eight chunks you hear every day on an air cargo station. They\'re specific enough to sound like you work in this industry — but the patterns (modals, first conditional, phrasal verbs) transfer anywhere.',
      items: [
        { id: 'v1', word: 'the uplift window',          pos: 'noun',         translation: 'La ventana de tiempo para cargar un vuelo antes del cut-off.',                              example: 'We\'re still making the uplift window.',                            definition: 'the time window to load a flight before the ramp closes' },
        { id: 'v2', word: 'to roll (cargo / a pallet)', pos: 'verb',         translation: 'Mover una carga al siguiente vuelo porque no alcanza el actual. No se pierde, se "rolea".', example: 'We\'d roll the other two pallets to Thursday.',                     definition: 'to move cargo to the next flight when it misses this one' },
        { id: 'v3', word: 'a reefer (truck / container)', pos: 'noun',       translation: 'Un camión o contenedor refrigerado. "Reefer" es industry slang por "refrigerated".',          example: 'The reefers from Puerto Montt are ninety minutes behind.',          definition: 'a refrigerated truck or container' },
        { id: 'v4', word: 'build-up',                    pos: 'noun',        translation: 'La construcción / palletizado de la carga sobre un ULD (unit load device) antes de subir al avión.', example: 'My build-up team can\'t turn that around in time.',                   definition: 'the palletising of cargo onto a ULD before loading' },
        { id: 'v5', word: 'the cold chain',              pos: 'noun',        translation: 'La cadena de frío — temperatura controlada de principio a fin para productos perecederos.',  example: 'We protect the cold chain by rolling the extra pallets.',            definition: 'the continuous temperature-controlled chain for perishables' },
        { id: 'v6', word: 'to break out of (sth)',       pos: 'phrasal-verb',translation: 'Romper / salirse de algo (una cadena, un plan). En cold chain = incidente de temperatura.',  example: '…rather than break out of cold chain on all eighteen tonnes.',       definition: 'to fall out of a controlled state (temperature, plan, process)' },
        { id: 'v7', word: 'an AWB (air waybill)',        pos: 'noun',        translation: 'El documento base del envío aéreo. Un AWB puede partirse (split) si son varios destinos / partes.', example: 'They\'re on their own single AWB, so we can split it cleanly.',    definition: 'the key shipping document that travels with air cargo' },
        { id: 'v8', word: 'ramp cut-off',                pos: 'noun',        translation: 'La hora límite en la que la carga tiene que estar en pista para que suba al vuelo.',          example: '…before the ramp cut-off.',                                           definition: 'the deadline for cargo to be on the ramp before loading closes' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"We rolled the pallet to Thursday" means the pallet…',
          options: [
            { id: 'a', text: 'was damaged and thrown away' },
            { id: 'b', text: 'moved to the next scheduled flight' },
            { id: 'c', text: 'went by road instead of by air' },
          ],
          correct: 'b',
          explain: '"To roll" cargo = defer it to the next flight on the same route. Essential air-cargo verb.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'A "reefer" in air cargo is…',
          options: [
            { id: 'a', text: 'a type of forklift' },
            { id: 'b', text: 'a refrigerated truck or container' },
            { id: 'c', text: 'a pilot licence category' },
          ],
          correct: 'b',
          explain: '"Reefer" = refrigerated unit. Core cold-chain chunk.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"We can\'t break out of cold chain" means we must NOT…',
          options: [
            { id: 'a', text: 'let the temperature go out of range' },
            { id: 'b', text: 'change the customs broker' },
            { id: 'c', text: 'use a different airline' },
          ],
          correct: 'a',
          explain: '"Break out of cold chain" = fall out of the controlled-temperature state. A single temperature excursion can ruin perishable cargo.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Marcela has a tight uplift window and trucks that are 90 minutes late. Predict how the conversation goes.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What will Marcela propose?',
          options: [
            { id: 'a', text: 'Delay the whole flight to wait for all the cargo' },
            { id: 'b', text: 'Put four pallets on the flight and roll two to the next service' },
            { id: 'c', text: 'Switch the salmon to ocean freight on the spot' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will Omar most likely do about the customer?',
          options: [
            { id: 'a', text: 'Ignore the customer until after the flight leaves' },
            { id: 'b', text: 'Call the customer\'s forwarder himself to explain' },
            { id: 'c', text: 'Ask Marcela to send a generic email in the morning' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'Why is protecting the cold chain the priority?',
          options: [
            { id: 'a', text: 'Because Miami customs refuses warm cargo' },
            { id: 'b', text: 'Because salmon can only be shipped at night' },
            { id: 'c', text: 'Because a single temperature excursion ruins the shipment' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE, no pauses. Catch the big picture.',
      listenFor: [
        'What exactly made the shipment slip',
        'Marcela\'s core proposal',
        'What Omar commits to doing himself',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is Marcela\'s core proposal?',
          options: [
            { id: 'a', text: 'Hold the flight 40 minutes to fit everything' },
            { id: 'b', text: 'Ship four pallets tonight and roll two to Thursday to protect the cold chain' },
            { id: 'c', text: 'Cancel the Miami freighter entirely' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Omar personally commit to?',
          options: [
            { id: 'a', text: 'Calling AquaChile\'s forwarder himself to explain the roll' },
            { id: 'b', text: 'Driving to the airport that night' },
            { id: 'c', text: 'Changing the aircraft type' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Both speakers agree that forcing all 18 tonnes onto tonight\'s flight is worth the risk.',
          correct: 'F',
          explain: 'The opposite — "rather roll AquaChile than break out of cold chain". Protecting the chain beats the uplift.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again. Pause when you need to. The transcript is available.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Marcela says the reefers from Puerto Montt are ___ minutes behind.',
          answers:  ['ninety'],
          alts:     [['90']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What stopped the trucks from arriving on time?',
          options: [
            { id: 'a', text: 'Customs holding the plants' },
            { id: 'b', text: 'Traffic south of Chillán' },
            { id: 'c', text: 'A reefer breakdown' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd3',
          sentence: 'The full manifest is ___ tonnes across ___ pallets.',
          answers:  ['eighteen', 'six'],
          alts:     [['18'], ['6']],
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'How many pallets does Marcela commit to putting on tonight\'s flight?',
          options: [
            { id: 'a', text: 'All six' },
            { id: 'b', text: 'Four' },
            { id: 'c', text: 'Two' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'Which customer owns the two rolled pallets?',
          options: [
            { id: 'a', text: 'AquaChile' },
            { id: 'b', text: 'The airline itself' },
            { id: 'c', text: 'Multiple customers — it\'s a consolidated AWB' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'What does Marcela promise for the two rolled pallets while they wait?',
          options: [
            { id: 'a', text: 'A ground-freight contingency to Miami' },
            { id: 'b', text: 'Storage in reefer cells with temperature logger on' },
            { id: 'c', text: 'A refund to the customer' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'Omar wants the split manifest and the new Thursday pallet plan by ___ tonight.',
          answers:  ['ten'],
          alts:     [['10', '10pm', '10 pm']],
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Omar asks Marcela to include the temperature logger IDs in the customer note.',
          correct: 'T',
          explain: '"Put the temperature logger IDs in the note" — documents the cold chain for the rolled pallets.',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five chunks that make this sound like a real air-cargo control-room call, not a textbook roleplay.',
      chunks: [
        {
          id:       'c1',
          chunk:    'Quick one',
          category: 'discourse-marker',
          gloss:    '"Rápido una cosa" — señala que la llamada es urgente y breve',
          example:  '"Omar, Marcela at SCL cargo. Quick one — we have a problem with tonight\'s Miami freighter."',
          notice:   'Front-loads urgency without panic. The industry uses "Quick one" / "Heads up" / "Flagging early" to open a time-sensitive call. Compare: "Hi, how are you?" — wrong register here.',
        },
        {
          id:       'c2',
          chunk:    'If we + simple present, we\'d + verb',
          category: 'grammar-pattern',
          gloss:    'Primer condicional "mixto" para explorar escenarios operacionales',
          example:  '"If we keep the full manifest… we\'d be about forty minutes short."',
          notice:   'Classic planning structure under pressure. Lets you reason about a scenario without committing. Very frequent in air cargo, supply chain, and operations English.',
        },
        {
          id:       'c3',
          chunk:    'I\'d rather X than Y',
          category: 'register',
          gloss:    'Prefiero X antes que Y — deja explícita la prioridad',
          example:  '"I\'d rather roll AquaChile than break out of cold chain on all eighteen tonnes."',
          notice:   'States the trade-off cleanly. Essential when operations have to choose between two bad options. Mature professional move — names the priority instead of hedging.',
        },
        {
          id:       'c4',
          chunk:    'to walk (sb) through the options',
          category: 'collocation',
          gloss:    'Explicarle paso a paso las opciones a alguien (típicamente a quien decide)',
          example:  '"Walk me through the options. What can you actually get on that aircraft?"',
          notice:   'Omar is asking for a structured breakdown. The verb "walk (sb) through" = give a guided tour of a plan. Compare: "explain" (too flat), "run me through" (close synonym).',
        },
        {
          id:       'c5',
          chunk:    'Good call flagging this early',
          category: 'register',
          gloss:    '"Bien jugado avisar a tiempo" — reconocimiento profesional',
          example:  '"Thanks, Marcela. Good call flagging this early."',
          notice:   '"Good call + verb-ing" closes a hard call on a positive professional note. Values proactivity over perfection. Learn it as a unit.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks in short tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"The reefer temperature log ___ out of range for seven minutes — that\'s a documented excursion."',
          answers:  ['broke'],
          hint:     'Past of "break out" — cold-chain verb.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses "roll (cargo)" correctly?',
          options: [
            { id: 'a', text: 'We rolled two pallets to the next flight.' },
            { id: 'b', text: 'We rolled the customer invoice.' },
            { id: 'c', text: 'We rolled the aircraft type.' },
          ],
          correct: 'a',
          explain: '"Roll" applies to a shipment / pallet moving to the next scheduled flight. Not used for invoices or aircraft types.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"If we ___ to force all six on, we ___ miss the ramp cut-off by forty minutes."',
          answers:  ['try', 'would'],
          hint:     'First-conditional scenario planning (if + present, would).',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '"I\'d ___ roll two pallets ___ break out of cold chain on all eighteen tonnes."',
          answers:  ['rather', 'than'],
          hint:     'Trade-off structure.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'The most professional open to a time-critical call to your airline is:',
          options: [
            { id: 'a', text: '"Quick one — flagging a problem on tonight\'s freighter."' },
            { id: 'b', text: '"Hey, you won\'t believe what happened!"' },
            { id: 'c', text: '"Sorry to bother you, this is probably nothing…"' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You\'re the duty manager. Pick a hot-shipment scenario you know (cherries at season peak, pharma with a dry-ice timer, an AOG part for a grounded aircraft). Record 90 seconds calling your airline with an update and a plan.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) a one-line "Quick one — flagging" opener, (2) what slipped and by how much, (3) your proposal for what makes this flight and what rolls, (4) how you\'re protecting the cold chain / cargo integrity for the rolled portion, (5) what you\'ll send to whom and by when. Use at least 3 of: "Quick one — ", "If we + verb, we\'d + verb", "I\'d rather X than Y", "walk me through…", "Good call + verb-ing".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
