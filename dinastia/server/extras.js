// Calcule derivate pentru afisare: cronica zilei, urmatoarea cucerire, avertisment, serii, campania Barou, tinta adaptiva.
import { DOMAINS, DOMAIN_NAMES, DAILY, RANKS } from './data.js';
import { pickVictim } from './game.js';

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const clip = (s, n = 70) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// Tinta saptamanala se calibreaza pe istoricul tau: percentila 75 a ultimelor 6 saptamani.
export function adaptiveTarget(history, base) {
  const totals = history.slice(-6).map((w) => DOMAINS.reduce((a, d) => a + (w.domains?.[d]?.points || 0), 0)).filter((x) => x > 0);
  if (totals.length < 2) return base;
  const sorted = [...totals].sort((a, b) => a - b);
  const p75 = sorted[Math.max(0, Math.ceil(sorted.length * 0.75) - 1)];
  return Math.max(15, Math.min(80, Math.round(p75)));
}

// O propozitie pe zi activa, in vocea rangului curent.
export function dailyChronicle(tasks, rank, now, days = 7) {
  const group = RANKS[Math.min(rank, RANKS.length - 1)].group;
  const byDay = new Map();
  for (const t of tasks) {
    if (!t.domain) continue;
    const k = dayKey(t.at);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(t);
  }
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const list = byDay.get(dayKey(d));
    if (!list) continue;
    const pts = {};
    for (const t of list) pts[t.domain] = (pts[t.domain] || 0) + t.points;
    const dom = Object.keys(pts).sort((a, b) => pts[b] - pts[a])[0];
    const top = list.filter((t) => t.domain === dom).sort((a, b) => b.points - a.points)[0];
    const more = list.length - 1;
    out.push({ day: d, count: list.length, domain: dom,
      text: DAILY[group][dom].replace('{t}', clip(top.content.replace(/\[[^\]]*\]/g, '').trim() || 'o treabă')) + (more > 0 ? ` (și încă ${more})` : '') });
  }
  return out;
}

// Cel mai apropiat teritoriu de cucerit.
export function nextConquest(territories) {
  const open = territories.filter((t) => t.status === 'available' || t.status === 'lost');
  const auto = open.filter((t) => t.type !== 'tag' && t.goal > 1).sort((a, b) => b.progress / b.goal - a.progress / a.goal);
  const t = auto[0] || open[0];
  if (!t) return null;
  const unit = { streak: 'săptămâni', taskCount: 'task-uri', weeklyDomain: 'săptămâni' }[t.type];
  const text = unit ? `încă ${t.goal - t.progress} ${unit} până la ${t.name}` : `bifează un task cu [${t.name}] ca să cucerești ${t.name}`;
  return { territory: t, text };
}

// Cat de aproape esti de o pierdere in saptamana curenta.
export function riskAssessment(state, terrs, current, cfg, now, closesAt) {
  const daysLeft = (closesAt - now) / 864e5;
  const low = current.score <= cfg.loss.scoreAtOrBelow;
  const victim = pickVictim(state, terrs, current.domains, cfg);
  return { atRisk: Boolean(victim) && low && daysLeft <= 3, victim, daysLeft, score: current.score };
}

export function domainStreaks(history, min = 0.7) {
  const out = {};
  for (const d of DOMAINS) {
    let n = 0;
    for (let i = history.length - 1; i >= 0 && (history[i].domains?.[d]?.ratio ?? 0) >= min; i--) n++;
    out[d] = n;
  }
  return out;
}

// Campania Barou: numaratoare inversa (data exacta e necunoscuta) si munca pe materii.
export function barouCampaign(tasks, cfg, now) {
  const exam = new Date(cfg.barou.examApprox);
  const days = Math.ceil((exam - now) / 864e5);
  const subjects = {};
  for (const t of tasks) for (const l of t.labels || []) if (cfg.barou.labels.includes(l)) subjects[l] = (subjects[l] || 0) + 1;
  const week = tasks.filter((t) => now - t.at < 7 * 864e5 && (t.labels || []).some((l) => cfg.barou.labels.includes(l))).length;
  const total = Object.values(subjects).reduce((a, b) => a + b, 0);
  return { days, weeks: Math.floor(days / 7), subjects, total, lastWeek: week };
}
