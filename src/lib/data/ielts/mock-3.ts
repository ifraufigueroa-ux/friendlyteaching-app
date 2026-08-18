// FriendlyTeaching.cl — IELTS GT Mock 3 (definición canónica)
//
// Temas del Mock 3 (media + generaciones en el eje):
// - Listening: music school, community garden, thesis meeting, microgrids
// - Reading:   library + adult courses, employee wellness, chess history
// - Writing:   T1 GT semi-formal (time off) + T2 tourism benefits
// - Speaking:  P1 music/movies/social-media, cue "meaningful song", P3 music/media

import { listeningMock3 } from '@/lib/data/ielts/listeningMock3';
import { readingGtMock3 } from '@/lib/data/ielts/reading/gtMock3';
import { getPrompt } from '@/lib/data/ielts/writing';
import { IELTS_CUE_CARDS } from '@/lib/data/ieltsCueCards';
import { IELTS_PART1_TOPICS } from '@/lib/data/ieltsPart1Topics';
import { IELTS_PART3_QUESTIONS } from '@/lib/data/ieltsPart3Questions';
import type { GTTask1Prompt, Task2Prompt } from '@/types/ielts-writing';
import type { IELTSMock } from '@/lib/data/ielts/mock-1';

export const IELTS_MOCK_3_IDS = {
  listeningMockId: 'listening-mock-3',
  readingMockId:   'reading-gt-mock-3',

  writingTask1Id:  'gt-t1-03-request-time-off',
  writingTask2Id:  'gt-t2-07-tourism-benefits',

  speakingPart1TopicIds: ['music', 'movies', 'social-media'] as const,
  speakingCueCardId:     'meaningful-song',
  speakingPart3Questions: [
    { band: 7, question: 'Why does music from different generations sound so different?' },
    { band: 7, question: 'Do you think traditional newspapers will disappear in the future?' },
    { band: 7, question: 'How can people tell whether the news they read online is reliable?' },
    { band: 8, question: 'In what ways does music reflect the values of a particular generation?' },
    { band: 8, question: 'How do news outlets shape public opinion on political issues?' },
  ] as const,
} as const;

function pickWritingT1(): GTTask1Prompt {
  const p = getPrompt(IELTS_MOCK_3_IDS.writingTask1Id);
  if (!p || p.task !== 1) throw new Error(`Mock 3 T1 no encontrado: ${IELTS_MOCK_3_IDS.writingTask1Id}`);
  return p as GTTask1Prompt;
}
function pickWritingT2(): Task2Prompt {
  const p = getPrompt(IELTS_MOCK_3_IDS.writingTask2Id);
  if (!p || p.task !== 2) throw new Error(`Mock 3 T2 no encontrado: ${IELTS_MOCK_3_IDS.writingTask2Id}`);
  return p as Task2Prompt;
}
function pickCueCard() {
  const c = IELTS_CUE_CARDS.find(x => x.id === IELTS_MOCK_3_IDS.speakingCueCardId);
  if (!c) throw new Error(`Mock 3 cue card no encontrada: ${IELTS_MOCK_3_IDS.speakingCueCardId}`);
  return c;
}
function pickPart1() {
  return IELTS_MOCK_3_IDS.speakingPart1TopicIds.map((id) => {
    const t = IELTS_PART1_TOPICS.find(x => x.id === id);
    if (!t) throw new Error(`Mock 3 Part 1 topic no encontrado: ${id}`);
    return t;
  });
}
function pickPart3() {
  return IELTS_MOCK_3_IDS.speakingPart3Questions.map((ref) => {
    const q = IELTS_PART3_QUESTIONS.find(x => x.band === ref.band && x.question === ref.question);
    if (!q) throw new Error(`Mock 3 P3 question no encontrada: "${ref.question}" (band ${ref.band})`);
    return q;
  });
}

export const ieltsMock3: IELTSMock = {
  id:        'ielts-mock-3',
  title:     'IELTS GT · Mock 3',
  listening: listeningMock3,
  reading:   readingGtMock3,
  writing:   { task1: pickWritingT1(), task2: pickWritingT2() },
  speaking:  { part1: pickPart1(), cueCard: pickCueCard(), part3: pickPart3() },
};
