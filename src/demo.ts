import type { CompletionEvent, TodoistMeta } from './engine/types';
import type { History } from './store';

/** Synthetic history shaped like the real account, for trying the app without a token. */
export function demoHistory(): History {
  const meta: TodoistMeta = {
    projects: { inbox: 'Inbox', realm: 'The Realm', sport: 'Sport', barou: 'Barou 2027 – Program zilnic' },
    sections: {
      library: { name: '📚 Library', projectId: 'realm' },
      bonfire: { name: '🔥 Bonfire', projectId: 'realm' },
      keep: { name: '🏰 Keep', projectId: 'realm' },
      chancery: { name: '📜 Chancery', projectId: 'realm' },
      tavern: { name: '🍺 Tavern', projectId: 'realm' },
      boss: { name: '🐉 Boss Fights', projectId: 'realm' },
    },
  };
  const events: CompletionEvent[] = [];
  let n = 0;
  const start = Date.parse('2026-05-04T08:00:00Z');
  const add = (day: number, p: Partial<CompletionEvent> & { content: string }) => {
    n++;
    events.push({
      id: `demo${n}`, taskId: `demo-task${n}`, description: '', projectId: 'realm', sectionId: null, parentId: null,
      labels: [], priority: 1, durationMin: null, recurring: false, ...p,
      completedAt: new Date(start + day * 86_400_000).toISOString(),
    });
  };

  for (let day = 0; day < 196; day++) {
    const dow = day % 7;
    if ([0, 2, 4].includes(dow)) {
      add(day, { content: 'Drept civil: Posesia (partea 1/2)', projectId: 'barou', labels: ['Barou', 'Civil', 'Medium', 'Mind'], durationMin: 165 });
    }
    if ([1, 3, 5].includes(dow)) {
      const parent = `session${day}`;
      add(day, { content: 'Day A – Explosive pull', projectId: 'sport', taskId: parent });
      add(day, { content: 'Strict pull-ups, bodyweight – 2x4', projectId: 'sport', parentId: parent });
      add(day, { content: 'Banded muscle-ups – 4x2', projectId: 'sport', parentId: parent });
      add(day, { content: 'Straight bar dips – 3x10', projectId: 'sport', parentId: parent });
    }
    if (dow === 6) add(day, { content: 'Fă curat', sectionId: 'keep', labels: ['Easy', 'Upkeep'] });
    if (day % 14 === 1) add(day, { content: 'Jurnal de seară', sectionId: 'bonfire', labels: ['Medium', 'Spirit'], durationMin: 30 });
    if (day % 10 === 3) add(day, { content: 'Trimite mail', sectionId: 'chancery', labels: ['Duty', 'Easy'] });
    if (day % 21 === 5) add(day, { content: 'Ieșire cu prietenii', sectionId: 'tavern', labels: ['Bonds', 'Easy'] });
  }
  add(188, { content: 'Primul muscle up', sectionId: 'boss', labels: ['Achievement', 'Body', 'Boss-fight'] });
  return { events, meta, lastSync: null };
}
