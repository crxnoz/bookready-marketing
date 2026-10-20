// The email the blog runs send to Luis.
//   node content/blog-tools/blog-email.mjs <payload.json> [--dry]
//
// Two kinds, set by `kind` in the payload:
//   "drafts"    the monthly run: a batch is ready to review
//   "published" the daily run: what went live, what was revised
//
// Payload shape (every field optional except kind):
//   { kind, month, reviewUrl, subject,
//     posts:    [{ title, date, url, graphic, photoFile, photoTerms: [] }],
//     revised:  [{ title, note }],
//     photos:   [{ title, added }],
//     findings: ["plain sentence about the site check"],
//     searches: [{ term, volume, difficulty }],
//     failures: ["what did not work this run"] }
//
// Sends through Resend (RESEND_API_KEY, NOTIFY_EMAIL, NOTIFY_FROM in .env).
// With no key it prints the email and exits 0, so a run is never failed by the
// mail step. --dry always prints instead of sending.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [payloadFile] = process.argv.slice(2);
const DRY = process.argv.includes('--dry');
if (!payloadFile || !existsSync(payloadFile)) { console.error('usage: blog-email.mjs <payload.json> [--dry]'); process.exit(1); }
const p = JSON.parse(readFileSync(payloadFile, 'utf8'));

for (const name of ['.env', '.env.local']) {
  const f = join(ROOT, name);
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }); } catch { return d; } };
const monthName = m => { try { return new Date(m + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch { return m; } };
const F = 'Inter,Helvetica,Arial,sans-serif';

const subject = p.subject || (p.kind === 'drafts'
  ? `Blog drafts for ${monthName(p.month)}: ${(p.posts || []).length} articles to review`
  : `Blog: ${(p.posts || []).length} live${(p.revised || []).length ? `, ${p.revised.length} revised` : ''}`);

const h = (t) => `<tr><td style="padding:26px 4px 8px"><div style="font:800 12px ${F};letter-spacing:.14em;text-transform:uppercase;color:#6B7280">${esc(t)}</div></td></tr>`;
const rows = (list) => list.length ? list.join('') : `<tr><td style="padding:2px 4px;font:400 14px/1.6 ${F};color:#6B7280">Nothing.</td></tr>`;

const postRows = (p.posts || []).map(a => `<tr><td style="padding:11px 4px;border-bottom:1px solid rgba(18,18,18,.10)">
  <div style="font:600 12px ${F};color:#6B7280">${esc(day(a.date))}${a.graphic ? ' &middot; graphic' : ''}</div>
  <div style="font:600 16px/1.35 ${F};color:#121212;margin-top:4px">${a.url && p.kind === 'published'
    ? `<a href="https://bkrdy.com${esc(a.url)}" style="color:#121212">${esc(a.title)}</a>` : esc(a.title)}</div>
</td></tr>`);

const photoRows = (p.posts || []).filter(a => a.photoFile).map(a => `<tr><td style="padding:9px 4px;border-bottom:1px solid rgba(18,18,18,.10)">
  <div style="font:600 14px ${F};color:#121212">${esc(a.photoFile)}</div>
  <div style="font:400 13px/1.55 ${F};color:#6B7280;margin-top:3px">${esc(a.title)}</div>
  ${(a.photoTerms || []).length ? `<div style="font:400 13px/1.55 ${F};color:#6B7280;margin-top:5px">Search Shutterstock for: ${a.photoTerms.map(t => `<b style="color:#121212;font-weight:600">${esc(t)}</b>`).join(' &middot; ')}</div>` : ''}
</td></tr>`);

const revisedRows = (p.revised || []).map(r => `<tr><td style="padding:10px 4px;border-bottom:1px solid rgba(18,18,18,.10)">
  <div style="font:600 15px/1.35 ${F};color:#121212">${esc(r.title)}</div>
  ${r.note ? `<div style="font:400 13px/1.55 ${F};color:#6B7280;margin-top:4px">You asked for: ${esc(r.note)}</div>` : ''}
</td></tr>`);

const findingRows = (p.findings || []).map(f => `<tr><td style="padding:7px 4px;font:400 14px/1.6 ${F};color:#1F2024;border-bottom:1px solid rgba(18,18,18,.08)">${esc(f)}</td></tr>`);

const searchRows = (p.searches || []).map(s => `<tr>
  <td style="padding:8px 4px;border-bottom:1px solid rgba(18,18,18,.08);font:500 14px ${F};color:#121212">${esc(s.term)}</td>
  <td style="padding:8px 4px;border-bottom:1px solid rgba(18,18,18,.08);font:600 13px ${F};color:#6B7280;text-align:right;white-space:nowrap">${esc(s.volume)}/mo${s.difficulty != null ? ` &middot; difficulty ${esc(s.difficulty)}` : ''}</td></tr>`);

const failRows = (p.failures || []).map(f => `<tr><td style="padding:8px 10px;background:#FBE7E7;font:500 14px/1.55 ${F};color:#9B1C1C">${esc(f)}</td></tr>`);

const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F8F6F2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F2;padding:28px 14px">
<tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">
  <tr><td style="padding:4px 4px 18px">
    <div style="font:800 20px ${F};color:#121212;letter-spacing:.12em">BKRDY</div>
    <div style="font:600 13px ${F};color:#6B7280;margin-top:3px">${p.kind === 'drafts' ? `Blog drafts &middot; ${esc(monthName(p.month))}` : `Blog published &middot; ${esc(new Date().toISOString().slice(0, 10))}`}</div>
  </td></tr>

  ${p.kind === 'drafts' && p.reviewUrl ? `<tr><td style="padding:0 4px 6px">
    <div style="background:#fff;border:1px solid rgba(18,18,18,.12);border-top:3px solid #E8C7DA;padding:20px">
      <div style="font:400 20px/1.3 Georgia,serif;color:#121212">${(p.posts || []).length} articles are waiting for you</div>
      <div style="font:400 14px/1.6 ${F};color:#6B7280;margin-top:8px">Read each one, then approve it or ask for changes. Approved articles go live on their dates. Nothing publishes without you.</div>
      <div style="margin-top:16px"><a href="${esc(p.reviewUrl)}" style="display:inline-block;background:#121212;color:#fff;font:600 14px ${F};padding:14px 18px;text-decoration:none">Open the review page</a></div>
    </div></td></tr>` : ''}

  ${failRows.length ? h('What did not work') + failRows.map(r => `<tr><td style="padding:0 4px 6px">${r.replace(/^<tr><td/, '<table width="100%"><tr><td').replace(/<\/td><\/tr>$/, '</td></tr></table>')}</td></tr>`).join('') : ''}

  ${h(p.kind === 'drafts' ? 'The schedule' : 'Live now')}
  <tr><td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows(postRows)}</table></td></tr>

  ${revisedRows.length ? h('Revised and back with you') + `<tr><td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${revisedRows.join('')}</table></td></tr>` : ''}

  ${photoRows.length ? h('Photos to license') + `<tr><td style="padding:0 4px 8px;font:400 14px/1.6 ${F};color:#6B7280">
    Save each licensed file in <b style="color:#121212">C:\\Users\\carre\\bkrdy-blog-photos</b> under the name below. The publish run finds it there, even after an article is already live. Nothing under 1600px wide.</td></tr>
    <tr><td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${photoRows.join('')}</table></td></tr>` : ''}

  ${findingRows.length ? h('From the site check') + `<tr><td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${findingRows.join('')}</table></td></tr>` : ''}

  ${searchRows.length ? h('Searches worth knowing about') + `<tr><td style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${searchRows.join('')}</table></td></tr>` : ''}

  <tr><td style="padding:26px 4px 0;font:400 12px/1.6 ${F};color:#9CA3AF">
    Sent by the BKRDY blog loop (content/blog-tools/blog-loop.md).</td></tr>
</table></td></tr></table></body></html>`;

const text = [
  p.kind === 'drafts' ? `${(p.posts || []).length} blog drafts for ${monthName(p.month)}` : 'BKRDY blog published',
  p.reviewUrl ? `Review: ${p.reviewUrl}` : '', '',
  ...(p.posts || []).map(a => `  ${day(a.date)}  ${a.title}${a.graphic ? '  (graphic)' : ''}${a.url && p.kind === 'published' ? `  https://bkrdy.com${a.url}` : ''}`),
  (p.revised || []).length ? '\nRevised: ' + p.revised.map(r => r.title).join('; ') : '',
  (p.posts || []).some(a => a.photoFile) ? '\nPhotos to license, saved in C:\\Users\\carre\\bkrdy-blog-photos:\n' +
    (p.posts || []).filter(a => a.photoFile).map(a => `  ${a.photoFile}  ${(a.photoTerms || []).join(' / ')}`).join('\n') : '',
  (p.findings || []).length ? '\nSite check:\n' + p.findings.map(f => '  - ' + f).join('\n') : '',
  (p.failures || []).length ? '\nDid not work:\n' + p.failures.map(f => '  - ' + f).join('\n') : '',
].filter(Boolean).join('\n');

const key = process.env.RESEND_API_KEY, to = process.env.NOTIFY_EMAIL;
if (DRY || !key || !to) {
  const dir = join(ROOT, '.scratch'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'blog-email.html'), html);
  console.log(`subject: ${subject}`);
  console.log(DRY ? 'dry run, nothing sent' : 'no RESEND_API_KEY or NOTIFY_EMAIL, nothing sent');
  console.log('preview written to .scratch/blog-email.html');
  process.exit(0);
}
const from = process.env.NOTIFY_FROM || 'BKRDY <onboarding@resend.dev>';
const r = await fetch('https://api.resend.com/emails', {
  method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: from.replace(/^BookReady /, 'BKRDY blog '), to, subject, html, text }),
});
const j = await r.json().catch(() => ({}));
console.log(r.ok ? `sent to ${to} (${j.id || '?'}): ${subject}` : `email FAILED: ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
process.exit(r.ok ? 0 : 0);
