import type { TodoistMeta } from '../engine/types';
import { taskInfo, type TaskInfo } from './normalize';

export const DEFAULT_API_BASE = 'https://api.todoist.com/api/v1';

export type Raw = Record<string, unknown>;
interface Page { results?: Raw[]; items?: Raw[]; next_cursor?: string | null }

export class TodoistError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export class TodoistClient {
  private token: string;
  private base: string;
  constructor(token: string, base = DEFAULT_API_BASE) {
    this.token = token;
    this.base = base.replace(/\/$/, '');
  }

  private async get(path: string, params: Record<string, string | number | undefined> = {}): Promise<Raw> {
    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    } catch {
      throw new TodoistError(
        'Could not reach Todoist from the browser (network or CORS). Check your connection, or set an API proxy in Settings.',
      );
    }
    if (res.status === 401 || res.status === 403) throw new TodoistError('Todoist rejected the API token.', res.status);
    if (res.status === 429) throw new TodoistError('Todoist rate limit hit — try again in a few minutes.', 429);
    if (!res.ok) throw new TodoistError(`Todoist API error ${res.status} on ${path}`, res.status);
    return (await res.json()) as Raw;
  }

  /** Follow next_cursor until exhausted (the caller may stop early). */
  private async *paged(path: string, params: Record<string, string | number | undefined> = {}) {
    let cursor: string | undefined;
    do {
      const page = (await this.get(path, { ...params, cursor })) as unknown as Page | Raw[];
      const results = Array.isArray(page) ? page : (page.results ?? page.items);
      yield results ?? [];
      cursor = Array.isArray(page) ? undefined : (page.next_cursor ?? undefined);
    } while (cursor);
  }

  private async all(path: string, params: Record<string, string | number | undefined> = {}): Promise<Raw[]> {
    const out: Raw[] = [];
    for await (const page of this.paged(path, params)) out.push(...page);
    return out;
  }

  async meta(): Promise<TodoistMeta> {
    const [active, archived, sections] = await Promise.all([
      this.all('/projects', { limit: 200 }),
      this.all('/projects/archived', { limit: 200 }).catch(() => [] as Raw[]),
      this.all('/sections', { limit: 200 }),
    ]);
    const projects: TodoistMeta['projects'] = {};
    for (const p of [...active, ...archived]) projects[String(p.id)] = String(p.name);
    const secs: TodoistMeta['sections'] = {};
    for (const s of sections) secs[String(s.id)] = { name: String(s.name), projectId: String(s.project_id) };
    return { projects, sections: secs };
  }

  /** Active tasks + completed (non-recurring) tasks since `since`, to fill gaps in activity events. */
  async taskIndex(since: Date, onProgress?: (msg: string) => void): Promise<Map<string, TaskInfo>> {
    const index = new Map<string, TaskInfo>();
    const add = (t: Raw) => {
      const e = taskInfo(t);
      if (e) index.set(e[0], { ...index.get(e[0]), ...e[1] });
    };
    for (const t of await this.all('/tasks', { limit: 200 })) add(t);
    // The completed-tasks endpoint accepts windows of up to ~3 months.
    const WINDOW = 89 * 86_400_000;
    for (let start = since.getTime(); start < Date.now(); start += WINDOW) {
      const until = new Date(Math.min(start + WINDOW, Date.now()));
      onProgress?.(`Reading completed tasks up to ${until.toISOString().slice(0, 10)}…`);
      const items = await this.all('/tasks/completed/by_completion_date', {
        since: new Date(start).toISOString(),
        until: until.toISOString(),
        limit: 200,
      }).catch(() => [] as Raw[]);
      for (const t of items) add(t);
    }
    return index;
  }

  /**
   * Raw "completed" events, newest first, from the activity log — the only source that includes
   * each occurrence of a recurring task. Stops early once it reaches an already-stored event.
   */
  async rawCompletions(known: Set<string>, onProgress?: (n: number) => void): Promise<Raw[]> {
    const out: Raw[] = [];
    for await (const page of this.paged('/activities', { object_type: 'item', event_type: 'completed', limit: 100 })) {
      let reachedKnown = false;
      for (const raw of page) {
        if (known.has(String(raw.id))) reachedKnown = true;
        else out.push(raw);
      }
      onProgress?.(out.length);
      if (reachedKnown) break;
    }
    return out;
  }
}
