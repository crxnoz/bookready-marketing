# BookReady SEO Playbook

A living plan for ranking mybookready.com. The marketing site's technical
foundation is already strong (rich schema, sitemap, robots.txt, fast static
HTML, an autonomous content engine). For a young domain, the two levers that
actually decide rank are **indexation** and **authority (backlinks)**. This doc
is mostly the off-site work that no amount of code can replace.

---

## 1. Google Search Console (do this first, ~15 min)

Without this, Google finds pages slowly and you are blind to what ranks.

1. Go to search.google.com/search-console, add a property for `mybookready.com`
   (use the Domain property and verify via DNS on Hostinger, or the URL-prefix
   property and verify with the HTML meta tag).
2. Submit the sitemap: `https://mybookready.com/sitemap.xml`.
3. Use URL Inspection on your priority pages (homepage, `/pricing/`,
   `/templates/`, the `/for-<niche>/` pages, and each new article) and click
   **Request indexing** so they get crawled fast.
4. Repeat for Bing Webmaster Tools (bing.com/webmasters) and import from GSC.
5. Check back weekly: Pages (coverage), Performance (queries, impressions, CTR),
   and Enhancements (schema validity). Feed the winning queries back into the
   keyword-research queue.

---

## 2. Backlinks (the real ceiling for competitive #1)

A new domain ranks for kd0 terms with content alone, but competitive terms need
links pointing at you. Work this list top to bottom.

### Tier A: fast, high-trust, do this month
- **SaaS directories** (also where star ratings legitimately appear in search):
  Capterra, G2, GetApp, Software Advice, Crozdesk, SaaSHub, AlternativeTo.
  Create a complete listing for each. These pass authority and feed the review
  stars (see section 3).
- **Product Hunt launch** — one strong launch is a durable backlink plus a
  traffic spike. Prep assets, schedule a launch day.
- **Your own network (free, instant):** make every `*.bkrdy.me` template demo
  subdomain and the `app.bkrdy.me` app link back to `mybookready.com` (footer or
  "Made with BookReady" credit). Internal network links are easy authority.
- **Business profiles:** Crunchbase, LinkedIn company page, a Google Business
  Profile if you have any physical or service-area presence.

### Tier B: ongoing, higher effort, higher value
- **Get into the "best X" roundups** that already rank for your target terms
  (e.g. "best salon booking software"). Find them in the SERP, email the author
  with a concise pitch to be included (template below).
- **Guest posts** on beauty-business blogs and creator newsletters (nail/lash/
  barber educators). Offer genuinely useful content, not an ad.
- **Digital PR / expert quotes:** sign up for Help a B2B Writer, Featured,
  Qwoted, and Connectively. Answer queries as the BookReady founder; many turn
  into a link from a real publication.
- **Partnerships:** beauty-school programs, booth-rental communities, payment/
  POS partners. Co-marketing earns links and referrals.

### Outreach templates

**Directory / roundup inclusion:**
> Subject: BookReady for your [salon booking software] roundup
> Hi [name], I run BookReady, a designed booking-website builder for beauty
> businesses (0% transaction fees, free same-day migration). Your [article] is
> the best honest comparison I've found. Would you consider adding us? Happy to
> send a one-paragraph blurb, screenshots, and a free account to test. Thanks for
> the great resource. [link]

**HARO / expert-quote response:**
> [Direct 2-3 sentence answer to the question, specific and quotable.] I'm Luis
> Carreno, founder of BookReady (booking websites for small beauty businesses).
> Happy to expand or share data. [link]

---

## 3. The review-stars reality (important)

Putting `AggregateRating`/`Review` schema on your own site about your own product
is **self-serving and not eligible** for Google review rich results. Do not add
it; it will not earn stars and risks a manual action.

**The legitimate path to star ratings in search:** collect real reviews on
third-party platforms (G2, Capterra, Trustpilot). Those platforms display the
stars and rank for "BookReady reviews" themselves. So **getting reviews doubles
as a backlink and a stars play.** Ask happy customers to review you there; make
it a step in onboarding.

---

## 4. In-repo status

- **Done:** rich schema sitewide; `WebSite` schema added; the internal-linking
  cluster (industry pages now link down to their niche guides via
  `content/gen-related-guides.mjs`, articles link up to the industry/money
  pages); the autonomous daily publisher targeting low-kd terms first.
- **Done:** Organization schema with logo + `sameAs` (Instagram
  @bkrdy.me). Add more socials (TikTok, LinkedIn, YouTube) to the `sameAs`
  array in `index.html` as you create them, each is a small brand signal.
- **Quick win still open:** the homepage has no `og:image`, so link previews
  when mybookready.com is shared have no thumbnail. Add a 1200x630 social image
  and an `og:image` meta tag.
- **Ongoing in code:** keep publishing (the engine handles it), keep clusters
  tight, refresh winning pages, and target featured snippets on high-intent
  queries.

---

## 5. Honest expectations

- **kd0 niche terms** (nail tech price list, eyelash extension price list, etc.):
  #1 is realistic within weeks once indexed, given the content + internal links.
- **Competitive terms** (kd20+, "salon booking software", "booking website"):
  #1 needs domain authority (backlinks) and time, typically 3 to 6+ months.
  There is no technical shortcut; it is links and patience.

---

## 6. AI / answer-engine visibility (GEO / AEO)

Getting cited by ChatGPT, Claude, Perplexity, and Google AI Overviews is the new
frontier. The mechanics differ from blue-link SEO.

**Done in-repo:**
- `llms.txt` at the root: a clean, factual map of BookReady (pricing, 0% fees,
  niches, comparisons) so assistants describe and cite you accurately.
- `robots.txt` explicitly welcomes AI crawlers (GPTBot, ClaudeBot,
  PerplexityBot) and does not block Google-Extended, so you are eligible for AI
  Overviews.
- The content engine already writes the formats AI loves to cite: honest
  comparisons, "X vs Y", clear definitions, and FAQ/Q&A (with FAQPage schema).

**Off-site (the real lever):** AI assistants synthesize answers from the sources
they trust most: Reddit threads, "best X" listicles, G2/Capterra, Wikipedia,
and YouTube. So **getting mentioned in those places is how you get cited by AI.**
This overlaps heavily with the backlink work in section 2: a listing on G2, an
inclusion in a "best salon booking software" roundup, or an active Reddit
presence in r/Nailtechs, r/Barber, r/lashextensions doubles as AI visibility.

**Track it:** once a month, ask ChatGPT and Perplexity questions your buyers ask
("best booking website for nail techs", "Booksy alternative", "how do I take a
deposit for lash appointments") and note whether and how BookReady appears.
Where you are missing, that is a signal to get mentioned in the sources that
answer surfaced from.

---

## Weekly cadence (15-30 min)

- Publishing runs automatically (the daily publisher).
- **You:** check GSC once (coverage + top queries), do 2-3 backlink actions from
  Tier A/B, and ask one happy customer for a G2/Capterra review.
- **Monthly:** refill the content queue (ask the assistant to run niche research),
  review GSC winners, and refresh the 2-3 best-performing pages.
