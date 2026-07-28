// FriendlyTeaching.cl — Placement Test Listening Bank
// 6 short clips (30-90s) across A1 → C1. 3 MCQ each. Adaptive at clip level:
// runner starts at the anchor level and walks up/down based on accuracy.
//
// Audios are generated once via ElevenLabs and stored in Firebase Storage
// (see scripts/generate-placement-listening-audios.js). Bindings live in
// Firestore collection `placementListeningAudios` (mirrors the IELTS pattern).

import type { ListeningClip } from '@/types/placement-suite';

export const PLACEMENT_LISTENING: ListeningClip[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // A1 — Ordering breakfast at a small café
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-a1-cafe',
    level:     'A1',
    title:     'At the café',
    scenario:  'A customer orders breakfast at a small café.',
    speakers: [
      { id: 'server',   name: 'Server' },
      { id: 'customer', name: 'Customer' },
    ],
    wordCount: 66,
    script: [
      { speakerId: 'server',   text: 'Good morning! What would you like?' },
      { speakerId: 'customer', text: 'Hi. I want a coffee, please. A big one.' },
      { speakerId: 'server',   text: 'A large coffee. Anything else? We have croissants and toast.' },
      { speakerId: 'customer', text: 'A croissant, please. And a glass of water.' },
      { speakerId: 'server',   text: 'OK. That is four thousand pesos.' },
      { speakerId: 'customer', text: 'Here you are. Thank you.' },
    ],
    questions: [
      {
        id: 'q-a1-1', level: 'A1',
        prompt: 'What does the customer want to drink?',
        options: ['Tea', 'A large coffee', 'A small juice', 'Milk'],
        correct: 1,
      },
      {
        id: 'q-a1-2', level: 'A1',
        prompt: 'What food does the customer order?',
        options: ['Two croissants', 'Toast', 'A croissant', 'Nothing'],
        correct: 2,
      },
      {
        id: 'q-a1-3', level: 'A1',
        prompt: 'How much does it cost?',
        options: ['2,000 pesos', '3,000 pesos', '4,000 pesos', '5,000 pesos'],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // A2 — Directions to the museum
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-a2-directions',
    level:     'A2',
    title:     'Directions to the museum',
    scenario:  'A tourist asks a local for directions.',
    speakers: [
      { id: 'tourist', name: 'Tourist' },
      { id: 'local',   name: 'Local' },
    ],
    wordCount: 104,
    script: [
      { speakerId: 'tourist', text: 'Excuse me, can you help me? I am looking for the National Museum.' },
      { speakerId: 'local',   text: 'Sure. Walk two blocks straight down this street, then turn left at the bakery. The museum is on your right.' },
      { speakerId: 'tourist', text: 'Two blocks straight, then left at the bakery. How long does it take?' },
      { speakerId: 'local',   text: 'About ten minutes on foot. But if you are tired, you can take bus number 7 — it stops right in front of the museum.' },
      { speakerId: 'tourist', text: 'Great. And what time does the museum close today?' },
      { speakerId: 'local',   text: 'It closes at six, but the last entry is at five thirty.' },
    ],
    questions: [
      {
        id: 'q-a2-1', level: 'A2',
        prompt: 'Where does the tourist have to turn left?',
        options: ['At the bank', 'At the bakery', 'At the museum', 'At the bus stop'],
        correct: 1,
      },
      {
        id: 'q-a2-2', level: 'A2',
        prompt: 'Which bus goes to the museum?',
        options: ['Number 5', 'Number 7', 'Number 10', 'None — you must walk'],
        correct: 1,
      },
      {
        id: 'q-a2-3', level: 'A2',
        prompt: 'What is the latest time to enter the museum today?',
        options: ['5:00', '5:30', '6:00', '6:30'],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B1 — Rescheduling a dentist appointment
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-b1-dentist',
    level:     'B1',
    title:     'Rescheduling a dentist appointment',
    scenario:  'A patient calls the dental clinic to move an appointment.',
    speakers: [
      { id: 'receptionist', name: 'Receptionist' },
      { id: 'patient',      name: 'Patient' },
    ],
    wordCount: 140,
    script: [
      { speakerId: 'receptionist', text: 'Good afternoon, Dr. Rojas\' clinic, how can I help you?' },
      { speakerId: 'patient',      text: 'Hi, I have an appointment on Wednesday at four but something has come up at work. I need to move it.' },
      { speakerId: 'receptionist', text: 'No problem. Let me pull up your file. What day would suit you better?' },
      { speakerId: 'patient',      text: 'Ideally later that same week, if possible.' },
      { speakerId: 'receptionist', text: 'I have Friday at eleven in the morning, or Friday at three-thirty in the afternoon.' },
      { speakerId: 'patient',      text: 'The afternoon slot doesn\'t work for me either — I have a meeting until four. Could I do Friday morning?' },
      { speakerId: 'receptionist', text: 'Yes, Friday at eleven is confirmed. I\'ll send you a reminder by text the day before.' },
      { speakerId: 'patient',      text: 'Perfect, thanks a lot.' },
    ],
    questions: [
      {
        id: 'q-b1-1', level: 'B1',
        prompt: 'Why does the patient want to change the appointment?',
        options: [
          'She is not feeling well',
          'Something has come up at work',
          'The clinic called her first',
          'She is out of town on Wednesday',
        ],
        correct: 1,
      },
      {
        id: 'q-b1-2', level: 'B1',
        prompt: 'Why does the patient reject the Friday afternoon slot?',
        options: [
          'She prefers mornings in general',
          'She has a meeting until four',
          'She is out of town',
          'The doctor is not available',
        ],
        correct: 1,
      },
      {
        id: 'q-b1-3', level: 'B1',
        prompt: 'What will the clinic do the day before the new appointment?',
        options: [
          'Call the patient',
          'Send a reminder by text',
          'Send a written letter',
          'Nothing — the patient will call them',
        ],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B1+ — Discussing a shared-flat problem
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-b1plus-flatmates',
    level:     'B1+',
    title:     'Talking to a flatmate',
    scenario:  'Two flatmates discuss a growing issue with the cleaning routine.',
    speakers: [
      { id: 'a', name: 'Ana' },
      { id: 'b', name: 'Ben' },
    ],
    wordCount: 168,
    script: [
      { speakerId: 'a', text: 'Ben, can I talk to you about something? It\'s not a big deal, but it\'s been bothering me.' },
      { speakerId: 'b', text: 'Sure, what\'s up?' },
      { speakerId: 'a', text: 'It\'s the cleaning rota. The kitchen has been your week for the past three weeks and honestly it hasn\'t really been done. I ended up mopping it on Sunday.' },
      { speakerId: 'b', text: 'I know, I know. I\'ve been swamped at work. But you\'re right, that\'s not really an excuse.' },
      { speakerId: 'a', text: 'I\'m not trying to make a big thing of it. I just don\'t want to end up doing everything and feeling annoyed about it.' },
      { speakerId: 'b', text: 'Understood. Look — how about we agree that if I can\'t get to the kitchen by Sunday evening, I\'ll do it Monday morning before work, no exceptions?' },
      { speakerId: 'a', text: 'That works for me. And if something changes at your job, just tell me and we\'ll swap weeks.' },
    ],
    questions: [
      {
        id: 'q-b1plus-1', level: 'B1+',
        prompt: 'What is Ana\'s main concern in this conversation?',
        options: [
          'She wants to change flats',
          'She feels she is doing more than her share of the cleaning',
          'She thinks Ben spends too much time at work',
          'She wants Ben to pay more rent',
        ],
        correct: 1,
      },
      {
        id: 'q-b1plus-2', level: 'B1+',
        prompt: 'How does Ben react?',
        options: [
          'He denies that he has neglected the kitchen',
          'He acknowledges the problem and proposes a specific fix',
          'He blames the cleaning rota system',
          'He suggests hiring a cleaner',
        ],
        correct: 1,
      },
      {
        id: 'q-b1plus-3', level: 'B1+',
        prompt: 'What is Ana\'s attitude at the end?',
        options: [
          'Angry and unresolved',
          'Satisfied with the compromise, and flexible if Ben\'s job changes',
          'Insistent that Ben must do all the cleaning',
          'Unconvinced by Ben\'s promise',
        ],
        correct: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B2 — News segment on remote work
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-b2-remote-work',
    level:     'B2',
    title:     'News segment: remote work trends',
    scenario:  'A short radio piece analysing recent shifts in remote-work policies.',
    speakers: [
      { id: 'anchor',   name: 'Anchor' },
      { id: 'reporter', name: 'Reporter' },
    ],
    wordCount: 191,
    script: [
      { speakerId: 'anchor',   text: 'And now to business news. Remote work has been quietly transforming the labour market for the past five years, but recent data suggests the picture is more complicated than it first appears. Our reporter has more.' },
      { speakerId: 'reporter', text: 'Thanks. A new survey of over two thousand mid-size employers finds that fully-remote positions have actually declined slightly — by around eight percent — over the last twelve months. But that headline hides a different story: hybrid arrangements, where employees spend two or three days in the office, have risen sharply, particularly in the finance and consulting sectors.' },
      { speakerId: 'anchor',   text: 'So the pendulum isn\'t swinging fully back to the office?' },
      { speakerId: 'reporter', text: 'Not at all. What we are seeing is a shakeout — the extremes are shrinking. Employers who tried fully-remote and struggled with onboarding new hires are pulling people in for part of the week. Employers who demanded five days in the office are quietly relaxing to three. The new normal seems to be somewhere in between, and it\'s the pure remote roles that are now the exception.' },
    ],
    questions: [
      {
        id: 'q-b2-1', level: 'B2',
        prompt: 'According to the report, how have fully-remote positions changed?',
        options: [
          'They have grown by about eight percent',
          'They have declined slightly, by about eight percent',
          'They have remained exactly the same',
          'The report does not give a figure',
        ],
        correct: 1,
      },
      {
        id: 'q-b2-2', level: 'B2',
        prompt: 'Which sectors are showing the biggest rise in hybrid work?',
        options: [
          'Retail and hospitality',
          'Finance and consulting',
          'Manufacturing and logistics',
          'The public sector',
        ],
        correct: 1,
      },
      {
        id: 'q-b2-3', level: 'B2',
        prompt: 'What does the reporter mean by "a shakeout"?',
        options: [
          'A sudden collapse of the remote-work market',
          'A polarisation, with employers going fully remote or fully in-office',
          'Both extremes are shrinking as employers converge on hybrid',
          'A change of leadership at major companies',
        ],
        correct: 2,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // C1 — Academic mini-lecture on decision fatigue
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'l-c1-decision-fatigue',
    level:     'C1',
    title:     'Mini-lecture: decision fatigue',
    scenario:  'A university lecturer introduces the concept of decision fatigue to a psychology class.',
    speakers: [
      { id: 'prof', name: 'Professor' },
    ],
    wordCount: 226,
    script: [
      { speakerId: 'prof', text: 'For today\'s lecture I want to look at a phenomenon that has moved from a fairly obscure corner of social psychology into what you might call the mainstream self-help discourse — decision fatigue. The claim, in its simplest form, is that the quality of the decisions we make deteriorates as we make more of them in a given period. The mechanism is thought to involve a form of cognitive depletion: the mental resources involved in weighing options are, on this account, finite.' },
      { speakerId: 'prof', text: 'This idea is intuitive and, in certain contexts, well supported. Studies of judicial parole decisions, for example, have found that judges tend to grant parole more readily in the mornings and after breaks, and less readily as the session wears on. Similar patterns emerge in medical prescribing behaviour late in a shift. The temptation is to conclude that willpower is a kind of muscle, and that it tires as it is used.' },
      { speakerId: 'prof', text: 'What I want to caution you against, however, is treating this evidence as settled science. Several of the classic experiments have failed to replicate at their original effect sizes, and there is a growing debate about how much of the observed variation reflects genuine depletion versus other factors — hunger, boredom, or simply the order in which cases are scheduled. The current consensus is that the phenomenon is real but considerably narrower and more context-dependent than the popular literature suggests.' },
    ],
    questions: [
      {
        id: 'q-c1-1', level: 'C1',
        prompt: 'What is the central claim of decision fatigue as described in the lecture?',
        options: [
          'People make better decisions the more they practise',
          'Decision quality deteriorates as the number of decisions in a period grows',
          'Fatigue only affects physical, not mental, decisions',
          'Willpower is unlimited if properly trained',
        ],
        correct: 1,
      },
      {
        id: 'q-c1-2', level: 'C1',
        prompt: 'Which finding does the lecturer cite as supporting evidence?',
        options: [
          'Students perform better on morning exams than afternoon ones',
          'Judges grant parole more readily in the mornings and after breaks',
          'Doctors take longer to make decisions later in the day',
          'Shoppers spend more at the end of a shopping trip',
        ],
        correct: 1,
      },
      {
        id: 'q-c1-3', level: 'C1',
        prompt: 'What is the lecturer\'s overall stance at the end?',
        options: [
          'The phenomenon has been definitively proven',
          'The phenomenon is entirely a myth',
          'The phenomenon is real but narrower and more context-dependent than popular accounts suggest',
          'The phenomenon only applies to legal decisions',
        ],
        correct: 2,
      },
    ],
  },
];
