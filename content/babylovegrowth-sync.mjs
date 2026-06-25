// BabyLoveGrowth → bkrdy.com /blog sync.
//
// Pulls AI-generated articles from the BabyLoveGrowth API and renders each
// into a site-native blog/<slug>/index.html (same shell, head, schema, and
// CSS as the hand-built articles), then hands off to daily-publish.mjs
// --finalize to update sitemap.xml + rebuild the /blog hub. It rides the
// EXISTING pipeline rather than adding a parallel one.
//
// Auth: X-API-Key from .env (BABYLOVEGROWTH_API_KEY). Endpoint:
//   GET /v1/articles?limit=&offset=   → summaries (paginated, newest first)
//   GET /v1/articles/:id              → full content_html + jsonLd + faqJsonLd
//
// Usage:
//   node content/babylovegrowth-sync.mjs --dry-run            # list what WOULD render, write nothing
//   node content/babylovegrowth-sync.mjs                      # render published articles → /blog, then finalize
//   node content/babylovegrowth-sync.mjs --include-drafts     # also render BLG drafts (published=false)
//   node content/babylovegrowth-sync.mjs --force              # re-render even if the file already exists
//   node content/babylovegrowth-sync.mjs --limit=1            # cap how many new articles to render this run
//   node content/babylovegrowth-sync.mjs --no-finalize        # skip the sitemap/hub finalize step

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Minimal .env loader (the repo's scripts read process.env directly;
//     load .env here so this runs plainly with `node content/...`). Never
//     overrides a var already in the environment. ───
(() => {
  const p = resolve(ROOT, '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const API_KEY = process.env.BABYLOVEGROWTH_API_KEY;
const API_BASE = 'https://api.babylovegrowth.ai/api/integrations/v1';

const FLAGS = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const has = (f) => FLAGS.has(f);
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const RENDER_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const DRY = has('--dry-run');
const INCLUDE_DRAFTS = has('--include-drafts');
const FORCE = has('--force');

if (!API_KEY) {
  console.error('Missing BABYLOVEGROWTH_API_KEY. Add it to .env (see .env.example).');
  process.exit(1);
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`BabyLoveGrowth ${path} → HTTP ${res.status}`);
  return res.json();
}

// List every article (paginate; API max 500/call, newest first).
async function listAllArticles() {
  const out = [];
  const PER = 50; // API rejects larger pages with 400; 50 is the documented page size.
  for (let offset = 0; ; offset += PER) {
    const page = await api(`/articles?limit=${PER}&offset=${offset}`);
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    if (page.length < PER) break;
  }
  return out;
}

// ─── Shared NAV + FOOTER pulled from templates/index.html (same source the
//     daily-publish hub builder uses, so blog chrome stays in lockstep). ───
function chrome() {
  const src = readFileSync(resolve(ROOT, 'templates', 'index.html'), 'utf8');
  const navStart = src.indexOf('<!-- ─── Top nav with full-width mega panels ─── -->');
  const navEnd = src.indexOf('</header>', navStart) + '</header>'.length;
  const footStart = src.indexOf('<!-- ─── Footer ─── -->');
  const footEnd = src.indexOf('</footer>', footStart) + '</footer>'.length;
  return { NAV: src.slice(navStart, navEnd), FOOTER: src.slice(footStart, footEnd) };
}

function schemaBlock(obj) {
  if (!obj) return '';
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return `  <script type="application/ld+json">\n${json}\n  </script>\n`;
}

function renderArticle(a, { NAV, FOOTER }) {
  const url = `/blog/${a.slug}/`;
  const canonical = `https://bkrdy.com${url}`;
  const published = (a.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const modified = (a.updated_at || a.created_at || '').slice(0, 10) || published;
  const desc = a.meta_description || a.excerpt || '';
  const hero = a.hero_image_url || '';

  // BLG content_html repeats the title as a leading <h1> and the hero as a
  // leading <img>; we render both in the page head + hero block, so strip the
  // leading duplicates to keep a single H1 and avoid showing the hero twice.
  const body = (a.content_html || '')
    .replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
    .replace(/^\s*<p>\s*<img[^>]*>\s*<\/p>\s*/i, '');

  // Prefer BabyLoveGrowth's own Article schema; fall back to a minimal one.
  const articleSchema = a.jsonLd || {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, image: hero, datePublished: published, dateModified: modified,
    author: { '@type': 'Organization', name: 'BKRDY', url: 'https://bkrdy.com/' },
    publisher: { '@type': 'Organization', name: 'BKRDY', logo: { '@type': 'ImageObject', url: 'https://bkrdy.com/images/hero/hero.webp' } },
    description: desc, mainEntityOfPage: canonical,
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bkrdy.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://bkrdy.com/blog/' },
      { '@type': 'ListItem', position: 3, name: a.title, item: canonical },
    ],
  };

  return `<!doctype html>
<html lang="en">
<head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(a.title)} | BKRDY</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="BKRDY" />
  <meta property="og:title" content="${esc(a.title)}" />
  <meta property="og:description" content="${esc(desc)}" />
${hero ? `  <meta property="og:image" content="${esc(hero)}" />\n` : ''}  <meta property="article:published_time" content="${published}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(a.title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
${hero ? `  <meta name="twitter:image" content="${esc(hero)}" />\n` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700;800&display=swap" /></noscript>
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/pages.css" />

${schemaBlock(breadcrumb)}${schemaBlock(articleSchema)}${schemaBlock(a.faqJsonLd)}</head>
<body class="br-article">

${NAV}

  <nav class="br-crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a>
    <span class="br-crumbs__sep" aria-hidden="true">/</span>
    <a href="/blog/">Blog</a>
    <span class="br-crumbs__sep" aria-hidden="true">/</span>
    <span class="br-crumbs__current" aria-current="page">${esc(a.title)}</span>
  </nav>

  <section class="br-pagehead">
    <div class="br-pagehead__inner">
      <p class="br-kicker">Blog</p>
      <h1 class="br-pagehead__title">${esc(a.title)}</h1>
${desc ? `      <p class="br-pagehead__intro">${esc(desc)}</p>\n` : ''}    </div>
  </section>

${hero ? `  <div class="br-article__hero">
    <figure>
      <img src="${esc(hero)}" alt="${esc(a.title)}" loading="eager" fetchpriority="high" decoding="async" />
    </figure>
  </div>

` : ''}  <section class="br-section">
    <div class="br-section__inner">
      <div class="br-prose">
${body}
      </div>
    </div>
  </section>

  <section class="br-final-cta">
    <div class="br-final-cta__inner">
      <p class="br-kicker br-kicker--inverse">BookReady</p>
      <h2 class="br-final-cta__title">A booking website that looks like your work. <span class="br-italic">Live in minutes.</span></h2>
      <p class="br-final-cta__text">Pick a template, take deposits, and let clients book on your own branded site. 30-day free trial.</p>
      <a href="https://app.bkrdy.me/register?ref=blog" class="br-button br-button--inverse">Start your 30-day trial</a>
    </div>
  </section>

${FOOTER}

  <script src="/nav.js"></script>

</body>
</html>
`;
}

// ─── Queue upsert so daily-publish.mjs --finalize picks it up for sitemap +
//     hub. Marks BLG articles shipped with source/externalId provenance. ───
function upsertQueue(a) {
  const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
  const q = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
  const url = `/blog/${a.slug}/`;
  const today = new Date().toISOString().slice(0, 10);
  const entry = {
    slug: a.slug,
    url,
    type: 'blog',
    status: 'shipped',
    shippedAt: (a.created_at || '').slice(0, 10) || today,
    h1: a.title,
    metaTitle: `${a.title} | BKRDY`,
    metaDescription: a.meta_description || a.excerpt || '',
    featuredImage: a.hero_image_url || '',
    source: 'babylovegrowth',
    externalId: a.id,
  };
  const i = q.articles.findIndex((x) => x.slug === a.slug);
  if (i >= 0) q.articles[i] = { ...q.articles[i], ...entry };
  else q.articles.push(entry);
  writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2), 'utf8');
}

// ─── Main ───
async function main() {
  const summaries = await listAllArticles();
  const eligible = summaries.filter((a) => INCLUDE_DRAFTS || a.published === true);

  console.log(`BabyLoveGrowth: ${summaries.length} articles (${eligible.length} ${INCLUDE_DRAFTS ? 'incl. drafts' : 'published'}).`);

  const todo = eligible.filter((a) => {
    const exists = existsSync(resolve(ROOT, 'blog', a.slug, 'index.html'));
    return FORCE || !exists;
  });

  if (todo.length === 0) {
    console.log('Nothing new to render. (Use --force to re-render, --include-drafts for BLG drafts.)');
    return;
  }

  const batch = todo.slice(0, RENDER_LIMIT);
  console.log(`${DRY ? '[dry-run] would render' : 'Rendering'} ${batch.length} of ${todo.length} new article(s):`);

  if (DRY) {
    for (const a of batch) console.log(`  · ${a.slug}  (id ${a.id}, published=${a.published})`);
    return;
  }

  const { NAV, FOOTER } = chrome();
  let written = 0;
  for (const s of batch) {
    const full = await api(`/articles/${s.id}`);
    const html = renderArticle(full, { NAV, FOOTER });
    const dir = resolve(ROOT, 'blog', full.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
    upsertQueue(full);
    written++;
    console.log(`  ✓ /blog/${full.slug}/`);
  }

  console.log(`Wrote ${written} article(s).`);

  if (!has('--no-finalize')) {
    console.log('Finalizing (sitemap + /blog hub)…');
    execSync('node content/daily-publish.mjs --finalize', { cwd: ROOT, stdio: 'inherit' });
  }
  console.log('Done.');
}

// Set exitCode instead of process.exit() so Node drains the fetch keep-alive
// sockets and exits cleanly (process.exit() mid-flight aborts on Win/Node 24).
main().catch((e) => { console.error(e?.message || e); process.exitCode = 1; });
