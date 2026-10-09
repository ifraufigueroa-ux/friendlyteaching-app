// FriendlyTeaching.cl — IELTS Mocks registry
//
// Single source of truth para saber cuántos mocks hay y cómo se
// llaman. Agregar un mock nuevo:
//   1. Crear src/lib/data/ielts/listeningMockN.ts + reading/gtMockN.ts
//   2. Crear src/lib/data/ielts/mock-N.ts que arme el aggregator
//   3. Importarlo abajo y agregarlo a IELTS_MOCKS
//
// El resto de la app (UI, scripts) lee todo desde acá, así que
// escala a 10+ mocks sin cambios en consumidores.

import { ieltsMock1 } from './mock-1';
import { ieltsMock2 } from './mock-2';
import { ieltsMock3 } from './mock-3';
import { listeningBeginnersMock1 } from './listeningBeginnersMock1';
import { listeningBeginnersMock2 } from './listeningBeginnersMock2';
import { listeningIntermediateMock1 } from './listeningIntermediateMock1';
import { listeningUpperIntermediateMock1 } from './listeningUpperIntermediateMock1';
import { listeningAdvancedMock1 } from './listeningAdvancedMock1';
import { readingBeginnersMock1 } from './reading/gtBeginnersMock1';
import type { IELTSMock } from './mock-1';
import type { ListeningMock } from '@/types/ielts';
import type { ReadingMock } from '@/types/ielts-reading';

export type { IELTSMock };

export const IELTS_MOCKS: IELTSMock[] = [
  ieltsMock1,
  ieltsMock2,
  ieltsMock3,
];

export const DEFAULT_IELTS_MOCK_ID = 'ielts-mock-1';

export function getIeltsMock(id: string): IELTSMock | undefined {
  return IELTS_MOCKS.find(m => m.id === id);
}

/** Devuelve el mock con default seguro si el id es inválido. */
export function getIeltsMockOrDefault(id: string | null | undefined): IELTSMock {
  return getIeltsMock(id ?? '') ?? IELTS_MOCKS[0];
}

// Convenience derivados — para consumidores que sólo necesitan una parte.
export const LISTENING_MOCKS: ListeningMock[] = IELTS_MOCKS.map(m => m.listening);
export const READING_MOCKS:   ReadingMock[]   = IELTS_MOCKS.map(m => m.reading);

// Beginners product — Listening + Reading tracks so far. Mantenidos aparte
// para que los pickers de /ielts (regular) no los muestren; la landing
// dedicada de /ielts-beginners los consume directamente.
export const BEGINNERS_LISTENING_MOCKS: ListeningMock[] = [
  listeningBeginnersMock1,
  listeningBeginnersMock2,
];

export const BEGINNERS_READING_MOCKS: ReadingMock[] = [
  readingBeginnersMock1,
];

// Intermediate product — puente entre A2 y el simulacro completo. Por ahora
// sólo Listening; Reading/Writing/Speaking B1/B2 se suman en pasos
// siguientes. La landing dedicada de /ielts-intermediate los consume.
export const INTERMEDIATE_LISTENING_MOCKS: ListeningMock[] = [
  listeningIntermediateMock1,
];

// Upper-Intermediate product — volumen y velocidad del examen real (40 Q,
// 1.0x) con vocab B2 y sin scaffolding preListening. Puente entre
// Intermediate y los mocks Full IELTS (B2-C1).
export const UPPER_INTERMEDIATE_LISTENING_MOCKS: ListeningMock[] = [
  listeningUpperIntermediateMock1,
];

// Advanced product — nivel máximo antes de Full IELTS. C1 con densidad
// léxica y distractores más finos; scripts más largos y preguntas
// mayormente inferenciales.
export const ADVANCED_LISTENING_MOCKS: ListeningMock[] = [
  listeningAdvancedMock1,
];

// Todos los listening mocks conocidos. Usar para lookup por id (URL
// ?mock=), no para renderizar pickers.
export const ALL_LISTENING_MOCKS: ListeningMock[] = [
  ...LISTENING_MOCKS,
  ...BEGINNERS_LISTENING_MOCKS,
  ...INTERMEDIATE_LISTENING_MOCKS,
  ...UPPER_INTERMEDIATE_LISTENING_MOCKS,
  ...ADVANCED_LISTENING_MOCKS,
];

// Idem reading. El runner de /ielts/reading/[mockId] usa esto para poder
// resolver un id de mock beginners (no está registrado como IELTSMock).
export const ALL_READING_MOCKS: ReadingMock[] = [
  ...READING_MOCKS,
  ...BEGINNERS_READING_MOCKS,
];

export function getListeningMock(mockId: string): ListeningMock | undefined {
  return (
    getIeltsMock(mockId)?.listening
    ?? BEGINNERS_LISTENING_MOCKS.find(m => m.id === mockId)
    ?? INTERMEDIATE_LISTENING_MOCKS.find(m => m.id === mockId)
    ?? UPPER_INTERMEDIATE_LISTENING_MOCKS.find(m => m.id === mockId)
    ?? ADVANCED_LISTENING_MOCKS.find(m => m.id === mockId)
  );
}

export function getReadingMock(mockId: string): ReadingMock | undefined {
  return (
    getIeltsMock(mockId)?.reading
    ?? BEGINNERS_READING_MOCKS.find(m => m.id === mockId)
  );
}
