import type { Group } from '../engine/demographics';
import type { Claims } from '../engine/types';

/*
 * Everything the app knows that Todoist does not: the skills you ticked, who you are (for age and
 * sex norms) and your situation notes. It is one small JSON blob. The same blob is used for the
 * copy-paste backup and for syncing between devices through Todoist, and `mergeBlobs` combines two
 * copies without losing either device's changes.
 */

/** A tick, or an un-tick (date null). `at` is when you made the change and decides conflicts. */
export interface ClaimEntry { date: string | null; at: string }
export type ClaimLog = Record<string, ClaimEntry>;

export interface Profile { age: number | null; group: Group; updatedAt: string | null }
export interface Situation { focus: string; goals: string; notes: string; updatedAt: string | null }

export interface StateBlob {
  app: 'realm-companion';
  v: 5;
  updatedAt: string;
  claimLog: ClaimLog;
  profile: Profile;
  situation: Situation;
}

export const EMPTY_PROFILE: Profile = { age: null, group: 'everyone', updatedAt: null };
export const EMPTY_SITUATION: Situation = { focus: '', goals: '', notes: '', updatedAt: null };

/** The ticks as the engine wants them: id -> date, without un-ticked entries. */
export function claimsOf(log: ClaimLog): Claims {
  const out: Claims = {};
  for (const [id, e] of Object.entries(log)) if (e.date) out[id] = e.date;
  return out;
}

/** Build the shareable blob. Its `updatedAt` is the latest change it contains. */
export function buildBlob(claimLog: ClaimLog, profile: Profile, situation: Situation): StateBlob {
  const stamps = [...Object.values(claimLog).map((e) => e.at), profile.updatedAt, situation.updatedAt].filter((x): x is string => Boolean(x));
  return { app: 'realm-companion', v: 5, updatedAt: stamps.sort().at(-1) ?? new Date(0).toISOString(), claimLog, profile, situation };
}

export function setClaim(log: ClaimLog, id: string, date: string | null, at: string): ClaimLog {
  return { ...log, [id]: { date, at } };
}

const newer = (a: string | null, b: string | null) => (a ?? '') >= (b ?? '');

/** Combine two copies. For each tick the later change wins; profile and situation are taken whole from the newer copy. */
export function mergeBlobs(a: StateBlob, b: StateBlob): StateBlob {
  const claimLog: ClaimLog = { ...a.claimLog };
  for (const [id, e] of Object.entries(b.claimLog)) {
    const mine = claimLog[id];
    if (!mine || e.at > mine.at) claimLog[id] = e;
  }
  return {
    app: 'realm-companion', v: 5,
    updatedAt: a.updatedAt >= b.updatedAt ? a.updatedAt : b.updatedAt,
    claimLog,
    profile: newer(a.profile.updatedAt, b.profile.updatedAt) ? a.profile : b.profile,
    situation: newer(a.situation.updatedAt, b.situation.updatedAt) ? a.situation : b.situation,
  };
}

export function sameBlob(a: StateBlob, b: StateBlob): boolean {
  return JSON.stringify([a.claimLog, a.profile, a.situation]) === JSON.stringify([b.claimLog, b.profile, b.situation]);
}

// ---------- Backup text ----------

export function encodeBackup(blob: StateBlob): string {
  return JSON.stringify(blob, null, 1);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse and validate a backup. Throws a readable Error for anything that is not a backup. */
export function decodeBackup(text: string): StateBlob {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    throw new Error('That is not a backup. It must be the text copied from the app.');
  }
  if (!isObj(raw) || raw.app !== 'realm-companion') throw new Error('That text is not a Realm Companion backup.');
  const log: ClaimLog = {};
  if (isObj(raw.claimLog)) {
    for (const [id, e] of Object.entries(raw.claimLog)) {
      if (isObj(e) && typeof e.at === 'string' && (e.date === null || typeof e.date === 'string')) log[id] = { date: e.date as string | null, at: e.at };
    }
  }
  const p = isObj(raw.profile) ? raw.profile : {};
  const s = isObj(raw.situation) ? raw.situation : {};
  const group = p.group === 'men' || p.group === 'women' ? p.group : 'everyone';
  const age = typeof p.age === 'number' && p.age >= 10 && p.age <= 110 ? Math.round(p.age) : null;
  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 2000) : '');
  return {
    app: 'realm-companion', v: 5,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
    claimLog: log,
    profile: { age, group, updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : null },
    situation: { focus: str(s.focus), goals: str(s.goals), notes: str(s.notes), updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : null },
  };
}
