import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dinastia-'));
process.env.STATE_FILE = path.join(tmp, 'state.json');
process.env.TODOIST_TOKEN = 'fake';
process.env.APP_PASSWORD = 'sesam';
const NOW = new Date(2026, 10, 22, 21, 30); // duminica 22 nov 2026, 21:30
const done = (id, section, labels, daysAgo = 1) => ({ task_id: id, content: id, project_id: 'P', section_id: section, labels, priority: 1, completed_at: new Date(NOW - daysAgo * 864e5).toISOString() });
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const u = new URL(url); const j = (o) => ({ ok: true, json: async () => o });
  if (u.pathname.endsWith('/projects')) return j({ results: [{ id: 'P', name: 'The Realm' }] });
  if (u.pathname.endsWith('/sections')) return j({ results: [{ id: 'L', name: '📚 Library' }, { id: 'B', name: '🏋️ Barracks' }] });
  const items = [];
  for (let i = 0; i < 8; i++) items.push(done(`d${i}`, 'L', ['Barou', 'Hard']));
  for (let i = 0; i < 4; i++) items.push(done(`s${i}`, 'B', ['Medium']));
  return j({ results: items });
};
const { server, autoClose } = await import('../server/index.js');

test('închide singură duminică seara și nu de două ori', async () => {
  const w1 = await autoClose(NOW);
  assert.equal(w1.length > 0, true);
  assert.deepEqual(await autoClose(NOW), []);
  const st = JSON.parse(fs.readFileSync(process.env.STATE_FILE));
  assert.equal(st.history[0].domains.drept.count, 8);
  assert.ok(st.history[0].score >= 1);
});

test('nu închide în mijlocul săptămânii', async () => {
  const fresh = path.join(tmp, 'fresh.json');
  fs.rmSync(process.env.STATE_FILE);
  const wed = new Date(2026, 10, 25, 21, 30);
  assert.deepEqual(await autoClose(wed), []);
  void fresh;
});

test('parola protejează API-ul', async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await realFetch(base + '/api/state')).status, 401);
  assert.equal((await realFetch(base + '/login', { method: 'POST', body: '{"password":"x"}' })).status, 401);
  const ok = await realFetch(base + '/login', { method: 'POST', body: '{"password":"sesam"}' });
  const cookie = ok.headers.get('set-cookie').split(';')[0];
  assert.equal((await realFetch(base + '/api/state', { headers: { cookie } })).status, 200);
  server.close();
});
