#!/usr/bin/env python3
"""Build the two vertical experiences + the root selector.

site.template.html + scripts/verticals/{vert}_geo.js/_paper.js/_head.html
  -> crypto/index.html and ai/index.html
selector.template.html -> index.html (the / chooser)

Fonts are baked in from the cached scripts/fonts.json (fetched once).
"""
import base64
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS_URL = ("https://fonts.googleapis.com/css2"
           "?family=EB+Garamond:ital,wght@0,500;0,600;1,500&display=swap")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 Chrome/120 Safari/537.36")

VERTS = {
    "crypto": {
        "name": "crypto",
        "t2": "the coingecko top 100, drawn as a world &middot; market cap is the terrain",
        "papertag": "the coingecko top 100, mapped",
        "data": "../data/",
        "ax_n": "tradfi &middot; regulation",
        "ax_s": "cypherpunk &middot; the trenches",
        "ax_w": "ship fast",
        "ax_e": "sound money",
    },
    "ai": {
        "name": "ai",
        "t2": "the world of AI, drawn as a world &middot; valuation is the terrain",
        "papertag": "the AI world, mapped",
        "data": "../data-ai/",
        "ax_n": "capital &middot; the citadels",
        "ax_s": "ideology &middot; the marches",
        "ax_w": "open weights",
        "ax_e": "the east",
    },
    "macro": {
        "name": "macro",
        "t2": "the tribes of x, drawn as a world &middot; here be discourse",
        "papertag": "the feed, mapped",
        "data": "../data-macro/",
        "ax_n": "the transcendent north &middot; god &middot; order &middot; meaning",
        "ax_s": "the material south &middot; matter &middot; bodies &middot; power",
        "ax_w": "decelerate",
        "ax_e": "accelerate",
    },
}


def fetch_fonts() -> dict:
    req = urllib.request.Request(CSS_URL, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req).read().decode()
    out = {}
    for subset, body in re.findall(r"/\* ([a-z-]+) \*/\s*@font-face \{(.*?)\}", css, re.S):
        if subset != "latin":
            continue
        style = re.search(r"font-style:\s*(\w+)", body).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", body).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        data = urllib.request.urlopen(url).read()
        assert len(data) > 20000, f"font too small: {style}-{weight}"
        out[f"{style}-{weight}"] = base64.b64encode(data).decode()
    assert set(out) == {"normal-500", "normal-600", "italic-500"}, set(out)
    return out


def bake_fonts(html: str, fonts: dict) -> str:
    out = (html.replace("__FONT_N500__", fonts["normal-500"])
               .replace("__FONT_N600__", fonts["normal-600"])
               .replace("__FONT_I500__", fonts["italic-500"]))
    assert "__FONT_" not in out
    return out


def main() -> None:
    cache = ROOT / "scripts" / "fonts.json"
    if cache.exists():
        fonts = json.loads(cache.read_text())
    else:
        fonts = fetch_fonts()
        cache.write_text(json.dumps(fonts))

    tpl = (ROOT / "site.template.html").read_text()
    for vert, cfg in VERTS.items():
        vd = ROOT / "scripts" / "verticals"
        out = (tpl.replace("__VERT_HEAD__", (vd / f"{vert}_head.html").read_text().strip())
                  .replace("__VERT_GEO_JS__", (vd / f"{vert}_geo.js").read_text())
                  .replace("__VERT_PAPER_JS__", (vd / f"{vert}_paper.js").read_text())
                  .replace("__VERT_NAME__", cfg["name"])
                  .replace("__VERT_T2__", cfg["t2"])
                  .replace("__VERT_PAPERTAG__", cfg["papertag"])
                  .replace("__VERT_AX_N__", cfg["ax_n"])
                  .replace("__VERT_AX_S__", cfg["ax_s"])
                  .replace("__VERT_AX_W__", cfg["ax_w"])
                  .replace("__VERT_AX_E__", cfg["ax_e"])
                  .replace("__VERT_DATA__", cfg["data"]))
        assert "__VERT_" not in out, "unreplaced vertical placeholder"
        out = bake_fonts(out, fonts)
        dest = ROOT / vert
        dest.mkdir(exist_ok=True)
        (dest / "index.html").write_text(out)
        print(f"built {vert}/index.html ({len(out)} bytes)")

    sel = ROOT / "selector.template.html"
    if sel.exists():
        out = bake_fonts(sel.read_text(), fonts)
        (ROOT / "index.html").write_text(out)
        print(f"built index.html selector ({len(out)} bytes)")


if __name__ == "__main__":
    sys.exit(main())
