// BookReady stock hero image fetcher (Pexels).
//
// The autonomous publisher's hero source. Instead of one derived "calm empty
// studio" AI scene per article (which made the set look samey), this pulls a
// real, topic-relevant photo per article from Pexels.
//
// Two modes:
//   - Publisher (new articles): `gen --live <slug>` writes straight to
//     images/blog/<slug>.webp, then `wire <slug>` injects the hero block.
//   - A/B retune (existing articles): `gen <slug>` stages to images/blog/_stock/
//     so the live hero is untouched; `gallery` builds a compare page; `promote`
//     copies the approved candidate over the live hero + fixes the alt.
//
// Commands:
//   node content/stock-images.mjs check
//   node content/stock-images.mjs query     [--shipped|<slug>..]
//   node content/stock-images.mjs gen       [--shipped|<slug>..] [--live]
//   node content/stock-images.mjs candidates <slug> "<query>" [count]   review options
//   node content/stock-images.mjs gallery
//   node content/stock-images.mjs wire      [--shipped|<slug>..]
//   node content/stock-images.mjs promote   [--shipped|<slug>..]
//
// Flags: --live (gen writes to the live dir), --pick <n> (use the Nth result)
//
// Reads PEXELS_API_KEY from env or the local gitignored .env. Free key:
// https://www.pexels.com/api/ . Pexels License allows commercial use with no
// attribution required; credits are still saved to _stock/credits.json. No em-dashes.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
const LIVE_DIR = resolve(ROOT, 'images', 'blog');
const STAGE_DIR = resolve(ROOT, 'images', 'blog', '_stock');
const CAND_DIR = resolve(STAGE_DIR, '_cand');
const CREDITS_PATH = resolve(STAGE_DIR, 'credits.json');

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

// ─── Search query per article ────────────────────────────────────────────────
// Base term comes from the article's industry; a few are hand-tuned where
// industry alone is too generic or the topic is the better subject. The rule of
// thumb from testing: "<industry> interior" gives great editorial shots; abstract
// topic searches drift off (a hotel desk, a generic cafe laptop) and need tuning.
const INDUSTRY_QUERY = {
  barbers: 'barbershop interior',
  salons: 'hair salon interior',
  'lash-artists': 'eyelash extension studio',
  'nail-techs': 'nail salon manicure',
  estheticians: 'facial spa treatment room',
  spas: 'day spa interior',
  'solo-pros': 'small beauty studio',
};
const OVERRIDES = {
  'how-to-make-a-booking-website': 'small business laptop workspace',
  'appointment-reminder-templates': 'smartphone salon reception desk',
  'salon-booking-software-comparison': 'modern hair salon reception',
  'booksy-pricing': 'barber chair barbershop',
  'best-booking-websites-for-barbers-in-2026': 'modern barbershop interior',
  'nail-salon-booking-software': 'nail salon manicure table',
  'nail-tech-price-list': 'manicure nail polish bottles',
  'eyelash-extension-prices': 'eyelash extension treatment',
  'waxing-prices': 'waxing spa treatment',
};
function queryFor(entry) {
  if (OVERRIDES[entry.slug]) return OVERRIDES[entry.slug];
  return INDUSTRY_QUERY[entry.recommendedRelatedIndustry] || 'beauty salon interior';
}
function altFor(entry) { const q = queryFor(entry); return q.charAt(0).toUpperCase() + q.slice(1); }

// ─── Queue helpers ───────────────────────────────────────────────────────────
function loadQueue() { return JSON.parse(readFileSync(QUEUE_PATH, 'utf8')); }
function isEditorial(url) { return url.startsWith('/blog/') || url.startsWith('/guides/'); }
function shippedArticles() { return loadQueue().articles.filter((a) => a.status === 'shipped' && isEditorial(a.url)); }
function resolveList(flags, slugs) {
  if (flags.shipped || !slugs.length) return shippedArticles();
  const all = loadQueue().articles;
  return slugs.map((s) => all.find((a) => a.slug === s)).filter(Boolean);
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function readCredits() { try { return JSON.parse(readFileSync(CREDITS_PATH, 'utf8')); } catch { return {}; } }
function writeCredits(c) { if (!existsSync(STAGE_DIR)) mkdirSync(STAGE_DIR, { recursive: true }); writeFileSync(CREDITS_PATH, JSON.stringify(c, null, 2)); }

// ─── Pexels ──────────────────────────────────────────────────────────────────
async function searchPexels(q, perPage = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: KEY() } });
  if (!res.ok) throw new Error(`Pexels ${res.status} ${res.statusText}`);
  return (await res.json()).photos || [];
}
function pickPhoto(photos, slug, pick) {
  if (!photos.length) return null;
  if (pick != null && photos[pick]) return photos[pick];
  return photos[hash(slug) % Math.min(photos.length, 8)]; // deterministic spread across the top results
}
async function fetchBuffer(u) { const r = await fetch(u); if (!r.ok) throw new Error(`download ${r.status}`); return Buffer.from(await r.arrayBuffer()); }
async function toHero(buf) { return sharp(buf).resize(1536, 1024, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toBuffer(); }

// ─── Commands ────────────────────────────────────────────────────────────────
async function cmdCheck() {
  if (!KEY()) { console.log('No PEXELS_API_KEY found (env or .env). Free key: https://www.pexels.com/api/'); return; }
  try { await searchPexels('barbershop', 1); console.log('Pexels auth OK. Stock fetch is ready.'); }
  catch (e) { console.log(`Pexels auth FAILED: ${e.message}`); }
}

function cmdQuery(list) {
  for (const e of list) console.log(`  ${e.slug.padEnd(42)} ${queryFor(e)}`);
}

async function cmdGen(list, flags) {
  if (!KEY()) { console.log('No PEXELS_API_KEY found (env or .env). Free key: https://www.pexels.com/api/'); return; }
  const outDir = flags.live ? LIVE_DIR : STAGE_DIR;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const credits = readCredits();
  for (const e of list) {
    const q = queryFor(e);
    process.stdout.write(`  ${e.slug} [${q}]${flags.live ? ' (live)' : ''} ... `);
    try {
      const photos = await searchPexels(q);
      const photo = pickPhoto(photos, e.slug, flags.pick);
      if (!photo) { console.log('no results'); continue; }
      const webp = await toHero(await fetchBuffer(photo.src.large2x || photo.src.large || photo.src.original));
      writeFileSync(resolve(outDir, `${e.slug}.webp`), webp);
      credits[e.slug] = { query: q, photographer: photo.photographer, photographer_url: photo.photographer_url, pexels_url: photo.url, alt: photo.alt || '' };
      console.log(`saved ${Math.round(webp.length / 1024)} KB, by ${photo.photographer}`);
    } catch (err) { console.log(`FAILED: ${err.message}`); }
  }
  writeCredits(credits);
}

// Fetch the top N results for a query into a review folder so we can eyeball
// options before committing to one. Use `promote-cand` (manual copy) to keep one.
async function cmdCandidates(slug, query, count) {
  if (!KEY()) { console.log('No PEXELS_API_KEY found (env or .env).'); return; }
  if (!query) { console.log('Usage: candidates <slug> "<query>" [count]'); return; }
  if (!existsSync(CAND_DIR)) mkdirSync(CAND_DIR, { recursive: true });
  const photos = await searchPexels(query, count || 8);
  console.log(`  ${photos.length} results for [${query}]`);
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    try {
      writeFileSync(resolve(CAND_DIR, `${slug}-${i}.webp`), await toHero(await fetchBuffer(p.src.large2x || p.src.large || p.src.original)));
      console.log(`  [${i}] ${p.photographer} :: ${(p.alt || '').slice(0, 72)}`);
    } catch (err) { console.log(`  [${i}] FAILED: ${err.message}`); }
  }
  console.log(`Review images/blog/_stock/_cand/${slug}-*.webp, then copy the keeper to images/blog/_stock/${slug}.webp`);
}

function cmdGallery(list) {
  const credits = readCredits();
  const rows = list.map((e) => {
    const c = credits[e.slug] || {};
    const stock = existsSync(resolve(STAGE_DIR, `${e.slug}.webp`)) ? `/images/blog/_stock/${e.slug}.webp` : '';
    return `<tr>
  <td><code>${e.slug}</code><br><small>${e.url}</small><br><small>query: <b>${c.query || '-'}</b></small><br><small>by ${c.photographer || '-'}</small></td>
  <td><img src="/images/blog/${e.slug}.webp"><div class="cap">AI generated</div></td>
  <td>${stock ? `<img src="${stock}">` : '<i>not fetched</i>'}<div class="cap">Pexels stock</div></td>
</tr>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI vs Stock heroes</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#F8F6F2;color:#121212;padding:28px;max-width:1100px;margin:0 auto}
h1{font-weight:800}table{border-collapse:collapse;width:100%}td{border:1px solid rgba(18,18,18,.14);padding:12px;vertical-align:top}
img{display:block;width:300px;height:200px;object-fit:cover;border:1px solid rgba(18,18,18,.14)}
.cap{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6B7280;margin-top:6px}
small{color:#6B7280}</style></head><body>
<h1>AI vs Pexels stock - blog hero comparison</h1>
<p>Left: current AI hero. Right: the Pexels candidate. Approve, then promote.</p>
<table>${rows}</table></body></html>`;
  writeFileSync(resolve(ROOT, '_stock-compare.html'), html);
  console.log(`wrote _stock-compare.html (${list.length} articles)`);
}

// Inject the hero block into the article HTML (new articles), or sync the alt if
// it already has one. Mirrors content/generate-images.mjs so it is a drop-in.
function cmdWire(list) {
  let wired = 0, synced = 0;
  for (const e of list) {
    if (!existsSync(resolve(LIVE_DIR, `${e.slug}.webp`))) { console.log(`  skip (no live image): ${e.slug}`); continue; }
    const page = resolve(ROOT, e.url.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
    if (!existsSync(page)) { console.log(`  skip (no page): ${e.slug}`); continue; }
    let h = readFileSync(page, 'utf8');
    const alt = altFor(e).replace(/"/g, '&quot;');
    if (h.includes('br-article__hero')) {
      const re = new RegExp(`(src="/images/blog/${e.slug}\\.webp"\\s+alt=")[^"]*(")`);
      if (re.test(h)) { h = h.replace(re, `$1${alt}$2`); writeFileSync(page, h, 'utf8'); synced++; }
      continue;
    }
    const hero = `
  <div class="br-article__hero">
    <figure>
      <img src="/images/blog/${e.slug}.webp" alt="${alt}" width="1536" height="1024" loading="eager" fetchpriority="high" decoding="async" />
    </figure>
  </div>
`;
    const idx = h.indexOf('</section>', h.indexOf('br-pagehead'));
    if (idx === -1) { console.log(`  no insert point: ${e.slug}`); continue; }
    const at = idx + '</section>'.length;
    h = h.slice(0, at) + '\n' + hero + h.slice(at);
    writeFileSync(page, h, 'utf8');
    console.log(`  wired hero: ${e.slug}`);
    wired++;
  }
  console.log(`Wire: ${wired} new, ${synced} alt-synced.`);
}

// Copy approved staged candidates over the live heroes + fix alt in the HTML.
function cmdPromote(list) {
  let done = 0;
  for (const e of list) {
    const stage = resolve(STAGE_DIR, `${e.slug}.webp`);
    if (!existsSync(stage)) { console.log(`  skip (no candidate): ${e.slug}`); continue; }
    copyFileSync(stage, resolve(LIVE_DIR, `${e.slug}.webp`));
    const page = resolve(ROOT, e.url.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
    if (existsSync(page)) {
      let h = readFileSync(page, 'utf8');
      const alt = altFor(e).replace(/"/g, '&quot;');
      const re = new RegExp(`(src="/images/blog/${e.slug}\\.webp"\\s+alt=")[^"]*(")`);
      if (re.test(h)) { h = h.replace(re, `$1${alt}$2`); writeFileSync(page, h, 'utf8'); }
    }
    console.log(`  promoted: ${e.slug}`);
    done++;
  }
  console.log(`Promote: ${done} hero(es) swapped to stock.`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const [cmd, ...rest] = process.argv.slice(2);
const flags = { shipped: false, live: false, pick: null };
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--shipped') flags.shipped = true;
  else if (rest[i] === '--live') flags.live = true;
  else if (rest[i] === '--pick') flags.pick = parseInt(rest[++i], 10);
  else if (!rest[i].startsWith('--')) args.push(rest[i]);
}
const list = resolveList(flags, args);

switch (cmd) {
  case 'check': await cmdCheck(); break;
  case 'query': cmdQuery(list); break;
  case 'gen': await cmdGen(list, flags); break;
  case 'candidates': await cmdCandidates(args[0], args[1], parseInt(args[2], 10) || 8); break;
  case 'gallery': cmdGallery(list); break;
  case 'wire': cmdWire(list); break;
  case 'promote': cmdPromote(list); break;
  default:
    console.log(`BookReady stock hero fetcher (Pexels)

  check                          validate PEXELS_API_KEY
  query      [--shipped|<slug>]  print the search query per article (no fetch)
  gen        [--shipped|<slug>]  fetch hero(s); add --live to write to images/blog/ directly
  candidates <slug> "<query>" N  fetch top N options into _stock/_cand/ for review
  gallery                        build _stock-compare.html (AI vs stock)
  wire       [--shipped|<slug>]  inject the hero block into article HTML (or sync alt)
  promote    [--shipped|<slug>]  copy staged candidates over the live heroes + fix alt

Flags: --live  --pick <n>
Free Pexels key: https://www.pexels.com/api/  (add PEXELS_API_KEY to .env)`);
}
