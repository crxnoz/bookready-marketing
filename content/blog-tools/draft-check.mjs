// Checks drafts against the writing rules before anything reaches the review
// page. Run it on every draft in a batch; it is the step that catches the
// things a reader would notice and a scheduled run would not.
//   node content/blog-tools/draft-check.mjs [key ...]
//   node content/blog-tools/draft-check.mjs --claims [key ...]
//     Only the claims check below, on the keys given or on every article, live
//     ones included. The publish run calls this before an article goes out.
//
// Errors are things that must be fixed. Warnings are things to look at.
// Exit code is 1 if there is any error.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter, markdown } from './md.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content', 'blog');
const CLAIMS_ONLY = process.argv.includes('--claims');
const only = new Set(process.argv.slice(2).filter(a => a !== '--claims'));

const ORDER = ['key', 'section', 'slug', 'title', 'metaTitle', 'description', 'date', 'pillar',
  'keywords', 'photoTerms', 'photo', 'photoAlt', 'status'];
const PILLARS = new Set(['switching', 'money', 'coming-back', 'your-site', 'the-week', 'going-solo']);
// Words that mark the voice the blog does not use.
// Matched narrowly on purpose: "unlock the door" is a door, and a "robust
// chair" is a chair. Only the marketing senses are off-voice.
const BANNED = /\b(game.?changer|elevate your \w+|seamless(ly)?|leverage (your|the|our)|unlock (your|the|new|more) (potential|growth|revenue|value|power|opportunit\w+)|supercharge|revolutioni[sz]e|in today's|fast.?paced|cutting.?edge|empower (your|clients|owners)|delve into|tapestry|testament to)\b/i;
// A claim shaped like evidence we do not have.
const FAKE_EVIDENCE = /\b(studies show|research shows|according to (a )?(study|survey|research)|statistics show|\d+% of (clients|owners|salons|people|businesses)|on average,? \w+ (lose|gain|save))/i;
const REAL_PRICES = { 'starter': 0, 'solo': 21, 'studio': 34, 'studio+': 55 };

// Things BKRDY does not do today, checked against the app on 2026-11-03. The
// list and what to say instead are in blog-loop.md, "What BKRDY does and does
// not do". This looks only at sentences that name BKRDY or link to a product
// page, and skips sentences that say BKRDY does not do it, so general advice
// and honest trade-offs pass. It is a lint, not proof: it catches the claims
// that have shipped before, not every possible one. When a feature ships, take
// its line out here and in the playbook.
const PRODUCT = /\bBKRDY\b|\]\(\/(platform|pricing|free|migration|templates|for-)/;
const NEGATED = /\b(does not|doesn't|do not|don't|did not|has no|have no|no|not|never|without|isn't|cannot|can't|instead of|rather than|nor)\b/i;
const CLAIMS = [
  [/\bsync(s|ed|ing)?\b|two-way|sends? .{0,40}google calendar|google calendar .{0,30}(connect|integrat)/i, 'Google Calendar sync is not live. There is only a read-only feed'],
  [/\bcampaigns?\b|\bblasts?\b|\bnewsletters?\b|\bbroadcasts?\b|\bdrip (campaign|sequence|email)|email your (whole )?(list|clients)|text your (whole )?(list|clients)/i, 'BKRDY sends no campaigns or messages to a list'],
  [/win-?back (message|email|text|campaign|sequence|automation)|automatic win-?back|re-?engage|we miss you|rebook(ing)? (reminder|nudge|prompt|message)|birthday (message|email|text)|aftercare (email|message|text)|follow-?up (email|message|text|sequence)|thank-?you (email|message|text)/i, 'BKRDY sends no win-back, rebooking, birthday, aftercare or follow-up messages'],
  [/custom domain|own domain|your domain|connect(ing)? (a|your) domain/i, 'custom domains are not deliverable'],
  [/per[- ]service deposit|deposit (per|for each|on each|by) service|deposits? (per|by|for each) (client|tag)|different deposit|(skip|waive|exempt)(s|ing)? .{0,30}deposit|deposit.{0,40}(new|returning|trusted|vip) clients/i, 'the deposit is one studio-wide rule, flat or percent'],
  [/recurring|standing appointment|book(s|ing)? (a|the) series/i, 'there are no recurring bookings'],
  [/two reminders|second reminder|reminder sequence|multi-?touch|confirm by (text|reply)|reply to confirm|two-way text|text(ing)? inbox|confirmation texts?|texts? .{0,20}confirmation/i, 'one reminder per appointment; clients get no confirmation text and replies are not read'],
  [/reserve with google|zapier|mailchimp|quickbooks|tap to pay|card reader|\bPOS\b|commission tracking|payroll|per-artist payout|group booking|memberships?\b|prepaid|mobile app|app store|google play|in the app\b/, 'not a BKRDY feature'],
  [/\b(cut|cuts|reduce|reduces|slash|slashes|lower|lowers)\b.{0,30}no-shows? by \d|\d+% (fewer|less|more)/i, 'no invented results'],
  [/\bStarter\b/, 'the $0 plan is called the Free plan'],
];
function claimIssues(body) {
  const out = [];
  for (const line of body.split('\n')) {
    for (const s of line.match(/[^.!?]+(?:[.!?]+["')\]]*\s*|$)/g) || []) {
      // A question, or a list of links to other articles, claims nothing.
      if (!PRODUCT.test(s) || NEGATED.test(s) || /\?\s*$/.test(s) || /^\s*- \[/.test(line)) continue;
      for (const [re, why] of CLAIMS) {
        if (re.test(s)) out.push(`${why}: "${s.trim().slice(0, 140)}"`);
      }
    }
  }
  return out;
}

const files = readdirSync(SRC).filter(n => n.endsWith('.md'));
if (CLAIMS_ONLY) {
  let hits = 0;
  for (const n of files) {
    const [m, body] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
    if (only.size && !only.has(m.key)) continue;
    for (const c of [...claimIssues(m.description || ''), ...claimIssues(body)]) {
      console.log(`${m.key}: ${c}`);
      hits++;
    }
  }
  console.log(hits ? `${hits} claims to check against blog-loop.md` : 'no flagged claims');
  process.exit(hits ? 1 : 0);
}
const live = new Set();           // every url the site will have
for (const n of files) {
  const [m] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
  live.add(`/${m.section === 'guides' ? 'guides' : 'blog'}/${m.slug || m.key}/`);
}
// Pages that exist outside the generator.
for (const d of readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith('.') || ['node_modules', 'content', 'images'].includes(d.name)) continue;
  if (existsSync(join(ROOT, d.name, 'index.html'))) live.add(`/${d.name}/`);
  for (const s of readdirSync(join(ROOT, d.name), { withFileTypes: true })) {
    if (s.isDirectory() && existsSync(join(ROOT, d.name, s.name, 'index.html'))) live.add(`/${d.name}/${s.name}/`);
  }
}

let errs = 0, warns = 0;
for (const n of files) {
  const [m, body] = frontMatter(readFileSync(join(SRC, n), 'utf8'));
  if (only.size ? !only.has(m.key) : m.status !== 'draft') continue;
  const E = [], W = [];
  const r = markdown(body);

  // front matter
  const keys = Object.keys(m);
  const expected = ORDER.filter(k => keys.includes(k));
  if (keys.join(',') !== expected.join(',')) E.push(`front matter keys are out of order or unexpected: ${keys.join(', ')}`);
  for (const k of ['key', 'section', 'slug', 'title', 'metaTitle', 'description', 'date', 'pillar', 'keywords', 'status']) {
    if (!m[k]) E.push(`front matter is missing ${k}`);
  }
  if (m.key !== n.replace(/\.md$/, '')) E.push(`key "${m.key}" does not match the file name`);
  if (m.slug && m.slug !== m.key) W.push(`slug "${m.slug}" differs from the key`);
  if (!PILLARS.has(m.pillar)) E.push(`pillar "${m.pillar}" is not one of the six`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '')) E.push(`date "${m.date}" is not YYYY-MM-DD`);
  else { const d = new Date(m.date + 'T12:00:00Z').getUTCDay(); if (d === 0 || d === 6) E.push(`${m.date} is a weekend`); }
  if ((m.title || '').length > 65) E.push(`title is ${m.title.length} characters (60 is the target, 65 the ceiling)`);
  else if ((m.title || '').length > 60) W.push(`title is ${m.title.length} characters (60 is the target)`);
  if (m.metaTitle && !m.metaTitle.endsWith('| BKRDY')) W.push('metaTitle does not end in "| BKRDY"');
  const dl = (m.description || '').length;
  if (dl < 120 || dl > 155) E.push(`description is ${dl} characters (120 to 155)`);
  if (m.photoTerms && m.photoTerms.split('|').filter(s => s.trim()).length !== 3) W.push('photoTerms should be exactly three searches separated by |');
  if (!m.photoTerms && m.status === 'draft') W.push('no photoTerms, so there is nothing to tell Luis to search for');

  // body
  if (r.words < 900) E.push(`${r.words} words (900 is the floor)`);
  else if (r.words > 1400) W.push(`${r.words} words (1,300 is the target ceiling)`);
  if (/—/.test(body) || /—/.test(m.title + m.description)) E.push('an em dash is in the copy');
  if (!/^:::answer/m.test(body)) E.push('no :::answer block');
  const fences = (body.match(/^:::/gm) || []).length;
  if (fences % 2) E.push('a ::: block is not closed');
  if (!/^## /m.test(body)) E.push('no ## sections');
  if (r.headings.length < 3) W.push(`only ${r.headings.length} sections`);
  if (!/^:::copy/m.test(body)) W.push('no :::copy block, which is usually the most useful thing on the page');

  const banned = body.match(BANNED);
  if (banned) E.push(`off-voice wording: "${banned[0]}"`);
  const fake = body.match(FAKE_EVIDENCE);
  if (fake) E.push(`reads like evidence we do not have: "${fake[0]}"`);

  // A call to action at the end: the template adds its own.
  const tail = body.trim().split(/\n/).slice(-6).join(' ');
  if (/\b(start (your )?free trial|sign up today|get started today|book a demo|try BKRDY)\b/i.test(tail)) {
    E.push('the article ends on a call to action; the template adds its own');
  }

  // Claims about the product that have shipped false before.
  for (const c of claimIssues(body)) E.push(c);

  // BKRDY mentions
  const mentions = (body.match(/\bBKRDY\b/g) || []).length;
  if (mentions > 2) W.push(`BKRDY is named ${mentions} times (two is the limit)`);

  // Our own prices, if quoted, must be the real ones.
  for (const [plan, price] of Object.entries(REAL_PRICES)) {
    const re = new RegExp(`${plan.replace('+', '\\+')}[^.$\\n]{0,40}\\$(\\d+)`, 'ig');
    let x;
    while ((x = re.exec(body))) {
      const found = Number(x[1]);
      if (![price, { starter: 0, solo: 18, studio: 29, 'studio+': 47 }[plan]].includes(found)) {
        E.push(`"${plan}" is quoted at $${found}; the real prices are $${price} monthly and the annual rate`);
      }
    }
  }

  // Links. Graphic lines look like links but point at an image, and are
  // checked separately further down.
  const prose = body.replace(/^!\[[^\]]*\]\([^)]*\)$/gm, '');
  for (const l of prose.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = l[1].split('#')[0];
    if (!live.has(href)) E.push(`link to ${href} has no page`);
  }
  const ext = [...body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(x => x[1]);
  if (ext.length > 2) W.push(`${ext.length} external links (two is the limit)`);
  for (const u of ext) {
    if (/booksy|vagaro|glossgenius|styleseat|fresha|squareup|acuityscheduling/i.test(u)) W.push(`external link to a competitor: ${u}`);
  }

  // Graphic lines must point at a file that exists.
  for (const g of body.matchAll(/^!\[([^\]]*)\]\((\/images\/blog\/[a-z0-9-]+\.webp)\)$/gm)) {
    if (!existsSync(join(ROOT, g[2].slice(1)))) E.push(`graphic ${g[2]} does not exist yet`);
    if ((g[1] || '').length < 20) W.push('graphic alt text is very short');
  }

  errs += E.length; warns += W.length;
  const flag = E.length ? 'FAIL' : W.length ? 'warn' : ' ok ';
  console.log(`${flag}  ${String(r.words).padStart(5)}w  ${m.date}  ${(m.pillar || '').padEnd(12)} ${m.key}`);
  for (const e of E) console.log(`        error:   ${e}`);
  for (const w of W) console.log(`        warning: ${w}`);
}
console.log(`\n${errs} errors, ${warns} warnings`);
process.exit(errs ? 1 : 0);
