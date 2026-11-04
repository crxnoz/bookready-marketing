// One share image per page (everything except the articles, which covers.mjs
// does): images/og/v2/<page>.jpg, 1200x630, from the page's own eyebrow and
// headline (card.mjs). Then points the page's og:image and twitter:image at it.
//   SHARP=<path to sharp> node content/blog-tools/share.mjs [page ...]
// A page is its path without slashes: home, pricing, platform-booking-calendar.
// Template pages point at images/og/v3/template-<key>.jpg when that file exists
// (content/template-covers/share.js makes those).
//
// Hostinger serves images with a one-year immutable cache: a changed card needs a
// new file name (v3/...), never an overwrite of a published one.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from './card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'images', 'og', 'v2');
const ORIGIN = 'https://bkrdy.com';
const sharp = createRequire(import.meta.url)(process.env.SHARP);
const only = new Set(process.argv.slice(2));
mkdirSync(OUT, { recursive: true });

const SKIP = new Set(['content', 'node_modules', '.git', '.scratch', '.claude', 'images']);
const pages = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!SKIP.has(n)) walk(p); continue; }
    if (n !== 'index.html' && !(dir === ROOT && n === '404.html')) continue;
    const rel = relative(ROOT, p).replace(/\\/g, '/');
    if (/^(blog|guides)\/[^/]+\/index\.html$/.test(rel)) continue; // articles: covers.mjs
    pages.push(rel);
  }
})(ROOT);

const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim();
const nameOf = rel => rel === 'index.html' ? 'home' : rel === '404.html' ? '404' : rel.replace(/\/index\.html$/, '').replace(/\//g, '-');
const urlOf = rel => 'bkrdy.com' + (rel === 'index.html' || rel === '404.html' ? '' : '/' + rel.replace(/\/index\.html$/, ''));

// Cards whose words are not on the page itself.
const OVERRIDE = {
  home: { eyebrow: 'AI for your booking business', title: 'The calm way to run a busy book.' },
  blog: { eyebrow: 'The BKRDY blog', title: 'What we learn running booking sites for beauty pros.', url: 'bkrdy.com/blog' },
  guides: { eyebrow: 'BKRDY guides', title: 'Playbooks for the jobs that keep coming back.', url: 'bkrdy.com/guides' },
};
const EVENING = new Set(['platform-booking-after-hours', 'blog', '404']);

let made = 0, pointed = 0;
for (const rel of pages.sort()) {
  const name = nameOf(rel);
  const file = join(ROOT, rel);
  let html = readFileSync(file, 'utf8');
  if (!/property="og:image"/.test(html)) continue;
  const tpl = rel.match(/^templates\/([^/]+)\/index\.html$/);
  let img;
  if (tpl) {
    if (!existsSync(join(ROOT, 'images', 'og', 'v3', `template-${tpl[1]}.jpg`))) continue;
    img = `${ORIGIN}/images/og/v3/template-${tpl[1]}.jpg`;
  } else {
    img = `${ORIGIN}/images/og/v2/${name}.jpg`;
    if (!only.size || only.has(name)) {
      const eb = (html.match(/<p class="[^"]*v-eyebrow[^"]*">([\s\S]*?)<\/p>/) || [])[1];
      const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
      const card = { eyebrow: eb ? strip(eb) : '', title: h1 ? strip(h1) : 'BKRDY', url: urlOf(rel), art: EVENING.has(name) ? 'evening' : 'dusk', ...OVERRIDE[name] };
      await renderCard(sharp, ROOT, card, join(OUT, `${name}.jpg`));
      made++;
      console.log(`images/og/v2/${name}.jpg  ${card.eyebrow} | ${card.title}`);
    }
  }
  // blog/ and guides/ hubs are written by build.mjs, which sets their card itself
  if (rel === 'blog/index.html' || rel === 'guides/index.html') continue;
  const next = html
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`);
  if (next !== html) { writeFileSync(file, next); pointed++; }
}
console.log(`${made} cards made, ${pointed} pages pointed at their card`);
