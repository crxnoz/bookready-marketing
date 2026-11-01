// In-article graphics: images/blog/<key>-<name>.webp (1200x1500) and -720.webp.
//   SHARP=<path to sharp> node content/blog-tools/graphics.mjs [key ...]
//
// Portrait 4:5 so it reads at full width on a phone and doubles as an Instagram
// post. Content comes from content/blog/graphics.mjs, and every word in it must
// already appear in the article: a graphic is a summary, never a new claim, a
// new number or a new promise.
//
// The night look of bkrdy.com since 2026-11-01: the site's dark ground and moon,
// Plus Jakarta Sans with Geist Mono labels, in place of the cream cards.
//
// The host caches images for a year (immutable), so a graphic that changes after
// it went live gets a new `name` in content/blog/graphics.mjs and in the Markdown
// line. Never render over a file a live page has already served.
//
// Rendered by headless Chrome at 2x from the real fonts. The whole block scales
// down until nothing overflows, so a longer list simply sets smaller rather
// than running off the bottom.
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRAPHICS } from '../blog/graphics.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sharp = createRequire(import.meta.url)(process.env.SHARP);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Geist+Mono:wght@500&display=swap">';
// The tokens of v2.css.
const BG = '#0F1117', CARD = '#161922', CARD_2 = '#1E222D', TEXT = '#F2EFE8', TEXT_2 = '#AEB5C1', TEXT_3 = '#808898',
  ACCENT = '#E59A78', MOON = '#D2683F', LINE = 'rgba(242,239,232,0.14)', HAIR = 'rgba(242,239,232,0.08)';
const SANS = "'Plus Jakarta Sans',sans-serif", MONO = "'Geist Mono',monospace";

const only = new Set(process.argv.slice(2));
mkdirSync(join(ROOT, 'images', 'blog'), { recursive: true });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const k = px => `calc(${px}px * var(--k))`;
const TICK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:${BG};color:${TEXT};font-family:${SANS};position:relative;
     -webkit-font-smoothing:antialiased;display:flex;flex-direction:column;padding:62px 64px 52px;gap:${k(26)};
     overflow:hidden;--k:1}
/* The moon of the site's paintings, off the top right corner. The headline's
   column stops short of it, so no line ever sits on the disc. */
.glow{position:absolute;right:-290px;top:-320px;width:740px;height:740px;border-radius:50%;
      background:radial-gradient(circle,rgba(229,154,120,.26) 0%,rgba(229,154,120,.08) 42%,rgba(229,154,120,0) 70%)}
.disc{position:absolute;right:-90px;top:-120px;width:340px;height:340px;border-radius:50%;background:${MOON}}
.wm,.hero,.main,.ft{position:relative;z-index:1}
.wm{font-weight:800;font-size:32px;line-height:1;letter-spacing:-.03em}
.eb{font:500 22px/1 ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};margin-bottom:${k(18)}}
h1{font-weight:800;font-size:${k(66)};line-height:1.02;letter-spacing:-.04em;max-width:760px;text-wrap:balance}
.main{flex:1;min-height:0;display:flex;flex-direction:column;gap:${k(18)}}
.main>*{flex-shrink:0}
.card{background:${CARD};border:1px solid ${LINE};border-radius:28px}
.note{font-weight:500;font-size:${k(27)};line-height:1.35;color:${TEXT_2}}
.ft{display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${LINE};
    padding-top:20px;font:500 18px/1 ${MONO};color:${TEXT_3};letter-spacing:.06em}
svg{display:block}

/* steps + checklist */
.it{display:grid;grid-template-columns:${k(62)} 1fr;gap:${k(20)};align-items:start;
    padding:${k(20)} ${k(24)};border-bottom:1px solid ${HAIR}}
.it:last-child{border-bottom:0}
.n{width:${k(58)};height:${k(58)};border-radius:50%;background:rgba(229,154,120,.14);color:${ACCENT};display:grid;place-items:center;
   font-weight:800;font-size:${k(28)};line-height:1}
.t{font-weight:700;font-size:${k(32)};line-height:1.22;letter-spacing:-.02em;color:${TEXT}}
.d{font-weight:500;font-size:${k(26)};line-height:1.35;color:${TEXT_2};margin-top:${k(7)}}

/* do / do not */
.panel{padding:${k(26)} ${k(28)};display:flex;flex-direction:column;gap:${k(14)};border-radius:28px}
.panel--do{background:${CARD_2};border:1px solid rgba(229,154,120,.34)}
.panel--no{background:${CARD};border:1px solid ${LINE}}
.panel h2{font-weight:800;font-size:${k(34)};line-height:1;letter-spacing:-.03em}
.pi{display:grid;grid-template-columns:${k(34)} 1fr;gap:${k(14)};align-items:start;
    font-size:${k(28)};line-height:1.28;font-weight:500;color:${TEXT}}
.pi svg{width:${k(28)};height:${k(28)};margin-top:${k(4)}}
.panel--do .pi svg{color:${ACCENT}}
.panel--no .pi svg{color:${TEXT_3}}

/* compare */
.ch{display:grid;grid-template-columns:1fr 1fr;gap:${k(12)};margin-bottom:${k(4)}}
/* Both columns are set the same on purpose. A comparison graphic that makes
   one side look like the answer is an advert, and these compare other
   people's products as often as ours. */
.ch div{padding:${k(16)} ${k(18)};font-weight:800;font-size:${k(28)};letter-spacing:-.02em;
        line-height:1.1;border:1px solid ${LINE};background:${CARD};border-radius:20px}
.row{padding:${k(16)} 0;border-bottom:1px solid ${HAIR}}
.row:last-child{border-bottom:0}
.rl{font:500 ${k(19)}/1 ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${TEXT_3};margin-bottom:${k(10)}}
.cells{display:grid;grid-template-columns:1fr 1fr;gap:${k(12)}}
.cell{font-weight:500;font-size:${k(27)};line-height:1.25;color:${TEXT_2}}

/* costs */
.cg{padding:${k(22)} ${k(26)} ${k(10)};background:${CARD};border:1px solid ${LINE};border-radius:28px}
.cg h2{font-weight:800;font-size:${k(34)};line-height:1;letter-spacing:-.03em;margin-bottom:${k(6)}}
.cg .sub{font:500 ${k(19)}/1 ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${TEXT_3};margin-bottom:${k(12)}}
.cr{display:flex;justify-content:space-between;align-items:baseline;gap:${k(18)};padding:${k(13)} 0;
    border-bottom:1px solid ${HAIR};font-weight:500;font-size:${k(29)};line-height:1.25;color:${TEXT_2}}
.cr:last-child{border-bottom:0}
.cr b{font-weight:700;color:${TEXT};white-space:nowrap;text-align:right}

/* policy: a block the reader can copy, set the way it would be sent */
.pol{padding:${k(28)} ${k(30)};border:2px dashed ${LINE};background:${CARD};border-radius:28px;display:flex;
     flex-direction:column;gap:${k(16)}}
.pol p{font-weight:500;font-size:${k(30)};line-height:1.42;color:${TEXT}}
.pol .q{font-size:${k(26)};color:${TEXT_3}}

/* flow: if this, then that */
.fl{padding:${k(18)} ${k(24)};border-bottom:1px solid ${HAIR};display:flex;flex-direction:column;gap:${k(8)}}
.fl:last-child{border-bottom:0}
.fl .w{font-weight:700;font-size:${k(30)};line-height:1.22;letter-spacing:-.02em;color:${TEXT}}
.fl .then{display:flex;align-items:baseline;gap:${k(12)};font-weight:500;font-size:${k(27)};line-height:1.3;color:${TEXT_2}}
.fl .then i{font-style:normal;color:${ACCENT};font-size:${k(26)};font-weight:800}
`;

const T = {
  steps: c => `<div class="card">${c.steps.map((s, i) =>
    `<div class="it"><div class="n">${i + 1}</div><div><p class="t">${esc(s[0])}</p>${s[1] ? `<p class="d">${esc(s[1])}</p>` : ''}</div></div>`).join('')}</div>` +
    (c.note ? `<p class="note">${esc(c.note)}</p>` : ''),

  checklist: c => `<div class="card">${c.items.map(s =>
    `<div class="it"><div class="n">${TICK.replace('<svg', `<svg style="width:${k(30)};height:${k(30)}"`)}</div><div><p class="t">${esc(Array.isArray(s) ? s[0] : s)}</p>${Array.isArray(s) && s[1] ? `<p class="d">${esc(s[1])}</p>` : ''}</div></div>`).join('')}</div>` +
    (c.note ? `<p class="note">${esc(c.note)}</p>` : ''),

  dodont: c => `<div class="panel panel--do"><h2>${esc(c.doLabel)}</h2>${c.do.map(s => `<p class="pi">${TICK}<span>${esc(s)}</span></p>`).join('')}</div>
    <div class="panel panel--no"><h2>${esc(c.noLabel)}</h2>${c.no.map(s => `<p class="pi">${CROSS}<span>${esc(s)}</span></p>`).join('')}</div>`,

  compare: c => `<div class="ch"><div>${esc(c.cols[0])}</div><div>${esc(c.cols[1])}</div></div>
    <div class="card" style="padding:0 ${k(24)}">${c.rows.map(r =>
      `<div class="row"><p class="rl">${esc(r[0])}</p><div class="cells"><p class="cell">${esc(r[1])}</p><p class="cell">${esc(r[2])}</p></div></div>`).join('')}</div>` +
    (c.note ? `<p class="note">${esc(c.note)}</p>` : ''),

  costs: c => `<div class="cg"><h2>${esc(c.aLabel)}</h2><p class="sub">${esc(c.aSub || '')}</p>${c.a.map(r =>
      `<div class="cr"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div>
    <div class="cg"><h2>${esc(c.bLabel)}</h2><p class="sub">${esc(c.bSub || '')}</p>${c.b.map(r =>
      `<div class="cr"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div>` +
    (c.note ? `<p class="note">${esc(c.note)}</p>` : ''),

  policy: c => `<div class="pol">${c.lines.map(l => `<p>${esc(l)}</p>`).join('')}
    ${c.note ? `<p class="q">${esc(c.note)}</p>` : ''}</div>`,

  // The label heads the whole list once. Repeating it on every row reads as
  // noise when the rows are already the same shape.
  flow: c => (c.ifLabel ? `<p class="rl" style="margin-bottom:0">${esc(c.ifLabel)}</p>` : '') +
    `<div class="card">${c.rows.map(r =>
      `<div class="fl"><p class="w">${esc(r[0])}</p>
      <p class="then"><i>&rarr;</i><span>${esc(r[1])}</span></p></div>`).join('')}</div>` +
    (c.note ? `<p class="note">${esc(c.note)}</p>` : ''),
};

const page = g => `<!doctype html><html lang="en"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>
<div class="glow"></div><div class="disc"></div>
<div class="wm">BKRDY</div>
<div class="hero"><p class="eb">${esc(g.label)}</p><h1>${esc(g.title)}</h1></div>
<div class="main" id="main">${T[g.type](g)}</div>
<div class="ft"><span>bkrdy.com/blog</span><span>AI FOR YOUR BOOKING BUSINESS</span></div>
<script>
// Scale the block to fill the frame: grow until it would overflow, then step
// back one. A short list therefore sets large and readable on a phone, and a
// long one sets small rather than running off the bottom.
document.fonts.ready.then(function () {
  var m = document.getElementById('main'), s = 0.60;
  var set = function (v) { document.body.style.setProperty('--k', v.toFixed(2)); };
  set(s);
  while (s < 1.60 && m.scrollHeight <= m.clientHeight) { s += 0.02; set(s); }
  while (s > 0.50 && m.scrollHeight > m.clientHeight) { s -= 0.02; set(s); }
  document.title = 'k=' + s.toFixed(2);
});
</script></body></html>`;

for (const g of GRAPHICS.filter(g => !only.size || only.has(g.key))) {
  if (!T[g.type]) { console.error(`${g.key}: unknown graphic type "${g.type}"`); continue; }
  const f = `${process.env.TEMP}/bq-graphic.html`, shot = `${process.env.TEMP}/bq-graphic.png`;
  writeFileSync(f, page(g));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    `--screenshot=${shot}`, '--window-size=1080,1350', '--virtual-time-budget=8000', 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
  const base = join(ROOT, 'images', 'blog', `${g.key}-${g.name}`);
  await sharp(shot).resize(1200, 1500).webp({ quality: 84 }).toFile(`${base}.webp`);
  await sharp(shot).resize(720, 900).webp({ quality: 80 }).toFile(`${base}-720.webp`);
  unlinkSync(shot);
  console.log(`images/blog/${g.key}-${g.name}.webp`);
}
