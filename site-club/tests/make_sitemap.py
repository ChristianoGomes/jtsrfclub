#!/usr/bin/env python3
"""Rebuild sitemap.xml and robots.txt for the JTSRF CLUB site.

    python3 site-club/tests/make_sitemap.py

Run it after adding, renaming or removing a page. Every *.html page in site-club/
is listed, with <lastmod> taken from the file's modification date.
"""
import datetime
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
BASE = "https://jtsrfclub.com/"


def url_for(name):
    return BASE if name == "index.html" else BASE + name


def main():
    pages = sorted(SITE.glob("*.html"), key=lambda p: (p.name != "index.html", p.name))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for page in pages:
        lastmod = datetime.date.fromtimestamp(page.stat().st_mtime).isoformat()
        lines.append("  <url><loc>%s</loc><lastmod>%s</lastmod></url>" % (url_for(page.name), lastmod))
    lines.append("</urlset>")
    (SITE / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")

    (SITE / "robots.txt").write_text(
        "User-agent: *\n"
        "Disallow: /tests/\n"
        "\n"
        "Sitemap: %ssitemap.xml\n" % BASE,
        encoding="utf-8")
    print("sitemap.xml: %d pages · robots.txt written" % len(pages))


if __name__ == "__main__":
    main()
