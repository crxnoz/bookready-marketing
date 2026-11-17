// Finds and adds an article photo from Pexels, so no article waits on a
// hand-licensed file. Pexels photos may be downloaded, re-hosted and used
// commercially; its API asks for a visible credit, which build.mjs prints under
// the photo from `photoCredit` and `photoCreditUrl`. Key: PEXELS_API_KEY in
// .env, never printed.
//
//   SHARP=<sharp> node content/blog-tools/photos-pexels.mjs --find <key> <outDir>
//     Searches the article's photoTerms, keeps landscape photos at least 1600px
//     wide that no other article uses, saves previews and a contact sheet
//     (<outDir>/<key>-sheet.jpg, lettered) plus <outDir>/<key>-candidates.json.
//     Optional --terms "a | b" searches those instead of photoTerms.
//
//   SHARP=<sharp> node content/blog-tools/photos-pexels.mjs --use <key> <pexelsId> "<alt text>"
//     Downloads the original into the photos folder as <key>.jpg, runs
//     photos.mjs on it (the webp sizes, photo and photoAlt), adds photoCredit
//     and photoCreditUrl, and records it in photo-credits.json so the same
//     photo is never used twice. Refuses if Luis already saved a <key> photo:
//     his licensed file always wins.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { frontMatter } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const PHOTOS = process.env.BKRDY_PHOTOS || join(homedir(), 'bkrdy-blog-photos');
const CREDITS = join(ROOT, 'content', 'blog-tools', 'photo-credits.json');
const env = readFileSync(join(ROOT, '.env'), 'utf8');
const KEY = (env.match(/^PEXELS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error('no PEXELS_API_KEY in .env'); process.exit(1); }
if (!process.env.SHARP) { console.error('set SHARP to the sharp module path'); process.exit(1); }
const sharp = createRequire(import.meta.url)(process.env.SHARP);

const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, 'utf8')) : {};
const usedIds = new Set(Object.values(credits).map(c => String(c.id)));
const api = async path => {
  const r = await fetch(`https://api.pexels.com/v1/${path}`, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status} on ${path.split('?')[0]}`);
  return r.json();
};
const article = key => {
  const file = join(SRC, `${key}.md`);
  if (!existsSync(file)) { console.error(`no article at content/blog/${key}.md`); process.exit(1); }
  return { file, meta: frontMatter(readFileSync(file, 'utf8'))[0] };
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === '--find') {
  const [key, outDir] = rest;
  if (!key || !outDir) { console.error('usage: --find <key> <outDir> [--terms "a | b"]'); process.exit(1); }
  const ti = rest.indexOf('--terms');
  const { meta } = article(key);
  const terms = String(ti > -1 ? rest[ti + 1] : meta.photoTerms || '').split('|').map(s => s.trim()).filter(Boolean);
  if (!terms.length) { console.error(`${key} has no photoTerms; pass --terms`); process.exit(1); }
  mkdirSync(outDir, { recursive: true });
  const seen = new Set(), cands = [];
  for (const t of terms) {
    const j = await api(`search?query=${encodeURIComponent(t)}&orientation=landscape&size=large&per_page=15&locale=en-US`);
    for (const p of j.photos || []) {
      const id = String(p.id);
      if (seen.has(id) || usedIds.has(id) || p.width < 1600 || p.width < p.height) continue;
      seen.add(id);
      cands.push({ id, term: t, width: p.width, height: p.height, alt: p.alt || '', photographer: p.photographer,
        photographerUrl: p.photographer_url, url: p.url, preview: p.src.medium });
    }
  }
  const pick = cands.slice(0, 12);
  if (!pick.length) { console.log('no unused landscape candidates; try --terms with other searches'); process.exit(2); }
  const TW = 360, TH = 240, LAB = 24, COLS = 4;
  const comps = [];
  for (let i = 0; i < pick.length; i++) {
    const c = pick[i], letter = String.fromCharCode(65 + i);
    c.letter = letter;
    const buf = Buffer.from(await (await fetch(c.preview)).arrayBuffer());
    const x = 8 + (i % COLS) * (TW + 8), y = 8 + Math.floor(i / COLS) * (TH + LAB + 8);
    comps.push({ input: await sharp(buf).resize(TW, TH, { fit: 'cover' }).toBuffer(), left: x, top: y });
    comps.push({ input: Buffer.from(`<svg width="${TW}" height="${LAB}"><text x="2" y="17" font-family="Arial" font-size="15" fill="#222">${letter}  ${esc(c.id)}  ${esc(c.photographer).slice(0, 28)}</text></svg>`), left: x, top: y + TH });
  }
  const rows = Math.ceil(pick.length / COLS);
  await sharp({ create: { width: 8 + COLS * (TW + 8), height: 8 + rows * (TH + LAB + 8), channels: 3, background: '#fff' } })
    .composite(comps).jpeg({ quality: 82 }).toFile(join(outDir, `${key}-sheet.jpg`));
  writeFileSync(join(outDir, `${key}-candidates.json`), JSON.stringify(pick, null, 1));
  console.log(join(outDir, `${key}-sheet.jpg`));
  for (const c of pick) console.log(`${c.letter}  ${c.id}  ${c.width}x${c.height}  ${c.photographer}  | ${c.alt.slice(0, 90)}`);
  process.exit(0);
}

if (cmd === '--use') {
  const [key, id, alt] = rest;
  if (!key || !id || !alt) { console.error('usage: --use <key> <pexelsId> "<alt text>"'); process.exit(1); }
  const { file, meta } = article(key);
  if (meta.photo) { console.error(`${key} already has a photo`); process.exit(1); }
  if (usedIds.has(String(id))) { console.error(`Pexels photo ${id} is already used by another article`); process.exit(1); }
  mkdirSync(PHOTOS, { recursive: true });
  const mine = readdirSync(PHOTOS).find(n => n.toLowerCase().replace(/\.[a-z]+$/, '') === key);
  if (mine) { console.error(`Luis saved ${mine} for ${key}; use photos.mjs with that file instead`); process.exit(1); }
  const p = await api(`photos/${id}`);
  if (p.width < 1600) { console.error(`photo ${id} is only ${p.width}px wide`); process.exit(1); }
  const dest = join(PHOTOS, `${key}.jpg`);
  writeFileSync(dest, Buffer.from(await (await fetch(p.src.original)).arrayBuffer()));
  execFileSync(process.execPath, [join(ROOT, 'content', 'blog-tools', 'photos.mjs'), key, dest, alt], { stdio: 'inherit', env: process.env });

  let s = readFileSync(file, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace(/^photoCredit:.*\r?\n/m, '').replace(/^photoCreditUrl:.*\r?\n/m, '');
  const at = s.match(/^photoAlt:.*\r?\n/m);
  // Some photographers' names on Pexels are a web address; credit the site name.
  const name = String(p.photographer || 'Pexels').replace(/\s+/g, ' ').trim()
    .replace(/^https?:\/\/(www\.)?/i, '').replace(/\/.*$/, '');
  s = s.slice(0, at.index + at[0].length) + `photoCredit: ${name}${eol}photoCreditUrl: ${p.url}${eol}` + s.slice(at.index + at[0].length);
  writeFileSync(file, s);
  credits[key] = { source: 'pexels', id: String(p.id), photographer: name, photographerUrl: p.photographer_url, url: p.url, added: new Date().toISOString().slice(0, 10) };
  writeFileSync(CREDITS, JSON.stringify(credits, null, 1) + '\n');
  console.log(`credit: Photo by ${name} on Pexels (${p.url})`);
  process.exit(0);
}

console.error('usage: photos-pexels.mjs --find <key> <outDir> | --use <key> <pexelsId> "<alt>"');
process.exit(1);
