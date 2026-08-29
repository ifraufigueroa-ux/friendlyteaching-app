// FriendlyTeaching.cl — OACI voice mapping
//
// Mapa de rol OACI → voiceId de ElevenLabs. Los IDs son voices públicas
// del catálogo estándar de EL, mismas que ya usa /api/toefl-audio, así
// que si el ELEVENLABS_API_KEY del proyecto tiene acceso a TOEFL también
// funciona acá.
//
// Reglas de casting:
//   - Todos los ATC (torre/ground/approach) llevan una voz medida,
//     articulada y con neutralidad de acento. Dorothy (femenina, madura)
//     y Sam (masculino, cálido) rotan por sub-rol para que el student
//     distinga a un solo controlador de otro cuando la clase mete
//     handoffs entre facilities.
//   - Piloto capitán: voz masculina con presencia (Sam).
//   - Primer oficial: voz femenina joven (Rachel), para diferenciar
//     claramente del capitán.
//   - ATIS: mismo Dorothy pero con prosodia lenta — el prompt del
//     script lo indica implícitamente ("Information Alpha, recorded at…").
//
// El id de la voz se pasa como { voiceId, text } al endpoint
// /api/tts/elevenlabs-dialogue que ya existe (creado para IELTS/TOEFL).

import type { OACISpeakerRole } from './types';

const V = {
  DorothyFemale:   'ThT5KcBeYPX3keUQqHPh',
  SamMale:         'yoZ06aMxZJJ28mfd3POQ',
  RachelFemale:    '21m00Tcm4TlvDq8ikWAM',
  BellaFemale:     'EXAVITQu4vr4xnSDxMaL',
} as const;

const ROLE_TO_VOICE: Record<OACISpeakerRole, string> = {
  'atc-tower':          V.DorothyFemale,
  'atc-ground':         V.SamMale,
  'atc-approach':       V.DorothyFemale,
  'atc-enroute':        V.SamMale,
  'pilot-captain':      V.SamMale,
  'pilot-first-officer':V.RachelFemale,
  'atis-recording':     V.BellaFemale,
};

export function voiceIdForRole(role: OACISpeakerRole): string {
  return ROLE_TO_VOICE[role];
}
