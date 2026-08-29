// FriendlyTeaching.cl — OACI (ICAO English) types
//
// El programa de preparación OACI se divide en 8 etapas (ver dashboard
// landing en /dashboard/teacher/icao). Cada etapa tiene 2-4 clases.
//
// Empezamos por Etapa 2 (Aviation vocabulary, 4 clases). Las demás se
// van a agregar en etapas siguientes reutilizando estos tipos.
//
// Cada clase reusa el sistema de slides de la app (Slide[]) — así hereda
// el proyector, el AudioPlayer con seek, la fullscreen mode, etc.
// Además cada clase declara `dialogueSegments`: la lista de líneas que
// se van a mandar a ElevenLabs para generar los audios de la sección de
// listening (radio exchange ATC↔pilot). El campo se usa desde el runner
// para invocar /api/tts/elevenlabs-dialogue y persistir el resultado.

import type { Slide } from '@/types/firebase';

export type OACILevel = 4 | 5 | 6; // Operational (4), Extended (5), Expert (6)

export type OACIStageId =
  | 'diagnostic'
  | 'vocabulary'
  | 'phraseology'
  | 'listening'
  | 'speaking'
  | 'non-routine'
  | 'competencies'
  | 'mock-tests';

export interface OACIStage {
  id:          OACIStageId;
  order:       number;
  title:       string;
  goal:        string;
  classCount:  number | [number, number]; // fijo o rango (ej. 2-4 para mock tests)
  href?:       string;                    // ruta a la landing de esa etapa
}

// Rol del speaker en un diálogo aeronáutico. Determina la voz por default
// que se pide a ElevenLabs (ver voices.ts).
export type OACISpeakerRole =
  | 'atc-tower'         // Torre de control
  | 'atc-ground'        // Ground control
  | 'atc-approach'      // Approach / Departure
  | 'atc-enroute'       // Center / Area control
  | 'pilot-captain'     // Capitán
  | 'pilot-first-officer' // Primer oficial
  | 'atis-recording';   // ATIS grabado (monótono)

export interface OACIDialogueSegment {
  speakerRole: OACISpeakerRole;
  speakerLabel: string;  // Etiqueta visible: "ATC — Santiago Tower", "Captain LAN 445", etc.
  text: string;
}

export interface OACIVocabularyClass {
  id:               string;         // ej. 'vocab-class-1-aircraft-parts'
  classNumber:      1 | 2 | 3 | 4;
  title:            string;         // ej. 'Aircraft & Systems'
  subtitle:         string;         // ej. 'Parts, systems, and pilot self-reporting'
  targetOaciLevel:  OACILevel;
  cefrEquivalent:   'B1' | 'B1+' | 'B2' | 'C1';
  durationMinutes:  number;
  focus:            string;         // 1-frase objetivo pedagógico
  radialContext:    string;         // Qué situación radial resuelve
  slides:           Slide[];
  // Guion completo de la sección listening — se envía a ElevenLabs
  // multi-voice y el MP3 resultante se pega en la slide de type
  // 'listening' que tenga id 'radio-exchange'.
  dialogueSegments: OACIDialogueSegment[];
}

export interface OACIProgramme {
  stages:            OACIStage[];
  vocabularyClasses: OACIVocabularyClass[];
}
