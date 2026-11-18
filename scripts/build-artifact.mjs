// Inline the Vite build into one self-contained page for publishing as a claude.ai Artifact
// (the Artifact sandbox only loads scripts from a few CDNs, so the app's own JS/CSS must be inline).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const js = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/);
const css = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/);
if (!js || !css) throw new Error('Unexpected dist/index.html layout');
const code = readFileSync(join(dist, js[1]), 'utf8').replace(/<\/script/gi, '<\\/script');
const style = readFileSync(join(dist, css[1]), 'utf8');

// The Artifact wraps the page in its own doctype/head/body, so emit content only.
const page = `<title>Realm Companion</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Turns completed Todoist tasks into an RPG character.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;600&display=swap">
<style>${style}</style>
<div id="root"></div>
<script type="module">${code}</script>
`;
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/realm-companion.html', page);
console.log(`dist-artifact/realm-companion.html  ${(page.length / 1024).toFixed(0)} kB`);
