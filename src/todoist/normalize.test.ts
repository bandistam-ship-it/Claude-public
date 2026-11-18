import { describe, expect, it } from 'vitest';
import { normalizeActivity, taskInfo } from './normalize';

describe('normalizeActivity', () => {
  it('reads a completed recurring task event from the activity log', () => {
    const raw = {
      id: '2.16', object_type: 'item', object_id: 'task-plants', event_type: 'completed',
      event_date: '2026-09-09T18:20:28.964Z', parent_project_id: 'project-town',
      extra_data: {
        content: 'Uda plantele', section_id: 'section-castle', labels: ['Easy', 'PeasantLife'],
        duration: 15, duration_unit: 'minute', is_recurring: true, priority: 2,
      },
    };
    expect(normalizeActivity(raw, new Map())).toEqual({
      id: 'task-plants@2026-09-09T18:20:28.964Z', taskId: 'task-plants', content: 'Uda plantele', description: '',
      projectId: 'project-town', sectionId: 'section-castle', parentId: null,
      labels: ['Easy', 'PeasantLife'], priority: 2, durationMin: 15,
      completedAt: '2026-09-09T18:20:28.964Z', recurring: true,
    });
  });

  it('fills missing labels/section/parent from the task index', () => {
    const [id, info] = taskInfo({
      id: 't1', labels: ['Mind', 'Medium'], section_id: 's1', parent_id: null,
      duration: { amount: 165, unit: 'minute' }, project_id: 'p1',
    })!;
    const e = normalizeActivity(
      { id: 'a1', object_id: 't1', event_type: 'completed', event_date: '2026-11-17T10:58:42Z', extra_data: { content: 'Drept penal' } },
      new Map([[id, info]]),
    )!;
    expect(e.labels).toEqual(['Mind', 'Medium']);
    expect(e.sectionId).toBe('s1');
    expect(e.durationMin).toBe(165);
    expect(e.projectId).toBe('p1');
  });

  it('skips non-completion events', () => {
    expect(normalizeActivity({ event_type: 'added', object_id: 'x', event_date: '2026-01-01' }, new Map())).toBeNull();
  });
});
