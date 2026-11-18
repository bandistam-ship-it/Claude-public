import { get, set, del } from 'idb-keyval';
import type { CompletionEvent, PersonalStats, TodoistMeta } from './engine/types';
import { EMPTY_STATS } from './engine/stats';
import { EMPTY_PROFILE, EMPTY_SITUATION, type ClaimLog, type Profile, type Situation } from './state/blob';

/*
 * Everything stays in this browser. Small settings → localStorage; the completion history
 * (thousands of events) → IndexedDB. All access is wrapped: storage can be blocked.
 */

export type { Situation } from './state/blob';

export interface Settings {
  token: string;
  apiBase: string;
  profile: Profile;
  situation: Situation;
  /** Your measurements, max reps and running bests. */
  stats: PersonalStats;
  /** Ticks, with un-ticks and timestamps so two devices can be merged. */
  claimLog: ClaimLog;
  /** Opt in: keep ticks, profile and notes in sync through one Todoist comment. */
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  /** Advanced: JSON merged over the default engine config. */
  configOverride: string;
  /** Settings schema version. */
  version: number;
}

export const DEFAULT_SETTINGS: Settings = {
  token: '',
  apiBase: '',
  profile: EMPTY_PROFILE,
  situation: EMPTY_SITUATION,
  stats: EMPTY_STATS,
  claimLog: {},
  syncEnabled: false,
  lastSyncedAt: null,
  configOverride: '',
  version: 5,
};

const SETTINGS_KEY = 'realm-companion:settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings> & { claims?: Record<string, string> };
    // Version 4 stored plain ticks (id -> date). They keep their permanent ids, so carry them over.
    let claimLog: ClaimLog = s.version === 5 && s.claimLog ? s.claimLog : {};
    if (s.version === 4 && s.claims) {
      claimLog = Object.fromEntries(Object.entries(s.claims).map(([id, date]) => [id, { date, at: `${date}T00:00:00.000Z` }]));
    }
    return {
      ...DEFAULT_SETTINGS, ...s,
      profile: { ...EMPTY_PROFILE, ...s.profile },
      situation: { ...EMPTY_SITUATION, ...s.situation },
      stats: { ...EMPTY_STATS, ...s.stats },
      claimLog,
      version: 5,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked — settings live for this session only */
  }
}

export interface History {
  events: CompletionEvent[];
  meta: TodoistMeta;
  lastSync: string | null;
}

export const EMPTY_HISTORY: History = { events: [], meta: { projects: {}, sections: {} }, lastSync: null };

export async function loadHistory(): Promise<History> {
  try {
    return (await get<History>('history')) ?? EMPTY_HISTORY;
  } catch {
    return EMPTY_HISTORY;
  }
}

export async function saveHistory(h: History): Promise<void> {
  try {
    await set('history', h);
  } catch {
    /* ignore */
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await del('history');
  } catch {
    /* ignore */
  }
}
