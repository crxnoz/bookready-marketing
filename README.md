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

- `index.html` — all page content
- `styles.css` — visual language (cream + sage palette, DM Serif Text
  + Cookie + Roboto), matches the Marquee template collection
- Add images to an `assets/` folder if needed; link with relative paths

## Brand language

Same fonts + palette as the Marquee templates in the main BookReady
app, so the marketing site visually continues into the product:

| Token  | Value      |
|--------|------------|
| bg     | `#F6F3EE`  |
| text   | `#0E1111`  |
| muted  | `#6B7280`  |
| accent | `#7FAF9A`  |

Fonts (loaded from Google Fonts): DM Serif Text, Cookie, Molle (used
sparingly), Roboto, DM Mono.

## Deploy

Pushes to `main` auto-deploy via Hostinger. No CI / no GitHub Actions
needed — Hostinger pulls on its end.

## License

Private. © BookReady.
