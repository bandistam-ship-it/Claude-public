import type { Bucket, CompletionEvent, EngineConfig, TodoistMeta } from './types';
import { hasWord, norm } from './text';

export interface Classification {
  bucket: Bucket;
  reason: string;
}

/** Map a completion to a stat bucket. First matching rule in config.mapping wins. */
export function classify(ev: CompletionEvent, meta: TodoistMeta, config: EngineConfig): Classification {
  const labels = ev.labels.map((l) => l.toLowerCase());
  const sectionName = ev.sectionId ? norm(meta.sections[ev.sectionId]?.name ?? '') : '';
  const projectName = norm(meta.projects[ev.projectId] ?? '');
  const text = norm(`${ev.content}`);

  for (const rule of config.mapping) {
    if (rule.label && labels.includes(rule.label.toLowerCase())) {
      return { bucket: rule.bucket, reason: `label @${rule.label}` };
    }
    if (rule.section && sectionName && hasWord(sectionName, rule.section)) {
      return { bucket: rule.bucket, reason: `section “${meta.sections[ev.sectionId!]?.name}”` };
    }
    if (rule.project && projectName.startsWith(norm(rule.project))) {
      return { bucket: rule.bucket, reason: `project “${meta.projects[ev.projectId]}”` };
    }
    if (rule.keywords) {
      const kw = rule.keywords.find((k) => hasWord(text, k, true));
      if (kw) return { bucket: rule.bucket, reason: `keyword “${kw}”` };
    }
  }
  return { bucket: 'neutral', reason: 'no rule matched' };
}
