import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { DEFAULT_CONFIG as C } from './config';
import { SECTIONS } from './catalog';
import { archetypeOf, computeState, rungId, tierFromShare } from './engine';
import { matchFeat } from './feats';
import { norm, parseReps } from './text';
import { fmtPercentile, fmtShare, fmtStanding } from '../ui/format';
import { adjustShare, bandOf, describeGroup, type Demographics } from './demographics';
import { buildTierFromStats, EMPTY_STATS, enduranceRungsFromStats, formatDuration, parseDuration, waistToHeight } from './stats';
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
    expect(cal(s).next!.text).toBe('Tuck front lever for 10 seconds'); // the most common skill is the next one within reach
  });

  it('your standing is the share of your rarest achieved skill', () => {
    const s = calc([], { [idOf('calisthenics', 'Tuck front lever for 10 seconds')]: '2026-11-10', [idOf('calisthenics', 'First strict muscle-up')]: '2026-11-10' });
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
    expect(fmtStanding(0.015)).toBe('Top 1.5% of all adults');
    expect(fmtStanding(0.015, 'men aged 20–29')).toBe('Top 1.5% of men aged 20–29');
    expect(fmtStanding(0.0008)).toBe('About 1 in 1,250 adults');
    expect(fmtPercentile(0.015)).toBe('98.5th percentile');
    expect(fmtPercentile(0.12)).toBe('88th percentile');
    expect(fmtPercentile(0.0008)).toBe('99.92th percentile');
    expect(fmtPercentile(0.08)).toBe('92nd percentile');
    expect(fmtPercentile(0.2)).toBe('80th percentile');
    expect(fmtPercentile(0.024)).toBe('97.6th percentile');
    expect(fmtPercentile(0.08 / 1)).not.toMatch(/\.\d/);
  });
});

describe('age and sex', () => {
  const man22 = { age: 22, group: 'men' as const };
  const calcFor = (claims: Record<string, string>, demo: Demographics = man22, now = NOW) => computeState([], META, C, claims, now, demo);

  it('puts ages into bands', () => {
    expect([19, 22, 29, 30, 45, 63].map(bandOf)).toEqual(['20-29', '20-29', '20-29', '30-39', '40-49', '50+']);
  });
  it('the same skill is rarer, and more impressive, in a group where it is more common', () => {
    const claims = { 'calisthenics.muscle-up': '2026-11-10' };
    const pooled = cal(calc([], claims));
    const man = cal(calcFor(claims));
    expect(pooled.share).toBe(0.005);
    expect(man.share).toBeCloseTo(0.012, 6); // 2.4x as common among men aged 20-29
    expect(man.poolShare).toBe(0.005); // still known for all adults
  });
  it('is harsher for a group where it is rarer', () => {
    const claims = { 'calisthenics.muscle-up': '2026-11-10' };
    expect(cal(calcFor(claims, { age: 55, group: 'women' })).share).toBeCloseTo(0.00075, 6);
  });
  it('never changes the VO2max rungs, which are percentiles within your own group', () => {
    expect(adjustShare(0.05, 'exact', man22)).toBe(0.05);
    expect(adjustShare(0.05, 'run', man22)).toBeCloseTo(0.09, 6);
    expect(adjustShare(0.5, 'skill', man22)).toBe(0.95); // never above 95%
  });
  it('without an age or without a chosen group, you are compared with all adults', () => {
    expect(adjustShare(0.01, 'skill', { age: null, group: 'men' })).toBe(0.01);
    expect(adjustShare(0.01, 'skill', { age: 22, group: 'everyone' })).toBe(0.01);
    expect(describeGroup({ age: null, group: 'everyone' })).toBe('all adults');
    expect(describeGroup(man22)).toBe('men aged 20–29');
    expect(describeGroup({ age: 52, group: 'women' })).toBe('women aged 50 and over');
  });
  it('keeps the ladder in order after adjusting skills', () => {
    const adj = SECTIONS[0].rungs.map((r) => adjustShare(r.share, r.kind, man22));
    for (let i = 1; i < adj.length; i++) expect(adj[i]).toBeLessThanOrEqual(adj[i - 1]);
  });
});

describe('versus you', () => {
  it('has no history until you unlock something', () => {
    const s = calc([]);
    expect(s.trackingSince).toBeNull();
    expect(s.timeline).toEqual([]);
    expect(s.versus.every((v) => v.then === null)).toBe(true);
  });

  it('replays your standing from the date of each unlock', () => {
    const s = calc([], {
      'calisthenics.tuck-front-lever': '2026-05-01', // top 1%
      'calisthenics.muscle-up': '2026-10-01', // top 0.5%
      'endurance.run-5k': '2026-08-01', // top 15%
    });
    expect(s.trackingSince).toBe('2026-05-01');
    expect(s.timeline.map((p) => p.date)).toEqual(['2026-05-01', '2026-08-01', '2026-10-01', '2026-11-18']);
    expect(s.timeline[0].calisthenics).toBe(0.01);
    expect(s.timeline[0].endurance).toBe(1);
    expect(s.timeline[2].calisthenics).toBe(0.005);
    expect(s.timeline[3].endurance).toBe(0.15);
    expect(s.now.calisthenics).toBe(0.005);
  });

  it('compares with 1, 3, 6 and 12 months ago, but only after tracking began', () => {
    const s = calc([], { 'calisthenics.tuck-front-lever': '2026-05-01', 'calisthenics.muscle-up': '2026-10-01' });
    const byLabel = Object.fromEntries(s.versus.map((v) => [v.label, v.then]));
    expect(byLabel['1 month ago']!.calisthenics).toBe(0.005); // 2026-10-19: the muscle-up (1 Oct) already counted
    expect(byLabel['3 months ago']!.calisthenics).toBe(0.01); // 2026-08-20: only the tuck front lever
    expect(byLabel['6 months ago']!.calisthenics).toBe(0.01); // 2026-05-22: tracking began on 1 May
    expect(byLabel['1 year ago']).toBeNull(); // before you started tracking
  });
});

describe('your stats set the build, so a strong person is never frail', () => {
  const withStats = (patch: Partial<typeof EMPTY_STATS>) => ({ ...EMPTY_STATS, ...patch });
  const build = (patch: Partial<typeof EMPTY_STATS>, claims: Record<string, string> = {}) =>
    computeState([], META, C, claims, NOW, { age: 22, group: 'men' }, withStats(patch));

  it('with no numbers and no skills you look frail, as before', () => {
    expect(build({}).tier).toBe(1);
    expect(build({}).buildBasis).toBe('standing');
    expect(build({}).archetype.name).toBe('Basement Nerd');
  });

  it('10 strict pull-ups and 15 strict dips look athletic, with no skills ticked', () => {
    const s = build({ pullUps: 10, dips: 15 });
    expect(s.tier).toBe(5);
    expect(s.tierTitle).toBe('Athletic');
    expect(s.buildBasis).toBe('numbers');
    expect(s.archetype.name).toBe('Strong Foundation'); // not a Basement Nerd
  });

  it('a strong person who runs is never described as having little strength', () => {
    const s = build({ pullUps: 10, dips: 15, best5kSec: 27 * 60 + 30 }, { 'endurance.run-5k': '2026-11-10', 'endurance.5k-30': '2026-11-10' });
    expect(s.archetype.name).toBe('Strong Runner');
    expect(s.archetype.blurb).not.toMatch(/little strength/);
    expect(archetypeOf(1, 0.01, C, 1).name).toBe('Lean Distance Runner'); // a weak runner still is one
  });

  it('the build follows your numbers, up and down', () => {
    expect(buildTierFromStats(withStats({ pullUps: 1 }))).toBe(2);
    expect(buildTierFromStats(withStats({ pullUps: 10, dips: 15, pushUps: 40 }))).toBe(4);
    expect(buildTierFromStats(withStats({ pullUps: 25, dips: 50, pushUps: 100 }))).toBe(7);
    expect(buildTierFromStats(withStats({ pullUps: 0, dips: 0, pushUps: 0 }))).toBe(1);
    expect(buildTierFromStats(withStats({ heightCm: 180 }))).toBeNull(); // body measurements alone do not set strength
  });

  it('reps never touch the skill percentile', () => {
    expect(cal(build({ pullUps: 25, dips: 50, pushUps: 100 })).share).toBe(1);
  });

  it('your running bests prove endurance feats', () => {
    expect(enduranceRungsFromStats(withStats({ best5kSec: 27 * 60 + 30 }))).toEqual(['endurance.run-5k', 'endurance.5k-30']);
    expect(enduranceRungsFromStats(withStats({ best5kSec: 24 * 60 }))).toEqual(['endurance.run-5k', 'endurance.5k-30', 'endurance.5k-25']);
    expect(enduranceRungsFromStats(withStats({ best10kSec: 44 * 60 }))).toEqual(['endurance.run-10k', 'endurance.10k-55', 'endurance.10k-45']);
    expect(enduranceRungsFromStats(withStats({ longestRunKm: 12 }))).toEqual(['endurance.run-5k', 'endurance.run-10k']);
    expect(enduranceRungsFromStats(EMPTY_STATS)).toEqual([]);
    // every id it produces must exist in the catalog
    const ids = new Set(SECTIONS[1].rungs.map((r) => `endurance.${r.id}`));
    for (const id of enduranceRungsFromStats(withStats({ best5kSec: 1100, best10kSec: 2500, longestRunKm: 42 }))) expect(ids.has(id)).toBe(true);
  });

  it('computes waist-to-height', () => {
    expect(waistToHeight(withStats({ waistCm: 80, heightCm: 180 }))).toBeCloseTo(0.444, 3);
    expect(waistToHeight(withStats({ waistCm: 80 }))).toBeNull();
  });

  it('reads and writes times', () => {
    expect(parseDuration('27:30')).toBe(1650);
    expect(parseDuration('1:05:10')).toBe(3910);
    expect(parseDuration('27:75')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('27')).toBeNull();
    expect(formatDuration(1650)).toBe('27:30');
    expect(formatDuration(3910)).toBe('1:05:10');
    expect(formatDuration(null)).toBe('');
  });
});
