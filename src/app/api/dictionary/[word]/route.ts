// FriendlyTeaching.cl — Dictionary proxy
//
// Thin wrapper around dictionaryapi.dev's free endpoint. We proxy
// through our own API so:
//   · the browser call looks same-origin (no surprise CORS blocks),
//   · Vercel edge-caches the response for 24h (same word gets looked
//     up many times across students),
//   · we can swap the upstream later without touching clients.
//
// Returns a normalised shape that the reader toolbar renders without
// having to know about dictionaryapi.dev's response format.

import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface UpstreamDefinition { definition?: string; example?: string }
interface UpstreamMeaning     { partOfSpeech?: string; definitions?: UpstreamDefinition[] }
interface UpstreamEntry       { word?: string; phonetic?: string; phonetics?: { text?: string }[]; meanings?: UpstreamMeaning[] }

export async function GET(_req: Request, { params }: { params: Promise<{ word: string }> }) {
  const { word: raw } = await params;
  const word = decodeURIComponent(raw || '').trim().toLowerCase();
  if (!word || !/^[a-z'-]{1,40}$/i.test(word)) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { headers: { 'User-Agent': 'FriendlyTeaching/1.0' }, cache: 'force-cache' },
    );
    if (res.status === 404) {
      return NextResponse.json(
        { word, found: false },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } },
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error', status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as UpstreamEntry[] | UpstreamEntry;
    const entries = Array.isArray(data) ? data : [data];
    const first = entries[0] ?? {};
    const phonetic =
      first.phonetic ??
      first.phonetics?.find(p => p.text)?.text ??
      '';
    const meanings = (first.meanings ?? []).map(m => ({
      partOfSpeech: m.partOfSpeech ?? '',
      definitions:  (m.definitions ?? []).slice(0, 3).map(d => ({
        definition: d.definition ?? '',
        example:    d.example ?? '',
      })),
    })).slice(0, 4);
    return NextResponse.json(
      { word: first.word ?? word, found: true, phonetic, meanings },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      },
    );
  } catch (err) {
    console.warn('[api/dictionary] failed:', err);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  }
}
