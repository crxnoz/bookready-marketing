// Month-by-month US search volume for a list of terms, from DataForSEO (Google
// Ads data). Used by the trend research run to measure direction rather than
// guess it. Credentials come from the repo's .env and are never printed.
//   node content/blog-tools/trend-volumes.mjs <terms.txt> <out.json>
// terms.txt: one search per line. Prints each term's 12-month series and the
// change from the first three months to the last three (seasonality included,
// so read the series, not just the percentage).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [termsFile, outFile] = process.argv.slice(2);
if (!termsFile || !outFile) { console.error('usage: trend-volumes.mjs <terms.txt> <out.json>'); process.exit(2); }
const env = readFileSync(join(ROOT, '.env'), 'utf8');
const login = (env.match(/^DATAFORSEO_LOGIN=(.+)$/m) || [])[1]?.trim();
const password = (env.match(/^DATAFORSEO_PASSWORD=(.+)$/m) || [])[1]?.trim();
if (!login || !password) { console.error('no DataForSEO credentials in .env'); process.exit(1); }
const terms = [...new Set(readFileSync(termsFile, 'utf8').split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean))];

const r = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
  method: 'POST',
  headers: { Authorization: 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64'), 'Content-Type': 'application/json' },
  body: JSON.stringify([{ keywords: terms, location_code: 2840, language_code: 'en' }]),
});
const j = await r.json();
if (j.tasks?.[0]?.status_code !== 20000) { console.error('DataForSEO:', j.tasks?.[0]?.status_message || r.status); process.exit(1); }

const rows = (j.tasks[0].result || []).map(x => {
  const m = (x.monthly_searches || []).slice().sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const vals = m.map(z => z.search_volume ?? 0);
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  const first = avg(vals.slice(0, 3)), last = avg(vals.slice(-3));
  return {
    term: x.keyword, average: x.search_volume ?? null,
    from: m[0] ? `${m[0].year}-${String(m[0].month).padStart(2, '0')}` : null,
    to: m.at(-1) ? `${m.at(-1).year}-${String(m.at(-1).month).padStart(2, '0')}` : null,
    months: vals, change: first ? Math.round((last / first - 1) * 100) : null,
  };
});
writeFileSync(outFile, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), geography: 'US', rows }, null, 1));
rows.sort((a, b) => (b.change ?? -999) - (a.change ?? -999));
for (const x of rows) console.log(`${x.change == null ? '    -' : String(x.change).padStart(5) + '%'}  ${String(x.average ?? '-').padStart(8)}  ${x.term}   ${x.months.join(' ')}`);
