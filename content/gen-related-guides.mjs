// Internal-linking: inject a "Guides for <niche>" section into each /for-<niche>/
// industry page, linking to the shipped articles tagged with that industry
// (recommendedRelatedIndustry in the queue). This flows link equity from the
// high-authority industry pages down to the content, and builds the topical
// cluster both ways (articles already link up to the industry pages).
//
// Idempotent: re-running replaces the injected block. Run after publishing, or
// any time. Usage: node content/gen-related-guides.mjs. No em-dashes.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');

const LABELS = {
  'nail-techs': 'nail techs', 'lash-artists': 'lash artists', 'estheticians': 'estheticians',
  'barbers': 'barbers', 'salons': 'salons', 'spas': 'spas', 'solo-pros': 'solo pros',
};
const START = '  <!-- ─── Related guides (auto, content/gen-related-guides.mjs) ─── -->';
const END = '  <!-- ─── /Related guides ─── -->';
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const title = (a) => a.h1 || (a.metaTitle || a.slug).split(' | ')[0];

function block(label, articles) {
  const cards = articles.map((a) => `        <a class="br-feat" href="${a.url}">
          <h3>${esc(title(a))}</h3>
          <p>${esc((a.metaDescription || '').slice(0, 120))}</p>
        </a>`).join('\n');
  return `${START}
  <section class="br-section">
    <div class="br-section__inner">
      <div class="br-section__head">
        <p class="br-kicker">Guides</p>
        <h2 class="br-section__title">Guides for ${esc(label)}.</h2>
        <p class="br-section__intro">Free, practical reads on pricing, booking, and growing your business.</p>
      </div>
      <div class="br-feats">
${cards}
      </div>
    </div>
  </section>
${END}

`;
}

const q = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
const shipped = q.articles.filter((a) => a.status === 'shipped');

let touched = 0;
for (const [slug, label] of Object.entries(LABELS)) {
  const page = resolve(ROOT, `for-${slug}`, 'index.html');
  if (!existsSync(page)) continue;
  let h = readFileSync(page, 'utf8');

  // Strip any prior injected block first (keeps it idempotent + clean).
  const re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n`, '');
  h = h.replace(re, '');

  const articles = shipped.filter((a) => a.recommendedRelatedIndustry === slug);
  if (articles.length === 0) {
    if (h !== readFileSync(page, 'utf8')) { writeFileSync(page, h, 'utf8'); console.log(`  cleared (no guides yet): for-${slug}`); }
    continue;
  }

  const anchor = '  <!-- ─── Final CTA ─── -->';
  const at = h.indexOf(anchor);
  if (at === -1) { console.log(`  no Final CTA anchor: for-${slug}`); continue; }
  h = h.slice(0, at) + block(label, articles) + h.slice(at);
  writeFileSync(page, h, 'utf8');
  console.log(`  for-${slug}: linked ${articles.length} guide(s) -> ${articles.map((a) => a.slug).join(', ')}`);
  touched++;
}
console.log(`Related guides: updated ${touched} industry page(s).`);
