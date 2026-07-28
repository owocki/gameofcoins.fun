#!/usr/bin/env python3
"""Nightly research: what is each tribe of X discussing today?

For each of five tribe clusters, asks Claude (with server-side web search) for
2-3 current topics per tribe, merges the results with the static canon
(scripts/canon.json), validates, and writes data/YYYY-MM-DD.json plus an
updated data/index.json. Exits non-zero without writing anything on failure,
so a bad run never corrupts the site.

Env: ANTHROPIC_API_KEY (required), ATLAS_MODEL (default claude-opus-5),
     ATLAS_DATE (override the date stamp, mostly for testing).
"""
import datetime
import json
import os
import re
import sys
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent.parent
MODEL = os.environ.get("ATLAS_MODEL", "claude-opus-5")

CLUSTERS = {
    "frontier tech": ["eacc", "progress", "hardtech", "rationalists", "doomers", "ea"],
    "crypto": ["btc", "eth", "defi", "degens", "regens", "netstate"],
    "culture and health frontier": ["tpot", "nondual", "longevity", "maha", "nrx", "degrowth", "indie"],
    "mainstream": ["maga", "progleft", "establishment", "finance", "christian", "stan", "sports"],
    "bespoke niche": ["georgists", "girardians", "landian", "metamodern", "forecasters",
                      "cryonics", "pronatalists", "doomeroptimists", "remilia", "cozyweb",
                      "tradcaths", "wsb", "astrology", "ufo"],
}
BESPOKE = set(CLUSTERS["bespoke niche"])

PROMPT = """Today is {date}. You are researching what specific communities ("tribes") on X (Twitter) are discussing TODAY. Use web search extensively to find real, dated, verifiable events and discourse cycles — launches, papers, dramas, price moves, rulings, protests, viral posts.

Cluster: {cluster_name}. Tribes (id -> what it is):
{tribe_lines}

Rules:
- Every topic must be REAL and verifiable. Never invent. Prefer the last 48 hours, accept the last 7 days.{bespoke_note}
- Plain language. No cute coinages.
- Per topic: "t" = punchy 2-4 word label; "d" = one plain vivid sentence with names/numbers/dates; "x" = a 2-5 word X search query that would surface this discourse (proper nouns beat generic words).
- {n_topics} topics per tribe. The FIRST topic must be the tribe's biggest story today.

After researching, end your reply with ONLY a fenced json block of this exact shape (all tribe ids present):
```json
{{"<tribe_id>": [{{"t": "...", "d": "...", "x": "..."}}, ...], ...}}
```"""


def load_canon() -> dict:
    return json.loads((ROOT / "scripts" / "canon.json").read_text())


def extract_json(text: str) -> dict:
    blocks = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.S)
    if not blocks:
        blocks = re.findall(r"(\{.*\})", text, re.S)
    if not blocks:
        raise ValueError("no JSON block in model output")
    return json.loads(blocks[-1])


def research_cluster(client: anthropic.Anthropic, name: str, ids: list, canon: dict, date: str) -> dict:
    tribe_lines = "\n".join(
        f"- {tid}: {canon[tid]['country']} — {canon[tid]['tldr']}" for tid in ids
    )
    bespoke = ids[0] in BESPOKE
    prompt = PROMPT.format(
        date=date,
        cluster_name=name,
        tribe_lines=tribe_lines,
        n_topics="1-2" if bespoke else "2-3",
        bespoke_note=(" These are small, low-volume communities: the last few weeks is "
                      "acceptable, and an honestly framed evergreen live debate is fine "
                      "if nothing dated exists." if bespoke else ""),
    )
    messages = [{"role": "user", "content": prompt}]
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": 12}]
    for _ in range(6):  # pause_turn continuation cap
        with client.messages.stream(
            model=MODEL,
            max_tokens=32000,
            tools=tools,
            messages=messages,
        ) as stream:
            response = stream.get_final_message()
        if response.stop_reason == "pause_turn":
            messages = [
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": response.content},
            ]
            continue
        break
    if response.stop_reason == "refusal":
        raise RuntimeError(f"model refused cluster {name!r}")
    text = "".join(b.text for b in response.content if b.type == "text")
    topics = extract_json(text)
    missing = set(ids) - set(topics)
    if missing:
        raise ValueError(f"cluster {name!r} missing tribes: {sorted(missing)}")
    return {tid: topics[tid] for tid in ids}


def validate_topics(tid: str, topics: list) -> list:
    assert isinstance(topics, list) and 1 <= len(topics) <= 4, f"{tid}: bad topic list"
    clean = []
    for topic in topics[:3]:
        assert topic.get("t") and topic.get("d"), f"{tid}: topic missing t/d"
        clean.append({"t": str(topic["t"])[:40],
                      "d": str(topic["d"])[:400],
                      "x": str(topic.get("x") or topic["t"])[:80]})
    return clean


def main() -> int:
    date = os.environ.get("ATLAS_DATE") or datetime.date.today().isoformat()
    label = datetime.date.fromisoformat(date).strftime("%-d %B %Y")
    canon = load_canon()
    client = anthropic.Anthropic()

    all_topics = {}
    failures = []
    for name, ids in CLUSTERS.items():
        try:
            print(f"researching cluster: {name} ({len(ids)} tribes)")
            all_topics.update(research_cluster(client, name, ids, canon, date))
        except Exception as exc:  # noqa: BLE001 — collect, decide below
            print(f"  FAILED: {exc}", file=sys.stderr)
            failures.append(name)

    if failures:
        # Fall back to the previous day's topics for failed clusters only if
        # most clusters succeeded; otherwise abort so the site keeps yesterday.
        if len(failures) > 2:
            print(f"too many failed clusters ({failures}); aborting", file=sys.stderr)
            return 1
        index = json.loads((ROOT / "data" / "index.json").read_text())
        prev = sorted(index["dates"])[-1]
        prev_data = json.loads((ROOT / "data" / f"{prev}.json").read_text())
        for name in failures:
            for tid in CLUSTERS[name]:
                all_topics[tid] = prev_data["tribes"][tid]["discussing"]
        print(f"carried topics from {prev} for failed clusters: {failures}")

    day = {"date": date, "dateLabel": label, "tribes": {}}
    for tid, static in canon.items():
        entry = dict(static)
        entry["discussing"] = validate_topics(tid, all_topics[tid])
        day["tribes"][tid] = entry
    assert set(day["tribes"]) == set(canon), "tribe id mismatch"

    out = ROOT / "data" / f"{date}.json"
    out.write_text(json.dumps(day, ensure_ascii=False, indent=1))
    index_path = ROOT / "data" / "index.json"
    index = json.loads(index_path.read_text())
    if date not in index["dates"]:
        index["dates"].append(date)
    index["dates"].sort()
    index_path.write_text(json.dumps(index, indent=1))
    print(f"wrote {out.name}; index now has {len(index['dates'])} days")
    return 0


if __name__ == "__main__":
    sys.exit(main())
