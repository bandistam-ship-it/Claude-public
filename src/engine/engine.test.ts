import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { DEFAULT_CONFIG as C } from './config';
import { bestStreak, computeState, levelOf } from './engine';
import { matchFeat } from './feats';
import { norm, parseReps } from './text';
import type { CompletionEvent, Profile, TodoistMeta } from './types';

// Fixtures modelled on the real Todoist account (task names are real).
const META: TodoistMeta = {
  projects: {
    inbox: 'Inbox', realm: 'The Realm', town: 'The Town', sport: 'Sport',
    meso2: 'Sport · Meso 2 – Wall HSPU', barou: 'Barou 2027 – Program zilnic',
  },
  sections: {
    library: { name: '📚 Library', projectId: 'realm' },
    barracks: { name: '🏋️ Barracks', projectId: 'realm' },
    keep: { name: '🏰 Keep', projectId: 'realm' },
    chancery: { name: '📜 Chancery', projectId: 'realm' },
    vault: { name: '🛒 Rewards Vault', projectId: 'realm' },
    castle: { name: 'Castle', projectId: 'town' },
    tavern: { name: 'Tavern', projectId: 'town' },
    war: { name: 'War', projectId: 'town' },
  },
};
const STUDENT: Profile = { netWageRon: 0, positionRank: 0 };

let seq = 0;
function ev(p: Partial<CompletionEvent> & { content: string }): CompletionEvent {
  seq++;
  return {
    id: `e${seq}`, taskId: `t${seq}`, description: '', projectId: 'inbox', sectionId: null, parentId: null,
    labels: [], priority: 1, durationMin: null, completedAt: '2026-11-10T10:00:00Z', recurring: false, ...p,
  };
}
const daysAfter = (iso: string, days: number) => new Date(Date.parse(iso) + days * 86_400_000).toISOString();

describe('text', () => {
  it('normalises Romanian diacritics and emoji', () => {
    expect(norm('📚 Învață proprietatea privată')).toBe('invata proprietatea privata');
    expect(norm('Fă curat în cameră')).toBe('fa curat in camera');
  });
  it('parses reps but not timed holds', () => {
    expect(parseReps('Strict pull-ups, bodyweight – 2x4')).toBe(4);
    expect(parseReps('Straight bar dips – 4x10')).toBe(10);
    expect(parseReps('Pike push-ups — 3×10–12')).toBe(10);
    expect(parseReps('Wall handstand – 3×20–30 s')).toBeNull();
    expect(parseReps('8 reps')).toBe(8);
    expect(parseReps('Primul muscle up')).toBeNull();
  });
});

describe('classify', () => {
  const b = (e: CompletionEvent) => classify(e, META, C).bucket;
  it('uses Realm stat labels first', () => {
    expect(b(ev({ content: 'Licență la bibliotecă', projectId: 'realm', sectionId: 'library', labels: ['Hard', 'Licenta', 'Mind'] }))).toBe('mind');
    expect(b(ev({ content: 'Închide un abonament', projectId: 'realm', sectionId: 'chancery', labels: ['Duty', 'Easy'] }))).toBe('career');
    expect(b(ev({ content: 'Răspunde colegului', labels: ['Duty', 'Easy', 'Profesie'] }))).toBe('career');
  });
  it('maps The Town by section and Sport/Barou by project', () => {
    expect(b(ev({ content: 'Schimbă apa la țestoase', projectId: 'town', sectionId: 'castle' }))).toBe('upkeep');
    expect(b(ev({ content: 'Trimite mesaj unui prieten', projectId: 'town', sectionId: 'tavern' }))).toBe('ignored');
    expect(b(ev({ content: 'Day B – Transition Skill', projectId: 'sport' }))).toBe('body');
    expect(b(ev({ content: 'Day A – Deload', projectId: 'meso2' }))).toBe('body');
    expect(b(ev({ content: 'Drept civil: Posesia', projectId: 'barou' }))).toBe('mind');
  });
  it('never scores relationships', () => {
    expect(b(ev({ content: 'Ieșire cu prietenii', labels: ['Bonds', 'Easy'] }))).toBe('ignored');
    expect(b(ev({ content: 'Sună-o pe mama' }))).toBe('ignored');
  });
  it('ignores rewards, uses keywords for the Inbox, else neutral', () => {
    expect(b(ev({ content: 'Botez la prieteni', labels: ['Friends', 'Rewards'] }))).toBe('ignored');
    expect(b(ev({ content: 'Cinema', projectId: 'realm', sectionId: 'vault' }))).toBe('ignored');
    expect(b(ev({ content: 'Fă curat în bucătărie' }))).toBe('upkeep');
    expect(b(ev({ content: 'Citește 50 de pagini' }))).toBe('mind');
    expect(b(ev({ content: 'Xyzzy' }))).toBe('neutral');
  });
});

describe('feats: hard gates, clean form only', () => {
  const f = (id: string) => C.feats.find((x) => x.id === id)!;
  const sport = (content: string, labels: string[] = []) => ev({ content, projectId: 'sport', labels });
  it('counts a strict pull-up set as a pull-up, not as 10', () => {
    const e = sport('Strict pull-ups, bodyweight – 2x4');
    expect(matchFeat(e, 'body', f('pullup1'))).toBe('counted');
    expect(matchFeat(e, 'body', f('pullup10'))).toBeNull();
  });
  it('never counts assisted variants, attempts or tests', () => {
    for (const c of [
      'Banded muscle-ups (Week 7 band) – 2x2',
      'Muscle-up negatives (from a jump) – 3x2, 5s lower',
      'Muscle-up attempts (lightest clean band) – 5 attempts, film one',
      'Unassisted muscle-up attempts – 3 attempts (conditional)',
      '🎯 MUSCLE-UP TEST – 5 attempts max',
    ]) expect(matchFeat(sport(c), 'body', f('muscleup1'))).toBeNull();
  });
  it('needs proof of clean form for a body milestone', () => {
    const first = ev({ content: 'Primul muscle up', labels: ['Achievement', 'Body', 'Boss-fight'] });
    expect(matchFeat(first, 'body', f('muscleup1'))).toBe('needs-clean-form');
    expect(matchFeat({ ...first, labels: [...first.labels, 'Clean'] }, 'body', f('muscleup1'))).toBe('counted');
    expect(matchFeat(sport('Straight bar dips – 3x15'), 'body', f('dips15'))).toBe('needs-clean-form');
    expect(matchFeat(sport('Straight bar dips – 4x10'), 'body', f('dips15'))).toBeNull();
  });
  it('detects academic milestones only when the result is stated', () => {
    expect(matchFeat(ev({ content: 'Licență la bibliotecă', labels: ['Hard'] }), 'mind', f('licenta'))).toBeNull();
    expect(matchFeat(ev({ content: 'Licență susținută!', labels: ['Achievement'] }), 'mind', f('licenta'))).toBe('counted');
    expect(matchFeat(ev({ content: 'Admis la Barou', labels: ['Boss-fight'] }), 'career', f('barou'))).toBe('counted');
  });
});

describe('scoring', () => {
  it('a Sport session earns Medium XP once; its exercise subtasks earn nothing', () => {
    const parent = ev({ content: 'Day B – Transition Skill', projectId: 'sport' });
    const sub = ev({ content: 'Straight bar dips – 4x10', projectId: 'sport', parentId: parent.taskId });
    const s = computeState([parent, sub], META, STUDENT, C);
    expect(s.scored.map((x) => x.xp)).toEqual([25, 0]);
  });
  it('scales by duration with diminishing returns (2h45 Barou day)', () => {
    const e = ev({ content: 'Drept penal', projectId: 'barou', labels: ['Barou', 'Medium', 'Mind'], durationMin: 165 });
    expect(computeState([e], META, STUDENT, C).scored[0].xp).toBe(41); // 25 × √2.75
  });
  it('rest days are Easy', () => {
    const e = ev({ content: 'Day C – Rest or walk', projectId: 'sport' });
    expect(computeState([e], META, STUDENT, C).scored[0].xp).toBe(10);
  });
  it('halves XP beyond 4 same-stat completions in a day', () => {
    const evs = Array.from({ length: 6 }, () => ev({ content: 'Citește', labels: ['Mind', 'Easy'] }));
    expect(computeState(evs, META, STUDENT, C).scored.map((x) => x.xp)).toEqual([10, 10, 10, 10, 5, 5]);
  });
});

describe('tiers and gates', () => {
  // 60 weeks of daily Medium body sessions: plenty of XP.
  const training = (labelsExtra: string[] = []) =>
    Array.from({ length: 420 }, (_, i) =>
      ev({ content: 'Day A – Explosive pull', projectId: 'sport', labels: labelsExtra, completedAt: daysAfter('2025-01-01T08:00:00Z', i) }),
    );

  it('XP alone cannot buy a tier: without feats Body stays at tier 1', () => {
    const s = computeState(training(), META, STUDENT, C).stats.find((x) => x.def.id === 'body')!;
    expect(s.xpTier).toBeGreaterThanOrEqual(4);
    expect(s.tier).toBe(1);
    expect(s.gateLocked).toBe(true);
  });

  it('a clean pull-up unlocks tiers 2–3 (it implies 10 push-ups)', () => {
    const evs = [...training(), ev({ content: 'Strict pull-ups, bodyweight – 2x4', projectId: 'sport', completedAt: '2025-03-01T08:00:00Z' })];
    const s = computeState(evs, META, STUDENT, C).stats.find((x) => x.def.id === 'body')!;
    expect(s.tier).toBe(3);
    expect(s.gates[0].detail[0]).toContain('implied by');
  });

  it('challenge factor: easy work barely moves an advanced stat', () => {
    const evs = [
      ...training(),
      ev({ content: 'Strict pull-ups, bodyweight – 2x4', projectId: 'sport', completedAt: '2025-03-01T08:00:00Z' }),
      ev({ content: 'Walk', projectId: 'realm', labels: ['Body', 'Easy'], completedAt: '2026-06-01T08:00:00Z' }),
    ];
    const walk = computeState(evs, META, STUDENT, C).scored.at(-1)!;
    expect(walk.xp).toBe(6); // 10 × 0.6 (tier 3 vs task level 2)
  });

  it('Career needs BOTH wage and position', () => {
    const work = Array.from({ length: 300 }, (_, i) =>
      ev({ content: 'Dosar', labels: ['Duty', 'Medium'], completedAt: daysAfter('2025-01-01T08:00:00Z', i) }),
    );
    const career = (p: Profile) => computeState(work, META, p, C).stats.find((x) => x.def.id === 'career')!.tier;
    expect(career(STUDENT)).toBe(1);
    expect(career({ netWageRon: 6000, positionRank: 0 })).toBe(1);
    expect(career({ netWageRon: 0, positionRank: 3 })).toBe(1);
    expect(career({ netWageRon: 3000, positionRank: 2 })).toBe(2);
    expect(career({ netWageRon: 6000, positionRank: 3 })).toBe(4);
  });

  it('consistency gates use the best weekly streak', () => {
    const weeks = new Map([[1, 2], [2, 1], [3, 3], [5, 1], [6, 1]]);
    expect(bestStreak(weeks, 1)).toBe(3);
    expect(bestStreak(weeks, 2)).toBe(1);
  });
});

describe('level and archetype', () => {
  it('starts as a level 1 Basement Nerd', () => {
    const s = computeState([], META, STUDENT, C);
    expect(s.level).toBe(1);
    expect(s.archetype.name).toBe('Basement Nerd');
  });
  it('levels get steeper', () => {
    expect(levelOf(99).level).toBe(1);
    expect(levelOf(100).level).toBe(2);
    expect(levelOf(5000).level).toBeLessThan(15);
  });
});
