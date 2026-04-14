// FriendlyTeaching.cl — Placement Test Scoring & Learning Program Generator

import type { LessonLevel } from '@/types/firebase';
import type {
  PlacementAnswer,
  SectionScore,
  WeakArea,
  LearningProgram,
  WeekPlan,
  GrammarTopic,
} from '@/types/placement';
import { TOPIC_LABELS } from '@/data/placementQuestions';

const LEVELS_IN_ORDER: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
const PASS_THRESHOLD = 0.6; // 60%
const MIN_QUESTIONS = 4;    // need at least 4 answers in a section to count

// ── Section scoring ────────────────────────────────────────────

export function computeSectionScores(answers: PlacementAnswer[]): SectionScore[] {
  const buckets: Record<string, { total: number; correct: number }> = {};

  for (const a of answers) {
    if (!buckets[a.level]) buckets[a.level] = { total: 0, correct: 0 };
    buckets[a.level].total++;
    if (a.correct) buckets[a.level].correct++;
  }

  return LEVELS_IN_ORDER.map((level) => {
    const b = buckets[level] ?? { total: 0, correct: 0 };
    const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
    return {
      level,
      total: b.total,
      correct: b.correct,
      pct,
      passed: b.total >= MIN_QUESTIONS && pct >= PASS_THRESHOLD * 100,
    };
  });
}

// ── Level determination ────────────────────────────────────────
// Walk sections from lowest to highest.
// The placed level is the HIGHEST section where the student passed.
// If they passed none, place at A0.

export function determineLevel(sectionScores: SectionScore[]): LessonLevel {
  let placed: LessonLevel = 'A0';
  for (const section of sectionScores) {
    if (section.passed) placed = section.level;
  }
  return placed;
}

// ── Weak areas ─────────────────────────────────────────────────
// Topics where the student answered at least 2 questions but got < 60%

export function computeWeakAreas(answers: PlacementAnswer[]): WeakArea[] {
  const buckets: Record<string, { total: number; correct: number }> = {};
  for (const a of answers) {
    if (!buckets[a.topic]) buckets[a.topic] = { total: 0, correct: 0 };
    buckets[a.topic].total++;
    if (a.correct) buckets[a.topic].correct++;
  }

  return Object.entries(buckets)
    .filter(([, b]) => b.total >= 2)
    .map(([topic, b]) => ({
      topic: topic as GrammarTopic,
      total: b.total,
      correct: b.correct,
      pct: Math.round((b.correct / b.total) * 100),
    }))
    .filter((w) => w.pct < 60)
    .sort((a, b) => a.pct - b.pct); // worst first
}

// ── Learning program generator ─────────────────────────────────

const LEVEL_PROGRAM: Record<LessonLevel, WeekPlan[]> = {
  A0: [
    { week: 1, focus: 'Verb To Be', topics: ['verb_to_be'], description: 'Master am / is / are in positive, negative, and questions.' },
    { week: 2, focus: 'Articles & Nouns', topics: ['articles', 'countable_uncountable'], description: 'A / an / the and plural nouns.' },
    { week: 3, focus: 'Pronouns & Possessives', topics: ['pronouns', 'possessives'], description: 'Subject pronouns, possessive adjectives.' },
    { week: 4, focus: 'Present Simple (Intro)', topics: ['present_simple'], description: 'I / you / we / they forms and negatives.' },
    { week: 5, focus: 'Present Simple (He/She/It)', topics: ['present_simple', 'questions'], description: 'Third person -s, does/doesn\'t, basic questions.' },
    { week: 6, focus: 'Present Continuous', topics: ['present_continuous'], description: 'Am/is/are + -ing for actions happening now.' },
    { week: 7, focus: 'Prepositions of Time & Place', topics: ['prepositions'], description: 'In/on/at for time; at/in/on for place.' },
    { week: 8, focus: 'Numbers & Quantifiers', topics: ['quantifiers'], description: 'How much / how many, some / any.' },
    { week: 9, focus: 'Can / Can\'t', topics: ['modals_basic'], description: 'Ability and permission with can.' },
    { week: 10, focus: 'Future: Going To', topics: ['future_going_to'], description: 'Plans and predictions with going to.' },
    { week: 11, focus: 'Review A0 Core', topics: ['verb_to_be', 'present_simple', 'present_continuous'], description: 'Consolidate all A0 grammar in context.' },
    { week: 12, focus: 'Assessment & Bridge to A1', topics: ['present_simple', 'questions', 'negatives'], description: 'Mixed practice, self-test, and preview of A1 topics.' },
  ],
  A1: [
    { week: 1, focus: 'Present Simple (All Persons)', topics: ['present_simple', 'negatives'], description: 'Full conjugation, negatives, do/does questions.' },
    { week: 2, focus: 'Present Continuous', topics: ['present_continuous'], description: 'Temporary actions and future arrangements.' },
    { week: 3, focus: 'Past Simple (Regular)', topics: ['past_simple'], description: '-ed endings, spelling rules, negatives with did.' },
    { week: 4, focus: 'Past Simple (Irregular)', topics: ['past_simple'], description: 'Common irregular verbs (go/went, have/had, etc.).' },
    { week: 5, focus: 'Comparatives', topics: ['comparatives'], description: '-er / more + than; irregular (better, worse).' },
    { week: 6, focus: 'Superlatives', topics: ['superlatives'], description: '-est / most; irregular (best, worst).' },
    { week: 7, focus: 'Going To vs Will', topics: ['future_going_to', 'future_will'], description: 'Plans vs predictions.' },
    { week: 8, focus: 'Can / Must / Should', topics: ['modals_basic'], description: 'Ability, obligation, advice.' },
    { week: 9, focus: 'Countable & Uncountable', topics: ['countable_uncountable', 'quantifiers'], description: 'Some/any, a little/a few, much/many.' },
    { week: 10, focus: 'Prepositions', topics: ['prepositions'], description: 'Time (in/on/at), place, and movement.' },
    { week: 11, focus: 'Question Forms', topics: ['questions'], description: 'Wh- questions, yes/no questions, question tags.' },
    { week: 12, focus: 'Review & Assessment', topics: ['past_simple', 'present_simple', 'present_continuous', 'comparatives'], description: 'Mixed A1 practice and bridge to A2.' },
  ],
  A2: [
    { week: 1, focus: 'Past Simple Consolidation', topics: ['past_simple'], description: 'Regular, irregular, negatives, Wh- questions.' },
    { week: 2, focus: 'Past Continuous', topics: ['past_continuous'], description: 'Ongoing actions in the past; while/when contrasts.' },
    { week: 3, focus: 'Present Perfect (Intro)', topics: ['present_perfect'], description: 'Have/has + past participle; ever/never/already/yet.' },
    { week: 4, focus: 'Future Forms Review', topics: ['future_will', 'future_going_to', 'present_continuous'], description: 'Choosing the right future form.' },
    { week: 5, focus: 'Comparatives & Superlatives', topics: ['comparatives', 'superlatives'], description: 'Review + as...as, not as...as.' },
    { week: 6, focus: 'Modal Verbs', topics: ['modals_basic'], description: 'Can/could, must/have to, should/ought to.' },
    { week: 7, focus: 'Going To for Intentions', topics: ['future_going_to'], description: 'Intentions and evidence-based predictions.' },
    { week: 8, focus: 'Prepositions of Movement', topics: ['prepositions'], description: 'Into/out of/through/past/along/around.' },
    { week: 9, focus: 'Countable/Uncountable Advanced', topics: ['countable_uncountable', 'determiners'], description: 'A lot of, plenty of, both, each, every.' },
    { week: 10, focus: 'Question Tags', topics: ['questions'], description: "You're coming, aren't you? Formation rules." },
    { week: 11, focus: 'Verb Patterns (Intro)', topics: ['gerunds_infinitives'], description: 'Verbs followed by -ing or to-infinitive.' },
    { week: 12, focus: 'Review & A2 Assessment', topics: ['past_simple', 'past_continuous', 'present_perfect', 'modals_basic'], description: 'Consolidate A2 and preview B1 topics.' },
  ],
  B1: [
    { week: 1, focus: 'Present Perfect vs Past Simple', topics: ['present_perfect', 'past_simple'], description: 'When to use each; for/since, already/just/yet.' },
    { week: 2, focus: 'Present Perfect Continuous', topics: ['present_perfect_continuous'], description: 'Duration and recent actions with evidence.' },
    { week: 3, focus: 'Modal Verbs (Probability)', topics: ['modals_advanced'], description: 'Must/might/could/can\'t for deduction.' },
    { week: 4, focus: 'First Conditional', topics: ['conditionals_1'], description: 'Real conditions: if + present → will.' },
    { week: 5, focus: 'Second Conditional (Intro)', topics: ['conditionals_2'], description: 'Unreal present: if + past → would.' },
    { week: 6, focus: 'Passive Voice', topics: ['passive_simple'], description: 'Present/past passive; by-agent.' },
    { week: 7, focus: 'Reported Speech', topics: ['reported_speech'], description: 'Backshift, reporting verbs, questions.' },
    { week: 8, focus: 'Relative Clauses', topics: ['relative_clauses'], description: 'Who/which/that/whose; defining vs non-defining.' },
    { week: 9, focus: 'Gerunds & Infinitives', topics: ['gerunds_infinitives'], description: 'Verb + -ing; verb + to-infinitive; change in meaning.' },
    { week: 10, focus: 'Used To / Would', topics: ['used_to_would'], description: 'Past habits and states.' },
    { week: 11, focus: 'Future Continuous & Perfect', topics: ['future_continuous'], description: 'Predictions and actions in progress at future time.' },
    { week: 12, focus: 'Review B1 & Assessment', topics: ['present_perfect', 'conditionals_1', 'passive_simple', 'reported_speech'], description: 'Mixed B1 grammar, exam practice.' },
  ],
  'B1+': [
    { week: 1, focus: 'Second Conditional', topics: ['conditionals_2'], description: 'Hypothetical situations; were/was; I wish.' },
    { week: 2, focus: 'Third Conditional', topics: ['conditionals_3'], description: 'Imaginary past; had + pp → would have.' },
    { week: 3, focus: 'Mixed Conditionals', topics: ['mixed_conditionals'], description: 'Blending time frames across conditionals.' },
    { week: 4, focus: 'Advanced Passives', topics: ['passive_complex'], description: 'Modal passives, continuous passives, reporting passives.' },
    { week: 5, focus: 'Wish / If Only', topics: ['wish_if_only'], description: 'Regrets (past), present wishes, irritation (would).' },
    { week: 6, focus: 'Advanced Reporting', topics: ['reported_speech'], description: 'Complex reporting verbs: suggest, warn, insist.' },
    { week: 7, focus: 'Advanced Relatives', topics: ['relative_clauses'], description: 'Preposition + which/whom; reduced relatives.' },
    { week: 8, focus: 'Gerunds vs Infinitives (Advanced)', topics: ['gerunds_infinitives'], description: 'Stop/remember/try + -ing vs to; perfect gerunds.' },
    { week: 9, focus: 'Modals: Past Deduction', topics: ['modals_advanced'], description: 'Must/can\'t/might have + pp.' },
    { week: 10, focus: 'Phrasal Verbs', topics: ['phrasal_verbs'], description: 'Common transitive and intransitive phrasal verbs.' },
    { week: 11, focus: 'Fronting & Emphasis', topics: ['fronting'], description: 'Fronting adverbs, so/such + result clauses.' },
    { week: 12, focus: 'Review B1+ & Assessment', topics: ['conditionals_2', 'conditionals_3', 'passive_complex', 'wish_if_only'], description: 'Upper-intermediate consolidation and B2 preview.' },
  ],
  B2: [
    { week: 1, focus: 'Inversion', topics: ['inversion'], description: 'Negative adverbials: never/rarely/not only/no sooner.' },
    { week: 2, focus: 'Cleft Sentences', topics: ['cleft_sentences'], description: "It was... who/that; What I need is..." },
    { week: 3, focus: 'Subjunctive', topics: ['subjunctive'], description: 'Mandative subjunctive after suggest/recommend/insist.' },
    { week: 4, focus: 'Advanced Conditionals', topics: ['conditionals_3', 'mixed_conditionals'], description: 'Conditional inversion; mixed and implied conditionals.' },
    { week: 5, focus: 'Advanced Passives', topics: ['passive_complex'], description: 'Passive reporting structures; passive with get.' },
    { week: 6, focus: 'Ellipsis & Substitution', topics: ['ellipsis'], description: 'Reducing repetition; substitution with so/not/do so.' },
    { week: 7, focus: 'Advanced Modal Verbs', topics: ['modals_advanced'], description: 'Should/needn\'t have; dare; be supposed to.' },
    { week: 8, focus: 'Advanced Relative Clauses', topics: ['relative_clauses'], description: "Sentential relatives; prepositions before whom/which." },
    { week: 9, focus: 'Discourse Markers', topics: ['fronting', 'determiners'], description: 'Linking, sequencing, contrast, concession.' },
    { week: 10, focus: 'Wish & Unreal Past', topics: ['wish_if_only'], description: 'It\'s time / I\'d rather + past; as if + unreal.' },
    { week: 11, focus: 'Gerunds & Infinitives (C1 Prep)', topics: ['gerunds_infinitives'], description: 'Perfect infinitives; passive gerunds; subject raising.' },
    { week: 12, focus: 'Review B2 & C1 Readiness', topics: ['inversion', 'cleft_sentences', 'subjunctive', 'passive_complex'], description: 'CAE-style mixed grammar and C1 bridge.' },
  ],
  C1: [
    { week: 1, focus: 'Inversion (Advanced)', topics: ['inversion'], description: 'Conditional inversion (Had/Were/Should); concessive inversion.' },
    { week: 2, focus: 'Cleft & Pseudo-cleft', topics: ['cleft_sentences'], description: 'Complex emphasis with it-clefts and wh-clefts.' },
    { week: 3, focus: 'Subjunctive & Mandative', topics: ['subjunctive'], description: 'Formal subjunctive in contemporary English.' },
    { week: 4, focus: 'Ellipsis & Substitution', topics: ['ellipsis'], description: 'Complex ellipsis in spoken and written registers.' },
    { week: 5, focus: 'Advanced Passives', topics: ['passive_complex'], description: 'Passive reporting; passive infinitives; get-passives.' },
    { week: 6, focus: 'Complex Modals', topics: ['modals_advanced'], description: 'Hedging, distancing, and nuanced deduction.' },
    { week: 7, focus: 'Fronting & Information Structure', topics: ['fronting', 'inversion'], description: 'Theme and rheme; fronted adjectives; so/such inversion.' },
    { week: 8, focus: 'Advanced Conditionals', topics: ['conditionals_3', 'mixed_conditionals', 'wish_if_only'], description: 'Implicit conditionals; mixed and inverted forms.' },
    { week: 9, focus: 'Register & Style', topics: ['subjunctive', 'ellipsis'], description: 'Formal vs informal grammar; stylistic choices.' },
    { week: 10, focus: 'Complex Relative Clauses', topics: ['relative_clauses'], description: 'Reduced relatives; sentential relatives; cleft with where/when.' },
    { week: 11, focus: 'C1 Grammar in Context', topics: ['inversion', 'cleft_sentences', 'passive_complex', 'modals_advanced'], description: 'Applying C1 structures in extended writing and speaking.' },
    { week: 12, focus: 'C2 Preview & Review', topics: ['inversion', 'cleft_sentences', 'subjunctive', 'fronting'], description: 'Mastery review and introduction to C2 features.' },
  ],
};

// ── Learning program generator ─────────────────────────────────

export function generateLearningProgram(
  placedLevel: LessonLevel,
  weakAreas: WeakArea[],
): LearningProgram {
  const baseWeeks = LEVEL_PROGRAM[placedLevel] ?? LEVEL_PROGRAM['A1'];

  // Overlay weak-area topics into the first 6 weeks (insert as co-focus)
  const weeks: WeekPlan[] = baseWeeks.map((week) => {
    if (week.week > 6 || weakAreas.length === 0) return week;

    const weakIdx = week.week - 1;
    const weakArea = weakAreas[weakIdx];
    if (!weakArea) return week;

    // Inject the weak topic into this week if it's not already there
    const alreadyPresent = week.topics.includes(weakArea.topic);
    if (alreadyPresent) return week;

    return {
      ...week,
      topics: [weakArea.topic, ...week.topics],
      description: `${week.description} Extra focus on ${TOPIC_LABELS[weakArea.topic] ?? weakArea.topic} (${weakArea.pct}% accuracy).`,
    };
  });

  return {
    placedLevel,
    weakAreas,
    weeks,
    generatedAt: new Date().toISOString(),
  };
}

// ── Consecutive error check ────────────────────────────────────

export const MAX_CONSECUTIVE_ERRORS = 6;

export function shouldStopTest(answers: PlacementAnswer[]): boolean {
  if (answers.length < MAX_CONSECUTIVE_ERRORS) return false;
  const last = answers.slice(-MAX_CONSECUTIVE_ERRORS);
  return last.every((a) => !a.correct);
}
