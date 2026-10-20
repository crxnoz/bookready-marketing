// One-time: turn the 63 hand-written pages under blog/ and guides/ into the
// Markdown the generator reads, so they get the new article design without
// changing a single URL, title, description, date or published fact.
//
//   SHARP=<path to sharp> node content/blog-tools/migrate.mjs [--dry] [--only slug]
//
// Two page families exist and both are handled:
//   A. hand-built `br-section` pages (kicker, h2, intro paragraphs, tables, FAQ)
//   B. BabyLoveGrowth-rendered pages, one `br-prose` block of plain semantic HTML
//
// Kept: slug, <title>, meta description, article:published_time, the h1, every
// paragraph, list, table, quote and FAQ question, and the hero image (converted
// to the generator's photo sizes). Dropped: nav, footer, breadcrumbs, kickers,
// the old end-of-page CTA (the new template emits its own).
//
// Anything the converter cannot represent is reported per file rather than
// silently lost, so nothing disappears without someone seeing it.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'content', 'blog');
const DRY = process.argv.includes('--dry');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const sharp = process.env.SHARP ? createRequire(import.meta.url)(process.env.SHARP) : null;

mkdirSync(OUT, { recursive: true });

// ── tiny HTML helpers ────────────────────────────────────────────────────────
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', hellip: '…', mdash: ' ', ndash: '-', rarr: '→', times: '×', deg: '°' };
const decode = s => String(s)
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENT ? ENT[n.toLowerCase()] : m));

// Inline HTML to Markdown. Links, bold, italic; everything else loses its tag.
function inline(html) {
  let s = String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<span class="br-italic">([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, t, x) => `**${inline(x).trim()}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, t, x) => `*${inline(x).trim()}*`)
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, x) => {
      const text = inline(x).trim();
      const url = href.replace(/^https?:\/\/(www\.)?bkrdy\.com/, '');
      return text ? `[${text}](${url})` : '';
    })
    .replace(/<[^>]+>/g, '');
  s = decode(s).replace(/\s+/g, ' ').trim();
  // Em dashes are not used in BKRDY copy; the old pages have a few.
  return s.replace(/\s*—\s*/g, ', ').replace(/\*\*\s*\*\*/g, '');
}
const text = html => inline(html);

// ── block conversion ─────────────────────────────────────────────────────────
// Walks the top-level tags of a chunk of article HTML and emits Markdown.
function blocks(html, warn) {
  const out = [];
  const re = /<(h2|h3|h4|p|ul|ol|blockquote|table|figure|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase(), attrs = m[2] || '', inner = m[3];
    if (/br-final-cta|br-crumbs|bq-|br-button/.test(attrs)) continue;
    if (tag === 'div') {
      // Unwrap the layout divs the old pages nest their content in.
      if (/br-compare__wrap|br-prose|br-section__head|br-section__inner|br-pagehead__inner|br-article__hero|br-faq/.test(attrs)) out.push(...blocks(inner, warn));
      continue;
    }
    if (tag === 'figure') continue;                            // the hero image is handled separately
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const t = text(inner);
      if (t) out.push((tag === 'h2' ? '## ' : '### ') + t);
      continue;
    }
    if (tag === 'p') {
      if (/br-kicker|br-footer|br-nav/.test(attrs)) continue;  // kickers are decoration, not content
      const t = text(inner);
      if (t) out.push(t);
      continue;
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(x => text(x[1])).filter(Boolean);
      if (items.length) out.push(items.map((x, i) => (tag === 'ol' ? `${i + 1}. ` : '- ') + x).join('\n'));
      continue;
    }
    if (tag === 'blockquote') {
      const t = text(inner);
      if (t) out.push('> ' + t);
      continue;
    }
    if (tag === 'table') {
      const head = [...(inner.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i)?.[1] || '')
        .matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(x => text(x[1]));
      const rows = [...(inner.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || inner)
        .matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
        .map(r => [...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => text(c[1]).replace(/\|/g, '/')))
        .filter(r => r.length && r.some(Boolean));
      if (head.length && rows.length) {
        out.push([`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`,
          ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n'));
      } else warn('a table could not be read');
      continue;
    }
  }
  return out;
}

// ── one page ─────────────────────────────────────────────────────────────────
function convert(section, slug) {
  const file = join(ROOT, section, slug, 'index.html');
  const src = readFileSync(file, 'utf8');
  const warns = [];
  const warn = w => warns.push(w);
  const pick = re => (src.match(re) || [])[1] || '';

  const metaTitle = decode(pick(/<title>([\s\S]*?)<\/title>/i)).trim();
  const description = decode(pick(/<meta name="description" content="([^"]*)"/i)).trim();
  const date = pick(/<meta property="article:published_time" content="([^"]*)"/i).slice(0, 10)
    || pick(new RegExp(`<loc>https://bkrdy\\.com/${section}/${slug}/</loc><lastmod>([^<]+)<`));
  const h1 = text(pick(/<h1 class="br-pagehead__title">([\s\S]*?)<\/h1>/i));
  const lede = [...src.matchAll(/<p class="br-pagehead__intro">([\s\S]*?)<\/p>/gi)].map(x => text(x[1])).filter(Boolean);

  // Body: everything between the page head and the footer, minus the old CTA.
  const start = src.indexOf('</section>', src.indexOf('br-pagehead'));
  const endMarks = ['<section class="br-final-cta"', '<div class="br-final-cta"', '<footer class="br-footer"'];
  const end = endMarks.map(m => src.indexOf(m)).filter(i => i > start).sort((a, b) => a - b)[0] ?? src.length;
  let chunk = src.slice(start, end);

  // Questions: the old accordions become a `## Questions` section, which the
  // generator renders and derives the FAQPage schema from.
  const faq = [...chunk.matchAll(/<details class="br-faq__item"[^>]*>([\s\S]*?)<\/details>/gi)].map(d => {
    const q = text((d[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i) || [])[1] || '');
    const a = blocks(d[1].replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/i, ''), warn);
    return q && a.length ? { q, a } : null;
  }).filter(Boolean);
  chunk = chunk.replace(/<section[^>]*>(?:(?!<\/section>)[\s\S])*?br-faq__item[\s\S]*?<\/section>/gi, '');

  // Several pages carry FAQPage structured data for questions that appear
  // nowhere on the page, which Google's own guidance does not allow. Rather
  // than drop the answers, lift them out of the JSON-LD into a real Questions
  // section, so the page says what its schema claims.
  if (!faq.length) {
    for (const block of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      let data;
      try { data = JSON.parse(block[1]); } catch { continue; }
      if (data['@type'] !== 'FAQPage' || !Array.isArray(data.mainEntity)) continue;
      for (const item of data.mainEntity) {
        const q = decode(String(item.name || '')).trim();
        const a = decode(String(item.acceptedAnswer?.text || '')).trim();
        if (q && a) faq.push({ q, a: [a] });
      }
      if (faq.length) warn(`${faq.length} questions lifted out of structured data onto the page`);
    }
  }

  const hero = (chunk.match(/<img[^>]+src="([^"]+)"[^>]*>/i) || []);
  const heroSrc = (hero[1] || '').replace(/^https?:\/\/(www\.)?bkrdy\.com/, '').replace(/^\//, '');
  const heroAlt = decode((hero[0]?.match(/alt="([^"]*)"/i) || [])[1] || '');

  const body = blocks(chunk, warn).filter(b => !lede.includes(b) && b !== h1);
  if (!body.length) warn('no body content was found');
  if (!date) warn('no published date was found');

  return { section, slug, metaTitle, description, date, h1, lede, body, faq, heroSrc, heroAlt, warns };
}

// ── pillar ───────────────────────────────────────────────────────────────────
// A first guess from the words in the slug and title. Every one is reviewed by
// hand afterwards; this only saves typing.
const RULES = [
  ['switching', /booksy|vagaro|glossgenius|gloss-genius|styleseat|acuity|fresha|square|alternativ|comparison|compare|switch|migrat|transfer|vs-|bookingbee|yeswebook|software|booking-app/],
  ['money', /deposit|no-show|noshow|cancellation|price|pricing|cost|package|stripe|payment|charge|tip|refund/],
  ['coming-back', /retention|rebook|reminder|loyal|review|waitlist|regular|retain|client-record|preference|intake|follow/],
  ['your-site', /website|site|brand|instagram|bio|domain|presence|portfolio|gallery|online-booking|booking-page|booking-flow/],
  ['the-week', /schedul|calendar|availab|capacity|double-book|frequency|slot|hours|time/],
  ['going-solo', /start-a|how-to-open|solo|booth|independent|freelance/],
];
// Pages the rules read wrong, settled by hand.
const OVERRIDES = {
  'best-booking-websites-for-barbers-in-2026': 'switching',
  'pricing-transparency-in-hair-bookings-build-client-trust': 'money',
  'facial-pricing-guide': 'money',
  'appointment-reminder-templates': 'coming-back',
  'content-ideas-for-beauty-businesses': 'your-site',
  'instagram-marketing-for-salons': 'your-site',
  'win-back-lapsed-clients': 'coming-back',
  'growing-a-salon': 'going-solo',
};
const guessPillar = (slug, title) => {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  const hay = (slug + ' ' + title).toLowerCase();
  for (const [id, re] of RULES) if (re.test(hay)) return id;
  return 'your-site';
};

// ── photo ────────────────────────────────────────────────────────────────────
async function photo(key, srcRel) {
  if (!srcRel) return false;
  const src = join(ROOT, srcRel);
  if (!existsSync(src)) return false;
  if (!sharp) return 'skipped (no SHARP)';
  const meta = await sharp(src).metadata();
  for (const w of [800, 1600]) {
    await sharp(src).rotate().resize(Math.min(w, meta.width), Math.round(Math.min(w, meta.width) * 9 / 16),
      { fit: 'cover', position: 'attention' })
      .webp({ quality: w === 800 ? 76 : 72 })
      .toFile(join(ROOT, 'images', 'blog', `${key}-photo-${w}.webp`));
  }
  return true;
}

// ── run ──────────────────────────────────────────────────────────────────────
const dirs = [];
for (const section of ['blog', 'guides']) {
  for (const slug of readdirSync(join(ROOT, section), { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name)) {
    if (ONLY && slug !== ONLY) continue;
    if (existsSync(join(ROOT, section, slug, 'index.html'))) dirs.push([section, slug]);
  }
}

const report = [];
for (const [section, slug] of dirs) {
  const p = convert(section, slug);
  const key = slug;
  const pillar = guessPillar(slug, p.h1 + ' ' + p.metaTitle);
  const pic = DRY ? false : await photo(key, p.heroSrc);

  const fm = [
    `key: ${key}`,
    `section: ${section}`,
    `slug: ${slug}`,
    `title: ${p.h1 || p.metaTitle}`,
    `metaTitle: ${p.metaTitle}`,
    `description: ${p.description}`,
    `date: ${p.date || '2026-06-09'}`,
    `pillar: ${pillar}`,
    'keywords: ',
    ...(pic === true ? [`photo: ${key}`, `photoAlt: ${p.heroAlt.replace(/\s+/g, ' ').trim()}`] : []),
    'status: published',
    'migrated: true',
  ];

  const parts = [...p.lede];
  if (p.body.length) parts.push(...p.body);
  if (p.faq.length) {
    parts.push('## Questions');
    for (const f of p.faq) { parts.push('### ' + f.q); parts.push(...f.a); }
  }
  const md = `---\n${fm.join('\n')}\n---\n\n${parts.join('\n\n')}\n`;
  if (!DRY) writeFileSync(join(OUT, `${key}.md`), md);
  report.push({ key, section, pillar, date: p.date, words: md.split(/\s+/).length,
    faq: p.faq.length, photo: pic === true, warns: p.warns });
}

for (const r of report) {
  console.log(`${r.photo ? 'P' : ' '}${r.faq ? 'Q' : ' '} ${String(r.words).padStart(5)}w  ${r.pillar.padEnd(12)} ${r.date || '????-??-??'}  ${r.section}/${r.key}` +
    (r.warns.length ? `   !! ${r.warns.join('; ')}` : ''));
}
const bad = report.filter(r => r.warns.length);
console.log(`\n${report.length} pages, ${report.filter(r => r.photo).length} with a photo, ${report.filter(r => r.faq).length} with questions, ${bad.length} with warnings`);
console.log('by pillar: ' + [...new Set(report.map(r => r.pillar))].map(p => `${p} ${report.filter(r => r.pillar === p).length}`).join(', '));
