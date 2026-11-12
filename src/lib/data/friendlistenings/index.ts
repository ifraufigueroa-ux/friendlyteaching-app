// Friendlistenings® — lesson registry.
//
// Every Friendlistenings lesson lands here so the index pages (student +
// teacher) and the runner can discover them without a filesystem walk.
// Ordered by CEFR level, then by date, so the catalog reads naturally
// from easiest to hardest.

import type { FLLesson } from '@/types/friendlistenings';
import { lessonA2TheNewNeighbor } from './a2-the-new-neighbor';
import { lessonA2LostPhoneCafe } from './a2-lost-phone-cafe';
import { lessonB1FirstWeekNewJob } from './b1-first-week-new-job';
import { lessonB1SurpriseParty } from './b1-surprise-party';
import { lessonB1LogisticsConsultancySprintSlip } from './b1-logistics-consultancy-sprint-slip';
import { lessonB2OffTheBeatenPath } from './b2-off-the-beaten-path';
import { lessonB2JobOfferDilemma } from './b2-job-offer-dilemma';
import { lessonC1LastPromotion } from './c1-last-promotion';
import { lessonC1SalmonVaccineTrial } from './c1-salmon-vaccine-trial';

export const FRIENDLISTENINGS_LESSONS: FLLesson[] = [
  lessonA2TheNewNeighbor,
  lessonA2LostPhoneCafe,
  lessonB1FirstWeekNewJob,
  lessonB1SurpriseParty,
  lessonB1LogisticsConsultancySprintSlip,
  lessonB2OffTheBeatenPath,
  lessonB2JobOfferDilemma,
  lessonC1LastPromotion,
  lessonC1SalmonVaccineTrial,
];

export function getFriendlisteningsLesson(id: string): FLLesson | undefined {
  return FRIENDLISTENINGS_LESSONS.find(l => l.id === id);
}
