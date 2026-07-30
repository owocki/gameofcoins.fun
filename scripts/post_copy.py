#!/usr/bin/env python3
"""Write the X post that ships with the day's film.

The flyover's argument lives in the caption under each coin, which is the
worst place for it: it goes by in eight seconds, and it's the part of the
frame the player chrome covers when someone pauses to read. So say it in the
post too — same stops, same order, as text people can read without watching.

    python3 scripts/post_copy.py crypto              # the long post
    python3 scripts/post_copy.py crypto --short      # a quote-RT line per stop
    python3 scripts/post_copy.py ai --day 2026-07-28 --src

Emits to stdout; nothing here writes to the repo.
"""

import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERTS = {
    "crypto": {"data": "data", "geo": "crypto_geo.js", "unit": "market cap"},
    "ai": {"data": "data-ai", "geo": "ai_geo.js", "unit": "valuation"},
    "macro": {"data": "data-macro", "geo": "macro_geo.js", "unit": "reach"},
}
# how many narratives per stop: the film shows five, a QRT wants one
LONG_TOPICS = 5
SHORT_TOPICS = 1


def geo_config(vert: str) -> dict:
    """Pull POP / NICHE / cineKick / cineLine out of the vertical's geo JS.

    The stop order is defined there and only there — parsing it keeps the post
    in lockstep with the film instead of drifting into a second source of truth.
    """
    src = open(os.path.join(ROOT, "scripts", "verticals", VERTS[vert]["geo"])).read()
    out = {}
    for key in ("POP", "NICHE"):
        m = re.search(key + r"\s*:\s*\[(.*?)\]", src, re.S)
        if not m:
            sys.exit("post_copy: no %s in %s" % (key, VERTS[vert]["geo"]))
        out[key] = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))
    for key in ("cineKick", "cineLine"):
        m = re.search(key + r"\s*:\s*'((?:[^'\\]|\\.)*)'", src)
        out[key] = m.group(1).replace("\\'", "'") if m else ""
    return out


def latest_day(vert: str) -> str:
    d = os.path.join(ROOT, VERTS[vert]["data"])
    days = sorted(f[:-5] for f in os.listdir(d)
                  if f.endswith(".json") and f[0].isdigit())
    if not days:
        sys.exit("post_copy: no data files in %s/" % VERTS[vert]["data"])
    return days[-1]


def load_day(vert: str, day: str) -> dict:
    p = os.path.join(ROOT, VERTS[vert]["data"], day + ".json")
    if not os.path.exists(p):
        sys.exit("post_copy: no such day %s in %s/" % (day, VERTS[vert]["data"]))
    return json.load(open(p))


def emoji_of(vert: str, tid: str) -> str:
    """The tribe's sigil, read out of the vertical's PMETA table."""
    src = open(os.path.join(ROOT, "scripts", "verticals",
                            VERTS[vert]["geo"].replace("_geo", "_paper"))).read()
    m = re.search(re.escape(tid) + r"\s*:\s*\{[^}]*?e\s*:\s*'([^']*)'", src)
    return m.group(1) if m else ""


def reach_str(vert: str, tid: str) -> str:
    """Macro has no dollars — its kicker is the audience-reach line from PAPER."""
    src = open(os.path.join(ROOT, "scripts", "verticals",
                            VERTS[vert]["geo"].replace("_geo", "_paper"))).read()
    m = re.search(r"\['" + re.escape(tid) + r"','([^']*)'\]", src)
    return m.group(1) if m else ""


def mcap_of(tribe: dict) -> float:
    """Same sum the map and the film do: parse it back out of the coin blurbs."""
    mult = {"T": 1e12, "B": 1e9, "M": 1e6, "K": 1e3}
    total = 0.0
    for d in tribe.get("discussing") or []:
        m = re.search(r"\$([\d.]+)([TBMK]) market cap", d.get("d") or "")
        if m:
            total += float(m.group(1)) * mult[m.group(2)]
    return total


def fmt_cap(mc: float) -> str:
    if mc >= 1e12:
        return "$%.2fT" % (mc / 1e12)
    if mc >= 1e9:
        return "$%dB" % round(mc / 1e9)
    return "$%dM" % round(mc / 1e6)


def coins_of(tribe: dict) -> str:
    """The tickers the film's kicker shows — trimmed to the same 30 chars."""
    out = []
    for d in tribe.get("discussing") or []:
        t = (d.get("t") or "").split("·")[0].strip()
        if t and re.match(r"^[A-Za-z0-9$]", t):
            out.append(t.lstrip("$").upper())
    while len(out) > 1 and len(" · ".join(out)) > 30:
        out.pop()
    return " · ".join(out)


def kicker(vert: str, tid: str, tribe: dict) -> str:
    if vert == "macro":
        return reach_str(vert, tid)
    coins, mc = coins_of(tribe), mcap_of(tribe)
    if coins and mc > 1e6:
        return fmt_cap(mc) + " · " + coins
    return coins


def stop_block(vert, tid, tribe, n_topics, with_src):
    """One coin stop, as the post says it."""
    head = "%s %s" % (emoji_of(vert, tid), tribe.get("country") or tid)
    kick = kicker(vert, tid, tribe)
    if kick:
        head += " — " + kick
    lines = [head.strip()]
    for tp in (tribe.get("topics") or [])[:n_topics]:
        # the headline is the claim; the description is the argument behind it
        bullet = "• " + tp.get("t", "").strip()
        d = (tp.get("d") or "").strip()
        if d:
            bullet += " — " + d
        if with_src and tp.get("src"):
            bullet += " " + tp["src"]
        lines.append(bullet)
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vertical", choices=sorted(VERTS))
    ap.add_argument("--day", help="YYYY-MM-DD (default: the newest day on disk)")
    ap.add_argument("--short", action="store_true",
                    help="one line per stop — sized for a quote-RT")
    ap.add_argument("--src", action="store_true", help="append each topic's source URL")
    a = ap.parse_args()

    day = a.day or latest_day(a.vertical)
    data = load_day(a.vertical, day)
    cfg = geo_config(a.vertical)
    tribes = data.get("tribes") or {}
    order = [t for t in cfg["POP"] + cfg["NICHE"] if t in tribes]
    missing = [t for t in cfg["POP"] + cfg["NICHE"] if t not in tribes]
    n_topics = SHORT_TOPICS if a.short else LONG_TOPICS

    label = data.get("dateLabel") or day
    parts = ["%s — %s." % (cfg["cineKick"], label),
             cfg["cineLine"] + ".",
             "%d stops, in the order the film flies them 👇" % len(order)]
    body = [p for p in parts if p.strip(" .")]
    blocks = [stop_block(a.vertical, t, tribes[t], n_topics, a.src) for t in order]
    tail = "the whole map, resurveyed nightly: gameofcoins.fun/%s" % a.vertical
    post = "\n\n".join(["\n".join(body)] + blocks + [tail])

    sys.stdout.write(post + "\n")
    # counts go to stderr so `post_copy.py crypto | pbcopy` stays clean
    sys.stderr.write("\n--- %s · %s · %d stops · %d chars ---\n"
                     % (a.vertical, day, len(order), len(post)))
    if len(post) > 25000:
        sys.stderr.write("over X's 25,000-char premium limit — use --short\n")
    if missing:
        sys.stderr.write("no data for: %s\n" % ", ".join(missing))


if __name__ == "__main__":
    main()
