# JTSRF CLUB

**The website for JTSRF CLUB — jetsurf riders and board maintenance out of Miami.**

*Ride / Maintain / Master.*

JTSRF CLUB is a home for people who ride motorized surfboards and want to keep them running. The site brings together step-by-step maintenance guides for every JETSURF board, the current board lineup, a path into racing, and a rider-built map of where to launch.

Live at [jtsrfclub.com](https://jtsrfclub.com) *(launching soon)*.

---

## What's on the site

- **Maintenance library — 71 guides.** Every guide leads with a video walkthrough and follows it with written, timestamped steps: cleaning and storage, spark plugs, fuel and electrics, all the way to a full engine rebuild. Videos come from JETSURF Official, JETSURF USA and Jetboard Australia, plus guides written by the club.
- **Searchable guide index.** On every guide, a sidebar lists all the others by category with instant search, and next / previous arrows move through the library.
- **Boards.** The 2026 JETSURF lineup — gas DFI and electric, surf and Ski — with a page per board, specs, a comparison table, and owner's manuals.
- **Racing.** How to get from the club to a MotoSurf World Cup start line: the series, the race boards, the safety kit, and the race-day toolbox.
- **Spots.** Launch points around South Florida with conditions, parking and local rules, and a form for riders to submit their own.
- **Club guides.** Mixing fuel at 50:1 (with a calculator), charging older boards with the DFI charger, titling and registering a board, shipping one, mapping an ICU, choosing a board, and your first pop-up.

## What's in this repository

```
site-club/          the live website — plain HTML, CSS and JavaScript, no build step
├── index.html      homepage
├── maintenance.html  guide library + owner's manuals
├── boards.html, board-*.html   lineup and one page per board
├── racing.html, spots.html
├── *-tutorial.html + club guides   one page per guide
├── assets/         css, js, images, manuals, catalogs
├── sitemap.xml, robots.txt
├── tests/          site check + sitemap builder (not part of the published site)
└── README.md       working notes for the site

site/               the lessons version of the site, frozen until lessons return
jtsrfclub-docs/     internal docs — SOURCES.md lists every video, document and photo source
brand assets/       logo and brand source files
plugins/            the scroll-craft design skill the site was started with (see Credits)
```

## Run it locally

No install needed — it's static files.

```bash
cd site-club
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Serve it rather than double-clicking the HTML files: the guide index and arrows load their list from the library page, which browsers block when a page is opened straight from disk.

## Check it before you commit

```bash
python3 site-club/tests/check_site.py           # full check, about a minute
python3 site-club/tests/check_site.py --fast    # skip external links and YouTube
```

It loads every page in a headless browser at desktop and phone width and reports JavaScript errors, missing images, pages that scroll sideways on a phone, broken internal links and anchors, dead external links, YouTube videos that were removed or can't be embedded, and missing titles, descriptions, headings or alt text. It exits with an error if anything is broken.

Needs Playwright once: `pip install playwright && python3 -m playwright install chromium`

## Adding a guide

1. Copy an existing guide page as the starting point — a `*-tutorial.html` page for a video guide, or `mixing-fuel.html` for a club guide.
2. Put its images in `site-club/assets/img/guides/<guide-name>/`.
3. Add a card for it on `maintenance.html`, in the right source section. **The card is what puts the guide in the sidebar index and the next / previous arrows.**
4. Rebuild the sitemap: `python3 site-club/tests/make_sitemap.py`
5. Run the site check, then commit.

Adding a board works the same way: a `board-<name>.html` page plus a card on `boards.html`.

## Deploying

The site is the `site-club/` folder, published as-is. On a static host such as Netlify, set the **publish directory** to `site-club` with no build command. Leave `tests/` and `README.md` out of the published files.

The domain stays registered at Squarespace; point its website DNS records at the host and leave the Google Workspace email records (MX and TXT) untouched.

## Contact

- Email: [info@jtsrfclub.com](mailto:info@jtsrfclub.com)
- WhatsApp: [305-896-5931](https://wa.me/13058965931)
- Instagram: [@christiano_gomes](https://instagram.com/christiano_gomes) · [YouTube](https://www.youtube.com/@christianogomes1991) · [Facebook](https://www.facebook.com/profile.php?id=61557988845895)

## Credits

- **Videos** belong to their channels — [JETSURF Official](https://www.youtube.com/@jetsurf_official), [JETSURF USA](https://www.youtube.com/@jetsurfusa1082) and [Jetboard Australia](https://www.youtube.com/@JetboardAustralia) — and are embedded from YouTube.
- **Owner's manuals, catalogs and board specs** are JETSURF's. Product details come from [jetsurf.com](https://jetsurf.com) and [jetsurfusa.com](https://jetsurfusa.com).
- The full list of sources, documents and photo origins is in [jtsrfclub-docs/SOURCES.md](jtsrfclub-docs/SOURCES.md).
- JTSRF CLUB is an independent rider community, not official JETSURF documentation.
- This repository started from [scroll-craft](https://github.com/nateherkai/scroll-craft) by Nate Herk, MIT-licensed; its licence is kept in [LICENSE](LICENSE) and the skill remains in `plugins/`.

## Licence

The original scroll-craft code is MIT-licensed — see [LICENSE](LICENSE). JTSRF CLUB's own guide text, branding and photos are © JTSRF CLUB, all rights reserved; third-party videos, manuals and product images belong to their owners.
