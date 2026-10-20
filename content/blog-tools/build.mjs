// Builds the BKRDY blog from Markdown.
//   node content/blog-tools/build.mjs [--quiet]
//
// Sources: content/blog/<key>.md (gitignored from nothing, but /content/ is
// 403'd and robots-disallowed, and every .md is 403'd, so a draft is not
// reachable even by its direct URL).
//
// A post is written to the public web root only when `status: published` AND
// its `date` has arrived. Drafts and future-dated posts produce no directory,
// no sitemap entry and no llms.txt line, so the approval gate in
// content/blog-tools/blog-loop.md is the only way anything goes live.
//
// Output:
//   <section>/<slug>/index.html   the article (section is `blog` or `guides`)
//   blog/index.html, guides/index.html   the hubs
//   sitemap.xml   the /blog/ and /guides/ entries, rewritten in place
//   llms.txt      the managed article list between its two markers
//
// Nav and footer are lifted at build time from pricing/index.html, a page this
// script does not own, so the blog's chrome follows the rest of the site
// without a copy of it living here to go stale.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter, markdown, stripTags, slugify } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const ORIGIN = 'https://bkrdy.com';
const SHELL_SOURCE = join(ROOT, 'pricing', 'index.html');
const QUIET = process.argv.includes('--quiet');
const TODAY = process.env.BLOG_TODAY || new Date().toISOString().slice(0, 10);

export const PILLARS = [
  { id: 'switching', label: 'Switching', blurb: 'Leaving a platform, and what it really costs to stay.' },
  { id: 'money', label: 'Money on the table', blurb: 'Deposits, no-show fees, pricing, and the cash you are not collecting.' },
  { id: 'coming-back', label: 'Getting them back', blurb: 'Rebooking, reminders, waitlists, reviews, client records.' },
  { id: 'your-site', label: 'Your own site', blurb: 'The booking page, the link in bio, the domain that is yours.' },
  { id: 'the-week', label: 'Running the week', blurb: 'Calendars, capacity, drops, after-hours, the shape of your days.' },
  { id: 'going-solo', label: 'Going solo', blurb: 'Booth rent, going independent, the first ninety days.' },
];
const PILLAR = id => PILLARS.find(p => p.id === id) || PILLARS[1];

const SECTIONS = {
  blog: { path: 'blog', title: 'Notes', lead: 'What we learn from running booking sites for beauty pros. One a day, Monday to Friday, no filler.', crumb: 'Blog' },
  guides: { path: 'guides', title: 'Guides', lead: 'Step by step playbooks for the jobs that keep coming back: deposits, no-shows, rebooking, reviews, and leaving a platform you have outgrown.', crumb: 'Guides' },
};

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const log = (...a) => { if (!QUIET) console.log(...a); };
const fmtDate = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch { return d; } };
const shortDate = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); } catch { return d; } };

// ── the site shell ───────────────────────────────────────────────────────────
function shell() {
  const src = readFileSync(SHELL_SOURCE, 'utf8');
  const nav = src.match(/[ \t]*<header class="br-nav"[\s\S]*?<\/header>/);
  const foot = src.match(/[ \t]*<footer class="br-footer"[\s\S]*?<\/footer>/);
  if (!nav || !foot) throw new Error(`could not lift the nav and footer out of ${SHELL_SOURCE}`);
  return { nav: nav[0], footer: foot[0] };
}

// ── posts ────────────────────────────────────────────────────────────────────
export function loadPosts() {
  if (!existsSync(SRC)) return [];
  return readdirSync(SRC).filter(n => n.endsWith('.md')).map(n => {
    const [meta, body] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
    const key = meta.key || n.replace(/\.md$/, '');
    const section = SECTIONS[meta.section] ? meta.section : 'blog';
    // The lede is everything before the first `##`: the opening paragraphs and
    // the short-answer block. The photo is placed between it and the body, so
    // the article always opens with words rather than stock photography.
    const cut = body.search(/^##\s+/m);
    const lede = cut < 0 ? body : body.slice(0, cut);
    const rest = cut < 0 ? '' : body.slice(cut);
    const L = markdown(lede), R = markdown(rest);
    return {
      ...meta, key, section, body,
      slug: meta.slug || key,
      pillar: PILLAR(meta.pillar).id,
      status: meta.status || 'published',
      lede: L.html, html: R.html, faq: R.faq.length ? R.faq : L.faq,
      headings: R.headings.filter(h => !/^(questions|faq)$/i.test(h.text)),
      words: L.words + R.words, minutes: Math.max(2, Math.round((L.words + R.words) / 225)),
      url: `/${SECTIONS[section].path}/${meta.slug || key}/`,
    };
  });
}
const live = p => p.status === 'published' && String(p.date || '9999') <= TODAY;
const byDate = (a, b) => String(b.date).localeCompare(String(a.date));

// ── one article ──────────────────────────────────────────────────────────────
function photoFigure(p) {
  const big = `/images/blog/${p.photo}-photo-1600.webp`;
  if (!p.photo || !existsSync(join(ROOT, big.slice(1)))) return '';
  return `<figure class="bq-photo"><img src="${big}" srcset="/images/blog/${p.photo}-photo-800.webp 800w, ${big} 1600w"` +
    ` sizes="(max-width: 760px) calc(100vw - 32px), 680px" width="1600" height="900" alt="${esc(p.photoAlt || '')}" fetchpriority="high">` +
    (p.photoCaption ? `<figcaption>${esc(p.photoCaption)}</figcaption>` : '') + '</figure>';
}
// The 720px copy of a graphic is served to phones when it exists.
const withGraphicSrcset = html => html.replace(/<img src="\/images\/blog\/([a-z0-9-]+)\.webp"/g, (all, f) =>
  existsSync(join(ROOT, 'images', 'blog', `${f}-720.webp`))
    ? `<img src="/images/blog/${f}.webp" srcset="/images/blog/${f}-720.webp 720w, /images/blog/${f}.webp 1200w" sizes="(max-width: 760px) calc(100vw - 32px), 560px"`
    : all);

function ogImage(p) {
  const f = `/images/blog/${p.key}-og.png`;
  return existsSync(join(ROOT, f.slice(1))) ? ORIGIN + f : `${ORIGIN}/images/hero/hero.webp`;
}

function articlePage(p, all, sh) {
  const S = SECTIONS[p.section], pil = PILLAR(p.pillar);
  const related = all.filter(x => x.key !== p.key && x.pillar === p.pillar).sort(byDate)
    .concat(all.filter(x => x.key !== p.key && x.pillar !== p.pillar).sort(byDate)).slice(0, 2);
  const og = ogImage(p);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description,
      datePublished: p.date, dateModified: p.updated || p.date, url: ORIGIN + p.url, image: og,
      author: { '@type': 'Organization', name: 'BKRDY', url: ORIGIN },
      publisher: { '@type': 'Organization', name: 'BKRDY', url: ORIGIN },
      mainEntityOfPage: { '@type': 'WebPage', '@id': ORIGIN + p.url }, articleSection: pil.label },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: S.crumb, item: `${ORIGIN}/${S.path}/` },
      { '@type': 'ListItem', position: 3, name: p.title, item: ORIGIN + p.url }] },
  ];
  // The FAQ schema is generated from the Questions section, so it can only ever
  // say what the page says.
  if (p.faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: p.faq.map(f => ({ '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a.join(' ')) } })) });

  const faqHtml = p.faq.length ? `<div class="bq-faq">${p.faq.map(f =>
    `<details class="bq-faq__i"><summary><span>${esc(f.q)}</span></summary><div class="bq-faq__a">${f.a.join('')}</div></details>`).join('')}</div>` : '';

  const body = `
  <article class="bq" data-bq-article>
    <div class="bq-prog" aria-hidden="true"><i data-bq-bar></i></div>
    <div class="bq-wrap">
      <p class="bq-crumb"><a href="/${S.path}/">${S.crumb}</a> <span aria-hidden="true">/</span> <em>${esc(pil.label)}</em></p>
      <h1 class="bq-h">${esc(p.title)}</h1>
      <p class="bq-meta"><time datetime="${esc(p.date)}">${fmtDate(p.date)}</time> <span aria-hidden="true">·</span> <span>${p.minutes} min read</span></p>
      <div class="bq-lede">${p.lede}</div>
      ${photoFigure(p)}
      <div class="bq-body">
${withGraphicSrcset(p.html)}
${faqHtml}
      </div>

      <aside class="bq-cta">
        <h2>Set it up once, let the page do it</h2>
        <p>Starter is free and gives you a real booking site on your own address. Solo is $21 a month when you want deposits, card on file and unlimited texts.</p>
        <div class="bq-cta__b">
          <a class="bq-cta__p" href="https://app.bkrdy.me/register">Start free</a>
          <a class="bq-cta__s" href="/templates/">See the templates</a>
        </div>
      </aside>

      ${related.length ? `<nav class="bq-next" aria-labelledby="bq-next-h">
        <p class="bq-next__h" id="bq-next-h">Read next</p>
        ${related.map(r => `<a href="${r.url}"><em>${esc(PILLAR(r.pillar).label)}</em><b>${esc(r.title)}</b><s>${esc(r.description)}</s></a>`).join('\n        ')}
      </nav>` : ''}
    </div>
  </article>`;

  return page({
    title: (p.metaTitle || `${p.title} | BKRDY`),
    description: p.description,
    path: p.url, og, ogType: 'article', ld, body, sh,
    head: `  <meta property="article:published_time" content="${esc(p.date)}" />\n` +
          `  <meta property="article:section" content="${esc(pil.label)}" />\n`,
  });
}

// ── a hub ────────────────────────────────────────────────────────────────────
function hubPage(section, posts, sh) {
  const S = SECTIONS[section];
  const list = posts.filter(p => p.section === section).sort(byDate);
  const [feat, ...rest] = list;
  const used = PILLARS.filter(x => list.some(p => p.pillar === x.id));
  const row = p => `<a class="bq-row" href="${p.url}" data-pillar="${esc(p.pillar)}">` +
    `<em>${esc(PILLAR(p.pillar).label)} <span aria-hidden="true">·</span> ${shortDate(p.date)}</em>` +
    `<b>${esc(p.title)}</b><s>${esc(p.description)}</s></a>`;

  const body = `
  <div class="bq bq-hub">
    <div class="bq-wrap">
      <h1 class="bq-hub__h">${esc(S.title)}</h1>
      <p class="bq-hub__lead">${esc(S.lead)}</p>
      ${used.length > 1 ? `<div class="bq-chips" role="group" aria-label="Filter by topic">
        <button type="button" class="is-on" data-filter="all" aria-pressed="true">All</button>
        ${used.map(x => `<button type="button" data-filter="${x.id}" aria-pressed="false">${esc(x.label)}</button>`).join('\n        ')}
      </div>` : ''}
      ${feat ? `<a class="bq-feat" href="${feat.url}" data-pillar="${esc(feat.pillar)}">
        ${existsSync(join(ROOT, 'images', 'blog', `${feat.key}-og.png`)) ? `<img src="/images/blog/${feat.key}-og.png" width="1200" height="630" alt="" loading="eager">` : ''}
        <em>${esc(PILLAR(feat.pillar).label)} <span aria-hidden="true">·</span> ${shortDate(feat.date)}</em>
        <b>${esc(feat.title)}</b><s>${esc(feat.description)}</s>
      </a>` : '<p class="bq-hub__empty">The first articles are being written.</p>'}
      <div class="bq-rows">
        ${rest.map(row).join('\n        ')}
      </div>
      <p class="bq-hub__none" hidden>Nothing in that topic yet.</p>
    </div>
  </div>`;

  const ld = [
    { '@context': 'https://schema.org', '@type': 'Blog', name: `BKRDY ${S.title}`, url: `${ORIGIN}/${S.path}/`,
      description: S.lead,
      blogPost: list.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: ORIGIN + p.url, datePublished: p.date })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: S.crumb, item: `${ORIGIN}/${S.path}/` }] },
  ];
  return page({ title: `${S.title} | BKRDY`, description: S.lead, path: `/${S.path}/`,
    og: `${ORIGIN}/images/hero/hero.webp`, ogType: 'website', ld, body, sh, head: '' });
}

// ── the page shell ───────────────────────────────────────────────────────────
const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700;800&display=swap';

function page({ title, description, path, og, ogType, ld, body, sh, head }) {
  return `<!doctype html>
<html lang="en">
<head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${ORIGIN}${path}" />

  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${ORIGIN}${path}" />
  <meta property="og:site_name" content="BKRDY" />
  <meta property="og:title" content="${esc(title.replace(/ \| BKRDY$/, ''))}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${og}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
${head}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title.replace(/ \| BKRDY$/, ''))}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${og}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${FONTS}" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="${FONTS}" /></noscript>
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/pages.css" />
  <link rel="stylesheet" href="/blog.css" />

${ld.map(x => `  <script type="application/ld+json">\n${JSON.stringify(x, null, 2).split('\n').map(l => '  ' + l).join('\n')}\n  </script>`).join('\n')}
</head>
<body class="br-article bq-page">

${sh.nav}
${body}

${sh.footer}

  <script src="/nav.js"></script>
  <script src="/blog.js"></script>
</body>
</html>
`;
}

// ── sitemap + llms.txt ───────────────────────────────────────────────────────
function updateSitemap(posts) {
  const f = join(ROOT, 'sitemap.xml');
  let xml = readFileSync(f, 'utf8');
  const eol = xml.includes('\r\n') ? '\r\n' : '\n';
  // Drop every /blog/ and /guides/ url, then write the live ones back in one
  // block before </urlset>. A draft therefore cannot leave a stale entry behind.
  xml = xml.replace(/^[ \t]*<url>(?:(?!<\/url>)[\s\S])*?<loc>https:\/\/bkrdy\.com\/(?:blog|guides)\/[^<]*<\/loc>[\s\S]*?<\/url>[ \t]*\r?\n/gm, '');
  const rows = [];
  for (const s of Object.keys(SECTIONS)) {
    const list = posts.filter(p => p.section === s).sort(byDate);
    if (!list.length) continue;
    rows.push(`  <url><loc>${ORIGIN}/${SECTIONS[s].path}/</loc><lastmod>${list[0].date}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    for (const p of list) rows.push(`  <url><loc>${ORIGIN}${p.url}</loc><lastmod>${p.updated || p.date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }
  xml = xml.replace(/[ \t]*<\/urlset>/, rows.join(eol) + eol + '</urlset>');
  writeFileSync(f, xml);
  return rows.length;
}

const LLMS_START = '<!-- blog:start -->';
const LLMS_END = '<!-- blog:end -->';
function updateLlms(posts) {
  const f = join(ROOT, 'llms.txt');
  let txt = readFileSync(f, 'utf8');
  const eol = txt.includes('\r\n') ? '\r\n' : '\n';
  const lines = posts.sort(byDate).slice(0, 40)
    .map(p => `- [${p.title}](${ORIGIN}${p.url}): ${p.description}`).join(eol);
  const block = `${LLMS_START}${eol}${lines}${eol}${LLMS_END}`;
  if (txt.includes(LLMS_START) && txt.includes(LLMS_END)) {
    txt = txt.replace(new RegExp(`${LLMS_START}[\\s\\S]*?${LLMS_END}`), block);
  } else {
    txt = txt.replace(/\s*$/, `${eol}${eol}## Articles${eol}${eol}${block}${eol}`);
  }
  writeFileSync(f, txt);
  return posts.length;
}

// ── run ──────────────────────────────────────────────────────────────────────
export function build() {
  const sh = shell();
  const all = loadPosts();
  const posts = all.filter(live);
  const held = all.filter(p => !live(p));

  // Which directories this script owns. Kept in one manifest under /content/
  // rather than a marker file in each public folder, so nothing strays into the
  // web root. A page that stops being live (unpublished, or its date was pushed
  // out) is removed, but only if this script is the one that created it.
  const mf = join(ROOT, 'content', 'blog-tools', 'generated.json');
  const owned = new Set(existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : []);

  for (const p of held) {
    const rel = `${SECTIONS[p.section].path}/${p.slug}`;
    if (owned.has(rel) && existsSync(join(ROOT, rel, 'index.html'))) {
      rmSync(join(ROOT, rel), { recursive: true, force: true });
      owned.delete(rel);
      log(`removed /${rel}/ (${p.status === 'draft' ? 'draft' : 'dated ' + p.date})`);
    }
  }

  let written = 0;
  for (const p of posts) {
    const rel = `${SECTIONS[p.section].path}/${p.slug}`;
    mkdirSync(join(ROOT, rel), { recursive: true });
    const html = articlePage(p, posts, sh);
    const out = join(ROOT, rel, 'index.html');
    const before = existsSync(out) ? readFileSync(out, 'utf8') : '';
    if (before !== html) { writeFileSync(out, html); written++; log(`wrote /${rel}/`); }
    owned.add(rel);
  }
  writeFileSync(mf, JSON.stringify([...owned].sort(), null, 1) + '\n');
  for (const s of Object.keys(SECTIONS)) {
    const f = join(ROOT, SECTIONS[s].path, 'index.html');
    const html = hubPage(s, posts, sh);
    if (!existsSync(f) || readFileSync(f, 'utf8') !== html) { writeFileSync(f, html); written++; log(`wrote /${SECTIONS[s].path}/`); }
  }
  const urls = updateSitemap(posts);
  updateLlms(posts);
  log(`\n${posts.length} live, ${held.length} held back (${held.filter(p => p.status === 'draft').length} drafts), ${written} files changed, ${urls} sitemap urls`);
  return { posts, held, written };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build.mjs')) build();
