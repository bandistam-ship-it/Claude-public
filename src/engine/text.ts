/** Lower-case, strip diacritics (ă→a, ț→t…) and emoji so Romanian and English rules match alike. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[ş]/g, 's')
    .replace(/[ţ]/g, 't')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .toLowerCase()
    .trim();
}

const cache = new Map<string, RegExp>();
export function re(pattern: string): RegExp {
  let r = cache.get(pattern);
  if (!r) {
    r = new RegExp(pattern, 'iu');
    cache.set(pattern, r);
  }
  return r;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whole-word (or word-prefix when `prefix`) match of `needle` in already-normalised `hay`. */
export function hasWord(hay: string, needle: string, prefix = false): boolean {
  return re(`(^|[^\\p{L}\\p{N}])${escape(norm(needle))}${prefix ? '' : '($|[^\\p{L}\\p{N}])'}`).test(hay);
}

/**
 * Largest rep count stated in a task, e.g. "Strict pull-ups – 2x4" → 4, "4×10" → 10, "3x10–12" → 10,
 * "8 reps" → 8. Timed holds ("3×20–30 s") are not reps and are ignored.
 */
export function parseReps(text: string): number | null {
  const t = norm(text);
  let best: number | null = null;
  const setsRe = /(\d+)\s*[x×]\s*(\d+)(?:\s*[-–]\s*\d+)?(\s*(?:s|sec|secunde|seconds)\b)?/gu;
  for (const m of t.matchAll(setsRe)) {
    if (m[3]) continue; // timed hold
    const reps = Number(m[2]);
    if (best === null || reps > best) best = reps;
  }
  const repsRe = /(\d+)\s*(reps?|repetari|repetitii)\b/gu;
  for (const m of t.matchAll(repsRe)) {
    const reps = Number(m[1]);
    if (best === null || reps > best) best = reps;
  }
  return best;
}
