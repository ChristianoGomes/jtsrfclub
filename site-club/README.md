# JTSRF CLUB — website (no-lessons version)

Working copy of the JTSRF CLUB site with the lessons/pricing content removed, so
it can go live while lessons aren't being offered. The frozen lessons version
lives in `site/` at the repo root — come back to it when lessons return.

## Files

| Path | What it is |
|------|------------|
| `index.html` | Homepage — hero, maintenance library, boards, gallery |
| `maintenance.html` | Maintenance tutorial library — grid of guide cards + full tutorial template |
| `*-tutorial.html` | Individual maintenance guides (video walkthrough + written steps) |
| `assets/css/style.css` | All styles (one file, CSS variables at the top) |
| `assets/js/main.js` | Mobile nav toggle, FAQ accordion, footer year |
| `assets/img/` | Images pulled from `brand assets/` |

## Run it

Plain static HTML — open `index.html` in a browser, or serve the folder:

```
cd site-club && python3 -m http.server 8000
```

## Test it

Run before committing (about a minute):

```
python3 site-club/tests/check_site.py          # full check
python3 site-club/tests/check_site.py --fast   # skip external links / YouTube
```

It loads every page in a headless browser at desktop and phone width (JavaScript
errors, missing files, sideways scroll, guide/board index + arrows, library search,
fuel calculator), checks every internal link, image and #anchor, pings external
links and YouTube embeds, and flags missing titles/descriptions/alt text. Exits
non-zero on any failure. Amazon, Instagram, Facebook, WhatsApp and Ko-fi block
automated checks — click those by hand now and then.

After adding, renaming or removing a page, rebuild the sitemap: `python3 site-club/tests/make_sitemap.py`

Needs Playwright once: `pip install playwright && python3 -m playwright install chromium`

## Placeholders to replace before launch

- **Contact** — `info@jtsrfclub.com`, Instagram link
- **Gallery** — add your own session photos (grid already supports a wall of them)
- **Maintenance tutorials** — many cards are still "coming soon"; fill in using the
  template block at the bottom of `maintenance.html`
- **Notify buttons** — `mailto:` links; wire to an email list (Mailchimp, ConvertKit, Beehiiv)
- **Fonts** load from Google Fonts (Archivo Black + Inter); self-host if you want zero external calls

## Bringing lessons back later

The lessons homepage, pricing cards, testimonials, FAQ and booking CTA are all
preserved in `site/index.html` and `site/maintenance.html` at the repo root. Copy
those sections back in when you're ready.
