import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { DEFAULT_CONFIG as C } from './config';
import { bestStreak, computeState, tierFromLevels } from './engine';
import { matchFeat } from './feats';
import { DOMAINS } from './catalog';
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

describe('rounded tiers', () => {
  it('a tier needs 3 of 5 domains at that level and none more than one behind', () => {
    expect(tierFromLevels([1, 1, 1, 1, 1], 0.6)).toBe(1);
    expect(tierFromLevels([4, 4, 4, 1, 1], 0.6)).toBe(2); // two neglected domains cap it at 2
    expect(tierFromLevels([4, 4, 4, 3, 3], 0.6)).toBe(4);
    expect(tierFromLevels([7, 7, 7, 1, 1], 0.6)).toBe(2); // brilliant in 3, ignoring 2: only tier 2
    expect(tierFromLevels([6, 6, 6, 6, 6], 0.6)).toBe(6);
  });
  it('Legendary needs every domain at 6+ and three at 7', () => {
    expect(tierFromLevels([7, 7, 6, 6, 6], 0.6)).toBe(6);
    expect(tierFromLevels([7, 7, 7, 6, 6], 0.6)).toBe(7);
    expect(tierFromLevels([7, 7, 7, 7, 5], 0.6)).toBe(6);
  });
  it('every stat has five domains with six milestones each', () => {
    for (const stat of Object.keys(DOMAINS) as (keyof typeof DOMAINS)[]) {
      expect(DOMAINS[stat]).toHaveLength(5);
      for (const d of DOMAINS[stat]) expect(d.ladder).toHaveLength(6);
    }
  });
});

describe('milestones', () => {
  const stat = (s: ReturnType<typeof computeState>, id: string) => s.stats.find((x) => x.def.id === id)!;
  const domain = (s: ReturnType<typeof computeState>, id: string, d: string) => stat(s, id).domains.find((x) => x.def.id === d)!;

  it('starts as a level 1 Basement Nerd with nothing achieved', () => {
    const s = computeState([], META, STUDENT, C);
    expect(s.level).toBe(1);
    expect(s.milestonesDone).toBe(0);
    expect(s.archetype.name).toBe('Basement Nerd');
  });

  it('a ticked milestone counts and implies the rungs below it', () => {
    const s = computeState([], META, STUDENT, C, { 'body.strength.4': '2026-11-18' });
    const strength = domain(s, 'body', 'strength');
    expect(strength.level).toBe(4); // 10 strict pull-ups and 15 strict dips
    expect(strength.milestones.find((m) => m.level === 4)!.source).toBe('claimed');
    expect(strength.milestones.find((m) => m.level === 2)!.source).toBe('implied');
    expect(s.milestonesDone).toBe(3);
    expect(stat(s, 'body').tier).toBe(1); // one strong domain does not make a well-rounded body
  });

  it('is rounded: being elite at one thing barely moves the stat', () => {
    const claims = Object.fromEntries([2, 3, 4, 5, 6, 7].map((l) => [`body.strength.${l}`, '2026-01-01']));
    const s = computeState([], META, STUDENT, C, claims);
    expect(domain(s, 'body', 'strength').level).toBe(7);
    expect(stat(s, 'body').tier).toBe(1);
  });

  it('a well-rounded body reaches higher tiers', () => {
    const claims: Record<string, string> = {};
    for (const d of DOMAINS.body) for (const l of [2, 3, 4]) claims[`body.${d.id}.${l}`] = '2026-01-01';
    const s = computeState([], META, STUDENT, C, claims);
    expect(stat(s, 'body').tier).toBe(4);
    expect(stat(s, 'body').title).toBe('Fit');
  });

  it('detects pull-up milestones from task text, and only with clean form', () => {
    const strict = ev({ content: 'Strict pull-ups, bodyweight – 2x10', projectId: 'sport' });
    const dips = ev({ content: 'Strict dips – 3x15', projectId: 'sport' });
    const s = computeState([strict, dips], META, STUDENT, C);
    expect(domain(s, 'body', 'strength').level).toBe(4);
    const sloppy = computeState([ev({ content: 'Straight bar dips – 3x15', projectId: 'sport' })], META, STUDENT, C);
    const note = domain(sloppy, 'body', 'strength').milestones.find((m) => m.level === 4)!.note;
    expect(domain(sloppy, 'body', 'strength').level).toBe(1);
    expect(note).toContain('no proof of clean form');
  });

  it('Career income and role read your profile, and are separate domains', () => {
    const s = computeState([], META, { netWageRon: 6000, positionRank: 0 }, C);
    expect(domain(s, 'career', 'income').level).toBe(4);
    expect(domain(s, 'career', 'role').level).toBe(1);
    expect(stat(s, 'career').tier).toBe(1); // a good wage alone is not a rounded career
  });

  it('habit milestones come from weekly streaks in your tasks', () => {
    const weeks = Array.from({ length: 12 }, (_, i) =>
      ev({ content: 'Fă curat', labels: ['Upkeep', 'Easy'], completedAt: daysAfter('2026-01-05T09:00:00Z', i * 7) }),
    );
    const s = computeState(weeks, META, STUDENT, C);
    expect(domain(s, 'upkeep', 'cleanliness').level).toBe(4); // 10 weeks in a row
  });

  it('keeps counting streaks only for the matching stat', () => {
    expect(bestStreak(new Map([[1, 2], [2, 1], [3, 3], [5, 1], [6, 1]]), 1)).toBe(3);
    expect(bestStreak(new Map([[1, 2], [2, 1], [3, 3], [5, 1], [6, 1]]), 2)).toBe(1);
  });

  it('progress starts at zero and only reaches 100% at the top tier', () => {
    const empty = computeState([], META, STUDENT, C);
    expect(empty.stats.every((x) => x.progress === 0)).toBe(true);
    const some = computeState([], META, STUDENT, C, { 'body.strength.2': '2026-01-01', 'body.endurance.2': '2026-01-01' });
    const body = some.stats.find((x) => x.def.id === 'body')!;
    expect(body.progress).toBeGreaterThan(0.5);
    expect(body.progress).toBeLessThan(1);
  });

  it('level is the sum of tiers, with five tier-1 stats being level 1', () => {
    const claims: Record<string, string> = {};
    for (const d of DOMAINS.mind) for (const l of [2, 3]) claims[`mind.${d.id}.${l}`] = '2026-01-01';
    const s = computeState([], META, STUDENT, C, claims);
    expect(stat(s, 'mind').tier).toBe(3);
    expect(s.level).toBe(3);
  });
});
