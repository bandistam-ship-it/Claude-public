import type { PersonalStats } from './types';

export const EMPTY_STATS: PersonalStats = {
  heightCm: null, weightKg: null, waistCm: null,
  pullUps: null, dips: null, pushUps: null,
  best5kSec: null, best10kSec: null, longestRunKm: null, restingHr: null, vo2max: null,
  updatedAt: null,
};

// ---------- Build: how strong the character looks ----------
// Max strict reps are scored against these ladders. A rung reached is one level; the build is the
// average level over the exercises you entered. Reps do not affect your skill percentile.
const LADDERS = {
  pullUps: [1, 3, 6, 10, 15, 20, 25],
  dips: [3, 8, 15, 22, 30, 40, 50],
  pushUps: [5, 15, 30, 45, 60, 80, 100],
} as const;

const levelOf = (value: number, ladder: readonly number[]) => ladder.filter((t) => value >= t).length;

/** 1..7 from your max reps, or null when you have not entered any. */
export function buildTierFromStats(s: PersonalStats): number | null {
  const levels = (Object.keys(LADDERS) as (keyof typeof LADDERS)[])
    .map((k) => (s[k] === null ? null : levelOf(s[k] as number, LADDERS[k])))
    .filter((x): x is number => x !== null);
  if (!levels.length) return null;
  const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
  return Math.min(7, 1 + Math.round(avg));
}

/** Waist divided by height. Under 0.5 is the common healthy target. */
export function waistToHeight(s: PersonalStats): number | null {
  return s.waistCm && s.heightCm ? s.waistCm / s.heightCm : null;
}

// ---------- Endurance feats your numbers prove ----------
const ENDURANCE_FROM_STATS: [string, (s: PersonalStats) => boolean][] = [
  ['run-5k', (s) => (s.longestRunKm ?? 0) >= 5 || s.best5kSec !== null],
  ['run-10k', (s) => (s.longestRunKm ?? 0) >= 10 || s.best10kSec !== null],
  ['5k-30', (s) => s.best5kSec !== null && s.best5kSec <= 30 * 60],
  ['5k-25', (s) => s.best5kSec !== null && s.best5kSec <= 25 * 60],
  ['5k-20', (s) => s.best5kSec !== null && s.best5kSec <= 20 * 60],
  ['10k-55', (s) => s.best10kSec !== null && s.best10kSec <= 55 * 60],
  ['10k-45', (s) => s.best10kSec !== null && s.best10kSec <= 45 * 60],
];

/** Ids of the endurance feats these numbers satisfy, e.g. "endurance.5k-30". */
export function enduranceRungsFromStats(s: PersonalStats): string[] {
  return ENDURANCE_FROM_STATS.filter(([, ok]) => ok(s)).map(([id]) => `endurance.${id}`);
}

// ---------- Times ----------
/** "27:30" -> 1650 seconds, "1:05:10" -> 3910. Returns null for anything else. */
export function parseDuration(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d{1,2}$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n > 59)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

export function formatDuration(sec: number | null): string {
  if (sec === null) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}
