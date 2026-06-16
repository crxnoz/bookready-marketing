// BookReady daily blog email.
//
// Sends a short daily digest: the post(s) that went live today, plus the rest
// of the month's lineup from the queue. Wired into the daily publisher as the
// final step. Sends via the Resend API (RESEND_API_KEY); skips gracefully if no
// key is set, so the publish flow never breaks.
//
// Commands:
//   node content/notify-email.mjs            send today's digest
//   node content/notify-email.mjs --dry      build + preview the email, do not send
//   node content/notify-email.mjs --date 2026-06-16   override "today" (testing)
//
// Env (from .env): RESEND_API_KEY, NOTIFY_EMAIL (recipient),
//   optional NOTIFY_FROM (default "BookReady <onboarding@resend.dev>").
// No em-dashes.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_PATH = resolve(ROOT, 'content', 'queue.json');
const SITE = 'https://mybookready.com';

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

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const dateArg = (() => { const i = argv.indexOf('--date'); return i !== -1 ? argv[i + 1] : null; })();
const TODAY = dateArg || new Date().toISOString().slice(0, 10);

function title(a) { return a.h1 || (a.metaTitle || a.slug).split(' | ')[0]; }
function heroUrl(a) {
  const rel = `images/blog/${a.slug}.webp`;
  return existsSync(resolve(ROOT, rel)) ? `${SITE}/${rel}` : `${SITE}/images/hero/hero.webp`;
}

function buildEmail(q) {
  const shippedToday = q.articles.filter((a) => a.status === 'shipped' && a.shippedAt === TODAY);
  const upcoming = q.articles.filter((a) => a.status === 'pending');

  const card = (a) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#ffffff;border:1px solid rgba(18,18,18,.12);">
      <tr><td>
        <a href="${SITE}${a.url}" style="text-decoration:none;color:inherit;">
          <img src="${heroUrl(a)}" width="600" alt="${esc(title(a))}" style="display:block;width:100%;height:auto;border-bottom:1px solid rgba(18,18,18,.12);" />
          <div style="padding:18px 20px;">
            <div style="font:700 12px Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6B7280;">New post</div>
            <div style="font:800 19px/1.25 Inter,Arial,sans-serif;color:#121212;margin:6px 0 8px;letter-spacing:-.02em;">${esc(title(a))}</div>
            <div style="font:400 14px/1.6 Inter,Arial,sans-serif;color:#6B7280;">${esc((a.metaDescription || '').slice(0, 150))}</div>
            <div style="font:700 13px Inter,Arial,sans-serif;color:#121212;margin-top:12px;">Read it &rarr;</div>
          </div>
        </a>
      </td></tr>
    </table>`;

  const upcomingRows = upcoming.slice(0, 12).map((a, i) => {
    const vol = a.research?.volume != null ? `${a.research.volume}/mo` : (a.estVolume || '');
    return `<tr>
      <td style="padding:9px 0;border-bottom:1px solid rgba(18,18,18,.10);font:600 14px Inter,Arial,sans-serif;color:#121212;">${i + 1}. ${esc(title(a))}</td>
      <td style="padding:9px 0;border-bottom:1px solid rgba(18,18,18,.10);font:600 12px Inter,Arial,sans-serif;color:#6B7280;text-align:right;white-space:nowrap;">${esc(vol)}</td>
    </tr>`;
  }).join('');

  const subject = shippedToday.length
    ? `BookReady blog: ${shippedToday.length} new post${shippedToday.length > 1 ? 's' : ''} live today`
    : `BookReady blog: ${upcoming.length} posts queued this month`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F8F6F2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F2;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
        <tr><td style="padding:4px 4px 20px;">
          <div style="font:800 20px Inter,Arial,sans-serif;color:#121212;letter-spacing:-.02em;">BookReady</div>
          <div style="font:600 13px Inter,Arial,sans-serif;color:#6B7280;margin-top:2px;">Daily blog update &middot; ${TODAY}</div>
        </td></tr>

        <tr><td style="padding:0 4px;">
          <div style="font:800 15px Inter,Arial,sans-serif;color:#121212;margin:0 0 14px;letter-spacing:.02em;text-transform:uppercase;">
            ${shippedToday.length ? `Published today (${shippedToday.length})` : 'Nothing published today'}
          </div>
          ${shippedToday.map(card).join('') || '<div style="font:400 14px Inter,Arial,sans-serif;color:#6B7280;margin-bottom:18px;">No new posts went live today. Here is what is coming up.</div>'}
        </td></tr>

        <tr><td style="padding:14px 4px 0;">
          <div style="font:800 15px Inter,Arial,sans-serif;color:#121212;margin:0 0 6px;letter-spacing:.02em;text-transform:uppercase;">Coming up this month</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${upcomingRows || '<tr><td style="font:400 14px Inter,Arial,sans-serif;color:#6B7280;padding:8px 0;">Queue is empty. Time to research the next batch.</td></tr>'}</table>
        </td></tr>

        <tr><td style="padding:24px 4px 0;">
          <div style="font:400 12px Inter,Arial,sans-serif;color:#6B7280;line-height:1.6;">
            ${upcoming.length} posts queued. At 2 per weekday that is about ${Math.ceil(upcoming.length / 2)} more business days of content.<br/>
            Sent by the BookReady daily publisher.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;

  const text = [
    `BookReady daily blog update (${TODAY})`, '',
    shippedToday.length ? `Published today (${shippedToday.length}):` : 'Nothing published today.',
    ...shippedToday.map((a) => `  - ${title(a)}  ${SITE}${a.url}`), '',
    'Coming up this month:',
    ...upcoming.slice(0, 12).map((a, i) => `  ${i + 1}. ${title(a)}`),
  ].join('\n');

  return { subject, html, text, shippedToday, upcoming };
}

async function main() {
  if (!existsSync(QUEUE_PATH)) { console.error('queue.json not found'); process.exit(1); }
  const q = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
  const { subject, html, text, shippedToday, upcoming } = buildEmail(q);

  if (DRY) {
    const dir = resolve(ROOT, '.scratch'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const out = resolve(dir, 'email-preview.html');
    writeFileSync(out, html, 'utf8');
    console.log(`[dry] subject: ${subject}`);
    console.log(`[dry] today's posts: ${shippedToday.length}, upcoming: ${upcoming.length}`);
    console.log(`[dry] preview written to .scratch/email-preview.html`);
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) {
    console.log('No RESEND_API_KEY or NOTIFY_EMAIL set; skipping email (publish flow continues).');
    return;
  }
  const from = process.env.NOTIFY_FROM || 'BookReady <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok) console.log(`Email sent to ${to} (id ${json.id || '?'}): ${subject}`);
  else console.log(`Email FAILED: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
}

await main();
