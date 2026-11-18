import type { History } from '../store';
import { normalizeActivity } from './normalize';

/*
 * When the app runs as a claude.ai Artifact it can read Todoist through the viewer's own
 * Todoist connector (no API token, no CORS). Outside claude.ai this resolves to null and the
 * app falls back to the personal-token client.
 */

export const TODOIST_SERVER = 'Todoist';
export const CONNECTOR_TOOLS = ['user-info', 'find-projects', 'find-sections', 'find-activity', 'find-comments', 'add-comments', 'update-comments'];

type Raw = Record<string, unknown>;

interface McpError { code: string; message: string; retryable?: boolean; retryAfterMs?: number }
export interface Mcp {
  callTool(server: string, tool: string, input?: unknown, opts?: { cache?: false }): Promise<{ payload?: unknown }>;
}
interface ClaudeRuntime { use(name: string): Promise<unknown> }

let mcpPromise: Promise<Mcp | null> | null = null;

/** The viewer's MCP bridge, or null when not running inside claude.ai. */
export function connectorBridge(): Promise<Mcp | null> {
  if (!mcpPromise) {
    const claude = (window as unknown as { claude?: ClaudeRuntime }).claude;
    mcpPromise = claude?.use ? (claude.use('mcp') as Promise<Mcp | null>).catch(() => null) : Promise.resolve(null);
  }
  return mcpPromise;
}

/** Human message for each connector failure, with the action that fixes it. */
export function connectorErrorMessage(e: unknown): string {
  const err = e as Partial<McpError>;
  switch (err.code) {
    case 'needs_reauth':
      return 'Your Todoist connector needs to be reconnected: claude.ai → Settings → Connectors → Todoist.';
    case 'server_not_connected':
    case 'selection_required':
      return 'Add (or choose) the Todoist connector in claude.ai → Settings → Connectors, then sync again.';
    case 'not_in_manifest':
    case 'approval_required':
    case 'consent_required':
      return 'This page needs your permission to read Todoist. Click Sync and allow it when asked.';
    case 'blocked_by_policy':
      return 'Your organisation’s policy blocks Todoist access from this page.';
    case 'server_unavailable':
    case 'rate_limited':
      return 'Todoist didn’t answer in time. Try Sync again in a minute.';
    case 'tool_error':
      return `Todoist reported an error: ${err.message ?? 'unknown'}`;
    default:
      return `Couldn’t read Todoist (${err.code ?? 'error'}): ${err.message ?? ''}`;
  }
}

export async function call(mcp: Mcp, tool: string, input: Raw): Promise<Raw> {
  try {
    const r = await mcp.callTool(TODOIST_SERVER, tool, input, { cache: false });
    return (r.payload ?? {}) as Raw;
  } catch (e) {
    const err = e as Partial<McpError>;
    // One retry for transient reads only.
    if (err.retryable) {
      await new Promise((res) => setTimeout(res, Math.min(err.retryAfterMs ?? 2000, 10_000) + Math.random() * 1000));
      const r = await mcp.callTool(TODOIST_SERVER, tool, input, { cache: false });
      return (r.payload ?? {}) as Raw;
    }
    throw e;
  }
}

const list = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);

export async function syncViaConnector(mcp: Mcp, history: History, onProgress: (msg: string) => void): Promise<History> {
  onProgress('Reading your Todoist account…');
  const me = await call(mcp, 'user-info', {});
  const userId = String(me.userId ?? me.id ?? '');

  onProgress('Reading projects and sections…');
  const projPayload = await call(mcp, 'find-projects', { archivedStatus: 'all', limit: 200 });
  const projects: Record<string, string> = {};
  for (const p of list(projPayload.projects)) projects[String(p.id)] = String(p.name);
  const sections: History['meta']['sections'] = {};
  for (const projectId of Object.keys(projects)) {
    const s = await call(mcp, 'find-sections', { projectId }).catch(() => ({}) as Raw);
    for (const sec of list(s.sections)) sections[String(sec.id)] = { name: String(sec.name), projectId };
  }

  // Activity log, newest first; stop at the first page that reaches already-stored events.
  const known = new Set(history.events.map((e) => e.id));
  const fresh: History['events'] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 500; page++) {
    const input: Raw = { objectType: 'task', eventType: 'completed', limit: 100 };
    if (userId) input.initiatorId = userId;
    if (cursor) input.cursor = cursor;
    const res = await call(mcp, 'find-activity', input);
    let reachedKnown = false;
    for (const raw of list(res.events)) {
      const e = normalizeActivity(raw, new Map());
      if (!e) continue;
      if (known.has(e.id)) reachedKnown = true;
      else {
        known.add(e.id);
        fresh.push(e);
      }
    }
    onProgress(`Reading your completed tasks… ${fresh.length} so far`);
    cursor = typeof res.nextCursor === 'string' && res.hasMore !== false ? res.nextCursor : undefined;
    if (reachedKnown || !cursor) break;
  }

  onProgress(`Synced ${fresh.length} new completions.`);
  return { events: [...history.events, ...fresh], meta: { projects, sections }, lastSync: new Date().toISOString() };
}
