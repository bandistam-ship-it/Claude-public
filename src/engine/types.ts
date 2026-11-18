// Core domain types. The engine is pure: (events, meta, profile, claims, config) -> CharacterState.
// There is no XP. Progress is milestones: concrete things you have done or can do.

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

/** What Todoist can't know: entered by hand, stays in the browser. */
export interface Profile {
  /** Net monthly wage in RON. */
  netWageRon: number;
  /** Index into config.career.positions (0 = student / no job). */
  positionRank: number;
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
  /** Archetype when this stat dominates and the character is lopsided. */
  archetype: { name: string; blurb: string };
}

/** How a milestone can be detected from your data without ticking it by hand. */
export type Auto =
  | { feat: string }
  | { streak: { weeks: number; perWeek: number; pattern?: string } }
  | { count: { min: number; pattern?: string } }
  | { wage: number }
  | { position: number }
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
  career: { positions: string[] };
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
  achieved: boolean;
  /** 'implied': a higher rung in the same domain is achieved, so this one must be too. */
  source: 'claimed' | 'auto' | 'implied' | null;
  claimedAt?: string;
  /** Why an auto-detected feat was not accepted yet (e.g. no proof of clean form). */
  note?: string;
}

export interface DomainState {
  def: DomainDef;
  /** Highest achieved level (1 = nothing yet). Lower rungs are implied. */
  level: number;
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
}

export interface DetectedFeat {
  def: FeatDef;
  status: 'counted' | 'needs-clean-form';
  event: CompletionEvent;
}

export interface CharacterState {
  stats: StatState[];
  /** Sum of tiers, shifted so five tier-1 stats are level 1. */
  level: number;
  milestonesDone: number;
  milestonesTotal: number;
  archetype: { name: string; blurb: string; emoji: string };
  feats: DetectedFeat[];
  history: HistoryEntry[];
}
