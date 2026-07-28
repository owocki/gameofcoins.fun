# Game of Coins — the CryptoTwitter Ontology Map

**gameofcoins.fun** · built with ♥ by [@owocki](https://x.com/owocki)

An interactive fantasy-style map of crypto twitter. Every tribe (Bitcoin maxis, Ethereum, Solana, Link Marines, regens, memecoin trenches, DeSci, MEV searchers — 34 in all) is a territory on one landmass. Every CoinGecko top-100 coin is a city at its real market-cap rank. Market cap is the terrain: bigger caps make taller mountains and wider territories, recomputed live from the day's data. Rivers show value flowing between tribes. A nightly research job resurveys what each tribe is actually talking about, with source URLs required for every claim.

**The three views:**

- **Main view** — the flat 2D parchment map. Hover a territory for its card: the tribe's ontology, this week's trending narratives (tap once for the story, again for X), and its coins. The search box top-right flies you to any island, coin ticker, topic, or influencer. "3d world" switches to the free-roam 3D world (`?map3d`): drag to pan, wheel to zoom, right-drag (or shift-drag) to orbit.
- **The flyover** (`?flyover` or the 🎬 button) — a Game-of-Thrones-style cinematic over the 7 biggest and 8 most niche tribes: 3D terrain, generative medieval towns, dragons, per-tribe props (orange coins, diamonds, marching marines, solarpunk plants), influencer walkers, and an original score. Watch the pre-rendered film or fly it live in WebGL.
- **The Attention Times** (📰 button) — the same day's data as a broadsheet newspaper, ranked by real-world size, with a copy-to-clipboard artifact for posting.

Geography is meaningful: north = tradfi & regulation, south = cypherpunk & the trenches, west = ship fast, east = sound money. The ocean is fiat. Tribes only neighbor tribes they are genuinely related to (Base sits beside the L2s; the memecoin Trenches face Solana).

This branch (`cryptotwitter`) is a fork of the [Atlas of Frontier Ontologies](https://daily-ontological-map.vercel.app/) (`main` branch) — the same engine mapping the tribes of X instead of crypto.

## Run it locally

```sh
python3 -m http.server 8741        # then open http://localhost:8741
```

That's it — the site is static. `index.html` fetches `data/index.json` for the list of days, then `data/YYYY-MM-DD.json` for the selected day.

## Architecture

| File | What it is |
| --- | --- |
| `site.template.html` | The whole site: map geometry, 2D renderer, cards, search, newspaper. **Edit this, never `index.html`.** |
| `scripts/build_site.py` | Bakes `site.template.html` → `index.html` (inlines fonts). Run after every template edit. |
| `flyover3d.js` | The three.js layer: the free-roam 3D main view AND the cinematic flyover (one file, two modes). |
| `vendor/three.min.js` | three.js r160, vendored so the site has zero external requests. |
| `flyover.mp4` | The pre-rendered film. See "Re-recording the film" below. |
| `data/YYYY-MM-DD.json` | One snapshot per day: coins per tribe (`discussing`), weekly narratives (`topics`), newspaper copy (`paper`). |
| `scripts/canon.json` | The fixed tribe canon: names, TLDRs, ontologies, figures. |
| `scripts/research_crypto.py` | The nightly survey: Claude + web search refreshes coin ranks and weekly narratives. Every topic must carry a source URL or it is rejected. |
| `.github/workflows/nightly-crypto.yml` | Runs the survey at 06:40 UTC and commits the new day. |

## Fork it: make your own map

The engine maps any set of tribes onto procedural terrain. To reskin it:

1. **Define your tribes** in `scripts/canon.json`. Each tribe has an `id` (permanent — it is the geometry key, never rename it), `country` (map label), `tldr`, `ontology` (a list of claims in the tribe's own voice), and `figures` (top accounts).
2. **Place them** in `site.template.html`: the `CONTINENTS` array defines each landmass and which tribes it contains. Sector sizes are computed from the data at render time; positions should follow the adjacency rule — only put tribes next to each other if they are genuinely related.
3. **Feed them data**: write a `data/YYYY-MM-DD.json` by hand to start, then adapt `scripts/research_crypto.py` (the tribe → search-cluster mapping at the top) for your domain.
4. **Rebuild**: `python3 scripts/build_site.py`, refresh, done.

Deploy anywhere that serves static files (on Vercel: import the repo, no build settings). For the nightly job, add an `ANTHROPIC_API_KEY` repo secret. Note that GitHub only fires scheduled workflows from the **default branch** — keep the workflow file there even if it checks out another branch (that's why `nightly-crypto.yml` exists on both `main` and `cryptotwitter`).

## Re-recording the film

The flyover renders deterministically from a virtual clock, so the film captures frame-perfect even when headless WebGL is slow:

1. Serve the site locally and open `?flyover&auto=1&record=1` in headless Chromium (Playwright).
2. Wait for `window.__flyReady`, then call `window.__renderAt(t)` and screenshot at `t = frame/24` for each frame; call `window.__renderScore(seconds, bars)` for the WAV (render a few seconds longer than the film).
3. Assemble: `ffmpeg -framerate 24 -i frames/f%05d.jpg -i score.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest flyover.mp4`

The score is an original composition written in WebAudio — fantasy-epic *style*, no copyrighted melodies. Keep it that way.

## Data honesty

The research pipeline refuses to publish a topic without a source URL, and a failed run writes nothing — the site keeps serving yesterday. If you extend the pipeline, keep that property: a map of what tribes are discussing is only interesting if it's true.

## Community

Fork freely. Say hi in the [telegram](https://t.me/+_TMrvEHi8ew1MjFh) or on [X](https://x.com/owocki).
