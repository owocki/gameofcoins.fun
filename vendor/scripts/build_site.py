#!/usr/bin/env python3
"""Bake the EB Garamond fonts into site.template.html -> index.html.

Only needed when site.template.html changes; the nightly job does NOT run this
(index.html is static, data/*.json is what changes daily).
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


def main() -> None:
    cache = ROOT / "scripts" / "fonts.json"
    if cache.exists():
        fonts = json.loads(cache.read_text())
    else:
        fonts = fetch_fonts()
        cache.write_text(json.dumps(fonts))
    tpl = (ROOT / "site.template.html").read_text()
    out = (tpl.replace("__FONT_N500__", fonts["normal-500"])
              .replace("__FONT_N600__", fonts["normal-600"])
              .replace("__FONT_I500__", fonts["italic-500"]))
    assert "__FONT_" not in out
    (ROOT / "index.html").write_text(out)
    print(f"built index.html ({len(out)} bytes)")


if __name__ == "__main__":
    sys.exit(main())
