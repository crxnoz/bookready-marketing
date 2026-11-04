// Template covers, step 1 of 2: phone screenshots of every demo site (opening screen + booking step),
// 390x844 @2x, the "Use this template" bar hidden. Writes {slug}-hero.png / {slug}-book.png into shots/.
//   node content/template-covers/shoot.js ["slug slug"]   (run from the repo root; needs the app repo's playwright)
// Then compose.js. Built 2026-11-01, see docs/marketing-media.md in the app repo.
// COVER_BASE=http://localhost:3000/site/ reads a local page instead, for a design that isn't live yet (the frame's ?frame=1).
// Two phone screens per demo: the opening screen and the booking section, at 390x844 @2x, demo bar hidden.
const { chromium } = require('C:/Users/carre/bookready/web/node_modules/playwright');
const DIR = require('path').join(__dirname, 'shots'); require('fs').mkdirSync(DIR, { recursive: true });
const BASE = process.env.COVER_BASE;
const CLEAN = 'nextjs-portal, .bkf-dock, .br-seasonal { display: none !important; }';
const slugs = (process.argv[2] || 'arcanum blackline bleeker blushgallery bottega chroma clarity inkhouse lushstudio opaline petale riso savilerow thefaderoom velvettheory').split(' ');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('br_demo_template_tab_dismissed', '1'); } catch (e) {} });
  for (const s of slugs) {
    const p = await ctx.newPage();
    try {
      await p.goto(BASE ? `${BASE}${s}?frame=1` : `https://${s}.bkrdy.me/`, { waitUntil: 'load', timeout: 180000 });
      await p.waitForSelector('#book', { timeout: 120000 });
      await p.addStyleTag({ content: CLEAN });
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }));
      // walk the page so lazy images load, then come back up
      const h = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
      await p.waitForTimeout(800);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(900);
      if (!process.env.BOOK_ONLY) await p.screenshot({ path: `${DIR}/${s}-hero.png` });
      const y = await p.evaluate(() => {
        const el = document.querySelector('#book');
        const rail = document.querySelector('.bkf-rail');
        return Math.max(0, el.getBoundingClientRect().top + window.scrollY - (rail ? rail.offsetHeight : 0));
      });
      await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(1200);
      await p.screenshot({ path: `${DIR}/${s}-book.png` });
      console.log(s, 'ok, book at', Math.round(y));
    } catch (e) { console.log(s, 'FAIL', e.message.slice(0, 120)); }
    await p.close();
  }
  await b.close();
})();
