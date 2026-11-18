import type { CompletionEvent } from '../engine/types';

/** Task details used to fill gaps in activity-log events (labels, section, parent, duration). */
export interface TaskInfo {
  labels?: string[];
  sectionId?: string | null;
  parentId?: string | null;
  durationMin?: number | null;
  priority?: number;
  projectId?: string;
  description?: string;
}

type Raw = Record<string, unknown>;
const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));
const pick = (o: Raw | undefined, ...keys: string[]): unknown => {
  if (!o) return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

/** Todoist durations come as {amount, unit} or as duration + duration_unit. */
export function durationMinutes(o: Raw | undefined): number | null {
  if (!o) return null;
  const d = pick(o, 'duration');
  if (d && typeof d === 'object') {
    const { amount, unit } = d as { amount?: number; unit?: string };
    if (typeof amount !== 'number') return null;
    return unit === 'day' ? amount * 1440 : amount;
  }
  if (typeof d === 'number') {
    const unit = pick(o, 'duration_unit', 'durationUnit');
    return unit === 'day' ? d * 1440 : d;
  }
  return null;
}

/** A task object from /tasks or /tasks/completed/* → TaskInfo. */
export function taskInfo(t: Raw): [string, TaskInfo] | null {
  const id = str(pick(t, 'id', 'task_id'));
  if (!id) return null;
  return [
    id,
    {
      labels: Array.isArray(t.labels) ? (t.labels as unknown[]).map(String) : undefined,
      sectionId: str(pick(t, 'section_id', 'sectionId')),
      parentId: str(pick(t, 'parent_id', 'parentId')),
      durationMin: durationMinutes(t),
      priority: typeof t.priority === 'number' ? t.priority : undefined,
      projectId: str(pick(t, 'project_id', 'projectId')) ?? undefined,
      description: typeof t.description === 'string' ? t.description : undefined,
    },
  ];
}

/** One "completed" activity-log event → CompletionEvent (null for anything else). */
export function normalizeActivity(raw: Raw, tasks: Map<string, TaskInfo>): CompletionEvent | null {
  if (pick(raw, 'event_type', 'eventType') !== 'completed') return null;
  const x = (pick(raw, 'extra_data', 'extraData') ?? {}) as Raw;
  const taskId = str(pick(raw, 'v2_object_id', 'object_id', 'objectId'));
  const completedAt = str(pick(raw, 'event_date', 'eventDate'));
  if (!taskId || !completedAt) return null;
  const info = tasks.get(taskId) ?? {};

  const labels = Array.isArray(x.labels) ? (x.labels as unknown[]).map(String) : (info.labels ?? []);
  const when = new Date(completedAt).toISOString();
  return {
    // Task + completion time: stable across the REST API and the connector (which rounds activity ids).
    id: `${taskId}@${when}`,
    taskId,
    content: String(pick(x, 'content') ?? ''),
    description: String(pick(x, 'description') ?? info.description ?? ''),
    projectId: str(pick(raw, 'v2_parent_project_id', 'parent_project_id', 'parentProjectId')) ?? info.projectId ?? '',
    sectionId: str(pick(x, 'section_id', 'sectionId')) ?? info.sectionId ?? null,
    parentId: str(pick(x, 'parent_id', 'parentId')) ?? str(pick(raw, 'v2_parent_item_id', 'parent_item_id')) ?? info.parentId ?? null,
    labels,
    priority: typeof x.priority === 'number' ? x.priority : (info.priority ?? 1),
    durationMin: durationMinutes(x) ?? info.durationMin ?? null,
    completedAt: when,
    recurring: Boolean(pick(x, 'is_recurring', 'isRecurring')),
  };
}
