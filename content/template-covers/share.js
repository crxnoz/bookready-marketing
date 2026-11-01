// Share card for each template page (1200x630): the template's name and line on
// the left, its two phones on the right in its own colour, on the night ground.
// Uses the screenshots shoot.js leaves in shots/; name and line come from the
// cards on templates/index.html. Writes images/og/v2/template-<key>.jpg; then run
// content/blog-tools/share.mjs to point the template pages at them.
//   node content/template-covers/share.js ["key key"]
// New cards need new file names (Hostinger caches images for a year).
const { chromium } = require('C:/Users/carre/bookready/web/node_modules/playwright');
const sharp = require('C:/Users/carre/bookready-marketing/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SHOTS = path.join(__dirname, 'shots');
const OUT = path.join(ROOT, 'images', 'og', 'v2');
const GLOW = {
  arcanum: ['#C9A24A', '#3B2E8C'], blackline: ['#C59A5B', '#6B5A44'], bleeker: ['#F5D000', '#8A7A1A'],
  blushgallery: ['#E8A9B4', '#8C5A66'], bottega: ['#D0773A', '#8A5A3C'], chroma: ['#FF4FA0', '#7C5CFF'],
  clarity: ['#E9E2D6', '#8C8A84'], inkhouse: ['#C0703A', '#5A3A2A'], lushstudio: ['#9C8BD6', '#E6B8C8'],
  opaline: ['#D4B98C', '#8FA7A3'], petale: ['#E89AB0', '#A8566E'], riso: ['#FF5FA2', '#3DB7E4'],
  savilerow: ['#C9A45C', '#5C4A2A'], thefaderoom: ['#E21ED6', '#6B1AF0'], velvettheory: ['#A33A55', '#5A1A2A'],
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const idx = fs.readFileSync(path.join(ROOT, 'templates', 'index.html'), 'utf8');
const info = {};
for (const m of idx.matchAll(/<a class="v-tpl" href="\/templates\/([a-z]+)\/"[\s\S]*?<h3 class="v-h3">([^<]+)<\/h3>[\s\S]*?<p class="v-tpl__mood">([^<]+)<\/p>/g)) info[m[1]] = { name: m[2].replace(/&amp;/g, '&'), line: m[3].replace(/&amp;/g, '&') };
const keys = process.argv[2] ? process.argv[2].split(' ') : Object.keys(GLOW);

const phone = (img, sb, cls) => `<div class="phone ${cls}"><div class="screen" style="--sb:${sb[0]};--sbt:${sb[1]}"><div class="island"></div>
  <div class="sb"><span>9:41</span><span><b><span style="height:4px"></span><span style="height:6px"></span><span style="height:8px"></span><span style="height:10px"></span></b><i></i></span></div>
  <img src="${img}"></div></div>`;

const html = (k, [a, b], top) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800&family=Geist+Mono:wght@500&display=swap">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;background:#08090D;color:#F2EFE8;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;position:relative}
  .bg{position:absolute;inset:0;background:
    radial-gradient(ellipse 46% 70% at 78% 56%, ${a}80 0%, ${a}26 52%, transparent 78%),
    radial-gradient(ellipse 40% 60% at 98% 4%, ${b}66 0%, transparent 70%),
    linear-gradient(90deg,#08090D 0%,#08090D 40%,transparent 64%)}
  .in{position:absolute;left:64px;top:56px;bottom:56px;width:490px;display:flex;flex-direction:column;justify-content:space-between;z-index:3}
  .wm{font-weight:800;font-size:30px;letter-spacing:-.03em}
  .eb{font:500 16px/1 'Geist Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#E59A78;margin:0 0 22px}
  h1{font-weight:800;font-size:76px;line-height:1;letter-spacing:-.045em;text-wrap:balance}
  .ln{margin-top:20px;font-weight:500;font-size:26px;line-height:1.3;color:#AEB5C1;max-width:460px}
  .u{font:500 16px/1 'Geist Mono',monospace;letter-spacing:.06em;color:#808898}
  .phone{position:absolute;width:300px;height:626px;border-radius:50px;padding:11px;
    background:linear-gradient(150deg,#3a3d44 0%,#16171b 38%,#0c0d10 70%,#2a2c31 100%);
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 0 0 3.5px #050506,0 40px 80px -10px rgba(0,0,0,.85)}
  .screen{position:relative;width:100%;height:100%;border-radius:40px;overflow:hidden;background:var(--sb);display:flex;flex-direction:column}
  .screen img{display:block;width:100%;flex:1;min-height:0;object-fit:cover;object-position:top}
  .island{position:absolute;top:8px;left:50%;width:76px;height:22px;margin-left:-38px;border-radius:12px;background:#000;z-index:2}
  .sb{height:34px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:4px 22px 0 28px;font:600 11px Arial,sans-serif;color:var(--sbt)}
  .sb i{display:inline-block;width:17px;height:8px;border:1.2px solid var(--sbt);border-radius:3px;position:relative}
  .sb i::after{content:"";position:absolute;inset:1px 3px 1px 1px;background:var(--sbt);border-radius:1px}
  .sb b{display:inline-flex;gap:1.5px;align-items:flex-end;margin-right:6px}
  .sb b span{width:2.5px;background:var(--sbt);border-radius:1px}
  .back{left:604px;top:58px;transform:rotate(-7deg)}
  .front{left:832px;top:96px;transform:rotate(5deg)}
</style></head><body>
<div class="bg"></div>
${phone(`${k}-book.png`, top.book, 'back')}
${phone(`${k}-hero.png`, top.hero, 'front')}
<div class="in">
  <div class="wm">BKRDY</div>
  <div><p class="eb">Template</p><h1>${esc(info[k].name)}</h1><p class="ln">${esc(info[k].line)}</p></div>
  <div class="u">bkrdy.com/templates/${k}</div>
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
  for (const k of keys) {
    if (!info[k]) { console.log('no card on templates/index.html for', k); continue; }
    const top = {};
    for (const s of ['hero', 'book']) {
      const { data } = await sharp(path.join(SHOTS, `${k}-${s}.png`)).extract({ left: 0, top: 0, width: 780, height: 6 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
      const [r, g, bl] = data;
      top[s] = [`rgb(${r},${g},${bl})`, 0.2126 * r + 0.7152 * g + 0.0722 * bl > 140 ? '#111' : '#fff'];
    }
    const file = path.join(SHOTS, `share-${k}.html`);
    fs.writeFileSync(file, html(k, GLOW[k], top));
    await p.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const png = await p.screenshot({ type: 'png' });
    const out = path.join(OUT, `template-${k}.jpg`);
    await sharp(png).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toFile(out);
    console.log(`images/og/v2/template-${k}.jpg`, (fs.statSync(out).size / 1024 | 0) + 'KB');
  }
  await b.close();
})();
