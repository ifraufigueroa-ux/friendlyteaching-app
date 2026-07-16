// Shared word-lookup hook. Fetches /api/lookup/word for a given word and
// memoises results in a Map keyed by lowercase word. Both the Dictionary
// panel and the IPA popover use this so a single click on a word only ever
// triggers one network round-trip.
'use client';
import { useCallback, useRef, useState } from 'react';

export interface WordLookupResult {
  word: string;
  phonetic: string | null;
  definitions: { pos: string; text: string; example?: string }[];
  translationES: string | null;
  audioUrl: string | null;
  source: 'ok' | 'partial' | 'not_found';
}

export function useWordLookup() {
  const cache = useRef<Map<string, WordLookupResult>>(new Map());
  const [word, setWord] = useState<string | null>(null);
  const [result, setResult] = useState<WordLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (raw: string) => {
    const cleaned = raw.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
    if (!cleaned) return;
    setWord(cleaned);
    setError(null);

    const cached = cache.current.get(cleaned);
    if (cached) { setResult(cached); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/lookup/word?w=${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        setError(`Lookup failed (HTTP ${res.status})`);
        return;
      }
      const data: WordLookupResult = await res.json();
      cache.current.set(cleaned, data);
      setResult(data);
    } catch (err) {
      setError('Sin conexión: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => { setWord(null); setResult(null); setError(null); }, []);

  return { word, result, loading, error, lookup, clear };
}
