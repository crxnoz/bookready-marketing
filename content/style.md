# BookReady Article Style Guide

This guide governs every article in the content queue. Articles are written by automated daily agents — these rules keep voice and quality consistent.

## Voice

- **Premium-but-friendly.** Small beauty studios, not enterprise. Considered, not aspirational.
- **Opinionated and honest.** Take a position. Acknowledge tradeoffs. Don't write listicles where every option is "great."
- **Direct.** Short sentences. Active voice. Subject-verb-object.
- **Specific over abstract.** "Solo barbers see no-show rates around 15-25%" beats "no-shows are common."
- **No marketing-speak.** Avoid "leverage," "unlock," "elevate," "robust," "best-in-class," "seamless."

## Hard rules (the project enforces these)

1. **No em-dashes.** Anywhere. Use commas, periods, colons, or parentheses. The user has a script (`.claude/dedash.mjs`) that catches violations.
2. **No business-type labels in `/templates/` mood copy.** The seven template detail pages have moody intro copy that describes mood/color/feeling only. Articles can reference templates by name freely; just don't pollute the existing mood blocks.
3. **Honest comparisons.** Every listicle / comparison page must have a "they're better if..." section. Builds trust, ranks better long-term.
4. **Internal links only to existing URLs.** Do not invent URLs not in the site. Common existing URLs:
   - `/for-{barbers,lash-artists,nail-techs,estheticians,spas,solo-pros,salons}/`
   - `/templates/{thefaderoom,lushstudio,velvettheory,blackline,opaline,petale,bottega}/`
   - `/compare/{glossgenius,acuity,square-appointments,fresha,booksy}-alternative/`
   - `/platform/booking/{online,calendar,sync,recurring,waitlist}/`
   - `/platform/tools/{payments,customers,notifications,marketing,analytics,reviews}/`
   - `/platform/website/{templates,domain,mobile,sections,announcement}/`
   - `/features/client/{booking,dashboard,payments,reschedule,reminders}/`
   - `/features/manage/{dashboard,reschedule,staff,hours,customers}/`
   - `/features/growth/{email,sms,reviews,winback,analytics}/`
   - `/pricing/`, `/migration/`, `/blog/`, `/customers/`

## Article structure (use this skeleton)

Every article follows this shape so the SEO surface is consistent:

```
1. Pagehead
   - kicker: <type> · <reading-time> read
   - h1 + italic tagline
   - intro paragraph (200-300 words)

2. (Optional) "What you'll learn" or "Quick verdict" section
   - 100-150 words, sets the frame

3. 5-7 body sections
   - Each section: kicker, H2, body paragraphs
   - Each body 150-250 words
   - At least one internal link per section where relevant

4. (Optional) Comparison table
   - Use .br-compare class
   - Rows = features, columns = options

5. FAQ
   - 6-10 Q&A
   - Wrap in .br-faq + .br-faq__item / <details><summary>
   - Always add FAQPage JSON-LD schema

6. Final CTA
   - .br-final-cta class
   - Specific, industry-targeted CTA
   - Register URL pre-filled with ?industry=<niche>&template=<slug>

7. Footer (the shared one)
```

## Word count targets

| Type | Target | Floor |
|---|---:|---:|
| Pillar page | 2,500-3,500 | 2,000 |
| Listicle (per-niche "best X for Y") | 2,000-3,000 | 1,800 |
| Comparison page (`/compare/X-alternative/`) | 1,500-2,000 | 1,200 |
| How-to guide | 1,800-2,500 | 1,500 |
| Opinion blog post | 1,500-2,000 | 1,200 |
| Short blog post | 800-1,200 | 600 |

Articles below the floor are rejected. Articles above the ceiling are fine if needed for full coverage.

## Schema requirements

Every article must include:

1. **BreadcrumbList** (Home > Blog/Guides > <article title>)
2. **Article** for blog posts (with author=Organization, datePublished, image)
3. **FAQPage** when the article has a FAQ section
4. **HowTo** when the article is a step-by-step how-to (rare; use sparingly)

## CTA strategy

Every article must funnel to at least one revenue page:
- `/for-<niche>/` for industry-targeted articles
- `/pricing/` for plan-evaluation articles
- `/migration/` for switching/comparison articles
- `/templates/<slug>/` for template-specific articles

The final CTA uses register URL with pre-filled params:
- `https://app.bkrdy.me/register?industry=<niche>&template=<slug>`

## Linking patterns

Within each article:
- **First 200 words**: link to 1 industry page (e.g. /for-barbers/)
- **Mid-article**: 2-3 contextual links to relevant feature pages
- **Conclusion**: 1 link to /pricing/ or /migration/

External links:
- Only when citing specific data, products, or sources
- Always `rel="noopener"` for `target="_blank"`
- Industry studies are good; competitor marketing pages are fine

## Brand voice examples

**Good**:
- "Solo barbers see no-show rates around 15-25%. Deposits cut that roughly in half within 30 days."
- "If retail is a meaningful part of your revenue, GlossGenius is the stronger pick. Otherwise the 2.6% fee makes the math hard."
- "Most shops are live in 20 minutes. Migration usually finishes the same day."

**Bad** (avoid):
- "BookReady empowers beauty professionals to seamlessly manage..." (marketing speak)
- "The best booking platform on the market" (vague superlative)
- "Revolutionize your business with cutting-edge features" (filler)

## Idempotency rules

- Every script that touches the queue must be idempotent (running twice does nothing the second time)
- Mark articles `status="shipped"` once committed, never regenerate shipped articles
- If generation fails, mark `status="failed"` with `failureReason` and skip — don't block the queue

## What to do when the queue is empty

- Skip publishing (no articles to write that day)
- Output a notice: "Queue empty. Refill content/queue.json with more entries."
- The scheduled agent should log this and not error out
