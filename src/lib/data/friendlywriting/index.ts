// FriendlyWriting® — lesson registry.
//
// Every FriendlyWriting lesson lands here so catalog pages (student +
// teacher) and the runner can discover them without a filesystem walk.
// Ordered by CEFR level so the catalog reads naturally from easiest up.

import type { FWLesson } from '@/types/friendlywriting';
import { lessonA2EmailNewFlat } from './a2-email-new-flat';
import { lessonB1LetterPauseGym } from './b1-letter-pause-gym';

export const FRIENDLYWRITING_LESSONS: FWLesson[] = [
  lessonA2EmailNewFlat,
  lessonB1LetterPauseGym,
];

export function getFriendlywritingLesson(id: string): FWLesson | undefined {
  return FRIENDLYWRITING_LESSONS.find(l => l.id === id);
}
