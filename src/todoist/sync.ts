import type { History } from '../store';
import { DEFAULT_API_BASE, TodoistClient, type Raw } from './client';
import { normalizeActivity } from './normalize';

/**
 * Pull new completions into the stored history. The first run reads the whole activity log;
 * later runs stop as soon as they reach an event already stored.
 */
export async function sync(
  token: string,
  apiBase: string,
  history: History,
  onProgress: (msg: string) => void,
): Promise<History> {
  const client = new TodoistClient(token, apiBase || DEFAULT_API_BASE);
  onProgress('Reading projects and sections…');
  const meta = await client.meta();

  const known = new Set(history.events.map((e) => e.id));
  const raws = await client.rawCompletions(known, (n) => onProgress(`Reading activity log… ${n} new completions`));

  // Fill in labels/sections the activity log leaves out, from the task lists.
  const needsInfo = raws.some((r) => !Array.isArray((r.extra_data as Raw | undefined)?.labels));
  const dates = raws.map((r) => Date.parse(String(r.event_date))).filter(Number.isFinite);
  const since = new Date(dates.length ? Math.min(...dates) : Date.now());
  const index = needsInfo ? await client.taskIndex(since, onProgress) : new Map();

  const fresh = raws.map((r) => normalizeActivity(r, index)).filter((e) => e !== null);
  onProgress(`Synced ${fresh.length} new completions.`);
  return { events: [...history.events, ...fresh], meta, lastSync: new Date().toISOString() };
}
