// Varianta pentru aplicatia Android: citeste Todoist direct (API v1), cu tokenul salvat pe telefon.
const API = 'https://api.todoist.com/api/v1';
const TOKEN_KEY = 'dinastia-token';
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (v) => { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch {} };

async function api(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  let res;
  try { res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${getToken()}` } }); }
  catch { throw { code: 'network' }; }
  if (res.status === 401 || res.status === 403) throw { code: 'bad_token' };
  if (!res.ok) throw { code: 'http', status: res.status };
  return res.json();
}
async function paged(path, params) {
  const out = []; let cursor;
  for (let i = 0; i < 30; i++) {
    const r = await api(path, { ...params, limit: 200, cursor });
    out.push(...(r.results || r.items || []));
    cursor = r.next_cursor;
    if (!cursor) break;
  }
  return out;
}
const prio = (p) => (typeof p === 'string' ? String(5 - Number(p.slice(1))) : String(p || 1)); // API: 4 = p1 (cel mai urgent)

async function fetchTasks() {
  const proj = (await paged('/projects')).find((p) => p.name.toLowerCase() === CFG.todoist.projectName.toLowerCase());
  if (!proj) throw { code: 'no_project' };
  const sections = Object.fromEntries((await paged('/sections', { project_id: proj.id })).map((s) => [s.id, s.name]));
  const end = new Date(Date.now() + 864e5), out = [];
  // ferestre de 60 de zile (API-ul limiteaza intervalul)
  for (let from = new Date(GAME_START); from < end; from = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 60)) {
    const to = new Date(Math.min(+end, +new Date(from.getFullYear(), from.getMonth(), from.getDate() + 60)));
    const items = await paged('/tasks/completed/by_completion_date', { since: from.toISOString(), until: to.toISOString() });
    for (const x of items) {
      if (String(x.project_id) !== String(proj.id)) continue;
      const labels = (x.labels || []).map((l) => String(l).toLowerCase());
      const task = { id: String(x.task_id || x.id), content: x.content || '', labels, priority: prio(x.priority) };
      const at = x.completed_at || x.completedAt;
      out.push({ ...task, domain: classify(task, sections[x.section_id]), points: taskPoints(task, CFG.score), completedAt: at, at: new Date(at) });
    }
  }
  return out;
}

function showSetup(msg) {
  $('app').hidden = true;
  $('status').hidden = false;
  $('status').innerHTML = `<div class="card" style="max-width:420px;margin:0 auto;text-align:left">
    <h2>Conectează Todoist</h2>
    <p class="sub">O singură dată. În Todoist (pe web): Setări → Integrări → Dezvoltator → „API token”. Tokenul rămâne doar pe acest telefon și aplicația îl folosește doar ca să citească.</p>
    ${msg ? `<p class="warn">${esc(msg)}</p>` : ''}
    <input id="tok" type="password" autocomplete="off" placeholder="Lipește tokenul aici" style="width:100%;padding:10px;margin:8px 0;border-radius:6px;border:1px solid var(--line);background:var(--bar);color:var(--ink);font:inherit">
    <button id="save">Salvează și deschide</button></div>`;
  $('save').addEventListener('click', () => { const v = $('tok').value.trim(); if (v) { setToken(v); load(); } });
}
function showError(e) {
  const msg = { no_project: 'Nu găsesc proiectul „The Realm” în Todoist.', network: 'Nu am internet sau Todoist nu răspunde.', http: `Todoist a răspuns cu eroarea ${e?.status}.` }[e?.code] || 'Nu am putut citi Todoist acum.';
  $('status').hidden = false;
  $('status').innerHTML = `<p class="warn">${esc(msg)}</p><button id="retry">Încearcă din nou</button> <button id="reset" style="background:transparent;color:var(--ink);border:1px solid var(--line)">Schimbă tokenul</button>`;
  $('retry').addEventListener('click', load);
  $('reset').addEventListener('click', () => { setToken(''); showSetup(''); });
}
let loading = false;
async function load() {
  if (loading) return;
  if (!getToken()) return showSetup('');
  loading = true;
  try {
    model = compute(await fetchTasks(), new Date());
    $('status').hidden = true; render();
  } catch (e) {
    if (e?.code === 'bad_token') { setToken(''); showSetup('Tokenul nu a fost acceptat. Verifică-l și lipește-l din nou.'); }
    else if (!model) showError(e);
  } finally { loading = false; }
}
load();
setInterval(() => { if (!document.hidden && model) load(); }, 5 * 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && model) load(); });
