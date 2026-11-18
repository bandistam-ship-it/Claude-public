import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { DEFAULT_CONFIG as C } from './config';
import { bestStreak, computeState, tierFromLevels } from './engine';
import { matchFeat } from './feats';
import { DOMAINS } from './catalog';
import { norm, parseReps } from './text';
import type { CompletionEvent, TodoistMeta } from './types';

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
    expect(b(ev({ content: 'Închide un abonament', projectId: 'realm', sectionId: 'chancery', labels: ['Duty', 'Easy'] }))).toBe('ignored');
    expect(b(ev({ content: 'Răspunde colegului', labels: ['Duty', 'Easy', 'Profesie'] }))).toBe('ignored');
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
    expect(matchFeat(ev({ content: 'Admis la Barou', labels: ['Boss-fight'] }), 'mind', f('barou'))).toBe('counted');
  });
});

const NOW = Date.parse('2026-11-18T12:00:00Z');
const calc = (events: CompletionEvent[], claims: Record<string, string> = {}, now = NOW) =>
  computeState(events, META, C, claims, now);
const stat = (s: ReturnType<typeof calc>, id: string) => s.stats.find((x) => x.def.id === id)!;
const domain = (s: ReturnType<typeof calc>, id: string, d: string) => stat(s, id).domains.find((x) => x.def.id === d)!;
const claimAll = (statId: 'body' | 'mind' | 'upkeep', levels: number[], date = '2026-11-01', skip: string[] = []) => {
  const claims: Record<string, string> = {};
  for (const d of DOMAINS[statId]) if (!skip.includes(d.id)) for (const l of levels) claims[`${statId}.${d.id}.${l}`] = date;
  return claims;
};

describe('structure', () => {
  it('has Body (6 domains), Mind (5) and a light Upkeep (3), six milestones each', () => {
    expect(DOMAINS.body).toHaveLength(6);
    expect(DOMAINS.mind).toHaveLength(5);
    expect(DOMAINS.upkeep).toHaveLength(3);
    for (const stat of Object.keys(DOMAINS) as (keyof typeof DOMAINS)[]) for (const d of DOMAINS[stat]) expect(d.ladder).toHaveLength(6);
  });
  it('has no career or spirit sections and shows no population percentages', () => {
    expect(Object.keys(DOMAINS).sort()).toEqual(['body', 'mind', 'upkeep']);
    const text = JSON.stringify(DOMAINS);
    expect(text).not.toMatch(/\b1 in [\d,]+/);
    expect(text).not.toMatch(/about half of adults|%\s+of (adults|Romanian)/i);
  });
  it('Body and Mind count double toward level', () => {
    expect(C.stats.map((x) => x.weight)).toEqual([2, 2, 1]);
  });
});

describe('rounded tiers', () => {
  it('a tier needs 60% of domains at that level and none more than one behind', () => {
    expect(tierFromLevels([1, 1, 1, 1, 1], 0.6)).toBe(1);
    expect(tierFromLevels([4, 4, 4, 1, 1], 0.6)).toBe(2);
    expect(tierFromLevels([4, 4, 4, 3, 3], 0.6)).toBe(4);
    expect(tierFromLevels([7, 7, 7, 1, 1], 0.6)).toBe(2);
    expect(tierFromLevels([6, 6, 6, 6, 6], 0.6)).toBe(6);
  });
  it('Legendary needs every domain at 6+ and 60% at 7', () => {
    expect(tierFromLevels([7, 7, 6, 6, 6], 0.6)).toBe(6);
    expect(tierFromLevels([7, 7, 7, 6, 6], 0.6)).toBe(7);
    expect(tierFromLevels([7, 7, 7, 7, 5], 0.6)).toBe(6);
  });
});

describe('milestones', () => {
  it('starts as a level 1 Basement Nerd with nothing achieved', () => {
    const s = calc([]);
    expect(s.level).toBe(1);
    expect(s.milestonesDone).toBe(0);
    expect(s.archetype.name).toBe('Basement Nerd');
    expect(s.stats.every((x) => x.progress === 0)).toBe(true);
  });

  it('a ticked milestone counts and implies the rungs below it', () => {
    const s = calc([], { 'body.strength.4': '2026-11-18' });
    const strength = domain(s, 'body', 'strength');
    expect(strength.level).toBe(4); // 10 strict pull-ups and 15 strict dips
    expect(strength.milestones.find((m) => m.level === 4)!.source).toBe('claimed');
    expect(strength.milestones.find((m) => m.level === 2)!.source).toBe('implied');
    expect(s.milestonesDone).toBe(3);
    expect(stat(s, 'body').tier).toBe(1); // one strong domain does not make a well-rounded body
  });

  it('is rounded: elite at one thing barely moves the stat', () => {
    const claims = Object.fromEntries([2, 3, 4, 5, 6, 7].map((l) => [`body.strength.${l}`, '2026-11-01']));
    const s = calc([], claims);
    expect(domain(s, 'body', 'strength').level).toBe(7);
    expect(stat(s, 'body').tier).toBe(1);
  });

  it('a well-rounded body reaches higher tiers', () => {
    const s = calc([], claimAll('body', [2, 3, 4]));
    expect(stat(s, 'body').tier).toBe(4);
    expect(stat(s, 'body').title).toBe('Fit');
  });

  it('the next tier shows an exact requirement count, not a vague percentage', () => {
    const s = calc([], claimAll('body', [2, 3, 4], '2026-11-01', ['skills', 'physique']));
    const body = stat(s, 'body');
    expect(body.tier).toBe(2); // two domains still at level 1 cap it
    expect(body.nextReq).toEqual({ level: 3, have: 4, need: 4, behind: 2 });
  });

  it('detects pull-up milestones from task text, and only with clean form', () => {
    const strict = ev({ content: 'Strict pull-ups, bodyweight – 2x10', projectId: 'sport', completedAt: '2026-11-10T10:00:00Z' });
    const dips = ev({ content: 'Strict dips – 3x15', projectId: 'sport', completedAt: '2026-11-10T10:05:00Z' });
    expect(domain(calc([strict, dips]), 'body', 'strength').level).toBe(4);
    const sloppy = calc([ev({ content: 'Straight bar dips – 3x15', projectId: 'sport' })]);
    expect(domain(sloppy, 'body', 'strength').level).toBe(1);
    expect(domain(sloppy, 'body', 'strength').milestones.find((m) => m.level === 4)!.note).toContain('no proof of clean form');
  });

  it('habit milestones come from weekly streaks in your tasks', () => {
    const weeks = Array.from({ length: 12 }, (_, i) =>
      ev({ content: 'Fă curat', labels: ['Upkeep', 'Easy'], completedAt: daysAfter('2026-01-05T09:00:00Z', i * 7) }),
    );
    expect(domain(calc(weeks), 'upkeep', 'cleanliness').level).toBe(4); // 10 weeks in a row
  });

  it('Barou study days count toward Law & reasoning', () => {
    const weeks = Array.from({ length: 12 }, (_, i) =>
      ev({ content: 'Drept civil: Posesia', projectId: 'barou', labels: ['Barou', 'Mind'], completedAt: daysAfter('2026-08-03T09:00:00Z', i * 7) }),
    );
    expect(domain(calc(weeks), 'mind', 'law').level).toBe(2);
  });

  it('career and spirit tasks are not scored at all', () => {
    const s = calc([ev({ content: 'Trimite mail', labels: ['Duty', 'Easy'] }), ev({ content: 'Terapie', labels: ['Spirit'] })]);
    expect(s.milestonesDone).toBe(0);
    expect(s.stats.map((x) => x.completions)).toEqual([0, 0, 0]);
  });

  it('level weights Body and Mind double', () => {
    const s = calc([], { ...claimAll('mind', [2, 3]), ...claimAll('body', [2]) });
    expect(stat(s, 'mind').tier).toBe(3);
    expect(stat(s, 'body').tier).toBe(2);
    expect(s.level).toBe(2 * 2 + 2 * 3 + 1 - 4);
  });
});

describe('ever achieved vs currently valid', () => {
  it('a body milestone lapses from current after its window, but the tier does not drop', () => {
    const old = claimAll('body', [2, 3, 4], '2026-01-01'); // 321 days before NOW; skills fade at 180
    const s = calc([], old);
    const skills = domain(s, 'body', 'skills');
    expect(skills.level).toBe(4);
    expect(skills.currentLevel).toBe(1);
    expect(skills.milestones.find((m) => m.level === 4)!.current).toBe(false);
    expect(stat(s, 'body').tier).toBe(4); // ever achieved still counts
  });

  it('confirming again makes it current', () => {
    const fresh = calc([], { 'body.skills.4': '2026-11-10' });
    expect(domain(fresh, 'body', 'skills').currentLevel).toBe(4);
  });

  it('knowledge never fades', () => {
    const s = calc([], { 'mind.philosophy.4': '2015-01-01' });
    expect(domain(s, 'mind', 'philosophy').currentLevel).toBe(4);
  });

  it('a task that repeats a feat keeps it current', () => {
    const first = ev({ content: 'Strict pull-ups, bodyweight – 2x10', projectId: 'sport', completedAt: '2026-01-10T10:00:00Z' });
    const again = ev({ content: 'Strict pull-ups, bodyweight – 2x10', projectId: 'sport', completedAt: '2026-11-10T10:00:00Z' });
    expect(domain(calc([first]), 'body', 'strength').currentLevel).toBe(1);
    expect(domain(calc([first, again]), 'body', 'strength').currentLevel).toBe(3);
  });
});

describe('streaks', () => {
  it('counts consecutive weeks', () => {
    expect(bestStreak(new Map([[1, 2], [2, 1], [3, 3], [5, 1], [6, 1]]), 1)).toBe(3);
    expect(bestStreak(new Map([[1, 2], [2, 1], [3, 3], [5, 1], [6, 1]]), 2)).toBe(1);
  });
});
