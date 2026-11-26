# BKRDY blog loop

The routine for the bkrdy.com blog: research, drafts, images, Luis's approval, publishing.
Two scheduled tasks run it on Luis's computer (Claude desktop app):

- **bkrdy-blog-drafts**: the 15th of each month, 2 PM. Research, the next batch of drafts with their graphics and share images, review page updated, email to Luis.
- **bkrdy-blog-publish**: every weekday, 11 AM. Publishes what Luis approved, on its date. Revises what he flagged. Adds photos: Luis's licensed file when he saved one, otherwise one from Pexels. Emails only when something happened.

Nothing is ever published without Luis's approval on the review page.

## Where things are

- Repo: `C:\Users\carre\bookready-marketing`. Pushing `main` deploys the live site (Hostinger auto-pulls, live in about a minute). Pages are generated: `node content/blog-tools/build.mjs`.
- Articles: `content/blog/<key>.md`. Front matter, in this order: `key, section, slug, title, metaTitle, description, date, pillar, keywords, photoTerms, photo, photoAlt, photoCredit, photoCreditUrl, status, source, sourceId` (the two credit lines only on a Pexels photo; build.mjs prints them under the photo as "Photo: name on Pexels"; `source: blg` and `sourceId` only on an article BabyLoveGrowth wrote, see "BabyLoveGrowth articles"). `section` is `blog` or `guides` and decides the URL. `status: draft` never builds; `status: published` builds once `date` has arrived. A post that stops being live has its directory removed on the next build.
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
  - `photos.mjs` adds a licensed photo. `photos-pexels.mjs` finds one on Pexels (`--find <key> <dir>`, a lettered contact sheet) and adds it (`--use <key> <id> "<alt>"`, which runs photos.mjs and writes the credit); `photo-credits.json` records every Pexels photo used, so none is used twice. `PEXELS_API_KEY` is in `.env`. `blog-email.mjs <payload.json>` sends the email.
  - `blg-intake.mjs` brings BabyLoveGrowth's articles in as drafts (`--list`, `--limit 2`, `--skip <id> "<reason>"`); `blg-skipped.json` is what it was told to leave out. See "BabyLoveGrowth articles".
  - `migrate.mjs` was the one-time import of the hand-written pages. Do not run it again; it reads the public HTML, which the generator now owns.
  - The image scripts need sharp and Chrome: prefix them with `SHARP=C:/Users/carre/bookready-marketing/node_modules/sharp`.
- **Search Console** needs a service account added as a Restricted user on the bkrdy.com property. Until that is done `gsc.mjs` prints exactly what to do and exits 2. Say so in the email each month until it is connected; do not let it stop the run.
- **Keyword numbers** come from DataForSEO, read from the repo's gitignored `.env` (never print them) and cached in `content/research/.kw-cache`, so a repeat run costs nothing. A month costs a few cents.
- **Email**: Resend, `RESEND_API_KEY` / `NOTIFY_EMAIL` / `NOTIFY_FROM` in `.env`, through `blog-email.mjs`. With no key it writes a preview and exits 0 rather than failing the run.
- **Line endings**: the build writes pages with LF and git (autocrlf) then lists unchanged pages as modified in `git status`. Judge real changes with `git diff --stat`; when it is empty, `git checkout -- .` clears the noise. Never treat that noise as someone else's work.
- **Shell scripts**: the Bash tool collapses `\\` inside heredocs, so write any script containing backslashes (regexes, Windows paths) with the Write tool, then run it.

## The pillars

Every article belongs to one, set in `pillar`. They are the shape of the blog, not decoration: the hub filters by them and the share image prints the label.

- `switching`: Competitor fees, honest math, what transfers and what does not. The lowest-difficulty, highest-intent searches we have.
- `money`: Deposits, no-show fees, cancellation windows, card on file, tips, pricing your own services.
- `coming-back`: Rebooking, reminders, waitlists, reviews, client records.
- `your-site`: The booking page, the link in bio, the site that is yours rather than a marketplace listing.
- `the-week`: Calendars, capacity, drops, after-hours, how the week is shaped. Little search volume, but it is what BKRDY does that nobody else writes about.
- `going-solo`: Booth rent, going independent, the first ninety days, and building your first book as a newer tech.

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
   Read `content/trends/backlog.md` first: items the biweekly trend research marked ready, with real volume, go ahead of new topics (see `trend-research.md`). Mark any you draft as `drafted` there.
   Favour searches with **no article yet**, real monthly volume and difficulty under 40, Search Console opportunities first. Skip anything an existing article already covers (the report marks it) and anything already pending on the review page. Spread the batch across the pillars rather than filling it with one; three or four switching pieces a month is plenty.
7. Write each one following the writing rules below, `status: draft`. Put the searches it targets on the `keywords:` line exactly as they appear in keywords.md, so the report can mark them covered. You may draft in parallel with subagents, but read every file yourself before going on.

**Images**

8. Graphics. Decide which articles improve with one: step by step instructions, a checklist, a comparison, a decision guide, a price list, or a policy you can copy. Skip it when a graphic would only repeat one short paragraph; usually half the batch gets one. For each:
   - Add an entry to `content/blog/graphics.mjs` (types: `steps`, `checklist`, `dodont`, `compare`, `costs`, `policy`, `flow`; copy the shape of an existing entry). **Every word comes from the article.** No new facts, numbers or claims.
   - `SHARP=… node content/blog-tools/graphics.mjs <keys>`, then look at every new image: nothing cut off, nothing overlapping, readable at phone size. Graphics are on the night look since 2026-11-01. One that changes after going live gets a new `name` and a new Markdown line, never a render over the old file, because the host caches images for a year.
   - Put `![<alt>](/images/blog/<key>-<name>.webp)` on its own line where it summarises the section it sits in, with a blank line before and after. Write alt text that says what the graphic shows, in full sentences.
9. Share images: `SHARP=… node content/blog-tools/covers.mjs <the batch keys>`, then look at every new `images/blog/<key>-share.jpg` (the night card, since 2026-11-01): the headline must stay on the dark left side and never run into Kito or the painting on the right. Never regenerate a published card under the same name; the host caches images for a year. An article retitled after going live gets a new card: add `shareCard: <key>-share-2.jpg` to its front matter and run covers.mjs on it.
10. Photos. For each article put three search terms on the `photoTerms:` line, separated by `|`, following the art direction below. The publish run uses them to add a Pexels photo on its own (since 2026-11-16). Luis can still license a Shutterstock photo and save it as `<key>.jpg` in `C:\Users\carre\bkrdy-blog-photos` before the article's date; a file of his always wins.

**Check, commit, review page, email**

11. Check every draft: every claim about BKRDY is true today (see "What BKRDY does and does not do"); front matter complete and in order; title 60 characters or fewer (65 at the very most); description 120 to 155; every internal link points at a page that exists after a build; outside links open and are official sources; no em dashes; no invented numbers; only BKRDY's real plans and prices; every graphic line points at a file that exists. `node content/blog-tools/draft-check.mjs` catches the claims that have shipped false before, and it must show no errors. `node content/blog-tools/build.mjs` then `node content/blog-tools/seo-check.mjs` must show no errors.
12. Commit the drafts, their share images, graphics and the `graphics.mjs` entries to `main` ("Blog drafts for <Month YYYY>") and push. Drafts do not build, so no live page changes.
13. Re-run `keyword-metrics.mjs` so the new drafts show as covered (cached, free). Then `node content/blog-tools/blog-seed.mjs M <scratch>/seed <scratch>/seo.json <scratch>/keywords.json <scratch>/notes.json --keys <the new keys, comma separated>`. `notes.json` is `{"findings": ["plain sentences about the site check"], "gsc": {...}}`. Drop obvious noise from `report.rows` in `<scratch>/seed/months/M.json` before writing.
14. Upload the new share images and the graphics' `-720.webp` copies to the review page as assets (copy them into a temporary folder inside the repo first, then delete it), and write everything with ArtifactData `batch` (`set`, at most 50 writes per call): the posts, the month, the covers and the graphics.
15. Email Luis: `node content/blog-tools/blog-email.mjs <scratch>/email.json`. Payload `kind: "drafts"`, the review link, every title with its date, which have a graphic, the site check findings, three to five notable searches with their numbers, the photo file names with their search terms, and anything that failed.

## Publish run (every weekday)

1. `git checkout main`, `git pull`. Stop and email Luis if `git diff --stat` shows uncommitted changes you did not make.
2. Read the review page: ArtifactData `query` on `posts` where `status` is `approved` or `changes`.
3. For each `changes`: revise the article as the note asks, same rules, keep `status: draft`, and update the document with the new title, description and body, `status: "pending"`, `note: ""`, `revisedFor: <the note>`, `revisedAt: <now>` (pin `if_version`). If the title changed, re-run `covers.mjs <key>`. If the revision changed something a graphic shows, update its entry, re-run `graphics.mjs <key>` and upload the new 720px copy.

   3b. BabyLoveGrowth intake: `node content/blog-tools/blg-intake.mjs --list`. If it names anything new, follow "BabyLoveGrowth articles" below, at most two articles a run. If it names nothing, go on.
4. For each `approved` whose date has arrived: run `node content/blog-tools/draft-check.mjs --claims <key>`. If it flags anything, do not publish that article; leave it as it is and put it in the email. Otherwise set `status: published` in the Markdown file (keep `date`).
5. Photos. Take the articles without a `photo:` line in this order: today's article, then live ones, then the next approved drafts by date, and do at most five per run.
   - First `node content/blog-tools/photos.mjs --find <key>`. When it prints a file, Luis saved it: look at it, check it against the art direction, and run `SHARP=… node content/blog-tools/photos.mjs <key> <file> "<alt text>"`.
   - Otherwise `SHARP=… node content/blog-tools/photos-pexels.mjs --find <key> <scratch>/px`, then look at the contact sheet yourself. Choose the candidate that best fits both the article's trade and the art direction below; you may run `--find` again with `--terms "a | b"` of your own when nothing fits. Then `SHARP=… node content/blog-tools/photos-pexels.mjs --use <key> <id> "<alt text>"` and look at the 16:9 crop it made (`images/blog/<key>-photo-1600.webp`). If the crop cuts off what mattered or the photo turns out wrong, undo it (restore the article file, delete the two webp files, the downloaded `<key>.jpg` and its `photo-credits.json` entry) and pick another.
   - If nothing fits after a second search, leave that article without a photo and say so in the email. Never use a photo just to fill the slot.
   - Adding a photo to an article that is already live is allowed in this run. Never replace a photo an article already has: the host caches images for a year.
6. `node content/blog-tools/build.mjs` and `node content/blog-tools/seo-check.mjs`. Stop and email Luis if there are errors.
7. If the build changed any page, commit "Blog: publish <titles>" and push `main`. Wait for the deploy, polling the new URLs until they answer 200, up to five minutes.
8. For every article now live, update its document: `status: "published"`, `publishedAt`, `url`.
9. Email Luis only if something was published, revised or got its photo: `blog-email.mjs` with `kind: "published"`. Otherwise send nothing. (A BabyLoveGrowth article that was added or skipped has its own email, described below.)

Never publish an article that is not `approved` on the review page. Never change any other site content in these runs. If anything fails, do not push; email Luis what happened and stop.

## BabyLoveGrowth articles (since 2026-11-26)

BabyLoveGrowth (BLG) is a service Luis pays for. It writes an article a day for bkrdy.com from its own content plan, and it runs a backlink exchange: its articles link out to other member sites, and theirs link to bkrdy.com. The exchange only counts an article once it is live on bkrdy.com.

**Luis's decision, 2026-11-26: its articles reach the site only through the review page.** The June and July batch went straight to /blog unread, with the wrong name, wrong prices and features BKRDY does not have, and 13 of those 34 were later folded. So a BLG article is a draft like any other, it is edited to the rules below, and it goes live when Luis approves it.

**Never run `content/babylovegrowth-sync.mjs`.** It is the old publisher. It is retired and now refuses to write, and the daily workflow that called it stays off.

**Intake, step 3b of the publish run.** At most two articles a run, oldest first.

1. `node content/blog-tools/blg-intake.mjs --list` names what BLG holds that is not in `content/blog` yet. The key is `BABYLOVEGROWTH_API_KEY` in `.env`; never print it. With no key the script says so and exits 0: put that in the email and go on.
2. Before bringing one in, decide whether it should come in at all. Leave it out with `node content/blog-tools/blg-intake.mjs --skip <id> "<the reason, in a sentence>"` when:
   - an article of ours, live or drafted, already answers the same search (read the `keywords:` lines; two pages competing for one search is why 13 were folded);
   - the topic can only be written with things BKRDY does not do, or with numbers nobody can verify (what an owner earns, what a salon costs to open with no source);
   - a link in it points somewhere that has no place on a beauty business's blog (adult, gambling, a competing booking app, a page that does not open). Say which link in the reason.
   A skipped article never comes back. Luis is told in the email, so he can take the topic out of BLG's plan.
3. `node content/blog-tools/blg-intake.mjs --limit 2` writes the drafts and prints, for each, the links to other sites it carries. The script only tidies: it takes out BLG's title line, pictures, contents list and "Recommended" list, turns links to bkrdy.com into site paths, writes the name BKRDY and replaces dashes. It checks no claim.
4. Edit each draft. Every writing rule below applies, with these differences:
   - **Keep its links to other sites, all of them, exactly as they are.** They are the exchange. Do not remove one, change its address or add another. When a link sits only in BLG's reading list, keep it in a closing `## Further reading` list that holds nothing else.
   - **Keep its slug and key.** BLG looks for the article at that address to count it as live.
   - **Take out what the blog does not print**: "Key takeaways", "Why we built BKRDY", the closing pitch, the reading list's plain-text entries, the disclaimer line. The template adds the call to action.
   - **Check every sentence about BKRDY** against "What BKRDY does and does not do", and every price against `api/config/plans.php`. BLG writes from our marketing pages and from its own guesses: calendar sync, two reminders, confirmation texts, email or text promos and "automated" anything are its usual mistakes. Rewrite the sentence to what is true, or cut it. General advice that names no product can stay general, but do not let "a good booking app does X" stand next to BKRDY when BKRDY does not do X.
   - **No statistics, percentages, studies or quotes** unless the article links the official source. Cut the number or the sentence.
   - **No "we", "our" or "us"**, BKRDY named at most twice and never in a heading.
   - **Add** a `:::answer` block of two or three sentences taken from the article's own answer, a `photoTerms:` line, and a `:::copy` block when the article has something a reader would retype. Check the `pillar:` the script guessed.
   - **Title** 60 characters or fewer, **description** 120 to 155 with no hype. BLG's descriptions usually need rewriting.
   - **Length**: cut toward 900 to 1,300 words. Taking out its pitch sections usually gets most of the way.
   - A list of questions becomes a `## Questions` section, keeping only the ones the page answers in full.
   - **The date** the script gave stands (the next weekday at least two days out with no other BLG article). It sits beside the day's own article. Never a weekend, and never earlier.
   - If, once the false and unsourced parts are out, there is no article left, skip it (step 2) and delete the file.
5. `node content/blog-tools/draft-check.mjs <key>` must show no errors. For a BLG article it also names the sites it links out to and flags any BLG section still in.
6. Share image: `SHARP=… node content/blog-tools/covers.mjs <key>`, and look at it. BLG's pictures are never used; the article gets its photo the way every other one does (step 5).
7. Commit the drafts, their share images and `content/blog-tools/blg-skipped.json` when it changed ("Blog drafts from BabyLoveGrowth: <titles>") and push. Drafts do not build, so no live page changes.
8. Review page: `node content/blog-tools/blog-seed.mjs M <scratch>/seed --keys <keys>`, where M is the batch that already exists on the review page for the article's date (the newest batch when there is none for that month). **Write only the `posts/` documents it made, never the `months/` one**, which would wipe that batch's research. Each post document carries `source: "blg"` and `outside` (the links to other sites), which the review page shows as "From BabyLoveGrowth" and "Links out to". Upload the share image and write `covers/<key>` as in the monthly run.
9. Email Luis whenever a BLG article was added or skipped: `blog-email.mjs` with `kind: "drafts"`, `subject: "BabyLoveGrowth: N to review"`, the review link, each title with its date, and in `findings` one plain sentence per article naming the sites it links out to and what was changed, plus one per skipped article with its reason and "take this topic out of BabyLoveGrowth's plan".

After Luis approves, it publishes on its date like any other article (step 4, including the claims check). Nothing is sent back to BLG: it finds the live page by itself.

## Writing rules

- **Audience.** The owner-operator who already has clients: barbers, lash artists, nail techs, estheticians, brow and wax specialists, hair stylists, small salons and spas, solo pros and small teams across the United States. Since 2026-11-16 (Luis) that includes newer techs in their first year: how-to pieces on building a first clientele, models, portfolios, photos, supply lists and booking times. Not craft-technique tutorials (lash mapping, fades, chemical work), which text does badly and where a wrong step hurts someone; not licensing requirements, which vary by state; and not multi-location chains.
- **Voice.** Write to the reader as "you". BKRDY is named only where it is genuinely the answer, and never more than twice in an article. No "we" marketing voice, no author persona, no hype, no stacked adjectives. Short sentences. Open with the answer rather than a warm-up paragraph.
- **The two rules that make this blog different from every other booking-software blog**: every article names the trade-off honestly, including when BKRDY is not the right answer, and every article contains something the reader can do this week.
- **Shape.** An opening paragraph or two, then a `:::answer` block of two or three sentences that answers the question outright, then `##` sections. End on the point, not on a summary of itself. The template adds the call to action, so never write one.
- **Length.** 900 to 1,300 words. A short article that answers the question beats a long one that circles it.
- **Markdown only**, and only what `md.mjs` supports: `##` and `###`, paragraphs, `- ` and `1. ` lists, `[text](url)`, `**bold**`, `*italic*`, `> ` for a pull quote, a pipe table, `:::answer`, `:::copy Label`, and at most one graphic line. No HTML, no code blocks, no images of your own.
- **`:::copy`** is for anything a reader would otherwise retype: a policy, a reminder message, a rebooking script. Use it when it applies; it is the most useful thing on the page.
- **A `## Questions` section** at the end is optional. When it is there, each `###` under it is a question and the generator emits the FAQ structured data from those exact words, so never write a question the page does not answer in full.
- **Accuracy.** No invented statistics, percentages, studies, quotes, testimonials or customer stories. No numeric claim you cannot verify. Describe a competitor's pricing only in approximate terms, say prices change, and never state a competitor's number as current fact. **The founder's rule: an article only claims what BKRDY really does today.** Check every claim about the product against the app in `C:\Users\carre\bookready` (read only: `CLAUDE.md`, `api/config/plans.php`, the controllers, the editor pages), starting from "What BKRDY does and does not do" below, never from another article, the marketing pages or memory. If you cannot confirm it, leave it out. General advice can stay general, and it is fine to tell the reader to do something by hand. When unsure of a button's name, describe it generically.
- **Google's review rules**, in articles and in graphics: ask every customer, never only the happy ones, never offer an incentive, never write or buy reviews, never gate a review behind a rating question.
- **Prices.** Only BKRDY's real plans, from `api/config/plans.php` in `C:\Users\carre\bookready`. **Lead with the annual rate**, which is the number the rest of the site leads with, and always say "billed annually" beside it: the Free plan $0, Solo $18 a month billed annually ($21 monthly), Studio $29 ($34 monthly, up to six staff), Studio+ $47 ($55 monthly, up to twelve), Salon quoted. A bare annual figure next to a competitor's monthly price is an apples-to-oranges comparison, so in any head-to-head give both. The $0 plan is called **the Free plan**, never "Starter", in anything a reader sees. Seven day trial, card required; the Free plan needs no card. Unlimited texts on every paid plan. Customer payments run through the owner's own Stripe account with no BKRDY markup. If a price in an article would contradict that file, the file wins: check it, do not remember it.
- **Links.** Internal links only to pages that exist (check after a build). Outside links only to official sources, at most two per article, and never to a competitor's pricing page as evidence of a number.
- **No em dashes**, anywhere, in articles or graphics.
- **Stay out of** legal advice, employment classification, tax, and anything about a client's medical or private information beyond "do not share it".

## What BKRDY does and does not do

Checked against the app's code on 2026-11-03. The code wins if this has drifted. When a feature ships, update this list and the `CLAIMS` list in `draft-check.mjs` together.

**Never claim these. They do not exist today.**

- **Google Calendar sync**, one way or both. The editor shows it as coming soon. Personal events never block booking times. What is true: a read-only calendar feed the owner subscribes to from Google Calendar, Apple Calendar or Outlook, so BKRDY appointments show there. Personal time gets blocked in BKRDY by hand. Never call the feed a sync.
- **Email or text campaigns**, list sends, newsletters, promo blasts.
- **Automatic win-back, rebooking reminders, birthday messages, aftercare or follow-up messages.** What is true: Customers has an Inactive list (no visit in 90 days or more) and Text and Email buttons on the client profile that open the owner's own apps. The owner writes to people by hand.
- **Custom domains.** Every site lives at `yourname.bkrdy.me`. Do not sell a domain or promise one.
- **Per-service, per-client or per-tag deposits, or clients who skip the deposit.** The deposit is one studio-wide rule, flat or percent, on every priced service. A percent scales with the price. To spare a regular, the owner books them in by hand from the calendar, where no deposit is asked.
- **Clients booking repeats or groups themselves, or Kito booking them.** What is true since 2026-11-16: the owner books a **repeat** from the calendar's New appointment (every 1 to 8 weeks, 2 to 12 visits; a date that clashes or falls on a closed day is skipped, never forced; each visit gets its reminder; nothing is charged ahead for later visits), or a **group** of 2 to 6 people (same time or one after another, all or nothing). Clients still book one visit at a time on the booking site, and Kito and the iPhone app can't book either yet.
- **More than one automatic reminder, confirm by reply, two-way texting, custom text wording, texts from the studio's number.** One reminder per appointment at the hours the owner sets: email on every plan, text on paid plans to clients who consented. Clients get no confirmation text; the confirmation is an email.
- **Automatic no-show charges or automatic refunds.** A no-show fee goes on a saved card when the owner clicks. A refund is a button. The one automatic charge is a late-cancel fee, when a client with a saved card cancels through their link inside the window (paid plans).
- **Sending clients to Google for reviews, or any Google Business, Instagram, Reserve with Google, Zapier, Mailchimp or QuickBooks connection.** Review requests go by email on paid plans, at most once per client every 90 days. 4 and 5 stars publish on the studio's own site, 1 to 3 stay private. Nothing goes to Google.
- **A POS, card reader or tap to pay.** Payment links, saved cards, Mark paid for cash.
- **Per-artist payouts, commission tracking, payroll, per-artist booking links.** All money lands in one Stripe account.
- **A client import tool.** The BKRDY team moves services, clients and upcoming appointments for free when the owner emails an export. It is a person, not a button.
- **A mobile app in the stores, AI features other than Kito, memberships, prepaid series, classes, multi-location, inventory, e-signatures, standalone intake forms, traffic or conversion analytics, a marketplace.** Kito is on for every studio since 2026-11-05: he works for the owner in the editor (25 messages a month on Free, 100 on paid), proposes changes the owner confirms, and never talks to clients.
- **Results.** Never say BKRDY cuts no-shows by a number, fills a book or brings new clients.

**Plan limits.** The Free plan has no texts, waitlist, automatic review requests, card on file, gift cards, coupons, packages, Content studio, after-hours or squeeze-in slots, loyalty, client tags, announcement bar or FAQ section. It has four templates and six gallery photos. Say "on paid plans" when a feature needs one.

## Photo art direction

Beauty professionals at work with their clients: barbers, lash artists, nail techs, estheticians, hair stylists, brow and wax specialists. Real, warm, natural light, a genuine mix of Black, Latina, Asian and white professionals and clients, a mix of ages and body types, salons that look like real workplaces rather than showrooms.

Never: floating stars, sparkles, holograms or glowing interfaces; fake phone or app screens; illustrations, vectors or anything that looks generated; visible brand logos; anything marked editorial use only; stock-smile group shots around a laptop; anyone who could pass for under eighteen doing or receiving the work; anything that suggests the person endorses BKRDY. Pexels photos come without model releases, so they illustrate and never speak for anyone. Prefer photos without face masks, which date a photo to 2020 and 2021; a hands-only close-up is often the best choice.

Three search terms per article, written the way you would type them into a stock photo search. Vary them across the batch so the blog does not end up with twenty versions of the same photo.
