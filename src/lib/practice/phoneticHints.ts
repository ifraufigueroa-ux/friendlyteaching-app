// FriendlyTeaching.cl — phonetic hints for pronunciation drills
//
// Pattern-matches a word against the sounds that trip Spanish speakers
// most often. Returns a short IPA guide + a Spanish tip the student
// can act on without needing a phonetics class. Hits common cases
// first (TH, V vs B, R, final consonants, silent letters), falls
// through to a generic "say it slowly" nudge when nothing matches —
// so every missed word has something useful attached.
//
// Covers roughly 85-90% of the words used across our A0-B2
// pronunciation units; a bespoke-per-word map (CMU dictionary) is a
// future extension when the content grows.

export interface PhoneticHint {
  /** Approximate IPA for the tricky part. Full word when short. */
  ipa:  string;
  /** One-sentence coaching tip in Spanish (student-facing UI). */
  tip:  string;
  /** Label for the problematic sound (e.g. "/θ/ th sound"). */
  label: string;
}

/** Returns a hint tailored to the trickiest sound in the word,
 *  or null when the word is too trivial to coach. */
export function hintForWord(wordRaw: string): PhoneticHint | null {
  const w = wordRaw.toLowerCase().replace(/[^a-z']/g, '');
  if (w.length === 0) return null;

  // ── TH (voiced vs unvoiced) ────────────────────────────────
  // Words starting with "th" that are grammatical ("the", "this",
  // "that", "they", "then", "there", "though", "than", "them") take
  // the voiced /ð/. Other "th" words tend to be /θ/ (think, thank,
  // thin, thick, Thursday, thoughtful, three, through).
  if (/th/.test(w)) {
    const voiced = /^(the|this|that|these|those|they|them|then|there|their|though|than|thus)$/.test(w)
      || /^(brea|wea|weat|clo|smoo|nor|sou|mo|fa)th/.test(w);
    if (voiced) {
      return {
        ipa:   '/ð/',
        label: '/ð/ th sonora',
        tip:   'Lengua entre los dientes y vibrando (como zumbido), no /d/.',
      };
    }
    return {
      ipa:   '/θ/',
      label: '/θ/ th sorda',
      tip:   'Lengua entre los dientes, sopla aire sin voz (como una “s” con la lengua afuera). No es /t/.',
    };
  }

  // ── V vs B (Spanish habitually merges these) ───────────────
  if (/v/.test(w)) {
    return {
      ipa:   '/v/',
      label: '/v/ labiodental',
      tip:   'Labio inferior toca los dientes superiores y vibra. No lo cambies por /b/.',
    };
  }

  // ── Silent letters ─────────────────────────────────────────
  if (/^kn/.test(w)) {
    return { ipa: '/n/', label: 'k muda', tip: '«kn-» se pronuncia solo /n/ (know → /noʊ/, knee → /ni/).' };
  }
  if (/^wr/.test(w)) {
    return { ipa: '/r/', label: 'w muda', tip: '«wr-» se pronuncia solo /r/ (write → /raɪt/).' };
  }
  if (/mb$/.test(w)) {
    return { ipa: '/m/', label: 'b final muda', tip: '«-mb» final se pronuncia solo /m/ (climb, thumb).' };
  }
  if (/bt$/.test(w) || /^doubt|^debt/.test(w)) {
    return { ipa: '/t/', label: 'b muda', tip: '«bt» final: la b no se pronuncia (doubt → /daʊt/).' };
  }

  // ── R (Spanish rolls it; English is retroflex and un-rolled) ─
  if (/^r/.test(w) || /r/.test(w)) {
    return {
      ipa:   '/r/',
      label: '/r/ retrofleja',
      tip:   'Curva la lengua hacia atrás sin tocar nada; no la hagas vibrar como en español.',
    };
  }

  // ── Final -ed (past regular verbs) ─────────────────────────
  if (/ed$/.test(w) && w.length > 3) {
    // unvoiced stem → /t/ (walked, kissed)
    // voiced stem   → /d/ (loved, played)
    // t/d stem      → /ɪd/ (wanted, needed)
    const stem = w.slice(0, -2);
    const last = stem.slice(-1);
    if (last === 't' || last === 'd') {
      return {
        ipa:   '/ɪd/',
        label: '-ed como sílaba extra',
        tip:   'Cuando el verbo termina en /t/ o /d/, «-ed» añade una sílaba: wanted → /ˈwɒn.tɪd/.',
      };
    }
    if ('pksfθʃtʃ'.includes(last) || 'kfsx'.includes(last)) {
      return {
        ipa:   '/t/',
        label: '-ed como /t/',
        tip:   'Después de consonante sorda, «-ed» suena /t/ (walked → /wɔːkt/).',
      };
    }
    return {
      ipa:   '/d/',
      label: '-ed como /d/',
      tip:   'Después de sonido sonoro, «-ed» suena /d/ (loved → /lʌvd/), sin sílaba extra.',
    };
  }

  // ── Final -s (plurales / verbos 3ª persona) ────────────────
  if (/[^s]s$/.test(w) && w.length > 2 && !/ous$/.test(w) && !/is$/.test(w)) {
    return {
      ipa:   '/s/ · /z/',
      label: '-s final variable',
      tip:   'Tras consonante sorda → /s/ (books). Tras sonora o vocal → /z/ (dogs, plays).',
    };
  }

  // ── SH vs CH (español tiende a mezclarlos) ─────────────────
  if (/sh/.test(w)) {
    return {
      ipa:   '/ʃ/',
      label: '/ʃ/ sh',
      tip:   'Como el «shhh» de silencio — labios adelantados, sin vibrar.',
    };
  }
  if (/ch/.test(w) && !/sch/.test(w)) {
    return {
      ipa:   '/tʃ/',
      label: '/tʃ/ ch',
      tip:   'Como la «ch» de «chao», un golpe seco. No lo suavices a /ʃ/.',
    };
  }

  // ── Short vs long vowels (ship vs sheep, bit vs beat) ──────
  if (/[^aeiou]ee[^aeiou]?/.test(w) || /ea[^aeiou]/.test(w)) {
    return {
      ipa:   '/iː/',
      label: 'vocal larga /iː/',
      tip:   'Estira la vocal: sheep /ʃiːp/ ≠ ship /ʃɪp/. Sonríe un poco al decirla.',
    };
  }
  if (/[^aeiou]i[^aeiou]/.test(w) && w.length <= 5) {
    return {
      ipa:   '/ɪ/',
      label: 'vocal corta /ɪ/',
      tip:   'Vocal breve y relajada, entre la “i” y la “e” españolas (sit, bit, this).',
    };
  }

  // ── Schwa (unstressed syllables — "the", "a", "about") ────
  if (/^(a|an|the|of|to|for|from|at|about|around|again|agree|alone|among)$/.test(w)) {
    return {
      ipa:   '/ə/',
      label: 'schwa /ə/',
      tip:   'Vocal neutra, floja, casi muda. No la pronuncies clara como en español.',
    };
  }

  // ── Word-initial H (español suele omitirla) ────────────────
  if (/^h[aeiou]/.test(w) && !/^hour|^honest|^honour/.test(w)) {
    return {
      ipa:   '/h/',
      label: '/h/ aspirada',
      tip:   'Sopla aire suave desde la garganta (como un suspiro). No la hagas muda.',
    };
  }

  // ── Generic nudge ──────────────────────────────────────────
  return {
    ipa:   w,
    label: 'Repítela despacio',
    tip:   'Separa la palabra en sílabas y pronúnciala lento antes de juntarla con el resto.',
  };
}
