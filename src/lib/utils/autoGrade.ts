// FriendlyTeaching.cl — Auto-grading engine for homework slides
// Scores answers for: multiple_choice, true_false, matching, selection, drag_drop
// Returns per-slide scores + overall percentage. Non-gradeable types are skipped.

import type { Slide, MatchingPair } from '@/types/firebase';

export interface SlideGradeResult {
  slideIndex: number;
  slideType: string;
  isCorrect: boolean;
  studentAnswer: unknown;
  correctAnswer: unknown;
  /** Optional explanation shown to student */
  explanation?: string;
}

export interface GradeResult {
  results: SlideGradeResult[];
  totalGradeable: number;
  totalCorrect: number;
  /** 0–100 percentage */
  percentage: number;
  /** 1–7 FT scale */
  score7: number;
}

/**
 * Grades a student's submitted answers against the homework slides.
 * @param slides  The slide definitions (with correct answers)
 * @param answers The student's submitted answers keyed by slide index
 */
export function autoGrade(
  slides: Slide[],
  answers: Record<string, unknown>,
): GradeResult {
  const results: SlideGradeResult[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const studentAnswer = answers[String(i)];

    // Skip non-gradeable slide types or slides without student answers
    if (!isGradeable(slide.type) || studentAnswer === undefined || studentAnswer === null) {
      continue;
    }

    const result = gradeSlide(slide, studentAnswer, i);
    if (result) results.push(result);
  }

  const totalGradeable = results.length;
  const totalCorrect = results.filter((r) => r.isCorrect).length;
  const percentage = totalGradeable > 0 ? Math.round((totalCorrect / totalGradeable) * 100) : 0;
  // Map percentage to 1–7 scale
  const score7 = Math.max(1, Math.round(1 + (percentage / 100) * 6));

  return { results, totalGradeable, totalCorrect, percentage, score7 };
}

function isGradeable(type: string): boolean {
  return ['multiple_choice', 'true_false', 'matching', 'selection', 'drag_drop', 'cloze_test', 'sorting'].includes(type);
}

function gradeSlide(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult | null {
  switch (slide.type) {
    case 'multiple_choice':
      return gradeMultipleChoice(slide, studentAnswer, index);
    case 'true_false':
      return gradeTrueFalse(slide, studentAnswer, index);
    case 'matching':
      return gradeMatching(slide, studentAnswer, index);
    case 'selection':
      return gradeSelection(slide, studentAnswer, index);
    case 'drag_drop':
      return gradeDragDrop(slide, studentAnswer, index);
    case 'cloze_test':
      return gradeCloze(slide, studentAnswer, index);
    case 'sorting':
      return gradeSorting(slide, studentAnswer, index);
    default:
      return null;
  }
}

// ── Multiple Choice ──────────────────────────────────────────

function gradeMultipleChoice(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const options = slide.options ?? [];
  const correctIdx = options.findIndex((o) => o.isCorrect);
  const correctText = correctIdx >= 0 ? options[correctIdx].text : slide.correctAnswer ?? '';

  // Student might submit index (number) or text (string)
  let isCorrect = false;
  if (typeof studentAnswer === 'number') {
    isCorrect = studentAnswer === correctIdx;
  } else if (typeof studentAnswer === 'string') {
    isCorrect = studentAnswer.toLowerCase().trim() === correctText.toLowerCase().trim();
  }

  return {
    slideIndex: index,
    slideType: 'multiple_choice',
    isCorrect,
    studentAnswer,
    correctAnswer: correctText,
    explanation: isCorrect ? undefined : `La respuesta correcta es: ${correctText}`,
  };
}

// ── True/False ───────────────────────────────────────────────

function gradeTrueFalse(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const correctBool = (slide.correctAnswer as unknown) === true || slide.correctAnswer === 'true';
  let studentBool: boolean;
  if (typeof studentAnswer === 'boolean') {
    studentBool = studentAnswer;
  } else {
    studentBool = String(studentAnswer).toLowerCase() === 'true';
  }

  const isCorrect = studentBool === correctBool;
  return {
    slideIndex: index,
    slideType: 'true_false',
    isCorrect,
    studentAnswer: studentBool,
    correctAnswer: correctBool,
    explanation: isCorrect ? undefined : `La respuesta correcta es: ${correctBool ? 'Verdadero' : 'Falso'}`,
  };
}

// ── Matching ─────────────────────────────────────────────────

function gradeMatching(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const pairs = slide.pairs ?? [];
  if (pairs.length === 0) return { slideIndex: index, slideType: 'matching', isCorrect: false, studentAnswer, correctAnswer: pairs };

  // Student submits as Record<string, string> mapping left→right
  const studentPairs = (studentAnswer ?? {}) as Record<string, string>;
  let correct = 0;
  for (const pair of pairs) {
    const studentRight = studentPairs[pair.left];
    if (studentRight && studentRight.toLowerCase().trim() === pair.right.toLowerCase().trim()) {
      correct++;
    }
  }

  const isCorrect = correct === pairs.length;
  return {
    slideIndex: index,
    slideType: 'matching',
    isCorrect,
    studentAnswer: studentPairs,
    correctAnswer: pairs.reduce((acc: Record<string, string>, p: MatchingPair) => { acc[p.left] = p.right; return acc; }, {}),
    explanation: isCorrect ? undefined : `${correct}/${pairs.length} pares correctos`,
  };
}

// ── Selection ────────────────────────────────────────────────

function gradeSelection(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const options = slide.options ?? [];
  const prompts = slide.content?.split('|').map((p) => p.trim()).filter(Boolean) ?? [];
  const correctParts = slide.correctAnswer?.split('|').map((s) => s.trim()) ?? [];

  // Student submits as Record<number, number> (promptIndex → optionIndex)
  const studentSelections = (studentAnswer ?? {}) as Record<string, number>;
  let correct = 0;
  const total = Math.max(prompts.length, 1);

  for (let pi = 0; pi < total; pi++) {
    const studentIdx = studentSelections[String(pi)];
    const correctPart = correctParts[pi] ?? correctParts[0] ?? '';

    // Correct answer might be index or text
    let correctIdx: number;
    if (/^\d+$/.test(correctPart)) {
      correctIdx = parseInt(correctPart, 10);
    } else {
      correctIdx = options.findIndex((o) => o.text.toLowerCase() === correctPart.toLowerCase());
      if (correctIdx < 0) correctIdx = options.findIndex((o) => o.isCorrect);
    }

    if (studentIdx === correctIdx) correct++;
  }

  const isCorrect = correct === total;
  return {
    slideIndex: index,
    slideType: 'selection',
    isCorrect,
    studentAnswer: studentSelections,
    correctAnswer: correctParts,
    explanation: isCorrect ? undefined : `${correct}/${total} respuestas correctas`,
  };
}

// ── Drag & Drop ──────────────────────────────────────────────

function gradeDragDrop(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const correct = slide.correctAnswer ?? '';

  // Student submits as string[] (ordered words) or joined string
  let studentStr: string;
  if (Array.isArray(studentAnswer)) {
    studentStr = studentAnswer.join(' ');
  } else {
    studentStr = String(studentAnswer ?? '');
  }

  // Compare as sorted word sets (order-insensitive, matching the slide component fix)
  const studentWords = studentStr.toLowerCase().split(/\s+/).filter(Boolean).sort().join(' ');
  const correctWords = correct.toLowerCase().split(/\s+/).filter(Boolean).sort().join(' ');
  const isCorrect = studentWords === correctWords;

  return {
    slideIndex: index,
    slideType: 'drag_drop',
    isCorrect,
    studentAnswer: studentStr,
    correctAnswer: correct,
    explanation: isCorrect ? undefined : `Respuesta correcta: ${correct}`,
  };
}

// ── Cloze Test ───────────────────────────────────────────────

function gradeCloze(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const correctAnswers = (slide.correctAnswer ?? '').split('|').map((s) => s.trim().toLowerCase());
  const studentAnswers = (studentAnswer ?? {}) as Record<string, string>;

  let correct = 0;
  const total = correctAnswers.length;
  for (let i = 0; i < total; i++) {
    if ((studentAnswers[String(i)] ?? '').toLowerCase().trim() === correctAnswers[i]) {
      correct++;
    }
  }

  const isCorrect = correct === total;
  return {
    slideIndex: index,
    slideType: 'cloze_test',
    isCorrect,
    studentAnswer: studentAnswers,
    correctAnswer: correctAnswers,
    explanation: isCorrect ? undefined : `${correct}/${total} espacios correctos`,
  };
}

// ── Sorting ──────────────────────────────────────────────────

function gradeSorting(slide: Slide, studentAnswer: unknown, index: number): SlideGradeResult {
  const correctMapping = (slide.correctAnswer ?? '').split('|').map((s) => parseInt(s.trim(), 10));
  const studentPlacements = (studentAnswer ?? {}) as Record<string, number>;
  const items = slide.blanks ?? [];

  let correct = 0;
  for (let i = 0; i < items.length; i++) {
    if (studentPlacements[String(i)] === correctMapping[i]) correct++;
  }

  const isCorrect = correct === items.length;
  return {
    slideIndex: index,
    slideType: 'sorting',
    isCorrect,
    studentAnswer: studentPlacements,
    correctAnswer: correctMapping,
    explanation: isCorrect ? undefined : `${correct}/${items.length} items bien clasificados`,
  };
}
