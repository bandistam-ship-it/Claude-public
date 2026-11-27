import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { RANKS, DOMAINS, DOMAIN_NAMES, STEP_FACTORS } from './data.js';
import { newState, evaluate, isAvailable, checkConquests, closeWeek } from './game.js';
import { Todoist } from './todoist.js';
import { weekKey, weekRange, scoreWeek } from './week.js';

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
  if (!todoist.enabled) return { tasks: [], source: 'fara-token' };
  try {
    const since = new Date(Math.min(...Object.values(state.territoryStart).map((d) => +new Date(d)), +new Date(state.createdAt), Date.now() - 80 * 864e5));
    const tasks = await todoist.completed(new Date(Math.max(+since, Date.now() - 85 * 864e5)), new Date());
    return { tasks, source: 'todoist' };
  } catch (e) {
    return { tasks: [], source: 'eroare', error: e.message };
  }
}

async function currentWeek(ctx, date = new Date()) {
  const { start, end } = weekRange(date);
  if (ctx.source !== 'todoist') return { key: weekKey(date), source: ctx.source, error: ctx.error, ...scoreWeek([], cfg.score), start, end, unavailable: true };
  const tasks = ctx.tasks.filter((t) => new Date(t.completedAt) >= start && new Date(t.completedAt) < end);
  return { key: weekKey(date), source: 'todoist', ...scoreWeek(tasks, cfg.score), start, end };
}


// ---- inchidere automata: duminica dupa ora configurata (+ recuperare pentru saptamana trecuta) ----
const rng = Math.random;
export async function autoClose(now = new Date()) {
  if (!cfg.autoClose.enabled || !todoist.enabled) return [];
  const state = loadState(); const terrs = loadTerritories();
  const ctx = await context(state);
  if (ctx.source !== 'todoist') return [];
  const closed = (k) => state.history.some((w) => w.key === k);
  const prev = new Date(now); prev.setDate(prev.getDate() - 7);
  const dates = [];
  if (!closed(weekKey(prev)) && new Date(state.createdAt) < weekRange(prev).start) dates.push(prev);
  if (now.getDay() === 0 && now.getHours() >= cfg.autoClose.hour && !closed(weekKey(now))) dates.push(now);
  const done = [];
  for (const d of dates) {
    const week = await currentWeek(ctx, d);
    closeWeek(state, terrs, week, ctx, cfg, rng, now);
    done.push(week.key);
  }
  if (done.length) { state.lastAutoClose = { at: now.toISOString(), weeks: done }; saveState(state); }
  return done;
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
    newEvents: events,
    autoClose: { enabled: cfg.autoClose.enabled && todoist.enabled, hour: cfg.autoClose.hour }
  };
}

const body = (req) => new Promise((res, rej) => {
  let b = '';
  req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { rej(e); } });
});
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

// ---- parola (obligatorie cand serverul e expus in retea) ----
const PASSWORD = process.env.APP_PASSWORD || '';
const sessionToken = () => crypto.createHmac('sha256', PASSWORD).update('dinastia-session').digest('hex');
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookieOf = (req, name) => (req.headers.cookie || '').split(/;\s*/).map((c) => c.split('=')).find(([k]) => k === name)?.[1] || '';
const authed = (req) => !PASSWORD || safeEq(cookieOf(req, 'dsess'), sessionToken());
const PUBLIC = new Set(['/login.html', '/manifest.webmanifest', '/sw.js', '/icon.svg', '/icon-192.png', '/icon-512.png']);

async function login(req, res) {
  const b = await body(req);
  await new Promise((r) => setTimeout(r, 800)); // incetineste ghicitul
  if (!safeEq(String(b.password || ''), PASSWORD)) return send(res, 401, { error: 'Parolă greșită' });
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `dsess=${sessionToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${secure}` });
  res.end('{"ok":true}');
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

async function api(req, res, url) {
  const m = req.method; // doar citire: nicio actiune de scriere
  if (m === 'GET' && url.pathname === '/api/state') return send(res, 200, await snapshot());

  return send(res, 404, { error: 'Not found' });
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && url.pathname === '/login' && PASSWORD) return await login(req, res);
    if (!authed(req) && !PUBLIC.has(url.pathname)) {
      if (url.pathname.startsWith('/api/')) return send(res, 401, { error: 'Neautentificat' });
      res.writeHead(302, { Location: '/login.html' }); return res.end();
    }
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
  const host = process.env.HOST || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !PASSWORD) { console.error('Refuz să pornesc în rețea fără APP_PASSWORD.'); process.exit(1); }
  autoClose().catch((e) => console.error('autoClose:', e.message));
  setInterval(() => autoClose().catch((e) => console.error('autoClose:', e.message)), cfg.autoClose.checkMinutes * 60000).unref?.();
  server.listen(port, host, () =>
    console.log(`Dinastia ta rulează pe http://localhost:${port} (Todoist: ${todoist.enabled ? 'activ' : 'FĂRĂ TOKEN: setează TODOIST_TOKEN'})`));
}
