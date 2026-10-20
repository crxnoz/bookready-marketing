// Site check for bkrdy.com: the things that quietly break a page's chance of
// ranking, and the things that break a page outright.
//   node content/blog-tools/seo-check.mjs [--blog] [--json <file>]
//
// Reads the built HTML in the web root. Nothing is changed; problems are
// printed as a Markdown report for the monthly run's email.
//   --blog   only /blog/ and /guides/
//   --json   also write the findings as JSON (for the review page)
//
// Exit code is 1 when there is at least one error, so a publish run can stop
// before pushing. Warnings never fail the run.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BLOG_ONLY = process.argv.includes('--blog');
const JSON_OUT = (() => { const i = process.argv.indexOf('--json'); return i > 0 ? process.argv[i + 1] : null; })();
const ORIGIN = 'https://bkrdy.com';
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'content', '.scratch', 'images', 'docs']);

// ── collect pages ────────────────────────────────────────────────────────────
function pages(dir = ROOT, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name === 'index.html' || (dir === ROOT && e.name.endsWith('.html'))) out.push(p);
  }
  return out;
}
const urlOf = f => {
  const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
  return rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
};

const errors = [], warnings = [], notes = [];
const err = (url, msg) => errors.push({ url, msg });
const warn = (url, msg) => warnings.push({ url, msg });

const all = pages().filter(f => {
  const u = urlOf(f);
  if (BLOG_ONLY) return u.startsWith('/blog/') || u.startsWith('/guides/');
  return !/^\/(404|_stock-compare|personas-stock)/.test(u);
});

// ── per page ─────────────────────────────────────────────────────────────────
const seenTitle = new Map(), seenDesc = new Map();
const linked = new Set();
const docs = [];

for (const file of all) {
  const url = urlOf(file);
  const html = readFileSync(file, 'utf8');
  const pick = re => (html.match(re) || [])[1] || '';
  const title = pick(/<title>([\s\S]*?)<\/title>/i).trim();
  const desc = pick(/<meta name="description" content="([^"]*)"/i).trim();
  const canon = pick(/<link rel="canonical" href="([^"]*)"/i).trim();
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const noindex = /<meta name="robots"[^>]*noindex/i.test(html);
  docs.push({ url, title, desc, noindex });

  if (!title) err(url, 'no title');
  else if (title.length > 65) warn(url, `title is ${title.length} characters (Google shows about 60)`);
  if (!desc) err(url, 'no meta description');
  else if (desc.length < 80 || desc.length > 165) warn(url, `description is ${desc.length} characters (aim for 120 to 155)`);
  if (!canon) err(url, 'no canonical link');
  else if (canon !== ORIGIN + url) warn(url, `canonical points at ${canon}`);
  if (!h1s.length) err(url, 'no h1');
  else if (h1s.length > 1) warn(url, `${h1s.length} h1 headings`);

  if (title) { (seenTitle.get(title) || seenTitle.set(title, []).get(title)).push(url); }
  if (desc) { (seenDesc.get(desc) || seenDesc.set(desc, []).get(desc)).push(url); }

  // Internal links must resolve to something that exists on disk.
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (/\.(css|js|png|jpe?g|webp|svg|ico|xml|txt|json|pdf|woff2?)$/i.test(href)) continue;
    linked.add(href);
    const target = join(ROOT, href, 'index.html');
    const asFile = join(ROOT, href);
    if (!existsSync(target) && !(existsSync(asFile) && statSync(asFile).isFile())) err(url, `link to ${href} has no page`);
  }
  // Images must exist too; a missing one is a blank space on a live page.
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = m[1].replace(/^https?:\/\/(www\.)?bkrdy\.com/, '').split('?')[0];
    if (!src.startsWith('/')) continue;
    if (!existsSync(join(ROOT, src))) err(url, `image ${src} is missing`);
  }
  // House style.
  if ((url.startsWith('/blog/') || url.startsWith('/guides/'))) {
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
    if (body.includes('—')) warn(url, 'an em dash is in the copy');
  }
}

for (const [t, urls] of seenTitle) if (urls.length > 1) warn(urls[0], `the same title is on ${urls.length} pages: ${urls.join(', ')}`);
for (const [d, urls] of seenDesc) if (urls.length > 1) warn(urls[0], `the same description is on ${urls.length} pages: ${urls.join(', ')}`);

// ── sitemap ──────────────────────────────────────────────────────────────────
if (!BLOG_ONLY && existsSync(join(ROOT, 'sitemap.xml'))) {
  const xml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const listed = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(ORIGIN, '')));
  const indexable = docs.filter(d => !d.noindex).map(d => d.url);
  const missing = indexable.filter(u => !listed.has(u));
  const extra = [...listed].filter(u => !indexable.includes(u));
  if (missing.length) warn('/sitemap.xml', `${missing.length} pages are not in the sitemap: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' and more' : ''}`);
  for (const u of extra) err('/sitemap.xml', `lists ${u}, which has no page`);
  notes.push(`Sitemap lists ${listed.size} urls for ${indexable.length} indexable pages.`);
}

// Orphans: a page nothing links to is a page Google reaches slowly, if at all.
const orphans = docs.filter(d => d.url !== '/' && !linked.has(d.url) && !linked.has(d.url.replace(/\/$/, '')));
if (orphans.length) warn('/', `${orphans.length} pages have no link pointing at them: ${orphans.slice(0, 8).map(o => o.url).join(', ')}${orphans.length > 8 ? ' and more' : ''}`);

// ── report ───────────────────────────────────────────────────────────────────
const group = list => {
  const by = new Map();
  for (const x of list) (by.get(x.url) || by.set(x.url, []).get(x.url)).push(x.msg);
  return [...by.entries()];
};
const out = [`# Site check · ${new Date().toISOString().slice(0, 10)}`, '',
  `**${all.length} pages** (${docs.filter(d => !d.noindex).length} indexable) · **${errors.length} errors** · **${warnings.length} warnings**`, ''];
for (const n of notes) out.push(n, '');
for (const [label, list] of [['Errors', errors], ['Warnings', warnings]]) {
  if (!list.length) continue;
  out.push(`## ${label}`, '');
  for (const [url, msgs] of group(list)) out.push(`- **${url}** (${msgs.length})`, ...msgs.map(m => `  - ${m}`));
  out.push('');
}
if (!errors.length && !warnings.length) out.push('Nothing to fix.', '');
console.log(out.join('\n'));

if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({
  date: new Date().toISOString().slice(0, 10), pages: all.length,
  indexable: docs.filter(d => !d.noindex).length,
  errors: group(errors).map(([url, msgs]) => ({ url, msgs })),
  warnings: group(warnings).map(([url, msgs]) => ({ url, msgs })),
}, null, 1));

process.exit(errors.length ? 1 : 0);
