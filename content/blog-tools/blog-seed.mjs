// Prepares a batch for the review page: one JSON file per document, ready for
// ArtifactData batch writes.
//   node content/blog-tools/blog-seed.mjs <YYYY-MM> <out-dir> [seo.json] [keywords.json] [notes.json] [--keys a,b,c]
//
// Writes <out-dir>/posts/<YYYY-MM>~<key>.json for the drafts named in --keys
// (default: every draft dated in that month), and <out-dir>/months/<YYYY-MM>.json
// with the research behind the batch.
//
// notes.json (optional): { "findings": ["..."], "gsc": { "connected": false, "note": "..." } }
// The month document is what the review page's search terms report and site
// check panels read. See content/blog-tools/blog-loop.md.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter, markdown } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const argv = process.argv.slice(2);
const ki = argv.indexOf('--keys');
const KEYS = ki >= 0 ? new Set(argv.splice(ki, 2)[1].split(',').map(s => s.trim()).filter(Boolean)) : null;
const [month, out, seoFile, kwFile, notesFile] = argv;
if (!/^\d{4}-\d{2}$/.test(month || '') || !out) {
  console.error('usage: blog-seed.mjs <YYYY-MM> <out-dir> [seo.json] [keywords.json] [notes.json] [--keys a,b,c]');
  process.exit(1);
}
mkdirSync(join(out, 'posts'), { recursive: true });
mkdirSync(join(out, 'months'), { recursive: true });

const written = [];
for (const n of readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const [m, body] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
  if (m.status !== 'draft') continue;
  if (KEYS ? !KEYS.has(m.key) : !String(m.date).startsWith(month)) continue;
  const r = markdown(body);
  const id = `${month}~${m.key}`;
  writeFileSync(join(out, 'posts', id + '.json'), JSON.stringify({
    month, key: m.key, date: m.date, pillar: m.pillar || '', section: m.section || 'blog',
    keywords: m.keywords || '', status: 'pending', note: '',
    title: m.title, desc: m.description, slug: m.slug || m.key,
    body, words: r.words, minutes: Math.max(2, Math.round(r.words / 225)),
    url: `/${m.section === 'guides' ? 'guides' : 'blog'}/${m.slug || m.key}/`,
    photoTerms: (m.photoTerms || '').split('|').map(s => s.trim()).filter(Boolean),
    photoFile: `${m.key}.jpg`,
    graphic: /^!\[/m.test(body),
    createdAt: new Date().toISOString(),
  }));
  written.push(id);
}

const doc = { id: month, createdAt: new Date().toISOString() };
const notes = notesFile && existsSync(notesFile) ? JSON.parse(readFileSync(notesFile, 'utf8')) : {};

if (seoFile && existsSync(seoFile)) {
  const s = JSON.parse(readFileSync(seoFile, 'utf8'));
  doc.seo = {
    date: s.date, pages: s.pages, indexable: s.indexable,
    errors: s.errors.length, warnings: s.warnings.length,
    // Plain sentences for the page, not raw machine output.
    items: notes.findings || [
      ...s.errors.flatMap(e => e.msgs.map(m => `${e.url}: ${m}`)),
      ...s.warnings.flatMap(e => e.msgs.map(m => `${e.url}: ${m}`)),
    ].slice(0, 14),
  };
}
if (kwFile && existsSync(kwFile)) {
  const kw = JSON.parse(readFileSync(kwFile, 'utf8'));
  doc.report = {
    date: kw.date, provider: kw.provider,
    rows: kw.rows.filter(r => r.volume != null)
      .map(r => ({ term: r.term, volume: r.volume, difficulty: r.difficulty, cpc: r.cpc, covered: r.covered })),
  };
}
if (notes.gsc) doc.gsc = notes.gsc;
writeFileSync(join(out, 'months', month + '.json'), JSON.stringify(doc));

console.log(JSON.stringify({
  month, posts: written.length, keys: written,
  research: { seo: !!doc.seo, report: doc.report?.rows.length || 0, gsc: !!doc.gsc },
}, null, 1));
