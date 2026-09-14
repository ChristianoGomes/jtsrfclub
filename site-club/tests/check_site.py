#!/usr/bin/env python3
"""JTSRF CLUB site check — run before committing.

    python3 site-club/tests/check_site.py            # everything
    python3 site-club/tests/check_site.py --fast     # skip external links (~1 min)

What it checks
  1. Browser (every page, desktop 1280px + phone 390px, headless Chromium):
     JavaScript errors, missing local files, sideways scroll on phones,
     guide/board index + next/previous arrows, library search, fuel calculator.
  2. Links (read straight from the HTML):
     internal links/images/#anchors exist, external links answer,
     YouTube embeds are still up and embeddable.
  3. Page basics: <title>, meta description, one <h1>, image alt text,
     duplicate ids, canonical URL matches the file name, page is in sitemap.xml.

Exit code is 1 if anything in FAILURES was found, 0 otherwise.
Needs: pip install playwright && python3 -m playwright install chromium
"""
import argparse
import concurrent.futures
import functools
import http.server
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

# Hosts that block automated checks — listed as "check by hand" instead of failing.
UNCHECKABLE_HOSTS = ("amazon.com", "www.amazon.com", "instagram.com", "www.instagram.com",
                     "facebook.com", "www.facebook.com", "wa.me", "ko-fi.com")

failures = []   # break the site for a visitor
warnings = []   # worth fixing, not broken


def fail(page, msg):
    failures.append((page, msg))


def warn(page, msg):
    warnings.append((page, msg))


# --------------------------------------------------------------------------- HTML parsing
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []          # (tag, attr, value)
        self.ids = []
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.description = None
        self.canonical = None
        self.imgs_no_alt = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta" and a.get("name") == "description":
            self.description = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "img" and "alt" not in a:
            self.imgs_no_alt.append(a.get("src", "?"))
        for attr in ("href", "src"):
            if a.get(attr) and tag in ("a", "img", "iframe", "link", "script", "source"):
                self.links.append((tag, attr, a[attr]))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def parse_pages():
    pages = {}
    for f in sorted(SITE.glob("*.html")):
        p = PageParser()
        p.feed(f.read_text(encoding="utf-8"))
        pages[f.name] = p
    return pages


# --------------------------------------------------------------------------- static checks
def check_basics(pages):
    for name, p in pages.items():
        if not p.title.strip():
            fail(name, "missing <title>")
        if not p.description:
            warn(name, "missing meta description")
        if p.h1 != 1:
            warn(name, "has %d <h1> tags (should be 1)" % p.h1)
        dupes = sorted({i for i in p.ids if p.ids.count(i) > 1})
        if dupes:
            warn(name, "duplicate ids: " + ", ".join(dupes))
        for src in p.imgs_no_alt:
            warn(name, "image without alt text: " + src)
        if p.canonical and not p.canonical.endswith("/" + name) and not (name == "index.html" and p.canonical.endswith("/")):
            warn(name, "canonical URL points elsewhere: " + p.canonical)


def check_sitemap(pages):
    sitemap = SITE / "sitemap.xml"
    if not sitemap.exists():
        warn("sitemap.xml", "missing — run python3 site-club/tests/make_sitemap.py")
        return
    listed = set(re.findall(r"<loc>https://jtsrfclub\.com/([^<]*)</loc>", sitemap.read_text(encoding="utf-8")))
    listed = {n or "index.html" for n in listed}
    for name in pages:
        if name not in listed:
            warn(name, "not in sitemap.xml — run python3 site-club/tests/make_sitemap.py")
    for name in sorted(listed - set(pages)):
        warn("sitemap.xml", "lists a page that no longer exists: " + name)


def check_internal_links(pages):
    for name, p in pages.items():
        for tag, attr, value in p.links:
            if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//)", value):
                continue
            url = urllib.parse.urlsplit(value)
            target = url.path or name
            if target.startswith("/"):
                fail(name, "root-relative link won't work on static hosting: " + value)
                continue
            path = (SITE / urllib.parse.unquote(target)).resolve()
            if not path.exists():
                fail(name, "broken %s %s: %s" % (tag, attr, value))
                continue
            if url.fragment and path.suffix == ".html":
                target_ids = pages[path.name].ids if path.name in pages else []
                if url.fragment not in target_ids:
                    fail(name, "link to missing #%s on %s" % (url.fragment, path.name))


def external_urls(pages):
    urls = {}
    for name, p in pages.items():
        for tag, attr, value in p.links:
            if value.startswith("http"):
                urls.setdefault(value, set()).add(name)
    return urls


def youtube_id(url):
    m = re.search(r"(?:youtube\.com/embed/|youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})", url)
    return m.group(1) if m else None


def fetch_status(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    for method in ("HEAD", "GET"):
        req.method = method
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (403, 404, 405, 429, 500, 501):
                continue  # plenty of servers refuse HEAD; confirm with GET
            return e.code
        except Exception as e:  # timeout, DNS, TLS
            if method == "HEAD":
                continue
            return "error: %s" % type(e).__name__
    return "error"


def check_external_links(pages):
    urls = external_urls(pages)
    to_check, by_hand, yt_ids = {}, {}, {}
    for url, where in urls.items():
        host = urllib.parse.urlsplit(url).hostname or ""
        if host in ("fonts.googleapis.com", "fonts.gstatic.com"):
            continue
        vid = youtube_id(url)
        if vid:
            yt_ids.setdefault(vid, set()).update(where)
        elif host in UNCHECKABLE_HOSTS:
            by_hand.setdefault(host, 0)
            by_hand[host] += 1
        else:
            to_check[url] = where

    def check(url):
        return url, fetch_status(url)

    def check_yt(vid):
        oembed = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(
            "https://www.youtube.com/watch?v=" + vid)
        return vid, fetch_status(oembed)

    print("  checking %d external links and %d YouTube videos…" % (len(to_check), len(yt_ids)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for url, status in pool.map(check, to_check):
            if status != 200:
                for page in sorted(to_check[url]):
                    (fail if status in (404, 410) or str(status).startswith("error") else warn)(
                        page, "external link returned %s: %s" % (status, url))
        for vid, status in pool.map(check_yt, yt_ids):
            if status != 200:
                why = {401: "not embeddable", 403: "private or not embeddable", 404: "removed or private"}.get(status, status)
                for page in sorted(yt_ids[vid]):
                    fail(page, "YouTube video %s is %s" % (vid, why))
    return by_hand


# --------------------------------------------------------------------------- browser checks
def start_server():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler = functools.partial(QuietHandler, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, "http://127.0.0.1:%d/" % server.server_address[1]


def check_in_browser(pages, base):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        fail("-", "playwright not installed: pip install playwright && python3 -m playwright install chromium")
        return

    guide_pages = sorted(n for n in pages if "tutorial-doc" in (SITE / n).read_text(encoding="utf-8"))
    board_pages = sorted(n for n in pages if re.match(r"board-.*\.html$", n) and n not in guide_pages)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for label, viewport in (("desktop", {"width": 1280, "height": 900}), ("phone", {"width": 390, "height": 844})):
            ctx = browser.new_context(viewport=viewport)
            # keep the run fast and offline-safe: external requests are checked separately
            ctx.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page = ctx.new_page()
            problems = []
            page.on("pageerror", lambda e: problems.append("JavaScript error: %s" % e))
            page.on("response", lambda r: problems.append("missing file (%d): %s" % (r.status, r.url[len(base):]))
                    if r.url.startswith(base) and r.status >= 400 else None)
            print("  %s: loading %d pages…" % (label, len(pages)))
            for name in pages:
                problems.clear()
                page.goto(base + name, wait_until="load")
                if name in guide_pages or name in board_pages or name == "maintenance.html":
                    try:
                        page.wait_for_selector(".guide-fab", timeout=5000)
                    except Exception:
                        problems.append("index button did not appear")
                    if name != "maintenance.html" and page.locator(".guide-pager").count() == 0:
                        problems.append("next/previous arrows missing (is the page listed on %s?)"
                                        % ("boards.html" if name in board_pages else "maintenance.html"))
                page.wait_for_timeout(150)
                if label == "phone":
                    wide = page.evaluate("""() => {
                        const w = document.documentElement.clientWidth;
                        if (Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= w + 1) return null;
                        const out = [];
                        for (const el of document.querySelectorAll('body *')) {
                          const r = el.getBoundingClientRect();
                          if (r.right > w + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[style*="overflow"], .guide-table-wrap, .tut-grid, .board-row, .guide-index')) {
                            out.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
                            if (out.length >= 3) break;
                          }
                        }
                        return out.join(', ') || 'unknown element';
                    }""")
                    if wide:
                        problems.append("page scrolls sideways on phones (%s)" % wide)
                for msg in sorted(set(problems)):
                    fail(name, "[%s] %s" % (label, msg))
            ctx.close()

        # interaction checks
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
        page = ctx.new_page()

        def interaction(name, fn):
            try:
                fn()
            except Exception as e:
                fail(name, "interaction check failed: %s" % str(e).splitlines()[0])

        def library():
            page.goto(base + "maintenance.html")
            page.fill("#tutSearch", "spark plug")
            assert page.locator("#tutResults .tut").count() > 0, "library search for 'spark plug' found nothing"
            page.fill("#tutSearch", "")
            page.click('#tutChips .chip[data-cat="electric"]')
            assert page.locator("#tutResults .tut").count() > 0, "Electric boards filter shows nothing"
        interaction("maintenance.html", library)

        def index_sidebar():
            page.goto(base + (guide_pages[0] if guide_pages else "maintenance.html"))
            page.click(".guide-fab")
            page.wait_for_selector(".guide-index.is-open")
            page.fill(".guide-index input", "winter")
            assert page.locator(".guide-index li:not([hidden])").count() > 0, "index search for 'winter' found nothing"
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            assert page.locator(".guide-index.is-open").count() == 0, "Esc did not close the index"
        interaction(guide_pages[0] if guide_pages else "-", index_sidebar)

        if (SITE / "mixing-fuel.html").exists():
            def calculator():
                page.goto(base + "mixing-fuel.html")
                page.fill("#mixAmount", "10")
                page.select_option("#mixUnit", "l")
                assert page.inner_text("#mixMl").strip() == "200 ml", "10 L should need 200 ml, got " + page.inner_text("#mixMl")
                page.fill("#mixAmount", "5")
                page.select_option("#mixUnit", "gal")
                assert page.inner_text("#mixOz").strip() == "12.8 oz", "5 gal should need 12.8 oz, got " + page.inner_text("#mixOz")
            interaction("mixing-fuel.html", calculator)

        browser.close()


# --------------------------------------------------------------------------- report
def report(by_hand, seconds):
    def section(title, items):
        if not items:
            return
        print("\n%s (%d)" % (title, len(items)))
        grouped = {}
        for page, msg in items:
            grouped.setdefault(msg, []).append(page)
        for msg, where in sorted(grouped.items(), key=lambda kv: (-len(kv[1]), kv[0])):
            pages = ", ".join(sorted(set(where))[:4]) + (" +%d more" % (len(set(where)) - 4) if len(set(where)) > 4 else "")
            print("  • %s\n      on: %s" % (msg, pages))

    section("FAILURES", failures)
    section("WARNINGS", warnings)
    if by_hand:
        print("\nCHECK BY HAND (these sites block automated checks): " +
              ", ".join("%s ×%d" % kv for kv in sorted(by_hand.items())))
    print("\n%s — %d failure(s), %d warning(s) in %.0fs" % (
        "FAIL" if failures else "PASS", len(failures), len(warnings), seconds))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fast", action="store_true", help="skip external link + YouTube checks")
    ap.add_argument("--no-browser", action="store_true", help="skip the headless browser checks")
    args = ap.parse_args()

    start = time.time()
    pages = parse_pages()
    print("JTSRF CLUB site check — %d pages in %s" % (len(pages), SITE))

    print("• page basics + internal links")
    check_basics(pages)
    check_internal_links(pages)
    check_sitemap(pages)

    by_hand = {}
    if not args.fast:
        print("• external links")
        by_hand = check_external_links(pages)

    if not args.no_browser:
        print("• browser")
        server, base = start_server()
        try:
            check_in_browser(pages, base)
        finally:
            server.shutdown()

    report(by_hand, time.time() - start)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
