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

export function getListeningMock(mockId: string): ListeningMock | undefined {
  return getIeltsMock(mockId)?.listening;
}

export function getReadingMock(mockId: string): ReadingMock | undefined {
  return getIeltsMock(mockId)?.reading;
}
