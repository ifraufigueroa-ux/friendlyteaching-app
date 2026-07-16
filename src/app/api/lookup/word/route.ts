// FriendlyTeaching.cl — Word lookup proxy
//
// GET /api/lookup/word?w=<word>
//
// Combines two free APIs (both no-key) into a single response:
//   · api.dictionaryapi.dev  → IPA + English definitions
//   · api.mymemory.translated.net → EN → ES translation
//
// We proxy from the server so:
//   1. The client only makes one same-origin call (simpler, no CORS worries).
//   2. If either upstream fails we can degrade gracefully.
//
// Response shape:
// {
//   word: string,
//   phonetic: string | null,           // e.g. "/həˈloʊ/"
//   definitions: { pos: string; text: string; example?: string }[],
//   translationES: string | null,
//   audioUrl: string | null,           // pronunciation MP3 if the dictionary API has one
//   source: 'ok' | 'partial' | 'not_found',
// }
import { NextRequest, NextResponse } from 'next/server';

interface DictionaryPhonetic { text?: string; audio?: string }
interface DictionaryDefinition { definition: string; example?: string }
interface DictionaryMeaning { partOfSpeech: string; definitions: DictionaryDefinition[] }
interface DictionaryEntry { word: string; phonetic?: string; phonetics?: DictionaryPhonetic[]; meanings?: DictionaryMeaning[] }

async function fetchDictionary(word: string) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const data: DictionaryEntry[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

async function fetchTranslation(word: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|es`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const t: string | undefined = data?.responseData?.translatedText;
    if (!t) return null;
    // MyMemory sometimes echoes the source when it has no match — filter that.
    if (t.trim().toLowerCase() === word.trim().toLowerCase()) return null;
    return t;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const w = (req.nextUrl.searchParams.get('w') ?? '').trim();
  if (!w) return NextResponse.json({ error: 'missing ?w=' }, { status: 400 });
  // Guard: only alphabetic + a few punctuation marks common in English contractions.
  if (!/^[a-zA-Z][a-zA-Z'’-]{0,40}$/.test(w)) {
    return NextResponse.json({ error: 'invalid word' }, { status: 400 });
  }
  const clean = w.toLowerCase();

  const [dict, translationES] = await Promise.all([
    fetchDictionary(clean),
    fetchTranslation(clean),
  ]);

  // Pull best IPA + first audio URL from the dictionary payload.
  let phonetic: string | null = null;
  let audioUrl: string | null = null;
  if (dict) {
    if (dict.phonetic) phonetic = dict.phonetic;
    if (dict.phonetics && dict.phonetics.length > 0) {
      if (!phonetic) phonetic = dict.phonetics.find(p => p.text)?.text ?? null;
      audioUrl = dict.phonetics.find(p => p.audio && p.audio.length > 0)?.audio ?? null;
    }
  }

  const definitions: { pos: string; text: string; example?: string }[] = [];
  if (dict?.meanings) {
    for (const m of dict.meanings) {
      for (const d of m.definitions.slice(0, 3)) {
        definitions.push({ pos: m.partOfSpeech, text: d.definition, example: d.example });
      }
    }
  }

  const source: 'ok' | 'partial' | 'not_found' =
    dict && translationES ? 'ok' :
    dict || translationES ? 'partial' :
    'not_found';

  return NextResponse.json({
    word: clean,
    phonetic,
    definitions: definitions.slice(0, 6),
    translationES,
    audioUrl,
    source,
  }, {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
  });
}
