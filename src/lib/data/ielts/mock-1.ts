// FriendlyTeaching.cl — IELTS GT Mock 1 (definición canónica)
//
// Junta piezas ya existentes de cada sección bajo una etiqueta "Mock 1"
// para que cualquier estudiante que "haga Mock 1" pase por el mismo
// contenido en las 4 secciones. Listening y Reading ya tenían mock-1
// completo; Writing y Speaking se toman de los pools con los IDs de
// abajo.
//
// La UI de simulador (/dashboard/teacher/ielts/*) sigue eligiendo del
// pool completo por ahora; este archivo es la fuente de verdad si
// después queremos wiring de "Full Mock 1" o generar reportes.

import { listeningMock1 } from '@/lib/data/ielts/listeningMock1';
import { readingGtMock1 } from '@/lib/data/ielts/reading/gtMock1';
import { getPrompt } from '@/lib/data/ielts/writing';
import { IELTS_CUE_CARDS, type CueCard } from '@/lib/data/ieltsCueCards';
import { IELTS_PART1_TOPICS, type Part1Topic } from '@/lib/data/ieltsPart1Topics';
import { IELTS_PART3_QUESTIONS, type Part3Question } from '@/lib/data/ieltsPart3Questions';
import type { ListeningMock } from '@/types/ielts';
import type { ReadingMock } from '@/types/ielts-reading';
import type { GTTask1Prompt, Task2Prompt } from '@/types/ielts-writing';

// ─── Mock 1: composición ───────────────────────────────────────────

/** IDs de las piezas que componen el mock. Cambiar acá reordena el
 *  contenido del Mock 1 sin tocar los pools. */
export const IELTS_MOCK_1_IDS = {
  // Listening y Reading tienen un solo mock por ahora, así que apuntan
  // al objeto entero.
  listeningMockId: 'listening-mock-1',
  readingMockId:   'reading-gt-mock-1',

  // Writing GT Mock 1: carta de queja al hotel + ensayo sobre
  // tecnología y comunicación. Combinación balanceada para band 6-7.
  writingTask1Id:  'gt-t1-01-hotel-complaint',
  writingTask2Id:  't2-01-tech-communication',

  // Speaking Mock 1: Part 1 warm-up + cue card sobre viajes +
  // Part 3 alrededor del mismo eje (viajes, cultura, tecnología en
  // el viaje) en band 7.
  speakingPart1TopicIds: ['work-studies', 'hometown', 'travel'] as const,
  speakingCueCardId:     'memorable-trip',
  /** Preguntas Part 3 identificadas por band + texto exacto (los items
   *  de Part 3 no tienen id propio en el pool). */
  speakingPart3Questions: [
    { band: 7, question: 'What kinds of trips tend to leave the strongest memories?' },
    { band: 7, question: 'How are big cities and small towns different in your country?' },
    { band: 7, question: 'How has technology changed the way people communicate in the last twenty years?' },
    { band: 8, question: 'How can significant journeys reshape a person\'s view of the world?' },
    { band: 8, question: 'What are the cultural costs of mass tourism on host communities?' },
  ] as const,
} as const;

// ─── Resolvers ────────────────────────────────────────────────────

/** Devuelve el prompt de Writing Task 1 del Mock 1 o lanza si no lo
 *  encuentra (indica un bug: el ID del pool cambió). */
export function getMock1WritingTask1(): GTTask1Prompt {
  const p = getPrompt(IELTS_MOCK_1_IDS.writingTask1Id);
  if (!p || p.task !== 1) {
    throw new Error(`Mock 1 writing Task 1 no encontrado: ${IELTS_MOCK_1_IDS.writingTask1Id}`);
  }
  return p as GTTask1Prompt;
}

export function getMock1WritingTask2(): Task2Prompt {
  const p = getPrompt(IELTS_MOCK_1_IDS.writingTask2Id);
  if (!p || p.task !== 2) {
    throw new Error(`Mock 1 writing Task 2 no encontrado: ${IELTS_MOCK_1_IDS.writingTask2Id}`);
  }
  return p as Task2Prompt;
}

export function getMock1CueCard(): CueCard {
  const c = IELTS_CUE_CARDS.find(x => x.id === IELTS_MOCK_1_IDS.speakingCueCardId);
  if (!c) throw new Error(`Mock 1 cue card no encontrada: ${IELTS_MOCK_1_IDS.speakingCueCardId}`);
  return c;
}

export function getMock1Part1Topics(): Part1Topic[] {
  return IELTS_MOCK_1_IDS.speakingPart1TopicIds.map((id) => {
    const t = IELTS_PART1_TOPICS.find(x => x.id === id);
    if (!t) throw new Error(`Mock 1 Part 1 topic no encontrado: ${id}`);
    return t;
  });
}

export function getMock1Part3Questions(): Part3Question[] {
  return IELTS_MOCK_1_IDS.speakingPart3Questions.map((ref) => {
    const q = IELTS_PART3_QUESTIONS.find(x => x.band === ref.band && x.question === ref.question);
    if (!q) throw new Error(`Mock 1 Part 3 question no encontrada: "${ref.question}" (band ${ref.band})`);
    return q;
  });
}

// ─── Full mock aggregate ──────────────────────────────────────────

export interface IELTSMockWriting {
  task1: GTTask1Prompt;
  task2: Task2Prompt;
}

export interface IELTSMockSpeaking {
  part1: Part1Topic[];
  cueCard: CueCard;
  part3: Part3Question[];
}

export interface IELTSMock {
  id:        string;
  title:     string;
  listening: ListeningMock;
  reading:   ReadingMock;
  writing:   IELTSMockWriting;
  speaking:  IELTSMockSpeaking;
}

export const ieltsMock1: IELTSMock = {
  id:        'ielts-mock-1',
  title:     'IELTS GT · Mock 1',
  listening: listeningMock1,
  reading:   readingGtMock1,
  writing: {
    task1: getMock1WritingTask1(),
    task2: getMock1WritingTask2(),
  },
  speaking: {
    part1:   getMock1Part1Topics(),
    cueCard: getMock1CueCard(),
    part3:   getMock1Part3Questions(),
  },
};

/** Registry — por ahora un solo mock, replica el patrón de TOEFL_MOCKS
 *  para que agregar Mock 2/3 más adelante sea trivial. */
export const IELTS_MOCKS: IELTSMock[] = [ieltsMock1];

export function getIeltsMock(id: string): IELTSMock | undefined {
  return IELTS_MOCKS.find(m => m.id === id);
}
