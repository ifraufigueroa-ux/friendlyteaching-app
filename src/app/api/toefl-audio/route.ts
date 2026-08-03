// FriendlyTeaching.cl — TOEFL Listening on-demand audio generation
//
// POST { teacherId, mockId, audioId } → generates the clip via ElevenLabs,
// uploads to Firebase Storage, writes the toeflListeningAudios binding, and
// returns the download URL. If the binding already exists, returns cached.
//
// Requires:
//   · ELEVENLABS_API_KEY (or ELEVEN_KEY)
//   · FIREBASE_SERVICE_ACCOUNT_JSON (server-side admin credentials)
//
// The audio script is loaded from the TypeScript mock data at build time —
// same source of truth the runner uses.

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';
import { toeflMock1 } from '@/lib/data/toefl/mock-1';
import type { TOEFLListeningAudio } from '@/types/toefl';

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_KEY ?? '';

// Voice map — matches scripts/generate-toefl-audios.js so audio generated
// either way sounds the same. Add speakers as new mocks introduce them.
const VOICES: Record<string, string> = {
  prof:      'ThT5KcBeYPX3keUQqHPh',   // Dorothy (calm female)
  student:   '21m00Tcm4TlvDq8ikWAM',   // Rachel (young female)
  librarian: 'yoZ06aMxZJJ28mfd3POQ',   // Sam (warm male)
  default:   'EXAVITQu4vr4xnSDxMaL',   // Bella
};

function pickVoice(speakerId: string): string {
  return VOICES[speakerId] ?? VOICES.default;
}

let adminApp: App | null = null;
function admin() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) { adminApp = getApps()[0]!; return adminApp; }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set');
  const parsed = JSON.parse(raw);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  adminApp = initializeApp({ credential: cert(parsed), storageBucket: BUCKET });
  return adminApp;
}

interface Body {
  teacherId: string;
  mockId:    string;
  audioId:   string;
}

const MOCKS_BY_ID = { 'mock-1': toeflMock1 } as const;

function findAudio(mockId: string, audioId: string): TOEFLListeningAudio | null {
  const mock = MOCKS_BY_ID[mockId as keyof typeof MOCKS_BY_ID];
  if (!mock) return null;
  return mock.listening.find(a => a.id === audioId) ?? null;
}

async function ttsLine(text: string, voiceId: string): Promise<Buffer> {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key':  ELEVEN_KEY,
      'Content-Type': 'application/json',
      Accept:         'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id:       'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.7 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`ElevenLabs ${resp.status}: ${err.slice(0, 200)}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { teacherId, mockId, audioId } = body;
  if (!teacherId || !mockId || !audioId) {
    return NextResponse.json({ error: 'teacherId, mockId and audioId are required' }, { status: 400 });
  }
  if (!ELEVEN_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not set on the server' }, { status: 500 });
  }

  const audio = findAudio(mockId, audioId);
  if (!audio) return NextResponse.json({ error: `Unknown audio ${mockId}/${audioId}` }, { status: 404 });

  try {
    admin();
    const db = getFirestore();
    const bucket = getStorage().bucket();
    const bindingKey = `${teacherId}_${mockId}_${audioId}`;
    const bindingRef = db.collection('toeflListeningAudios').doc(bindingKey);

    // Return the cached URL if the binding already exists.
    const existing = await bindingRef.get();
    if (existing.exists) {
      const url = existing.get('audioUrl') as string | undefined;
      if (url) return NextResponse.json({ audioUrl: url, cached: true });
    }

    // Otherwise TTS every line, concat, upload, and cache the binding.
    const parts: Buffer[] = [];
    for (const line of audio.script) {
      const buf = await ttsLine(line.text, pickVoice(line.speakerId));
      parts.push(buf);
    }
    const combined = Buffer.concat(parts);
    const storagePath = `audio/toefl-${audioId}-${teacherId}-${Date.now()}.mp3`;
    const file = bucket.file(storagePath);
    await file.save(combined, { contentType: 'audio/mpeg' });

    // Attach a download token so the URL works without a signed request.
    const token = crypto.randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    const encoded = encodeURIComponent(file.name);
    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;

    await bindingRef.set({
      teacherId, mockId, audioId, audioUrl, storagePath,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ audioUrl, cached: false });
  } catch (err) {
    console.error('[toefl-audio] generation failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
