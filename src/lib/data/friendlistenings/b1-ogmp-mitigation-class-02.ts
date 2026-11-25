// Friendlistenings® — B1 · OGMP 2.0 for electrical engineers
// Class 2 of a scaffolded series: mitigation strategies, flaring &
// vent recovery during pipeline maintenance.
//
// Audience: B1 electrical engineer working on gas-transport projects
// who needs the English to sit in OGMP-aligned O&M meetings. The
// vocabulary is heavy for B1, so this lesson is slow-paced: the 8 key
// concepts are front-loaded in Vocab, re-surfaced in the audio, pinned
// again in Language Awareness, and drilled in Controlled Practice.
//
// Audio speed: the player offers 0.75× / 0.85× / 1×. The lead-in tells
// the student to start at 0.85× (closest to the teacher-requested
// 0.80× pacing) for the first pass and move up once comprehension is
// comfortable.
//
// 8-step arc, ~50-minute slot:
//   1. Lead-in     · 4 min — environmental-engineering schema +
//                              speed-pill reminder
//   2. Vocab       · 10 min — all 8 target concepts (vent recovery,
//                              seals, purging & venting, blowdowns,
//                              mobile compressors, portable flares,
//                              DRE, baseline year) + 3 checks
//   3. Prediction  · 3 min — what will they choose: recompression or
//                              flare?
//   4. Gist        · 6 min — the operational decision
//   5. Detail      · 10 min — thresholds, percentages, dates, DRE
//   6. Awareness   · 7 min — 5 meeting chunks for OGMP-style reporting
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 7 min — 90-sec post-meeting status update
//
// Voice cast chosen off the non-saturated whitelist (feedback memory
// 2026-11-12) and off-cycle from recent Friendlistenings:
//   · Thibault — technical lead, male. Antoni voice.
//   · Marion   — environmental engineer, female. Rachel voice.

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1OgmpMitigationClass02: FLLesson = {
  id:           'b1-ogmp-mitigation-class-02',
  title:        'OGMP 2.0 · Class 2 · Mitigation, flaring & vent recovery',
  subtitle:     'Methane mitigation in gas transport — scaffolded B1 English for engineers',
  level:        'B1',
  topic:        'OGMP 2.0 mitigation · vent recovery · mobile flaring · O&M meetings',
  scenario:     'Thibault, the technical lead on pipeline O&M, calls Marion, the environmental engineer, to agree on how to handle emissions during a scheduled maintenance stop on a compressor station. They walk through vent recovery, mobile compressors, portable flares, DRE, and progress against the 2023 baseline — the exact vocabulary the student needs for her own OGMP reporting meetings.',
  estimatedMin: 50,
  tags:         ['business', 'engineering', 'ogmp', 'methane', 'conditionals', 'comparatives'],
  createdAt:    '2026-11-25',

  cover: {
    accent: '#16a34a',
    emoji:  '🛠️',
  },

  audio: {
    // ~3:00 continuous dialogue stitching the three mini-scenes from
    // the source lesson (2A vent recovery + 2B thresholds / DRE +
    // 2C equipment Q&A) into one meeting.
    durationSec: 195,
    speakers: [
      {
        id: 'thibault', displayName: 'Thibault', accent: 'EU', gender: 'm',
        suggestedVoice: { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', note: 'ElevenLabs · warm male US (reads as a calm, experienced O&M technical lead; European accent is fine to imply via the character context)' },
      },
      {
        id: 'marion', displayName: 'Marion', accent: 'EU', gender: 'f',
        suggestedVoice: { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', note: 'ElevenLabs · calm female US (reads as an environmental engineer running numbers, measured and precise)' },
      },
    ],
    script: [
      { speakerId: 'thibault', approxStartSec:   0, text: 'Marion, quick one on the maintenance stop next month. Can you walk me through the mitigation plan for that compressor station?' },
      { speakerId: 'marion',   approxStartSec:   8, text: 'Sure. The core idea is the same as our multi-year program — cut emissions at the station by focusing on vent recovery, seals, and the maintenance stops themselves. When we can recompress the gas on site, we do. When we cannot, we bring in a mobile unit.' },
      { speakerId: 'thibault', approxStartSec:  28, text: 'And if the mobile compressor is not available that week? We had that problem last quarter.' },
      { speakerId: 'marion',   approxStartSec:  36, text: 'Then we use a portable flare. The point is to avoid venting directly to the atmosphere. Our rule of thumb is simple: if the volume is above our recompression threshold, we recover it. If it is below, we flare the rest.' },
      { speakerId: 'thibault', approxStartSec:  53, text: 'What threshold are you using now?' },
      { speakerId: 'marion',   approxStartSec:  57, text: 'Roughly five hundred cubic metres, but it depends on the section. For blowdowns below that, the mobile flare is more practical. And the good news is the high-efficiency flare we bought this year reaches a ninety-eight percent destruction and removal efficiency, so even the flared portion barely contributes to our methane number.' },
      { speakerId: 'thibault', approxStartSec:  80, text: 'Ninety-eight percent DRE — that is on paper, or do we have field data?' },
      { speakerId: 'marion',   approxStartSec:  88, text: 'Vendor data for now. We are running our own measurements on the next two stops to confirm. If the field numbers come in above ninety-five percent, we are comfortable using it as our default option.' },
      { speakerId: 'thibault', approxStartSec: 103, text: 'Good. And where does all of this put us against our 2023 baseline? The leadership team is asking.' },
      { speakerId: 'marion',   approxStartSec: 113, text: 'Compared to the 2023 baseline, purging and venting emissions on this network are already down about fifty percent. If we keep the orifice-plate replacement programme on track and the mobile fleet stays available, we are on track to hit the 2030 target without pulling in additional capex.' },
      { speakerId: 'thibault', approxStartSec: 133, text: 'One operational limitation I want flagged in the slide pack — mobile unit availability. Last winter we had two stations waiting on the same flare for three weeks.' },
      { speakerId: 'marion',   approxStartSec: 146, text: 'Agreed. I will add a line on logistics and equipment availability as a key risk. If we can book the units six months out, we avoid the queue.' },
      { speakerId: 'thibault', approxStartSec: 160, text: 'Perfect. Send me the updated matrix by Friday and I will walk it to the ops director on Monday.' },
      { speakerId: 'marion',   approxStartSec: 171, text: 'You will have it by Thursday. Anything specific you want called out for the director?' },
      { speakerId: 'thibault', approxStartSec: 180, text: 'The DRE field number, the fifty-percent reduction against 2023, and the availability risk. That is the story.' },
      { speakerId: 'marion',   approxStartSec: 189, text: 'Noted. Talk Thursday.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Today you join a short O&M meeting where two engineers decide how to handle methane emissions during a scheduled maintenance stop. The vocabulary is heavy — set the player to 0.85× for the first pass, then try 1× once the ideas feel solid. Every concept in the audio is unpacked in the Vocab section below first.',
      hookEmoji: '🛠️',
      openQuestions: [
        { id: 'li1', prompt: 'In your own words, why do emissions happen during pipeline maintenance stops? What are operators trying to do with that gas?' },
        { id: 'li2', prompt: 'Have you worked on a project where equipment availability was the real limitation, not the technology? What did the team do?' },
        { id: 'li3', prompt: 'When your company reports emissions reductions, what baseline year does it compare against? Why that year?', hint: 'The baseline year is usually the reference point for every "down X %" claim.' },
      ],
    },

    // ─── Step 2 · Vocab (the 8 key concepts) ─────────────────
    {
      kind:  'vocab',
      title: 'The 8 concepts for this class',
      intro: 'Read these once before the audio. Each one appears explicitly in the dialogue. This is the complete OGMP mitigation vocabulary set for Class 2 — no new words in the exercises below.',
      items: [
        { id: 'v1', word: 'vent recovery',                      pos: 'noun', translation: 'Recuperación de venteos — capturar el gas que, de otro modo, se liberaría a la atmósfera.',                                 example: 'Our program focuses on vent recovery, seals, and maintenance stops.',                                definition: 'capturing gas that would otherwise be vented directly to the atmosphere' },
        { id: 'v2', word: 'seals',                              pos: 'noun', translation: 'Sellos — en compresores, los sellos mecánicos cuya fuga es una fuente clave de metano.',                                   example: 'We cut emissions at the compressor station by focusing on seals.',                                   definition: 'mechanical parts that stop gas leaks around rotating shafts' },
        { id: 'v3', word: 'purging and venting',                pos: 'noun', translation: 'Purgado y venteo — vaciar un tramo de ducto / equipo antes del mantenimiento; una fuente típica de emisiones.',           example: 'Purging and venting emissions are down about fifty percent.',                                      definition: 'emptying a pipeline section / equipment before maintenance, a common source of methane' },
        { id: 'v4', word: 'a blowdown',                         pos: 'noun', translation: 'Un blowdown — la liberación controlada del gas de un ducto o equipo antes de intervenirlo.',                                example: 'For blowdowns below that threshold, the mobile flare is more practical.',                          definition: 'the controlled release of gas from a line or vessel before work' },
        { id: 'v5', word: 'a mobile compressor / recompression unit', pos: 'noun', translation: 'Compresor móvil / unidad de recompresión — equipo que recomprime el gas en sitio para reinyectarlo en vez de ventearlo.', example: 'When we cannot recompress on site, we bring in a mobile unit.',                                   definition: 'portable equipment that recompresses gas on site so it can be returned to the pipeline' },
        { id: 'v6', word: 'a portable / mobile flare',          pos: 'noun', translation: 'Antorcha portátil — quema el gas en sitio en vez de liberarlo; se usa cuando no se puede recomprimir.',                    example: 'If the mobile compressor is not available, we use a portable flare.',                               definition: 'a movable combustion unit that burns off gas safely instead of venting it' },
        { id: 'v7', word: 'DRE (destruction and removal efficiency)', pos: 'noun', translation: 'DRE — porcentaje del metano eliminado por la combustión. Un flare de alta eficiencia alcanza 98%.',                    example: 'The high-efficiency flare reaches a ninety-eight percent destruction and removal efficiency.',    definition: 'the percentage of methane that a flare actually destroys (as opposed to letting slip)' },
        { id: 'v8', word: 'baseline year',                      pos: 'noun', translation: 'Año base — el punto de referencia contra el cual se mide el % de reducción (típicamente 2020 o 2023 en OGMP).',           example: 'Compared to our 2023 baseline, emissions are down about fifty percent.',                            definition: 'the reference year every "down X %" claim compares against' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'Which pair of words best describes capturing gas that would otherwise be released?',
          options: [
            { id: 'a', text: 'vent recovery' },
            { id: 'b', text: 'blowdown' },
            { id: 'c', text: 'seal replacement' },
          ],
          correct: 'a',
          explain: '"Vent recovery" = recovering the vented gas instead of releasing it. "Blowdown" is a type of release.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"Ninety-eight percent DRE" means the flare…',
          options: [
            { id: 'a', text: 'runs for 98% of the year' },
            { id: 'b', text: 'destroys 98% of the methane sent to it' },
            { id: 'c', text: 'captures 98% of the gas for reinjection' },
          ],
          correct: 'b',
          explain: 'DRE = destruction and removal efficiency. It is the percentage the flare actually burns off.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'If your baseline year is 2023 and 2026 emissions are down 50%, your baseline is…',
          options: [
            { id: 'a', text: 'the current year (2026)' },
            { id: 'b', text: 'the reference point you compare against (2023)' },
            { id: 'c', text: 'the target year (2030)' },
          ],
          correct: 'b',
          explain: 'The baseline is the reference year, not the current year or the target year.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Thibault wants to know the mitigation plan for a maintenance stop. Predict what Marion is likely to say.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'If the gas volume is HIGH, what will Marion say they do?',
          options: [
            { id: 'a', text: 'Vent it directly' },
            { id: 'b', text: 'Recompress it with a mobile unit' },
            { id: 'c', text: 'Flare it' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'If the mobile compressor is NOT available, the fallback is…',
          options: [
            { id: 'a', text: 'postpone the maintenance stop' },
            { id: 'b', text: 'vent directly, no mitigation' },
            { id: 'c', text: 'use a portable flare' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What operational limitation is Thibault most likely to flag?',
          options: [
            { id: 'a', text: 'DRE is too low' },
            { id: 'b', text: 'mobile equipment availability / logistics' },
            { id: 'c', text: 'the baseline year is wrong' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen ONCE at 0.85× (no pauses, no transcript). Catch the plan, not the numbers.',
      listenFor: [
        'The rule Marion uses for recompress vs. flare',
        'What she promises Thibault about the DRE number',
        'Where they stand against the 2023 baseline',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is Marion\'s decision rule?',
          options: [
            { id: 'a', text: 'Always recompress, never flare' },
            { id: 'b', text: 'Above the volume threshold → recompress; below → flare' },
            { id: 'c', text: 'Always flare, never recompress' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Marion promise about the 98% DRE claim?',
          options: [
            { id: 'a', text: 'That it is already proven in the field' },
            { id: 'b', text: 'That the vendor will guarantee it in writing' },
            { id: 'c', text: 'That her team is running field measurements on the next two stops to confirm' },
          ],
          correct: 'c',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Marion says they are already on track to hit the 2030 target, as long as the mobile fleet stays available.',
          correct: 'T',
          explain: '"We are on track to hit the 2030 target without pulling in additional capex."',
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
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'The recompression threshold Marion uses is roughly ___ cubic metres.',
          answers:  ['500'],
          alts:     [['five hundred']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What DRE does the new high-efficiency flare reach, per the vendor?',
          options: [
            { id: 'a', text: '85%' },
            { id: 'b', text: '95%' },
            { id: 'c', text: '98%' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What is the minimum field DRE Marion needs to confirm before trusting the flare as the default?',
          options: [
            { id: 'a', text: 'above 90%' },
            { id: 'b', text: 'above 95%' },
            { id: 'c', text: 'exactly 98%' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Compared to the ___ baseline, purging and venting emissions are already down about ___ percent.',
          answers:  ['2023', '50'],
          alts:     [['twenty twenty-three'], ['fifty']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What operational limitation does Thibault want flagged in the slide pack?',
          options: [
            { id: 'a', text: 'DRE below vendor claim' },
            { id: 'b', text: 'mobile unit availability / logistics' },
            { id: 'c', text: 'orifice-plate replacement cost' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Thibault wants the updated mitigation matrix by Monday.',
          correct: 'F',
          explain: 'Marion will deliver it by Thursday, and Thibault walks it to the ops director on Monday.',
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'What three things does Thibault want called out for the ops director?',
          options: [
            { id: 'a', text: 'DRE field number, 50% reduction vs. 2023, availability risk' },
            { id: 'b', text: 'capex, DRE, next vendor shortlist' },
            { id: 'c', text: 'headcount, maintenance schedule, 2030 target' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five meeting-English moves you will reuse every time you sit in an OGMP update, report an emissions number, or flag a risk.',
      chunks: [
        {
          id:       'c1',
          chunk:    'to focus on + noun',
          category: 'collocation',
          gloss:    'Enfocarse en… — presenta la prioridad del programa',
          example:  '"We cut emissions at the compressor station by focusing on vent recovery, seals, and maintenance stops."',
          notice:   'Classic opener for program-level reporting. Compare "we work on" (weaker) or "we deal with" (reactive). "Focus on" says we chose this priority.',
        },
        {
          id:       'c2',
          chunk:    'If the volume is above X, we…; if it is below, we…',
          category: 'grammar-pattern',
          gloss:    'Condicional operativo (first conditional) para reglas de decisión',
          example:  '"If the volume is above our threshold, we recover it. If it is below, we flare the rest."',
          notice:   'First conditional is the standard structure for decision rules in O&M meetings. You can also use "otherwise": "…above the threshold we recover it, otherwise we flare the rest."',
        },
        {
          id:       'c3',
          chunk:    'Compared to our YYYY baseline, X is down about N%',
          category: 'grammar-pattern',
          gloss:    'Patrón estándar para reportar reducción contra año base',
          example:  '"Compared to our 2023 baseline, purging and venting emissions are down about fifty percent."',
          notice:   'Three moves in one sentence: anchor the baseline, name the metric, report the change. Always say "about" or "roughly" unless the number is audited — avoids false precision.',
        },
        {
          id:       'c4',
          chunk:    'to be on track to + verb',
          category: 'collocation',
          gloss:    'Estar encaminado a cumplir una meta',
          example:  '"We are on track to hit the 2030 target without pulling in additional capex."',
          notice:   '"On track" = the current pace is enough to reach the goal. Compare "likely to" (probability), "aiming to" (intention). "On track" is evidence-based.',
        },
        {
          id:       'c5',
          chunk:    'One operational limitation is…',
          category: 'register',
          gloss:    'Señalar un riesgo o restricción sin alarmismo',
          example:  '"One operational limitation with mobile units is equipment availability / logistics."',
          notice:   'Neutral framing: states the issue as a feature of the operation, not as a failure. Good move when you need to raise a risk in front of leadership without sounding like the sky is falling.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the 8 concepts and the 5 meeting chunks in short tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"If the volume is above our recompression ___, we recover it; otherwise, we ___ the rest."',
          answers:  ['threshold', 'flare'],
          hint:     'A number that triggers a rule, and the verb for burning off gas safely.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'The most natural way to report an emissions reduction in a meeting is:',
          options: [
            { id: 'a', text: '"Our methane went down." (too vague)' },
            { id: 'b', text: '"Compared to our 2023 baseline, purging emissions are down about fifty percent."' },
            { id: 'c', text: '"We did a good job on emissions." (too soft)' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"We are ___ ___ to hit the 2030 target as long as the mobile fleet stays available."',
          answers:  ['on', 'track'],
          hint:     'Fixed phrase: paced to meet the goal.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which sentence uses "DRE" correctly?',
          options: [
            { id: 'a', text: 'The DRE of the baseline is 2023.' },
            { id: 'b', text: 'The high-efficiency flare reaches a 98% DRE.' },
            { id: 'c', text: 'The DRE of the mobile compressor is 500 cubic metres.' },
          ],
          correct: 'b',
          explain: 'DRE = destruction and removal efficiency, applied to flares. Not to baselines or to compressors.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"One ___ limitation with the mobile fleet is equipment availability."',
          answers:  ['operational'],
          hint:     'Adjective that frames the issue as part of operations.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You are the environmental engineer. Record a 90-second post-meeting status update (think: follow-up voice note to the ops director) about ONE mitigation measure from today — vent recovery, orifice-plate replacement, or mobile flaring.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) the measure you chose and what it does in one line, (2) the decision rule in "if the volume is above X, we…; if it is below, we…" form, (3) the DRE or expected impact with "about / roughly" so you do not over-claim, (4) where you stand against the 2023 baseline, (5) one operational limitation you want on the risk register. Use at least 3 of: "focus on", first-conditional operating rule, "Compared to our 2023 baseline…", "on track to", "one operational limitation is…".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
