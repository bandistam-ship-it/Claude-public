import { get, set, del } from 'idb-keyval';
import type { Claims, CompletionEvent, TodoistMeta } from './engine/types';

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
  situation: Situation;
  /** Milestones you ticked by hand: id -> ISO date. */
  claims: Claims;
  /** Settings schema version. Older versions used different milestone ids, so their ticks are dropped. */
  version: number;
  /** Advanced: JSON merged over the default engine config. */
  configOverride: string;
}

export const DEFAULT_SETTINGS: Settings = {
  token: '',
  apiBase: '',
  situation: { focus: '', goals: '', notes: '', updatedAt: null },
  // Told to Claude directly: 10 strict pull-ups and 15 strict dips (which includes a first pull-up).
  claims: { 'calisthenics.3': '2026-11-18', 'calisthenics.6': '2026-11-18', 'calisthenics.8': '2026-11-18' },
  version: 3,
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
      situation: { ...DEFAULT_SETTINGS.situation, ...s.situation },
      claims: s.version === 3 && s.claims ? s.claims : DEFAULT_SETTINGS.claims,
      version: 3,
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
