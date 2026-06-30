// FriendlyTeaching.cl — Q&A Simulator registry
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │ To add a new Q&A simulation:                                        │
// │   1. Drop a .json file in this folder matching QASimulation shape   │
// │   2. Import it below and add it to QA_SIMULATIONS                   │
// └─────────────────────────────────────────────────────────────────────┘

import type { QASimulation } from './types';
import wellbeingNature from './wellbeing-nature.json';

export const QA_SIMULATIONS: QASimulation[] = [
  wellbeingNature as QASimulation,
];

export function getSimulation(id: string): QASimulation | undefined {
  return QA_SIMULATIONS.find(s => s.id === id);
}

export * from './types';
