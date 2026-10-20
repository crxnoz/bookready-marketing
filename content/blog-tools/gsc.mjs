// Google Search Console for bkrdy.com: what people searched to find the site,
// which pages they landed on, and the searches we already show up for but low
// down. Those last ones are the best article topics we have, because Google has
// already decided the site is relevant and only needs a better page.
//   node content/blog-tools/gsc.mjs [--days 28] [--site sc-domain:bkrdy.com] > gsc.md
//
// Auth: a Google Cloud service account added as a Restricted user on the
// Search Console property. Its JSON key lives outside the repo. The key is read
// here and never printed. No dependencies: the JWT is signed with node:crypto.
//
// If the key or the access is missing this exits 2 with a report saying exactly
// what to do about it, and never fails the run that called it.
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const DAYS = Number(arg('--days', 28));
const SITE = arg('--site', 'sc-domain:bkrdy.com');

function keyFile() {
  const envFile = join(ROOT, '.env');
  const fromEnv = process.env.GSC_KEY_FILE || (existsSync(envFile)
    ? (readFileSync(envFile, 'utf8').match(/^GSC_SA_KEY_FILE=(.+)$/m) || [])[1]?.trim() : null);
  const tries = [fromEnv && resolve(ROOT, fromEnv), join(homedir(), '.bkrdy', 'gsc-key.json'),
    join(homedir(), '.daysgraphic', 'gsc-key.json')].filter(Boolean);
  return tries.find(existsSync) || null;
}

function stop(msg) { console.log(`# Search Console\n\n${msg}`); process.exit(2); }
const KEY_FILE = keyFile();
if (!KEY_FILE) stop('No service account key was found. Put one at C:\\Users\\carre\\.bkrdy\\gsc-key.json, or set GSC_SA_KEY_FILE in .env. Search Console data is skipped this run.');
let key;
try { key = JSON.parse(readFileSync(KEY_FILE, 'utf8')); } catch { stop('The service account key file could not be read as JSON.'); }
if (!key.client_email || !key.private_key) stop('The key file has no client_email or private_key.');

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const aud = key.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
  const r = await fetch(aud, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }) });
  const j = await r.json();
  if (!j.access_token) stop(`Google refused the service account (${j.error || r.status}: ${j.error_description || ''}).`);
  return j.access_token;
}

const API = 'https://www.googleapis.com/webmasters/v3';
const tok = await token();
const get = async (path, body) => {
  const r = await fetch(API + path, { method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) stop(`Search Console answered ${r.status} for ${path.split('?')[0]}: ${j.error?.message || 'no details'}`);
  return j;
};

const sites = (await get('/sites')).siteEntry || [];
if (!sites.find(s => s.siteUrl === SITE)) {
  stop(`The service account cannot see ${SITE} yet. In Search Console, Settings, Users and permissions, add ${key.client_email} as a Restricted user on the bkrdy.com property. Properties it can see today: ${sites.map(s => s.siteUrl).join(', ') || 'none'}.`);
}

// Google's data lags about two days; end the window there.
const day = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const endDate = day(2), startDate = day(DAYS + 1);
const q = (dimensions, rowLimit = 250) => get(`/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
  { startDate, endDate, dimensions, rowLimit, dataState: 'final' });

const [tot, queries, pages] = await Promise.all([q([], 1), q(['query'], 500), q(['page'], 150)]);
const t = tot.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
const pct = x => (x * 100).toFixed(1) + '%';
const pos = x => x.toFixed(1);
const qs = queries.rows || [];
const opps = qs.filter(r => r.position >= 6 && r.position <= 30 && r.impressions >= 5)
  .sort((a, b) => b.impressions - a.impressions).slice(0, 30);

const out = [
  `# Search Console · ${SITE} · ${startDate} to ${endDate}`, '',
  `Clicks **${t.clicks}** · impressions **${t.impressions}** · click rate ${pct(t.ctr)} · average position ${pos(t.position)}`, '',
  '## Opportunities: we show up, but low on the page', '',
  'Searches with at least 5 impressions where the average position is 6 to 30. An article aimed at one of these is the quickest win there is, because Google already thinks the site belongs in the results.', '',
  '| Search | Impressions | Position |', '|---|---|---|',
  ...opps.map(r => `| ${r.keys[0]} | ${r.impressions} | ${pos(r.position)} |`), '',
  '## Top searches', '', '| Search | Clicks | Impressions | Click rate | Position |', '|---|---|---|---|---|',
  ...qs.slice(0, 30).map(r => `| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${pct(r.ctr)} | ${pos(r.position)} |`), '',
  '## Top pages', '', '| Page | Clicks | Impressions | Position |', '|---|---|---|---|',
  ...(pages.rows || []).slice(0, 25).map(r => `| ${r.keys[0].replace(/^https:\/\/(www\.)?bkrdy\.com/, '') || '/'} | ${r.clicks} | ${r.impressions} | ${pos(r.position)} |`), '',
];
if (!qs.length) out.push('No search data in this window yet. A new property takes a few days to fill in.', '');

// Indexing pace: articles live but getting nothing are the signal to slow down.
const seen = new Set((pages.rows || []).map(r => r.keys[0].replace(/^https:\/\/(www\.)?bkrdy\.com/, '')));
out.push('## Blog indexing', '');
const { loadPosts } = await import('./build.mjs');
const live = loadPosts().filter(p => p.status === 'published' && p.date <= day(0));
const quiet = live.filter(p => !seen.has(p.url) && p.date <= day(10));
out.push(`${live.length} articles live, ${live.filter(p => seen.has(p.url)).length} getting impressions. ` +
  `${quiet.length} have been live more than ten days with nothing.`, '');
if (quiet.length) out.push('Live more than ten days with no impressions: ' + quiet.slice(0, 12).map(p => p.url).join(', ') + (quiet.length > 12 ? ' and more' : ''), '');
out.push(quiet.length > live.length / 2
  ? '**Pace: slow down.** More than half the backlog is unseen by Google. Publishing faster will not help until these are indexed.'
  : quiet.length > 4 ? '**Pace: hold.** A handful are not indexed yet. Keep the current rate and watch it next month.'
  : '**Pace: fine.** Indexing is keeping up with publishing.', '');

const maps = (await get(`/sites/${encodeURIComponent(SITE)}/sitemaps`)).sitemap || [];
out.push('## Sitemaps', '');
if (!maps.length) out.push('No sitemap submitted. Submit https://bkrdy.com/sitemap.xml in Search Console, Sitemaps.');
for (const m of maps) {
  out.push(`- ${m.path}: submitted ${String(m.lastSubmitted || '').slice(0, 10) || '-'}, last read by Google ${String(m.lastDownloaded || '').slice(0, 10) || 'not yet'}${m.isPending ? ' (pending)' : ''} · ${m.errors || 0} errors, ${m.warnings || 0} warnings`);
}
console.log(out.join('\n'));
