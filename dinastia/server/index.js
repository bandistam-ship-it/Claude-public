import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RANKS, DOMAINS, DOMAIN_NAMES, STEP_FACTORS } from './data.js';
import { newState, evaluate, isAvailable, checkConquests, manualConquer, closeWeek } from './game.js';
import { Todoist } from './todoist.js';
import { weekKey, weekRange, scoreWeek, manualWeek } from './week.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const cfg = readJson('config/config.json');
const STATE_FILE = process.env.STATE_FILE || path.join(ROOT, 'data/state.json');
const todoist = new Todoist(cfg);

const loadTerritories = () => readJson('config/territories.json').territories;
const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : newState());
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(s, null, 2));
  fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
}

async function context(state) {
  if (!todoist.enabled) return { tasks: [], source: 'manual' };
  try {
    const since = new Date(Math.min(...Object.values(state.territoryStart).map((d) => +new Date(d)), +new Date(state.createdAt), Date.now() - 80 * 864e5));
    const tasks = await todoist.completed(new Date(Math.max(+since, Date.now() - 85 * 864e5)), new Date());
    return { tasks, source: 'todoist' };
  } catch (e) {
    return { tasks: [], source: 'eroare', error: e.message };
  }
}

async function currentWeek(ctx) {
  const { start, end } = weekRange();
  if (ctx.source !== 'todoist') return { key: weekKey(), source: ctx.source, error: ctx.error, ...manualWeek({}, cfg.score), start, end, manualNeeded: true };
  const tasks = ctx.tasks.filter((t) => new Date(t.completedAt) >= start && new Date(t.completedAt) < end);
  return { key: weekKey(), source: 'todoist', ...scoreWeek(tasks, cfg.score), start, end };
}

async function snapshot() {
  const state = loadState();
  const terrs = loadTerritories();
  const ctx = await context(state);
  const events = checkConquests(state, terrs, ctx);
  if (events.length) saveState(state);
  const week = await currentWeek(ctx);
  const territories = terrs.map((t) => ({
    ...t,
    status: state.conquered[t.id] ? 'conquered' : state.lost[t.id] ? 'lost' : isAvailable(t, state) ? 'available' : 'locked',
    rival: state.lost[t.id]?.rival || null,
    ...evaluate(t, state, ctx)
  }));
  const rank = RANKS[state.rank];
  return {
    state, territories, week, source: ctx.source, todoistError: ctx.error || null,
    rank: { ...rank, index: state.rank, factorNext: STEP_FACTORS[state.rank] ?? null },
    ranks: RANKS.map((r, i) => ({ name: r.name, index: i })),
    domains: DOMAINS.map((d) => ({ id: d, name: DOMAIN_NAMES[d], recognition: state.recognition[d] })),
    newEvents: events
  };
}

const body = (req) => new Promise((res, rej) => {
  let b = '';
  req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { rej(e); } });
});
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

async function api(req, res, url) {
  const m = req.method;
  if (m === 'GET' && url.pathname === '/api/state') return send(res, 200, await snapshot());

  let mt;
  if (m === 'POST' && (mt = url.pathname.match(/^\/api\/territory\/([\w-]+)\/(conquer|progress|link)$/))) {
    const [, id, action] = mt; const b = await body(req);
    const state = loadState(); const terrs = loadTerritories();
    if (!terrs.some((t) => t.id === id)) return send(res, 404, { error: 'Teritoriu necunoscut' });
    if (action === 'conquer') manualConquer(state, terrs, id);
    if (action === 'progress') state.manualCount[id] = Math.max(0, (state.manualCount[id] || 0) + (Number(b.delta) || 1));
    if (action === 'link') state.links[id] = String(b.taskId || '').trim() || undefined;
    saveState(state);
    return send(res, 200, await snapshot());
  }

  if (m === 'POST' && url.pathname === '/api/week/close') {
    const b = await body(req);
    const state = loadState(); const terrs = loadTerritories();
    const ctx = await context(state);
    let week = await currentWeek(ctx);
    if (week.manualNeeded || b.ratios) week = { ...week, ...manualWeek(b.ratios, cfg.score) };
    if (Number.isFinite(Number(b.score)) && b.score !== '' && b.score != null) week.score = Math.max(1, Math.min(10, Math.round(Number(b.score))));
    closeWeek(state, terrs, week, ctx, cfg);
    saveState(state);
    return send(res, 200, await snapshot());
  }

  if (m === 'POST' && url.pathname === '/api/reset') { saveState(newState()); return send(res, 200, await snapshot()); }
  return send(res, 404, { error: 'Not found' });
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const file = path.join(ROOT, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || cfg.port;
  server.listen(port, process.env.HOST || '127.0.0.1', () =>
    console.log(`Dinastia ta rulează pe http://localhost:${port} (Todoist: ${todoist.enabled ? 'activ' : 'fără token, mod manual'})`));
}
