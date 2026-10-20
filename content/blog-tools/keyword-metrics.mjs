// The search terms report with real numbers: monthly US searches, keyword
// difficulty and what advertisers pay per click, from DataForSEO.
//   node content/blog-tools/keyword-metrics.mjs <terms.md> <out.json> [extra.txt] > report.md
//
// Candidates are the relevant rows of search-terms.mjs output, every article's
// `keywords:` line (live or draft) and any extra terms in a plain text file,
// one per line. Each row says which article already covers it, so the monthly
// run can favour searches with nothing written for them.
//
// Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from the environment or
// the repo's .env, which is gitignored. They are never printed. Answers are
// cached under content/research/.kw-cache, so a repeat run costs nothing.
// A month of this costs a few cents.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { frontMatter } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const CACHE = join(ROOT, 'content', 'research', '.kw-cache');
const [termsFile, outFile, extraFile] = process.argv.slice(2);
if (!termsFile || !outFile) { console.error('usage: keyword-metrics.mjs <terms.md> <out.json> [extra.txt]'); process.exit(1); }
mkdirSync(CACHE, { recursive: true });

function creds() {
  let login = process.env.DATAFORSEO_LOGIN, password = process.env.DATAFORSEO_PASSWORD;
  const envFile = join(ROOT, '.env');
  if ((!login || !password) && existsSync(envFile)) {
    const env = readFileSync(envFile, 'utf8');
    login = login || (env.match(/^DATAFORSEO_LOGIN=(.+)$/m) || [])[1]?.trim();
    password = password || (env.match(/^DATAFORSEO_PASSWORD=(.+)$/m) || [])[1]?.trim();
  }
  return login && password ? 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64') : null;
}
const AUTH = creds();

async function post(path, body) {
  const key = createHash('sha1').update(path + JSON.stringify(body)).digest('hex');
  const file = join(CACHE, key + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const r = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json();
  const t = j.tasks?.[0];
  if (t && t.status_code === 20000) writeFileSync(file, JSON.stringify(j));
  else console.error(`  ${path}: ${t?.status_code || r.status} ${t?.status_message || j.status_message || ''}`);
  return j;
}

const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
// Only searches a BKRDY article could honestly answer.
const RELEVANT = /salon|barber|lash|nail|spa\b|esthetic|brow|wax|facial|beauty|stylist|booking|book |appointment|schedul|client|deposit|no.?show|cancel|review|\bbooksy\b|\bvagaro\b|\bglossgenius\b|\bstyleseat\b|\bfresha\b|\bacuity\b|square appointments|website|instagram|rebook|waitlist|booth|tattoo/i;
// Searches that pass the relevance test but could never be answered by an
// article of ours: support and outage lookups, other industries, unrelated
// brands autocomplete drifted into, and office or payroll questions.
const NOISE = /crossword|\bjobs?\b|salary|customer service|phone number|login|download|near me$|promo code|glassdoor|valuation|series [a-e]\b|\blyft\b|\buber\b|direct deposit|galore|\bis \w+ down\b|nyc office|medicaid|medical office|\bdoctor\b|\bdentist\b|therapist|massage|\bhotel\b|\bairbnb\b|meaning$/i;

const cands = new Map();
const add = (term, source) => {
  const t = norm(term);
  if (!t || t.split(' ').length > 9) return;
  if (!cands.has(t)) cands.set(t, { term: t, sources: new Set() });
  cands.get(t).sources.add(source);
};

const md = readFileSync(termsFile, 'utf8');
[...md.matchAll(/^\| (.+?) \| (\d+) \| ?(\w+)? ?\|$/gm)]
  .map(m => m[1]).filter(t => RELEVANT.test(t) && !NOISE.test(t)).slice(0, 110)
  .forEach(t => add(t, 'autocomplete'));

// Coverage: every article's keywords, with its status and title.
const covered = new Map();
if (existsSync(SRC)) {
  for (const n of readdirSync(SRC).filter(f => f.endsWith('.md'))) {
    const [m] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
    if (!m.keywords) continue;
    const p = { key: m.key, status: (m.status || 'published') === 'draft' ? 'draft' : 'live', title: m.title };
    for (const t of String(m.keywords).split(',').map(s => s.trim()).filter(Boolean)) { add(t, p.status); covered.set(norm(t), p); }
  }
}
function coverOf(term) {
  if (covered.has(term)) return covered.get(term);
  for (const [kw, p] of covered) if (kw.split(' ').length >= 3 && term.includes(kw)) return p;
  return null;
}
if (extraFile && existsSync(extraFile)) {
  readFileSync(extraFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean).forEach(t => add(t, 'extra'));
}

const rows = [];
let provider = 'Google autocomplete only (no DataForSEO credentials found)';
if (AUTH) {
  provider = 'DataForSEO: Google Ads monthly searches and keyword difficulty, United States';
  const terms = [...cands.keys()];
  for (let i = 0; i < terms.length; i += 700) {
    const chunk = terms.slice(i, i + 700);
    const metrics = new Map();
    const vol = await post('keywords_data/google_ads/search_volume/live', [{ keywords: chunk, location_code: 2840, language_code: 'en' }]);
    for (const r of (vol.tasks?.[0]?.result || [])) {
      metrics.set(norm(r.keyword), { volume: r.search_volume ?? null, cpc: r.cpc ?? null, competition: r.competition ?? null, difficulty: null });
    }
    const diff = await post('dataforseo_labs/google/bulk_keyword_difficulty/live', [{ keywords: chunk, location_code: 2840, language_code: 'en' }]);
    for (const it of (diff.tasks?.[0]?.result?.[0]?.items || [])) {
      const m = metrics.get(norm(it.keyword)) || { volume: null };
      m.difficulty = it.keyword_difficulty ?? null;
      metrics.set(norm(it.keyword), m);
    }
    for (const t of chunk) {
      const m = metrics.get(t) || {};
      rows.push({ term: t, volume: m.volume ?? null, difficulty: m.difficulty ?? null, cpc: m.cpc ?? null, covered: coverOf(t) });
    }
  }
} else {
  for (const c of cands.values()) rows.push({ term: c.term, volume: null, difficulty: null, cpc: null, covered: coverOf(c.term) });
}
rows.sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));
writeFileSync(outFile, JSON.stringify({ date: new Date().toISOString().slice(0, 10), provider, rows }, null, 1));

const open = rows.filter(r => !r.covered && r.volume);
const lines = [`# Search terms report · ${new Date().toISOString().slice(0, 10)}`, '', provider, '',
  `${rows.length} searches, ${rows.filter(r => r.volume).length} with volume, **${open.length} with no article yet**.`, '',
  '## Nothing written for these yet', '', '| Search | A month | Difficulty | Click cost |', '|---|---|---|---|',
  ...open.slice(0, 40).map(r => `| ${r.term} | ${r.volume} | ${r.difficulty ?? '-'} | ${r.cpc != null ? '$' + Number(r.cpc).toFixed(2) : '-'} |`), '',
  '## Everything, by volume', '', '| Search | A month | Difficulty | Click cost | Covered by |', '|---|---|---|---|---|',
  ...rows.slice(0, 80).map(r => `| ${r.term} | ${r.volume ?? '-'} | ${r.difficulty ?? '-'} | ${r.cpc != null ? '$' + Number(r.cpc).toFixed(2) : '-'} | ${r.covered ? r.covered.status + ': ' + r.covered.key : ''} |`), ''];
console.log(lines.join('\n'));
