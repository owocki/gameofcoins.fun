#!/usr/bin/env python3
"""Nightly survey for the CryptoTwitter Ontology Map (cryptotwitter branch).

Two refreshes, one day file:
1) COINS — fetch the CoinGecko top 100 plus the long-tail tokens, rebuild every
   tribe's `discussing` list (rank, market cap, price). The map's territory
   sizes and mountains are derived from these numbers at render time.
2) NARRATIVES — ask Claude (server-side web search) what each tribe argued
   about in the last 7 days; every topic must cite a source URL actually
   opened during research or it is dropped. Failed clusters fall back to the
   previous day's topics.

Writes data/YYYY-MM-DD.json + data/index.json. Exits non-zero without writing
on hard failure, so a bad run never corrupts the site.

Env: ANTHROPIC_API_KEY (required), ATLAS_MODEL (default claude-opus-5),
     ATLAS_DATE (override date, for testing).
"""
import datetime
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent.parent
MODEL = os.environ.get("ATLAS_MODEL", "claude-opus-5")

# ---- coin -> tribe mapping (by uppercase symbol, from the top-100 fetch) ----
TRIBE_OF = {
    'TRUMP': 'trumpcoins', 'WLFI': 'trumpcoins', 'USD1': 'trumpcoins',
    'BTC': 'btcmaxis', 'BCH': 'btcmaxis', 'LTC': 'btcmaxis',
    'ETH': 'ethereum',
    'MNT': 'l2s', 'POL': 'l2s', 'ARB': 'l2s', 'OP': 'regens',
    'SOL': 'solana', 'JUP': 'solana',
    'USDT': 'stablecoins', 'USDC': 'stablecoins', 'USDS': 'stablecoins', 'DAI': 'stablecoins',
    'USD1': 'stablecoins', 'USDE': 'stablecoins', 'USDG': 'stablecoins', 'PYUSD': 'stablecoins',
    'RLUSD': 'stablecoins', 'USDD': 'stablecoins', 'USDF': 'stablecoins', 'BFUSD': 'stablecoins',
    'USDGO': 'stablecoins', 'U': 'stablecoins', 'STABLE': 'stablecoins', 'GHO': 'stablecoins',
    'USD0': 'stablecoins', 'TUSD': 'stablecoins', 'USX': 'stablecoins',
    'FIGR_HELOC': 'rwa', 'RAIN': 'rwa', 'CC': 'rwa', 'USYC': 'rwa', 'BUIDL': 'rwa',
    'XAUT': 'rwa', 'USDY': 'rwa', 'ONDO': 'rwa', 'PAXG': 'rwa', 'BCAP': 'rwa',
    'EUTBL': 'rwa', 'JTRSY': 'rwa', 'USTB': 'rwa', 'JAAA': 'rwa', 'EURSAFO': 'rwa',
    'YLDS': 'rwa', 'QNT': 'rwa', 'XDC': 'rwa', 'HBAR': 'rwa',
    'BNB': 'exchangetokens', 'LEO': 'exchangetokens', 'WBT': 'exchangetokens',
    'CRO': 'exchangetokens', 'OKB': 'exchangetokens', 'HTX': 'exchangetokens',
    'BGB': 'exchangetokens', 'KCS': 'exchangetokens', 'GT': 'exchangetokens',
    'NEXO': 'exchangetokens',
    'XRP': 'xrparmy', 'XLM': 'xrparmy', 'FLR': 'xrparmy',
    'TRX': 'oldguard', 'ADA': 'oldguard', 'AVAX': 'oldguard', 'DOT': 'oldguard',
    'ICP': 'oldguard', 'ETC': 'oldguard', 'ALGO': 'oldguard', 'ATOM': 'oldguard',
    'FIL': 'oldguard',
    'ZEC': 'privacy', 'XMR': 'privacy', 'BDX': 'privacy',
    'GRAM': 'newl1s', 'SUI': 'newl1s', 'KAS': 'newl1s', 'PI': 'newl1s', 'APT': 'newl1s',
    'TAO': 'aicoins', 'WLD': 'aicoins', 'NEAR': 'aicoins', 'RENDER': 'aicoins',
    'VVV': 'aicoins', 'BEAT': 'aicoins',
    'LINK': 'linkmarines',
    'UNI': 'defi', 'AAVE': 'defi', 'MORPHO': 'defi', 'SKY': 'defi', 'WLFI': 'defi',
    'JST': 'defi', 'ENA': 'defi',
    'DOGE': 'memecoins', 'SHIB': 'memecoins', 'PEPE': 'memecoins', 'M': 'memecoins',
    'PUMP': 'memecoins', '币安人生': 'memecoins',
    'HYPE': 'hyperliquid', 'ASTER': 'degenperps', 'LIT': 'degenperps',
}

# long-tail tokens fetched by CoinGecko id regardless of top-100 membership
LONGTAIL = {
    'regens': ['optimism', 'celo', 'gitcoin', 'giveth'],
    'nft': ['pudgy-penguins', 'immutable-x', 'apecoin', 'the-sandbox', 'gala', 'blur'],
    'depin': ['akash-network', 'helium', 'iotex'],
    'artists': ['zora', 'audius', 'superrare'],
    'daos': ['lido-dao', 'ethereum-name-service'],
    'predictionmarkets': ['gnosis'],
    'base': ['aerodrome-finance', 'virtual-protocol', 'degen-base'],
    'restakers': ['ether-fi', 'eigenlayer'],
    'zkpurists': ['starknet', 'zksync', 'mina-protocol'],
    'ghostchains': ['iota', 'neo', 'vaulta'],
    'desci': ['researchcoin', 'vitadao'],
    'ordinals': ['dog-go-to-the-moon-rune'],
}

# tribes whose land exists without coins (topics only)
NO_COIN = {'memedaos', 'mevsearchers', 'airdropfarmers', 'brokerchains', 'fiat'}

CLUSTERS = {
    "crypto majors": ["btcmaxis", "ethereum", "stablecoins", "rwa", "exchangetokens", "fiat"],
    "alt chains": ["solana", "xrparmy", "oldguard", "privacy", "newl1s", "aicoins"],
    "degen side": ["hyperliquid", "degenperps", "memecoins", "defi", "l2s", "linkmarines"],
    "the commons": ["regens", "daos", "artists", "nft", "desci", "memedaos"],
    "niche meta": ["predictionmarkets", "base", "brokerchains", "restakers", "zkpurists",
                   "mevsearchers", "airdropfarmers", "ghostchains", "depin", "ordinals"],
}

PROMPT = """Today is {date}. You are researching what specific crypto twitter tribes discussed THE LAST 7 DAYS. Use web search extensively to find real, dated events — protocol news, governance fights, exploits, price/macro moves, regulatory rulings, launches.

Cluster: {cluster_name}. Tribes (id -> what it is):
{tribe_lines}

Rules:
- Every topic must be REAL and dated within roughly the last 7 days (quieter tribes: last few weeks, honestly framed). Never invent.
- Every topic MUST come from a source you actually opened via web search in this session. Include "src": the URL. If you cannot point to a real source, DROP the topic — one real topic beats three invented ones. Never state numbers a source does not state.
- Plain language. No cute coinages.
- Per topic: "t" = punchy 2-4 word label; "d" = one plain vivid sentence with names/numbers/dates; "x" = 2-5 word X search query; "src" = URL.
- 2-3 topics per tribe. The FIRST topic must be the tribe's biggest story.

After researching, end your reply with ONLY a fenced json block of this exact shape (all tribe ids present):
```json
{{"<tribe_id>": [{{"t": "...", "d": "...", "x": "...", "src": "https://..."}}, ...], ...}}
```"""


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "atlas-bot/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def money(x: float) -> str:
    if x >= 1e12: return f"${x/1e12:.2f}T"
    if x >= 1e9: return f"${x/1e9:.1f}B"
    if x >= 1e5: return f"${x/1e6:.1f}M" if x < 1e7 else f"${x/1e6:.0f}M"
    return f"${x/1e3:.0f}K"


def price(p: float) -> str:
    if p >= 1000: return f"${p:,.0f}"
    if p >= 1: return f"${p:,.2f}"
    return f"${p:.4f}"


def coin_entry(c: dict) -> dict:
    sym = c["symbol"].upper()
    return {"t": f"{sym} · #{c['market_cap_rank']}",
            "d": f"{c['name']} — rank #{c['market_cap_rank']}, {money(c['market_cap'] or 0)} market cap, {price(c['current_price'] or 0)}.",
            "x": f"${sym}",
            "src": f"https://www.coingecko.com/en/coins/{c['id']}",
            "_mcap": c["market_cap"] or 0}


def fetch_coins(canon: dict) -> dict:
    """Return {tribe_id: [coin topic dicts]} from live CoinGecko data."""
    per_tribe = {tid: [] for tid in canon if tid not in NO_COIN}
    top100 = fetch_json("https://api.coingecko.com/api/v3/coins/markets"
                        "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1")
    longtail_ids = sorted({cid for ids in LONGTAIL.values() for cid in ids})
    extra = fetch_json("https://api.coingecko.com/api/v3/coins/markets"
                       f"?vs_currency=usd&ids={','.join(longtail_ids)}")
    id_to_tribe = {cid: tid for tid, ids in LONGTAIL.items() for cid in ids}
    seen = set()
    for c in top100:
        tid = TRIBE_OF.get(c["symbol"].upper()) or id_to_tribe.get(c["id"])
        if tid is None:
            print(f"  NOTE: unmapped top-100 coin skipped: {c['symbol'].upper()} ({c['id']})",
                  file=sys.stderr)
            continue
        per_tribe.setdefault(tid, []).append(coin_entry(c))
        seen.add(c["id"])
    for c in extra:
        if c["id"] in seen:
            continue
        tid = id_to_tribe.get(c["id"])
        if tid:
            per_tribe.setdefault(tid, []).append(coin_entry(c))
    for tid in per_tribe:
        per_tribe[tid].sort(key=lambda t: -t["_mcap"])
        for t in per_tribe[tid]:
            t.pop("_mcap", None)
    empty = [tid for tid, v in per_tribe.items() if not v]
    if empty:
        raise RuntimeError(f"tribes with zero coins after fetch: {empty}")
    return per_tribe


def extract_json(text: str) -> dict:
    blocks = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.S)
    if not blocks:
        blocks = re.findall(r"(\{.*\})", text, re.S)
    if not blocks:
        raise ValueError("no JSON block in model output")
    return json.loads(blocks[-1])


def research_cluster(client, name, ids, canon, date):
    tribe_lines = "\n".join(f"- {tid}: {canon[tid]['country']} — {canon[tid]['tldr']}" for tid in ids)
    prompt = PROMPT.format(date=date, cluster_name=name, tribe_lines=tribe_lines)
    messages = [{"role": "user", "content": prompt}]
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": 14}]
    for _ in range(6):
        with client.messages.stream(model=MODEL, max_tokens=32000, tools=tools,
                                    messages=messages) as stream:
            response = stream.get_final_message()
        if response.stop_reason == "pause_turn":
            messages = [{"role": "user", "content": prompt},
                        {"role": "assistant", "content": response.content}]
            continue
        break
    if response.stop_reason == "refusal":
        raise RuntimeError(f"model refused cluster {name!r}")
    text = "".join(b.text for b in response.content if b.type == "text")
    topics = extract_json(text)
    missing = set(ids) - set(topics)
    if missing:
        raise ValueError(f"cluster {name!r} missing tribes: {sorted(missing)}")
    for tid in ids:
        clean = []
        for t in topics[tid][:5]:
            if not (t.get("t") and t.get("d")):
                continue
            if not str(t.get("src") or "").startswith("http"):
                raise ValueError(f"{tid}: topic {t.get('t')!r} has no source URL")
            clean.append({"t": str(t["t"])[:40], "d": str(t["d"])[:400],
                          "x": str(t.get("x") or t["t"])[:80], "src": str(t["src"])[:300]})
        if not clean:
            raise ValueError(f"{tid}: zero usable topics")
        topics[tid] = clean
    return {tid: topics[tid] for tid in ids}


PAPER_PROMPT = """You are the front-page editor of a plain-spoken daily digest of crypto twitter. Below are today's topics ({date}), one line per tribe, already researched and sourced — treat them as the ONLY facts you know.

{digest}

Write a JSON object with exactly these fields:
- "hooks": 5 short one-line hooks, each led by one fitting emoji, each restating a single concrete fact from the lines above (keep the numbers, names, and dates; do not add any).
- "head": a lowercase broadsheet front-page headline, 3-9 words, about the day's biggest cross-tribe story.
- "deck": one plain sentence expanding it, using only facts from the lines above.

Never invent an event, number, or name not in the lines above. Reply with ONLY a fenced json block:
```json
{{"hooks": ["..."], "head": "...", "deck": "..."}}
```"""


def write_paper(client, day):
    digest = "\n".join(
        f"- {t['name']}: " + " | ".join(x["d"] for x in t.get("topics", [])[:3])
        for t in day["tribes"].values() if t.get("topics"))
    with client.messages.stream(model=MODEL, max_tokens=2000,
                                messages=[{"role": "user", "content": PAPER_PROMPT.format(
                                    date=day["date"], digest=digest)}]) as stream:
        response = stream.get_final_message()
    text = "".join(b.text for b in response.content if b.type == "text")
    paper = extract_json(text)
    hooks = paper.get("hooks")
    assert isinstance(hooks, list) and 3 <= len(hooks) <= 6, "bad hooks"
    assert all(isinstance(h, str) and h.strip() for h in hooks), "empty hook"
    assert isinstance(paper.get("head"), str) and paper["head"].strip(), "bad head"
    return {"hooks": [h.strip()[:200] for h in hooks],
            "head": paper["head"].strip()[:120],
            "deck": str(paper.get("deck", "")).strip()[:300]}


def main() -> int:
    date = os.environ.get("ATLAS_DATE") or datetime.date.today().isoformat()
    label = datetime.date.fromisoformat(date).strftime("%-d %B %Y")
    canon = json.loads((ROOT / "scripts" / "canon.json").read_text())
    client = anthropic.Anthropic()

    print("fetching coins from CoinGecko…")
    coins = fetch_coins(canon)
    print(f"  {sum(len(v) for v in coins.values())} coins across {len(coins)} tribes")

    index_path = ROOT / "data" / "index.json"
    index = json.loads(index_path.read_text())
    prev = sorted(d for d in index["dates"] if d != date)
    prev_data = (json.loads((ROOT / "data" / f"{prev[-1]}.json").read_text())
                 if prev else None)

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
        if len(failures) > 2 or prev_data is None:
            print(f"too many failed clusters ({failures}); aborting", file=sys.stderr)
            return 1
        for name in failures:
            for tid in CLUSTERS[name]:
                all_topics[tid] = prev_data["tribes"].get(tid, {}).get("topics", [])
        print(f"carried topics from {prev[-1]} for failed clusters: {failures}")

    day = {"date": date, "dateLabel": label, "tribes": {}}
    for tid, static in canon.items():
        entry = dict(static)
        entry["discussing"] = coins.get(tid, [])
        entry["topics"] = all_topics.get(tid, [])
        day["tribes"][tid] = entry

    try:
        day["paper"] = write_paper(client, day)
        print("front page written")
    except Exception as exc:  # noqa: BLE001 — the site falls back to derived hooks
        print(f"paper generation failed ({exc}); site will derive hooks", file=sys.stderr)

    out = ROOT / "data" / f"{date}.json"
    out.write_text(json.dumps(day, ensure_ascii=False, indent=1))
    if date not in index["dates"]:
        index["dates"].append(date)
    index["dates"].sort()
    index_path.write_text(json.dumps(index, indent=1))
    print(f"wrote {out.name}; index now has {len(index['dates'])} days")
    return 0


if __name__ == "__main__":
    sys.exit(main())
