# BKRDY blog loop

The routine for the bkrdy.com blog: research, drafts, images, Luis's approval, publishing.
Two scheduled tasks run it on Luis's computer (Claude desktop app):

- **bkrdy-blog-drafts**: the 15th of each month, 2 PM. Research, the next batch of drafts with their graphics and share images, review page updated, email to Luis.
- **bkrdy-blog-publish**: every weekday, 11 AM. Publishes what Luis approved, on its date. Revises what he flagged. Adds a photo he has licensed. Emails only when something happened.

Nothing is ever published without Luis's approval on the review page.

## Where things are

- Repo: `C:\Users\carre\bookready-marketing`. Pushing `main` deploys the live site (Hostinger auto-pulls, live in about a minute). Pages are generated: `node content/blog-tools/build.mjs`.
- Articles: `content/blog/<key>.md`. Front matter, in this order: `key, section, slug, title, metaTitle, description, date, pillar, keywords, photoTerms, photo, photoAlt, status`. `section` is `blog` or `guides` and decides the URL. `status: draft` never builds; `status: published` builds once `date` has arrived. A post that stops being live has its directory removed on the next build.
- **Drafts are not reachable, by design.** `/content/` is 403 in `.htaccess` and disallowed in robots.txt, and every `.md` is 403 as well. A draft also produces no directory, no sitemap entry and no llms.txt line. Three separate things would have to fail for a draft to leak.
- Review page (private to Luis): https://claude.ai/artifact/QygrGWwPQYo2f5vz5Scmpe . Its database (ArtifactData tool, same URL):
  - `months/<YYYY-MM>`: `{ id, seo: {date, pages, indexable, errors, warnings, items[]}, report: {date, provider, rows: [{term, volume, difficulty, cpc, covered: {key, status, title} | null}]}, gsc: {connected, clicks, impressions, opportunities[]} }`
  - `posts/<YYYY-MM>~<key>`: `{ month, key, date, pillar, section, keywords, status, note, title, desc, slug, body, words, minutes, url, photoTerms[], photoFile, graphic }`
  - `status`: `pending` (waiting for Luis) → `approved` or `changes` (with `note`) → `published`.
  - `photo` on a post: `{ added: true, url, alt }` once a licensed photo is in the article.
  - `covers/<key>`: `{ key, url }` the share image, shown on the card as the link preview.
  - `graphics/<key>-<name>`: `{ src, url, key }`. `src` is the path in the Markdown line (`/images/blog/<key>-<name>.webp`), `url` the uploaded 720px copy the reader shows.
  - Images on the page are artifact assets: upload with the Artifact tool (`publish`, `url`, `asset: true`, `file_paths`, up to 25 files, all inside the working directory), then write the returned `/_blob/<id>` urls. Never put base64 images in a document.
  - The calendar reads `date` and `status` from `posts`, so keep both right.
- Scripts, all under `content/blog-tools/`:
  - `build.mjs` renders the articles, both hubs, the sitemap entries and the llms.txt article list.
  - `seo-check.mjs [--blog] [--json <file>]` the site check. Exits 1 on errors.
  - `gsc.mjs` Search Console. Exits 2 with an explanation when it cannot connect, which must not fail the run.
  - `search-terms.mjs` Google autocomplete.
  - `keyword-metrics.mjs <terms.md> <out.json>` DataForSEO volume, difficulty and click cost.
  - `blog-seed.mjs <YYYY-MM> <out-dir> [seo.json] [keywords.json] [notes.json] --keys a,b,c` review page documents.
  - `covers.mjs [key ...]` share images. `graphics.mjs [key ...]` in-article graphics.
  - `photos.mjs` adds a licensed photo. `blog-email.mjs <payload.json>` sends the email.
  - `migrate.mjs` was the one-time import of the hand-written pages. Do not run it again; it reads the public HTML, which the generator now owns.
  - The image scripts need sharp and Chrome: prefix them with `SHARP=C:/Users/carre/bookready-marketing/node_modules/sharp`.
- **Search Console** needs a service account added as a Restricted user on the bkrdy.com property. Until that is done `gsc.mjs` prints exactly what to do and exits 2. Say so in the email each month until it is connected; do not let it stop the run.
- **Keyword numbers** come from DataForSEO, read from the repo's gitignored `.env` (never print them) and cached in `content/research/.kw-cache`, so a repeat run costs nothing. A month costs a few cents.
- **Email**: Resend, `RESEND_API_KEY` / `NOTIFY_EMAIL` / `NOTIFY_FROM` in `.env`, through `blog-email.mjs`. With no key it writes a preview and exits 0 rather than failing the run.
- **Line endings**: the build writes pages with LF and git (autocrlf) then lists unchanged pages as modified in `git status`. Judge real changes with `git diff --stat`; when it is empty, `git checkout -- .` clears the noise. Never treat that noise as someone else's work.
- **Shell scripts**: the Bash tool collapses `\\` inside heredocs, so write any script containing backslashes (regexes, Windows paths) with the Write tool, then run it.

## The pillars

Every article belongs to one, set in `pillar`. They are the shape of the blog, not decoration: the hub filters by them and the share image prints the label.

- `switching` — Competitor fees, honest math, what transfers and what does not. The lowest-difficulty, highest-intent searches we have.
- `money` — Deposits, no-show fees, cancellation windows, card on file, tips, pricing your own services.
- `coming-back` — Rebooking, reminders, waitlists, reviews, client records.
- `your-site` — The booking page, the link in bio, the domain that is yours rather than a marketplace listing.
- `the-week` — Calendars, capacity, drops, after-hours, how the week is shaped. Little search volume, but it is what BKRDY does that nobody else writes about.
- `going-solo` — Booth rent, going independent, the first ninety days.

## Monthly run (the 15th)

Let M be the batch name (`YYYY-MM`, the month most of the batch falls in). Every step runs every month. If one fails, note it for the email and carry on with the rest.

**Research**

1. `git checkout main`, `git pull`. Stop and email Luis if `git diff --stat` shows uncommitted changes you did not make (see the line-ending note above).
2. Site check: `node content/blog-tools/build.mjs`, then `node content/blog-tools/seo-check.mjs --json <scratch>/seo.json > <scratch>/seo.md`. Read it. Do not change the site in this run: list clear problems as suggested fixes for the email.
3. Search Console: `node content/blog-tools/gsc.mjs > <scratch>/gsc.md`. Its opportunities get first priority when picking topics, and its **pace** line decides the batch size: if it says slow down, cut the batch and say why in the email.
4. Search terms: `node content/blog-tools/search-terms.mjs > <scratch>/terms.md`.
5. Numbers: `node content/blog-tools/keyword-metrics.mjs <scratch>/terms.md <scratch>/keywords.json > <scratch>/keywords.md`. If DataForSEO errors, say so in the email and carry on with autocomplete only.

**Drafts**

6. Pick the topics. One a day, Monday to Friday: count the weekdays the batch has to cover, starting the day after the latest dated article already on the books (live or draft), so there is never a gap between batches. Dates may run past the end of M.
   Favour searches with **no article yet**, real monthly volume and difficulty under 40, Search Console opportunities first. Skip anything an existing article already covers (the report marks it) and anything already pending on the review page. Spread the batch across the pillars rather than filling it with one; three or four switching pieces a month is plenty.
7. Write each one following the writing rules below, `status: draft`. Put the searches it targets on the `keywords:` line exactly as they appear in keywords.md, so the report can mark them covered. You may draft in parallel with subagents, but read every file yourself before going on.

**Images**

8. Graphics. Decide which articles improve with one: step by step instructions, a checklist, a comparison, a decision guide, a price list, or a policy you can copy. Skip it when a graphic would only repeat one short paragraph; usually half the batch gets one. For each:
   - Add an entry to `content/blog/graphics.mjs` (types: `steps`, `checklist`, `dodont`, `compare`, `costs`, `policy`, `flow`; copy the shape of an existing entry). **Every word comes from the article.** No new facts, numbers or claims.
   - `SHARP=… node content/blog-tools/graphics.mjs <keys>`, then look at every new image: nothing cut off, nothing overlapping, readable at phone size.
   - Put `![<alt>](/images/blog/<key>-<name>.webp)` on its own line where it summarises the section it sits in, with a blank line before and after. Write alt text that says what the graphic shows, in full sentences.
9. Share images: `SHARP=… node content/blog-tools/covers.mjs <the batch keys>`, then look at every new `images/blog/<key>-og.png`: the headline must not touch the shape on the right.
10. Photos. **Luis licenses photos himself.** His Shutterstock plan excludes some collections, so never pre-pick one for him. For each article put three search terms on the `photoTerms:` line, separated by `|`, following the art direction below. He saves the licensed file as `<key>.jpg` in `C:\Users\carre\bkrdy-blog-photos` and the publish run finds it there.

**Check, commit, review page, email**

11. Check every draft: front matter complete and in order; title 60 characters or fewer (65 at the very most); description 120 to 155; every internal link points at a page that exists after a build; outside links open and are official sources; no em dashes; no invented numbers; only BKRDY's real plans and prices; every graphic line points at a file that exists. `node content/blog-tools/build.mjs` then `node content/blog-tools/seo-check.mjs` must show no errors.
12. Commit the drafts, their share images, graphics and the `graphics.mjs` entries to `main` ("Blog drafts for <Month YYYY>") and push. Drafts do not build, so no live page changes.
13. Re-run `keyword-metrics.mjs` so the new drafts show as covered (cached, free). Then `node content/blog-tools/blog-seed.mjs M <scratch>/seed <scratch>/seo.json <scratch>/keywords.json <scratch>/notes.json --keys <the new keys, comma separated>`. `notes.json` is `{"findings": ["plain sentences about the site check"], "gsc": {...}}`. Drop obvious noise from `report.rows` in `<scratch>/seed/months/M.json` before writing.
14. Upload the new share images and the graphics' `-720.webp` copies to the review page as assets (copy them into a temporary folder inside the repo first, then delete it), and write everything with ArtifactData `batch` (`set`, at most 50 writes per call): the posts, the month, the covers and the graphics.
15. Email Luis: `node content/blog-tools/blog-email.mjs <scratch>/email.json`. Payload `kind: "drafts"`, the review link, every title with its date, which have a graphic, the site check findings, three to five notable searches with their numbers, the photo file names with their search terms, and anything that failed.

## Publish run (every weekday)

1. `git checkout main`, `git pull`. Stop and email Luis if `git diff --stat` shows uncommitted changes you did not make.
2. Read the review page: ArtifactData `query` on `posts` where `status` is `approved` or `changes`.
3. For each `changes`: revise the article as the note asks, same rules, keep `status: draft`, and update the document with the new title, description and body, `status: "pending"`, `note: ""`, `revisedFor: <the note>`, `revisedAt: <now>` (pin `if_version`). If the title changed, re-run `covers.mjs <key>`. If the revision changed something a graphic shows, update its entry, re-run `graphics.mjs <key>` and upload the new 720px copy.
4. For each `approved` whose date has arrived: set `status: published` in the Markdown file (keep `date`).
5. Photos. For every article without a `photo:` line, live ones included, run `node content/blog-tools/photos.mjs --find <key>`. When it prints a file, look at the image, check it matches the art direction, and run `SHARP=… node content/blog-tools/photos.mjs <key> <file> "<alt text>"` with a plain description of what the photo shows. When nothing is found, publish without it; the next run adds it once the file is there, even if the article is already live. Adding Luis's photo to its own article is allowed in this run.
6. `node content/blog-tools/build.mjs` and `node content/blog-tools/seo-check.mjs`. Stop and email Luis if there are errors.
7. If the build changed any page, commit "Blog: publish <titles>" and push `main`. Wait for the deploy, polling the new URLs until they answer 200, up to five minutes.
8. For every article now live, update its document: `status: "published"`, `publishedAt`, `url`.
9. Email Luis only if something was published, revised or got its photo: `blog-email.mjs` with `kind: "published"`. Otherwise send nothing.

Never publish an article that is not `approved` on the review page. Never change any other site content in these runs. If anything fails, do not push; email Luis what happened and stop.

## Writing rules

- **Audience.** The owner-operator who already has clients: barbers, lash artists, nail techs, estheticians, brow and wax specialists, hair stylists, small salons and spas, solo pros and small teams across the United States. Not beginners researching how to start a business, and not multi-location chains.
- **Voice.** Write to the reader as "you". BKRDY is named only where it is genuinely the answer, and never more than twice in an article. No "we" marketing voice, no author persona, no hype, no stacked adjectives. Short sentences. Open with the answer rather than a warm-up paragraph.
- **The two rules that make this blog different from every other booking-software blog**: every article names the trade-off honestly, including when BKRDY is not the right answer, and every article contains something the reader can do this week.
- **Shape.** An opening paragraph or two, then a `:::answer` block of two or three sentences that answers the question outright, then `##` sections. End on the point, not on a summary of itself. The template adds the call to action, so never write one.
- **Length.** 900 to 1,300 words. A short article that answers the question beats a long one that circles it.
- **Markdown only**, and only what `md.mjs` supports: `##` and `###`, paragraphs, `- ` and `1. ` lists, `[text](url)`, `**bold**`, `*italic*`, `> ` for a pull quote, a pipe table, `:::answer`, `:::copy Label`, and at most one graphic line. No HTML, no code blocks, no images of your own.
- **`:::copy`** is for anything a reader would otherwise retype: a policy, a reminder message, a rebooking script. Use it when it applies; it is the most useful thing on the page.
- **A `## Questions` section** at the end is optional. When it is there, each `###` under it is a question and the generator emits the FAQ structured data from those exact words, so never write a question the page does not answer in full.
- **Accuracy.** No invented statistics, percentages, studies, quotes, testimonials or customer stories. No numeric claim you cannot verify. Describe a competitor's pricing only in approximate terms, say prices change, and never state a competitor's number as current fact. Describe BKRDY features only where you are sure they exist; when unsure of a button's name, describe it generically.
- **Google's review rules**, in articles and in graphics: ask every customer, never only the happy ones, never offer an incentive, never write or buy reviews, never gate a review behind a rating question.
- **Prices.** Only BKRDY's real plans, from `api/config/plans.php` in `C:\Users\carre\bookready`: Starter $0, Solo $21 a month or $18 billed annually, Studio $34 or $29 (up to six staff), Studio+ $55 or $47 (up to twelve), Salon quoted. Seven day trial, card required. Unlimited texts on every paid plan. Customer payments run through the owner's own Stripe account with no BKRDY markup. If a price in an article would contradict that file, the file wins: check it, do not remember it.
- **Links.** Internal links only to pages that exist (check after a build). Outside links only to official sources, at most two per article, and never to a competitor's pricing page as evidence of a number.
- **No em dashes**, anywhere, in articles or graphics.
- **Stay out of** legal advice, employment classification, tax, and anything about a client's medical or private information beyond "do not share it".

## Photo art direction

Beauty professionals at work with their clients: barbers, lash artists, nail techs, estheticians, hair stylists, brow and wax specialists. Real, warm, natural light, a genuine mix of Black, Latina, Asian and white professionals and clients, a mix of ages and body types, salons that look like real workplaces rather than showrooms.

Never: floating stars, sparkles, holograms or glowing interfaces; fake phone or app screens; illustrations, vectors or anything that looks generated; visible brand logos; anything marked editorial use only; stock-smile group shots around a laptop.

Three search terms per article, written the way you would type them into Shutterstock. Vary them across the batch so the blog does not end up with twenty versions of the same photo.
