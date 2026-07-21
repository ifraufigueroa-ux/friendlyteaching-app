// FriendlyTeaching.cl — ElevenLabs multi-speaker dialogue proxy
//
// POST /api/tts/elevenlabs-dialogue
// Body: { segments: [{ voiceId, text }, ...], modelId? }
// Returns: audio/mpeg — a single MP3 with all segments concatenated in order.
//
// Why not the native `text-to-dialogue` endpoint? It's currently plan-gated
// on ElevenLabs (Creator tier +). This proxy uses the plain TTS endpoint the
// teacher already has working, calls it once per line with the matching
// voiceId, and stitches the resulting MP3 buffers together server-side.
//
// MP3 frames are self-contained, so binary Buffer.concat produces a valid
// playable file as long as every segment uses the same encoding params —
// which ElevenLabs guarantees within one model.
//
// Sequential (not parallel) calls: keeps us under ElevenLabs' concurrent-
// request quota on smaller plans and preserves order predictably.

import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

interface Segment {
  voiceId: string;
  text: string;
}

interface DialogueRequest {
  segments: Segment[];
  modelId?: string;
}

async function generateOne(voiceId: string, text: string, modelId: string): Promise<ArrayBuffer> {
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
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${errText.slice(0, 200)}`);
  }
  return await res.arrayBuffer();
}

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs no está configurado. Agrega ELEVENLABS_API_KEY en .env.local.' },
      { status: 503 },
    );
  }

  let body: DialogueRequest;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const segments = Array.isArray(body.segments) ? body.segments : [];
  if (segments.length === 0) {
    return NextResponse.json({ error: 'segments (non-empty array) is required' }, { status: 400 });
  }

  // Defensive cost cap — a full IELTS dialogue section runs ~2500-3500 chars.
  // 15k caps three sections at once if someone ever wires bulk generation.
  const totalChars = segments.reduce((n, s) => n + (s.text?.length ?? 0), 0);
  if (totalChars > 15000) {
    return NextResponse.json(
      { error: `Total text too long (${totalChars} chars). Max 15000 per dialogue request.` },
      { status: 400 },
    );
  }

  const clean: Segment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (!s?.voiceId?.trim() || !s?.text?.trim()) {
      return NextResponse.json(
        { error: `Segment ${i}: voiceId and text are required.` },
        { status: 400 },
      );
    }
    clean.push({ voiceId: s.voiceId.trim(), text: s.text.trim() });
  }

  const modelId = body.modelId ?? DEFAULT_MODEL;
  const buffers: ArrayBuffer[] = [];

  try {
    for (let i = 0; i < clean.length; i++) {
      // Prepend a short SSML break to lines 2+ so voice switches don't feel
      // rushed. eleven_multilingual_v2 honours <break time="X.Xs"/>.
      const text = i === 0
        ? clean[i].text
        : `<break time="0.4s"/> ${clean[i].text}`;
      buffers.push(await generateOne(clean[i].voiceId, text, modelId));
    }
  } catch (err) {
    console.error('[tts/dialogue] failed on a segment:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dialogue segment generation failed' },
      { status: 502 },
    );
  }

  // Direct binary concat — safe for MP3 frames from the same encoder.
  const total = buffers.reduce((n, b) => n + b.byteLength, 0);
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    combined.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }

  return new NextResponse(combined, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(combined.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
