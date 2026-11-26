// BabyLoveGrowth (BLG) writes articles for bkrdy.com. This brings each new one
// in as a DRAFT in content/blog/, so it goes through the review page like every
// other article. Nothing here publishes: a draft never builds, and Luis
// approves on the review page before anything goes live (his decision,
// 2026-11-26). See "BabyLoveGrowth articles" in blog-loop.md for what happens
// to a draft after this script.
//
//   node content/blog-tools/blg-intake.mjs --list
//       What BLG holds that is not in content/blog yet. Writes nothing.
//   node content/blog-tools/blg-intake.mjs [--limit 2]
//       Write the new ones as drafts, oldest first (two a run unless told).
//   node content/blog-tools/blg-intake.mjs --id 638034
//       One article by its BLG id.
//   node content/blog-tools/blg-intake.mjs --skip 638034 "we already cover deposits"
//       Leave one out for good, with the reason. It is kept in blg-skipped.json
//       so no later run brings it in, and so Luis can be told why.
//   --env <dir>   read BABYLOVEGROWTH_API_KEY from <dir>/.env (default: the repo)
//   --out <dir>   write the drafts there, not in content/blog (to look at one)
//   --again       with --out: convert an article that is already in content/blog
//
// What it does to an article, and nothing more: takes out BLG's own title line,
// pictures, table of contents and "Recommended" list (the template has its
// own), turns links to bkrdy.com into site paths, writes the name BKRDY the way
// we write it, and replaces em and en dashes. It does not check a single claim.
// That is the editor's job, and draft-check.mjs is where it starts.
//
// The key is never printed. With no key it says so and exits 0.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter, markdown } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const argv = process.argv.slice(2);
const flag = n => argv.includes(n);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const LIST = flag('--list');
const AGAIN = flag('--again');
const OUT = opt('--out');
const ONE = opt('--id');
const LIMIT = Number(opt('--limit') || 2);
const API = 'https://api.babylovegrowth.ai/api/integrations/v1';

// Articles left out on purpose: { "<BLG id>": { reason, date } }.
const SKIP_FILE = join(ROOT, 'content', 'blog-tools', 'blg-skipped.json');
const skipped = existsSync(SKIP_FILE) ? JSON.parse(readFileSync(SKIP_FILE, 'utf8')) : {};
if (flag('--skip')) {
  const i = argv.indexOf('--skip'), id = argv[i + 1], reason = argv[i + 2];
  if (!/^\d+$/.test(id || '') || !reason || reason.startsWith('--')) {
    console.error('usage: blg-intake.mjs --skip <BLG id> "<why, in a sentence Luis can read>"');
    process.exit(1);
  }
  skipped[id] = { reason: reason.trim(), date: new Date().toISOString().slice(0, 10) };
  writeFileSync(SKIP_FILE, JSON.stringify(skipped, null, 2) + '\n', 'utf8');
  console.log(`BabyLoveGrowth: id ${id} is left out for good. Reason kept: ${reason.trim()}`);
  process.exit(0);
}

function readKey() {
  if (process.env.BABYLOVEGROWTH_API_KEY) return process.env.BABYLOVEGROWTH_API_KEY;
  const file = join(opt('--env') || ROOT, '.env');
  if (!existsSync(file)) return '';
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*BABYLOVEGROWTH_API_KEY\s*=\s*(.*?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  return '';
}
const KEY = readKey();
if (!KEY) {
  console.log('BabyLoveGrowth: no BABYLOVEGROWTH_API_KEY in .env, so nothing was read.');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
// The detail endpoint is rate limited. Wait as long as it asks, a few times.
async function api(path, attempt = 1) {
  const res = await fetch(API + path, { headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' } });
  if (res.status === 429 && attempt <= 6) {
    await sleep((Number(res.headers.get('retry-after')) || 10 * attempt) * 1000);
    return api(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`BabyLoveGrowth answered ${res.status} for ${path.replace(/\?.*$/, '')}`);
  return res.json();
}
async function listAll() {
  const out = [];
  for (let offset = 0; ; offset += 50) {
    const page = await api(`/articles?limit=50&offset=${offset}`);
    if (!Array.isArray(page) || !page.length) break;
    out.push(...page);
    if (page.length < 50) break;
  }
  return out;
}

// ─── What content/blog already has. An article counts as here whatever its
// status: a folded one was taken down on purpose and must not come back.
const here = { slugs: new Set(), ids: new Set(), blgDates: new Set() };
for (const n of readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const [m] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
  here.slugs.add(m.slug || m.key);
  here.slugs.add(m.key);
  if (m.sourceId) here.ids.add(String(m.sourceId));
  if (m.source === 'blg' && m.status !== 'folded') here.blgDates.add(m.date);
}
const isHere = a => here.ids.has(String(a.id)) || here.slugs.has(keyOf(a)) || !!skipped[String(a.id)];

// ─── Text ───────────────────────────────────────────────────────────────────
// "2–3" keeps a hyphen, a dash after a full stop becomes " - ", any other
// becomes a comma. The same rule the June articles were cleaned with.
const dedash = s => String(s ?? '')
  .replace(/([\d%])\s*[–—]\s*(?=[$\d])/g, '$1-')
  .replace(/([.!?'"”])\s+[–—]\s*/g, '$1 - ')
  .replace(/\s*[–—]\s*/g, ', ')
  .replace(/[–—]/g, '-');
// BLG writes "Bkrdy" and sometimes the old name. Addresses are left alone: a
// name with a dot, slash, dash or @ beside it is part of a link, not prose.
const brand = s => String(s ?? '')
  .replace(/(?<![\w./@-])Book\s?Ready(?![\w.-])/g, 'BKRDY')
  .replace(/(?<![\w./@-])[Bb]krdy(?![\w.-])/g, 'BKRDY');
const clean = s => brand(dedash(s)).replace(/\s+/g, ' ').trim();
const keyOf = a => String(a.slug || a.title || a.id).toLowerCase().normalize('NFD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A link to our own site becomes a path with its final slash, which is what
// draft-check looks for and what every page on the site is.
function ownPath(url) {
  const m = url.match(/^https?:\/\/(?:www\.)?bkrdy\.com(\/[^?#\s]*)?([?#]\S*)?$/i);
  if (!m) return null;
  let p = m[1] || '/';
  if (!p.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(p)) p += '/';
  return p + (m[2] && m[2].startsWith('#') ? m[2] : '');
}

const DROP_SECTIONS = /^(table of contents|contents|recommended|recommended reading|related articles)$/i;

function convert(a) {
  const dropped = { pictures: 0, sections: [] };
  const lines = String(a.content_markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let skipping = false, sawTitle = false;
  for (let raw of lines) {
    let line = raw.replace(/\s+$/, '');
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const text = h[2].replace(/[#*_`]/g, '').trim();
      // The first top-level heading is the title, which the template prints.
      if (h[1].length === 1 && !sawTitle) { sawTitle = true; skipping = false; continue; }
      if (h[1].length <= 2) {
        skipping = DROP_SECTIONS.test(text);
        if (skipping) { dropped.sections.push(text); continue; }
      }
      if (skipping) continue;
      line = (h[1].length <= 2 ? '## ' : '### ') + text;
    } else if (skipping) continue;
    // Pictures. BLG's are generated, which the art direction rules out, and
    // the article gets its photo the way every other one does.
    if (/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(line)) { dropped.pictures++; continue; }
    const before = line;
    line = line.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    if (line !== before) dropped.pictures++;
    if (/^\s*```/.test(line)) continue;
    line = line.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?[a-z][^>]*>/gi, '');
    line = line.replace(/^(\s*)[*+]\s+/, '$1- ');
    line = line.replace(/\]\((https?:\/\/[^)\s]+)\)/g, (all, url) => {
      const p = ownPath(url);
      return p ? `](${p})` : all;
    });
    // The words, never the addresses: fix the name and the dashes outside of
    // link targets only.
    line = line.split(/(\]\([^)\s]*\))/).map((part, i) => (i % 2 ? part : brand(dedash(part)))).join('');
    out.push(line);
  }
  const body = out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const links = [...body.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
  return {
    body, dropped,
    outside: [...new Set(links.filter(u => /^https?:\/\//.test(u)))],
    own: [...new Set(links.filter(u => u.startsWith('/')))],
  };
}

// A first guess at the pillar, so the draft is complete. The editor confirms it.
function pillarFor(text) {
  const t = text.toLowerCase();
  if (/alternative|\bvs\b|booksy|vagaro|fresha|glossgenius|square|acuity|styleseat|\bsoftware\b|\bapps?\b/.test(t)) return 'switching';
  if (/deposit|pric|cost|fee|payment|pay link|gift card|tips?\b|refund|revenue|how much/.test(t)) return 'money';
  if (/rebook|reminder|review|loyal|reward|retention|waitlist|client (record|note|profile)|regulars?/.test(t)) return 'coming-back';
  if (/schedul|calendar|hours|time off|capacity|staff|time slot/.test(t)) return 'the-week';
  if (/\bstart|open a|booth|independent|business plan|ownership|own a\b/.test(t)) return 'going-solo';
  return 'your-site';
}

// The next weekday, at least two days out so there is time to read it, that
// has no other BLG article on it. It sits beside the day's own article.
function nextDate() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  for (let i = 0; i < 400; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (d.getDay() !== 0 && d.getDay() !== 6 && !here.blgDates.has(iso)) { here.blgDates.add(iso); return iso; }
    d.setDate(d.getDate() + 1);
  }
  throw new Error('no free date found');
}

const oneLine = s => String(s ?? '').replace(/\s+/g, ' ').trim();
// A value with a colon in it is quoted, the way the other articles do it.
const fm = v => (/:\s|^["'[{>|*&!%@`#]/.test(v) ? JSON.stringify(v) : v);

function draft(a) {
  const key = keyOf(a);
  const c = convert(a);
  const title = clean(a.title);
  const kws = [a.seedKeyword, ...(Array.isArray(a.keywords) ? a.keywords : [])]
    .map(k => oneLine(k).toLowerCase()).filter(Boolean);
  const keywords = [...new Set(kws)].slice(0, 4).join(', ');
  const meta = [
    ['key', key], ['section', 'blog'], ['slug', key], ['title', title], ['metaTitle', `${title} | BKRDY`],
    ['description', clean(a.meta_description || a.excerpt || '')], ['date', nextDate()],
    ['pillar', pillarFor(`${a.seedKeyword || ''} ${title}`)], ['keywords', keywords],
    ['status', 'draft'], ['source', 'blg'], ['sourceId', String(a.id)],
  ];
  const text = `---\n${meta.map(([k, v]) => `${k}: ${fm(oneLine(v))}`).join('\n')}\n---\n\n${c.body}`;
  return { key, text, title, date: meta.find(x => x[0] === 'date')[1], words: markdown(c.body).words, ...c };
}

// ─── Run ────────────────────────────────────────────────────────────────────
// No process.exit() once a request has been made: on Windows it aborts while
// the connection is still closing. Returning lets Node finish cleanly.
async function main() {
  let todo;
  if (ONE) {
    const a = await api(`/articles/${ONE}`);
    if (isHere(a) && !(AGAIN && OUT)) {
      console.log(skipped[String(a.id)]
        ? `BabyLoveGrowth: "${a.title}" was left out on purpose (${skipped[String(a.id)].reason}). Nothing written.`
        : `BabyLoveGrowth: "${a.title}" is already in content/blog as ${keyOf(a)}. Nothing written.`);
      return;
    }
    todo = [a];
  } else {
    const all = await listAll();
    // Oldest first, so the order they were written in is the order they are read in.
    todo = all.filter(a => !isHere(a)).sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)));
    const left = all.filter(a => skipped[String(a.id)]).length;
    console.log(`BabyLoveGrowth holds ${all.length} articles; ${all.length - todo.length - left} already in content/blog, ${left} left out on purpose, ${todo.length} new.`);
  }

  if (LIST) {
    for (const a of todo) console.log(`  ${String(a.created_at || '').slice(0, 10)}  id ${a.id}  ${keyOf(a)}  (search: ${a.seedKeyword || 'none given'})`);
    return;
  }
  if (!todo.length) return;

  const dir = OUT ? resolve(OUT) : SRC;
  mkdirSync(dir, { recursive: true });
  const batch = ONE ? todo : todo.slice(0, LIMIT);
  for (const s of batch) {
    const a = s.content_markdown ? s : await api(`/articles/${s.id}`);
    if (!a.content_markdown) { console.log(`  skipped id ${a.id}: BabyLoveGrowth sent no text for it`); continue; }
    const d = draft(a);
    writeFileSync(join(dir, d.key + '.md'), d.text, 'utf8');
    console.log(`\nDRAFT ${d.key}  (BLG id ${a.id})  dated ${d.date}  ${d.words} words`);
    console.log(`  title: ${d.title}`);
    console.log(`  taken out: ${d.dropped.pictures} pictures${d.dropped.sections.length ? ', sections: ' + d.dropped.sections.join(', ') : ''}`);
    console.log(`  links to other sites (keep these, they are the exchange): ${d.outside.length ? d.outside.join('  ') : 'none'}`);
    console.log(`  links to our own pages: ${d.own.length}`);
    if (batch.length > 1) await sleep(1500);
  }
  if (!ONE && todo.length > batch.length) console.log(`\n${todo.length - batch.length} more are waiting for the next run.`);
  console.log(`\nNext: edit each draft as "BabyLoveGrowth articles" in blog-loop.md says, then node content/blog-tools/draft-check.mjs <key>.`);
}
main().catch(e => { console.error(e?.message || e); process.exitCode = 1; });
