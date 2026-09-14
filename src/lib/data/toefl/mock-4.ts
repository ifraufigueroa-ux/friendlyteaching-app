// TOEFL Mock 4 — Physical sciences + music history pairing.

import type { TOEFLMock } from '@/types/toefl';
import { passage7 } from './reading/passage-7';
import { passage8 } from './reading/passage-8';
import { lecture4 } from './listening/lecture-4';
import { conversation4 } from './listening/conversation-4';
import { speakingPromptsMock4 } from './speaking/independent-prompts';
import { writingPromptMock4 } from './writing/academic-discussion';
import { buildSentenceMock4 } from './writing/build-sentence';
import { emailPromptMock4 } from './writing/email';

export const toeflMock4: TOEFLMock = {
  id:        'mock-4',
  title:     'Mock 4 · Physical sciences & music history',
  reading:   [passage7, passage8],
  listening: [lecture4, conversation4],
  speaking:  speakingPromptsMock4,
  writing:   {
    buildSentence: buildSentenceMock4,
    email:         emailPromptMock4,
    discussion:    writingPromptMock4,
  },
};
