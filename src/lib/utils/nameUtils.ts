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
 * Rules:
 *   1. Normalized strings are identical.
 *   2. One is a first-name-only version of the other (same first token, shorter one
 *      is a word-boundary prefix of the longer one).
 *
 * Examples that match:
 *   "María" ↔ "Maria"                   (accent difference)
 *   "María" ↔ "María González"          (first name vs full name)
 *   "Ana García" ↔ "ana garcia"         (case difference)
 *   "Felipe" ↔ "Felipe Rodríguez"       (first name vs full name)
 *
 * Examples that do NOT match:
 *   "Ana" ↔ "Anabel"                    (different first token)
 *   "Luis" ↔ "Luisa"                    (different first token)
 */
export function areSimilarNames(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  // Extract first tokens
  const ta = na.split(/\s+/)[0];
  const tb = nb.split(/\s+/)[0];
  if (ta !== tb) return false;

  // One must be a clean word-boundary prefix of the other
  // e.g. "maria" is prefix of "maria gonzalez " (note trailing space trick)
  const short = na.length < nb.length ? na : nb;
  const long  = na.length < nb.length ? nb : na;
  return long.startsWith(short + ' ') || long === short;
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
