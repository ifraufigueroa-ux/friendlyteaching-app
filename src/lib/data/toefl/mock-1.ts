// TOEFL Mock 1 — Introductory. Aggregates the four sections into a single
// TOEFLMock object the runner can consume.

import type { TOEFLMock } from '@/types/toefl';
import { passage1 } from './reading/passage-1';
import { passage2 } from './reading/passage-2';
import { lecture1 } from './listening/lecture-1';
import { conversation1 } from './listening/conversation-1';
import { speakingPromptsMock1 } from './speaking/independent-prompts';
import { writingPromptMock1 } from './writing/academic-discussion';

export const toeflMock1: TOEFLMock = {
  id:        'mock-1',
  title:     'Mock 1 · Introductory',
  reading:   [passage1, passage2],
  listening: [lecture1, conversation1],
  speaking:  speakingPromptsMock1,
  writing:   writingPromptMock1,
};

export const TOEFL_MOCKS: TOEFLMock[] = [toeflMock1];

export function getMock(id: string): TOEFLMock | undefined {
  return TOEFL_MOCKS.find(m => m.id === id);
}
