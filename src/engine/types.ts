// Core domain types. The engine is pure: (events, meta, profile, claims, config) -> CharacterState.
// There is no XP. Progress is milestones: concrete things you have done or can do.

export type StatId = 'body' | 'mind' | 'upkeep';
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
  /** Todoist API priority: 4 = P1 (highest) … 1 = P4. */
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

/** Milestones the user ticked off by hand: id -> ISO date. */
export type Claims = Record<string, string>;

// ---------- Config ----------

export interface StatDef {
  id: StatId;
  name: string;
  emoji: string;
  /** 7 tier titles, index 0 = tier 1. */
  tiers: string[];
  /** How much this stat counts toward the overall level. */
  weight: number;
  /** Archetype when this stat dominates and the character is lopsided. */
  archetype: { name: string; blurb: string };
}

/** How a milestone can be detected from your data without ticking it by hand. */
export type Auto =
  | { feat: string }
  | { streak: { weeks: number; perWeek: number; pattern?: string } }
  | { count: { min: number; pattern?: string } }
  | { all: Auto[] }
  | { any: Auto[] };

export interface MilestoneDef {
  text: string;
  auto?: Auto;
}

/** One dimension of a stat. `ladder[0]` is the milestone for level 2, `ladder[5]` for level 7. */
export interface DomainDef {
  id: string;
  name: string;
  /**
   * Days after which an unconfirmed milestone stops being "currently valid". It stays "ever
   * achieved" and never lowers your tier. Omitted = never lapses.
   */
  decayDays?: number;
  ladder: MilestoneDef[];
}

export interface FeatDef {
  id: string;
  stat: StatId;
  name: string;
  /** Rough share of adults who have this feat (0..1). Informational. */
  rarity: number;
  /** Regex (case-insensitive, diacritics stripped) the task text must match. */
  pattern: string;
  /** Regex that disqualifies a match (assisted variants, attempts, tests…). */
  disqualify?: string;
  /**
   * How success is proven:
   *  - 'reps': a "NxM" or "N reps" figure in the task with M >= minReps
   *  - 'milestone': the task is labelled Achievement/Boss-fight or says first/primul
   */
  proof: 'reps' | 'milestone';
  minReps?: number;
  /** Body feats: must say strict/clean or carry the Clean label. */
  requiresCleanForm?: boolean;
  /** By default the task must be classified into the feat's own stat. */
  anyBucket?: boolean;
}

export interface MappingRule {
  bucket: Bucket;
  label?: string;
  section?: string;
  project?: string;
  keywords?: string[];
}

export interface EngineConfig {
  stats: StatDef[];
  /** The domains of each stat. Every stat is judged on all of them, so a high tier means well-rounded. */
  domains: Record<StatId, DomainDef[]>;
  feats: FeatDef[];
  /**
   * Tier T needs at least `needDomainShare` of the domains at level T or above, and no domain
   * below level T-1. A neglected domain therefore caps the whole stat.
   */
  needDomainShare: number;
  imbalanceThreshold: number;
  mapping: MappingRule[];
}

// ---------- Output ----------

export interface HistoryEntry {
  event: CompletionEvent;
  bucket: Bucket;
  reason: string;
}

export interface MilestoneState {
  id: string;
  /** Level this milestone unlocks (2..7). */
  level: number;
  text: string;
  /** Ever achieved. */
  achieved: boolean;
  /** Achieved and, if the domain fades, confirmed recently enough to count as currently valid. */
  current: boolean;
  /** When it was achieved or last confirmed (ticked date, or the matching task). */
  confirmedAt?: string;
  /** 'implied': a higher rung in the same domain is achieved, so this one must be too. */
  source: 'claimed' | 'auto' | 'implied' | null;
  claimedAt?: string;
  /** Why an auto-detected feat was not accepted yet (e.g. no proof of clean form). */
  note?: string;
}

export interface DomainState {
  def: DomainDef;
  /** Best level ever achieved (1 = nothing yet). Lower rungs are implied. */
  level: number;
  /** Highest level that is currently valid. Never above `level`. */
  currentLevel: number;
  milestones: MilestoneState[];
}

export interface StatState {
  def: StatDef;
  tier: number;
  title: string;
  domains: DomainState[];
  completions: number;
  nextTitle: string | null;
  /** 0..1 toward the next tier. */
  progress: number;
  /** What stands between you and the next tier, in plain words. */
  nextNeeds: string[];
  /** Exact requirement count for the next tier. */
  nextReq: { level: number; have: number; need: number; behind: number } | null;
}

export interface DetectedFeat {
  def: FeatDef;
  status: 'counted' | 'needs-clean-form';
  /** The first qualifying completion. */
  event: CompletionEvent;
  /** The most recent qualifying completion (counted feats only). */
  lastAt?: string;
}

export interface CharacterState {
  stats: StatState[];
  /** Weighted sum of tiers, shifted so all-tier-1 is level 1. Body and Mind count double. */
  level: number;
  milestonesDone: number;
  milestonesTotal: number;
  archetype: { name: string; blurb: string; emoji: string };
  feats: DetectedFeat[];
  history: HistoryEntry[];
}
