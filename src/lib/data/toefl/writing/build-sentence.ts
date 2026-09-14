// TOEFL Writing — Build a Sentence banks.
//
// One bank per mock. Each item shows the student a set of shuffled word
// chips; they reorder the chips (drag or click) to construct the target
// sentence. Auto-graded via exact string match against `correct` (and
// any `altCorrect` alternatives, which cover legitimate variations like
// contraction/expansion).
//
// Target difficulty: intermediate — sentences use real academic register
// but stay short enough (8-15 chips) that the reorder step tests grammar
// and word order, not memory.

import type { TOEFLBuildSentenceItem } from '@/types/toefl';

// ─── Mock 1 · Introductory ───────────────────────────────────────────

export const buildSentenceMock1: TOEFLBuildSentenceItem[] = [
  {
    id:      'w1-bas-1',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['a', 'library', 'is', 'quiet', 'the', 'place', 'to', 'study'],
    correct: 'The library is a quiet place to study',
    teacherNote: 'Article + noun agreement + adjective order.',
  },
  {
    id:      'w1-bas-2',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['have', 'my', 'not', 'yet', 'roommates', 'decided'],
    correct: 'My roommates have not decided yet',
    altCorrect: ["My roommates haven't decided yet"],
    teacherNote: 'Present perfect + adverb placement (yet at the end).',
  },
  {
    id:      'w1-bas-3',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['professor', 'the', 'assignment', 'the', 'until', 'extended', 'Friday'],
    correct: 'The professor extended the assignment until Friday',
    teacherNote: 'Subject-verb-object with time preposition (until).',
  },
  {
    id:      'w1-bas-4',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['if', 'take', 'you', 'the', 'the', 'bus', 'will', 'library', 'faster', 'you', 'reach'],
    correct: 'If you take the bus you will reach the library faster',
    altCorrect: ["If you take the bus, you will reach the library faster"],
    teacherNote: 'First conditional with time-of-arrival result.',
  },
  {
    id:      'w1-bas-5',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['research', 'suggests', 'that', 'sleep', 'improves', 'memory', 'recent'],
    correct: 'Recent research suggests that sleep improves memory',
    teacherNote: 'Reporting verb + that-clause (typical academic sentence).',
  },
];

// ─── Mock 2 · Media & Society ────────────────────────────────────────

export const buildSentenceMock2: TOEFLBuildSentenceItem[] = [
  {
    id:      'w2-bas-1',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['many', 'students', 'use', 'to', 'social', 'media', 'read', 'the', 'news'],
    correct: 'Many students use social media to read the news',
    teacherNote: 'Subject + verb + purpose infinitive.',
  },
  {
    id:      'w2-bas-2',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['newspaper', 'the', 'was', 'article', 'yesterday', 'published'],
    correct: 'The newspaper article was published yesterday',
    teacherNote: 'Passive voice in the simple past.',
  },
  {
    id:      'w2-bas-3',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['which', 'source', 'most', 'the', 'is', 'reliable'],
    correct: 'Which source is the most reliable',
    altCorrect: ['Which source is the most reliable?'],
    teacherNote: 'Wh-question with superlative adjective.',
  },
  {
    id:      'w2-bas-4',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['journalists', 'unless', 'facts', 'check', 'their', 'they', 'make', 'mistakes', 'will'],
    correct: 'Unless journalists check their facts they will make mistakes',
    altCorrect: ['Unless journalists check their facts, they will make mistakes'],
    teacherNote: '"Unless" (= if not) + first conditional.',
  },
  {
    id:      'w2-bas-5',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['I', 'would', 'more', 'read', 'if', 'I', 'time', 'had'],
    correct: 'If I had more time I would read',
    altCorrect: ['If I had more time, I would read', 'I would read if I had more time'],
    teacherNote: 'Second conditional — hypothetical present.',
  },
];

// ─── Mock 3 · Education Policy ───────────────────────────────────────

export const buildSentenceMock3: TOEFLBuildSentenceItem[] = [
  {
    id:      'w3-bas-1',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['universities', 'top', 'admit', 'few', 'a', 'applicants', 'only'],
    correct: 'Top universities admit only a few applicants',
    teacherNote: 'Focus adverb (only) placement.',
  },
  {
    id:      'w3-bas-2',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['scholarships', 'the', 'won', 'student', 'has', 'many'],
    correct: 'The student has won many scholarships',
    teacherNote: 'Present perfect with quantifier.',
  },
  {
    id:      'w3-bas-3',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['who', 'the', 'candidate', 'the', 'test', 'passed', 'was', 'selected'],
    correct: 'The candidate who passed the test was selected',
    teacherNote: 'Defining relative clause with subject "who".',
  },
  {
    id:      'w3-bas-4',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['study', 'the', 'harder', 'you', 'the', 'better', 'your', 'results'],
    correct: 'The harder you study the better your results',
    altCorrect: ['The harder you study, the better your results'],
    teacherNote: 'Comparative "the … the …" construction.',
  },
  {
    id:      'w3-bas-5',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['despite', 'the', 'difficulty', 'of', 'the', 'exam', 'she', 'succeeded'],
    correct: 'Despite the difficulty of the exam she succeeded',
    altCorrect: ['Despite the difficulty of the exam, she succeeded'],
    teacherNote: '"Despite" + noun phrase (not a clause).',
  },
];

// ─── Mock 4 · Technology & Society ───────────────────────────────────

export const buildSentenceMock4: TOEFLBuildSentenceItem[] = [
  {
    id:      'w4-bas-1',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['AI', 'tools', 'are', 'used', 'artists', 'by', 'many'],
    correct: 'AI tools are used by many artists',
    teacherNote: 'Passive voice + agent (by-phrase).',
  },
  {
    id:      'w4-bas-2',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['the', 'new', 'software', 'we', 'downloaded', 'works', 'well'],
    correct: 'The new software we downloaded works well',
    teacherNote: 'Reduced relative clause (that/which omitted).',
  },
  {
    id:      'w4-bas-3',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['neither', 'the', 'illustrator', 'the', 'nor', 'writer', 'attended', 'the', 'meeting'],
    correct: 'Neither the illustrator nor the writer attended the meeting',
    teacherNote: '"Neither … nor …" with a single verb form.',
  },
  {
    id:      'w4-bas-4',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['not', 'only', 'is', 'the', 'model', 'fast', 'it', 'is', 'accurate', 'but', 'also'],
    correct: 'Not only is the model fast but it is also accurate',
    altCorrect: [
      'Not only is the model fast, but it is also accurate',
      'Not only is the model fast but also it is accurate',
    ],
    teacherNote: '"Not only … but also …" with inversion after "not only".',
  },
  {
    id:      'w4-bas-5',
    prompt:  'Rearrange the words to form a correct sentence.',
    chips:   ['had', 'if', 'the', 'we', 'known', 'earlier', 'update', 'about', 'we', 'have', 'installed', 'would', 'it'],
    correct: 'If we had known about the update earlier we would have installed it',
    altCorrect: ['If we had known about the update earlier, we would have installed it'],
    teacherNote: 'Third conditional — hypothetical past regret.',
  },
];
