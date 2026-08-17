// TOEFL Mock 3 — Earth & anthropology pairing.

import type { TOEFLMock } from '@/types/toefl';
import { passage5 } from './reading/passage-5';
import { passage6 } from './reading/passage-6';
import { lecture3 } from './listening/lecture-3';
import { conversation3 } from './listening/conversation-3';
import { speakingPromptsMock3 } from './speaking/independent-prompts';
import { writingPromptMock3 } from './writing/academic-discussion';

export const toeflMock3: TOEFLMock = {
  id:        'mock-3',
  title:     'Mock 3 · Earth & anthropology',
  reading:   [passage5, passage6],
  listening: [lecture3, conversation3],
  speaking:  speakingPromptsMock3,
  writing:   writingPromptMock3,
};
