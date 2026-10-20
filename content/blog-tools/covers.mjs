// One share image per article: images/blog/<key>-og.png, 1200x630.
//   SHARP=<path to sharp> node content/blog-tools/covers.mjs [key ...]
//
// This is the link preview people see when an article is shared in a WhatsApp
// group, an Instagram DM, on Facebook or in Google's results, so it is usually
// the first and sometimes the only BKRDY design a reader meets.
//
// Cream ground so it does not read as an ad, the headline in Fraunces, and one
// blush shape bleeding off the right edge. Which shape is used rotates by
// article, so a run of shares does not look like one repeated image. Rendered
// by headless Chrome from the real fonts; the headline shrinks until it fits
// and the text column never reaches the shape.
//
// Drafts get a share image too, so it is ready the day the article goes live.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter } from './md.mjs';
import { PILLARS } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const sharp = createRequire(import.meta.url)(process.env.SHARP);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@400;600;700;800&display=swap">';
const INK = '#121212', CREAM = '#F8F6F2', MUTED = '#6B7280', BLUSH = '#E8C7DA', LINE = 'rgba(18,18,18,0.18)';

const only = new Set(process.argv.slice(2));
mkdirSync(join(ROOT, 'images', 'blog'), { recursive: true });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const label = id => (PILLARS.find(p => p.id === id) || PILLARS[1]).label;

const files = readdirSync(SRC).filter(n => n.endsWith('.md'));
const keys = files.map(n => n.replace(/\.md$/, '')).sort();
const posts = files.map(n => frontMatter(readFileSync(join(SRC, n), 'utf8'))[0])
  .map(m => ({ ...m, key: m.key || '' }))
  .filter(m => !only.size || only.has(m.key));

// Four arrangements of the same two shapes. The headline column is the same
// width in all of them, so the title can never run into the artwork.
const SHAPES = [
  `<div class="disc" style="right:-120px;bottom:-150px;width:460px;height:460px"></div>
   <div class="ring" style="right:-54px;bottom:-96px;width:400px;height:400px"></div>`,
  `<div class="disc" style="right:-150px;top:-170px;width:470px;height:470px"></div>
   <div class="ring" style="right:-70px;top:-100px;width:390px;height:390px"></div>`,
  `<div class="ring" style="right:-110px;bottom:-130px;width:430px;height:430px"></div>
   <div class="disc" style="right:-40px;bottom:-60px;width:260px;height:260px"></div>`,
  `<div class="disc" style="right:-170px;bottom:-60px;width:420px;height:420px"></div>
   <div class="ring" style="right:-96px;top:-150px;width:330px;height:330px"></div>`,
];

const html = m => `<!doctype html><html lang="en"><head><meta charset="utf-8">${FONTS}<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${CREAM};color:${INK};position:relative;overflow:hidden;
     font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.disc{position:absolute;border-radius:50%;background:${BLUSH}}
.ring{position:absolute;border-radius:50%;border:2px solid ${LINE}}
.in{position:absolute;inset:0;padding:58px 64px;display:flex;flex-direction:column;justify-content:space-between;z-index:2}
.wm{display:flex;align-items:center;gap:11px;font:800 26px/1 Inter,sans-serif;letter-spacing:.12em}
.wm i{width:11px;height:11px;background:${BLUSH};display:block}
.eb{font:700 15px/1 Inter,sans-serif;letter-spacing:.17em;text-transform:uppercase;color:${MUTED};margin:0 0 20px}
h1{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:66px;line-height:1.05;letter-spacing:-.016em;
   margin:0;max-width:700px;text-wrap:balance}
.u{font:600 19px/1 Inter,sans-serif;color:${MUTED};letter-spacing:.02em}
</style></head><body>
${SHAPES[Math.abs(keys.indexOf(m.key)) % SHAPES.length]}
<div class="in">
  <div class="wm"><i></i>BKRDY</div>
  <div><p class="eb">${esc(label(m.pillar))}</p><h1 id="t">${esc(m.title)}</h1></div>
  <div class="u">bkrdy.com/${m.section === 'guides' ? 'guides' : 'blog'}</div>
</div>
<script>
// Shrink the headline until it fits its column in at most four lines.
document.fonts.ready.then(function () {
  var t = document.getElementById('t'), s = 66;
  var over = function () { return t.scrollHeight / (s * 1.05) > 4.15 || t.scrollWidth > t.clientWidth; };
  while (over() && s > 34) { s -= 2; t.style.fontSize = s + 'px'; }
  document.body.dataset.fit = s;
});
</script></body></html>`;

for (const m of posts) {
  if (!m.key) continue;
  const f = `${process.env.TEMP}/bq-cover.html`, shot = `${process.env.TEMP}/bq-cover.png`;
  writeFileSync(f, html(m));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--screenshot=${shot}`,
    '--window-size=1200,630', '--virtual-time-budget=8000', 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
  const out = join(ROOT, 'images', 'blog', `${m.key}-og.png`);
  await sharp(shot).resize(1200, 630).png({ compressionLevel: 9, palette: true, quality: 92 }).toFile(out);
  unlinkSync(shot);
  console.log(`images/blog/${m.key}-og.png`);
}
