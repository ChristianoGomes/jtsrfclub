#!/usr/bin/env python3
"""Rebuild the site-wide search index (assets/search-index.json).

    python3 site-club/tests/make_search_index.py

Run it after adding or renaming a page, or after big copy changes.
Each entry: url, title, kind, description and a short block of text from the page.
"""
import html
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
SKIP = {"404.html"}


def kind_of(name, text):
    if name.startswith("board-") and "tutorial" not in name:
        return "Board"
    if "tutorial-doc" in text:
        return "Guide"
    return "Page"


def clean(fragment):
    fragment = re.sub(r"<(script|style|iframe)[^>]*>.*?</\1>", " ", fragment, flags=re.S | re.I)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def main():
    entries = []
    for path in sorted(SITE.glob("*.html")):
        if path.name in SKIP:
            continue
        raw = path.read_text(encoding="utf-8")
        body = raw[raw.find("</header>"):raw.find('<footer class="footer"')] or raw
        title = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S)
        title = clean(title.group(1)) if title else clean(re.search(r"<title>(.*?)</title>", raw, re.S).group(1)).split(" — ")[0]
        desc = re.search(r'<meta name="description" content="([^"]*)"', raw)
        headings = " ".join(clean(h) for h in re.findall(r"<h[23][^>]*>(.*?)</h[23]>", body, re.S))
        text = clean(body)
        entries.append({
            "u": path.name,
            "t": title,
            "k": kind_of(path.name, raw),
            "d": html.unescape(desc.group(1)) if desc else "",
            "x": (headings + " " + text)[:2600],
        })
    out = SITE / "assets" / "search-index.json"
    out.write_text(json.dumps(entries, separators=(",", ":")), encoding="utf-8")
    kb = out.stat().st_size / 1024
    print("search-index.json: %d pages, %.0f KB" % (len(entries), kb))


if __name__ == "__main__":
    main()
