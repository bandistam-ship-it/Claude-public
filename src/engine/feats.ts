import type { Bucket, CompletionEvent, DetectedFeat, EngineConfig, FeatDef } from './types';
import { hasWord, norm, parseReps, re } from './text';

const MILESTONE_LABELS = ['achievement', 'boss-fight', 'victory'];

function milestoneSignal(ev: CompletionEvent, text: string): boolean {
  return (
    ev.labels.some((l) => MILESTONE_LABELS.includes(l.toLowerCase())) ||
    ['primul', 'prima', 'primele', 'first'].some((w) => hasWord(text, w))
  );
}

function cleanForm(ev: CompletionEvent, text: string): boolean {
  return ev.labels.some((l) => l.toLowerCase() === 'clean') || hasWord(text, 'strict') || hasWord(text, 'clean');
}

/** "10 pull-ups", "10 strict dips" — a plain count before a word (not a unit). */
function plainCount(text: string): number | null {
  const m = text.match(/(?:^|\s)(\d+)\s+(?!kg|km|min|s\b|sec|h\b|ore|%)(?:strict\s+|clean\s+)?\p{L}/u);
  return m ? Number(m[1]) : null;
}

export type FeatMatch = 'counted' | 'needs-clean-form' | null;

/** Does this completion prove the feat? */
export function matchFeat(ev: CompletionEvent, bucket: Bucket, feat: FeatDef): FeatMatch {
  if (bucket === 'ignored') return null;
  if (!feat.anyBucket && bucket !== feat.stat) return null;
  const text = norm(ev.content);
  if (!re(feat.pattern).test(text)) return null;
  if (feat.disqualify && re(feat.disqualify).test(text)) return null;

  const milestone = milestoneSignal(ev, text);
  let success: boolean;
  if (feat.proof === 'reps') {
    const min = feat.minReps ?? 1;
    const reps = parseReps(ev.content) ?? plainCount(text);
    success = (reps !== null && reps >= min) || (milestone && min <= 1);
  } else {
    success = milestone;
  }
  if (!success) return null;
  if (feat.requiresCleanForm && !cleanForm(ev, text)) return 'needs-clean-form';
  return 'counted';
}

/**
 * Scan the (chronologically sorted) history for feats. A feat is counted at its first clean,
 * successful completion; if it was only ever done without proof of clean form it is reported
 * as pending so the UI can say what's missing.
 */
export function detectFeats(
  events: { event: CompletionEvent; bucket: Bucket }[],
  config: EngineConfig,
): DetectedFeat[] {
  const out = new Map<string, DetectedFeat>();
  for (const { event, bucket } of events) {
    for (const feat of config.feats) {
      const existing = out.get(feat.id);
      const m = matchFeat(event, bucket, feat);
      if (!m) continue;
      if (existing?.status === 'counted') {
        if (m === 'counted') existing.lastAt = event.completedAt; // events are sorted, so this is the latest
        continue;
      }
      out.set(feat.id, { def: feat, status: m, event, lastAt: m === 'counted' ? event.completedAt : undefined });
    }
  }
  return [...out.values()];
}
