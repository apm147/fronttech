// Extracts the six sectors' data out of the HTML prototype
// (docs/reference/uk-frontier-tech-landscape-prototype.html) without touching
// the DOM-driving code at the bottom of that file's inline <script>.
//
// The prototype's inline script is pure data (R() calls building DATA_*
// arrays, SECTOR_META, SECTOR_FRAMING, SECTOR_FOOTER) up to the
// "STATE" comment, after which it starts wiring up document.getElementById
// and would throw outside a browser. We slice the script at that boundary
// and eval only the data-safe portion in a Node vm context.
//
// Usage: node scripts/migrate/extract.mjs > scripts/migrate/.extract.json
// (output is a build artifact, not committed — regenerate on demand)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prototypePath = path.join(__dirname, '../../docs/reference/uk-frontier-tech-landscape-prototype.html');
const html = readFileSync(prototypePath, 'utf8');

const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const inlineScript = scriptMatches.find(m => !/\bsrc=/i.test(m[1]) && m[2].includes('DATA_QUANTUM'));
if (!inlineScript) throw new Error('Could not find the inline data script in the prototype HTML.');
const fullScript = inlineScript[2];

const startMarker = '/* ──────────────── DATA ──────────────── */';
const endMarker = '/* ──────────────── STATE ──────────────── */';
const startIdx = fullScript.indexOf(startMarker);
const endIdx = fullScript.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  throw new Error('Expected DATA/STATE section markers not found — has the prototype file changed shape?');
}
const dataOnlyScript = fullScript.slice(startIdx, endIdx);

const context = {};
vm.createContext(context);
vm.runInContext(dataOnlyScript, context, { filename: 'prototype-data-section.js' });

const output = {
  SECTOR_META: context.SECTOR_META,
  SECTOR_DATA: context.SECTOR_DATA,
  SECTOR_FRAMING: context.SECTOR_FRAMING,
  SECTOR_FOOTER: context.SECTOR_FOOTER,
};

process.stdout.write(JSON.stringify(output, null, 2));
