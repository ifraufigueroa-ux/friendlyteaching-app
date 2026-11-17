// Friendlistenings® — B1+ · Half a TMS (transport management system cutover)
//
// A ~3:30 weekly client-sync call — same recurring pair as "The sprint
// is slipping" (Clara, UK operations lead · Rohan, Indian-English
// logistics consultant) — now a few months into a Transport Management
// System implementation. Target was a Q1 go-live across procurement,
// rate shopping, load tendering AND real-time visibility. Two of
// Clara's top-five carriers never upgraded to the new EDI 214 status
// feed, so the control-tower dashboards are mostly empty. Rohan tells
// her the honest version and proposes cutover of the money-making
// modules on time while visibility slips to Q2.
//
// Register is a notch harder than sprint-slip: mixed conditionals for
// unreal past → present ("if the feeds had been stable, we'd already
// be live"), cleft-emphasis openers ("what we're seeing is…"), B1+
// hedged collocations ("a hard dependency on"), and softer
// dissatisfaction ("I'm not loving the…"). All of it lives in a real
// TMS context — EDI 214, control tower, cutover, workaround, fallback.
//
// 8-step arc, ~55-minute slot:
//   1. Lead-in     · 4 min — SaaS launches + "demo vs. production" schema
//   2. Vocab       · 8 min — 8 TMS chunks + 3 checks
//   3. Prediction  · 3 min — how will Rohan frame half a TMS?
//   4. Gist        · 6 min — the core compromise
//   5. Detail      · 12 min — specifics (feeds, modules, dates)
//   6. Awareness   · 8 min — 5 B1+ business chunks
//   7. Controlled  · 7 min — reuse the chunks
//   8. Production  · 7 min — 90-sec speaking: an honest launch update

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1PlusTmsCutoverSlip: FLLesson = {
  id:           'b1plus-tms-cutover-slip',
  title:        'Half a TMS',
  subtitle:     'A transport management system cutover goes partial',
  level:        'B1+',
  topic:        'Transport Management System · partial go-live · carrier EDI feeds',
  scenario:     'Rohan tells Clara that two of her top-five carriers never upgraded to the new EDI 214 feed, so the TMS visibility layer is empty three weeks from go-live. He proposes a partial cutover: ship the three savings modules on time, move visibility to Q2.',
  estimatedMin: 55,
  tags:         ['business', 'logistics', 'TMS', 'mixed-conditional', 'hedging'],
  createdAt:    '2026-11-17',

  cover: {
    accent: '#047857',
    emoji:  '🧭',
  },

  audio: {
    durationSec: 215,
    speakers: [
      {
        id: 'clara', displayName: 'Clara', accent: 'UK', gender: 'f',
        suggestedVoice: { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', note: 'ElevenLabs · warm UK female, supply-chain lead tone — calm, measured' },
      },
      {
        id: 'rohan', displayName: 'Rohan', accent: 'IN', gender: 'm',
        suggestedVoice: { voiceId: 'zgqefOY5FPQ3bB7OZTVR', name: 'Niraj', note: 'ElevenLabs · Indian-English male, mid-career consultant — composed under pressure' },
      },
    ],
    script: [
      { speakerId: 'clara', approxStartSec:   0, text: 'Rohan, before we get into the slides — the dashboard I saw yesterday was mostly empty. What are we seeing?' },
      { speakerId: 'rohan', approxStartSec:  10, text: 'Thanks, Clara. What we\'re seeing is a feed issue on the carrier side. Two of your top-five carriers are still sending us the legacy status file, not the EDI two-fourteen we specced. The TMS can\'t surface what it isn\'t being fed.' },
      { speakerId: 'clara', approxStartSec:  30, text: 'So we have a visibility gap three weeks from go-live.' },
      { speakerId: 'rohan', approxStartSec:  37, text: 'Correct. If the EDI feeds had been stable from day one, we\'d already be running live shipments through the control tower. We\'re not.' },
      { speakerId: 'clara', approxStartSec:  54, text: 'I\'m not loving that. The whole pitch to my CEO was real-time visibility.' },
      { speakerId: 'rohan', approxStartSec:  63, text: 'I know. But the money story hasn\'t changed. Freight procurement, rate shopping and load tendering are tying in cleanly to the TMS. Those three modules alone cover the savings you promised the CFO.' },
      { speakerId: 'clara', approxStartSec:  84, text: 'So you\'re saying we go live on the money modules and leave visibility for later?' },
      { speakerId: 'rohan', approxStartSec:  94, text: 'Yes. Cutover on the three savings modules in Q1 as planned. We keep your current tracking portal as a fallback for the two carriers that haven\'t caught up. Then we roll out visibility in Q2 once the EDI two-fourteen feeds are clean across all five carriers.' },
      { speakerId: 'clara', approxStartSec: 120, text: 'Warehouse operations is going to say we\'re launching half a TMS.' },
      { speakerId: 'rohan', approxStartSec: 129, text: 'They\'ll push back on it, yes. But their dock scheduling module isn\'t in phase one anyway — nothing changes for them day one. We can walk it back to them with a roadmap.' },
      { speakerId: 'clara', approxStartSec: 146, text: 'Fine. And when does visibility realistically land?' },
      { speakerId: 'rohan', approxStartSec: 154, text: 'End of May if the carriers hit their new feed targets. We\'ve got a hard dependency on two of them, so I won\'t promise earlier. I\'d rather commit to May and over-deliver than miss April twice.' },
      { speakerId: 'clara', approxStartSec: 175, text: 'Fair. Can I see the modules in scope for phase one in a one-page view by Thursday? I want to walk it to the exec team on Friday.' },
      { speakerId: 'rohan', approxStartSec: 188, text: 'You\'ll have it by end of Wednesday. I\'ll flag the carriers that still need the new feed, in case your procurement team wants to put pressure on them.' },
      { speakerId: 'clara', approxStartSec: 200, text: 'Do that. And Rohan — I\'m not loving the news, but I\'m glad we\'re having this conversation now and not in late Q1.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'A Transport Management System (TMS) is the software a logistics team uses to buy, tender, track and audit every shipment. Today you\'ll hear a consultant tell his client that the visibility part of the launch won\'t make it on time — and propose a way to go live anyway.',
      hookEmoji: '🧭',
      openQuestions: [
        { id: 'li1', prompt: 'In your industry, what\'s the biggest gap between "the tool works in the demo" and "the tool works in production"?' },
        { id: 'li2', prompt: 'Have you ever launched a system where only part of the features were ready on day one? How did you explain it to users?' },
        { id: 'li3', prompt: 'Which is worse: a late launch with every feature, or an on-time launch with core features only?', hint: 'Usually depends on what the CFO measures you against.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'Eight chunks that any B1+ speaker working on a SaaS rollout — TMS, WMS, ERP, you name it — will hear and need to use.',
      items: [
        { id: 'v1', word: 'go-live / to go live',     pos: 'phrase',       translation: 'El día en que un sistema entra en producción. También verbo: salir en vivo, pasar a producción.', example: 'Go-live is scheduled for the first Monday of Q1.',               definition: 'the day a system first runs in production' },
        { id: 'v2', word: 'cutover',                   pos: 'noun',        translation: 'El cambio planificado del sistema viejo al nuevo en una fecha específica.',                        example: 'Cutover on the three savings modules in Q1.',                     definition: 'the planned switch from an old system to a new one' },
        { id: 'v3', word: 'an EDI feed',               pos: 'noun',        translation: 'Un flujo de datos automatizado entre dos sistemas (típico con carriers y proveedores).',           example: 'The EDI feeds had been stable from day one.',                     definition: 'an automated data feed between two business systems' },
        { id: 'v4', word: 'a workaround',              pos: 'noun',        translation: 'Un arreglo temporal mientras se resuelve la causa real.',                                           example: 'The legacy status file is the workaround for now.',                definition: 'a temporary fix while the real issue is being solved' },
        { id: 'v5', word: 'to roll (sth) out',         pos: 'phrasal-verb',translation: 'Lanzar algo por etapas, de a poco (por región, por módulo, por usuario).',                        example: 'We roll out visibility in Q2.',                                   definition: 'to launch something in a planned, phased way' },
        { id: 'v6', word: 'to tie in (to sth)',        pos: 'phrasal-verb',translation: 'Conectarse / integrarse con otro sistema (datos, flujo de trabajo).',                              example: 'Those three modules are tying in cleanly to the TMS.',             definition: 'to connect or integrate with another system' },
        { id: 'v7', word: 'a fallback',                pos: 'noun',        translation: 'Un plan B que entra en juego si el primario falla o no está listo.',                                example: 'Keep your current tracking portal as a fallback.',                 definition: 'a backup plan if the primary option doesn\'t work' },
        { id: 'v8', word: 'a hard dependency (on sth)',pos: 'noun',        translation: 'Algo que SÍ o SÍ tiene que pasar primero. Sin margen.',                                             example: 'We\'ve got a hard dependency on two of them.',                     definition: 'something that absolutely has to happen first — no flex' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"Those three modules are tying in cleanly to the TMS" means the modules are…',
          options: [
            { id: 'a', text: 'crashing the TMS' },
            { id: 'b', text: 'integrating with the TMS without problems' },
            { id: 'c', text: 'being removed from the TMS' },
          ],
          correct: 'b',
          explain: '"Tie in (to) X" = connect / integrate with X. "Cleanly" says the integration is going well.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"The legacy status file is the workaround for now" means it\'s…',
          options: [
            { id: 'a', text: 'a temporary fix while the real feed is being built' },
            { id: 'b', text: 'the new, final solution' },
            { id: 'c', text: 'a cancelled feature' },
          ],
          correct: 'a',
          explain: '"A workaround" = a temporary fix. Compare "a fix" (permanent) vs. "a workaround" (bridging).',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"We\'ve got a hard dependency on two of them" means the project…',
          options: [
            { id: 'a', text: 'can skip those two carriers if needed' },
            { id: 'b', text: 'is slightly easier because of those two' },
            { id: 'c', text: 'cannot move forward until those two deliver' },
          ],
          correct: 'c',
          explain: 'A "hard" dependency is non-negotiable — the other thing has to happen first.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Rohan is three weeks from go-live and the visibility dashboards are empty. Guess how the conversation goes.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How will Rohan frame the problem to Clara?',
          options: [
            { id: 'a', text: 'Hide it until go-live' },
            { id: 'b', text: 'Blame Clara\'s team' },
            { id: 'c', text: 'Be direct about the gap and propose an alternative' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will Clara most likely do?',
          options: [
            { id: 'a', text: 'Ask tough questions but look for a compromise' },
            { id: 'b', text: 'Cancel the implementation' },
            { id: 'c', text: 'Agree to every proposal without pushback' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What will Rohan\'s proposal probably look like?',
          options: [
            { id: 'a', text: 'Delay the whole TMS by six months' },
            { id: 'b', text: 'Go live on the modules that are ready and defer visibility to Q2' },
            { id: 'c', text: 'Switch to a different TMS vendor' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE without pausing. Catch the big picture.',
      listenFor: [
        'What exactly is broken',
        'Rohan\'s core proposal',
        'What Clara commits to by the end',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is Rohan\'s core proposal?',
          options: [
            { id: 'a', text: 'Delay the whole go-live until the EDI feeds are fixed' },
            { id: 'b', text: 'Cancel the visibility module and drop it from the contract' },
            { id: 'c', text: 'Go live on the three savings modules in Q1, defer visibility to Q2' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Clara commit to by the end of the call?',
          options: [
            { id: 'a', text: 'Walking the phase-one scope to her exec team on Friday' },
            { id: 'b', text: 'Signing off on the EDI changes herself' },
            { id: 'c', text: 'Replacing the two slow carriers immediately' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Clara is pleased with the update.',
          correct: 'F',
          explain: 'She says "I\'m not loving the news" — but she accepts it.',
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
          sentence: 'Two of Clara\'s top-___ carriers are still sending the legacy status file.',
          answers:  ['five'],
          alts:     [['5']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What file format are those two carriers supposed to be sending?',
          options: [
            { id: 'a', text: 'A weekly PDF report' },
            { id: 'b', text: 'An EDI 214 status update' },
            { id: 'c', text: 'A quarterly spreadsheet' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd3',
          sentence: 'If the EDI feeds had been stable, the team would already be running live shipments through the ___ ___.',
          answers:  ['control', 'tower'],
          alts:     [['control'], ['tower']],
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'Which three modules does Rohan say are tying in cleanly?',
          options: [
            { id: 'a', text: 'Visibility, dock scheduling and freight audit' },
            { id: 'b', text: 'Freight procurement, rate shopping and load tendering' },
            { id: 'c', text: 'Billing, HR and CRM' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What is Rohan\'s proposed fallback for the two slow carriers?',
          options: [
            { id: 'a', text: 'Drop them from the carrier list' },
            { id: 'b', text: 'Keep the current tracking portal running' },
            { id: 'c', text: 'Pay them more to speed things up' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'Why does Clara think warehouse ops will push back?',
          options: [
            { id: 'a', text: 'They think the launch looks like "half a TMS"' },
            { id: 'b', text: 'Their dock scheduling module changes on day one' },
            { id: 'c', text: 'They haven\'t been trained yet' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'Rohan will deliver the one-page scope by end of ___. Clara wants to walk it to exec on ___.',
          answers:  ['Wednesday', 'Friday'],
          alts:     [['wednesday'], ['friday']],
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Rohan commits to a full visibility launch by end of April.',
          correct: 'F',
          explain: 'He says "end of May if the carriers hit their new feed targets", and explicitly refuses to promise earlier.',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B1+ chunks that make this sound like a real client meeting, not a textbook.',
      chunks: [
        {
          id:       'c1',
          chunk:    'What we\'re seeing is…',
          category: 'discourse-marker',
          gloss:    'Lo que estamos viendo es… — cleft opener para enmarcar un problema',
          example:  '"What we\'re seeing is a feed issue on the carrier side."',
          notice:   'A cleft-emphasis opener. It buys you a half-second to frame bad news precisely. Compare: "The problem is…" (blunt), "Honestly…" (hedge), "What we\'re seeing is…" (analytical / professional).',
        },
        {
          id:       'c2',
          chunk:    'If X had been Y, we\'d already be Z',
          category: 'grammar-pattern',
          gloss:    'Condicional mixto: pasado irreal → presente irreal',
          example:  '"If the EDI feeds had been stable from day one, we\'d already be running live shipments."',
          notice:   'Past perfect in the if-clause + "would + be + -ing" in the main clause. Lets you say "a different past would have given us a different present" — classic post-mortem language.',
        },
        {
          id:       'c3',
          chunk:    'a hard dependency on + noun',
          category: 'collocation',
          gloss:    'Una dependencia dura — algo que sí o sí tiene que pasar primero',
          example:  '"We\'ve got a hard dependency on two of them."',
          notice:   'Signals "no workaround, no flex". The opposite is "a soft dependency" (nice to have in place first). Use it to protect dates: "we can\'t commit a date, we have a hard dependency on…".',
        },
        {
          id:       'c4',
          chunk:    'to walk (something) back to (someone)',
          category: 'phrase',
          gloss:    'Llevar algo de vuelta / presentar algo cara a cara al stakeholder',
          example:  '"We can walk it back to them with a roadmap."',
          notice:   'Always "walk X back to Y" — Y is the person upstream (warehouse ops, CEO, CFO). Signals an owned, face-to-face handover of information, not a cold email.',
        },
        {
          id:       'c5',
          chunk:    'I\'m not loving + noun / -ing',
          category: 'register',
          gloss:    'No me encanta… — insatisfacción suavizada pero clara',
          example:  '"I\'m not loving the news, but I\'m glad we\'re having this conversation."',
          notice:   'B1+ hedged disapproval. Softer than "I don\'t like" and more mature than "I hate". A senior stakeholder\'s way of saying "I disagree" without burning the room down.',
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
          sentence: '"What ___ ___ seeing is a data freshness issue — the dashboards lag by six hours."',
          answers:  ['we\'re'],
          hint:     'Cleft opener. Contraction of "we are".',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses the mixed conditional correctly?',
          options: [
            { id: 'a', text: 'If the carriers had sent the feed on time, we\'ll already be live.' },
            { id: 'b', text: 'If the carriers had sent the feed on time, we\'d already be live.' },
            { id: 'c', text: 'If the carriers sent the feed on time, we\'d already been live.' },
          ],
          correct: 'b',
          explain: '"If + past perfect, would + verb" lets a past change map to a present result.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"The visibility module has a ___ ___ on carrier EDI — nothing we can do about that from our side."',
          answers:  ['hard', 'dependency'],
          hint:     'Non-negotiable prerequisite.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: '"I\'m not loving the timeline" is used to…',
          options: [
            { id: 'a', text: 'reject the timeline angrily' },
            { id: 'b', text: 'politely signal disagreement with it' },
            { id: 'c', text: 'celebrate the timeline' },
          ],
          correct: 'b',
          explain: 'Softened disapproval — mature, direct, not aggressive.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"I\'ll ___ the proposal ___ to my VP of operations before we book another sync."',
          answers:  ['walk', 'back'],
          hint:     'Present it in person to someone upstream.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You\'re the consultant. A SaaS or systems rollout you own (TMS, WMS, ERP, CRM, procurement tool — pick one you know) is going to go live partial. Record 90 seconds giving your client the honest version and a plan.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) a one-line "What we\'re seeing is…" opener, (2) a "if X had been Y, we\'d already be Z" sentence to describe the gap, (3) the modules you\'ll cutover on time, (4) the fallback for what isn\'t ready, (5) when the missing piece will realistically land. Use at least 3 of: "What we\'re seeing is…", "If X had been Y, we\'d already be Z", "a hard dependency on", "walk it back to", "I\'m not loving…".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
