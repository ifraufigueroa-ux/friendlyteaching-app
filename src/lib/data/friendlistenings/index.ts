// Friendlistenings® — lesson registry.
//
// Every Friendlistenings lesson lands here so the index pages (student +
// teacher) and the runner can discover them without a filesystem walk.

import type { FLLesson } from '@/types/friendlistenings';
import { lessonB2OffTheBeatenPath } from './b2-off-the-beaten-path';

export const FRIENDLISTENINGS_LESSONS: FLLesson[] = [
  lessonB2OffTheBeatenPath,
];

export function getFriendlisteningsLesson(id: string): FLLesson | undefined {
  return FRIENDLISTENINGS_LESSONS.find(l => l.id === id);
}
