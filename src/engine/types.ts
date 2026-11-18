// Core domain types. The engine is pure: (events, meta, profile, config) -> CharacterState.

export type StatId = 'body' | 'mind' | 'upkeep' | 'spirit' | 'career';
export type Bucket = StatId | 'neutral' | 'ignored';

/** One completion of a Todoist task (recurring tasks produce one per occurrence). */
export interface CompletionEvent {
  id: string;
  taskId: string;
  content: string;
  description: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  labels: string[];
  /** Todoist API priority: 4 = P1 (highest) … 1 = P4. Not used for XP. */
  priority: number;
  durationMin: number | null;
  /** ISO timestamp. */
  completedAt: string;
  recurring: boolean;
}

export interface TodoistMeta {
  projects: Record<string, string>; // id -> name
  sections: Record<string, { name: string; projectId: string }>;
}

/** What Todoist can't know: entered by hand in Settings, stays in the browser. */
export interface Profile {
  /** Net monthly wage in RON. */
  netWageRon: number;
  /** Index into config.career.positions (0 = student / no job). */
  positionRank: number;
}

// ---------- Config ----------

export interface StatDef {
  id: StatId;
  name: string;
  emoji: string;
  /** 7 tier titles, index 0 = tier 1. */
  tiers: string[];
  /** Archetype when this stat dominates and the character is lopsided. */
  archetype: { name: string; blurb: string };
}

export type Requirement =
  | { type: 'feat'; featId: string }
  | { type: 'count'; min: number; pattern?: string }
  | { type: 'streak'; weeks: number; minPerWeek: number }
  | { type: 'wage'; minNetRon: number }
  | { type: 'position'; minRank: number };

/** Gate to ENTER a tier. Passes when every `all` passes and (if `any` is set) at least one `any` passes. */
export interface Gate {
  all?: Requirement[];
  any?: Requirement[];
  /** Human-readable summary, e.g. "First strict pull-up (~25% of adults)". */
  text: string;
}

export interface FeatDef {
  id: string;
  stat: StatId;
  name: string;
  /** Rough share of adults who have this feat (0..1). Drives the one-off bonus XP. */
  rarity: number;
  /** Regex (case-insensitive, diacritics stripped) the task text must match. */
  pattern: string;
  /** Regex that disqualifies a match (assisted variants, attempts, tests…). */
  disqualify?: string;
  /**
   * How success is proven:
   *  - 'reps': a "NxM" or "N reps" figure in the task with M >= minReps (completing the set = doing it)
   *  - 'milestone': the task is labelled Achievement/Boss-fight or says first/primul
   */
  proof: 'reps' | 'milestone';
  minReps?: number;
  /** Body feats: must say strict/clean or carry the Clean label. */
  requiresCleanForm?: boolean;
  /** By default the task must be classified into the feat's own stat; true lifts that (e.g. Barou admission filed under Career). */
  anyBucket?: boolean;
}

export interface MappingRule {
  bucket: Bucket;
  label?: string;
  section?: string; // section name, emoji/case-insensitive, matched as substring
  project?: string; // project name, case-insensitive, matched as prefix
  keywords?: string[]; // any keyword in task text (diacritics stripped)
}

export interface EngineConfig {
  stats: StatDef[];
  /** Cumulative XP to enter tier 1..7 (index 0 = tier 1 = 0 XP). */
  tierXp: number[];
  /** Gates to enter tiers 2..7, per stat (index 0 = gate for tier 2). */
  gates: Record<StatId, Gate[]>;
  feats: FeatDef[];
  difficultyXp: Record<string, number>;
  /** Tier a difficulty label "trains at" — used for the challenge (newbie-gains) factor. */
  difficultyLevel: Record<string, number>;
  defaultXp: number;
  defaultLevel: number;
  neutralXp: number;
  challengeDecay: number;
  dailySoftCap: number;
  dailyOverCapFactor: number;
  durationClamp: [number, number];
  /** XP bonus for a feat = featBonusPerDecade * log10(1/rarity). */
  featBonusPerDecade: number;
  imbalanceThreshold: number;
  mapping: MappingRule[];
  career: { positions: string[] };
}

// ---------- Output ----------

export interface ScoredEvent {
  event: CompletionEvent;
  bucket: Bucket;
  reason: string;
  xp: number;
  /** Explanation of the multipliers, e.g. "Medium 25 × dur 1.66 × challenge 1". */
  breakdown: string;
}

export interface GateStatus {
  tier: number; // tier this gate unlocks
  passed: boolean;
  text: string;
  /** Per-requirement detail for the UI. */
  detail: string[];
}

export interface StatState {
  def: StatDef;
  xp: number;
  /** Tier from XP alone. */
  xpTier: number;
  /** Actual tier: min(xpTier, highest consecutively passed gate). */
  tier: number;
  title: string;
  nextTierXp: number | null;
  progress: number; // 0..1 toward next tier
  /** True when XP is enough for the next tier but its gate is locked. */
  gateLocked: boolean;
  gates: GateStatus[];
  completions: number;
  bestStreakWeeks: number;
}

export type FeatStatus = 'counted' | 'needs-clean-form';

export interface DetectedFeat {
  def: FeatDef;
  status: FeatStatus;
  event: CompletionEvent;
  bonusXp: number;
}

export interface CharacterState {
  stats: StatState[];
  neutralXp: number;
  totalXp: number;
  level: number;
  levelProgress: number;
  archetype: { name: string; blurb: string; emoji: string };
  feats: DetectedFeat[];
  scored: ScoredEvent[];
}
