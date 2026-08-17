// TOEFL Mock 2 — Life sciences + humanities pairing.

import type { TOEFLMock } from '@/types/toefl';
import { passage3 } from './reading/passage-3';
import { passage4 } from './reading/passage-4';
import { lecture2 } from './listening/lecture-2';
import { conversation2 } from './listening/conversation-2';
import { speakingPromptsMock2 } from './speaking/independent-prompts';
import { writingPromptMock2 } from './writing/academic-discussion';

export const toeflMock2: TOEFLMock = {
  id:        'mock-2',
  title:     'Mock 2 · Life sciences & humanities',
  reading:   [passage3, passage4],
  listening: [lecture2, conversation2],
  speaking:  speakingPromptsMock2,
  writing:   writingPromptMock2,
};
