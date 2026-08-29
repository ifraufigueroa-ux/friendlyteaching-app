// FriendlyTeaching.cl — OACI Vocabulary · Class 1
//
// Aircraft & Systems — vocabulario de partes y sistemas del avión con
// foco en auto-reporte de fallas por parte del piloto. Nivel OACI 4
// (equivalente CEFR ~B2). Formato CLT clásico:
//   Pre-task (activation) → Vocab presentation → Listening (radio
//   exchange) → Comprehension check → Language focus → Controlled
//   practice → Freer speaking → Wrap-up.
//
// El diálogo del listening (segmentos abajo) se manda a ElevenLabs
// multi-voice desde el runner. El MP3 resultante se pega en la slide
// 'radio-exchange' como audioUrl.

import type { Slide } from '@/types/firebase';
import type { OACIVocabularyClass, OACIDialogueSegment } from '../types';

// ─── Radio-exchange script (LAN 445 con Santiago Ground/Tower) ─────
//
// Situación: un A320 en taxi para despegue reporta una indicación de
// hidráulico. Ground lo transfiere a Tower, y el capitán negocia una
// vuelta a puerta. Muestra las 3 fases lingüísticas que la clase mete
// después: (1) reportar una falla, (2) coordinar con ATC, (3) pedir
// una acción no estándar (RTG — return to gate).

const dialogueSegments: OACIDialogueSegment[] = [
  {
    speakerRole: 'pilot-captain',
    speakerLabel: 'Captain — LAN 445',
    text: 'Santiago Ground, LAN four four five, on taxiway Alpha, request short hold, we have a hydraulic caution light.',
  },
  {
    speakerRole: 'atc-ground',
    speakerLabel: 'ATC — Santiago Ground',
    text: 'LAN four four five, Santiago Ground, roger, hold position on Alpha, advise intentions when ready.',
  },
  {
    speakerRole: 'pilot-captain',
    speakerLabel: 'Captain — LAN 445',
    text: 'Holding position on Alpha, LAN four four five. We are running the ECAM checklist. Standby.',
  },
  {
    speakerRole: 'pilot-first-officer',
    speakerLabel: 'First Officer — LAN 445',
    text: 'Ground, LAN four four five, we confirm loss of green hydraulic system. Landing gear and nosewheel steering are affected. We request return to gate for maintenance.',
  },
  {
    speakerRole: 'atc-ground',
    speakerLabel: 'ATC — Santiago Ground',
    text: 'LAN four four five, roger, return to gate approved. Vacate Alpha via taxiway Bravo, contact Ramp on one two one decimal niner.',
  },
  {
    speakerRole: 'pilot-first-officer',
    speakerLabel: 'First Officer — LAN 445',
    text: 'Vacate Alpha via Bravo, contact Ramp on one two one decimal niner, LAN four four five. Thank you for your assistance.',
  },
];

// ─── Slides ──────────────────────────────────────────────────────

const slides: Slide[] = [
  // 1 — Cover
  {
    id: 'cover',
    type: 'cover',
    phase: 'pre',
    title: 'Class 1 — Aircraft & Systems',
    subtitle: 'Parts, systems, and pilot self-reporting to ATC',
    content: 'OACI Preparation Programme · Aviation Vocabulary · Operational Level 4',
  },

  // 2 — Predictions (activation)
  {
    id: 'predictions',
    type: 'predictions',
    phase: 'pre',
    title: 'Before we start',
    prompt: 'A pilot is about to report a technical problem to Air Traffic Control. What words do they need?',
    content: [
      '• Warm-up 1 — Think of 3 aircraft parts you already know in English. Say them out loud.',
      '• Warm-up 2 — In your L1 (Spanish), how would you report an "engine problem" without technical vocabulary? Now imagine explaining it to a controller — what changes?',
      '• Warm-up 3 — Have you ever heard a real ATC transmission? Where? What surprised you about the way pilots and controllers speak?',
    ].join('\n'),
    teacherNotes: 'Elicit 8–10 palabras en el pizarrón. No corrijas todavía si aparecen L1-transfers ("gear"→"tren" es OK acá).',
  },

  // 3 — HTML canvas: labeled aircraft schematic (usa el nuevo html_content)
  {
    id: 'aircraft-diagram',
    type: 'html_content',
    phase: 'pre',
    title: 'Aircraft anatomy — at a glance',
    subtitle: 'Point to each part as you say it. Repeat 2× before moving on.',
    htmlContent: `
      <div class="mx-auto max-w-3xl">
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="rounded-2xl border-2 border-[#5A3D7A] bg-[#F0E5FF] p-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">Structure</p>
            <ul class="mt-2 space-y-1 text-sm text-[#2D1B4E]">
              <li><strong>Fuselage</strong> — main body of the aircraft</li>
              <li><strong>Wing</strong> — provides lift</li>
              <li><strong>Empennage</strong> — tail assembly</li>
              <li><strong>Landing gear</strong> — wheels & struts</li>
            </ul>
          </div>
          <div class="rounded-2xl border-2 border-[#5A3D7A] bg-[#F0E5FF] p-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">Control surfaces</p>
            <ul class="mt-2 space-y-1 text-sm text-[#2D1B4E]">
              <li><strong>Ailerons</strong> — roll (wing tips)</li>
              <li><strong>Elevator</strong> — pitch (tail)</li>
              <li><strong>Rudder</strong> — yaw (vertical tail)</li>
              <li><strong>Flaps &amp; slats</strong> — lift on take-off / landing</li>
            </ul>
          </div>
          <div class="rounded-2xl border-2 border-[#9B7CB8] bg-white p-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Powerplant</p>
            <ul class="mt-2 space-y-1 text-sm text-[#2D1B4E]">
              <li><strong>Engine</strong> (or <em>powerplant</em>)</li>
              <li><strong>Thrust reversers</strong> — decelerate after landing</li>
              <li><strong>APU</strong> — Auxiliary Power Unit</li>
            </ul>
          </div>
          <div class="rounded-2xl border-2 border-[#9B7CB8] bg-white p-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Critical systems</p>
            <ul class="mt-2 space-y-1 text-sm text-[#2D1B4E]">
              <li><strong>Hydraulic system</strong> — moves gear &amp; controls</li>
              <li><strong>Pneumatic system</strong> — bleed air, pressurization</li>
              <li><strong>Electrical system</strong> — generators, batteries</li>
              <li><strong>Avionics</strong> — nav &amp; comm equipment</li>
            </ul>
          </div>
        </div>
        <div class="rounded-xl bg-[#FFF5C8] border border-[#FFE070] p-3 text-xs text-[#5A4500]">
          <strong>Pilot tip:</strong> ATC doesn't need the exact system name if you use the right verb.
          "We have a <em>hydraulic caution light</em>" is enough for a controller to start planning.
        </div>
      </div>
    `,
  },

  // 4 — Vocab match (10 core terms with translations + phonetics)
  {
    id: 'vocab-match',
    type: 'vocab_match',
    phase: 'while',
    title: 'Key Vocabulary — Aircraft & Systems',
    words: [
      { word: 'fuselage',        translation: 'Fuselaje — cuerpo principal del avión',              pronunciation: '/ˈfjuː.zə.lɑːʒ/' },
      { word: 'landing gear',    translation: 'Tren de aterrizaje',                                 pronunciation: '/ˈlæn.dɪŋ ɡɪər/' },
      { word: 'flaps',           translation: 'Flaps — superficies de hipersustentación',           pronunciation: '/flæps/' },
      { word: 'thrust reversers',translation: 'Reversores de empuje',                               pronunciation: '/θrʌst rɪˈvɜːr.sərz/' },
      { word: 'hydraulic system',translation: 'Sistema hidráulico',                                 pronunciation: '/haɪˈdrɔː.lɪk ˈsɪs.təm/' },
      { word: 'caution light',   translation: 'Luz de precaución (amber, no critical)',             pronunciation: '/ˈkɔː.ʃən laɪt/' },
      { word: 'warning light',   translation: 'Luz de advertencia (red, critical)',                 pronunciation: '/ˈwɔːr.nɪŋ laɪt/' },
      { word: 'APU',             translation: 'Auxiliary Power Unit — grupo auxiliar de energía',   pronunciation: '/ˌeɪ pi ˈjuː/' },
      { word: 'ECAM',            translation: 'Electronic Centralised Aircraft Monitor (Airbus)',   pronunciation: '/ˈiː.kæm/' },
      { word: 'transponder',     translation: 'Transpondedor — squawk code',                        pronunciation: '/trænˈspɒn.dər/' },
    ],
  },

  // 5 — Language focus: verbs & collocations for self-reporting
  {
    id: 'language-focus',
    type: 'language_focus',
    phase: 'while',
    title: 'Language Focus — Reporting a technical issue',
    content: [
      'When a pilot reports a problem, they follow a fixed pattern that ATC can process fast:',
      '',
      '• We have a [system] [issue]  → "We have a hydraulic caution light."',
      '• We are experiencing [problem]  → "We are experiencing engine vibration."',
      '• We confirm [status]  → "We confirm loss of green hydraulic system."',
      '• We request [action]  → "We request return to gate for maintenance."',
      '',
      'Keep it short. Keep it factual. State the system, then the action.',
    ].join('\n'),
    words: [
      { word: 'We have a caution light on the hydraulic system.', translation: 'Verb: HAVE',           example: 'Neutral, factual — for amber alerts.' },
      { word: 'We are experiencing engine vibration.',            translation: 'Verb: BE EXPERIENCING', example: 'For ongoing / evolving conditions.' },
      { word: 'We confirm loss of green hydraulic system.',       translation: 'Verb: CONFIRM',         example: 'After checklist — final assessment.' },
      { word: 'We request return to gate for maintenance.',       translation: 'Verb: REQUEST',         example: 'Ask for a non-standard action.' },
    ],
  },

  // 6 — Listening: radio exchange (audio se genera desde el runner)
  {
    id: 'radio-exchange',
    type: 'listening',
    phase: 'while',
    title: 'Radio Exchange — LAN 445 with Santiago',
    subtitle: 'Listen twice. First for the general problem, then for the sequence of actions.',
    content: dialogueSegments
      .map(s => `${s.speakerLabel}\n"${s.text}"`)
      .join('\n\n'),
    // audioUrl se pega desde el runner tras generar el diálogo con
    // ElevenLabs (endpoint /api/tts/elevenlabs-dialogue). Vacío por
    // default para que la clase renderee incluso sin audio generado.
    audioUrl: '',
    teacherNotes: 'Después del segundo pass, pedí al alumno que resuma la secuencia en 3 pasos.',
  },

  // 7 — Comprehension quiz
  {
    id: 'listening-quiz',
    type: 'listening_quiz',
    phase: 'while',
    title: 'Comprehension Check',
    questions: [
      {
        question: 'What is the initial problem the captain reports?',
        options: [
          { id: 'a', text: 'Engine failure',                          isCorrect: false },
          { id: 'b', text: 'Hydraulic caution light',                 isCorrect: true  },
          { id: 'c', text: 'Cabin decompression',                     isCorrect: false },
          { id: 'd', text: 'Bird strike on the fuselage',             isCorrect: false },
        ],
        correctAnswer: 'Hydraulic caution light',
      },
      {
        question: 'What does the first officer confirm AFTER running the ECAM?',
        options: [
          { id: 'a', text: 'Loss of the green hydraulic system',      isCorrect: true  },
          { id: 'b', text: 'A fuel imbalance',                        isCorrect: false },
          { id: 'c', text: 'Electrical generator failure',            isCorrect: false },
          { id: 'd', text: 'A flap asymmetry',                        isCorrect: false },
        ],
        correctAnswer: 'Loss of the green hydraulic system',
      },
      {
        question: 'What action does the crew request?',
        options: [
          { id: 'a', text: 'Immediate take-off with restrictions',    isCorrect: false },
          { id: 'b', text: 'Priority departure ahead of others',      isCorrect: false },
          { id: 'c', text: 'Return to gate for maintenance',          isCorrect: true  },
          { id: 'd', text: 'Diversion to the nearest airport',        isCorrect: false },
        ],
        correctAnswer: 'Return to gate for maintenance',
      },
      {
        question: 'Which frequency should the crew contact next?',
        options: [
          { id: 'a', text: '121.5 (guard)',                           isCorrect: false },
          { id: 'b', text: '121.9 (Ramp)',                            isCorrect: true  },
          { id: 'c', text: '122.9 (Ground)',                          isCorrect: false },
          { id: 'd', text: '119.7 (Tower)',                           isCorrect: false },
        ],
        correctAnswer: '121.9 (Ramp)',
      },
    ],
  },

  // 8 — Language practice (controlled): unscramble + verb form
  {
    id: 'controlled-practice',
    type: 'language_practice',
    phase: 'post',
    title: 'Controlled Practice — Build the radio call',
    practiceItems: [
      {
        type: 'unscramble',
        prompt: 'have / caution / a / on / we / light / system / the / hydraulic',
        answer: 'we have a caution light on the hydraulic system',
        grammarTopic: 'HAVE + [system] + [issue]',
      },
      {
        type: 'match_halves',
        prompt: 'We are experiencing',
        answer: 'engine vibration on number two.',
        options: [
          'engine vibration on number two.',
          'to the gate for maintenance.',
          'the green hydraulic system.',
          'a caution light on the panel.',
        ],
        grammarTopic: 'BE EXPERIENCING + [ongoing condition]',
      },
      {
        type: 'verb_form',
        prompt: 'Ground, LAN four four five, we {{blank}} return to gate for maintenance.',
        answer: 'request',
        options: ['request', 'requested', 'requesting', 'requests'],
        grammarTopic: 'Pilot self-report — imperative-like present',
      },
      {
        type: 'error_correction',
        prompt: 'Rewrite the pilot report correctly.',
        wrongText: 'We are have a hydraulic problem and we request to returning to gate.',
        answer: 'We have a hydraulic problem and we request to return to gate.',
        grammarTopic: 'HAVE vs. BE + verb agreement',
      },
    ],
  },

  // 9 — Speaking task (freer)
  {
    id: 'speaking-task',
    type: 'speaking',
    phase: 'post',
    title: 'Your turn — self-report to ATC',
    prompt: [
      'Imagine you are the captain of flight FriendlyAir 220, taxiing at Santiago (SCEL).',
      'Your first officer reports: "Flap asymmetry warning on the ECAM." You want to hold position and run the checklist.',
      '',
      'Record a radio call to Santiago Ground that:',
      '  1. Identifies your aircraft and current position.',
      '  2. Reports the issue using the pattern from Language Focus.',
      '  3. Requests a short hold.',
      '',
      'Keep it under 20 seconds. Be factual, not dramatic.',
    ].join('\n'),
    teacherNotes: 'Grabar y luego escuchar juntos. Checklist de feedback: (1) identificación al inicio, (2) verbo correcto, (3) request explícito.',
  },

  // 10 — Wrap-up
  {
    id: 'wrapup',
    type: 'wrapup',
    phase: 'post',
    title: 'Wrap-up',
    content: [
      'Today you built the vocabulary and pattern to:',
      '  • Name aircraft structure, control surfaces, powerplant, and critical systems.',
      '  • Report a technical issue to ATC in the three canonical patterns (HAVE / BE EXPERIENCING / CONFIRM).',
      '  • Request a non-standard action (return to gate, priority handling).',
      '',
      'Next class → Airport & Ground Operations (taxi, hold short, pushback, jetway).',
    ].join('\n'),
    teacherNotes: 'Homework: escribir 3 radio calls propias reportando fallas diferentes (engine / electrical / pressurization).',
  },
];

export const ICAO_VOCAB_CLASS_1: OACIVocabularyClass = {
  id:              'vocab-class-1-aircraft-parts',
  classNumber:     1,
  title:           'Aircraft & Systems',
  subtitle:        'Parts, systems, and pilot self-reporting to ATC',
  targetOaciLevel: 4,
  cefrEquivalent:  'B2',
  durationMinutes: 60,
  focus:           'Nombrar partes/sistemas y auto-reportar una falla al ATC con los tres patrones canónicos (HAVE / BE EXPERIENCING / CONFIRM).',
  radialContext:   'Taxi con anomalía técnica — coordinar hold, checklist, y return-to-gate con Ground/Tower.',
  slides,
  dialogueSegments,
};
