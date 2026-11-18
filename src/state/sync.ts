import { call, connectorBridge, type Mcp } from '../todoist/connector';
import { DEFAULT_API_BASE, TodoistClient } from '../todoist/client';
import { decodeBackup, mergeBlobs, sameBlob, type StateBlob } from './blob';

/*
 * Sync through Todoist. The state is one small JSON blob kept in ONE comment on your Inbox project,
 * marked with MARKER so it can be found again. Every device reads it, merges it with its own copy
 * (the later change to each tick wins) and writes back only if something changed. Nothing else in
 * Todoist is created or changed. Deleting the comment loses nothing on a device that has its own copy.
 */

export const MARKER = '⚙️ realm-companion-state v5';
const MAX_COMMENT = 14_000; // Todoist comments are limited to about 15,000 characters

type Raw = Record<string, unknown>;

export interface Remote { id: string | null; blob: StateBlob | null }
export interface StateTransport {
  name: string;
  read(): Promise<Remote>;
  write(id: string | null, blob: StateBlob): Promise<void>;
}

export function toComment(blob: StateBlob): string {
  const text = `${MARKER}\n${JSON.stringify(blob)}\nRealm Companion sync data. Safe to ignore.`;
  if (text.length > MAX_COMMENT) throw new Error('Your notes are too long to sync. Shorten them and try again.');
  return text;
}

/** The blob inside a comment, or null if this comment is not ours or is unreadable. */
export function fromComment(content: unknown): StateBlob | null {
  if (typeof content !== 'string' || !content.startsWith(MARKER)) return null;
  const line = content.split('\n')[1];
  if (!line) return null;
  try {
    return decodeBackup(line);
  } catch {
    return null;
  }
}

const rows = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);

/** Through the viewer's own Todoist connector, inside claude.ai. */
export function connectorTransport(mcp: Mcp): StateTransport {
  return {
    name: 'Todoist connector',
    async read() {
      let cursor: string | undefined;
      for (let page = 0; page < 5; page++) {
        const input: Raw = { projectId: 'inbox', limit: 10 };
        if (cursor) input.cursor = cursor;
        const res = await call(mcp, 'find-comments', input);
        for (const c of rows(res.comments)) {
          const blob = fromComment(c.content);
          if (blob) return { id: String(c.id), blob };
        }
        cursor = [res.nextCursor, res.next_cursor, res.cursor].find((x): x is string => typeof x === 'string');
        if (!res.hasMore || !cursor) break;
      }
      return { id: null, blob: null };
    },
    async write(id, blob) {
      const content = toComment(blob);
      if (id) await call(mcp, 'update-comments', { comments: [{ id, content }] });
      else await call(mcp, 'add-comments', { comments: [{ projectId: 'inbox', content, notifyUsers: ['none'] }] });
    },
  };
}

/** Through the REST API with a personal token, in the Android app. */
export function restTransport(token: string, apiBase: string): StateTransport {
  const client = new TodoistClient(token, apiBase || DEFAULT_API_BASE);
  let inbox: string | null = null;
  const inboxId = async () => {
    if (inbox) return inbox;
    const projects = await client.list('/projects', { limit: 200 });
    const p = projects.find((x) => x.inbox_project === true || x.is_inbox_project === true);
    if (!p) throw new Error('Could not find your Inbox project.');
    inbox = String(p.id);
    return inbox;
  };
  return {
    name: 'Todoist API',
    async read() {
      const comments = await client.list('/comments', { project_id: await inboxId(), limit: 100 });
      for (const c of comments) {
        const blob = fromComment(c.content);
        if (blob) return { id: String(c.id), blob };
      }
      return { id: null, blob: null };
    },
    async write(id, blob) {
      const content = toComment(blob);
      if (id) await client.send('POST', `/comments/${id}`, { content });
      else await client.send('POST', '/comments', { project_id: await inboxId(), content });
    },
  };
}

/** Pick the transport that works here, or null when there is no way to reach Todoist. */
export async function pickTransport(token: string, apiBase: string): Promise<StateTransport | null> {
  const bridge = await connectorBridge();
  if (bridge) return connectorTransport(bridge);
  return token ? restTransport(token, apiBase) : null;
}

export interface SyncResult { blob: StateBlob; wrote: boolean; changedLocal: boolean }

/** Read the remote copy, merge it with ours, and write back only when the remote copy is behind. */
export async function syncState(local: StateBlob, t: StateTransport): Promise<SyncResult> {
  const remote = await t.read();
  const merged = remote.blob ? mergeBlobs(local, remote.blob) : local;
  const needsWrite = !remote.blob || !sameBlob(merged, remote.blob);
  if (needsWrite) await t.write(remote.id, merged);
  return { blob: merged, wrote: needsWrite, changedLocal: !sameBlob(merged, local) };
}
