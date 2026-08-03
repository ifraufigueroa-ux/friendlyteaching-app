// FriendlyTeaching.cl — IELTS Reading grader (General Training)
//
// Pure functions. Uses the official GT raw→band table which is markedly
// stricter than Academic: 30/40 is only Band 5.5 on GT vs 7.0 on Academic,
// because the GT texts are easier.

import type {
  BandBracket, IELTSBandScore,
  ReadingCognitiveBreakdown, ReadingGradeResult, ReadingMock, ReadingQuestion,
  ReadingQuestionMark, ReadingQuestionType, ReadingRecommendation,
  ReadingSectionBreakdown, ReadingTypeBreakdown, StudentReadingAnswers,
} from '@/types/ielts-reading';

// ─── GT raw→band (official 2024/25 conversion) ──────────────────────

const GT_BAND_BRACKETS: BandBracket[] = [
  { minRaw: 40, maxRaw: 40, band: 9,   label: 'Expert' },
  { minRaw: 39, maxRaw: 39, band: 8.5, label: 'Very good' },
  { minRaw: 37, maxRaw: 38, band: 8,   label: 'Very good' },
  { minRaw: 36, maxRaw: 36, band: 7.5, label: 'Good' },
  { minRaw: 34, maxRaw: 35, band: 7,   label: 'Good' },
  { minRaw: 32, maxRaw: 33, band: 6.5, label: 'Competent' },
  { minRaw: 30, maxRaw: 31, band: 6,   label: 'Competent' },
  { minRaw: 27, maxRaw: 29, band: 5.5, label: 'Modest' },
  { minRaw: 23, maxRaw: 26, band: 5,   label: 'Modest' },
  { minRaw: 19, maxRaw: 22, band: 4.5, label: 'Limited' },
  { minRaw: 15, maxRaw: 18, band: 4,   label: 'Limited' },
  { minRaw: 12, maxRaw: 14, band: 3.5, label: 'Extremely limited' },
  { minRaw: 9,  maxRaw: 11, band: 3,   label: 'Extremely limited' },
  { minRaw: 6,  maxRaw: 8,  band: 2.5, label: 'Extremely limited' },
  { minRaw: 0,  maxRaw: 5,  band: 0,   label: 'Non-user' },
];

export function rawToBandGT(raw: number): { band: IELTSBandScore; label: BandBracket['label'] } {
  const clamped = Math.max(0, Math.min(40, Math.round(raw)));
  for (const b of GT_BAND_BRACKETS) {
    if (clamped >= b.minRaw && clamped <= b.maxRaw) return { band: b.band, label: b.label };
  }
  return { band: 0, label: 'Non-user' };
}

// ─── Normalisation ──────────────────────────────────────────────────

function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?"']/g, '')
    .replace(/\s+/g, ' ');
}

function wordCount(raw: string): number {
  const expanded = raw.replace(/'(s|t|re|ve|ll|d|m)\b/g, ' $1');
  return expanded.trim().split(/\s+/).filter(Boolean).length;
}

// TFNG / YNNG accept synonymous or shortened forms students often type.
const TFNG_ALIASES: Record<string, ReturnType<() => string>> = {
  't': 'true', 'true': 'true',
  'f': 'false', 'false': 'false',
  'y': 'yes', 'yes': 'yes',
  'n': 'no', 'no': 'no',
  'ng': 'not-given', 'notgiven': 'not-given', 'not given': 'not-given', 'not-given': 'not-given',
};

function canonicalTFNG(raw: string): string | undefined {
  const key = normalise(raw).replace(/-/g, ' ').replace(/\s+/g, ' ');
  return TFNG_ALIASES[key] ?? TFNG_ALIASES[key.replace(/\s/g, '')];
}

// ─── Per-question grading ───────────────────────────────────────────

function canonicalAnswer(q: ReadingQuestion): string {
  switch (q.type) {
    case 'multiple-choice': {
      const opt = q.options.find((o) => o.id === q.correct);
      return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : q.correct;
    }
    case 'multiple-choice-multi':
      return q.correct.map((id) => {
        const opt = q.options.find((o) => o.id === id);
        return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : id;
      }).join(' + ');
    case 'true-false-not-given':
    case 'yes-no-not-given':
      return q.correct.toUpperCase().replace('-', ' ');
    case 'matching-information':
    case 'matching-headings':
    case 'matching-features':
    case 'matching-sentence-endings': {
      const opt = q.options.find((o) => o.id === q.correct);
      return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : q.correct;
    }
    case 'sentence-completion':
    case 'summary-completion':
    case 'note-completion':
    case 'table-completion':
    case 'flow-chart-completion':
    case 'diagram-label':
    case 'short-answer':
      return q.accepted[0];
  }
}

function matchTrap(rawAnswer: string, q: ReadingQuestion): string | undefined {
  const risks = q.distractorRisks;
  if (!risks || risks.length === 0) return undefined;
  const student = normalise(rawAnswer);
  for (const risk of risks) {
    const key = normalise(risk.split('(')[0]);
    if (student === key || student.includes(key) || key.includes(student)) return risk;
  }
  return undefined;
}

interface GradeContext {
  question: ReadingQuestion;
  studentAnswer: string | string[] | undefined;
}

function gradeQuestion({ question, studentAnswer }: GradeContext): ReadingQuestionMark {
  const q = question;
  const base = { questionId: q.id, studentAnswer };

  const isEmpty = studentAnswer === undefined
    || (typeof studentAnswer === 'string' && studentAnswer.trim() === '')
    || (Array.isArray(studentAnswer) && studentAnswer.length === 0);

  if (isEmpty) {
    return {
      ...base,
      correct: false,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: 'blank',
    };
  }

  if (q.type === 'true-false-not-given' || q.type === 'yes-no-not-given') {
    const student = canonicalTFNG(String(studentAnswer));
    const correct = student === q.correct;
    return {
      ...base,
      correct,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: correct ? undefined : 'wrong-tfng',
    };
  }

  if (
    q.type === 'multiple-choice'
    || q.type === 'matching-information'
    || q.type === 'matching-headings'
    || q.type === 'matching-features'
    || q.type === 'matching-sentence-endings'
  ) {
    const answer = String(studentAnswer).trim().toLowerCase();
    const correct = q.correct.toLowerCase() === answer;
    return {
      ...base,
      correct,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: correct ? undefined : 'wrong-option',
    };
  }

  if (q.type === 'multiple-choice-multi') {
    const chosen = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer])
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);
    if (chosen.length !== q.pickCount) {
      return {
        ...base,
        correct: false,
        acceptedAnswer: canonicalAnswer(q),
        reasonWrong: 'multiple-when-one',
      };
    }
    const wanted = q.correct.map((x) => x.toLowerCase()).sort().join(',');
    const got = [...chosen].sort().join(',');
    const correct = wanted === got;
    return {
      ...base,
      correct,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: correct ? undefined : 'wrong-option',
    };
  }

  // Fill family — narrow with `in` so TS knows accepted/wordLimit exist.
  if (!('accepted' in q)) {
    // Unreachable — MC / MCQ-multi / matching / TFNG all returned above.
    throw new Error(`Unhandled question type: ${(q as ReadingQuestion).type}`);
  }
  const raw = String(studentAnswer);
  const wc = wordCount(raw);
  if (wc > q.wordLimit) {
    return {
      ...base,
      correct: false,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: 'over-word-limit',
      trapMatched: matchTrap(raw, q),
    };
  }
  const student = normalise(raw);
  const accepted = q.accepted.map(normalise);
  const isCorrect = accepted.includes(student);
  return {
    ...base,
    correct: isCorrect,
    acceptedAnswer: canonicalAnswer(q),
    reasonWrong: isCorrect ? undefined : 'spelling',
    trapMatched: isCorrect ? undefined : matchTrap(raw, q),
  };
}

// ─── Aggregations ───────────────────────────────────────────────────

function pct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function bySection(marks: ReadingQuestionMark[], mock: ReadingMock): ReadingSectionBreakdown[] {
  return mock.sections.map((sec) => {
    const secMarks = sec.questions
      .map((q) => marks.find((m) => m.questionId === q.id))
      .filter(Boolean) as ReadingQuestionMark[];
    const correct = secMarks.filter((m) => m.correct).length;
    return { section: sec.number, correct, total: sec.questions.length, pct: pct(correct, sec.questions.length) };
  });
}

function byType(marks: ReadingQuestionMark[], mock: ReadingMock): ReadingTypeBreakdown[] {
  const groups = new Map<ReadingQuestionType, { correct: number; total: number }>();
  for (const sec of mock.sections) {
    for (const q of sec.questions) {
      const m = marks.find((x) => x.questionId === q.id);
      const bucket = groups.get(q.type) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (m?.correct) bucket.correct += 1;
      groups.set(q.type, bucket);
    }
  }
  return [...groups.entries()].map(([type, v]) => ({ type, correct: v.correct, total: v.total, pct: pct(v.correct, v.total) }));
}

function byCognitive(marks: ReadingQuestionMark[], mock: ReadingMock): ReadingCognitiveBreakdown[] {
  const groups = new Map<string, { correct: number; total: number }>();
  for (const sec of mock.sections) {
    for (const q of sec.questions) {
      const m = marks.find((x) => x.questionId === q.id);
      const bucket = groups.get(q.cognitiveLoad) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (m?.correct) bucket.correct += 1;
      groups.set(q.cognitiveLoad, bucket);
    }
  }
  return [...groups.entries()].map(([load, v]) => ({
    load: load as ReadingCognitiveBreakdown['load'],
    correct: v.correct,
    total: v.total,
    pct: pct(v.correct, v.total),
  }));
}

// ─── Recommendations ────────────────────────────────────────────────

function buildRecommendations(
  sectionBreakdown: ReadingSectionBreakdown[],
  typeBreakdown: ReadingTypeBreakdown[],
  cognitiveBreakdown: ReadingCognitiveBreakdown[],
): ReadingRecommendation[] {
  const recs: ReadingRecommendation[] = [];

  const weakestSection = [...sectionBreakdown].sort((a, b) => a.pct - b.pct)[0];
  if (weakestSection && weakestSection.pct < 60) {
    const hints: Record<number, string> = {
      1: 'Section 1 (social survival) is your weak spot. Scan-and-locate is the skill: dates, prices, addresses, opening hours — the answer is always literal, don\'t overthink it.',
      2: 'Section 2 (workplace) is your weak spot. Practise workplace-topic vocabulary (contracts, benefits, training) and watch out for paraphrase between passage and question.',
      3: 'Section 3 (long text) is your weak spot. Time management is usually the fix: save ~20 minutes for this section and skim for structure before diving in.',
    };
    recs.push({
      focus: 'section',
      targetTag: `section-${weakestSection.section}`,
      message: hints[weakestSection.section],
    });
  }

  const weakestType = [...typeBreakdown]
    .filter((t) => t.total >= 3)
    .sort((a, b) => a.pct - b.pct)[0];
  if (weakestType && weakestType.pct < 60) {
    const hints: Record<string, string> = {
      'true-false-not-given': 'True/False/Not Given trips you up. Rule: FALSE = the passage says the opposite. NOT GIVEN = the passage doesn\'t comment either way. Most errors are choosing FALSE when the correct answer is NOT GIVEN.',
      'yes-no-not-given': 'Yes/No/Not Given is about the writer\'s opinion, not facts. If the writer doesn\'t take a side, it\'s NOT GIVEN — even if the topic is discussed.',
      'matching-headings': 'Matching Headings is a paragraph-summary skill. Read the FIRST and LAST sentence of each paragraph to find the main idea, not scanning details.',
      'matching-information': 'Matching Information asks which paragraph mentions X. Scan for keywords; the answer is usually not in the paragraph you\'d expect from topic order.',
      'matching-features': 'Matching Features needs you to link claims to their source. Track WHO said what — mark up the passage as you read.',
      'multiple-choice': 'Multiple-choice in Reading almost always has distractors that use words from the passage in a different sense. The correct option is usually a paraphrase, not a copy.',
      'sentence-completion': 'Sentence-completion errors often break the word limit. Re-read the limit and match the grammar of what you\'ve written.',
      'summary-completion': 'Summary-completion needs you to spot the paraphrase between summary and passage before you hunt for the blank word.',
      'short-answer': 'Short-answer errors happen when students rewrite the answer in their own words. Use words from the passage verbatim.',
    };
    const hint = hints[weakestType.type] ?? 'Focus practice on this question type — your accuracy is below your average.';
    recs.push({ focus: 'type', targetTag: weakestType.type, message: hint });
  }

  const literal = cognitiveBreakdown.find((c) => c.load === 'literal');
  const inferential = cognitiveBreakdown.find((c) => c.load === 'inferential');
  if (literal && inferential && literal.pct - inferential.pct > 25) {
    recs.push({
      focus: 'cognitive',
      targetTag: 'inferential',
      message: 'You handle literal facts well but stumble on inference. This is the band 6 → 7 plateau: focus on writer-purpose and implied-meaning questions.',
    });
  }

  return recs;
}

// ─── Main entry ─────────────────────────────────────────────────────

export function gradeReadingAnswers(
  userAnswers: StudentReadingAnswers,
  mock: ReadingMock,
): ReadingGradeResult {
  const marks: ReadingQuestionMark[] = [];
  for (const sec of mock.sections) {
    for (const q of sec.questions) {
      marks.push(gradeQuestion({ question: q, studentAnswer: userAnswers[q.id] }));
    }
  }

  const rawScore = marks.filter((m) => m.correct).length;
  const { band, label } = rawToBandGT(rawScore);

  const sectionBreakdown = bySection(marks, mock);
  const typeBreakdown = byType(marks, mock);
  const cognitiveBreakdown = byCognitive(marks, mock);
  const recommendations = buildRecommendations(sectionBreakdown, typeBreakdown, cognitiveBreakdown);

  return {
    mockId: mock.id,
    submittedAt: new Date().toISOString(),
    rawScore,
    band,
    bandLabel: label,
    perQuestion: marks,
    sectionBreakdown,
    typeBreakdown,
    cognitiveBreakdown,
    recommendations,
  };
}
