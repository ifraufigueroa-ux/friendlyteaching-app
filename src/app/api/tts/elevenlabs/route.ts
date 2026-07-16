// FriendlyTeaching.cl — ElevenLabs TTS proxy
//
// POST /api/tts/elevenlabs
// Body: { text, voiceId, modelId? }
// Returns: audio/mpeg binary (MP3) that the client uploads to Firebase Storage.
//
// We keep the ElevenLabs API key server-side (ELEVENLABS_API_KEY) so it never
// leaves the origin. The client is responsible for taking the returned blob
// and uploading it via the Firebase Storage client SDK to /audio/{fileName},
// then storing the resulting download URL on textData.audioUrl.

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

// Curated voice list for the teacher-facing dropdown. Kept small on purpose
// so the UI stays scannable. Ordered from clearest / most classroom-friendly
// downward. IDs come from ElevenLabs' library — swap any of these if the
// team prefers different voices.
export const VOICE_CATALOG: { id: string; name: string; accent: string; gender: 'f' | 'm' }[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',   accent: 'US',       gender: 'f' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',  accent: 'UK',       gender: 'm' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', accent: 'UK',       gender: 'f' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',  accent: 'UK',       gender: 'm' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',    accent: 'US',       gender: 'm' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', accent: 'Swedish-EN', gender: 'f' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris',   accent: 'US',       gender: 'm' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',   accent: 'US',       gender: 'm' },
];

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
}

export async function GET() {
  // Convenience endpoint used by the teacher UI to render the voice picker
  // without hard-coding the list on the client.
  return NextResponse.json({
    voices: VOICE_CATALOG,
    defaultModel: DEFAULT_MODEL,
    configured: Boolean(ELEVENLABS_API_KEY),
  });
}

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      {
        error: 'ElevenLabs no está configurado. Agrega ELEVENLABS_API_KEY en .env.local.',
        hint: 'Consigue una API key en https://elevenlabs.io/app/settings/api-keys y pégala como ELEVENLABS_API_KEY=…',
      },
      { status: 503 },
    );
  }

  let body: TTSRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, voiceId, modelId } = body;
  if (!text?.trim() || !voiceId?.trim()) {
    return NextResponse.json({ error: 'text and voiceId are required' }, { status: 400 });
  }

  // ElevenLabs charges per character. We cap request size defensively so a
  // teacher doesn't accidentally burn credits pasting a 20k-character text.
  if (text.length > 5000) {
    return NextResponse.json(
      { error: `Text too long (${text.length} chars). ElevenLabs is capped at 5000 chars per request in this app — split into parts if needed.` },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: modelId ?? DEFAULT_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[tts/elevenlabs] API error', res.status, errText);
      return NextResponse.json(
        { error: `ElevenLabs error ${res.status}: ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buf.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[tts/elevenlabs] fetch failed:', err);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
