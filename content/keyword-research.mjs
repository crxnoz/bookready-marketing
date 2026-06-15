// BookReady keyword research engine.
//
// Grounds the content queue in real search data instead of guessed estVolume.
// Free layer: Google Autocomplete (public JSON, no key) for the real phrases
// people type, plus a relative demand signal from suggestion relevance.
// Paid layer (optional): a swappable provider adapter (DataForSEO by default)
// that adds real monthly search volume + keyword difficulty when a key is set.
//
// Commands:
//   node content/keyword-research.mjs expand "<seed>"          quick free preview of expanded keywords
//   node content/keyword-research.mjs research [--deep]        full pass over seeds -> dataset file
//   node content/keyword-research.mjs research --seeds a,b,c   research specific inline seeds
//   node content/keyword-research.mjs research --seeds-file f  research seeds from a file (one per line)
//   node content/keyword-research.mjs audit                    score existing pending queue keywords vs real data
//   node content/keyword-research.mjs promote                  merge approved proposals into queue.json
//
// Flags: --deep (alphabet expansion), --no-cache (skip paid-API cache),
//        --limit N (cap candidates in dataset), --gl us --hl en (locale)
//
// Output goes to content/research/. The paid-API cache lives in
// content/research/.cache/ and is gitignored. No em-dashes in any output.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
const RESEARCH_DIR = resolve(ROOT, 'content', 'research');
const CACHE_DIR = resolve(RESEARCH_DIR, '.cache');
const PROPOSED_PATH = resolve(ROOT, 'content', 'queue.proposed.json');

// ─── Defaults ───────────────────────────────────────────────────────────────

// Seeds reflect BookReady's clusters: competitor switches, core software terms,
// and the operational pain topics owners search for. Override with --seeds /
// --seeds-file. Keep these buyer-relevant, not vanity terms.
const DEFAULT_SEEDS = [
  // competitor / migration (BOFU)
  'glossgenius alternative', 'fresha alternative', 'booksy alternative',
  'square appointments alternative', 'acuity alternative', 'vagaro alternative',
  'styleseat alternative', 'mangomint alternative',
  // category / commercial (MOFU)
  'salon booking software', 'barber booking app', 'spa scheduling software',
  'lash booking software', 'nail salon booking software',
  'booking website for salons', 'appointment scheduling for beauty',
  // operational pain (MOFU / TOFU)
  'salon no show', 'salon deposit policy', 'salon cancellation policy',
  'how to reduce no shows', 'salon appointment reminder',
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MODIFIERS = [
  'alternative', 'alternatives', 'vs', 'review', 'reviews', 'pricing',
  'cost', 'free', 'best', 'for small business', 'for salons', 'for barbers',
];
const QUESTIONS = ['how to', 'what is', 'why', 'best'];

const LOCATION_CODE_US = 2840; // DataForSEO location code for United States

// ─── Tiny utils ──────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s).toLowerCase().trim().replace(/\s+/g, ' ');
const slugify = (s) => norm(s)
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 70);

function ensureDirs() {
  if (!existsSync(RESEARCH_DIR)) mkdirSync(RESEARCH_DIR, { recursive: true });
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

// Load secrets from a local gitignored .env (so API keys never touch the repo
// or the shell history). Real environment variables take precedence.
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

function parseFlags(argv) {
  const f = { deep: false, noCache: false, limit: 80, gl: 'us', hl: 'en', seeds: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--deep') f.deep = true;
    else if (a === '--no-cache') f.noCache = true;
    else if (a === '--limit') f.limit = Number(argv[++i]) || f.limit;
    else if (a === '--gl') f.gl = argv[++i] || f.gl;
    else if (a === '--hl') f.hl = argv[++i] || f.hl;
    else if (a === '--seeds') f.seeds = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--seeds-file') {
      const p = argv[++i];
      f.seeds = readFileSync(resolve(ROOT, p), 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
    }
  }
  return f;
}

// ─── Free layer: Google Autocomplete ─────────────────────────────────────────

// Returns [{ phrase, relevance }] for one query. The chrome client returns a
// google:suggestrelevance array we use as a relative weight.
async function autocomplete(query, { gl, hl }) {
  const url = `https://www.google.com/complete/search?client=chrome&hl=${hl}&gl=${gl}&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const json = JSON.parse(await res.text());
    const phrases = json[1] || [];
    const rel = (json[4] && json[4]['google:suggestrelevance']) || [];
    return phrases.map((phrase, i) => ({ phrase: norm(phrase), relevance: rel[i] || 0 }));
  } catch {
    return [];
  }
}

// Expand one seed into many real long-tail phrases. Aggregates relevance and
// counts how many sub-queries surfaced each phrase (frequency = stronger signal).
async function expandSeed(seed, flags) {
  const queries = new Set([seed]);
  for (const m of MODIFIERS) queries.add(`${seed} ${m}`);
  for (const q of QUESTIONS) queries.add(`${q} ${seed}`);
  if (flags.deep) for (const l of ALPHABET) queries.add(`${seed} ${l}`);

  const agg = new Map(); // phrase -> { phrase, relevance, freq }
  for (const q of queries) {
    const results = await autocomplete(q, flags);
    for (const { phrase, relevance } of results) {
      if (!phrase || phrase.length < 3) continue;
      const cur = agg.get(phrase) || { phrase, relevance: 0, freq: 0 };
      cur.relevance = Math.max(cur.relevance, relevance);
      cur.freq += 1;
      agg.set(phrase, cur);
    }
    await sleep(110); // polite pacing
  }
  return [...agg.values()];
}

// Normalize raw autocomplete weights into a 0-100 relative demand signal.
// This is NOT a search volume. It is a relative "how strongly does Google
// surface this" proxy, useful for ranking when no paid volume is available.
function demandSignal(rawRelevance, freq) {
  // Relevance scores cluster roughly 500-1300. Frequency adds a small bonus.
  const relPart = Math.min(1, Math.max(0, (rawRelevance - 450) / 900));
  const freqPart = Math.min(1, freq / 6);
  return Math.round((relPart * 0.8 + freqPart * 0.2) * 100);
}

// ─── Intent + routing heuristics (the agent refines these) ───────────────────

function classifyIntent(kw) {
  const k = norm(kw);
  if (/\b(alternative|alternatives|vs|versus|competitor|competitors|replacement|switch from|leave|cancel|export)\b/.test(k)) return 'BOFU';
  if (/\b(pricing|price|cost|review|reviews|best|cheapest|free|comparison|compare)\b/.test(k)) return 'MOFU';
  if (/\b(how to|what is|why|guide|tips|template|templates|example|examples|ideas|policy)\b/.test(k)) return 'TOFU';
  return 'MOFU';
}

const INTENT_WEIGHT = { BOFU: 1.3, MOFU: 1.1, TOFU: 0.95 };

// Relevance filtering. Autocomplete drifts: "fresha" branches into unrelated
// "fresh ..." terms, and geo modifiers surface markets BookReady does not serve.
// We keep a candidate only if it still shares a meaningful "anchor" token with
// one of its seeds, and drop obvious off-topic / foreign-geo drift.
const GENERIC_TOKENS = new Set([
  'alternative', 'alternatives', 'software', 'booking', 'book', 'app', 'apps',
  'best', 'free', 'online', 'system', 'systems', 'tool', 'tools', 'scheduling',
  'schedule', 'appointment', 'appointments', 'for', 'the', 'and', 'with',
  'review', 'reviews', 'pricing', 'price', 'cost', 'small', 'business',
]);
const OFFTOPIC_TOKENS = new Set([
  'socks', 'photoshop', 'clinic', 'clinics', 'interview', 'outpatient',
  'message', 'messages', 'noise', 'llc', 'inc', 'farms', 'farm', 'amazon',
  'faire', 'version', 'water', 'freshwater', 'crm', 'erp',
]);
const FOREIGN_GEO_TOKENS = new Set([
  'india', 'pakistan', 'nigeria', 'kenya', 'bangladesh', 'philippines',
  'indonesia', 'malaysia', 'ireland', 'dubai', 'uae',
]);

function seedAnchors(seed) {
  return norm(seed).split(/\s+/).filter((t) => t.length >= 4 && !GENERIC_TOKENS.has(t));
}
function isRelevant(phrase, seedsArr) {
  const toks = norm(phrase).split(/\s+/);
  for (const t of toks) if (OFFTOPIC_TOKENS.has(t) || FOREIGN_GEO_TOKENS.has(t)) return false;
  const anchors = new Set();
  for (const s of seedsArr) for (const a of seedAnchors(s)) anchors.add(a);
  if (anchors.size === 0) return true;
  for (const a of anchors) if (phrase.includes(a)) return true;
  return false;
}

function guessCluster(kw) {
  const k = norm(kw);
  if (/\b(alternative|vs|migrate|switch|leave|cancel|export|competitor)\b/.test(k)) return 'migration';
  if (/\b(no.show|deposit|cancellation|reminder|booking policy|rebook|waitlist)\b/.test(k)) return 'appointment-management';
  if (/\b(barber|lash|nail|spa|salon|esthetician|tattoo|brow|wax)\b/.test(k)) return 'industry';
  return 'general';
}

function guessUrlPath(kw, slug) {
  const k = norm(kw);
  if (/\b(alternative|vs|versus)\b/.test(k)) return `/compare/${slug}/`;
  if (/\b(how to|export|migrate|guide|template|policy|set up|setup)\b/.test(k)) return `/guides/${slug}/`;
  if (/\b(best|top)\b/.test(k)) return `/blog/${slug}/`;
  return `/blog/${slug}/`;
}

// ─── Paid layer: pluggable volume + difficulty provider ──────────────────────
//
// To swap providers, implement fetchMetrics(keywords) -> Map(kw -> {volume,
// difficulty, cpc, competition}) and point getProvider() at it. The rest of the
// engine is provider agnostic.

function cacheGet(key) {
  const p = join(CACHE_DIR, `${createHash('sha1').update(key).digest('hex')}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
function cacheSet(key, val) {
  const p = join(CACHE_DIR, `${createHash('sha1').update(key).digest('hex')}.json`);
  writeFileSync(p, JSON.stringify(val), 'utf8');
}

// DataForSEO adapter. Reads DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD from env.
// Batches keywords (cap 700/request) across two endpoints: Google Ads search
// volume and Labs bulk keyword difficulty, then merges by keyword.
function dataForSeoProvider(flags) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return null;
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');

  async function post(path, body) {
    const cacheKey = path + JSON.stringify(body);
    if (!flags.noCache) { const hit = cacheGet(cacheKey); if (hit) return hit; }
    const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!flags.noCache) cacheSet(cacheKey, json);
    return json;
  }

  async function fetchMetrics(keywords) {
    const out = new Map();
    for (let i = 0; i < keywords.length; i += 700) {
      const batch = keywords.slice(i, i + 700);
      const task = [{ keywords: batch, location_code: LOCATION_CODE_US, language_code: 'en' }];

      const vol = await post('keywords_data/google_ads/search_volume/live', task);
      for (const r of (vol.tasks?.[0]?.result || [])) {
        out.set(norm(r.keyword), {
          volume: r.search_volume ?? null,
          cpc: r.cpc ?? null,
          competition: r.competition ?? null,
          difficulty: null,
        });
      }

      const diff = await post('dataforseo_labs/google/bulk_keyword_difficulty/live', task);
      for (const it of (diff.tasks?.[0]?.result?.[0]?.items || [])) {
        const cur = out.get(norm(it.keyword)) || { volume: null, cpc: null, competition: null };
        cur.difficulty = it.keyword_difficulty ?? null;
        out.set(norm(it.keyword), cur);
      }
    }
    return out;
  }

  return { name: 'dataforseo', fetchMetrics };
}

function getProvider(flags) {
  // Add SerpApi / Keywords Everywhere adapters here and return the first that
  // has credentials. Today: DataForSEO, else null (free mode).
  return dataForSeoProvider(flags);
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function priorityScore({ demand, volume, difficulty, intent }) {
  const iw = INTENT_WEIGHT[intent] || 1.0;
  if (volume != null) {
    const volScore = Math.min(100, (Math.log10(volume + 1) / Math.log10(50000)) * 100);
    const diffPenalty = difficulty != null ? (100 - difficulty) / 100 : 0.7;
    return Math.round(Math.min(100, volScore * diffPenalty * iw));
  }
  return Math.round(Math.min(100, (demand || 0) * iw));
}

// ─── Queue dedup ─────────────────────────────────────────────────────────────

function loadQueue() {
  if (!existsSync(QUEUE_PATH)) return { articles: [] };
  return JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
}

function existingKeywordSet(q) {
  const set = new Set();
  for (const a of q.articles || []) {
    if (a.primaryKeyword) set.add(norm(a.primaryKeyword));
    for (const s of a.secondaryKeywords || []) set.add(norm(s));
  }
  return set;
}
function existingSlugSet(q) {
  return new Set((q.articles || []).map((a) => a.slug));
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdExpand(seed, flags) {
  if (!seed) { console.error('Usage: keyword-research.mjs expand "<seed>"'); process.exit(1); }
  const rows = (await expandSeed(seed, flags))
    .map((r) => ({ ...r, demand: demandSignal(r.relevance, r.freq), intent: classifyIntent(r.phrase) }))
    .sort((a, b) => b.demand - a.demand);
  console.log(`Expanded "${seed}" into ${rows.length} real phrases:\n`);
  for (const r of rows.slice(0, 40)) {
    console.log(`  [${String(r.demand).padStart(3)}] ${r.intent.padEnd(4)} ${r.phrase}`);
  }
}

async function cmdResearch(flags) {
  ensureDirs();
  const seeds = flags.seeds || DEFAULT_SEEDS;
  const q = loadQueue();
  const haveKw = existingKeywordSet(q);
  const provider = getProvider(flags);

  console.log(`Researching ${seeds.length} seeds (${flags.deep ? 'deep' : 'standard'} expansion)`);
  console.log(`Provider: ${provider ? provider.name : 'free mode (autocomplete demand signal only)'}\n`);

  // 1. Expand all seeds (free).
  const cand = new Map(); // phrase -> { phrase, relevance, freq, seeds:Set }
  for (const seed of seeds) {
    process.stdout.write(`  expanding: ${seed} ... `);
    const rows = await expandSeed(seed, flags);
    for (const r of rows) {
      const cur = cand.get(r.phrase) || { phrase: r.phrase, relevance: 0, freq: 0, seeds: new Set() };
      cur.relevance = Math.max(cur.relevance, r.relevance);
      cur.freq += r.freq;
      cur.seeds.add(seed);
      cand.set(r.phrase, cur);
    }
    console.log(`${rows.length} phrases`);
  }

  // 2. Drop phrases already targeted by the queue, plus autocomplete drift.
  const fresh = [...cand.values()].filter((c) => !haveKw.has(c.phrase));
  const candidates = fresh.filter((c) => isRelevant(c.phrase, [...c.seeds]));
  console.log(`\n${cand.size} unique phrases, ${fresh.length} new, ${candidates.length} relevant (after drift filter)`);

  // 3. Add real metrics if a paid provider is configured. Cost control: price
  // only the strongest candidates by the free signal (the long tail of weak
  // ones would not make the final cut anyway).
  candidates.sort((a, b) => demandSignal(b.relevance, b.freq) - demandSignal(a.relevance, a.freq));
  let metrics = new Map();
  if (provider) {
    const toPrice = candidates.slice(0, Math.max(flags.limit * 3, 60));
    console.log(`Fetching volume + difficulty for top ${toPrice.length} candidates via ${provider.name} ...`);
    metrics = await provider.fetchMetrics(toPrice.map((c) => c.phrase));
  }

  // 4. Score + shape.
  const dataset = candidates.map((c) => {
    const m = metrics.get(c.phrase) || {};
    const intent = classifyIntent(c.phrase);
    const demand = demandSignal(c.relevance, c.freq);
    const slug = slugify(c.phrase);
    return {
      keyword: c.phrase,
      slug,
      suggestedUrl: guessUrlPath(c.phrase, slug),
      cluster: guessCluster(c.phrase),
      intent,
      demandSignal: demand,
      volume: m.volume ?? null,
      difficulty: m.difficulty ?? null,
      cpc: m.cpc ?? null,
      competition: m.competition ?? null,
      fromSeeds: [...c.seeds],
      priority: priorityScore({ demand, volume: m.volume, difficulty: m.difficulty, intent }),
    };
  }).sort((a, b) => b.priority - a.priority).slice(0, flags.limit);

  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = resolve(RESEARCH_DIR, `dataset-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    provider: provider ? provider.name : 'free',
    seeds,
    deep: flags.deep,
    count: dataset.length,
    keywords: dataset,
  }, null, 2), 'utf8');

  console.log(`\nWrote ${dataset.length} ranked keywords to ${outPath.replace(ROOT, '.')}`);
  console.log('\nTop 20 candidates:\n');
  for (const k of dataset.slice(0, 20)) {
    const vol = k.volume != null ? `${k.volume}/mo` : `~${k.demandSignal} demand`;
    const diff = k.difficulty != null ? ` kd${k.difficulty}` : '';
    console.log(`  [${String(k.priority).padStart(3)}] ${k.intent.padEnd(4)} ${k.keyword.padEnd(42)} ${vol}${diff}`);
  }
  console.log('\nNext: feed this dataset to content/keyword-research-prompt.md to generate queue proposals.');
}

async function cmdAudit(flags) {
  const q = loadQueue();
  const pending = (q.articles || []).filter((a) => a.status === 'pending');
  if (pending.length === 0) { console.log('No pending queue entries to audit.'); return; }
  const provider = getProvider(flags);
  console.log(`Auditing ${pending.length} pending queue keywords`);
  console.log(`Provider: ${provider ? provider.name : 'free mode (demand signal only)'}\n`);

  let metrics = new Map();
  if (provider) metrics = await provider.fetchMetrics(pending.map((a) => norm(a.primaryKeyword)));

  const rows = [];
  for (const a of pending) {
    const kw = norm(a.primaryKeyword);
    const m = metrics.get(kw) || {};
    let demand = null;
    if (!provider) {
      const exp = await autocomplete(kw, flags);
      const self = exp.find((e) => e.phrase === kw) || exp[0];
      demand = self ? demandSignal(self.relevance, 1) : 0;
    }
    rows.push({
      slug: a.slug,
      keyword: a.primaryKeyword,
      claimedVolume: a.estVolume || '?',
      realVolume: m.volume ?? null,
      difficulty: m.difficulty ?? null,
      demandSignal: demand,
    });
  }

  rows.sort((a, b) => (b.realVolume ?? b.demandSignal ?? 0) - (a.realVolume ?? a.demandSignal ?? 0));
  console.log('slug                                  claimed   real      kd    flag');
  for (const r of rows) {
    const real = r.realVolume != null ? `${r.realVolume}/mo` : (r.demandSignal != null ? `~${r.demandSignal}` : '?');
    const kd = r.difficulty != null ? String(r.difficulty) : '-';
    const low = (r.realVolume != null && r.realVolume < 30) || (r.demandSignal != null && r.demandSignal < 15);
    const flag = low ? 'LOW: consider cut/merge' : '';
    console.log(`  ${r.slug.slice(0, 36).padEnd(36)} ${String(r.claimedVolume).padEnd(9)} ${real.padEnd(9)} ${kd.padEnd(5)} ${flag}`);
  }
  ensureDirs();
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = resolve(RESEARCH_DIR, `audit-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2), 'utf8');
  console.log(`\nWrote audit to ${outPath.replace(ROOT, '.')}`);
}

async function cmdMetrics(kwArg, flags) {
  const kws = (kwArg || '').split(',').map((s) => norm(s)).filter(Boolean);
  if (!kws.length) { console.error('Usage: keyword-research.mjs metrics "kw1,kw2"'); process.exit(1); }
  ensureDirs();
  const provider = getProvider(flags);
  if (!provider) { console.log('No paid provider configured; metrics needs DataForSEO creds in .env.'); return; }
  const m = await provider.fetchMetrics(kws);
  console.log('keyword                                          vol       kd   cpc');
  for (const k of kws) {
    const d = m.get(k) || {};
    const vol = d.volume != null ? `${d.volume}/mo` : 'no data';
    const kd = d.difficulty != null ? String(d.difficulty) : '-';
    const cpc = d.cpc != null ? `$${d.cpc}` : '-';
    console.log(`  ${k.slice(0, 46).padEnd(46)} ${vol.padEnd(9)} ${kd.padEnd(4)} ${cpc}`);
  }
}

async function cmdCheck() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.log('No DataForSEO credentials found (env or .env). Running in FREE mode.');
    return;
  }
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  try {
    const res = await fetch('https://api.dataforseo.com/v3/appendix/user_data', { headers: { Authorization: auth } });
    const json = await res.json();
    if (json.status_code !== 20000) {
      console.log(`Auth FAILED: ${json.status_code} ${json.status_message}`);
      console.log('Verify DATAFORSEO_LOGIN (account email) and DATAFORSEO_PASSWORD (API password from app.dataforseo.com/api-access, not your website password).');
      return;
    }
    const r = json.tasks?.[0]?.result?.[0] || {};
    console.log('DataForSEO auth OK. Paid layer is active.');
    if (r.login) console.log(`  account: ${r.login}`);
    if (r.money?.balance != null) console.log(`  balance: $${r.money.balance}`);
  } catch (e) {
    console.log('Request error:', e.message);
  }
}

function cmdPromote() {
  if (!existsSync(PROPOSED_PATH)) {
    console.error(`No ${PROPOSED_PATH.replace(ROOT, '.')} found. Generate proposals first.`);
    process.exit(1);
  }
  const proposed = JSON.parse(readFileSync(PROPOSED_PATH, 'utf8'));
  const list = Array.isArray(proposed) ? proposed : (proposed.articles || []);
  const q = loadQueue();
  const haveSlug = existingSlugSet(q);

  let added = 0, skipped = 0;
  for (const entry of list) {
    if (entry.approved !== true) { skipped++; continue; }
    if (haveSlug.has(entry.slug)) { console.log(`  · skip (already in queue): ${entry.slug}`); skipped++; continue; }
    const { approved, ...clean } = entry;
    clean.status = 'pending';
    q.articles.push(clean);
    haveSlug.add(clean.slug);
    added++;
    console.log(`  + promoted: ${clean.slug}`);
  }
  if (added > 0) writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2), 'utf8');
  console.log(`\nPromote: ${added} added to queue, ${skipped} skipped.`);
  console.log('Approve more by setting "approved": true in content/queue.proposed.json, then re-run promote.');
}

// ─── Entry ───────────────────────────────────────────────────────────────────

const [cmd, ...rest] = process.argv.slice(2);
const flags = parseFlags(rest);

switch (cmd) {
  case 'expand': await cmdExpand(rest.find((a) => !a.startsWith('--')), flags); break;
  case 'research': await cmdResearch(flags); break;
  case 'audit': await cmdAudit(flags); break;
  case 'metrics': await cmdMetrics(rest.find((a) => !a.startsWith('--')), flags); break;
  case 'check': await cmdCheck(); break;
  case 'promote': cmdPromote(); break;
  default:
    console.log(`BookReady keyword research engine

Commands:
  expand "<seed>"        quick free preview of expanded keywords
  research [--deep]      full pass over seeds -> content/research/dataset-<date>.json
  audit                  score existing pending queue keywords vs real data
  promote                merge approved proposals from queue.proposed.json into queue.json

Flags: --deep --no-cache --limit N --seeds a,b,c --seeds-file path --gl us --hl en

Paid metrics: set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in env to add real
search volume + difficulty. Without them, runs in free mode (demand signal only).`);
}
