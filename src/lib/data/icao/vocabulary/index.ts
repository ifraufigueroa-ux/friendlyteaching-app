// FriendlyTeaching.cl — OACI Vocabulary · registry
//
// Las 4 clases se registran acá para que la landing y el runner las
// enumeren sin tener que importar cada archivo. Solo Class 1 está
// implementada — las otras 3 quedan como stubs con `slides: []` para
// que la landing muestre el placeholder "Próximamente" sin romperse.

import type { OACIVocabularyClass } from '../types';
import { ICAO_VOCAB_CLASS_1 } from './class-1-aircraft-parts';

// Stub para clases todavía no escritas. La landing filtra por
// slides.length === 0 para saber si está lista o no.
function stub(
  classNumber: 1 | 2 | 3 | 4,
  id: string,
  title: string,
  subtitle: string,
  radialContext: string,
): OACIVocabularyClass {
  return {
    id,
    classNumber,
    title,
    subtitle,
    targetOaciLevel: 4,
    cefrEquivalent: 'B2',
    durationMinutes: 60,
    focus: '(Pendiente)',
    radialContext,
    slides: [],
    dialogueSegments: [],
  };
}

export const ICAO_VOCAB_CLASSES: OACIVocabularyClass[] = [
  ICAO_VOCAB_CLASS_1,
  stub(
    2,
    'vocab-class-2-airport-ops',
    'Airport & Ground Operations',
    'Runways, taxiways, ramps and clearances',
    'Pushback → taxi → hold short → line-up — negociado con Ground y Tower.',
  ),
  stub(
    3,
    'vocab-class-3-weather',
    'Weather & Environment',
    'METAR, ATIS, PIREPs and weather deviation',
    'Reportar y pedir información meteorológica en enroute.',
  ),
  stub(
    4,
    'vocab-class-4-emergencies',
    'Emergencies & Non-normal Situations',
    'MAYDAY, PAN PAN, squawk 7700, cabin & medical events',
    'Declarar emergencia y coordinar con ATC bajo presión.',
  ),
];

export function getIcaoVocabClass(id: string): OACIVocabularyClass | undefined {
  return ICAO_VOCAB_CLASSES.find(c => c.id === id);
}
