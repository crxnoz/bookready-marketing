// Helper script for the daily-publish workflow.
//
// Usage:
//   node content/daily-publish.mjs --list     → list next 2 pending articles
//   node content/daily-publish.mjs --finalize → after articles are written:
//                                                  mark queue entries shipped,
//                                                  update sitemap,
//                                                  rebuild /blog/ and /guides/ hubs

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
const SITEMAP_PATH = resolve(ROOT, 'sitemap.xml');

function loadQueue() {
  if (!existsSync(QUEUE_PATH)) {
    console.error('content/queue.json not found');
    process.exit(1);
  }
  return JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
}

function saveQueue(q) {
  writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2), 'utf8');
}

function nextPending(q, n = 2) {
  return q.articles.filter((a) => a.status === 'pending').slice(0, n);
}

function articleExists(article) {
  return existsSync(resolve(ROOT, article.url.replace(/^\//, '').replace(/\/$/, ''), 'index.html'));
}

// ─── --list mode ───
if (process.argv.includes('--list')) {
  const q = loadQueue();
  const next = nextPending(q, 2);
  if (next.length === 0) {
    console.log('Queue empty. Refill content/queue.json.');
    process.exit(0);
  }
  console.log(`Next ${next.length} articles in queue:`);
  for (const a of next) {
    console.log(`  ${a.slug} → ${a.url} (${a.type}, ${a.estVolume || '?'} /mo)`);
  }
  process.exit(0);
}

// ─── --finalize mode ───
if (process.argv.includes('--finalize')) {
  const q = loadQueue();
  const today = new Date().toISOString().slice(0, 10);

  // Check the next-2-pending and see which actually have HTML files now.
  const candidates = nextPending(q, 2);
  let shipped = 0, missing = 0;
  for (const a of candidates) {
    if (articleExists(a)) {
      a.status = 'shipped';
      a.shippedAt = today;
      shipped++;
      console.log(`  ✓ shipped ${a.slug}`);
    } else {
      missing++;
      console.log(`  · pending (no file yet) ${a.slug}`);
    }
  }
  saveQueue(q);
  console.log(`Finalize: ${shipped} shipped, ${missing} still pending`);

  // ─── Update sitemap ───
  let sm = readFileSync(SITEMAP_PATH, 'utf8');
  let added = 0;
  for (const a of q.articles.filter((x) => x.status === 'shipped')) {
    const loc = `https://mybookready.com${a.url}`;
    if (sm.includes(loc)) continue;
    const priority = a.type === 'pillar' ? '0.8' : '0.7';
    const entry = `  <url><loc>${loc}</loc><lastmod>${a.shippedAt || today}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>\n`;
    sm = sm.replace(/<\/urlset>/, entry + '</urlset>');
    added++;
  }
  writeFileSync(SITEMAP_PATH, sm, 'utf8');
  console.log(`Sitemap: ${added} new URLs added`);

  // ─── Rebuild /blog/ and /guides/ hubs ───
  rebuildHub('/blog/', 'Blog', 'Long-form notes on running a beauty business', q);
  rebuildHub('/guides/', 'Guides', 'Step-by-step playbooks for beauty studios', q);

  console.log('Finalize complete.');
  process.exit(0);
}

// ─── Hub rebuilder ───
function rebuildHub(path, name, description, q) {
  const dir = resolve(ROOT, path.replace(/^\//, '').replace(/\/$/, ''));
  if (!existsSync(dir)) return;

  // Find shipped articles where the URL starts with the hub path
  const articles = q.articles.filter(
    (a) => a.status === 'shipped' && a.url.startsWith(path) && a.url !== path,
  ).sort((a, b) => (b.shippedAt || '').localeCompare(a.shippedAt || ''));

  // Read shared NAV + FOOTER from any existing page
  const templateSrc = readFileSync(resolve(ROOT, 'templates', 'index.html'), 'utf8');
  const navStart = templateSrc.indexOf('<!-- ─── Top nav with full-width mega panels ─── -->');
  const navEnd = templateSrc.indexOf('</header>', navStart) + '</header>'.length;
  const NAV = templateSrc.slice(navStart, navEnd);
  const footStart = templateSrc.indexOf('<!-- ─── Footer ─── -->');
  const footEnd = templateSrc.indexOf('</footer>', footStart) + '</footer>'.length;
  const FOOTER = templateSrc.slice(footStart, footEnd);

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const cards = articles.map((a) => {
    const img = a.featuredImage || '/images/templates/tfr-cover.webp';
    return `        <a class="br-template-card" href="${a.url}">
          <span class="br-template-card__preview">
            <img src="${img}" alt="${esc(a.h1 || a.metaTitle)}" loading="lazy" decoding="async" />
            <span class="br-template-card__overlay">Read article &rarr;</span>
          </span>
          <h3>${esc(a.h1 || a.metaTitle.split(' | ')[0])}</h3>
          <p class="br-template-card__text">${esc((a.metaDescription || '').slice(0, 140))}</p>
        </a>`;
  }).join('\n\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${name} | BookReady</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="https://mybookready.com${path}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://mybookready.com${path}" />
  <meta property="og:site_name" content="BookReady" />
  <meta property="og:title" content="BookReady ${name}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="https://mybookready.com/images/hero/hero.webp" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="BookReady ${name}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="https://mybookready.com/images/hero/hero.webp" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/pages.css" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://mybookready.com/"},
      {"@type": "ListItem", "position": 2, "name": "${name}", "item": "https://mybookready.com${path}"}
    ]
  }
  </script>
</head>
<body>

${NAV}

  <nav class="br-crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a>
    <span class="br-crumbs__sep" aria-hidden="true">/</span>
    <span class="br-crumbs__current" aria-current="page">${name}</span>
  </nav>

  <section class="br-pagehead">
    <div class="br-pagehead__inner">
      <p class="br-kicker">${name}</p>
      <h1 class="br-pagehead__title">${name === 'Blog' ? 'Notes on running a beauty business' : 'Playbooks for the day'}. <span class="br-italic">${name === 'Blog' ? 'Long form.' : 'Step by step.'}</span></h1>
      <p class="br-pagehead__intro">${description}.</p>
    </div>
  </section>

  <section class="br-section">
    <div class="br-section__inner">
${articles.length > 0 ? `      <div class="br-template-grid">
${cards}
      </div>` : `      <p class="br-section__intro">More content coming soon. Subscribe to <a href="/newsletter/" class="br-text-link">the newsletter</a> for new pieces as they land.</p>`}

      <div class="br-template-next" style="margin-top: 40px;">
        <div class="br-template-next__copy">
          <p class="br-kicker">More coming</p>
          <h3 class="br-template-next__title">Two new articles every weekday.</h3>
          <p class="br-template-next__text">Working through the full content roadmap: industry deep-dives, platform comparisons, deposit math, no-show systems, growth playbooks. New every business day.</p>
        </div>
        <a href="/newsletter/" class="br-button">Subscribe</a>
      </div>
    </div>
  </section>

${FOOTER}

  <script src="/nav.js"></script>

</body>
</html>
`;
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  console.log(`Hub rebuilt: ${path} (${articles.length} articles)`);
}
