// Core domain types. The engine is pure: (events, meta, claims, config) -> CharacterState.
// Two sections only: Calisthenics and Endurance. Each is a list of feats, and each feat carries
// the estimated share of the general adult population that can do it, so your standing is a
// percentile of the population rather than points.

/** 'body' = a task that counts (calisthenics or running). Everything else is not scored. */
export type Bucket = 'body' | 'neutral' | 'ignored';
export type SectionId = 'calisthenics' | 'endurance';

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

import type { Kind } from './demographics';

/**
 * Your own numbers. They set the build of the character and tick some endurance feats. They are NOT
 * ranked against the population (calisthenics standing is about skills, not volume).
 */
export interface PersonalStats {
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  /** Max strict reps in one set. */
  pullUps: number | null;
  dips: number | null;
  pushUps: number | null;
  /** Best times in seconds. */
  best5kSec: number | null;
  best10kSec: number | null;
  longestRunKm: number | null;
  restingHr: number | null;
  vo2max: number | null;
  updatedAt: string | null;
}

/** Feats you ticked by hand: id -> date (YYYY-MM-DD). */
export type Claims = Record<string, string>;

// ---------- Config ----------

/** How a feat can be detected from your Todoist history without ticking it by hand. */
export type Auto = { feat: string } | { all: Auto[] } | { any: Auto[] };

export interface RungDef {
  /** Permanent id. A tick is stored under `<section>.<id>`, so rewording or reordering never moves it. */
  id: string;
  text: string;
  /**
   * Estimated share of the general adult population (0..1) that can do this. Pooled across ages
   * and sexes. These are rough estimates (see docs/CRITERIA.md), not measurements, except the
   * VO₂max rungs, which are percentiles by definition.
   */
  share: number;
  /** How the share changes with age and sex. 'exact' = already a percentile within your group. */
  kind: Kind;
  auto?: Auto;
}

export interface SectionDef {
  id: SectionId;
  name: string;
  emoji: string;
  /**
   * Days after which an unconfirmed feat stops being "currently valid". It stays "ever achieved".
   * Omitted = never lapses.
   */
  decayDays?: number;
  /** Ordered from the most common feat to the rarest. */
  rungs: RungDef[];
}

export interface FeatDef {
  id: string;
  name: string;
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
  /** Must say strict/clean or carry the Clean label. */
  requiresCleanForm?: boolean;
}

export interface MappingRule {
  bucket: Bucket;
  label?: string;
  section?: string;
  project?: string;
  keywords?: string[];
}

export interface EngineConfig {
  sections: SectionDef[];
  feats: FeatDef[];
  /** 7 titles for the character's build, from least to most impressive. */
  tiers: string[];
  /** Your sections count as lopsided when one is this many times rarer than the other. */
  imbalanceRatio: number;
  mapping: MappingRule[];
}

// ---------- Output ----------

export interface HistoryEntry {
  event: CompletionEvent;
  bucket: Bucket;
  reason: string;
}

export interface RungState {
  id: string;
  text: string;
  /** Share of people in your age and sex group who can do this (the adjusted share). */
  share: number;
  /** Share of all adults (pooled), before adjusting for age and sex. */
  poolShare: number;
  /** The day you first did it: the date you ticked it, or the first matching task. */
  achievedAt?: string;
  /** Ever achieved. */
  achieved: boolean;
  /** Achieved and, if the section fades, confirmed recently enough to count as currently valid. */
  current: boolean;
  /** When it was ticked or last seen in your tasks. */
  confirmedAt?: string;
  source: 'claimed' | 'auto' | null;
  /** Why an auto-detected feat was not accepted yet (e.g. no proof of clean form). */
  note?: string;
}

export interface SectionState {
  def: SectionDef;
  rungs: RungState[];
  /** Share of your group who can do your rarest achieved feat. 1 = nothing achieved yet. */
  share: number;
  /** The same for all adults, pooled. */
  poolShare: number;
  /** The same as `share`, counting only feats that are currently valid. */
  currentShare: number;
  best: RungState | null;
  current: RungState | null;
  /** The most common feat you have not achieved yet. */
  next: RungState | null;
}

export interface DetectedFeat {
  def: FeatDef;
  status: 'counted' | 'needs-clean-form';
  /** The first qualifying completion. */
  event: CompletionEvent;
  /** The most recent qualifying completion (counted feats only). */
  lastAt?: string;
}

export interface TimelinePoint {
  date: string;
  calisthenics: number;
  endurance: number;
  combined: number;
}

export interface UnlockEntry {
  sectionId: SectionId;
  sectionName: string;
  emoji: string;
  rungId: string;
  text: string;
  share: number;
  date: string;
}

/** Standing some days ago against now. `then` is null before you started tracking. */
export interface Versus {
  days: number;
  label: string;
  then: { calisthenics: number; endurance: number; combined: number } | null;
}

export interface CharacterState {
  /** Who you are compared with: "men aged 20–29" or "all adults". */
  group: string;
  /** The day this was calculated for (YYYY-MM-DD). */
  today: string;
  sections: SectionState[];
  timeline: TimelinePoint[];
  unlocks: UnlockEntry[];
  versus: Versus[];
  /** The earliest dated unlock, or null. Your "versus you" history starts here. */
  trackingSince: string | null;
  now: { calisthenics: number; endurance: number; combined: number };
  /** Combined standing: the geometric mean of the two sections' shares. */
  combinedShare: number;
  /** 1..7, drives the character's build and training space. */
  tier: number;
  tierTitle: string;
  /** Where the build comes from: your max reps, or (with none entered) your skill standing. */
  buildBasis: 'numbers' | 'standing';
  rungsDone: number;
  rungsTotal: number;
  archetype: { name: string; blurb: string; emoji: string };
  feats: DetectedFeat[];
  history: HistoryEntry[];
}
