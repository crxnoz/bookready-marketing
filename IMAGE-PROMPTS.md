# BKRDY Marketing — Image Prompts & Capture Guide

Working doc for filling the ~59 pages that currently recycle the two template covers (`velvettheory-cover.jpg` + `thefaderoom-cover.jpg`) instead of showing anything topical. Source of the list: the image audit (2026-06-27).

---

## The one golden rule

**Screenshot real product UI — never generate it.** AI-generated "dashboards / calendars / booking screens" look fake and quietly destroy trust on the exact pages (features, platform, compare) where you're trying to win it. Use ChatGPT image gen **only** for lifestyle photography, brand moments, and abstract/conceptual heroes — things that have no real UI.

| Symbol | Means | Use for |
|---|---|---|
| 📸 | **Screenshot the live app** | features/*, platform/*, anything showing the product |
| 🎨 | **Generate in ChatGPT** | personas, about, 404, abstract heroes, phone/notification mockups |

---

## Setup

### Where to screenshot from
- **Owner/editor screens** → log into a polished demo tenant at `app.bkrdy.me` (use **lushstudio** — it has the richest seeded data + the Bookings 3.0 test fixture).
- **Public booking screens** → a finished demo site, e.g. `velvettheory.bkrdy.me` or `lushstudio.bkrdy.me`.
- **Phone-framed shots** → `app.bkrdy.me/record` frames any template in a phone rig.
- Capture at a **1440px** browser width, retina/2×, then crop. Hide your own cursor and any dev banners.

### ChatGPT style preambles (paste one before every prompt to keep everything cohesive)

**[BKRDY PHOTO STYLE]** — for lifestyle:
> Premium editorial photography for BKRDY, a booking + website platform for beauty and service businesses. Warm natural window light, cream / ivory / blush palette with soft muted tones, minimal modern interior, shallow depth of field (35mm, f/2.0). Authentic candid moment, diverse real people, relaxed and aspirational. No text, no logos, no on-screen UI, no watermark. 16:9, photorealistic, high resolution.

**[BKRDY CONCEPT STYLE]** — for abstract/hero:
> Minimal premium conceptual illustration for BKRDY (software for beauty businesses). Soft cream background, accents in blush pink and muted lavender, clean geometric shapes, soft-3D, generous negative space. Calm, modern, expensive-looking. No text, no logos, no UI. 16:9.

### File + size conventions
- Heroes: **1600×900** (16:9). Export **WebP** for everything except social/OG which stays **JPG**.
- Save under a section folder: `images/features/…`, `images/platform/…`, `images/compare/…`, `images/personas/…`, `images/pages/…`.
- After generating, AI faces/hands can be uncanny (especially nails/lashes) — regenerate or swap for stock if it looks off.

---

## A. Persona pages (7) — 🎨 lifestyle

Each is a niche landing page. Generate a warm, real-world scene of that trade. Prepend **[BKRDY PHOTO STYLE]**.

| Page | Prompt (after the style preamble) | Save as |
|---|---|---|
| `for-barbers` | A modern barbershop mid-appointment: a barber in a clean apron giving a precise fade to a seated client, matte-black fixtures and warm wood, a plant or two, calm premium atmosphere, focus on craft and hands. | `images/personas/barbers.webp` |
| `for-nail-techs` | A nail artist at a tidy modern station painting a client's nails, close warm framing on the hands, pastel and cream tones, soft daylight, minimal aesthetic, focus on detail and care. | `images/personas/nail-techs.webp` |
| `for-lash-artists` | A lash technician applying a lash set to a relaxed client lying back, soft diffused light, clean blush-and-cream studio, sense of precision and calm. | `images/personas/lash-artists.webp` |
| `for-estheticians` | An esthetician performing a facial in a serene treatment room, warm towels and soft light, cream and sage tones, wellness and quiet luxury. | `images/personas/estheticians.webp` |
| `for-salons` | A bright modern hair salon, a stylist mid-blowout, several chairs, large windows with soft light, cream and warm-wood palette, lively but premium. | `images/personas/salons.webp` |
| `for-solo-pros` | A solo beauty professional in a small, beautifully styled private/home studio welcoming one client, intimate and personal, cream and blush decor. | `images/personas/solo-pros.webp` |
| `for-spas` | A tranquil spa relaxation lounge, soft natural light, neutral cream and stone tones, candles and greenery, serene and luxurious. | `images/personas/spas.webp` |

---

## B. Features pages (16) — 📸 screenshots

These describe real product features. Capture the actual screen (logged into the **lushstudio** demo). URLs are best-guess — grab whatever screen best shows the feature.

| Page | Capture | Save as |
|---|---|---|
| `features/index` | Owner dashboard (`/editor`) or a 2–3 screen montage | `images/features/overview.webp` |
| `features/manage/dashboard` | Owner dashboard `/editor` | `images/features/manage-dashboard.webp` |
| `features/manage/customers` | Customers list `/editor/customers` | `images/features/manage-customers.webp` |
| `features/manage/staff` | Staff management screen | `images/features/manage-staff.webp` |
| `features/manage/hours` | Availability → Advanced/weekly hours `/editor/availability?tab=advanced` | `images/features/manage-hours.webp` |
| `features/manage/reschedule` | Appointment drawer reschedule (Bookings 3.0) `/editor/bookings` | `images/features/manage-reschedule.webp` |
| `features/growth/analytics` | Owner analytics screen | `images/features/growth-analytics.webp` |
| `features/growth/email` | Notification/email templates `/editor/settings?tab=notifications` | `images/features/growth-email.webp` |
| `features/growth/reviews` | Reviews moderation `/editor/customers?tab=reviews` | `images/features/growth-reviews.webp` |
| `features/growth/winback` | Coupons / marketing screen | `images/features/growth-winback.webp` |
| `features/client/booking` | Public booking flow on `velvettheory.bkrdy.me` (service + time picker) | `images/features/client-booking.webp` |
| `features/client/dashboard` | The token manage page `/site/{slug}/manage/{token}` | `images/features/client-dashboard.webp` |
| `features/client/payments` | The deposit/checkout step in public booking | `images/features/client-payments.webp` |
| `features/client/reschedule` | The reschedule UI in the public manage flow | `images/features/client-reschedule.webp` |

**Two that are 🎨 instead** (no clean UI to shoot):

- `features/client/reminders` — 🎨 **[BKRDY PHOTO STYLE]** *A hand holding a smartphone showing a simple appointment reminder notification on the lock screen (blurred, no readable brand UI), cozy salon background, warm tones.* → `images/features/client-reminders.webp`
- `features/growth/sms` — 🎨 **[BKRDY CONCEPT STYLE]** *A clean smartphone messages screen mockup with one tasteful SMS bubble that reads "your appointment with Lush Studio is coming up", soft cream background, blush accent.* (SMS isn't live yet, so a mockup beats a screenshot.) → `images/features/growth-sms.webp`

---

## C. Platform pages (17) — mostly 📸

### platform/booking/* (7)

| Page | Capture | Save as |
|---|---|---|
| `platform/booking/online` | Public booking flow (`velvettheory.bkrdy.me`) | `images/platform/booking-online.webp` |
| `platform/booking/calendar` | Smart Calendar `/editor/availability?tab=calendar` | `images/platform/booking-calendar.webp` |
| `platform/booking/waitlist` | Waitlist `/editor/availability?tab=waitlist` | `images/platform/booking-waitlist.webp` |
| `platform/booking/booking-forms` | The intake/booking form a client fills out | `images/platform/booking-forms.webp` |
| `platform/booking/after-hours` | After-Hours `/editor/availability?tab=after-hours` | `images/platform/booking-after-hours.webp` |
| `platform/booking/recurring` | Recurring appointment setup (if shipped; else 🎨 concept) | `images/platform/booking-recurring.webp` |
| `platform/booking/sync` | Google Calendar integration `/editor/integrations` | `images/platform/booking-sync.webp` |

### platform/tools/* (7)

| Page | Capture | Save as |
|---|---|---|
| `platform/tools/analytics` | Analytics screen | `images/platform/tools-analytics.webp` |
| `platform/tools/coupons` | Coupons screen | `images/platform/tools-coupons.webp` |
| `platform/tools/customers` | `/editor/customers` | `images/platform/tools-customers.webp` |
| `platform/tools/marketing` | Content/marketing screen `/editor/content` | `images/platform/tools-marketing.webp` |
| `platform/tools/notifications` | `/editor/settings?tab=notifications` | `images/platform/tools-notifications.webp` |
| `platform/tools/payments` | Payments hub `/editor/payments` | `images/platform/tools-payments.webp` |
| `platform/tools/reviews` | Reviews `/editor/customers?tab=reviews` | `images/platform/tools-reviews.webp` |

### platform — root + thin website pages (3)

| Page | Source | Capture / prompt | Save as |
|---|---|---|---|
| `platform/index` | 📸 | Dashboard montage (or reuse `features/overview`) | `images/platform/overview.webp` |
| `platform/website/introduction` | 📸 | The "Introduction" promo band on a live demo site (`lushstudio.bkrdy.me`) | `images/platform/website-introduction.webp` |
| `platform/website/policies` | 📸 | The Policies section on a demo site, or the Policies editor | `images/platform/website-policies.webp` |

---

## D. Compare pages (7) — 📸 proof + 🎨 hero

Don't put competitor logos in images (trademark). Lead with a **screenshot of BKRDY's own polished UI** as the "look how clean ours is" proof; competitor names stay in the headline/table text.

- **Shared hero option** (🎨, reuse on any): **[BKRDY CONCEPT STYLE]** *Two minimal abstract panels side by side — the left cluttered and gray, the right calm, cream, and organized with a single blush highlight — suggesting an upgrade/switch. No text.* → `images/compare/switch.webp`
- **Per-page proof** (📸): one BKRDY screen that matches the competitor's weak spot.

| Page | Suggested 📸 proof shot | Save as |
|---|---|---|
| `compare/acuity-alternative` | Public booking site (shows BKRDY gives a real website, Acuity doesn't) | `images/compare/acuity.webp` |
| `compare/booksy-alternative` | Owner dashboard / no-marketplace branding | `images/compare/booksy.webp` |
| `compare/fresha-alternative` | Payments hub (transparent fees) | `images/compare/fresha.webp` |
| `compare/glossgenius-alternative` | Template showcase / website editor | `images/compare/glossgenius.webp` |
| `compare/square-appointments-alternative` | Public booking site on a phone | `images/compare/square.webp` |
| `compare/styleseat-alternative` | Owner dashboard | `images/compare/styleseat.webp` |
| `compare/vagaro-alternative` | Clean calendar / availability | `images/compare/vagaro.webp` |

---

## E. Top-level pages (12) — mix

| Page | Source | Prompt / capture | Save as |
|---|---|---|---|
| `about` | 🎨 | **[BKRDY PHOTO STYLE]** *A warm small creative workspace: a laptop (screen soft/blurred, no readable UI), coffee, plants, notebook, cream desk by a window — the story of a small independent maker.* | `images/pages/about.webp` |
| `how-it-works` | 📸 | Three step shots: pick a template, add services, share your link (you already have `images/steps/*.webp` — refresh if dated) | `images/steps/*.webp` |
| `migration` | 🎨 | **[BKRDY CONCEPT STYLE]** *A clean "import your clients" concept — a soft arrow moving a small stack of contact cards into an organized cream panel, blush accent.* | `images/pages/migration.webp` |
| `pricing` | — | Image optional; a subtle **[BKRDY CONCEPT STYLE]** texture works, or leave text-only | `images/pages/pricing.webp` |
| `welcome` | 🎨 | **[BKRDY CONCEPT STYLE]** *Soft celebratory scene — gentle confetti / sparkles in blush and lavender on cream, warm and welcoming.* | `images/pages/welcome.webp` |
| `404` | 🎨 | **[BKRDY CONCEPT STYLE]** *A friendly empty salon chair under a soft spotlight on cream, calm and slightly playful (the "nothing booked here" idea). No text.* | `images/pages/404.webp` |
| `roadmap` | 🎨 | **[BKRDY CONCEPT STYLE]** *A soft horizon / path made of minimal abstract shapes receding into cream, suggesting what's ahead.* | `images/pages/roadmap.webp` |
| `community` | 🎨 | **[BKRDY PHOTO STYLE]** *A warm candid of a few beauty pros chatting/laughing together in a bright studio, community and belonging.* | `images/pages/community.webp` |
| `newsletter` | 🎨 | **[BKRDY PHOTO STYLE]** *A cozy flat-lay: phone, coffee, a few beauty tools on a cream surface in soft light (the "read on your break" feeling).* | `images/pages/newsletter.webp` |
| `tutorials` | 📸 | Editor screenshots or a play-button thumbnail over a real screen | `images/pages/tutorials.webp` |
| `contact` | — | Optional; a soft **[BKRDY CONCEPT STYLE]** abstract or leave text-only | `images/pages/contact.webp` |
| `changelog` | — | Optional; usually fine text-only | — |

---

## Quick-fix side items (from the audit, not image-gen)

- **Boilerplate alt text** on compare/features pages: the recycled cover is labeled "Velvet Theory template" / "GlossGenius alternative comparison" etc. When you swap images, write real alt text describing the new shot.
- **`og-image.jpg` is doubling as the hero** on feature pages (`alt=""`) — replace with the new screenshot.
- **BLG blog posts hotlink heroes from BabyLoveGrowth's Supabase** — consider self-hosting those into `images/blog/` so they can't break.

---

## After you generate / capture

Drop each file at its listed path, then the `<img>` needs wiring into the page (src + real alt) and the `og:image` updated to match. Ping me to do that wiring pass once a batch of images is ready — I can update the pages in bulk.
