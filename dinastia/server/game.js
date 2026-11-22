// Logica jocului. Functii care muteaza un obiect `state` si intorc evenimentele noi.
import { FAIL_VARIANTS, WIN_VARIANTS } from './variants.js';
import { DOMAINS, DOMAIN_NAMES, RANKS, SOURCES, WINS, HABIT, RIVALS, HEIR_NAMES, CONQUEST_FLAVOR } from './data.js';

export const START_RECOGNITION = 50;

export function newState(now = new Date()) {
  return {
    version: 1,
    createdAt: now.toISOString(),
    dynasty: { generation: 1, name: 'Dinu', trait: null, bornAt: now.toISOString() },
    rank: 0,
    conquered: {},        // id -> { at }
    lost: {},             // id -> { rival, at }
    territoryStart: {},   // id -> ISO, de cand conteaza progresul
    recognition: Object.fromEntries(DOMAINS.map((d) => [d, START_RECOGNITION])),
    history: [],          // saptamani inchise
    lowStreak: 0,
    journal: [],
    ancestors: [],
    lastEvents: {}        // anti-repetitie
  };
}

const groupOf = (rank) => RANKS[Math.min(rank, RANKS.length - 1)].group;
const byId = (terrs) => Object.fromEntries(terrs.map((t) => [t.id, t]));
const log = (state, now, kind, text, extra = {}) => {
  const ev = { at: now.toISOString(), kind, text, rank: RANKS[state.rank].name, generation: state.dynasty.generation, ...extra };
  state.journal.push(ev);
  return ev;
};

// Un task bifat conteaza pentru teritoriu daca are [Nume], #id in titlu sau eticheta cu id-ul.
export function hasTag(task, t) {
  const c = (task.content || '').toLowerCase();
  return c.includes(`[${t.name.toLowerCase()}]`) || c.includes(`[${t.id}]`) || c.includes(`#${t.id}`) || (task.labels || []).includes(t.id);
}

export const isAvailable = (t, state) => t.tier <= state.rank + 1 && !t.sketchLocked;
export const startOf = (state, t) => state.territoryStart[t.id] || state.createdAt;

// Progres catre tinta unui teritoriu. ctx.tasks = task-uri bifate (cu completedAt, domain, id)
export function evaluate(t, state, ctx = { tasks: [] }) {
  const since = new Date(startOf(state, t));
  const tagDone = ctx.tasks.some((x) => hasTag(x, t) && new Date(x.completedAt) >= since);
  let progress = 0, goal = 1;
  switch (t.type) {
    case 'streak': {
      goal = t.weeks;
      const h = state.history.filter((w) => new Date(w.closedAt) >= since);
      for (let i = h.length - 1; i >= 0 && h[i].score >= t.minScore; i--) progress++;
      break;
    }
    case 'taskCount': {
      goal = t.count;
      progress = ctx.tasks.filter((x) => x.domain === t.domain && new Date(x.completedAt) >= since).length;
      break;
    }
    case 'weeklyDomain': {
      goal = t.weeks;
      progress = state.history.filter((w) => new Date(w.closedAt) >= since && (w.domains?.[t.domain]?.count ?? 0) >= t.minTasks).length;
      break;
    }
    default:
      progress = 0; goal = 1;
  }
  const done = tagDone || (t.type !== 'tag' && progress >= goal);
  return { progress: done ? goal : Math.min(progress, goal), goal, done };
}

function conquer(state, t, now, events) {
  delete state.lost[t.id];
  state.conquered[t.id] = { at: now.toISOString() };
  const flavor = CONQUEST_FLAVOR[t.tier] || '';
  events.push(log(state, now, 'conquest', `${t.name} e al tău. ${flavor}`.trim(), { territory: t.id }));
}

function promote(state, terrs, now, events) {
  while (state.rank < RANKS.length - 1) {
    const n = state.rank + 1;
    const tier = terrs.filter((t) => t.tier === n && !t.sketch);
    const sketch = terrs.filter((t) => t.tier === n);
    if (!tier.length && sketch.length) break;       // doar schita: nu promovam pana nu e scrisa
    if (!tier.length || !tier.every((t) => state.conquered[t.id])) break;
    state.rank = n;
    events.push(log(state, now, 'rank', `Ai devenit ${RANKS[n].name}.`));
  }
}

// Verifica teritoriile disponibile; cucereste ce are tinta atinsa si promoveaza.
export function checkConquests(state, terrs, ctx, now = new Date()) {
  const events = [];
  const sorted = [...terrs].sort((a, b) => a.tier - b.tier);
  for (const t of sorted) {
    if (state.conquered[t.id] || !isAvailable(t, state)) continue;
    if (t.sketch && !t.target) continue;
    if (evaluate(t, state, ctx).done) { conquer(state, t, now, events); promote(state, terrs, now, events); }
  }
  return events;
}

const holdTiers = (rank) => (rank <= 1 ? [2] : [rank]);

function demoteIfEmpty(state, terrs, now, events) {
  while (state.rank >= 1) {
    const held = terrs.filter((t) => holdTiers(state.rank).includes(t.tier) && state.conquered[t.id]);
    if (held.length) return;
    if (state.rank === 1 && state.conquered.obor) {
      delete state.conquered.obor;
      state.territoryStart.obor = now.toISOString();
    }
    state.rank -= 1;
    events.push(log(state, now, 'rank', `Ai coborât la rangul ${RANKS[state.rank].name}.`));
    if (state.rank === 0) return;
  }
}

function pick(arr, rng) { return arr[Math.floor(rng() * arr.length) % arr.length]; }

function weakestDomain(domains, gap) {
  const r = DOMAINS.map((d) => [d, domains[d]?.ratio ?? 0]).sort((a, b) => a[1] - b[1]);
  return r[1][1] - r[0][1] >= gap ? r[0][0] : null; // null = nu e clar mai slab
}

function loseTerritory(state, terrs, domains, cfg, rng, now, events) {
  const conqueredList = terrs.filter((t) => state.conquered[t.id])
    .sort((a, b) => new Date(state.conquered[b.id].at) - new Date(state.conquered[a.id].at));
  if (!conqueredList.length) return false;
  const dom = weakestDomain(domains, cfg.loss.clearGap);
  const victim = (dom && conqueredList.find((t) => t.domain === dom)) || conqueredList[0];
  const rival = pick(RIVALS, rng);
  delete state.conquered[victim.id];
  state.territoryStart[victim.id] = now.toISOString();
  state.lost[victim.id] = { rival, at: now.toISOString() };
  const habit = HABIT[victim.domain] || 'săptămâna în mână';
  events.push(log(state, now, 'loss',
    `${rival} a pus stăpânire pe ${victim.name}. Boierii spun că nu l-ai fi lăsat dacă în luna trecută ți-ai fi ținut ${habit}.`,
    { territory: victim.id }));
  demoteIfEmpty(state, terrs, now, events);
  return true;
}

function domainEvent(state, kind, domain, rng, now, events) {
  const base = kind === 'fail' ? SOURCES : WINS;
  const vars = kind === 'fail' ? FAIL_VARIANTS : WIN_VARIANTS;
  const group = groupOf(state.rank);
  const options = [base[group][domain], ...(vars[group]?.[domain] || [])];
  const key = `${kind}:${group}:${domain}`;
  const last = state.lastEvents[key];
  const pool = options.map((_, i) => i).filter((i) => i !== last || options.length === 1);
  const idx = pool[Math.floor(rng() * pool.length) % pool.length];
  state.lastEvents[key] = idx;
  events.push(log(state, now, kind === 'fail' ? 'bad' : 'good', `${DOMAIN_NAMES[domain]}: ${options[idx]}`, { domain }));
}

function die(state, now, events) {
  const strongest = DOMAINS.map((d) => [d, state.recognition[d]]).sort((a, b) => b[1] - a[1])[0][0];
  const old = state.dynasty;
  state.ancestors.push({ generation: old.generation, name: old.name, diedAt: now.toISOString(), bestDomain: strongest });
  events.push(log(state, now, 'death', `${old.name} (generația ${old.generation}) s-a stins, iar numele lui rămâne în jurnalul dinastiei.`));
  const heirName = HEIR_NAMES[(old.generation) % HEIR_NAMES.length];
  state.dynasty = { generation: old.generation + 1, name: heirName, trait: { domain: strongest, bonus: 15 }, bornAt: now.toISOString() };
  state.rank = 0; state.conquered = {}; state.lost = {};
  state.territoryStart = {}; state.createdAt = now.toISOString(); state.lowStreak = 0;
  state.recognition = Object.fromEntries(DOMAINS.map((d) => [d, START_RECOGNITION + (d === strongest ? 15 : 0)]));
  events.push(log(state, now, 'heir', `${heirName} preia numele. Moștenește recunoaștere în ${DOMAIN_NAMES[strongest]} (+15).`));
}

// Inchide o saptamana. week = { key, score, domains:{d:{count,points,ratio}} }
export function closeWeek(state, terrs, week, ctx, cfg, rng = Math.random, now = new Date()) {
  const events = [];
  state.lastEvents ||= {};
  if (state.history.some((w) => w.key === week.key)) throw new Error(`Săptămâna ${week.key} e deja închisă`);
  state.history.push({ key: week.key, score: week.score, domains: week.domains, closedAt: now.toISOString() });

  // recunoastere
  for (const d of DOMAINS) {
    const r = week.domains[d]?.ratio ?? 0;
    const delta = Math.round((Math.min(r, 1.2) - 0.5) * 16);
    state.recognition[d] = Math.max(0, Math.min(100, state.recognition[d] + delta));
  }
  state.lowStreak = week.score <= cfg.loss.scoreAtOrBelow ? state.lowStreak + 1 : 0;

  events.push(...checkConquests(state, terrs, ctx, now));

  const bad = week.score <= cfg.loss.scoreAtOrBelow;
  if (bad) loseTerritory(state, terrs, week.domains, cfg, rng, now, events);

  // evenimente de domeniu: cel mai slab si cel mai bun
  const ranked = DOMAINS.map((d) => [d, week.domains[d]?.ratio ?? 0]).sort((a, b) => a[1] - b[1]);
  const worst = ranked[0], best = ranked[ranked.length - 1];
  if (worst[1] < 0.5) domainEvent(state, 'fail', worst[0], rng, now, events);
  if (best[1] >= 0.7 && best[0] !== worst[0]) domainEvent(state, 'win', best[0], rng, now, events);

  // moartea
  if (state.rank === 0 && !Object.keys(state.conquered).length && state.lowStreak >= cfg.death.weeksAtOrBelow) die(state, now, events);
  return events;
}
