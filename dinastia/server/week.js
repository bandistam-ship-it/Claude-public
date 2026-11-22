// Calcule de saptamana si scor (functii pure, usor de testat).
import { DOMAINS } from './data.js';

export function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // luni = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function weekRange(date = new Date()) {
  const start = mondayOf(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

// Cheie ISO de saptamana, ex. 2026-W47
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function taskPoints(task, scoreCfg) {
  for (const l of task.labels || []) {
    const p = scoreCfg.labelPoints[String(l).toLowerCase()];
    if (p) return p;
  }
  return scoreCfg.priorityPoints[String(task.priority || 1)] ?? 1;
}

// tasks: [{domain, points}] -> { score, domains: {d:{points,count,ratio}} }
export function scoreWeek(tasks, scoreCfg) {
  const domains = {};
  for (const d of DOMAINS) domains[d] = { points: 0, count: 0, ratio: 0 };
  for (const t of tasks) {
    if (!domains[t.domain]) continue;
    domains[t.domain].points += t.points;
    domains[t.domain].count += 1;
  }
  let total = 0;
  for (const d of DOMAINS) {
    const share = scoreCfg.domainShare[d];
    const ratio = domains[d].points / (scoreCfg.weeklyTargetPoints * share);
    domains[d].ratio = Math.round(ratio * 100) / 100;
    total += Math.min(1, ratio) * share;
  }
  return { score: Math.max(1, Math.min(10, Math.round(1 + 9 * total))), domains };
}

// Pentru introducere manuala: ratii 0..1 pe domeniu, fara Todoist.
export function manualWeek(ratios, scoreCfg) {
  const domains = {};
  let total = 0;
  for (const d of DOMAINS) {
    const r = Math.max(0, Number(ratios?.[d] ?? 0));
    domains[d] = { points: 0, count: 0, ratio: Math.round(r * 100) / 100 };
    total += Math.min(1, r) * scoreCfg.domainShare[d];
  }
  return { score: Math.max(1, Math.min(10, Math.round(1 + 9 * total))), domains };
}
