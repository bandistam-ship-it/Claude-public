// Asambleaza pagina dintr-un singur fisier din aceeasi logica testata a serverului.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const strip = (s) => s.split('\n').filter((l) => !/^import .* from /.test(l)).join('\n').replace(/^export (const|function|class|async function) /gm, '$1 ');
const bundle = ['../server/data.js', '../server/variants.js', '../server/week.js', '../server/game.js'].map((f) => strip(read(f))).join('\n');
let html = read('template.html');
html = html.replace('/*GAME*/', () => bundle)
  .replace('/*TERRITORIES*/', () => JSON.stringify(JSON.parse(read('../config/territories.json')).territories))
  .replace('/*CONFIG*/', () => JSON.stringify(JSON.parse(read('../config/config.json'))));
fs.writeFileSync(path.join(here, 'dinastia.html'), html);
console.log('dinastia.html', html.length, 'bytes');
