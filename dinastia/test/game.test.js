import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newState, closeWeek, checkConquests } from '../server/game.js';
import { scoreWeek, weekKey } from '../server/week.js';
import { classify } from '../server/todoist.js';

const cfg = JSON.parse(fs.readFileSync(new URL('../config/config.json', import.meta.url)));
const terrs = JSON.parse(fs.readFileSync(new URL('../config/territories.json', import.meta.url))).territories;
const doms = (r) => Object.fromEntries(['drept', 'filosofie', 'sport', 'casa'].map((d) => [d, { count: 5, points: 5, ratio: r }]));
const at = (n) => new Date(Date.UTC(2026, 0, 1 + 7 * n));
const wk = (i, score, r = 0.8) => ({ key: `w${i}`, score, domains: doms(r) });
const ctx = { tasks: [] };
const rng = () => 0.1;
// simuleaza bifarea in Todoist a unui task cu [id] in titlu
const tag = (s, id, when) => checkConquests(s, terrs, { tasks: [{ id: 't' + id, content: `Test [${id}]`, labels: [], completedAt: when.toISOString() }] }, when);

test('Obor se cucerește după 3 săptămâni la rând cu scor >= 6', () => {
  const s = newState(at(0));
  closeWeek(s, terrs, wk(1, 7), ctx, cfg, rng, at(1));
  closeWeek(s, terrs, wk(2, 5), ctx, cfg, rng, at(2)); // rupe seria
  closeWeek(s, terrs, wk(3, 6), ctx, cfg, rng, at(3));
  closeWeek(s, terrs, wk(4, 8), ctx, cfg, rng, at(4));
  assert.equal(s.rank, 0);
  closeWeek(s, terrs, wk(5, 9), ctx, cfg, rng, at(5));
  assert.equal(s.rank, 1);
  assert.ok(s.conquered.obor);
});

test('toate cartierele => Baron de București', () => {
  const s = newState(at(0));
  tag(s, 'obor', at(1));
  for (const t of terrs.filter((x) => x.tier === 2)) tag(s, t.id, at(2));
  assert.equal(s.rank, 2);
});

test('scor <= 4 pierde teritoriul domeniului cel mai slab', () => {
  const s = newState(at(0));
  tag(s, 'obor', at(1));
  tag(s, 'colentina', at(2));
  tag(s, 'floreasca', at(3));
  const d = doms(0.8); d.drept.ratio = 0.1;
  const ev = closeWeek(s, terrs, { key: 'x', score: 3, domains: d }, ctx, cfg, rng, at(4));
  assert.ok(s.lost.colentina, 'Colentina (drept) pierdută');
  assert.ok(ev.some((e) => e.kind === 'loss'));
  assert.ok(s.conquered.floreasca);
});

test('baron fără niciun cartier devine țăran liber; moartea cere 2 săptămâni slabe', () => {
  const s = newState(at(0));
  tag(s, 'obor', at(1));
  tag(s, 'colentina', at(2));
  closeWeek(s, terrs, wk(1, 2, 0.1), ctx, cfg, rng, at(3)); // pierde Colentina => coboară
  assert.equal(s.rank, 0);
  assert.equal(s.lowStreak, 1);
  assert.equal(s.dynasty.generation, 1);
  const ev = closeWeek(s, terrs, wk(2, 2, 0.1), ctx, cfg, rng, at(4));
  assert.ok(ev.some((e) => e.kind === 'death'));
  assert.equal(s.dynasty.generation, 2);
  assert.equal(s.ancestors.length, 1);
  assert.equal(s.rank, 0);
});

test('taskCount: Colentina după 20 de task-uri Drept', () => {
  const s = newState(at(0)); tag(s, 'obor', at(1));
  const tasks = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, domain: 'drept', completedAt: at(2).toISOString() }));
  checkConquests(s, terrs, { tasks }, at(3));
  assert.ok(s.conquered.colentina);
});

test('săptămâna nu se poate închide de două ori', () => {
  const s = newState(at(0));
  closeWeek(s, terrs, wk(1, 7), ctx, cfg, rng, at(1));
  assert.throws(() => closeWeek(s, terrs, wk(1, 7), ctx, cfg, rng, at(1)));
});

test('scor din task-uri și clasificare Todoist', () => {
  const full = [{ domain: 'drept', points: 16 }, { domain: 'filosofie', points: 8 }, { domain: 'sport', points: 10 }, { domain: 'casa', points: 6 }];
  assert.equal(scoreWeek(full, cfg.score).score, 10);
  assert.equal(scoreWeek([], cfg.score).score, 1);
  assert.equal(classify({ labels: ['Barou'] }, '📚 Library', cfg.domains), 'drept');
  assert.equal(classify({ labels: [] }, '🏋️ Barracks', cfg.domains), 'sport');
  assert.equal(classify({ labels: ['Upkeep'] }, '🏰 Keep', cfg.domains), 'casa');
  assert.equal(classify({ labels: [] }, '🍺 Tavern', cfg.domains), null);
  assert.match(weekKey(new Date(2026, 10, 22)), /^2026-W47$/);
});

test('variantele de evenimente nu se repetă la rând', () => {
  const s = newState(at(0));
  const seen = [];
  let n = 0;
  const r = () => ((n++ * 0.37) % 1);
  for (let i = 1; i <= 6; i++) {
    const ev = closeWeek(s, terrs, { key: `v${i}`, score: 5, domains: { ...doms(0.9), sport: { count: 0, points: 0, ratio: 0 } } }, ctx, cfg, r, at(i));
    seen.push(ev.find((e) => e.kind === 'bad')?.text);
  }
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.ok(new Set(seen).size > 1);
});

import { adaptiveTarget, dailyChronicle, nextConquest, riskAssessment, domainStreaks, barouCampaign } from '../server/extras.js';

test('ținta adaptivă urmărește istoricul', () => {
  const h = (p) => ({ domains: { drept: { points: p }, filosofie: { points: 0 }, sport: { points: 0 }, casa: { points: 0 } } });
  assert.equal(adaptiveTarget([h(10)], 40), 40);
  assert.equal(adaptiveTarget([h(20), h(24), h(30), h(26)], 40), 26);
  assert.equal(adaptiveTarget([h(1), h(2)], 40), 15);
});

test('cronica zilei, următoarea cucerire, serii și Barou', () => {
  const now = new Date(2026, 10, 27, 12);
  const mk = (daysAgo, domain, content, labels = []) => ({ id: content, domain, content, labels, points: 2, at: new Date(2026, 10, 27 - daysAgo, 9) });
  const tasks = [mk(0, 'sport', 'Antrenament [Floreasca]'), mk(0, 'sport', 'Skate'), mk(2, 'drept', 'Grile civil', ['grile', 'civil'])];
  const ch = dailyChronicle(tasks, 0, now);
  assert.equal(ch.length, 2);
  assert.match(ch[0].text, /Antrenament/);
  assert.doesNotMatch(ch[0].text, /\[/);
  assert.match(ch[0].text, /încă 1/);
  const terr = [{ id: 'a', name: 'A', status: 'available', type: 'taskCount', progress: 5, goal: 20 }, { id: 'b', name: 'B', status: 'available', type: 'taskCount', progress: 15, goal: 20 }];
  assert.match(nextConquest(terr).text, /încă 5 task-uri până la B/);
  assert.equal(domainStreaks([{ domains: { drept: { ratio: 0.9 }, filosofie: { ratio: 0.1 } } }, { domains: { drept: { ratio: 0.8 }, filosofie: { ratio: 0.9 } } }]).drept, 2);
  const b = barouCampaign(tasks, cfg, now);
  assert.equal(b.subjects.grile, 1);
  assert.ok(b.days > 250);
  const s = newState(at(0));
  tag(s, 'obor', at(1)); tag(s, 'colentina', at(2));
  const r = riskAssessment(s, terrs, { score: 3, domains: doms(0.1) }, cfg, new Date(2026, 10, 26), new Date(2026, 10, 29));
  assert.equal(r.atRisk, true);
  assert.equal(r.victim.id, 'colentina');
});

test('recucerirea își amintește rivalul', () => {
  const s = newState(at(0));
  tag(s, 'obor', at(1)); tag(s, 'colentina', at(2));
  closeWeek(s, terrs, wk(1, 2, 0.1), ctx, cfg, rng, at(3));
  const rival = s.lost.colentina.rival;
  const ctx20 = { tasks: [{ id: 'o', domain: null, content: '[Obor]', labels: [], completedAt: at(4).toISOString() }, ...Array.from({ length: 20 }, (_, i) => ({ id: `d${i}`, domain: 'drept', content: '', labels: [], completedAt: at(5).toISOString() }))] };
  const ev = checkConquests(s, terrs, ctx20, at(5));
  assert.ok(ev.some((e) => e.kind === 'conquest' && e.text.includes(rival)));
});
