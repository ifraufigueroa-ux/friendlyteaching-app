// Friendlistenings® — lesson registry.
//
// Every Friendlistenings lesson lands here so the index pages (student +
// teacher) and the runner can discover them without a filesystem walk.
// Ordered by CEFR level so the catalog reads naturally from easiest to
// hardest.

import type { FLLesson } from '@/types/friendlistenings';
import { lessonA2TheNewNeighbor } from './a2-the-new-neighbor';
import { lessonB1FirstWeekNewJob } from './b1-first-week-new-job';
import { lessonB2OffTheBeatenPath } from './b2-off-the-beaten-path';

export const FRIENDLISTENINGS_LESSONS: FLLesson[] = [
  lessonA2TheNewNeighbor,
  lessonB1FirstWeekNewJob,
  lessonB2OffTheBeatenPath,
];

export function getFriendlisteningsLesson(id: string): FLLesson | undefined {
  return FRIENDLISTENINGS_LESSONS.find(l => l.id === id);
}
