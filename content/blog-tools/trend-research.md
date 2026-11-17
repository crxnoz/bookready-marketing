# Trend research run (every two weeks)

The BKRDY blog's research campaign across beauty, grooming and body art. It finds what is changing, checks it, and turns the strongest findings into content actions for the blog loop (`blog-loop.md`). Set up 2026-11-16 at Luis's request; the first run was the baseline (`content/trends/2026-11-16.md`).

It never publishes. Drafts go through the review page like any other draft, and an update to a live article is proposed in the report and waits for Luis.

## Where things live

- Reports: `content/trends/<YYYY-MM-DD>.md`, one per cycle.
- Running tracker: `content/trends/tracker.md`. Update rows in place; never delete one.
- Backlog: `content/trends/backlog.md`. The monthly blog run (the 15th) reads it before picking topics.
- Search volumes: `node content/blog-tools/trend-volumes.mjs <terms.txt> <scratch>/vol.json` (DataForSEO, US, 12 months). `/content/` is 403 on the web and disallowed in robots, so none of this is public.

## Industries

Barbers; lash artists; nail artists; waxing and sugaring; tattoo artists; piercers; braiders and natural hair; hairstylists and colorists; estheticians, skincare and brows. Give every one a scan each cycle, go deep where the evidence is strongest, and rotate so the smaller ones are not always last (the baseline was thin on tattoo and piercing, so cycle 2 starts with them).

## Research areas

Within each industry: services and aesthetics; social media and content (separate what attracts other pros from what attracts paying clients); customers and demand (what they ask for, praise, question, complain about, including pricing, deposits, consultations, communication, accessibility); business and operations; technology people actually adopt; search behavior.

## Sources and access

- **Google Search**: the backbone. Prefer original sources: government data, trade press, law firms, platforms' own announcements. Mark vendor, supplier and sponsored content as such.
- **Search volume**: `trend-volumes.mjs`. These are absolute monthly estimates, not Google Trends scores. Read the series, because a three-month change includes seasonality.
- **Reddit**: blocked in both browsers and to scripts as of 2026-11-16. Say so in every report until access exists. A Reddit thread quoted by another site is secondhand and labelled that way.
- **TikTok and Instagram**: no readable text without a logged-in session; use the platforms' own trend reports and announcements, and label everything else as indirect.
- **Spanish-language**: include where it adds US insight; Spain and Mexico sources are context only.

## Standards

- State the research date, geography and window: the last 14 days as "recent", 30 to 90 days as context.
- Never invent links, quotes, engagement counts, volumes or findings. A figure you could not confirm is marked unconfirmed with where it came from.
- One viral post is not a trend. Professional chatter, consumer interest and booking or purchase behavior are different evidence; say which you have.
- For health, safety or treatment claims, use authoritative sources, and in articles say "follow your training and product instructions" rather than giving technique.
- No legal advice. A law can be named with "check your state's rules".
- Every finding records: industry and area, what is happening, why it matters, sources with dates, date observed and geography, independent evidence, confidence (high, medium, low, with a reason) and status (emerging, growing, established, declining, seasonal). Thin evidence is a hypothesis to watch.

## The run

1. `cd C:\Users\carre\bookready-marketing`, confirm with `git remote -v` it is the marketing repo, `git checkout main`, `git pull`. Stop and email Luis if `git diff --stat` shows changes you did not make.
2. Read the latest report, `tracker.md`, `backlog.md`, and the blog's titles (`content/blog/*.md`).
3. Scan every industry and area. Run `trend-volumes.mjs` on the tracker's terms plus new candidates.
4. Investigate the strongest signals and look for evidence against them. Separate new developments from recycled and seasonal ones.
5. Map findings to existing articles before proposing new ones.
6. Write `content/trends/<today>.md` with:
   - **A.** Research brief: what matters, what changed since the last cycle, what to act on now.
   - **B.** Industry coverage table: every industry, its strongest finding, confidence, links. "No meaningful new signal" is fine.
   - **C.** Tracker changes.
   - **D.** Editorial plan: three to five actions (new article, substantial update, or minor refresh), each with reader, intent, queries with measured volumes only, headline and angle, evidence, takeaway, why now, and the article it updates.
   - **E.** Drafts of the two strongest actions. A new article is a normal draft in `content/blog/` following every writing rule in `blog-loop.md` (the BKRDY claim list, prices, no em dashes, draft-check). An update to a live article is proposed text in the report, after reading the article's current text; never edit a live article in this run, and never change a date to make content look fresh.
   - **F.** Next-cycle watchlist.
7. Update `tracker.md` and `backlog.md`.
8. New drafts: share image (`covers.mjs`), `build.mjs`, `draft-check.mjs`, `seo-check.mjs` (0 errors), date them on the next free weekdays after the latest dated article, then add them to the review page exactly as the monthly run does (`blog-loop.md` steps 13 and 14).
9. Commit with explicit paths ("Trend research <date>") and push. Drafts do not build, so nothing goes live.
10. Email Luis with `blog-email.mjs`, payload `kind: "drafts"` and `subject: "Trend research <date>"`: `findings` holds the brief and each content action as plain sentences (anything awaiting his yes says so), `posts` the new drafts with their dates, `searches` the notable measured volumes, and `failures` the access gaps.
