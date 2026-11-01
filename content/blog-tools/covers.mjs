// One share image per article: images/blog/<key>-share.jpg, 1200x630.
//   SHARP=<path to sharp> node content/blog-tools/covers.mjs [key ...]
//
// This is the link preview people see when an article is shared in a WhatsApp
// group, an Instagram DM, on Facebook or in Google's results, so it is usually
// the first and sometimes the only BKRDY design a reader meets.
//
// The night look of bkrdy.com (card.mjs): the topic and the headline on the dark
// ground, Kito in one of the site's two paintings on the right. The painting
// alternates by article, so a run of shares does not look like one repeated
// image. The headline shrinks until it fits four lines.
//
// Drafts get a share image too, so it is ready the day the article goes live.
// Hostinger caches images for a year: a published card is never overwritten under
// the same name (until 2026-11-01 the cards were the cream <key>-og.png).
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter } from './md.mjs';
import { PILLARS } from './build.mjs';
import { renderCard } from './card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const sharp = createRequire(import.meta.url)(process.env.SHARP);

const only = new Set(process.argv.slice(2));
mkdirSync(join(ROOT, 'images', 'blog'), { recursive: true });
const label = id => (PILLARS.find(p => p.id === id) || PILLARS[1]).label;

const files = readdirSync(SRC).filter(n => n.endsWith('.md'));
const keys = files.map(n => n.replace(/\.md$/, '')).sort();
const posts = files.map(n => frontMatter(readFileSync(join(SRC, n), 'utf8'))[0])
  .map(m => ({ ...m, key: m.key || '' }))
  .filter(m => !only.size || only.has(m.key));

for (const m of posts) {
  if (!m.key) continue;
  const art = keys.indexOf(m.key) % 2 ? 'evening' : 'dusk';
  await renderCard(sharp, ROOT, {
    eyebrow: label(m.pillar),
    title: m.title,
    url: `bkrdy.com/${m.section === 'guides' ? 'guides' : 'blog'}`,
    art,
  }, join(ROOT, 'images', 'blog', `${m.key}-share.jpg`));
  console.log(`images/blog/${m.key}-share.jpg`);
}
