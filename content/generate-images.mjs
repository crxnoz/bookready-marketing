// BookReady blog hero image generator.
//
// Generates art-directed, on-brand hero photography for blog/guide articles
// via OpenAI gpt-image-1, saved as webp to /images/blog/<slug>.webp. A shared
// art-direction preamble keeps every image in the same editorial style so the
// set reads as one brand, not generic AI stock.
//
// Commands:
//   node content/generate-images.mjs check            validate the API key
//   node content/generate-images.mjs gen <slug>       generate one article hero
//   node content/generate-images.mjs gen --all        generate all defined heroes
//   node content/generate-images.mjs wire             inject heroes into article HTML
//
// Flags: --force (regenerate even if the file exists), --quality low|medium|high
//
// Reads OPENAI_API_KEY from env or the local gitignored .env. No em-dashes.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
  'calm premium understated mood, shallow depth of field, realistic candid composition',
  'with generous negative space, gentle film grain.',
  'Absolutely no text, no words, no typography, no logos, no signage, no watermarks, no UI or phone screens showing apps.',
].join(' ');

// ─── Per-article scenes ──────────────────────────────────────────────────────
// slug -> { file path of the article, scene prompt, alt text }
const ARTICLES = {
  'booksy-pricing': {
    page: 'blog/booksy-pricing/index.html',
    scene: 'An empty, upscale independent barbershop interior in soft morning light. A clean wooden styling station and a single vintage leather barber chair, with clippers, combs and brushes neatly arranged on the counter, a large antique mirror, and a potted plant. No people, tidy and calm, generous warm negative space.',
    alt: 'A clean, upscale barbershop station with a vintage chair, mirror and neatly arranged tools in warm light.',
  },
  'appointment-reminder-templates': {
    page: 'guides/appointment-reminder-templates/index.html',
    scene: 'A calm still life on a clean salon counter in soft daylight: a smartphone resting face down beside a small potted plant, a pair of styling scissors and a neatly folded towel. Warm cream and dusty rose tones, shallow depth of field, no people.',
    alt: 'A smartphone resting on a salon counter beside scissors, a folded towel and a small plant.',
  },
  'salon-booking-software-comparison': {
    page: 'blog/salon-booking-software-comparison/index.html',
    scene: 'A bright, minimal salon reception desk in soft daylight: a slim closed laptop, a notebook and pen, and a small vase of dried flowers on a clean surface. Plants and a large window softly blurred behind, cream and dusty pink palette, no people, generous negative space.',
    alt: 'A bright, minimal salon reception desk with a closed laptop, notebook and dried flowers.',
  },
  'best-booking-websites-for-barbers-in-2026': {
    page: 'blog/best-booking-websites-for-barbers-in-2026/index.html',
    scene: 'A warm, upscale barbershop interior with a row of empty leather barber chairs facing a long wall of mirrors, tools neatly arranged on wooden counters, warm directional light and soft shadows. Premium editorial mood, no people.',
    alt: 'A row of empty leather barber chairs facing mirrors in a warm, upscale barbershop.',
  },
};

function parseFlags(argv) {
  const f = { force: false, quality: 'high', all: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') f.force = true;
    else if (argv[i] === '--all') f.all = true;
    else if (argv[i] === '--quality') f.quality = argv[++i] || f.quality;
  }
  return f;
}

function apiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) { console.error('No OPENAI_API_KEY found in env or .env.'); process.exit(1); }
  return k;
}

async function cmdCheck() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) { console.log('No OPENAI_API_KEY found (env or .env).'); return; }
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${k}` } });
  if (res.ok) console.log('OpenAI auth OK. Image generation is ready.');
  else console.log(`Auth FAILED: ${res.status} ${res.statusText}. Check OPENAI_API_KEY in .env.`);
}

async function generate(slug, flags) {
  const a = ARTICLES[slug];
  if (!a) { console.error(`Unknown slug: ${slug}`); return; }
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });
  const out = resolve(IMG_DIR, `${slug}.webp`);
  if (existsSync(out) && !flags.force) { console.log(`  skip (exists): ${slug}.webp  (use --force to regenerate)`); return; }

  const prompt = `${a.scene}\n\nStyle: ${STYLE}`;
  process.stdout.write(`  generating ${slug} (${flags.quality}) ... `);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-1', prompt, n: 1,
      size: '1536x1024', quality: flags.quality,
      output_format: 'webp', output_compression: 80,
    }),
  });
  const json = await res.json();
  if (json.error || !json.data?.[0]?.b64_json) {
    console.log('FAILED');
    console.error('  ', json.error?.message || JSON.stringify(json).slice(0, 200));
    return;
  }
  writeFileSync(out, Buffer.from(json.data[0].b64_json, 'base64'));
  const kb = Math.round(Buffer.from(json.data[0].b64_json, 'base64').length / 1024);
  console.log(`saved /images/blog/${slug}.webp (${kb} KB)`);
}

// Inject the hero block into an article right after the pagehead section.
function wire() {
  let wired = 0, skipped = 0;
  for (const [slug, a] of Object.entries(ARTICLES)) {
    const p = resolve(ROOT, a.page);
    if (!existsSync(p)) { console.log(`  no page: ${a.page}`); continue; }
    if (!existsSync(resolve(IMG_DIR, `${slug}.webp`))) { console.log(`  no image yet: ${slug}`); continue; }
    let h = readFileSync(p, 'utf8');
    if (h.includes('br-article__hero')) {
      // Already wired: keep the alt text in sync with the current scene.
      const re = new RegExp(`(src="/images/blog/${slug}\\.webp"\\s+alt=")[^"]*(")`);
      if (re.test(h)) { h = h.replace(re, `$1${a.alt}$2`); writeFileSync(p, h, 'utf8'); console.log(`  alt synced: ${slug}`); }
      else console.log(`  skip (already wired): ${slug}`);
      skipped++; continue;
    }
    const hero = `
  <div class="br-article__hero">
    <figure>
      <img src="/images/blog/${slug}.webp" alt="${a.alt}" width="1536" height="1024" loading="eager" fetchpriority="high" decoding="async" />
    </figure>
  </div>
`;
    // Insert after the first </section> (the pagehead) following the pagehead marker.
    const anchor = '</section>';
    const idx = h.indexOf(anchor, h.indexOf('br-pagehead'));
    if (idx === -1) { console.log(`  could not find insert point: ${slug}`); continue; }
    const at = idx + anchor.length;
    h = h.slice(0, at) + '\n' + hero + h.slice(at);
    writeFileSync(p, h, 'utf8');
    console.log(`  wired hero into ${a.page}`);
    wired++;
  }
  console.log(`\nWire: ${wired} wired, ${skipped} already had heroes.`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = parseFlags(rest);

switch (cmd) {
  case 'check': await cmdCheck(); break;
  case 'wire': wire(); break;
  case 'gen': {
    if (flags.all) { for (const slug of Object.keys(ARTICLES)) await generate(slug, flags); }
    else { const slug = rest.find((x) => !x.startsWith('--')); await generate(slug, flags); }
    break;
  }
  default:
    console.log(`BookReady blog image generator

  check            validate OPENAI_API_KEY
  gen <slug>       generate one hero
  gen --all        generate all defined heroes
  wire             inject generated heroes into article HTML

Flags: --force --quality low|medium|high
Defined slugs: ${Object.keys(ARTICLES).join(', ')}`);
}
