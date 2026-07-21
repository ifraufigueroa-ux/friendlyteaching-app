// FriendlyTeaching.cl — IELTS Listening grader
//
// Pure function library. Given student answers + a mock, returns the
// diagnostic GradeResult defined in @/types/ielts. Encapsulates:
//   • Answer normalisation (trim, lowercase, spelling variants)
//   • Word-limit enforcement
//   • Official raw→band conversion (2024/25 table)
//   • Per-section, per-question-type, per-cognitive-load breakdowns
//   • Trap detection (matches student's wrong answer to known distractorRisks)
//   • Actionable next-step recommendations

import type {
  BandBracket, CognitiveBreakdown, GradeResult, IELTSBandScore, ListeningMock,
  ListeningQuestion, QuestionMark, Recommendation, SectionBreakdown,
  StudentAnswers, TypeBreakdown, ListeningQuestionType,
} from '@/types/ielts';

// ─── Official raw→band conversion (Academic 2024/25) ────────────────
// Brackets are inclusive on both ends. Anything outside 0-40 clamps.

const BAND_BRACKETS: BandBracket[] = [
  { minRaw: 39, maxRaw: 40, band: 9,   label: 'Expert' },
  { minRaw: 37, maxRaw: 38, band: 8.5, label: 'Very good' },
  { minRaw: 35, maxRaw: 36, band: 8,   label: 'Very good' },
  { minRaw: 32, maxRaw: 34, band: 7.5, label: 'Good' },
  { minRaw: 30, maxRaw: 31, band: 7,   label: 'Good' },
  { minRaw: 26, maxRaw: 29, band: 6.5, label: 'Competent' },
  { minRaw: 23, maxRaw: 25, band: 6,   label: 'Competent' },
  { minRaw: 18, maxRaw: 22, band: 5.5, label: 'Modest' },
  { minRaw: 16, maxRaw: 17, band: 5,   label: 'Modest' },
  { minRaw: 13, maxRaw: 15, band: 4.5, label: 'Limited' },
  { minRaw: 10, maxRaw: 12, band: 4,   label: 'Limited' },
  { minRaw: 7,  maxRaw: 9,  band: 3.5, label: 'Extremely limited' },
  { minRaw: 5,  maxRaw: 6,  band: 3,   label: 'Extremely limited' },
  { minRaw: 3,  maxRaw: 4,  band: 2.5, label: 'Extremely limited' },
  { minRaw: 0,  maxRaw: 2,  band: 0,   label: 'Non-user' },
];

export function rawToBand(raw: number): { band: IELTSBandScore; label: BandBracket['label'] } {
  const clamped = Math.max(0, Math.min(40, Math.round(raw)));
  for (const b of BAND_BRACKETS) {
    if (clamped >= b.minRaw && clamped <= b.maxRaw) return { band: b.band, label: b.label };
  }
  return { band: 0, label: 'Non-user' };
}

// ─── Answer normalisation ───────────────────────────────────────────

function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    // strip common punctuation students add but don't get penalised for
    .replace(/[.,;:!?"']/g, '')
    // collapse internal whitespace
    .replace(/\s+/g, ' ');
}

function wordCount(raw: string): number {
  // Contractions count as 2 per IELTS marking rules (don't = do + not).
  // Hyphenated words count as 1.
  const expanded = raw.replace(/'(s|t|re|ve|ll|d|m)\b/g, ' $1');
  return expanded.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Per-question grading ───────────────────────────────────────────

interface GradeContext {
  question: ListeningQuestion;
  studentAnswer: string | string[] | undefined;
}

function gradeQuestion({ question, studentAnswer }: GradeContext): QuestionMark {
  const q = question;
  const base: Partial<QuestionMark> = {
    questionId: q.id,
    studentAnswer,
  };

  // ── Blank answer
  const isEmpty = studentAnswer === undefined
    || (typeof studentAnswer === 'string' && studentAnswer.trim() === '')
    || (Array.isArray(studentAnswer) && studentAnswer.length === 0);

  if (isEmpty) {
    return {
      ...base as QuestionMark,
      correct: false,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: 'blank',
    };
  }

  // ── MCQ (single)
  if (q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'plan-map-labelling') {
    const answer = String(studentAnswer).trim().toLowerCase();
    const correct = q.correct.toLowerCase() === answer;
    return {
      ...base as QuestionMark,
      correct,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: correct ? undefined : 'wrong-option',
    };
  }

  // ── MCQ (pick N)
  if (q.type === 'multiple-choice-multi') {
    const chosen = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer])
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);
    if (chosen.length !== q.pickCount) {
      return {
        ...base as QuestionMark,
        correct: false,
        acceptedAnswer: canonicalAnswer(q),
        reasonWrong: 'multiple-when-one',
      };
    }
    const wanted = q.correct.map((x) => x.toLowerCase()).sort().join(',');
    const got = [...chosen].sort().join(',');
    return {
      ...base as QuestionMark,
      correct: wanted === got,
      acceptedAnswer: canonicalAnswer(q),
      reasonWrong: wanted === got ? undefined : 'wrong-option',
    };
  }

  // ── Fill-in (form / note / table / summary / sentence / flow / short-answer)
  const raw = String(studentAnswer);
  const wc = wordCount(raw);
  if (wc > q.wordLimit) {
    return {
      ...base as QuestionMark,
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
    ...base as QuestionMark,
    correct: isCorrect,
    acceptedAnswer: canonicalAnswer(q),
    reasonWrong: isCorrect ? undefined : 'spelling',
    trapMatched: isCorrect ? undefined : matchTrap(raw, q),
  };
}

// Human-friendly canonical form of the answer for the review pane.
function canonicalAnswer(q: ListeningQuestion): string {
  if (q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'plan-map-labelling') {
    const opt = q.options.find((o) => o.id === q.correct);
    return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : q.correct;
  }
  if (q.type === 'multiple-choice-multi') {
    return q.correct.map((id) => {
      const opt = q.options.find((o) => o.id === id);
      return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : id;
    }).join(' + ');
  }
  return q.accepted[0];
}

// Match a student's wrong answer to a known distractor risk (fuzzy).
function matchTrap(rawAnswer: string, q: ListeningQuestion): string | undefined {
  const risks = 'distractorRisks' in q ? q.distractorRisks : undefined;
  if (!risks || risks.length === 0) return undefined;
  const student = normalise(rawAnswer);
  for (const risk of risks) {
    // Risk strings are human-written ("Silver (initial answer, then reversed)") — extract
    // the leading keyword before any parenthesis for the match.
    const key = normalise(risk.split('(')[0]);
    if (student === key || student.includes(key) || key.includes(student)) return risk;
  }
  return undefined;
}

// ─── Aggregations ───────────────────────────────────────────────────

function pct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function bySection(marks: QuestionMark[], mock: ListeningMock): SectionBreakdown[] {
  const out: SectionBreakdown[] = [];
  for (const sec of mock.sections) {
    const secMarks = sec.questions.map((q) => marks.find((m) => m.questionId === q.id)).filter(Boolean) as QuestionMark[];
    const correct = secMarks.filter((m) => m.correct).length;
    out.push({ section: sec.number, correct, total: 10, pct: pct(correct, 10) });
  }
  return out;
}

function byType(marks: QuestionMark[], mock: ListeningMock): TypeBreakdown[] {
  const groups = new Map<ListeningQuestionType, { correct: number; total: number }>();
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

function byCognitive(marks: QuestionMark[], mock: ListeningMock): CognitiveBreakdown[] {
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
    load: load as CognitiveBreakdown['load'],
    correct: v.correct,
    total: v.total,
    pct: pct(v.correct, v.total),
  }));
}

// ─── Recommendations ────────────────────────────────────────────────

function buildRecommendations(
  sectionBreakdown: SectionBreakdown[],
  typeBreakdown: TypeBreakdown[],
  cognitiveBreakdown: CognitiveBreakdown[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Weakest section
  const weakestSection = [...sectionBreakdown].sort((a, b) => a.pct - b.pct)[0];
  if (weakestSection && weakestSection.pct < 60) {
    const sectionHints: Record<number, string> = {
      1: 'Section 1 (social transactional) is your weak spot. Practice catching spelled-out names, numbers and mid-flow corrections — the speaker often changes their mind.',
      2: 'Section 2 (social monologue) is your weak spot. Focus on tour/announcement-style audios; track numerical details (prices, times, dates) closely.',
      3: 'Section 3 (academic discussion) is your weak spot. Multi-speaker turn-taking is the challenge — practice associating opinions with the speaker who voiced them.',
      4: 'Section 4 (academic lecture) is your weak spot. Note-taking discipline is the fix: use abbreviations and follow the speaker\'s outline signals ("first…", "moving on to…").',
    };
    recs.push({
      focus: 'section',
      targetTag: `section-${weakestSection.section}`,
      message: sectionHints[weakestSection.section],
    });
  }

  // Weakest question type (only flag if the type appears ≥ 3 times, else the % is noisy)
  const weakestType = [...typeBreakdown]
    .filter((t) => t.total >= 3)
    .sort((a, b) => a.pct - b.pct)[0];
  if (weakestType && weakestType.pct < 60) {
    const typeHints: Record<string, string> = {
      'multiple-choice': 'Multiple-choice trips you up. Real IELTS distractors reuse audio content — the wrong options are things the speaker DID say, just not as the answer.',
      'matching': 'Matching questions are hard when speakers agree/disagree. Track WHO said what, not just what was said.',
      'form-completion': 'Form-completion errors are usually spelling. Practise the 100 most-tested spellings (names, cities, professions).',
      'note-completion': 'Note-completion needs faster note-taking. Practise capturing only the key noun/number, not full phrases.',
      'sentence-completion': 'Sentence-completion errors often break the word limit. Re-read the limit before you write.',
      'short-answer': 'Short-answer errors happen when students paraphrase instead of using words from the audio verbatim.',
    };
    const hint = typeHints[weakestType.type] ?? 'Focus practice on this question type — your accuracy is below your average.';
    recs.push({
      focus: 'type',
      targetTag: weakestType.type,
      message: hint,
    });
  }

  // Cognitive gap — literal vs inferential
  const literal = cognitiveBreakdown.find((c) => c.load === 'literal');
  const inferential = cognitiveBreakdown.find((c) => c.load === 'inferential');
  if (literal && inferential && literal.pct - inferential.pct > 25) {
    recs.push({
      focus: 'cognitive',
      targetTag: 'inferential',
      message: 'You catch literal information well but stumble on inferential questions. This is the classic band 6 → 7 plateau. Focus practice on speaker attitude, main-idea and implied-meaning questions.',
    });
  }

  return recs;
}

// ─── Main entry ─────────────────────────────────────────────────────

export function gradeAnswers(userAnswers: StudentAnswers, mock: ListeningMock): GradeResult {
  const marks: QuestionMark[] = [];
  for (const sec of mock.sections) {
    for (const q of sec.questions) {
      marks.push(gradeQuestion({ question: q, studentAnswer: userAnswers[q.id] }));
    }
  }

  const rawScore = marks.filter((m) => m.correct).length;
  const { band, label } = rawToBand(rawScore);

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
