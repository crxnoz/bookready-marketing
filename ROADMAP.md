# BookReady Marketing Site — Roadmap

> What's still on the horizon. Organized by time horizon first, then by kind of work.
> Everything listed below has been thought through; nothing is on this list without a reason.

Last updated: 2026-06-08

---

## What's already shipped

So we don't accidentally re-do work. This is the state of the site as of the last commit.

### Pages (76 indexable URLs)

- Homepage, Pricing, Templates hub, 7 template detail pages
- 5 platform/website pages, 5 platform/booking pages, 6 platform/tools pages
- 5 features/client pages, 5 features/manage pages, 5 features/growth pages
- 7 industry pages (`/for-barbers/`, lash-artists, nail-techs, estheticians, spas, solo-pros, salons)
- 5 comparison pages (`/compare/glossgenius-alternative/`, acuity, square-appointments, fresha, booksy)
- 1 blog post (`/blog/best-booking-websites-for-barbers-in-2026/`, 2,565 words) + blog hub
- About, Contact, Customers, Migration, Newsletter, Community, Changelog, Roadmap, 404

### Infrastructure

- Nav rebuilt: 5 top-level items (Templates / Industries / Platform / Resources / Pricing), outcome-based Platform mega-panel, Switching column promoted, icons removed
- Footer rebuilt: 5 columns mirroring nav, ~36 links per page
- Featured-slot rotator at `.claude/featured-slot.mjs` — edit one variable, run, all 60 pages update
- Sibling-comparison strips on all 5 `/compare/*/` pages
- `/migration/` is now a comparison-card hub
- `/pricing/` has a "Switching from another platform?" tile

### Schema coverage

- BreadcrumbList on every page (75/76)
- 7 `Product` schemas (template pages, rich-result eligible)
- 7 `Service` schemas (industry pages, areaServed=US)
- 19 `FAQPage` schemas (homepage + industry + comparison + blog + migration)
- 1 `Article` schema (the listicle)
- 1 `SoftwareApplication` + `WebSite` on homepage

### SEO performance

- Audit score: ~96/100 (was 72)
- Internal links per page to /templates/* URLs: 15 (was 1)
- Internal links per page to /for-* URLs: 14 (was 0)
- Internal links per page to /compare/* URLs: 11 (was 0)

---

## Now (next session, ~half-day each)

Pick one. Each is shippable in a focused half-day.

### 1. Build `/for-makeup-artists/`

Closes the "Coming soon" badge in the Industries mega-nav. Highest-search-volume gap in the industry set.

- **Target keyword**: "makeup artist booking website" (~100-200/mo), "MUA portfolio website" (~150-300/mo), "bridal makeup booking site" (~100-200/mo)
- **Templates to feature**: Velvet Theory (editorial), Opaline (quiet luxury), Petale (bridal/romantic)
- **Recommended plan**: Solo ($15/mo) — most MUAs are solo or 1-2 team
- **Effort**: ~4 hr (1,200-word page following the established industry-page template)
- **Wire-up**: remove "Soon" tag from nav, add `/for-makeup-artists/` to footer, sitemap entry, update related-strip on Velvet Theory + Opaline + Petale pages

### 2. Build `/compare/vagaro-alternative/`

Vagaro has the highest unwon comparison-page search volume per the competitor analysis. "Vagaro alternative" = 400-900/mo.

- **Per-competitor angle**: Vagaro is the multi-service salon/spa giant. BookReady wins on price ($15 vs $25-$199+/mo + their per-booking fees), designed templates, and beauty-specific focus.
- **Where Vagaro wins**: multi-location, deep loyalty + gift cards, full POS, inventory.
- **Effort**: ~3 hr (follows the established comparison-page template)
- **Wire-up**: sibling-strip update on existing 5 comparison pages, footer Switching col, nav Resources/Switching col, sitemap

### 3. Build `/compare/styleseat-alternative/`

Second highest unwon comparison volume. "StyleSeat alternative" = 200-500/mo.

- **Per-competitor angle**: StyleSeat is the booth-rental + solo beauty pro marketplace. Strongest in nail/lash/braid niches in dense urban markets. BookReady wins on brand ownership (StyleSeat profile is StyleSeat-branded) and on the marketplace fee math.
- **Effort**: ~3 hr
- **Wire-up**: same as Vagaro

### 4. Build `/industries/` hub page

Currently the Industries mega-nav has no central hub. A buyer who wants to compare all 7 industries side-by-side has no landing page. The hub would be:

- A grid of all 7 industry cards
- A "By size" cut (Solo / Studio / Salon plan tiers)
- A FAQ section ("Why does the industry matter?", "Can I switch industries later?")
- An invitation to suggest a missing industry
- **Effort**: ~2 hr
- **Why it matters**: closes one of the IA gaps from the redesign. Makes the Industries dropdown's "All industries →" link land somewhere real.

### 5. Build `/compare/` hub page

Same gap on the Switching side. Visitors who came to compare BookReady to one platform have no path to see all 6 comparisons together.

- Grid of all 6 comparison cards (current 5 + Vagaro/StyleSeat as they land)
- "Free same-day migration" pitch above
- Link to `/migration/` for the how-it-works
- **Effort**: ~1.5 hr

---

## Soon (next 1-3 months, content compounding)

### Migration cluster (Pillar 4 — BOFU, highest ROI per article)

Already done: 5 comparison pages. Still missing:

| Article | Target keyword | Est. volume | Effort | Status |
|---|---|---:|---|---|
| `/blog/best-acuity-alternatives-for-salons/` | best acuity alternatives | 200-500 | ~4 hr | Pending |
| `/guides/export-clients-from-acuity/` | export client list from acuity | 100-300 | ~3 hr | Pending |
| `/guides/migrate-from-vagaro/` | migrate from vagaro | 100-200 | ~3 hr | Pending |
| `/guides/switching-booking-platforms/` (pillar page) | switch booking software | 100-200 | ~5 hr | Pending |

### Booking Websites cluster (Pillar 1 — commercial TOFU + MOFU)

| Article | Target keyword | Est. volume | Effort |
|---|---|---:|---|
| `/guides/beauty-booking-websites/` (pillar page) | beauty booking website | 100-300 | ~5 hr |
| `/guides/how-to-create-beauty-booking-website/` | how to create a beauty booking website | 100-200 | ~4 hr |
| `/blog/why-beauty-brands-need-their-own-website/` | beauty business website | 300-700 | ~4 hr |
| `/blog/best-website-builders-for-salons/` | best website builder for salons | 200-500 | ~5 hr |
| `/blog/wix-vs-bookready-for-salons/` | wix for salons | 100-200 | ~4 hr |
| `/blog/squarespace-vs-bookready/` | squarespace for booking | 100-200 | ~4 hr |
| `/guides/add-booking-link-to-instagram-bio/` | add booking link to instagram bio | 300-600 | ~3 hr |
| `/guides/connect-domain-to-booking-site/` | connect domain to booking site | 50-100 | ~3 hr |

### Appointment Management cluster (Pillar 2 — operational, links to deposits/no-shows)

| Article | Target keyword | Est. volume | Effort |
|---|---|---:|---|
| `/guides/appointment-management/` (pillar page) | appointment management for salons | 100-200 | ~5 hr |
| `/guides/reducing-no-shows/` | how to reduce no-shows | 500-1.1K | ~5 hr |
| `/guides/deposit-best-practices/` | salon deposit policy | 300-700 | ~4 hr |
| `/guides/cancellation-policy-template/` | salon cancellation policy template | 400-900 | ~4 hr |
| `/guides/how-much-deposit-to-charge/` | how much deposit to charge | 200-500 | ~3 hr |
| `/guides/no-show-fee-policy/` | no-show fee policy | 300-600 | ~3 hr |
| `/guides/managing-walk-ins-and-waitlist/` | walk-in waitlist for barbershop | 100-200 | ~3 hr |

### Beauty Business Growth cluster (Pillar 3 — TOFU, long-tail compounding)

| Article | Target keyword | Est. volume | Effort |
|---|---|---:|---|
| `/guides/beauty-business-growth/` (pillar page) | how to grow a beauty business | 100-300 | ~5 hr |
| `/guides/growing-a-salon/` | how to grow a hair salon | 400-900 | ~5 hr |
| `/guides/growing-a-barbershop/` | how to grow a barbershop | 300-700 | ~5 hr |
| `/guides/growing-a-lash-business/` | how to grow a lash business | 200-500 | ~4 hr |
| `/guides/growing-a-nail-business/` | how to grow a nail business | 200-500 | ~4 hr |
| `/guides/client-retention-for-beauty-studios/` | client retention salon | 300-600 | ~4 hr |
| `/guides/get-more-google-reviews-salon/` | get more google reviews salon | 200-400 | ~3 hr |
| `/guides/instagram-marketing-for-beauty-businesses/` | instagram marketing for salons | 300-700 | ~4 hr |

### Per-industry listicles (compounding the barber listicle pattern)

The barber listicle (#1 BookReady, then 5 competitors honestly ranked) is repeatable per industry. Each is a top-funnel discovery surface that drives traffic to the matching `/for-<niche>/` page.

| Listicle | Target keyword | Est. volume | Effort |
|---|---|---:|---|
| `/blog/best-booking-websites-for-hair-salons-in-2026/` | best booking website for hair salons | 300-600 | ~5 hr |
| `/blog/best-booking-websites-for-lash-artists-in-2026/` | best booking website for lash artists | 150-300 | ~5 hr |
| `/blog/best-booking-websites-for-nail-techs-in-2026/` | best booking website for nail techs | 100-200 | ~5 hr |
| `/blog/best-booking-websites-for-estheticians-in-2026/` | best booking website for estheticians | 100-200 | ~5 hr |
| `/blog/best-booking-websites-for-spas-in-2026/` | best booking website for spas | 100-200 | ~5 hr |

---

## Later (next 3-6 months)

### Additional industry pages (when there's content cadence)

Once the core 7 industry pages mature, add adjacent niches with smaller but underclaimed search demand:

| URL | Primary kw | Est. volume |
|---|---|---:|
| `/for-brow-studios/` | brow studio website | 50-150 |
| `/for-pmu/` (permanent makeup / microblading) | microblading website | 100-200 |
| `/for-massage-therapy/` | massage therapy website | 200-400 |
| `/for-waxing-studios/` | waxing studio website | 50-100 |
| `/for-tattoo-shops/` | tattoo shop booking website | 100-300 |

Each unlocks small but compounding search volume. Build only when the existing 7 have started ranking.

### Schema gaps remaining

From the original audit, still pending:

- **`WebSite` + `SearchAction` on homepage** (~15 min)
  Unlocks sitelinks search box in Google.
- **`Organization` on homepage with sameAs** (~30 min)
  Promotes BookReady to Knowledge Panel eligibility once social profiles are linked.
- **`HowTo` schema on the "Live in under 20 minutes" homepage section** (~30 min)
  3-step process is already in the visible UI; schema enables rich result treatment.
- **`FAQPage` on `/pricing/`** (~20 min)
  The page already has visible FAQs; just need to add the schema.
- **`Article` schema on `/changelog/` entries** (~1 hr)
  Once changelog entries are dated, mark them up individually.

### Audit follow-ups

- **W4: Trim `/templates/bottega/` meta description** (254 → ~155 chars) (~5 min)
- **Move "Reviews" link consistency** (it was duplicated; now in Grow only, verify)
- **Title bloat sweep**: `features/index.html` and `platform/index.html` still have brand repetition (~15 min)
- **A11y audit** (~2 hr): test all interactive elements with keyboard + screen reader

### Brand & community

- **Real customer stories series** (8-10 per year, long-form interviews) — pure social proof + highest SEO value of any community asset
- **Referral program** (1 month free for both parties) — currently teased as "Soon" in nav. Mechanical, no community management overhead. (~6 hr to ship)
- **Public roadmap with voting** (e.g. Canny embedded into existing `/roadmap/`) — turns announcement page into engagement (~3 hr)
- **Discord channels by industry** (#barbers, #lash, #nails) + weekly office hours — only when Discord membership reaches ~50 active members

### Local SEO (cautious rollout)

Per Phase 5 of the original plan. **Do not start before Month 6** — programmatic SEO on a fresh domain risks thin-content penalties. Once topical authority is established:

| URL pattern | Volume | Notes |
|---|---|---|
| `/{city}/{niche}-booking-website/` (top 25 metros × 8 niches = 200 pages) | varies | Each needs real city-specific content (~600+ words, real data) |
| `/guides/google-business-profile-for-{niche}/` (8 guides) | 200-400 each | Educational, owner-facing |

---

## Year 2+ (programmatic, marketplace, scale)

### Programmatic SEO patterns

**Trigger condition**: BookReady at DR ≥ 25 and 200+ indexable pages with measurable organic traffic.

| Pattern | URL | Count | Quality risk |
|---|---|---:|---|
| Template × Industry | `/templates/<slug>/for-<niche>/` | 56 (7 templates × 8 niches) | Low — genuinely unique value per crossover |
| Industry × Use Case | `/for-<niche>/<use-case>/` (e.g. /for-barbers/walk-ins/) | 40-80 | Medium — use cases differ per niche |
| Competitor × Industry | `/<competitor>-vs-bookready-for-<niche>/` | 45 (5 competitors × 8 niches) + 5 single = 45 | Low — high commercial intent |
| City × Industry (full programmatic) | `/<city>/<niche>-booking-website/` | 200-1,600 | High — requires real city-specific data per page |

**Quality safeguards (mandatory before any programmatic batch)**:
1. ≥ 600 words per page, ≥ 1,200 for comparison
2. ≥ 200 words of hand-written unique content per page (intro + custom FAQ)
3. Real city/industry data injection (Census, business counts, etc.)
4. 3-5 contextually-relevant internal links per page
5. Schema specificity (Service with areaServed for city pages)
6. No keyword-stuffed deep URLs (stop at `/city/niche/`)
7. `noindex` on placeholder versions until they have real content
8. Rotate H2 structures so 200 pages aren't visually identical

### Marketplace

Currently teased as "Soon" in nav (Templates panel). Full shipping requires:

- Creator accounts (separate from regular user accounts)
- Template submission flow (preview, review, approval)
- Revenue split mechanics (BookReady takes %, creator takes %)
- Moderation queue
- Creator profile pages
- Featured creator slots

**Effort**: 6-12 months of product work. Marketing surface is ready (the "Soon" badge exists; replacing with a real link is trivial when the product ships).

### Multi-location SEO

Currently roadmapped Q1 2027 per FAQs. When it ships:

- `/platform/multi-location/` feature page
- `/for-multi-location-salons/` industry page
- Multi-location comparisons (BookReady multi-location vs Vagaro multi-location, etc.)
- Per-location schema enhancements

### International / hreflang

US-only today per FAQ. When BookReady ships UK/AU/EU:

- Region selector in nav right side
- URL strategy: `/uk/`, `/au/` subpaths (NOT ccTLDs unless budget for 3 brands)
- hreflang tags coordinating regional variants
- Region-specific landing pages (`/uk/for-barbers/` etc.)
- Local payment methods + 10DLC equivalents per region

---

## By kind of work

Cross-cutting view, useful for batching similar work.

### Content (writing)

| Item | Effort |
|---|---|
| `/for-makeup-artists/` industry page | 4 hr |
| Vagaro + StyleSeat comparison pages | 6 hr |
| 4 more migration cluster articles | 15 hr |
| 8 Booking Websites cluster articles + 1 pillar | 32 hr |
| 7 Appointment Management cluster articles + 1 pillar | 27 hr |
| 8 Beauty Business Growth cluster articles + 1 pillar | 35 hr |
| 5 per-industry listicles (after barbers) | 25 hr |
| 5+ adjacent industries (brow, PMU, massage, etc.) | 20 hr |
| 8 GBP guides (one per niche) | 16 hr |

**Total content backlog**: ~180 hours / ~5 person-weeks at 2 hr/day cadence.

### IA / structure

| Item | Effort |
|---|---|
| `/industries/` hub page | 2 hr |
| `/compare/` hub page | 1.5 hr |
| Add `/blog/` to nav once 5+ articles published | 30 min |
| Add `/industries/` link in nav once hub exists | 15 min |
| Mega-nav templates rotation by visitor's industry intent (low priority) | 4 hr |
| Featured-slot scheduling (auto-rotate monthly) | 2 hr |

### Technical / SEO

| Item | Effort |
|---|---|
| `WebSite` + `SearchAction` schema on homepage | 15 min |
| `Organization` schema with sameAs | 30 min |
| `HowTo` schema on homepage 3-step section | 30 min |
| `FAQPage` schema on `/pricing/` | 20 min |
| `Article` schema on changelog entries | 1 hr |
| W4 description trim on bottega | 5 min |
| Title bloat sweep on features/index, platform/index | 15 min |
| Image right-size pass (1600px → 800px for thumbnails) | 2 hr |
| A11y full keyboard + screen reader audit | 2 hr |
| Google Search Console setup + verify + sitemap submit | 30 min |

### Product-gated (waiting on app features)

These unlock real marketing content when product features ship:

| Feature | Marketing content unlocked |
|---|---|
| Email marketing | `/features/growth/email/` from placeholder to real, full email-marketing-for-salons content cluster |
| Multi-location | `/platform/multi-location/`, `/for-multi-location-salons/`, multi-location comparison content |
| Loyalty programs | Loyalty content cluster, loyalty-for-barbers, loyalty pricing math vs Booksy |
| Gift cards | Gift card content (high-intent: "salon gift card software") |
| Basic product catalog | Retail content cluster, vs GlossGenius "POS for salons" argument changes |
| Google Business Profile sync | Full local SEO content (this would be a meaningful local-SEO unlock) |
| Class booking | Class content (group fitness, classes, workshops as a vertical) |
| Native iOS/Android apps | Mobile app pages and comparison content can claim parity with Booksy/GlossGenius |

### Operations

| Item | Effort |
|---|---|
| Google Search Console verification + sitemap submit | 30 min |
| Bing Webmaster Tools setup | 30 min |
| Analytics: define KPIs + dashboards | 4 hr |
| A/B testing infrastructure (if you want to test CTAs, hero copy) | 8 hr |
| Build step migration to Astro (when page count ≥ 200) | 1-2 days |
| HTML minification + compression pipeline | 4 hr |

---

## Prioritization framework

When unsure what to ship next, this is the order of leverage:

1. **BOFU comparison pages** (highest ROI per page — buyer is already evaluating)
2. **Industry pages** (commercial intent + own unclaimed "X booking website" frame)
3. **Per-industry listicles** (top-of-funnel that pulls into industry pages)
4. **Cluster content** (TOFU compounding, long-term)
5. **Schema gaps** (small effort, unlocks rich results)
6. **IA polish** (closes loops in the architecture)
7. **Programmatic SEO** (do not start before topical authority established)

**Skip indefinitely**:
- "Salon software" head term (incumbents own it)
- Free/$0 marketing angle (Square owns it)
- Marketplace SEO play (wrong intent for buyer search)
- POS-first content (Square + GlossGenius own it)

---

## How to use this doc

1. **Pick from "Now"** when you have a half-day to ship something visible
2. **Pick from "Soon"** when content compounding is the priority
3. **"Later" and "Year 2+"** are reference, not active queue
4. **"By kind of work"** lets you batch similar tasks if you want to spend a day on schema, or a day on content, etc.

Anything not on this list either (a) was rejected for a reason (see "Skip indefinitely") or (b) hasn't been thought through yet. If you have a new idea, add it here with effort + impact estimates before shipping.

---

*Generated from the full SEO strategy session, IA rebuild, and competitor analysis. Update this doc as items ship or new ones surface.*
