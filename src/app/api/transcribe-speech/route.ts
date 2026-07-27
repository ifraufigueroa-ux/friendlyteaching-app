// FriendlyTeaching.cl — Whisper speech-to-text
// POST /api/transcribe-speech
// Body: multipart/form-data with fields:
//   - audio: File (mp3/mp4/webm/wav/m4a, up to ~25MB per OpenAI limit)
//   - language?: string (ISO code, e.g. 'en')
// Returns: { text: string, durationSec?: number }

import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Whisper not configured. Set OPENAI_API_KEY.' },
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
  upstream.append('model', 'whisper-1');
  upstream.append('language', language);
  upstream.append('response_format', 'verbose_json');

  try {
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body:    upstream,
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[whisper] error:', resp.status, err);
      return NextResponse.json({ error: 'Whisper request failed' }, { status: 502 });
    }

    const data = await resp.json();
    return NextResponse.json({
      text:        String(data.text ?? '').trim(),
      durationSec: typeof data.duration === 'number' ? data.duration : undefined,
    });
  } catch (err) {
    console.error('[whisper] fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
