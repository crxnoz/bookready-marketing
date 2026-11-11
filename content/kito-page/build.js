// Run from anywhere: node content/kito-page/build.js. Rebuild after the homepage's Kito demo,
// cards or "how it works" block changes, so the two pages stay the same.
//
// Builds /kito/index.html for the marketing site, in the live look, from pieces the founder
// approved on the homepage: the "Try asking Kito" demo, the three cards (the founder cut the
// six to three on 2026-11-10: off next Friday, move Dana, who still owes) and "how a change works".
// The page's own parts are the head, the list of everything he can change, and its questions.
// Every claim is something a tool in api/app/Kito/Tools really does (docs/kito-plan.md).
const fs = require('fs');
const path = require('path');
const R = path.join(__dirname, '..', '..').split(path.sep).join('/') + '/';
const home = fs.readFileSync(R + 'index.html', 'utf8').replace(/\r\n/g, '\n');
const free = fs.readFileSync(R + 'free/index.html', 'utf8').replace(/\r\n/g, '\n');

function between(src, start, end, includeStart = true) {
  const a = src.indexOf(start);
  if (a < 0) throw new Error('start not found: ' + start.slice(0, 50));
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error('end not found: ' + end.slice(0, 50));
  return src.slice(includeStart ? a : a + start.length, b);
}

// From the homepage.
const demo = between(home, '        <div class="v-wrap" style="position: relative; z-index: 2">', '      </section>').trimEnd();
const does = between(home, '          <div class="v-trio v-does">', '          <div class="v-how">').trimEnd();
const how = between(home, '          <div class="v-how">', '        </div>\n      </section>').trimEnd();

// The shell, from a page that already has it.
const nav = between(free, '    <header class="v-nav" data-v-nav>', '    </header>') + '    </header>';
const footer = free.slice(free.indexOf('    <footer class="v-foot">'));

const SUM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

const QUESTIONS = [
  ['What is Kito?', 'Kito is the AI assistant inside BKRDY. He answers questions about your calendar, clients and money, and lines up changes for you: bookings, prices, your website, your hours, a pay link for what a client owes. Nothing changes until you tap Confirm.'],
  ['Can Kito change things without asking me?', 'No. Every change arrives as a card that says exactly what will change, who gets an email and what happens to money. Nothing happens until you tap it, and you can always say never mind.'],
  ['Can Kito refund or charge a client?', 'No. He never refunds and never charges a card. He tells you what was paid and what is owed, and he can email a client a link to pay. The decision and the money stay with you.'],
  ['Does Kito talk to my clients?', 'No. Kito works for you, inside your editor and the BKRDY app, and your clients never see him. An email he lines up, like a confirmation or a pay link, is the same one your studio already sends, and it goes out only after you tap.'],
  ['What can Kito see?', 'Your studio’s calendar, menu, site, rules and what each booking cost and still owes. When he looks up a client he gets a first name and a last initial, not their email, phone number, private notes or card.'],
  ['How many messages do I get?', '25 a month on the Free plan and 100 a month on Solo, Studio and Studio+. A message is one thing you ask him.'],
];

const CAN = [
  ['Your calendar', 'The day, handled.', 'Book, move or cancel an appointment. Confirm or decline a request. Mark a visit done or a no-show, block time off the calendar, and offer a waitlist client an opening.'],
  ['Getting paid', 'What you are owed.', 'See who still owes you and email them a pay link. Change the price of one booking. Set your deposit rule and your late cancel and no-show fees.'],
  ['Your website', 'The page clients see.', 'Rewrite your words, change your color, add photos, pick a layout for any section and put the sections in a new order. You can undo it.'],
  ['Your menu and shop', 'What you sell.', 'Change prices, add a service, an add-on, a package or a product. Run a sale, make a discount code, or give a client a gift card.'],
  ['Your clients', 'Who is who.', 'Add a note to a client, mark someone a VIP, and ask who is due back or who asked about a refund.'],
  ['Your rules and hours', 'The back office.', 'Booking rules and policies, your week, one day’s hours, time off, an artist’s hours and their sign-in invite, your booking form, and the emails your studio sends.'],
];

const TITLE = 'Kito, the AI assistant for beauty businesses | BKRDY';
const DESC = 'Kito is the AI assistant inside BKRDY. Ask in plain words and he books, moves, prices and edits your site. You approve every change. On every plan.';
const OG_TITLE = 'Kito: the assistant that runs the business side';
const OG_DESC = 'Ask in plain words. Kito looks it up, lines up the change and waits for your tap. On every BKRDY plan.';
const URL = 'https://bkrdy.com/kito/';

const head = `<!doctype html>
<html lang="en">
  <head>
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#08090D" />
    <title>${TITLE}</title>
    <meta name="description" content="${DESC}" />
    <link rel="canonical" href="${URL}" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${URL}" />
    <meta property="og:site_name" content="BKRDY" />
    <meta property="og:title" content="${OG_TITLE}" />
    <meta property="og:description" content="${OG_DESC}" />
    <meta property="og:image" content="https://bkrdy.com/images/og/v2/kito.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${OG_TITLE}" />
    <meta name="twitter:description" content="${OG_DESC}" />
    <meta name="twitter:image" content="https://bkrdy.com/images/og/v2/kito.jpg" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@500&display=swap" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@500&display=swap" /></noscript>
    <link rel="stylesheet" href="/v2.css" />

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://bkrdy.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Kito",
            "item": "${URL}"
          }
        ]
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
${QUESTIONS.map(([q, a]) => `          {
            "@type": "Question",
            "name": ${JSON.stringify(q)},
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ${JSON.stringify(a)}
            }
          }`).join(',\n')}
        ]
      }
    </script>
  </head>
  <body>
`;

const main = `
    <main>

      <!-- ─── Head: the same demo as the homepage, with Kito as the subject ─── -->
      <section class="v-hero">
        <div class="v-art v-horizon" aria-hidden="true">
          <img class="v-art__sky" src="/images/art/dusk-kito.webp" alt="" width="2400" height="1030" fetchpriority="high" />
        </div>

        <div class="v-wrap v-hero__copy">
          <p class="v-mono v-eyebrow">Kito, your assistant</p>
          <h1 class="v-h1">Tell Kito what you need. He does the rest.</h1>
          <p class="v-lede">Kito is the assistant inside BKRDY. He knows your calendar, your clients, your menu and your site. Ask in plain words: he looks it up, lines up the change and waits for your tap.</p>
          <div class="v-hero__ctas">
            <a class="v-btn" href="https://app.bkrdy.me/register?ref=kito-hero">
              Start for free
              ${ARROW}
            </a>
            <a class="v-btn v-btn--ghost" href="#does">See what he does</a>
          </div>
          <p class="v-mono v-hero__fine">On every plan · You approve every change · He never charges a card</p>
        </div>

${demo}
      </section>

      <!-- ─── What he does, by the part of the business it helps ─── -->
      <section class="v-sec" id="does">
        <div class="v-wrap">
          <div class="v-head">
            <div class="v-head__title">
              <p class="v-mono v-eyebrow">What he does</p>
              <h2 class="v-h2">Hand off<br />the busywork.</h2>
            </div>
            <p class="v-body">Each picture is a card Kito really makes. He does the lookups and writes it up, and the button is yours.</p>
          </div>
${does}
        </div>
      </section>

      <!-- ─── Everything he can change ─── -->
      <section class="v-sec">
        <div class="v-wrap">
          <div class="v-head">
            <div class="v-head__title">
              <p class="v-mono v-eyebrow">The full list</p>
              <h2 class="v-h2">Everything you can<br />ask him to change.</h2>
            </div>
            <p class="v-body">If there is a button for it in BKRDY, Kito probably has a card for it. He uses the same saves the buttons do, so the emails, the calendar and the money behave exactly the same.</p>
          </div>
          <div class="v-duo">
${CAN.map(([label, title, body]) => `            <article class="v-card v-point">
              <p class="v-mono">${label}</p>
              <h3 class="v-h3">${title}</h3>
              <p class="v-body">${body}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- ─── How a change works ─── -->
      <section class="v-sec">
        <div class="v-wrap">
          <div class="v-head">
            <div class="v-head__title">
              <p class="v-mono v-eyebrow">How it works</p>
              <h2 class="v-h2">Nothing changes<br />until you tap.</h2>
            </div>
            <p class="v-body">Kito never changes anything by himself. A card shows what will change, who gets an email and what happens to money, and then it waits.</p>
          </div>
${how}
          <div class="v-card v-offer" style="margin-top: 28px">
            <span class="v-offer__tag">On every plan</span>
            <p><strong>25 messages a month on Free.</strong> 100 a month on Solo, Studio and Studio+. A message is one thing you ask him.</p>
          </div>
        </div>
      </section>

      <!-- ─── FAQ (keep word for word with the FAQPage schema in the head) ─── -->
      <section class="v-sec" id="faq">
        <div class="v-wrap v-faq">
          <div class="v-head__title">
            <p class="v-mono v-eyebrow">Questions</p>
            <h2 class="v-h2">Kito, answered.</h2>
          </div>
          <div class="v-faq__list">
${QUESTIONS.map(([q, a]) => `            <details>
              <summary>${q}${SUM}</summary>
              <p>${a}</p>
            </details>`).join('\n')}
          </div>
        </div>
      </section>

      <!-- ─── After hours ─── -->
      <section class="v-sec">
        <div class="v-wrap">
          <div class="v-night">
            <div class="v-night__copy">
              <p class="v-mono v-eyebrow">After hours</p>
              <h2 class="v-h2">Lock up on time.<br />Kito keeps watch.</h2>
              <p class="v-body">He is in every studio from day one, on the Free plan too. Set yours up tonight and ask him your first question.</p>
              <div class="v-night__ctas">
                <a class="v-btn" href="https://app.bkrdy.me/register?ref=kito-final">Start for free</a>
                <a class="v-btn v-btn--ghost" href="/pricing/">See pricing</a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

`;

// This page's own nav: its ref tags, and Kito marked as the open page (the footer's link stays plain).
const KITO_LINK = '<a href="/kito/">Kito</a>';
const ownNav = nav.split('ref=free-nav').join('ref=kito-nav').split('ref=free-menu').join('ref=kito-menu')
  .split(KITO_LINK).join('<a href="/kito/" aria-current="page">Kito</a>');
const page = head + '\n' + ownNav + '\n' + main + footer;
if (/—/.test(page)) throw new Error('an em dash got in');
fs.mkdirSync(R + 'kito', { recursive: true });
// The site's files are CRLF.
fs.writeFileSync(R + 'kito/index.html', page.replace(/\n/g, '\r\n'));
console.log('wrote kito/index.html,', Math.round(page.length / 1024), 'KB; description', DESC.length, 'chars; title', TITLE.length, 'chars');
