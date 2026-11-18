import { get, set, del } from 'idb-keyval';
import type { Claims, CompletionEvent, Profile, TodoistMeta } from './engine/types';

/*
 * Everything stays in this browser. Small settings → localStorage; the completion history
 * (thousands of events) → IndexedDB. All access is wrapped: storage can be blocked.
 */

/** Free-text "where I am now". Typed in the app, stays in this browser, never part of the code. */
export interface Situation {
  focus: string;
  goals: string;
  notes: string;
  updatedAt: string | null;
}

export interface Settings {
  token: string;
  apiBase: string;
  profile: Profile;
  situation: Situation;
  /** Milestones you ticked by hand: id -> ISO date. */
  claims: Claims;
  imbalanceThreshold: number;
  /** Advanced: JSON merged over the default engine config. */
  configOverride: string;
}

export const DEFAULT_SETTINGS: Settings = {
  token: '',
  apiBase: '',
  profile: { netWageRon: 0, positionRank: 0 },
  situation: { focus: '', goals: '', notes: '', updatedAt: null },
  // Told to Claude directly: 10 strict pull-ups and 15 strict dips.
  claims: { 'body.strength.4': '2026-11-18' },
  imbalanceThreshold: 2,
  configOverride: '',
};

const SETTINGS_KEY = 'realm-companion:settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS, ...s,
      profile: { ...DEFAULT_SETTINGS.profile, ...s.profile },
      situation: { ...DEFAULT_SETTINGS.situation, ...s.situation },
      claims: s.claims ?? DEFAULT_SETTINGS.claims,
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
