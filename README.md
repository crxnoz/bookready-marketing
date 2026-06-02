# BookReady Marketing

Public marketing + pricing site for BookReady.

Deployed at the BookReady root domain via Hostinger's Git auto-pull
(`hPanel → Advanced → Git`). Every push to `main` triggers a pull
into `public_html/`.

## Stack

Plain static HTML + CSS. No build step, no JS framework, no
dependencies. Just open `index.html`.

Why: Hostinger shared hosting can't run Node; this repo is meant to
deploy literally as-is via Git auto-pull. If you want to move to
Astro / Next.js / etc. later, swap out the deploy target to Vercel
or Netlify and update the DNS.

## Local preview

```bash
# Any static server works. Examples:
npx serve .
# or
python3 -m http.server 8000
# or just double-click index.html
```

## Editing

Pages are plain static HTML. Each route is a folder with its own
`index.html` so the extensionless nav links resolve on Hostinger
(`/pricing` → `/pricing/index.html`).

- `index.html` — homepage
- `pricing/`, `templates/`, `templates/<name>/`, `migration/` — sub-pages
- `styles.css` — the shared visual language (loaded on every page)
- `pages.css` — extra components used only by the sub-pages
  (breadcrumb, page header, template-detail hero, palette swatches,
  spec grid, comparison table). Keeps the homepage CSS untouched.
- Shared scripts (loaded with `<script src>`, no build step):
  - `nav.js` — sticky nav + mega-panel + mobile drawer (every page)
  - `pricing.js` — pricing toggles + SMS calculator (home + `/pricing`)
  - `vt-demo.js` — Velvet Theory booking demo (home + that template page)
- The nav + footer markup is duplicated inline on each page (no
  includes without a build step) — keep them in sync across files.
- Add images to an `assets/` folder if needed; link with relative paths.

## Brand language

Sharp, modern, editorial: cream + soft-pink accent, hairline grid
borders, 0px radius everywhere.

| Token  | Value      |
|--------|------------|
| bg     | `#F8F6F2`  |
| card   | `#FFFFFF`  |
| text   | `#121212`  |
| muted  | `#6B7280`  |
| accent | `#E8C7DA`  |

Fonts (loaded from Google Fonts): **Fraunces** (serif display / italic
punchlines) and **Inter** 400–800 (everything else).

## Deploy

Pushes to `main` auto-deploy via Hostinger. No CI / no GitHub Actions
needed — Hostinger pulls on its end.

## License

Private. © BookReady.
