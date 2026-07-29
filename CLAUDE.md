# CLAUDE.md — working on Game of Coins

Guidance for AI coding agents (and humans) making changes to this repo. The
README explains what the project is; this file explains what will break if you
don't know about it.

## The build rule (most important)

ALL three `index.html` files are generated (`/index.html` selector,
`crypto/index.html`, `ai/index.html`). **Never edit them directly.** Edit
`site.template.html` (both verticals), `selector.template.html` (the root
chooser), or the per-vertical config in `scripts/verticals/*` — then run:

```sh
python3 scripts/build_site.py
```

If you edit `index.html` your change will be silently overwritten on the next
build.

## Invariants

- **Tribe ids are geometry keys.** The `id` values in `scripts/canon.json`
  (`btcmaxis`, `ethereum`, `linkmarines`, …) are referenced by the map
  geometry, the flyover, the search index, and every data file. Renaming one
  orphans its territory. Add new ids; never rename or reuse old ones.
- **Never fabricate topics.** Every trending topic in `data/*.json` must have
  a real source URL (`src`). The research pipeline rejects topics without one,
  and a failed run writes nothing — the site keeps serving yesterday. Keep
  both properties if you touch `scripts/research_crypto.py`. Do not hand-write
  "plausible" topics into data files.
- **Geometry is data-driven.** Sector widths, mountain heights, and river
  widths are computed at render time from market caps parsed out of the day's
  data. Don't hard-code sizes; feed better data instead.
- **Adjacency is semantic.** Tribes sit next to tribes they are genuinely
  related to (Base beside the L2s, the memecoin Trenches facing Solana, the
  ocean is fiat). When placing a new tribe in `CONTINENTS`, put it near its
  real cultural neighbors, not wherever there's room.
- **The score is original.** The flyover music is composed in WebAudio in the
  style of a fantasy epic. Never swap in or imitate a specific copyrighted
  melody.
- **Zero external requests.** Fonts are baked into `index.html`, three.js is
  vendored in `vendor/`. Keep it that way — the site must work as plain
  static files with no CDN.

## The two 3D modes (one file)

`flyover3d.js` reads the URL:

- `?map3d` (no `?flyover`) → **free-roam 3D view**: orbit camera, hover
  picking, search flyTo. Talks to the 2D map through the `window.__atlas`
  bridge (defined in `site.template.html`), which exposes `countries`,
  hit-testing (`pick`), and card rendering. The 2D SVG is the default main
  view (the "3d world" toggle links to `?map3d`) and is what gets rasterized
  into the 3D terrain texture.
- `?flyover` → **the cinematic tour**. `?flyover2d` forces the legacy 2D tour.
- `?flyover&auto=1&record=1` → deterministic recording mode:
  `window.__renderAt(t)` renders any tour-time, `window.__renderScore(sec,
  bars)` renders the audio. Render the score a few seconds longer than the
  film's TOTAL.

If you change the tour length (add/remove stops, change `REVEAL`/`PER`/
`OUTRO`), re-record `flyover.mp4` — the README has the pipeline — and bump the
score length to match.

Rasterization gotcha: the SVG → texture step clones the SVG and must inject
the page's `<style>` text and strip `filter` attributes and the `.hl`
hover layers, or those elements render black in the texture.

## Data flow

```
scripts/canon.json        (static tribe canon: who the tribes are)
        │
scripts/research_crypto.py (nightly: coin ranks + weekly narratives, src required)
        ▼
data/YYYY-MM-DD.json      (one snapshot per day; index.json lists the days)
        ▼
index.html                (fetches per-day JSON; map, cards, paper all render from it)
```

Per-tribe day fields: `discussing` = the coins (`{t, d, x}`, first item is the
capital), `topics` = the week's narratives with sources, `paper` (top-level) =
newspaper ticker/headline/deck.

## Branches and CI

- `cryptotwitter` = this site (Game of Coins). `main` = the original Atlas of
  Frontier Ontologies (tribes of X). They share the engine but have different
  canons, geographies, and data.
- GitHub only fires scheduled workflows from the **default branch**, so
  `nightly-crypto.yml` exists on both branches; the copy on the default branch
  checks out `cryptotwitter` and pushes to it. If you fork with a different
  default branch, keep the workflow file there.
- The nightly job needs an `ANTHROPIC_API_KEY` repo secret.

## Local dev

```sh
python3 -m http.server 8741      # serve; open http://localhost:8741
python3 scripts/build_site.py    # after any template edit
ANTHROPIC_API_KEY=... python3 scripts/research_crypto.py   # run a survey manually
```

Useful test URLs: `/` (selector) · `/crypto/`, `/ai/`, `/macro/` (flat maps) · `/{vert}/?map3d` (3D world) · `/{vert}/?flyover`
(cinematic) · `/#YYYY-MM-DD` (a specific day).

A convention for agents: don't `git checkout` another branch while a local
server or user session is using the working tree — use `git worktree` to edit
the other branch.
