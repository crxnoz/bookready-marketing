// What beauty pros actually type into Google, from Google's own autocomplete.
//   node content/blog-tools/search-terms.mjs > terms.md
//
// Autocomplete has no volumes. A term scores higher the more starting phrases
// it turns up under and the nearer the top it appears, which is a decent read
// on what people really search before DataForSEO puts numbers on it
// (content/blog-tools/keyword-metrics.mjs does that next).
//
// Terms an article already covers are marked, so the monthly run can favour
// the ones with nothing written for them yet. Part of the monthly blog loop.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');

// Seeds are the shape of the blog's six pillars, not a list of vanity terms.
const SEEDS = [
  // switching
  'booksy', 'booksy alternative', 'is booksy', 'glossgenius', 'glossgenius vs', 'vagaro', 'vagaro alternative',
  'square appointments', 'square appointments pricing', 'fresha', 'styleseat', 'acuity scheduling alternative',
  'salon booking software', 'booking software for salons', 'booking app for barbers', 'nail salon booking software',
  'spa booking software', 'best booking app for', 'switch from booksy',
  // money on the table
  'how to take deposits for', 'deposit for appointments', 'no show policy for', 'no show fee',
  'cancellation policy for salon', 'how to stop no shows', 'how much to charge for lash extensions',
  'how much to charge for nails', 'how to price my services', 'card on file for appointments',
  // getting them back
  'how to get clients to rebook', 'client retention salon', 'appointment reminder text',
  'appointment reminder template', 'how to ask clients for reviews', 'google reviews for salon',
  'waitlist for salon appointments', 'client notes for',
  // your own site
  'website for salon', 'website for barber', 'website for nail salon', 'do i need a website for my salon',
  'instagram booking link', 'how to add booking link to instagram', 'link in bio for salon', 'booking page for',
  // running the week
  'how far in advance to book clients', 'double booking clients', 'how many clients per day',
  'salon scheduling tips', 'buffer time between appointments',
  // going solo
  'booth rent vs commission', 'how to start a lash business', 'how to start a nail business',
  'how to open a barber shop', 'going independent hairstylist',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function suggest(q) {
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&gl=us&hl=en&q=${encodeURIComponent(q)}`;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await r.arrayBuffer());
      const txt = new TextDecoder(r.headers.get('content-type')?.includes('ISO-8859-1') ? 'latin1' : 'utf-8').decode(buf);
      return JSON.parse(txt)[1] || [];
    } catch { await sleep(800); }
  }
  return [];
}

// Searches that look like ours but are not: support lines, app-store queries,
// job hunts, and the drift autocomplete produces from a brand seed.
const NOISE = /crossword|\bjobs?\b|salary|hiring|careers|glassdoor|valuation|series [a-e]\b|customer service|phone number|contact number|login|log in|sign in|download|app store|play store|promo code|coupon code|near me$|fresh air|freshav|freshand|free ?fire|owen|stock|\.com$|espa[nñ]a|colombia|m[eé]xico|per[uú]|chile|argentina/i;

const covered = new Map();
if (existsSync(SRC)) {
  for (const n of readdirSync(SRC).filter(f => f.endsWith('.md'))) {
    const [m] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
    const status = (m.status || 'published') === 'draft' ? 'draft' : 'live';
    for (const t of String(m.keywords || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)) {
      covered.set(t, { key: m.key, status, title: m.title });
    }
  }
}
// A longer search containing an article's keyword counts as covered by it.
function coverOf(term) {
  if (covered.has(term)) return covered.get(term);
  for (const [kw, p] of covered) if (kw.split(' ').length >= 3 && term.includes(kw)) return p;
  return null;
}

const terms = new Map();
for (const seed of SEEDS) {
  const list = await suggest(seed);
  list.forEach((t, i) => {
    const key = String(t).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || key === seed || key.split(' ').length > 9 || NOISE.test(key)) return;
    const cur = terms.get(key) || { score: 0, seeds: new Set() };
    cur.score += Math.max(1, 10 - i);
    cur.seeds.add(seed);
    terms.set(key, cur);
  });
  await sleep(220);
}

const ranked = [...terms.entries()].sort((a, b) => b[1].score - a[1].score);
const out = [`# Popular search terms · ${new Date().toISOString().slice(0, 10)}`, '',
  'From Google autocomplete (United States, English). Score is how many starting phrases a term appears under, weighted by how high it appears. No volumes here; keyword-metrics.mjs adds those.', '',
  `${ranked.length} terms from ${SEEDS.length} starting phrases.`, '',
  '| Term | Score | Covered |', '|---|---|---|'];
for (const [t, v] of ranked.slice(0, 160)) {
  const c = coverOf(t);
  out.push(`| ${t} | ${v.score} | ${c ? (c.status === 'draft' ? 'draft' : 'yes') : ''} |`);
}
console.log(out.join('\n'));
