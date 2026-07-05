# GEO / SEO audit remediation, July 2026

**Source:** babylovegrowth GEO audit of bkrdy.com, run 2026-07-01.
**Score at audit:** 86/100. robots.txt, sitemap, llm.txt all passing.
**Issues found:** 28, all LOW or MEDIUM (no structural or content problems).
**Remediated:** 2026-07-05.

## What the audit flagged and what was done

### Meta titles (14 pages, target 45-60 chars)
Every flagged page had a title UNDER 45 chars (over-suffixed with `| BKRDY`
on top of an already-short phrase). Rewrote each to a keyword-rich 45-60
char title. Only the `<title>` tag was changed; `og:title` / `twitter:title`
are left as their deliberately short brand-led variants (e.g. "BKRDY
templates") since social cards read better short and those tags are not
what the audit measures.

| Page | New title | Len |
|---|---|---|
| /templates | Booking website templates for beauty pros \| BKRDY | 49 |
| /pricing | Simple flat-rate pricing for every plan \| BKRDY | 47 |
| /community | Join the BKRDY community on our Discord \| BKRDY | 47 |
| /contact | Contact us, real human replies within a day \| BKRDY | 51 |
| /roadmap | Product roadmap: features and plans coming next \| BKRDY | 55 |
| /about | About BKRDY, booking sites by DaysGraphic LLC \| BKRDY | 53 |
| /for-lash-artists | Booking websites for lash artists and studios \| BKRDY | 53 |
| /features | Every feature for clients, growth, and daily ops \| BKRDY | 56 |
| /platform | One platform: booking, payments, and your site \| BKRDY | 54 |
| /for-barbers | Booking websites for barbers and barbershops \| BKRDY | 52 |
| /for-nail-techs | Booking websites for nail techs and studios \| BKRDY | 51 |
| /for-spas | Designed booking websites for spas and wellness \| BKRDY | 55 |
| /for-salons | Booking websites for hair salons and teams \| BKRDY | 50 |
| /welcome | Welcome, you are one of the first here \| BKRDY | 46 |

### Meta descriptions (target 150-160 chars)
Audit flagged 7 pages. Two of them (pricing, for-nail-techs) were already
at 157 chars by the time of the fix, since the content bot had edited them
after the 2026-07-01 audit ran. The 5 genuinely out-of-range were fixed:

- **index** 242 -> 160 (was too long)
- **templates** 175 -> 153 (was too long)
- **contact** 93 -> 151 (was too short)
- **features** 94 -> 155 (was too short)
- **platform** 108 -> 159 (was too short)

Went beyond the flagged set and also tightened 7 descriptions on pages the
audit had flagged for TITLE only but whose descriptions were short (114-143),
so the whole site sits in the 150-160 band and the next audit stays clean:
community (154), roadmap (152), about (150), for-lash-artists (160),
for-barbers (156), for-spas (156), welcome (159). Description changes apply
to `<meta name="description">`, `og:description`, `twitter:description`, and
the JSON-LD `description` where present (all kept in sync).

### Image alt text (3 images, homepage)
The three "how it works" step illustrations had `alt=""`. Added descriptive
alt text:
- pick-a-template.webp: "Choosing a booking website template in the BKRDY editor"
- add-your-services.webp: "Adding services, hours, and staff in the BKRDY editor"
- share-your-link.webp: "Sharing your BKRDY booking link so clients can book and pay a deposit"

### Oversized images (4 images, >100KB)
Persona photos recompressed with sharp, resized 1600px -> 1200px width
(still ample for display), all now well under 100KB:
- solo-pros.webp: 243KB -> 91KB
- solo-pros-2.webp: 160KB -> 85KB
- salons.webp: 205KB -> 83KB
- salons-2.webp: 199KB -> 81KB

## Note for the next audit
The content bot in this repo regenerates metadata periodically. If titles
revert to short forms or descriptions drift, re-run the length pass: titles
45-60, descriptions 150-160, measured on RENDERED length (HTML entities like
`&amp;` count as one character). The homepage `<title>` was already in range
and was left unchanged.
