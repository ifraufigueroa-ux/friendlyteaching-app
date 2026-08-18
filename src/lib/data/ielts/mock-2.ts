// FriendlyTeaching.cl — IELTS GT Mock 2 (definición canónica)
//
// Mismo patrón que mock-1.ts: junta piezas ya escritas de cada sección
// bajo una etiqueta "Mock 2" para que cualquier estudiante pase por el
// mismo contenido en las 4 secciones.
//
// Temas del Mock 2 (skills + tecnología en el eje):
// - Listening: cabaña, jardín botánico, air-quality research, songbird migration
// - Reading:   lease + community centre, call-centre training, coffee cultivation
// - Writing:   T1 GT informal (new job, friend) + T2 environmental (plastic waste)
// - Speaking:  P1 books/technology/food, cue "useful skill", P3 skills/tech

import { listeningMock2 } from '@/lib/data/ielts/listeningMock2';
import { readingGtMock2 } from '@/lib/data/ielts/reading/gtMock2';
import { getPrompt } from '@/lib/data/ielts/writing';
import { IELTS_CUE_CARDS } from '@/lib/data/ieltsCueCards';
import { IELTS_PART1_TOPICS } from '@/lib/data/ieltsPart1Topics';
import { IELTS_PART3_QUESTIONS } from '@/lib/data/ieltsPart3Questions';
import type { GTTask1Prompt, Task2Prompt } from '@/types/ielts-writing';
import type { IELTSMock } from '@/lib/data/ielts/mock-1';

export const IELTS_MOCK_2_IDS = {
  listeningMockId: 'listening-mock-2',
  readingMockId:   'reading-gt-mock-2',

  writingTask1Id:  'gt-t1-02-new-job-friend',
  writingTask2Id:  'gt-t2-04-plastic-waste',

  speakingPart1TopicIds: ['books', 'technology', 'food'] as const,
  speakingCueCardId:     'useful-skill',
  speakingPart3Questions: [
    { band: 7, question: 'Why are some skills harder to learn later in life?' },
    { band: 7, question: 'How has technology changed the way people communicate in the last twenty years?' },
    { band: 7, question: 'Should schools focus more on practical skills or academic subjects?' },
    { band: 8, question: 'Why do schools sometimes fail to teach the skills people really need in life?' },
    { band: 8, question: 'How might the role of teachers change as AI becomes more common in classrooms?' },
  ] as const,
} as const;

// Internal resolvers — throw at import time if any pool ID drifts, so we
// catch the mismatch at build rather than at first user session.
function pickWritingT1(): GTTask1Prompt {
  const p = getPrompt(IELTS_MOCK_2_IDS.writingTask1Id);
  if (!p || p.task !== 1) throw new Error(`Mock 2 T1 no encontrado: ${IELTS_MOCK_2_IDS.writingTask1Id}`);
  return p as GTTask1Prompt;
}
function pickWritingT2(): Task2Prompt {
  const p = getPrompt(IELTS_MOCK_2_IDS.writingTask2Id);
  if (!p || p.task !== 2) throw new Error(`Mock 2 T2 no encontrado: ${IELTS_MOCK_2_IDS.writingTask2Id}`);
  return p as Task2Prompt;
}
function pickCueCard() {
  const c = IELTS_CUE_CARDS.find(x => x.id === IELTS_MOCK_2_IDS.speakingCueCardId);
  if (!c) throw new Error(`Mock 2 cue card no encontrada: ${IELTS_MOCK_2_IDS.speakingCueCardId}`);
  return c;
}
function pickPart1() {
  return IELTS_MOCK_2_IDS.speakingPart1TopicIds.map((id) => {
    const t = IELTS_PART1_TOPICS.find(x => x.id === id);
    if (!t) throw new Error(`Mock 2 Part 1 topic no encontrado: ${id}`);
    return t;
  });
}
function pickPart3() {
  return IELTS_MOCK_2_IDS.speakingPart3Questions.map((ref) => {
    const q = IELTS_PART3_QUESTIONS.find(x => x.band === ref.band && x.question === ref.question);
    if (!q) throw new Error(`Mock 2 P3 question no encontrada: "${ref.question}" (band ${ref.band})`);
    return q;
  });
}

export const ieltsMock2: IELTSMock = {
  id:        'ielts-mock-2',
  title:     'IELTS GT · Mock 2',
  listening: listeningMock2,
  reading:   readingGtMock2,
  writing:   { task1: pickWritingT1(), task2: pickWritingT2() },
  speaking:  { part1: pickPart1(), cueCard: pickCueCard(), part3: pickPart3() },
};
