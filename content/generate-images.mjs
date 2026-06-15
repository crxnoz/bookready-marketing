// BookReady blog hero image generator.
//
// Generates art-directed, on-brand hero photography for blog/guide articles
// via OpenAI gpt-image-1, saved as webp to /images/blog/<slug>.webp. The scene
// for each article is DERIVED from its queue entry (industry + cluster), so new
// articles get a matching, people-free editorial hero with no hardcoded list.
// A shared art-direction preamble keeps the whole set cohesive.
//
// Commands:
//   node content/generate-images.mjs check                 validate the API key
//   node content/generate-images.mjs scene <slug>          print the derived scene (dry run)
//   node content/generate-images.mjs gen <slug> [<slug>..] generate hero(s)
//   node content/generate-images.mjs gen --shipped         generate for every shipped article missing one
//   node content/generate-images.mjs wire                  inject + sync heroes into shipped article HTML
//
// Flags: --force (regenerate even if the file exists), --quality low|medium|high
//
// Reads OPENAI_API_KEY from env or the local gitignored .env. If it is absent,
// generation is skipped gracefully so the publish flow still ships (no hero).
// No em-dashes.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
const IMG_DIR = resolve(ROOT, 'images', 'blog');

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

// ─── Shared art direction (the leash that keeps the set on-brand) ────────────
const STYLE = [
  'Editorial lifestyle photography, 35mm film aesthetic, soft natural window light,',
  'warm muted color grade in cream, warm beige and dusty rose pink tones,',
  'calm premium understated mood, shallow depth of field, realistic composition',
  'with generous negative space, gentle film grain.',
  'Absolutely no people, no faces, no hands, no text, no words, no typography, no logos, no signage, no watermarks.',
].join(' ');

// ─── Optional hand-tuned overrides (everything else is derived) ──────────────
const OVERRIDES = {
  'booksy-pricing': {
    scene: 'An empty, upscale independent barbershop interior in soft morning light. A clean wooden styling station and a single vintage leather barber chair, with clippers, combs and brushes neatly arranged on the counter, a large antique mirror, and a potted plant. Tidy and calm, generous warm negative space.',
    alt: 'A clean, upscale barbershop station with a vintage chair, mirror and neatly arranged tools in warm light.',
  },
  'appointment-reminder-templates': {
    scene: 'A calm still life on a clean salon counter in soft daylight: a smartphone resting face down beside a small potted plant, a pair of styling scissors and a neatly folded towel. Warm cream and dusty rose tones, shallow depth of field.',
    alt: 'A smartphone resting on a salon counter beside scissors, a folded towel and a small plant.',
  },
  'salon-booking-software-comparison': {
    scene: 'A bright, minimal salon reception desk in soft daylight: a slim closed laptop, a notebook and pen, and a small vase of dried flowers on a clean surface. Plants and a large window softly blurred behind, cream and dusty pink palette, generous negative space.',
    alt: 'A bright, minimal salon reception desk with a closed laptop, notebook and dried flowers.',
  },
  'best-booking-websites-for-barbers-in-2026': {
    scene: 'A warm, upscale barbershop interior with a row of empty leather barber chairs facing a long wall of mirrors, tools neatly arranged on wooden counters, warm directional light and soft shadows. Premium editorial mood.',
    alt: 'A row of empty leather barber chairs facing mirrors in a warm, upscale barbershop.',
  },
};

// ─── Scene derivation from a queue entry ─────────────────────────────────────
function settingFor(industry) {
  const map = {
    barbers: { place: 'an upscale independent barbershop', seat: 'a vintage leather barber chair', tools: 'clippers, combs and brushes' },
    salons: { place: 'a bright, modern hair salon', seat: 'a styling chair', tools: 'brushes, a hand mirror and styling tools' },
    'lash-artists': { place: 'a calm, warmly lit lash studio', seat: 'a reclined treatment bed with a soft blanket', tools: 'fine tweezers and small trays' },
    'nail-techs': { place: 'a minimal, bright nail studio', seat: 'a clean manicure table', tools: 'nail polish bottles arranged by tone' },
    estheticians: { place: 'a serene esthetics treatment room', seat: 'a treatment bed with neatly folded towels', tools: 'small glass jars and folded cloths' },
    spas: { place: 'a quiet, warm spa room', seat: 'a treatment bed', tools: 'folded towels, smooth stones and a lit candle' },
    'solo-pros': { place: 'a small, calm private beauty studio', seat: 'a single styling chair', tools: 'a few neatly arranged tools' },
  };
  return map[industry] || { place: 'a bright, modern beauty studio', seat: 'a styling chair', tools: 'neatly arranged tools' };
}

function sceneFor(entry) {
  const s = settingFor(entry.recommendedRelatedIndustry || '');
  const cluster = entry.cluster || '';
  if (/migration|comparison/.test(cluster)) {
    return {
      scene: `A bright, minimal reception desk inside ${s.place}, in soft daylight: a slim closed laptop, a notebook and pen, and a small vase of dried flowers on a clean surface. Plants and a window softly blurred behind, cream and dusty pink palette, generous negative space.`,
      alt: `A bright, minimal reception desk with a closed laptop and notebook in a calm beauty studio.`,
    };
  }
  if (/appointment/.test(cluster)) {
    return {
      scene: `A calm still life on a clean counter inside ${s.place}, in soft daylight: a smartphone resting face down beside ${s.tools}, a folded towel and a small potted plant. Shallow depth of field, warm cream and dusty rose tones.`,
      alt: `A smartphone and neatly arranged tools on a clean counter in a calm beauty studio.`,
    };
  }
  return {
    scene: `The interior of ${s.place} in soft morning light: ${s.seat}, a large mirror, ${s.tools} neatly arranged on a wooden counter, and a potted plant. Tidy and calm, generous warm negative space.`,
    alt: `The calm interior of ${s.place} with ${s.seat} and neatly arranged tools.`,
  };
}

// ─── Queue helpers ───────────────────────────────────────────────────────────
function loadQueue() { return JSON.parse(readFileSync(QUEUE_PATH, 'utf8')); }
function pageForUrl(url) { return url.replace(/^\//, '').replace(/\/$/, '') + '/index.html'; }

// Heroes are only for editorial articles (/blog and /guides), which use the
// br-article reading layout. Other page types (e.g. /compare) have their own
// design and must not get a hero injected.
function isEditorial(url) { return url.startsWith('/blog/') || url.startsWith('/guides/'); }

function resolveArticle(slug) {
  const e = loadQueue().articles.find((a) => a.slug === slug);
  if (!e) return null;
  const base = OVERRIDES[slug] || sceneFor(e);
  return { slug, page: pageForUrl(e.url), scene: base.scene, alt: base.alt, editorial: isEditorial(e.url) };
}
function shippedSlugs() {
  return loadQueue().articles.filter((a) => a.status === 'shipped' && isEditorial(a.url)).map((a) => a.slug);
}

function parseFlags(argv) {
  const f = { force: false, quality: 'high', shipped: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') f.force = true;
    else if (argv[i] === '--shipped') f.shipped = true;
    else if (argv[i] === '--quality') f.quality = argv[++i] || f.quality;
  }
  return f;
}

const hasKey = () => Boolean(process.env.OPENAI_API_KEY);

async function cmdCheck() {
  if (!hasKey()) { console.log('No OPENAI_API_KEY found (env or .env).'); return; }
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
  console.log(res.ok ? 'OpenAI auth OK. Image generation is ready.' : `Auth FAILED: ${res.status} ${res.statusText}.`);
}

async function generate(slug, flags) {
  const art = resolveArticle(slug);
  if (!art) { console.log(`  not in queue: ${slug}`); return; }
  if (!art.editorial) { console.log(`  skip (not a /blog or /guides article): ${slug}`); return; }
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });
  const out = resolve(IMG_DIR, `${slug}.webp`);
  if (existsSync(out) && !flags.force) { console.log(`  skip (exists): ${slug}.webp`); return; }
  if (!hasKey()) { console.log(`  no OPENAI_API_KEY, skipping image for ${slug} (article still ships)`); return; }

  process.stdout.write(`  generating ${slug} (${flags.quality}) ... `);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-1', prompt: `${art.scene}\n\nStyle: ${STYLE}`, n: 1,
      size: '1536x1024', quality: flags.quality, output_format: 'webp', output_compression: 80,
    }),
  });
  const json = await res.json();
  if (json.error || !json.data?.[0]?.b64_json) {
    console.log('FAILED');
    console.error('  ', json.error?.message || JSON.stringify(json).slice(0, 200));
    return;
  }
  const buf = Buffer.from(json.data[0].b64_json, 'base64');
  writeFileSync(out, buf);
  console.log(`saved /images/blog/${slug}.webp (${Math.round(buf.length / 1024)} KB)`);
}

// Inject (or sync the alt on) the hero block for every shipped article that
// has a generated image.
function wire(list) {
  let wired = 0, synced = 0;
  for (const slug of list) {
    const art = resolveArticle(slug);
    if (!art || !art.editorial) continue;
    const p = resolve(ROOT, art.page);
    if (!existsSync(p)) continue;
    if (!existsSync(resolve(IMG_DIR, `${slug}.webp`))) continue;
    let h = readFileSync(p, 'utf8');

    if (h.includes('br-article__hero')) {
      const re = new RegExp(`(src="/images/blog/${slug}\\.webp"\\s+alt=")[^"]*(")`);
      if (re.test(h)) { h = h.replace(re, `$1${art.alt}$2`); writeFileSync(p, h, 'utf8'); synced++; }
      continue;
    }
    const hero = `
  <div class="br-article__hero">
    <figure>
      <img src="/images/blog/${slug}.webp" alt="${art.alt}" width="1536" height="1024" loading="eager" fetchpriority="high" decoding="async" />
    </figure>
  </div>
`;
    const anchor = '</section>';
    const idx = h.indexOf(anchor, h.indexOf('br-pagehead'));
    if (idx === -1) { console.log(`  no insert point: ${slug}`); continue; }
    const at = idx + anchor.length;
    h = h.slice(0, at) + '\n' + hero + h.slice(at);
    writeFileSync(p, h, 'utf8');
    console.log(`  wired hero: ${slug}`);
    wired++;
  }
  console.log(`Wire: ${wired} new, ${synced} alt-synced.`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = parseFlags(rest);
const slugs = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--quality') { i++; continue; } // skip the flag's value
  if (rest[i].startsWith('--')) continue;
  slugs.push(rest[i]);
}

switch (cmd) {
  case 'check': await cmdCheck(); break;
  case 'scene': {
    const art = resolveArticle(slugs[0]);
    if (!art) console.log(`Not in queue: ${slugs[0]}`);
    else console.log(`slug:  ${art.slug}\npage:  ${art.page}\nalt:   ${art.alt}\nscene: ${art.scene}`);
    break;
  }
  case 'gen': {
    const list = flags.shipped ? shippedSlugs() : slugs;
    if (!list.length) { console.log('Usage: gen <slug> [<slug>...]  or  gen --shipped'); break; }
    for (const slug of list) await generate(slug, flags);
    break;
  }
  case 'wire': wire(slugs.length ? slugs : shippedSlugs()); break;
  default:
    console.log(`BookReady blog image generator

  check                 validate OPENAI_API_KEY
  scene <slug>          print the derived scene (dry run)
  gen <slug> [<slug>..] generate hero(s)
  gen --shipped         generate for every shipped article missing one
  wire [<slug>..]       inject + sync heroes (defaults to all shipped)

Flags: --force --quality low|medium|high
Scene is derived from each article's queue entry (industry + cluster).`);
}
