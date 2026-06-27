// Persona (for-industry) hero fetcher (Pexels) — 16:9.
//
// Fetches real stock heroes for the 7 /for-<trade>/ pages and crops them to
// 16:9 (1600x900) into images/personas/. Mirrors content/stock-images.mjs but
// is keyed on the trade list below instead of the blog queue, and outputs 16:9
// instead of the blog 3:2. Pexels License allows commercial use, no attribution
// required (credits still saved to images/personas/credits.json). No em-dashes.
//
// Commands:
//   node content/persona-images.mjs            fetch 6 candidates + a default pick per trade, build review page
//   node content/persona-images.mjs set <slug> <n>   promote candidate n to the live hero
//
// Review images/personas/_cand/*.webp via personas-stock.html, then `set`.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE_DIR = resolve(ROOT, 'images', 'personas');
const CAND_DIR = resolve(LIVE_DIR, '_cand');
const CREDITS_PATH = resolve(LIVE_DIR, 'credits.json');
const CAND_COUNT = 6;

// Trade -> Pexels query (reuses the tested INDUSTRY_QUERY set) + a clean alt.
const PERSONAS = [
  { slug: 'barbers',       query: 'barbershop interior',       alt: 'Inside a modern barbershop' },
  { slug: 'salons',        query: 'hair salon interior',       alt: 'A bright modern hair salon' },
  { slug: 'lash-artists',  query: 'eyelash extension studio',  alt: 'A lash extension studio' },
  { slug: 'nail-techs',    query: 'nail salon manicure',       alt: 'A nail salon manicure station' },
  { slug: 'estheticians',  query: 'facial spa treatment room', alt: 'A facial treatment room' },
  { slug: 'spas',          query: 'day spa interior',          alt: 'A serene day spa' },
  { slug: 'solo-pros',     query: 'small beauty studio',       alt: 'A small private beauty studio' },
];

function loadEnvFile() {
  for (const name of ['.env', '.env.local']) {
    const p = resolve(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  }
}
loadEnvFile();
const KEY = () => process.env.PEXELS_API_KEY;

async function searchPexels(q, perPage = 12) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: KEY() } });
  if (!res.ok) throw new Error(`Pexels ${res.status} ${res.statusText}`);
  return (await res.json()).photos || [];
}
async function fetchBuffer(u) { const r = await fetch(u); if (!r.ok) throw new Error(`download ${r.status}`); return Buffer.from(await r.arrayBuffer()); }
async function to169(buf) { return sharp(buf).resize(1600, 900, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toBuffer(); }

function readCredits() { try { return JSON.parse(readFileSync(CREDITS_PATH, 'utf8')); } catch { return {}; } }
function writeCredits(c) { if (!existsSync(LIVE_DIR)) mkdirSync(LIVE_DIR, { recursive: true }); writeFileSync(CREDITS_PATH, JSON.stringify(c, null, 2)); }

async function fetchAll() {
  if (!KEY()) { console.log('No PEXELS_API_KEY found (env or .env).'); return; }
  if (!existsSync(CAND_DIR)) mkdirSync(CAND_DIR, { recursive: true });
  const credits = readCredits();
  for (const p of PERSONAS) {
    process.stdout.write(`  ${p.slug.padEnd(14)} [${p.query}] ... `);
    try {
      const photos = await searchPexels(p.query);
      if (!photos.length) { console.log('no results'); continue; }
      const opts = [];
      for (let i = 0; i < Math.min(CAND_COUNT, photos.length); i++) {
        const ph = photos[i];
        try {
          const webp = await to169(await fetchBuffer(ph.src.large2x || ph.src.large || ph.src.original));
          writeFileSync(resolve(CAND_DIR, `${p.slug}-${i}.webp`), webp);
          opts.push({ i, photographer: ph.photographer, photographer_url: ph.photographer_url, pexels_url: ph.url, alt: ph.alt || '' });
        } catch (err) { /* skip a bad candidate */ }
      }
      // Default the live hero to candidate 0 (Pexels' top result for the query).
      copyFileSync(resolve(CAND_DIR, `${p.slug}-0.webp`), resolve(LIVE_DIR, `${p.slug}.webp`));
      credits[p.slug] = { query: p.query, alt: p.alt, chosen: 0, options: opts };
      console.log(`${opts.length} options, default 0 (by ${opts[0]?.photographer || '?'})`);
    } catch (err) { console.log(`FAILED: ${err.message}`); }
  }
  writeCredits(credits);
  buildGallery(credits);
}

function setPick(slug, n) {
  const cand = resolve(CAND_DIR, `${slug}-${n}.webp`);
  if (!existsSync(cand)) { console.log(`No candidate ${slug}-${n}.webp. Run the fetch first.`); return; }
  copyFileSync(cand, resolve(LIVE_DIR, `${slug}.webp`));
  const credits = readCredits();
  if (credits[slug]) { credits[slug].chosen = n; writeCredits(credits); }
  buildGallery(credits);
  console.log(`Set ${slug} -> candidate ${n} (live).`);
}

function buildGallery(credits) {
  const rows = PERSONAS.map((p) => {
    const c = credits[p.slug] || {};
    const cells = (c.options || []).map((o) => {
      const live = c.chosen === o.i;
      return `<figure class="${live ? 'pick' : ''}"><img src="images/personas/_cand/${p.slug}-${o.i}.webp" alt="" loading="lazy"><figcaption>[${o.i}]${live ? ' &#10003; LIVE' : ''}<br><small>${o.photographer || ''}</small></figcaption></figure>`;
    }).join('');
    return `<section><h2>/for-${p.slug}/ <small>${c.query || ''}</small></h2><div class="grid">${cells}</div>
    <p class="hint">To change: <code>node content/persona-images.mjs set ${p.slug} N</code></p></section>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Persona stock heroes</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#F8F6F2;color:#121212;padding:28px;max-width:1180px;margin:0 auto}
h1{font-weight:800}h2{font-weight:700;margin:28px 0 10px;text-transform:capitalize}h2 small{color:#6B7280;font-weight:400;text-transform:none}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
figure{margin:0}figure img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border:1px solid rgba(18,18,18,.14)}
figure.pick img{outline:3px solid #1f9d55;outline-offset:2px}
figcaption{font-size:12px;color:#6B7280;margin-top:5px}.hint{font-size:13px;color:#6B7280}
small{color:#6B7280}</style></head><body>
<h1>Persona (for-industry) stock heroes &mdash; 16:9</h1>
<p>The green-outlined image is the current live pick for each page. Run the <code>set</code> command to switch.</p>
${rows}</body></html>`;
  writeFileSync(resolve(ROOT, 'personas-stock.html'), html);
  console.log('wrote personas-stock.html');
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'set') setPick(a, parseInt(b, 10));
else if (cmd === 'gallery') buildGallery(readCredits());
else await fetchAll();
