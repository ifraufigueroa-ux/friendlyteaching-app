// FriendlyTeaching.cl — Whisper speech-to-text
// POST /api/transcribe-speech
// Body: multipart/form-data with fields:
//   - audio: File (mp3/mp4/webm/wav/m4a, up to ~25MB)
//   - language?: string (ISO code, e.g. 'en')
// Returns: { text: string, durationSec?: number }
//
// Provider selection:
//   1. GROQ_API_KEY  → Groq (free tier, whisper-large-v3, faster).
//   2. OPENAI_API_KEY → OpenAI (paid, whisper-1) as fallback.
// Both providers expose the same OpenAI-compatible endpoint shape.

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface Provider {
  name:  string;
  url:   string;
  key:   string;
  model: string;
}

function pickProvider(): Provider | null {
  if (GROQ_API_KEY) {
    return {
      name:  'groq',
      url:   'https://api.groq.com/openai/v1/audio/transcriptions',
      key:   GROQ_API_KEY,
      model: 'whisper-large-v3',
    };
  }
  if (OPENAI_API_KEY) {
    return {
      name:  'openai',
      url:   'https://api.openai.com/v1/audio/transcriptions',
      key:   OPENAI_API_KEY,
      model: 'whisper-1',
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const provider = pickProvider();
  if (!provider) {
    return NextResponse.json(
      { error: 'Whisper not configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const audio = form.get('audio');
  const language = (form.get('language') as string | null) ?? 'en';

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('file', audio, audio.name || 'audio.webm');
  upstream.append('model', provider.model);
  upstream.append('language', language);
  upstream.append('response_format', 'verbose_json');

  try {
    const resp = await fetch(provider.url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${provider.key}` },
      body:    upstream,
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`[whisper:${provider.name}] error:`, resp.status, err);
      return NextResponse.json({ error: 'Whisper request failed' }, { status: 502 });
    }

    const data = await resp.json();
    return NextResponse.json({
      text:        String(data.text ?? '').trim(),
      durationSec: typeof data.duration === 'number' ? data.duration : undefined,
      provider:    provider.name,
    });
  } catch (err) {
    console.error(`[whisper:${provider.name}] fetch error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
