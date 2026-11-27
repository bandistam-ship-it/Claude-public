// Citire (doar GET) din Todoist API v1. Token din TODOIST_TOKEN.
import { taskPoints } from './week.js';

const BASE = 'https://api.todoist.com/api/v1';

export function classify(task, sectionName, domainCfg) {
  const labels = (task.labels || []).map((l) => String(l).toLowerCase());
  if (labels.some((l) => domainCfg.dreptLabels.includes(l))) return 'drept';
  for (const l of labels) if (domainCfg.labelToDomain[l]) return domainCfg.labelToDomain[l];
  const sec = (sectionName || '').toLowerCase();
  for (const [key, dom] of Object.entries(domainCfg.sectionToDomain)) if (sec.includes(key)) return dom;
  return null;
}

export class Todoist {
  constructor(cfg, token = process.env.TODOIST_TOKEN, fetchImpl = globalThis.fetch) {
    this.cfg = cfg;
    this.token = token;
    this.fetch = fetchImpl;
    this.cache = new Map();
    this.meta = null;
  }

  get enabled() { return Boolean(this.token); }

  async get(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
    const res = await this.fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new Error(`Todoist ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async paged(path, params) {
    const out = [];
    let cursor;
    do {
      const page = await this.get(path, { ...params, cursor, limit: 200 });
      out.push(...(page.results || page.items || []));
      cursor = page.next_cursor;
    } while (cursor);
    return out;
  }

  async loadMeta() {
    if (this.meta) return this.meta;
    const projects = await this.paged('/projects');
    const project = projects.find((p) => p.name.toLowerCase() === this.cfg.todoist.projectName.toLowerCase());
    if (!project) throw new Error(`Proiectul „${this.cfg.todoist.projectName}” nu există în Todoist`);
    const sections = await this.paged('/sections', { project_id: project.id });
    this.meta = { projectId: project.id, sections: Object.fromEntries(sections.map((s) => [s.id, s.name])) };
    return this.meta;
  }

  // Task-uri bifate in [since, until), clasificate pe domenii, cu puncte.
  async completed(since, until) {
    const key = `${since.toISOString()}|${until.toISOString()}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.cfg.todoist.cacheSeconds * 1000) return hit.tasks;
    const meta = await this.loadMeta();
    const items = await this.paged('/tasks/completed/by_completion_date', {
      since: since.toISOString(), until: until.toISOString()
    });
    const tasks = items
      .filter((t) => String(t.project_id) === String(meta.projectId))
      .map((t) => ({
        id: String(t.task_id || t.id),
        content: t.content || '',
        labels: (t.labels || []).map((l) => String(l).toLowerCase()),
        completedAt: t.completed_at,
        domain: classify(t, meta.sections[t.section_id], this.cfg.domains),
        points: taskPoints(t, this.cfg.score)
      }));
    this.cache.set(key, { at: Date.now(), tasks });
    return tasks;
  }
}
