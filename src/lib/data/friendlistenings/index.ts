// Friendlistenings® — lesson registry.
//
// Every Friendlistenings lesson lands here so the index pages (student +
// teacher) and the runner can discover them without a filesystem walk.
// Ordered by CEFR level, then by date, so the catalog reads naturally
// from easiest to hardest.

import type { FLLesson } from '@/types/friendlistenings';
import { lessonA2TheNewNeighbor } from './a2-the-new-neighbor';
import { lessonA2LostPhoneCafe } from './a2-lost-phone-cafe';
import { lessonA2RestaurantCasaVerde } from './a2-restaurant-casa-verde';
import { lessonA2WeekendInPuertoVaras } from './a2-weekend-in-puerto-varas';
import { lessonB1BakeryCatchUp } from './b1-bakery-catch-up';
import { lessonB1FirstWeekNewJob } from './b1-first-week-new-job';
import { lessonB1SurpriseParty } from './b1-surprise-party';
import { lessonB1LogisticsConsultancySprintSlip } from './b1-logistics-consultancy-sprint-slip';
import { lessonB1WhichGymShouldIJoin } from './b1-which-gym-should-i-join';
import { lessonB1PlusTmsCutoverSlip } from './b1plus-tms-cutover-slip';
import { lessonB1PlusAirplaneCargoHotSalmon } from './b1plus-airplane-cargo-hot-salmon';
import { lessonB1OgmpIntroClass01 } from './b1-ogmp-intro-class-01';
import { lessonB1OgmpMitigationClass02 } from './b1-ogmp-mitigation-class-02';
import { lessonB2OffTheBeatenPath } from './b2-off-the-beaten-path';
import { lessonB2JobOfferDilemma } from './b2-job-offer-dilemma';
import { lessonB2AtcGoAround } from './b2-atc-go-around';
import { lessonB2PlusDevSupplyChainAttack } from './b2plus-dev-supply-chain-attack';
import { lessonB2PlusVendorInvoiceFraud } from './b2plus-vendor-invoice-fraud';
import { lessonC1LastPromotion } from './c1-last-promotion';
import { lessonC1SalmonVaccineTrial } from './c1-salmon-vaccine-trial';

export const FRIENDLISTENINGS_LESSONS: FLLesson[] = [
  lessonA2TheNewNeighbor,
  lessonA2LostPhoneCafe,
  lessonA2RestaurantCasaVerde,   // late-A2: ordering + sharing + splitting the bill
  lessonA2WeekendInPuertoVaras,  // late-A2: past-simple trip story with reactions
  lessonB1BakeryCatchUp, // A2 → B1 bridge: entry B1, placed first in B1 group
  lessonB1FirstWeekNewJob,
  lessonB1SurpriseParty,
  lessonB1LogisticsConsultancySprintSlip,
  lessonB1OgmpIntroClass01,      // B1: OGMP 2.0 primer for engineers — what it is, levels, assets, baseline year (Class 1)
  lessonB1OgmpMitigationClass02, // B1: OGMP 2.0 methane mitigation for gas-transport engineers (Class 2)
  lessonB1WhichGymShouldIJoin,
  lessonB1PlusTmsCutoverSlip,
  lessonB1PlusAirplaneCargoHotSalmon, // B1+: air-cargo duty manager works a tight turnaround
  lessonB2OffTheBeatenPath,
  lessonB2JobOfferDilemma,
  lessonB2AtcGoAround,      // B2: ATC debrief after an aborted landing
  lessonB2PlusDevSupplyChainAttack,
  lessonB2PlusVendorInvoiceFraud,      // B2+: BEC / vendor-email compromise · 5 phrasal verbs anchored in vocab
  lessonC1LastPromotion,
  lessonC1SalmonVaccineTrial,
];

export function getFriendlisteningsLesson(id: string): FLLesson | undefined {
  return FRIENDLISTENINGS_LESSONS.find(l => l.id === id);
}
