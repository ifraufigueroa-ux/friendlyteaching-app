// FriendlyTeaching.cl — Name normalization utilities

/**
 * Normalizes a name for comparison: trim, lowercase, strip diacritics.
 * "María González" → "maria gonzalez"
 * "CARLOS"         → "carlos"
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Returns true if two names likely refer to the same person.
 * Rules (all three fire; any hit = match):
 *   1. Normalized strings are identical (accent / case difference only).
 *   2. STRICT: same first token AND the shorter is a word-boundary prefix
 *      of the longer. Catches "María" ↔ "María González".
 *   3. LENIENT: both have ≥2 tokens, the LAST tokens are identical, and
 *      one first token is a strict prefix of the other. Catches nickname
 *      pairs like "Anto Acuña" ↔ "Antonia Acuña" or "Dani Lanas" ↔
 *      "Daniela Lanas". The shared last token makes this safe — a random
 *      "Ana Ramírez" ↔ "Anabel González" won't collide.
 *
 * Examples that match:
 *   "María" ↔ "Maria"                    (accent)
 *   "María" ↔ "María González"           (first name vs full)
 *   "Ana García" ↔ "ana garcia"          (case)
 *   "Anto Acuña" ↔ "Antonia Acuña"       (nickname, shared last name)
 *   "Dani Lanas" ↔ "Daniela Lanas"       (nickname, shared last name)
 *
 * Examples that do NOT match:
 *   "Ana" ↔ "Anabel"                     (single tokens, different)
 *   "Luis" ↔ "Luisa"                     (single tokens, different)
 *   "Ana Ramírez" ↔ "Anabel González"    (different last name — separate people)
 */
export function areSimilarNames(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  const ta = na.split(/\s+/).filter(Boolean);
  const tb = nb.split(/\s+/).filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return false;

  // Rule 2 (strict): same first token + full-token prefix relationship.
  if (ta[0] === tb[0]) {
    const short = na.length < nb.length ? na : nb;
    const long  = na.length < nb.length ? nb : na;
    if (long === short || long.startsWith(short + ' ')) return true;
  }

  // Rule 3 (lenient): shared LAST token + first-token prefix pattern.
  // Requires both names to have ≥2 tokens so we do not accidentally merge
  // single-token first names that happen to share a prefix.
  if (ta.length >= 2 && tb.length >= 2) {
    if (ta[ta.length - 1] === tb[tb.length - 1]) {
      const fa = ta[0];
      const fb = tb[0];
      const shortFirst = fa.length <= fb.length ? fa : fb;
      const longFirst  = fa.length <= fb.length ? fb : fa;
      if (shortFirst !== longFirst && longFirst.startsWith(shortFirst)) return true;
    }
  }

  return false;
}

/**
 * Groups an array of unique names into clusters of similar names.
 * Returns only clusters that have more than one variant.
 */
export function groupSimilarNames(names: string[]): string[][] {
  const visited = new Set<string>();
  const groups: string[][] = [];

  for (const name of names) {
    if (visited.has(name)) continue;
    const group = names.filter(n => areSimilarNames(name, n));
    group.forEach(n => visited.add(n));
    if (group.length > 1) groups.push(group);
  }

  return groups;
}

/**
 * Counts combining diacritical marks in a string — used as an accent
 * proxy so "Beatriz Sepúlveda" ranks above "Beatriz Sepulveda".
 */
function countAccents(s: string): number {
  return (s.normalize('NFD').match(/[̀-ͯ]/g) ?? []).length;
}

/**
 * Chooses the canonical spelling of a group of similar names. Priority:
 *   1. Longest normalized name — "Antonia Acuña" beats "Anto Acuña";
 *      "María González" beats "María".
 *   2. Most accents — "Beatriz Sepúlveda" beats "Beatriz Sepulveda".
 *   3. Most tokens — safety net for edge cases where two variants have
 *      equal normalized length but different word counts.
 *   4. Alphabetical (es locale) — deterministic tiebreak.
 */
export function pickCanonicalName(names: string[]): string {
  return [...names].sort((a, b) => {
    const lc = normalizeName(b).length - normalizeName(a).length;
    if (lc !== 0) return lc;
    const ac = countAccents(b) - countAccents(a);
    if (ac !== 0) return ac;
    const tc = b.split(/\s+/).filter(Boolean).length
             - a.split(/\s+/).filter(Boolean).length;
    if (tc !== 0) return tc;
    return a.localeCompare(b, 'es');
  })[0];
}
