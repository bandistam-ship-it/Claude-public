async function fetchTasks(mcp) {
  const call = async (tool, input) => (await mcp.callTool(SERVER, tool, input)).payload;
  const proj = (await call('find-projects', { searchText: CFG.todoist.projectName })).projects
    .find((p) => p.name.toLowerCase() === CFG.todoist.projectName.toLowerCase());
  if (!proj) throw { code: 'no_project' };
  const sections = Object.fromEntries(((await call('find-sections', { projectId: proj.id })).sections || []).map((s) => [s.id, s.name]));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const end = new Date(Date.now() + 864e5);
  const out = [];
  // ferestre de 60 de zile, ca intervalul cerut sa ramana scurt
  for (let from = new Date(GAME_START); from < end; from = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 60)) {
   const to = new Date(Math.min(+end, +new Date(from.getFullYear(), from.getMonth(), from.getDate() + 60)));
   let cursor;
   for (let page = 0; page < 20; page++) {
    const r = await call('find-completed-tasks', { projectId: proj.id, since: ymd(from), until: ymd(to), limit: 200, cursor });
    for (const x of r.tasks || []) {
      const labels = (x.labels || []).map((l) => String(l).toLowerCase());
      const task = { id: String(x.id), content: x.content || '', labels, priority: String(5 - Number(String(x.priority || 'p4').slice(1))), completedAt: x.completedAt };
      out.push({ ...task, domain: classify(task, sections[x.sectionId]), points: taskPoints(task, CFG.score), at: new Date(x.completedAt) });
    }
    if (!r.hasMore || !r.nextCursor) break;
    cursor = r.nextCursor;
   }
  }
  return out;
}


// ---- incarcare + erori pe cod ----
function showError(e, retry) {
  const code = e?.code;
  const msg = {
    no_project: 'Nu găsesc proiectul „The Realm” în Todoist.',
    server_not_connected: 'Todoist nu e conectat. Adaugă-l din claude.ai, Settings → Connectors.',
    needs_reauth: 'Conexiunea la Todoist a expirat. Reconecteaz-o din claude.ai, Settings → Connectors.',
    not_in_manifest: 'Accesul la Todoist nu e permis pentru această pagină.',
    approval_required: 'Pagina are nevoie de aprobarea ta ca să citească Todoist.',
    selection_required: 'Ai mai multe conexiuni Todoist. Alege una în claude.ai.',
  }[code] || 'Nu am putut citi Todoist acum. Încearcă din nou în câteva minute.';
  $('status').innerHTML = `<p class="warn">${esc(msg)}</p>${retry ? '<button id="retry">Încearcă din nou</button>' : ''}`;
  $('status').hidden = false;
  $('retry')?.addEventListener('click', load);
}
let loading = false;
async function load() {
  if (loading) return; loading = true;
  try {
    const mcp = await window.claude?.use('mcp');
    if (!mcp) { showError({ code: 'none' }, false); $('status').innerHTML = '<p class="warn">Deschide pagina din claude.ai ca să se poată conecta la Todoist.</p>'; return; }
    const tasks = await fetchTasks(mcp);
    model = compute(tasks, new Date());
    $('status').hidden = true; render();
  } catch (e) { if (!model) showError(e, e?.code !== 'server_not_connected' && e?.code !== 'not_in_manifest'); }
  finally { loading = false; }
}
load();
setInterval(() => { if (!document.hidden && model) load(); }, 5 * 60000);
