import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { DEFAULT_CONFIG as C } from './config';
import { SECTIONS } from './catalog';
import { archetypeOf, computeState, rungId, tierFromShare } from './engine';
import { matchFeat } from './feats';
import { norm, parseReps } from './text';
import { fmtPercentile, fmtShare, fmtStanding } from '../ui/format';
import type { CompletionEvent, TodoistMeta } from './types';

// Fixtures modelled on a real account (task names are real).
const META: TodoistMeta = {
  projects: { inbox: 'Inbox', realm: 'The Realm', sport: 'Sport', meso2: 'Sport · Meso 2 – Wall HSPU', barou: 'Barou 2027 – Program zilnic' },
  sections: {
    library: { name: '📚 Library', projectId: 'realm' },
    barracks: { name: '🏋️ Barracks', projectId: 'realm' },
    keep: { name: '🏰 Keep', projectId: 'realm' },
    vault: { name: '🛒 Rewards Vault', projectId: 'realm' },
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
const NOW = Date.parse('2026-11-18T12:00:00Z');
const calc = (events: CompletionEvent[], claims: Record<string, string> = {}, now = NOW) => computeState(events, META, C, claims, now);
const cal = (s: ReturnType<typeof calc>) => s.sections[0];
const end = (s: ReturnType<typeof calc>) => s.sections[1];
const idOf = (section: 'calisthenics' | 'endurance', text: string) => {
  const rung = SECTIONS.find((x) => x.id === section)!.rungs.find((x) => x.text === text);
  if (!rung) throw new Error(`no rung "${text}"`);
  return rungId(section, rung.id);
};

describe('text', () => {
  it('normalises Romanian diacritics and emoji', () => {
    expect(norm('📚 Învață proprietatea privată')).toBe('invata proprietatea privata');
  });
  it('parses reps but not timed holds', () => {
    expect(parseReps('Strict pull-ups, bodyweight – 2x4')).toBe(4);
    expect(parseReps('Straight bar dips – 4x10')).toBe(10);
    expect(parseReps('Wall handstand – 3×20–30 s')).toBeNull();
    expect(parseReps('Primul muscle up')).toBeNull();
  });
});

describe('classify: only calisthenics and running count', () => {
  const b = (e: CompletionEvent) => classify(e, META, C).bucket;
  it('counts Sport, Body labels and the Barracks section', () => {
    expect(b(ev({ content: 'Day B – Transition Skill', projectId: 'sport' }))).toBe('body');
    expect(b(ev({ content: 'Day A', projectId: 'meso2' }))).toBe('body');
    expect(b(ev({ content: 'Antrenament', labels: ['Body'] }))).toBe('body');
    expect(b(ev({ content: 'Alergare 5 km' }))).toBe('body');
  });
  it('does not score anything else', () => {
    expect(b(ev({ content: 'Drept civil: Posesia', projectId: 'barou', labels: ['Barou', 'Mind'] }))).toBe('ignored');
    expect(b(ev({ content: 'Fă curat', projectId: 'realm', sectionId: 'keep', labels: ['Upkeep'] }))).toBe('ignored');
    expect(b(ev({ content: 'Cinema', projectId: 'realm', sectionId: 'vault' }))).toBe('ignored');
    expect(b(ev({ content: 'Xyzzy' }))).toBe('neutral');
  });
});

describe('feats: skills only, clean form only', () => {
  const f = (id: string) => C.feats.find((x) => x.id === id)!;
  const sport = (content: string, labels: string[] = []) => ev({ content, projectId: 'sport', labels });
  it('never scores volume: pull-ups, push-ups and dips are not feats', () => {
    expect(C.feats.map((x) => x.id).sort()).toEqual(['frontlever', 'hspu1', 'muscleup1', 'oneArmPullup', 'planche']);
    const s = calc([sport('Strict pull-ups, bodyweight – 3x15'), sport('Strict dips – 3x20'), sport('Strict push-ups – 4x30')]);
    expect(cal(s).share).toBe(1);
    expect(s.feats).toHaveLength(0);
  });
  it('the calisthenics ladder is skills, not rep counts', () => {
    const texts = SECTIONS[0].rungs.map((x) => x.text).join(' | ');
    expect(texts).not.toMatch(/\b\d+ (strict )?(push-ups|pull-ups|dips)\b/i);
    expect(texts).toContain('muscle-up');
    expect(texts).toContain('front lever');
  });
  it('counts a clean skill but never assisted variants, attempts or tests', () => {
    expect(matchFeat(sport('Strict handstand push-ups – 2x3'), 'body', f('hspu1'))).toBe('counted');
    for (const c of ['Banded muscle-ups – 2x2', 'Muscle-up negatives (from a jump) – 3x2', '🎯 MUSCLE-UP TEST – 5 attempts max', 'Pike handstand push-ups – 3x5']) {
      expect(matchFeat(sport(c), 'body', f(c.includes('Pike') ? 'hspu1' : 'muscleup1'))).toBeNull();
    }
  });
  it('needs proof of clean form for a milestone', () => {
    const first = ev({ content: 'Primul muscle up', labels: ['Achievement', 'Body', 'Boss-fight'] });
    expect(matchFeat(first, 'body', f('muscleup1'))).toBe('needs-clean-form');
    expect(matchFeat({ ...first, labels: [...first.labels, 'Clean'] }, 'body', f('muscleup1'))).toBe('counted');
  });
});

describe('percentile standing', () => {
  it('the catalog is ordered from most common to rarest, with unique ids and sane shares', () => {
    for (const s of SECTIONS) {
      expect(new Set(s.rungs.map((x) => x.id)).size).toBe(s.rungs.length);
      for (let i = 0; i < s.rungs.length; i++) {
        expect(s.rungs[i].share).toBeGreaterThan(0);
        expect(s.rungs[i].share).toBeLessThan(1);
        if (i > 0) expect(s.rungs[i].share).toBeLessThanOrEqual(s.rungs[i - 1].share);
      }
    }
  });

  it('starts with nothing achieved: share 1, tier 1, Basement Nerd', () => {
    const s = calc([]);
    expect(cal(s).share).toBe(1);
    expect(end(s).share).toBe(1);
    expect(s.tier).toBe(1);
    expect(s.archetype.name).toBe('Basement Nerd');
    expect(cal(s).best).toBeNull();
    expect(cal(s).next!.text).toBe('Crow or frog stand for 10 seconds'); // the most common skill is the next one within reach
  });

  it('your standing is the share of your rarest achieved skill', () => {
    const s = calc([], { [idOf('calisthenics', 'L-sit for 10 seconds')]: '2026-11-10', [idOf('calisthenics', 'First strict muscle-up')]: '2026-11-10' });
    expect(cal(s).best!.text).toBe('First strict muscle-up');
    expect(cal(s).share).toBe(0.005); // about 1 in 200 adults
  });

  it('skills are independent: a rarer skill does not imply an easier one', () => {
    const s = calc([], { [idOf('calisthenics', 'First strict muscle-up')]: '2026-11-10' });
    expect(cal(s).rungs.filter((r) => r.achieved)).toHaveLength(1);
  });

  it('detects skills from your tasks', () => {
    const s = calc([ev({ content: 'Strict muscle-up – 3x1', projectId: 'sport' }), ev({ content: 'Strict front lever hold – first!', projectId: 'sport', labels: ['Achievement'] })]);
    expect(cal(s).rungs.filter((r) => r.source === 'auto').map((r) => r.text)).toEqual(['First strict muscle-up', 'Full front lever for 5 seconds']);
    expect(cal(s).share).toBe(0.0005);
  });

  it('shows why a skill was not accepted when clean form is missing', () => {
    const s = calc([ev({ content: 'Primul muscle up', labels: ['Achievement', 'Body'] })]);
    expect(cal(s).best).toBeNull();
    expect(cal(s).rungs.find((r) => r.text === 'First strict muscle-up')!.note).toContain('no proof of clean form');
  });

  it('ticks stay attached to a skill by its permanent id', () => {
    const id = idOf('calisthenics', 'First strict muscle-up');
    expect(id).toBe('calisthenics.muscle-up');
    expect(cal(calc([], { 'calisthenics.muscle-up': '2026-11-10' })).best!.text).toBe('First strict muscle-up');
    expect(cal(calc([], { 'calisthenics.3': '2026-11-10' })).share).toBe(1); // an old index-based tick is ignored, not misapplied
  });

  it('the combined standing is the geometric mean of both sections', () => {
    const s = calc([], { [idOf('calisthenics', 'First strict muscle-up')]: '2026-11-10', [idOf('endurance', '10 km in under 55:00')]: '2026-11-10' });
    expect(s.combinedShare).toBeCloseTo(Math.sqrt(0.005 * 0.03), 6);
  });

  it('maps a share of adults to a build tier', () => {
    expect([1, 0.6, 0.5, 0.25, 0.1, 0.03, 0.01, 0.002, 0.0002].map(tierFromShare)).toEqual([1, 1, 2, 3, 4, 5, 6, 7, 7]);
  });
});

describe('archetype', () => {
  it('lopsided toward calisthenics or endurance, or complete', () => {
    expect(archetypeOf(0.01, 1, C).name).toBe('Calisthenics Wizard');
    expect(archetypeOf(1, 0.01, C).name).toBe('Lean Distance Runner');
    expect(archetypeOf(0.02, 0.03, C).name).toBe('Complete Athlete');
    expect(archetypeOf(0.2, 0.3, C).name).toBe('Well-Rounded Mover');
    expect(archetypeOf(1, 0.9, C).name).toBe('Basement Nerd');
  });
});

describe('ever achieved vs currently valid', () => {
  it('a feat lapses from current after its window, but your best does not drop', () => {
    const id = idOf('calisthenics', 'First strict muscle-up');
    const old = calc([], { [id]: '2026-01-01' }); // 321 days before NOW; calisthenics fades at 240
    expect(cal(old).share).toBe(0.005);
    expect(cal(old).currentShare).toBe(1);
    expect(cal(old).rungs.find((r) => r.id === id)!.current).toBe(false);
    expect(cal(calc([], { [id]: '2026-11-10' })).currentShare).toBe(0.005);
  });

  it('doing it again in a task keeps it current', () => {
    const first = ev({ content: 'Strict muscle-up – 3x1', projectId: 'sport', completedAt: '2026-01-10T10:00:00Z' });
    const again = ev({ content: 'Strict muscle-up – 3x1', projectId: 'sport', completedAt: '2026-11-10T10:00:00Z' });
    expect(cal(calc([first])).currentShare).toBe(1);
    expect(cal(calc([first, again])).currentShare).toBe(0.005);
  });
});

describe('formatting', () => {
  it('writes shares in plain words', () => {
    expect(fmtShare(0.55)).toBe('55%');
    expect(fmtShare(0.015)).toBe('1.5%');
    expect(fmtShare(0.03)).toBe('3%');
    expect(fmtShare(0.0002)).toBe('1 in 5,000');
  });
  it('writes a standing and a percentile', () => {
    expect(fmtStanding(1)).toBe('No feat yet');
    expect(fmtStanding(0.015)).toBe('Top 1.5% of adults');
    expect(fmtStanding(0.0008)).toBe('About 1 in 1,250 adults');
    expect(fmtPercentile(0.015)).toBe('98.5th percentile');
    expect(fmtPercentile(0.12)).toBe('88th percentile');
    expect(fmtPercentile(0.0008)).toBe('99.92th percentile');
  });
});
