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

  // Accept either multipart/form-data (audio file directly) or JSON with an
  // { audioUrl, language? } body. The JSON form lets the browser hand us a
  // Firebase Storage URL without hitting cross-origin fetch restrictions —
  // we download it server-side (no CORS) and pass the blob to Whisper.
  const contentType = req.headers.get('content-type') ?? '';
  let audioBlob: Blob;
  let audioName = 'audio.webm';
  let language = 'en';

  if (contentType.includes('application/json')) {
    let body: { audioUrl?: string; language?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    if (!body.audioUrl) {
      return NextResponse.json({ error: 'Missing audioUrl' }, { status: 400 });
    }
    language = body.language ?? 'en';
    try {
      const audioResp = await fetch(body.audioUrl);
      if (!audioResp.ok) {
        return NextResponse.json(
          { error: `Failed to fetch audio: ${audioResp.status}` },
          { status: 502 },
        );
      }
      audioBlob = await audioResp.blob();
    } catch (err) {
      console.error('[whisper] audio fetch error:', err);
      return NextResponse.json({ error: 'Failed to download audio from storage' }, { status: 502 });
    }
  } else {
    let form: FormData;
    try { form = await req.formData(); }
    catch { return NextResponse.json({ error: 'Expected multipart/form-data or JSON' }, { status: 400 }); }
    const audio = form.get('audio');
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }
    audioBlob = audio;
    audioName = audio.name || 'audio.webm';
    language = (form.get('language') as string | null) ?? 'en';
  }

  const upstream = new FormData();
  upstream.append('file', audioBlob, audioName);
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
