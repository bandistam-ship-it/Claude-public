// Asambleaza pagina dintr-un singur fisier din aceeasi logica testata a serverului.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const strip = (s) => s.split('\n').filter((l) => !/^import .* from /.test(l)).join('\n').replace(/^export (const|function|class|async function) /gm, '$1 ');
const bundle = ['../server/data.js', '../server/variants.js', '../server/week.js', '../server/game.js'].map((f) => strip(read(f))).join('\n');
const target = process.argv[2] || 'artifact';
let html = read('template.html');
html = html.replace('/*LOADER*/', () => read(target === 'mobile' ? 'loader.rest.js' : 'loader.mcp.js'))
  .replace('/*GAME*/', () => bundle)
  .replace('/*TERRITORIES*/', () => JSON.stringify(JSON.parse(read('../config/territories.json')).territories))
  .replace('/*CONFIG*/', () => JSON.stringify(JSON.parse(read('../config/config.json'))));
if (target === 'mobile') {
  // aplicatia Android: pagina intr-un fisier, fara <title>/<meta> speciale pentru Artifact
  const cut = html.indexOf('<header>');
  const head = html.slice(0, cut).replace('<meta name="claude:viewport-fit-sides" content="cover">', '');
  html = `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#1b1610">${head}</head><body>${html.slice(cut)}</body></html>`;
}
const out = target === 'mobile' ? path.join(here, '../mobile/www/index.html') : path.join(here, 'dinastia.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(out, html.length, 'bytes');
