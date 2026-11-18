import { classify } from './classify';
import { detectFeats } from './feats';
import type {
  Auto, CharacterState, Claims, CompletionEvent, DetectedFeat, EngineConfig, HistoryEntry,
  RungState, SectionState, TodoistMeta,
} from './types';

const DAY_MS = 86_400_000;

interface Ctx { feats: Map<string, DetectedFeat> }

function evalAuto(a: Auto, ctx: Ctx): boolean {
  if ('all' in a) return a.all.every((x) => evalAuto(x, ctx));
  if ('any' in a) return a.any.some((x) => evalAuto(x, ctx));
  return ctx.feats.get(a.feat)?.status === 'counted';
}

/** Date of the task that proves a feat rule: the first or the most recent one. */
function evidence(a: Auto, ctx: Ctx, which: 'first' | 'last'): string | null {
  if ('feat' in a) {
    const f = ctx.feats.get(a.feat);
    if (f?.status !== 'counted') return null;
    return which === 'first' ? f.event.completedAt : (f.lastAt ?? f.event.completedAt);
  }
  const subs = ('all' in a ? a.all : a.any).map((x) => evidence(x, ctx, which)).filter((x): x is string => x !== null);
  if (!subs.length) return null;
  subs.sort();
  // all: every part must be recent, so the oldest "last" date; any: the best part.
  if ('all' in a) return which === 'last' ? subs[0] : subs[subs.length - 1];
  return which === 'last' ? subs[subs.length - 1] : subs[0];
}

/** First feat in a rule that was found in the history but not accepted (needs clean form). */
function pendingNote(a: Auto | undefined, ctx: Ctx): string | undefined {
  if (!a) return undefined;
  if ('all' in a) return a.all.map((x) => pendingNote(x, ctx)).find(Boolean);
  if ('any' in a) return a.any.map((x) => pendingNote(x, ctx)).find(Boolean);
  const f = ctx.feats.get(a.feat);
  if (f?.status === 'needs-clean-form') {
    return `Found “${f.event.content}” but no proof of clean form. Add the Clean label in Todoist, or tick it here.`;
  }
  return undefined;
}

export const rungId = (section: string, index: number) => `${section}.${index + 1}`;

/** Which build tier a share of adults corresponds to: top 50% = 2 … top 0.2% = 7. */
export function tierFromShare(share: number): number {
  const cuts = [0.5, 0.25, 0.1, 0.03, 0.01, 0.002];
  let tier = 1;
  for (const c of cuts) if (share <= c) tier++;
  return tier;
}

/**
 * Archetype from how far apart your two sections are. One section is "lopsided" when it is at
 * least `imbalanceRatio` times rarer than the other.
 */
export function archetypeOf(cal: number, end: number, config: EngineConfig): CharacterState['archetype'] {
  if (cal > 0.5 && end > 0.5) return { name: 'Basement Nerd', emoji: '🤓', blurb: 'Frail, unfit, and happiest on the couch.' };
  if (cal <= end / config.imbalanceRatio) {
    return { name: 'Calisthenics Wizard', emoji: '🤸', blurb: 'Every bar trick in the book, and no engine to carry him through a long day.' };
  }
  if (end <= cal / config.imbalanceRatio) {
    return { name: 'Lean Distance Runner', emoji: '🏃', blurb: 'All lungs and tendon, with little strength to show for it.' };
  }
  if (cal <= 0.05 && end <= 0.05) return { name: 'Complete Athlete', emoji: '🦸', blurb: 'Strong on the bar, strong on the road.' };
  return { name: 'Well-Rounded Mover', emoji: '🧭', blurb: 'Capable at both, still sharpening.' };
}

/**
 * Derive the character from your history and the feats you ticked. Pure and deterministic (pass
 * `now` to fix the clock). A feat is either achieved or not; for fading sections it is also either
 * currently valid or lapsed. Your standing uses the rarest feat you ever achieved.
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
  const history: HistoryEntry[] = classified.map(({ event, bucket, reason }) => ({ event, bucket, reason }));
  const ctx: Ctx = { feats };

  let done = 0;
  let total = 0;
  const sections: SectionState[] = config.sections.map((def) => {
    const lapseMs = def.decayDays ? def.decayDays * DAY_MS : null;
    const rungs: RungState[] = def.rungs.map((rd, i) => {
      const id = rungId(def.id, i);
      const claimedAt = claims[id];
      const auto = !claimedAt && rd.auto ? evalAuto(rd.auto, ctx) : false;
      const achieved = Boolean(claimedAt) || auto;
      // Claimed: the date you ticked or confirmed. Auto: your most recent matching task.
      const lastDate = claimedAt ? claimedAt : auto && rd.auto ? evidence(rd.auto, ctx, 'last') : null;
      const confirmedAt = lastDate ? lastDate.slice(0, 10) : undefined;
      const current = !achieved ? false
        : lapseMs === null || !confirmedAt ? true
        : now - Date.parse(confirmedAt) <= lapseMs;
      total++;
      if (achieved) done++;
      return {
        id, text: rd.text, share: rd.share, achieved, current, confirmedAt,
        source: claimedAt ? 'claimed' : auto ? 'auto' : null,
        note: achieved ? undefined : pendingNote(rd.auto, ctx),
      };
    });
    const rarest = (list: RungState[]) => list.reduce<RungState | null>((b, x) => (!b || x.share < b.share ? x : b), null);
    const best = rarest(rungs.filter((x) => x.achieved));
    const current = rarest(rungs.filter((x) => x.achieved && x.current));
    const next = rungs.filter((x) => !x.achieved).reduce<RungState | null>((b, x) => (!b || x.share > b.share ? x : b), null);
    return { def, rungs, share: best?.share ?? 1, currentShare: current?.share ?? 1, best, current, next };
  });

  const combinedShare = Math.sqrt(sections[0].share * sections[1].share);
  const tier = tierFromShare(combinedShare);
  return {
    sections, combinedShare, tier,
    tierTitle: config.tiers[tier - 1],
    rungsDone: done, rungsTotal: total,
    archetype: archetypeOf(sections[0].share, sections[1].share, config),
    feats: [...feats.values()],
    history,
  };
}
