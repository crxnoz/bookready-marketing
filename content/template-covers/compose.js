// Template covers, step 2 of 2: two phones on the night ground, lit in each template's colour, 1280x1600.
//   node content/template-covers/compose.js ["slug slug"] [out dir]
// Hostinger serves images with a one-year immutable cache, so a new set of covers needs NEW file names:
// write them to the next folder and repoint the pages, never overwrite one in place. Today's set is v3, so the next is v4.
// Template covers for bkrdy.com: two phones (booking behind, opening screen in front) on the
// site's night ground, lit by each template's own colour. 1280x1600 (4:5), like the old ones.
const { chromium } = require('C:/Users/carre/bookready/web/node_modules/playwright');
const sharp = require('C:/Users/carre/bookready-marketing/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const GLOW = {
  arcanum: ['#C9A24A', '#3B2E8C'], blackline: ['#C59A5B', '#6B5A44'], bleeker: ['#F5D000', '#8A7A1A'],
  blushgallery: ['#E8A9B4', '#8C5A66'], bottega: ['#D0773A', '#8A5A3C'], chroma: ['#FF4FA0', '#7C5CFF'],
  clarity: ['#E9E2D6', '#8C8A84'], inkhouse: ['#C0703A', '#5A3A2A'], lushstudio: ['#9C8BD6', '#E6B8C8'],
  opaline: ['#D4B98C', '#8FA7A3'], petale: ['#E89AB0', '#A8566E'], riso: ['#FF5FA2', '#3DB7E4'],
  savilerow: ['#C9A45C', '#5C4A2A'], thefaderoom: ['#E21ED6', '#6B1AF0'], velvettheory: ['#A33A55', '#5A1A2A'],
};
const slugs = process.argv[2] ? process.argv[2].split(' ') : Object.keys(GLOW);
const OUT = process.argv[3] || path.join(__dirname, '..', '..', 'images', 'templates', 'v3');
fs.mkdirSync(OUT, { recursive: true });

const html = (s, [a, b], top) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: 1280px; height: 1600px; overflow: hidden; background: #08090D; }
  .bg { position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 58% 44% at 50% 54%, ${a}8C 0%, ${a}2E 50%, transparent 76%),
      radial-gradient(ellipse 60% 44% at 12% 10%, ${b}80 0%, transparent 70%),
      radial-gradient(ellipse 40% 36% at 96% 34%, ${a}47 0%, transparent 72%),
      radial-gradient(ellipse 50% 34% at 86% 96%, ${b}59 0%, transparent 70%),
      #0A0B10; }
  .grain { position: absolute; inset: 0; opacity: .16; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }
  .floor { position: absolute; left: 140px; right: 120px; bottom: 120px; height: 120px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(0,0,0,.75), transparent); filter: blur(14px); }
  .phone { position: absolute; width: 508px; height: 1060px; border-radius: 84px; padding: 17px; box-sizing: border-box;
    background: linear-gradient(150deg, #3a3d44 0%, #16171b 38%, #0c0d10 70%, #2a2c31 100%);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.14), inset 0 0 0 5px #050506, 0 70px 120px -20px rgba(0,0,0,.85), 0 30px 60px rgba(0,0,0,.45); }
  .screen { position: relative; width: 100%; height: 100%; border-radius: 67px; overflow: hidden; background: var(--sb); display: flex; flex-direction: column; }
  .screen img { display: block; width: 100%; flex: 1; min-height: 0; object-fit: cover; object-position: top; }
  .sb { height: 52px; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 6px 34px 0 44px; box-sizing: border-box; font: 600 17px -apple-system, "Segoe UI", Arial, sans-serif; color: var(--sbt); }
  .sb i { display: inline-block; width: 26px; height: 12px; border: 1.6px solid var(--sbt); border-radius: 4px; position: relative; opacity: .9; }
  .sb i::after { content: ""; position: absolute; inset: 1.5px 5px 1.5px 1.5px; background: var(--sbt); border-radius: 2px; }
  .sb b { display: inline-flex; gap: 2px; align-items: flex-end; margin-right: 8px; }
  .sb b span { width: 3.5px; background: var(--sbt); border-radius: 1px; }
  .island { position: absolute; top: 12px; left: 50%; width: 118px; height: 34px; margin-left: -59px; border-radius: 20px; background: #000; z-index: 2; }
  .back { left: 84px; top: 196px; transform: rotate(-7deg); }
  .front { left: 632px; top: 372px; transform: rotate(5deg); }
</style></head><body>
  <div class="bg"></div><div class="grain"></div><div class="floor"></div>
  <div class="phone back"><div class="screen" style="--sb:${top.book[0]};--sbt:${top.book[1]}"><div class="island"></div><div class="sb"><span>9:41</span><span><b><span style="height:5px"></span><span style="height:8px"></span><span style="height:11px"></span><span style="height:14px"></span></b><i></i></span></div><img src="${s}-book.png"></div></div>
  <div class="phone front"><div class="screen" style="--sb:${top.hero[0]};--sbt:${top.hero[1]}"><div class="island"></div><div class="sb"><span>9:41</span><span><b><span style="height:5px"></span><span style="height:8px"></span><span style="height:11px"></span><span style="height:14px"></span></b><i></i></span></div><img src="${s}-hero.png"></div></div>
</body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1 })).newPage();
  for (const s of slugs) {
    const file = path.join(__dirname, 'shots', `cover-${s}.html`);
    const top = {};
    for (const k of ['hero', 'book']) {
      const { data } = await sharp(path.join(__dirname, 'shots', `${s}-${k}.png`)).extract({ left: 0, top: 0, width: 780, height: 6 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
      const [r, g, bl] = data; const lum = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      top[k] = [`rgb(${r},${g},${bl})`, lum > 140 ? '#111' : '#fff'];
    }
    fs.writeFileSync(file, html(s, GLOW[s], top));
    await p.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load' });
    await p.waitForTimeout(150);
    const png = await p.screenshot({ type: 'png' });
    await sharp(png).jpeg({ quality: 84, progressive: true, mozjpeg: true }).toFile(`${OUT}/${s}.jpg`);
    console.log(s, (fs.statSync(`${OUT}/${s}.jpg`).size / 1024 | 0) + 'KB');
  }
  await b.close();
})();
