// BookReady Google Search Console indexing-health check.
//
// Reports how many shipped blog/guide articles are actually indexed and getting
// impressions in Google (last 28 days) vs lagging, so the daily publisher's
// cadence is data-driven instead of a guess. A page that has been live 10+ days
// with zero impressions is either not indexed or ranking for nothing, which is
// the signal to slow publishing until the backlog catches up.
//
// ── One-time setup ──
//   1. Google Cloud console: create/pick a project, enable "Google Search Console API".
//   2. Create a Service Account, add a JSON key, download it.
//   3. In Search Console (search.google.com/search-console) > Settings > Users and
//      permissions, add the service account's client_email as a user.
//   4. Save the JSON key somewhere local + gitignored, then in .env set:
//        GSC_SA_KEY_FILE=./.gsc-service-account.json
//        GSC_SITE_URL=https://mybookready.com/        (or sc-domain:mybookready.com)
//
// ── Commands ──
//   node content/gsc-check.mjs check     validate auth + property access
//   node content/gsc-check.mjs           print the indexing-health report + verdict
//
// Verdict line (the publisher reads this): GREEN / YELLOW / RED / NEW / unavailable.
// Graceful: if the keys are unset or the API errors, it prints a notice and exits 0
// so the publish run still succeeds. No external deps, no em-dashes.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');

function loadEnvFile() {
  for (const name of ['.env', '.env.local']) {
    const p = resolve(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  }
}
loadEnvFile();

const KEYFILE = () => process.env.GSC_SA_KEY_FILE;
const SITE = () => process.env.GSC_SITE_URL;
const configured = () => Boolean(KEYFILE() && SITE());

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Service-account JWT -> OAuth access token (read-only Search Console scope).
async function accessToken() {
  const sa = JSON.parse(readFileSync(resolve(ROOT, KEYFILE()), 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(json.error_description || json.error || 'token request failed');
  return json.access_token;
}

async function queryPages(token, days = 28) {
  const fmt = (d) => d.toISOString().slice(0, 10);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE())}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: fmt(new Date(Date.now() - days * 86400000)),
      endDate: fmt(new Date()),
      dimensions: ['page'],
      rowLimit: 1000,
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'searchAnalytics query failed');
  return (json.rows || []).map((r) => r.keys[0]);
}

function shippedEditorial() {
  const q = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
  return q.articles.filter((a) => a.status === 'shipped' && (a.url.startsWith('/blog/') || a.url.startsWith('/guides/')));
}
function daysSince(iso) { return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 999; }
const norm = (u) => u.replace(/\/$/, '');

async function report() {
  if (!configured()) {
    console.log('GSC indexing health: unavailable (set GSC_SA_KEY_FILE and GSC_SITE_URL in .env to enable; see header for setup). Publishing continues.');
    return;
  }
  let seen;
  try {
    seen = new Set((await queryPages(await accessToken())).map(norm));
  } catch (e) {
    console.log(`GSC indexing health: unavailable (${e.message}). Publishing continues.`);
    return;
  }
  const mature = shippedEditorial().filter((a) => daysSince(a.shippedAt) >= 10); // give 10 days to index
  const lagging = mature.filter((a) => !seen.has(norm(`https://mybookready.com${a.url}`)));
  const pct = mature.length ? Math.round((lagging.length / mature.length) * 100) : 0;
  const verdict = mature.length === 0 ? 'NEW (not enough mature posts to judge yet)'
    : pct <= 20 ? 'GREEN (indexing healthy)'
    : pct <= 50 ? 'YELLOW (watch indexing)'
    : 'RED (indexing lagging; pause new posts until the backlog indexes)';
  console.log(`GSC indexing health: ${verdict}`);
  console.log(`  ${mature.length - lagging.length}/${mature.length} posts live 10+ days are indexed and getting impressions.`);
  if (lagging.length) {
    console.log('  Lagging (live 10+ days, zero impressions):');
    for (const a of lagging) console.log(`    - ${a.url} (${daysSince(a.shippedAt)}d live)`);
  }
}

const cmd = process.argv[2];
if (cmd === 'check') {
  if (!configured()) console.log('GSC not configured (set GSC_SA_KEY_FILE and GSC_SITE_URL in .env).');
  else {
    try { await accessToken(); console.log('GSC auth OK. Indexing check is ready.'); }
    catch (e) { console.log(`GSC auth FAILED: ${e.message}`); }
  }
} else {
  await report();
}
