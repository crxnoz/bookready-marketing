// The share card (1200x630): the night look of bkrdy.com. The eyebrow and the
// headline sit on the left over the dark ground; one of the site's two Kito
// paintings fills the right (the dusk moon or the lit cabin). Used by covers.mjs
// (articles) and share.mjs (every other page). Rendered by headless Chrome from
// the real fonts; the headline shrinks until it fits four lines.
import { writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Geist+Mono:wght@500&display=swap">';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Where each painting sits so Kito lands right of the text column.
const ART = {
  dusk: { file: 'dusk-kito.webp', css: 'width:1700px;left:-470px;top:-92px' },
  evening: { file: 'evening-kito.webp', css: 'width:1400px;left:-86px;top:-334px' },
};

export function cardHtml(root, { eyebrow, title, url, art = 'dusk' }) {
  const a = ART[art] || ART.dusk;
  const src = 'file:///' + join(root, 'images', 'art', a.file).replace(/\\/g, '/');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${FONTS}<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#08090D;color:#F2EFE8;position:relative;overflow:hidden;
     font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
.art{position:absolute;${a.css}}
.fade{position:absolute;inset:0;background:
  linear-gradient(90deg,#08090D 0%,rgba(8,9,13,.92) 36%,rgba(8,9,13,.35) 58%,rgba(8,9,13,0) 74%),
  linear-gradient(180deg,rgba(8,9,13,.55) 0%,rgba(8,9,13,0) 30%,rgba(8,9,13,0) 78%,rgba(8,9,13,.6) 100%)}
.in{position:absolute;inset:0;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between;z-index:2}
.wm{font-weight:800;font-size:30px;letter-spacing:-.03em}
.eb{font:500 16px/1 'Geist Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#E59A78;margin:0 0 22px}
h1{font-weight:800;font-size:68px;line-height:1.02;letter-spacing:-.04em;margin:0;max-width:660px;text-wrap:balance}
.u{font:500 16px/1 'Geist Mono',monospace;letter-spacing:.06em;color:#808898}
</style></head><body>
<img class="art" src="${src}" alt="">
<div class="fade"></div>
<div class="in">
  <div class="wm">BKRDY</div>
  <div>${eyebrow ? `<p class="eb">${esc(eyebrow)}</p>` : ''}<h1 id="t">${esc(title)}</h1></div>
  <div class="u">${esc(url)}</div>
</div>
<script>
document.fonts.ready.then(function () {
  var t = document.getElementById('t'), s = 68;
  var over = function () { return t.scrollHeight / (s * 1.02) > 4.15 || t.scrollWidth > t.clientWidth; };
  while (over() && s > 34) { s -= 2; t.style.fontSize = s + 'px'; }
});
</script></body></html>`;
}

// Renders one card to `out` (a .jpg path).
export async function renderCard(sharp, root, card, out) {
  const f = `${process.env.TEMP}/bq-card.html`, shot = `${process.env.TEMP}/bq-card.png`;
  writeFileSync(f, cardHtml(root, card));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--screenshot=${shot}`,
    '--window-size=1200,630', '--virtual-time-budget=8000', 'file:///' + f.replace(/\\/g, '/')], { stdio: 'ignore' });
  await sharp(shot).resize(1200, 630).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toFile(out);
  unlinkSync(shot);
}
