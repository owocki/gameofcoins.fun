# CryptoTwitter Ontology Map (fork)

> This branch (`cryptotwitter`) is a fork of the Atlas of Frontier Ontologies:
> the same map engine, but the territory is crypto twitter. Every coin in the
> CoinGecko top 100 is a city in its tribe's territory; market cap is the
> terrain. Axes: north = tradfi & regulation, south = cypherpunk & the
> trenches, west = ship fast, east = sound money. The ocean is fiat.
> Data seeded from https://www.coingecko.com/ (top 100 by market cap).
> The main view is a free-roam 3D world (drag to pan, wheel to zoom,
> right-drag or shift-drag to orbit; "flat map" in the top right returns to the
> 2D parchment). The nightly research pipeline lives in
> `scripts/research_crypto.py` + `.github/workflows/nightly-crypto.yml`.

# Atlas of Frontier Ontologies

**Test it live: https://daily-ontological-map.vercel.app/**

> # ⚠️ TODO — finish deployment (≈2 minutes)
>
> Everything is built, tested, and committed locally. These three steps are the only things left, and they need your logins:
>
> 1. **Push to GitHub:**
>    ```sh
>    gh auth login
>    gh repo create daily-ontological-map --private --source . --push
>    ```
> 2. **Add the API key** (used by the nightly research job):
>    ```sh
>    gh secret set ANTHROPIC_API_KEY
>    ```
> 3. **Deploy on Vercel:** vercel.com → Add New Project → import `daily-ontological-map`. No build settings — static site. The Git integration makes the nightly bot commit auto-deploy.
>
> Then test without waiting for midnight: GitHub repo → **Actions → "Nightly atlas survey" → Run workflow**.
>
> Once the Vercel site is live, disable the old claude.ai routine ("Daily Ontological Atlas survey" at claude.ai/code/routines) — or ask Claude to — so the GitHub pipeline is the single source of truth.

An interactive, earth-style map of the tribes of X, laid out on two axes — west = accelerate, east = restrain, north = work within institutions, south = exit and build parallel systems. Three tiers: 7 mainstream continents, 19 frontier territories, 14 bespoke villages at deep zoom. Each territory's cities are the topics that tribe is discussing that day. Browse day by day with the ‹ › navigator (or arrow keys); every day is deep-linkable as `#YYYY-MM-DD`.

There is also a second view of the same data: **The Attention Times** (the "📰 read today's paper" pill, top left) — a broadsheet census of all 40 tribes ranked by real-world size rather than feed volume, each described in its own voice, with the day's trending arguments linked to X. Its "⧉ copy the article" button writes a paste-ready plain-text + rich-text version to the clipboard for posting. The paper renders from the same per-day JSON as the map, so the two views cannot disagree; the nightly job additionally writes an optional `paper` field (`{hooks, head, deck}` — the ticker, headline, and deck, synthesized only from that day's sourced topics), and the page derives fallback hooks from the day's capitals when it is absent.

## Architecture

- `index.html` — the whole site, static (fonts baked in). Fetches `data/index.json` for the list of days, then `data/<date>.json` per day. Built from `site.template.html` by `scripts/build_site.py` — only rebuild when the template changes. The template head carries the full social unfurl (Open Graph + Twitter cards pointing at `og.png`), so every page generated from it unfurls; if you ever add a second template, copy that meta block.
- `og.png` — the 1200×630 unfurl card (a clean screenshot of the map). Regenerate after big geography changes: serve the site locally and screenshot at 1200×630 with the controls hidden.
- `data/YYYY-MM-DD.json` — one snapshot per day. Static per tribe: `country` (map label), `tldr`, `ontology`, `figures`. Daily: `discussing` — topics `{t: label, d: sentence, x: X search query}`; the first topic is the capital (star).
- `scripts/canon.json` — the fixed tribe canon (names, TLDRs, ontologies). Tribe ids are geometry keys — never change them.
- `scripts/research.py` — the nightly job. Five Claude calls (one per tribe cluster) with server-side web search, merged with the canon, validated, written to `data/`. Fails safe: a bad run writes nothing and the site keeps serving yesterday.
- `.github/workflows/nightly.yml` — runs research at 06:10 UTC (≈ midnight Denver) and commits the new day. Vercel redeploys on push.

## One-time setup

1. **GitHub**: `gh auth login`, then from this directory:
   ```sh
   gh repo create daily-ontological-map --private --source . --push
   ```
2. **API key**: add the Anthropic key as a repo secret:
   ```sh
   gh secret set ANTHROPIC_API_KEY
   ```
3. **Vercel**: at vercel.com → Add New Project → import `daily-ontological-map`. No build settings needed (static site, output = repo root). Every push (including the nightly bot commit) deploys automatically.
4. Test the pipeline without waiting for midnight: Actions tab → "Nightly atlas survey" → Run workflow.

## Local development

```sh
python3 -m http.server 8741   # then open http://localhost:8741
python3 scripts/build_site.py # rebuild index.html after editing site.template.html
ANTHROPIC_API_KEY=... python3 scripts/research.py  # run a survey locally
```

Model for the nightly research defaults to `claude-opus-5`; override with `ATLAS_MODEL`.

## Legacy

The map also exists as a Claude artifact (https://claude.ai/code/artifact/763990df-4ba1-4dc2-b1e3-2116a6ebda60) updated by a claude.ai routine ("Daily Ontological Atlas survey" at claude.ai/code/routines). Once the Vercel site is live, that routine can be disabled — the GitHub pipeline replaces it. `index.template.html` is the single-file artifact template (fonts + data inlined), kept for that pipeline.
