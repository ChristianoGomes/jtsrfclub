# JTSRF CLUB — website

Static marketing site for JTSRF CLUB jetsurf lessons, plus a maintenance-tutorial
section that's ready to fill in later.

## Files

| Path | What it is |
|------|------------|
| `index.html` | Homepage — hero, lessons/pricing, why, how it works, boards, gallery, reviews, FAQ, booking CTA |
| `maintenance.html` | Maintenance tutorials — library grid of "coming soon" cards + a full tutorial layout template |
| `assets/css/style.css` | All styles (one file, CSS variables at the top) |
| `assets/js/main.js` | Mobile nav toggle, FAQ accordion, footer year |
| `assets/img/` | Images pulled from `brand assets/` |

## Run it

It's plain static HTML — open `index.html` in a browser, or serve the folder:

```
cd site && python3 -m http.server 8000
```

## Placeholders to replace before launch

- **Prices** in `index.html` (Intro $149 / Coaching $249 / Open $99) — set your real rates
- **Booking buttons** — currently `mailto:` / `sms:` links; wire to Calendly / FareHarbor / Peek
- **Reviews** — three placeholder quotes; swap in real ones
- **Gallery** — add your own session photos (grid already supports a wall of them)
- **Contact** — `hello@jtsrfclub.com`, Instagram link, phone number, exact marina/location
- **Maintenance tutorials** — card titles are an outline; each becomes a full page using the
  template block at the bottom of `maintenance.html`
- **Fonts** load from Google Fonts (Archivo Black + Inter); self-host if you want zero external calls
