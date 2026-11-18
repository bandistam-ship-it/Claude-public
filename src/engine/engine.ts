import { PROJECT_DEFAULT_DIFFICULTY, REST_PATTERN } from './config';
import { classify } from './classify';
import { detectFeats } from './feats';
import { norm, re } from './text';
import type {
  CharacterState,
  CompletionEvent,
  DetectedFeat,
  EngineConfig,
  Gate,
  GateStatus,
  Profile,
  Requirement,
  ScoredEvent,
  StatId,
  StatState,
  TodoistMeta,
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

interface Tracker {
  xp: number;
  tier: number;
  texts: string[]; // normalised task text of every completion in this stat
  weekCounts: Map<number, number>;
  dayCounts: Map<number, number>;
}

interface Ctx {
  tracker: Tracker;
  /** Feats counted so far: id -> event time (ms). */
  counted: Map<string, number>;
  feats: DetectedFeat[];
  profile: Profile;
  config: EngineConfig;
  now: number;
}

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

function evalRequirement(req: Requirement, ctx: Ctx): { ok: boolean; text: string } {
  const { tracker, config, profile } = ctx;
  switch (req.type) {
    case 'feat': {
      const def = config.feats.find((f) => f.id === req.featId);
      const name = def?.name ?? req.featId;
      const at = ctx.counted.get(req.featId);
      if (at !== undefined && at <= ctx.now) return { ok: true, text: `✓ ${name}` };
      // A rarer feat in the same stat implies this one (a muscle-up implies a pull-up).
      const harder = def && config.feats.find(
        (f) => f.stat === def.stat && f.rarity < def.rarity && (ctx.counted.get(f.id) ?? Infinity) <= ctx.now,
      );
      if (harder) return { ok: true, text: `✓ ${name} (implied by ${harder.name})` };
      const pending = ctx.feats.find((f) => f.def.id === req.featId && f.status === 'needs-clean-form');
      if (pending) return { ok: false, text: `✗ ${name}: found “${pending.event.content}” but no proof of clean form (add the Clean label or say “strict”)` };
      return { ok: false, text: `✗ ${name}: not yet` };
    }
    case 'count': {
      const n = req.pattern ? tracker.texts.filter((t) => re(req.pattern!).test(t)).length : tracker.texts.length;
      return { ok: n >= req.min, text: `${n >= req.min ? '✓' : '✗'} ${Math.min(n, req.min)}/${req.min} matching tasks` };
    }
    case 'streak': {
      const best = bestStreak(tracker.weekCounts, req.minPerWeek);
      return {
        ok: best >= req.weeks,
        text: `${best >= req.weeks ? '✓' : '✗'} best run ${best}/${req.weeks} weeks with ≥${req.minPerWeek}/week`,
      };
    }
    case 'wage': {
      const ok = profile.netWageRon >= req.minNetRon;
      return { ok, text: `${ok ? '✓' : '✗'} wage ${profile.netWageRon.toLocaleString('en')} / ${req.minNetRon.toLocaleString('en')} RON net` };
    }
    case 'position': {
      const ok = profile.positionRank >= req.minRank;
      const p = config.career.positions;
      return { ok, text: `${ok ? '✓' : '✗'} position: ${p[profile.positionRank] ?? '?'} (needs ${p[req.minRank]})` };
    }
  }
}

function evalGate(gate: Gate, ctx: Ctx): { ok: boolean; detail: string[] } {
  const all = (gate.all ?? []).map((r) => evalRequirement(r, ctx));
  const any = (gate.any ?? []).map((r) => evalRequirement(r, ctx));
  const ok = all.every((r) => r.ok) && (any.length === 0 || any.some((r) => r.ok));
  const detail = [...all.map((r) => r.text), ...(any.length ? [`one of: ${any.map((r) => r.text).join('  |  ')}`] : [])];
  return { ok, detail };
}

export function xpTierOf(xp: number, config: EngineConfig): number {
  let t = 1;
  for (let i = 1; i < config.tierXp.length; i++) if (xp >= config.tierXp[i]) t = i + 1;
  return t;
}

/** Cumulative XP to reach overall level L (L1 = 0). Steep on purpose. */
export const levelXp = (level: number) => Math.round(100 * Math.pow(level - 1, 1.7));

export function levelOf(totalXp: number): { level: number; progress: number } {
  let level = 1;
  while (levelXp(level + 1) <= totalXp) level++;
  const lo = levelXp(level);
  const hi = levelXp(level + 1);
  return { level, progress: (totalXp - lo) / (hi - lo) };
}

const ARCHETYPE_EMOJI: Record<StatId, string> = {
  body: '🦍', mind: '🧐', upkeep: '🧹', spirit: '🔮', career: '💼', bonds: '🎉',
};

export function archetypeOf(stats: StatState[], config: EngineConfig): CharacterState['archetype'] {
  const tiers = stats.map((s) => s.tier);
  const max = Math.max(...tiers);
  const min = Math.min(...tiers);
  if (max <= 2) return { name: 'Basement Nerd', emoji: '🤓', blurb: 'Frail, unfit, not very bright, sitting in a messy room.' };
  if (min >= 4 && max - min <= 1) return { name: 'Renaissance Hero', emoji: '🦸', blurb: 'Strong, sharp, at peace, and his house is in order.' };
  if (max - min >= config.imbalanceThreshold) {
    const top = stats.filter((s) => s.tier === max).sort((a, b) => b.xp - a.xp)[0];
    return { ...top.def.archetype, emoji: ARCHETYPE_EMOJI[top.def.id] };
  }
  return { name: 'Wandering Adventurer', emoji: '🧭', blurb: 'Rounded, still finding his way.' };
}

/**
 * Replay the whole history in order and derive the character. Pure and deterministic:
 * the same events + config always give the same character, so tuning a number in
 * Settings simply re-runs this.
 */
export function computeState(
  rawEvents: CompletionEvent[],
  meta: TodoistMeta,
  profile: Profile,
  config: EngineConfig,
): CharacterState {
  const byId = new Map(rawEvents.map((e) => [e.id, e]));
  const events = [...byId.values()].sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  const classified = events.map((event) => ({ event, ...classify(event, meta, config) }));
  const feats = detectFeats(classified, config);
  const countedAt = new Map<string, number>();
  const featByEvent = new Map<string, DetectedFeat[]>();
  for (const f of feats) {
    if (f.status !== 'counted') continue;
    countedAt.set(f.def.id, Date.parse(f.event.completedAt));
    featByEvent.set(f.event.id, [...(featByEvent.get(f.event.id) ?? []), f]);
  }

  const taskTimes = new Map<string, number[]>();
  for (const e of events) taskTimes.set(e.taskId, [...(taskTimes.get(e.taskId) ?? []), Date.parse(e.completedAt)]);

  const trackers = new Map<StatId, Tracker>(
    config.stats.map((s) => [s.id, { xp: 0, tier: 1, texts: [], weekCounts: new Map(), dayCounts: new Map() }]),
  );
  const counted = new Map<string, number>();
  let neutralXp = 0;
  const scored: ScoredEvent[] = [];

  const advanceTiers = (now: number) => {
    for (const [stat, tr] of trackers) {
      const gates = config.gates[stat];
      while (tr.tier < 7 && tr.xp >= config.tierXp[tr.tier]) {
        const ctx: Ctx = { tracker: tr, counted, feats, profile, config, now };
        if (!evalGate(gates[tr.tier - 1], ctx).ok) break;
        tr.tier++;
      }
    }
  };

  for (const { event, bucket, reason } of classified) {
    const t = Date.parse(event.completedAt);
    const day = dayIndex(event.completedAt);
    const result: ScoredEvent = { event, bucket, reason, xp: 0, breakdown: '' };

    if (bucket === 'ignored') {
      result.breakdown = 'ignored (rewards / reference card)';
    } else if (bucket === 'neutral') {
      result.xp = config.neutralXp;
      result.breakdown = `neutral ${config.neutralXp}`;
      neutralXp += config.neutralXp;
    } else {
      const tr = trackers.get(bucket)!;
      const text = norm(event.content);
      tr.texts.push(text);
      const week = weekIndex(day);
      tr.weekCounts.set(week, (tr.weekCounts.get(week) ?? 0) + 1);

      const parentDone = event.parentId && (taskTimes.get(event.parentId) ?? []).some((p) => Math.abs(p - t) < DAY_MS);
      if (parentDone) {
        result.breakdown = 'part of a session (the parent task carries the XP)';
      } else {
        const diffLabel = event.labels.map((l) => l.toLowerCase()).find((l) => l in config.difficultyXp);
        const projectKey = Object.keys(PROJECT_DEFAULT_DIFFICULTY).find((p) =>
          norm(meta.projects[event.projectId] ?? '').startsWith(p),
        );
        let diff: string | undefined = diffLabel;
        if (!diff && re(REST_PATTERN).test(text)) diff = 'easy';
        if (!diff && projectKey) diff = PROJECT_DEFAULT_DIFFICULTY[projectKey];
        const base = diff ? config.difficultyXp[diff] : config.defaultXp;
        const level = diff ? config.difficultyLevel[diff] : config.defaultLevel;

        const [lo, hi] = config.durationClamp;
        const dur = event.durationMin ? Math.min(hi, Math.max(lo, Math.sqrt(event.durationMin / 60))) : 1;
        const challenge = level >= tr.tier ? 1 : Math.pow(config.challengeDecay, tr.tier - level);
        const doneToday = tr.dayCounts.get(day) ?? 0;
        const daily = doneToday >= config.dailySoftCap ? config.dailyOverCapFactor : 1;
        tr.dayCounts.set(day, doneToday + 1);

        result.xp = Math.max(1, Math.round(base * dur * challenge * daily));
        result.breakdown = [
          `${diff ? diff[0].toUpperCase() + diff.slice(1) : 'Unlabelled'} ${base}`,
          dur !== 1 ? `× duration ${dur.toFixed(2)}` : '',
          challenge !== 1 ? `× challenge ${challenge.toFixed(2)} (tier ${tr.tier} vs task level ${level})` : '',
          daily !== 1 ? `× ${daily} (over ${config.dailySoftCap}/day)` : '',
        ].filter(Boolean).join(' ');
        tr.xp += result.xp;
      }
    }

    // One-off feat bonuses land in the feat's own stat.
    for (const f of featByEvent.get(event.id) ?? []) {
      counted.set(f.def.id, t);
      trackers.get(f.def.stat)!.xp += f.bonusXp;
      result.xp += f.bonusXp;
      result.breakdown += ` + feat “${f.def.name}” ${f.bonusXp}`;
    }

    scored.push(result);
    advanceTiers(t);
  }

  const now = Date.now();
  const stats: StatState[] = config.stats.map((def) => {
    const tr = trackers.get(def.id)!;
    const ctx: Ctx = { tracker: tr, counted, feats, profile, config, now };
    const gates: GateStatus[] = config.gates[def.id].map((g, i) => {
      const r = evalGate(g, ctx);
      return { tier: i + 2, passed: r.ok, text: g.text, detail: r.detail };
    });
    const xpTier = xpTierOf(tr.xp, config);
    const tier = tr.tier;
    const nextTierXp = tier < 7 ? config.tierXp[tier] : null;
    const lo = config.tierXp[tier - 1];
    const progress = nextTierXp === null ? 1 : Math.min(1, Math.max(0, (tr.xp - lo) / (nextTierXp - lo)));
    return {
      def,
      xp: tr.xp,
      xpTier,
      tier,
      title: def.tiers[tier - 1],
      nextTierXp,
      progress,
      gateLocked: xpTier > tier,
      gates,
      completions: tr.texts.length,
      bestStreakWeeks: bestStreak(tr.weekCounts, 1),
    };
  });

  const totalXp = stats.reduce((s, x) => s + x.xp, 0) + neutralXp;
  const { level, progress: levelProgress } = levelOf(totalXp);
  return {
    stats,
    neutralXp,
    totalXp,
    level,
    levelProgress,
    archetype: archetypeOf(stats, config),
    feats,
    scored,
  };
}

