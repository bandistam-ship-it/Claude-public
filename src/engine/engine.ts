import { classify } from './classify';
import { detectFeats } from './feats';
import { norm, re } from './text';
import type {
  Auto, CharacterState, Claims, CompletionEvent, DetectedFeat, DomainState, EngineConfig,
  HistoryEntry, MilestoneState, StatId, StatState, TodoistMeta,
} from './types';

const DAY_MS = 86_400_000;
const TIME_ZONE = 'Europe/Bucharest';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Local (Bucharest) calendar day as an integer day number. */
export function dayIndex(iso: string): number {
  const [y, m, d] = dayFmt.format(new Date(iso)).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}
/** Monday-based week number (1970-01-01 was a Thursday). */
export const weekIndex = (day: number) => Math.floor((day + 3) / 7);

/** Longest run of consecutive weeks with at least `minPerWeek` completions. */
export function bestStreak(weekCounts: Map<number, number>, minPerWeek: number): number {
  const weeks = [...weekCounts.entries()].filter(([, n]) => n >= minPerWeek).map(([w]) => w).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = Number.NaN;
  for (const w of weeks) {
    run = w === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  return best;
}

interface StatTasks { entries: { week: number; text: string }[] }

interface Ctx {
  tasks: Record<StatId, StatTasks>;
  feats: Map<string, DetectedFeat>;
}

function evalAuto(a: Auto, stat: StatId, ctx: Ctx): boolean {
  if ('all' in a) return a.all.every((x) => evalAuto(x, stat, ctx));
  if ('any' in a) return a.any.some((x) => evalAuto(x, stat, ctx));
  if ('feat' in a) return ctx.feats.get(a.feat)?.status === 'counted';
  const entries = ctx.tasks[stat].entries;
  if ('count' in a) {
    const { min, pattern } = a.count;
    const n = pattern ? entries.filter((e) => re(pattern).test(e.text)).length : entries.length;
    return n >= min;
  }
  const { weeks, perWeek, pattern } = a.streak;
  const wc = new Map<number, number>();
  for (const e of entries) if (!pattern || re(pattern).test(e.text)) wc.set(e.week, (wc.get(e.week) ?? 0) + 1);
  return bestStreak(wc, perWeek) >= weeks;
}

/** Date of the first/last task that proves a feat-based rule (null for streaks and counts). */
function evidence(a: Auto, ctx: Ctx, which: 'first' | 'last'): string | null {
  if ('feat' in a) {
    const f = ctx.feats.get(a.feat);
    if (f?.status !== 'counted') return null;
    return which === 'first' ? f.event.completedAt : (f.lastAt ?? f.event.completedAt);
  }
  if ('all' in a || 'any' in a) {
    const subs = ('all' in a ? a.all : a.any).map((x) => evidence(x, ctx, which)).filter((x): x is string => x !== null);
    if (!subs.length) return null;
    subs.sort();
    // all: every part must be recent, so the oldest "last" date; any: the best part.
    if ('all' in a) return which === 'last' ? subs[0] : subs[subs.length - 1];
    return which === 'last' ? subs[subs.length - 1] : subs[0];
  }
  return null;
}

/** First feat in an auto rule that was found in the history but not accepted (needs clean form). */
function pendingNote(a: Auto | undefined, ctx: Ctx): string | undefined {
  if (!a) return undefined;
  if ('all' in a) return a.all.map((x) => pendingNote(x, ctx)).find(Boolean);
  if ('any' in a) return a.any.map((x) => pendingNote(x, ctx)).find(Boolean);
  if ('feat' in a) {
    const f = ctx.feats.get(a.feat);
    if (f?.status === 'needs-clean-form') {
      return `Found “${f.event.content}” but no proof of clean form. Add the Clean label in Todoist, or tick it here.`;
    }
  }
  return undefined;
}

/**
 * Tier T needs at least `share` of the domains at level T or above, and no domain below T-1.
 * A neglected domain caps the whole stat, so a high tier means being well-rounded.
 */
export function tierFromLevels(levels: number[], share: number): number {
  const need = Math.ceil(levels.length * share);
  for (let t = 7; t >= 2; t--) {
    const reached = levels.filter((l) => l >= t).length;
    if (reached >= need && levels.every((l) => l >= t - 1)) return t;
  }
  return 1;
}

function nextTierInfo(levels: number[], tier: number, share: number, names: string[]) {
  if (tier >= 7) return { progress: 1, needs: [] as string[], req: null };
  const next = tier + 1;
  const need = Math.ceil(levels.length * share);
  const reached = levels.filter((l) => l >= next).length;
  const behind = levels.map((l, i) => ({ l, n: names[i] })).filter((d) => d.l < tier);
  // A: how close the best `need` domains are to level `next`. B: how close the rest are to not lagging.
  const top = [...levels].sort((a, b) => b - a).slice(0, need);
  const a = top.reduce((sum, l) => sum + (Math.min(l, next) - 1) / (next - 1), 0) / need;
  const b = next >= 3 ? levels.reduce((sum, l) => sum + (Math.min(l, next - 1) - 1) / (next - 2), 0) / levels.length : 1;
  const progress = next >= 3 ? (a + b) / 2 : a;
  const needs: string[] = [];
  for (const d of behind) needs.push(`${d.n} is holding you back: reach level ${tier}`);
  if (reached < need) {
    const closest = levels.map((l, i) => ({ l, n: names[i] })).filter((d) => d.l < next && d.l >= tier).map((d) => d.n);
    const k = need - reached;
    needs.push(`Raise ${k} more domain${k > 1 ? 's' : ''} to level ${next}: ${closest.join(', ')}`);
  }
  return { progress, needs, req: { level: next, have: reached, need, behind: behind.length } };
}

const ARCHETYPE_EMOJI: Record<StatId, string> = { body: '🦍', mind: '🧐', upkeep: '🧹' };

export function archetypeOf(stats: StatState[], config: EngineConfig): CharacterState['archetype'] {
  const tiers = stats.map((s) => s.tier);
  const max = Math.max(...tiers);
  const min = Math.min(...tiers);
  if (max <= 2) return { name: 'Basement Nerd', emoji: '🤓', blurb: 'Frail, unfit, not very bright, sitting in a messy room.' };
  if (min >= 4 && max - min <= 1) return { name: 'Renaissance Hero', emoji: '🦸', blurb: 'Strong, sharp, and his house is in order.' };
  if (max - min >= config.imbalanceThreshold) {
    const top = stats.filter((s) => s.tier === max)[0];
    return { ...top.def.archetype, emoji: ARCHETYPE_EMOJI[top.def.id] };
  }
  return { name: 'Wandering Adventurer', emoji: '🧭', blurb: 'Rounded, still finding his way.' };
}

export const milestoneId = (stat: StatId, domain: string, level: number) => `${stat}.${domain}.${level}`;

/**
 * Derive the character from your history and the milestones you ticked. Pure and deterministic
 * (pass `now` to fix the clock). There is no XP: a milestone is either achieved or not, and for
 * fading domains it is also either currently valid or lapsed. Your tier uses "ever achieved".
 */
export function computeState(
  rawEvents: CompletionEvent[],
  meta: TodoistMeta,
  config: EngineConfig,
  claims: Claims = {},
  now: number = Date.now(),
): CharacterState {
  const byId = new Map(rawEvents.map((e) => [e.id, e]));
  const events = [...byId.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const classified = events.map((event) => ({ event, ...classify(event, meta, config) }));
  const feats = new Map(detectFeats(classified, config).map((f) => [f.def.id, f]));

  const tasks = Object.fromEntries(config.stats.map((s) => [s.id, { entries: [] }])) as unknown as Ctx['tasks'];
  const history: HistoryEntry[] = [];
  for (const { event, bucket, reason } of classified) {
    history.push({ event, bucket, reason });
    if (bucket === 'ignored' || bucket === 'neutral') continue;
    tasks[bucket as StatId].entries.push({ week: weekIndex(dayIndex(event.completedAt)), text: norm(event.content) });
  }
  const ctx: Ctx = { tasks, feats };

  let done = 0;
  let total = 0;
  const stats: StatState[] = config.stats.map((def) => {
    const domains: DomainState[] = config.domains[def.id].map((d) => {
      const lapseMs = d.decayDays ? d.decayDays * DAY_MS : null;
      const milestones: MilestoneState[] = d.ladder.map((ml, i) => {
        const level = i + 2;
        const id = milestoneId(def.id, d.id, level);
        const claimedAt = claims[id];
        const auto = !claimedAt && ml.auto ? evalAuto(ml.auto, def.id, ctx) : false;
        const achieved = Boolean(claimedAt) || auto;
        // Claimed: the date you ticked or confirmed. Auto feats: your most recent matching task.
        const lastDate = claimedAt ? claimedAt : auto && ml.auto ? evidence(ml.auto, ctx, 'last') : null;
        const confirmedAt = lastDate ? lastDate.slice(0, 10) : undefined;
        const fresh = !achieved ? false
          : lapseMs === null || !confirmedAt ? true
          : now - Date.parse(confirmedAt) <= lapseMs;
        const state: MilestoneState = {
          id, level, text: ml.text, achieved, current: fresh, confirmedAt,
          source: claimedAt ? 'claimed' : auto ? 'auto' : null,
        };
        if (!achieved) state.note = pendingNote(ml.auto, ctx);
        return state;
      });
      const level = milestones.reduce((lv, ms) => (ms.achieved ? Math.max(lv, ms.level) : lv), 1);
      const currentLevel = milestones.reduce((lv, ms) => (ms.achieved && ms.current ? Math.max(lv, ms.level) : lv), 1);
      for (const ms of milestones) {
        if (!ms.achieved && ms.level < level) {
          ms.achieved = true;
          ms.source = 'implied';
          ms.note = undefined;
          ms.current = ms.level <= currentLevel;
        }
        total++;
        if (ms.achieved) done++;
      }
      return { def: d, level, currentLevel, milestones };
    });
    const levels = domains.map((d) => d.level);
    const tier = tierFromLevels(levels, config.needDomainShare);
    const info = nextTierInfo(levels, tier, config.needDomainShare, domains.map((d) => d.def.name));
    return {
      def, tier, title: def.tiers[tier - 1], domains,
      completions: tasks[def.id].entries.length,
      nextTitle: tier < 7 ? def.tiers[tier] : null,
      progress: info.progress, nextNeeds: info.needs, nextReq: info.req,
    };
  });

  const weightSum = config.stats.reduce((s, x) => s + x.weight, 0);
  const level = stats.reduce((s, x) => s + x.def.weight * x.tier, 0) - (weightSum - 1);
  return {
    stats, level,
    milestonesDone: done,
    milestonesTotal: total,
    archetype: archetypeOf(stats, config),
    feats: [...feats.values()],
    history,
  };
}
