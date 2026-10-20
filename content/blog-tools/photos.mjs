// Adds a licensed photo to an article.
//   SHARP=<path to sharp> node content/blog-tools/photos.mjs <key> <file> "<alt text>"
//   node content/blog-tools/photos.mjs --find <key>
//   node content/blog-tools/photos.mjs --missing
//
// Luis licenses photos on Shutterstock himself and saves each one in
// C:\Users\carre\bkrdy-blog-photos named after the article (<key>.jpg). --find
// looks there and in Downloads and prints the path; --missing lists every
// article that has no photo yet, so the publish run can pick up a file added
// after an article is already live.
//
// Writes images/blog/<key>-photo-800.webp and -1600.webp (16:9) and sets
// `photo:` and `photoAlt:` in the article's front matter, after `keywords`.
//
// Anything narrower than 1600px is refused: Shutterstock's preview images are
// 1500px and carry a watermark, so a file that small is almost always a
// preview rather than the licensed download.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { frontMatter } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const PHOTOS = process.env.BKRDY_PHOTOS || join(homedir(), 'bkrdy-blog-photos');
const args = process.argv.slice(2);

const posts = () => readdirSync(SRC).filter(n => n.endsWith('.md'))
  .map(n => ({ file: join(SRC, n), meta: frontMatter(readFileSync(join(SRC, n), 'utf8'))[0] }));

if (args[0] === '--missing') {
  for (const p of posts()) {
    if (p.meta.photo) continue;
    console.log(`${p.meta.status === 'draft' ? 'draft ' : 'live  '} ${p.meta.key}   expects ${PHOTOS}\\${p.meta.key}.jpg`);
  }
  process.exit(0);
}

if (args[0] === '--find') {
  const key = String(args[1] || '').toLowerCase();
  if (!key) { console.error('usage: photos.mjs --find <key>'); process.exit(1); }
  for (const dir of [PHOTOS, join(homedir(), 'Downloads')]) {
    if (!existsSync(dir)) continue;
    const hit = readdirSync(dir).filter(n => /\.(jpe?g|png|webp|tiff?)$/i.test(n))
      .find(n => n.toLowerCase().replace(/\.[a-z]+$/, '') === key);
    if (hit) { console.log(join(dir, hit)); process.exit(0); }
  }
  process.exit(2);
}

const [key, file, alt] = args;
if (!key || !file || !alt) { console.error('usage: photos.mjs <key> <photo> "<alt text>"'); process.exit(1); }
const sharp = createRequire(import.meta.url)(process.env.SHARP);
const meta = await sharp(file).metadata();
if (meta.width < 1600) {
  console.error(`${file} is ${meta.width}px wide. Use the licensed download at its largest size; Shutterstock's watermarked previews are 1500px.`);
  process.exit(1);
}
mkdirSync(join(ROOT, 'images', 'blog'), { recursive: true });
for (const w of [800, 1600]) {
  await sharp(file).rotate().resize(w, Math.round(w * 9 / 16), { fit: 'cover', position: 'attention' })
    .webp({ quality: w === 800 ? 76 : 72 }).toFile(join(ROOT, 'images', 'blog', `${key}-photo-${w}.webp`));
}

const md = join(SRC, `${key}.md`);
if (!existsSync(md)) { console.error(`no article at content/blog/${key}.md`); process.exit(1); }
let s = readFileSync(md, 'utf8');
const eol = s.includes('\r\n') ? '\r\n' : '\n';
s = s.replace(/^photo:.*\r?\n/m, '').replace(/^photoAlt:.*\r?\n/m, '');
const at = s.match(/^keywords:.*\r?\n/m) || s.match(/^pillar:.*\r?\n/m);
const line = `photo: ${key}${eol}photoAlt: ${String(alt).replace(/\s+/g, ' ').trim()}${eol}`;
writeFileSync(md, s.slice(0, at.index + at[0].length) + line + s.slice(at.index + at[0].length));
console.log(`images/blog/${key}-photo-800.webp, -1600.webp; photo set on ${key}`);
