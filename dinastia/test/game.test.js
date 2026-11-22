import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newState, closeWeek, checkConquests, manualConquer } from '../server/game.js';
import { scoreWeek, weekKey } from '../server/week.js';
import { classify } from '../server/todoist.js';

const cfg = JSON.parse(fs.readFileSync(new URL('../config/config.json', import.meta.url)));
const terrs = JSON.parse(fs.readFileSync(new URL('../config/territories.json', import.meta.url))).territories;
const doms = (r) => Object.fromEntries(['drept', 'filosofie', 'sport', 'casa'].map((d) => [d, { count: 5, points: 5, ratio: r }]));
const at = (n) => new Date(Date.UTC(2026, 0, 1 + 7 * n));
const wk = (i, score, r = 0.8) => ({ key: `w${i}`, score, domains: doms(r) });
const ctx = { tasks: [] };
const rng = () => 0.1;

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
  manualConquer(s, terrs, 'obor', at(1));
  for (const t of terrs.filter((x) => x.tier === 2)) manualConquer(s, terrs, t.id, at(2));
  assert.equal(s.rank, 2);
});

test('scor <= 4 pierde teritoriul domeniului cel mai slab', () => {
  const s = newState(at(0));
  manualConquer(s, terrs, 'obor', at(1));
  manualConquer(s, terrs, 'colentina', at(2));
  manualConquer(s, terrs, 'floreasca', at(3));
  const d = doms(0.8); d.drept.ratio = 0.1;
  const ev = closeWeek(s, terrs, { key: 'x', score: 3, domains: d }, ctx, cfg, rng, at(4));
  assert.ok(s.lost.colentina, 'Colentina (drept) pierdută');
  assert.ok(ev.some((e) => e.kind === 'loss'));
  assert.ok(s.conquered.floreasca);
});

test('baron fără niciun cartier devine țăran liber; moartea cere 2 săptămâni slabe', () => {
  const s = newState(at(0));
  manualConquer(s, terrs, 'obor', at(1));
  manualConquer(s, terrs, 'colentina', at(2));
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
  const s = newState(at(0)); manualConquer(s, terrs, 'obor', at(1));
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
