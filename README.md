# Instant Site

AI website generator for local service businesses — tradies, cleaners, coaches, consultants, real estate agents, drone and photography operators.

Describe a business, pick a theme, and get a complete one-page website: hero, services, about, testimonials, FAQ and contact. Edit any text inline, then export a single self-contained HTML file that loads in well under a second.

**Live app:** https://digitalyticsagency.github.io/instant-site/

**Current version:** 1.4.2 — shown under Settings in the app, with a *Check for updates* button.

### Releasing

Bump `APP_VERSION` in `index.html` and `version` in `version.json` **together**, then push. Both are checked against each other by the pre-flight, and a mismatch means every visitor is told there is an update that does not exist.

GitHub Pages serves the app with a fixed `cache-control: max-age=600` and gives you no way to change response headers, so for ten minutes after a push some browsers keep serving the old build — and a tab that was already open never re-checks at all.

The app therefore polls `version.json` (a few dozen bytes, fetched with `cache: 'no-store'` and a cache-busting query) on load, whenever the tab is brought back to the front, and hourly. If the live version differs it offers a reload, which navigates to a changed URL rather than calling `location.reload()` — a plain reload can be served straight back out of the same cache.

**What this actually guarantees.** The `no-store` and the query defeat the *browser* cache, which is the one that matters for a long-open tab. They do **not** defeat GitHub's CDN: measured on the live site, Fastly serves this path with `max-age=600` and ignores the query string entirely — two requests with different `?t=` values return the same cached object with an `age` header ticking up. So the honest promise is *a release is noticed within about ten minutes*, not instantly. That is still the difference between ten minutes and never.

---

## What it does

- **62 themes**, each tuned to a buyer segment (see below), filterable by family. Switching theme after generating is instant and costs **no API call** — the content is theme-independent.
- **10 page blueprints, chosen by the AI.** Every site used to arrive with the same thirteen sections in the same order — right for a plumber, wrong for a photographer, an ad landing page and a therapist. Claude now picks a structure from ten (Standard, Proof first, Offer landing page, Work first, Local search, Story led, How it works, Video first, Long form trust, One screen) based on how the business actually wins work, and says why in a sentence you can read. You can override it with one click. A blueprint only reorders and hides sections, so nothing you have written is ever lost.
- **10 menu styles, 5 of them 3D.** The menu is a burger button at every screen size, which is the one arrangement a long trading name or a lot of pages cannot break. Ten ways it opens: drop sheet, dropdown card, side drawer, left rail, full screen, and five built on real CSS 3D — flip panel, cube turn, depth stack, origami fold and portal. All pure CSS off one checkbox, so the export still ships no JavaScript.
- **Video in any image slot.** The hero, About and every gallery tile take a looping video as well as a still: autoplaying, muted, no controls, with the still kept underneath as the poster and the reduced-motion fallback. Its motion is scroll-driven in CSS, so this costs no JavaScript. True frame-by-frame scrubbing of the playhead needs script and rides on the opt-in JS layer.
- **Inline editing.** Click any text in the preview and type. Edits write straight into the single source of truth, so the export always matches what you see.
- **Per-section regeneration.** Redo just the hero, services, about, reviews or FAQ without touching the rest of the page.
- **Contact details wired end-to-end.** Phone, email, hours, service area and a booking link flow into the nav, hero card, contact section, footer and LocalBusiness JSON-LD automatically — no placeholder `hello@example.com` to hunt down.
- **Pre-flight checks** for colour contrast, heading hierarchy, meta length, missing contact fields, page weight and structured data. Advisory only; export is never blocked.
- **Stock photo and video search** built in. Photos from Openverse, Wikimedia, Pexels or Unsplash; video from Dailymotion or Pexels. Dailymotion and Openverse need no API key, so search works the moment you open the app. Found video becomes a link, never an upload, so the export stays small.
- **WordPress export, guarded at build time.** The classic theme is checked before the ZIP is written: a class used but never defined, a stylesheet and header template that disagree about how the menu opens, a missing or duplicated `<main>`, duplicated head meta, a missing required file, an asset nothing references. If any of those fail the download is refused rather than handing the customer a theme that breaks on their server. It is the one output nobody can eyeball before it is installed.
- **History** of your last 20 generations, stored locally.
- **White-label mode** for agencies. Exports never carry Instant Site branding either way.

## Themes

62 themes, browsable by family from the filter above the grid. The original eight cover the core buyer segments:

| Theme | Built for |
|---|---|
| Trades Bold | Electricians, plumbers, builders, emergency callout |
| Clean Professional | Consultants, accountants, legal, B2B services |
| Editorial Warm | Coaches, therapists, wellness, boutique services |
| Studio Dark | Photographers, drone operators, video, creative |
| Fresh Local | Cleaners, gardeners, pet care, mobile services |
| Property Elegant | Real estate agents, property managers, brokers |
| Minimal Mono | Designers, architects, premium one-person studios |
| Conversion Punch | Anyone running ads — offer-led landing page |

Twenty-six of the 62 are **dimensional** — they add a CSS depth system on top of the shared skeleton, in five families of two: soft (neumorphic), glass, clay, layered and tactile, plus three built for creative studios: **kinetic** (instrument panel — monospace micro-labels, pill buttons, display type set enormous and tight), **brut** (Swiss and printed — heavy rules, zero radius, a hard offset on hover instead of a lift) and **lumen** (light as the material — accent blooms behind cards, for render and motion work), plus two that are genuinely three-dimensional: **spatial** and **holo** (see below). The other 36 are flat.

Every theme shares one semantic HTML skeleton and differs by design tokens plus three structural variants — hero (`split` / `center` / `banner`), services (`cards` / `numbered` / `list`) and testimonials (`cards` / `featured`). That keeps the codebase small and fast while the output looks genuinely different.

### The 3D themes

Five themes — Void Depth, Helix Motion, Nebula Field, Chroma Shift, Obsidian Glass — are built on **real CSS 3D**: `perspective`, `transform-style: preserve-3d` and `translateZ`, so a card is a plane in space with its icon and heading standing in front of it. Hover tilts it on two axes; the entrance swings it up out of the page on a scroll-driven timeline.

**This is not WebGL, deliberately.** The reference style for 3D interfaces needs Three.js — about 736 KB fetched on every visit — and is rated poor for performance and not accessible. CSS 3D gets the depth for zero bytes of JavaScript, keeping the export script-free and ~46 KB. The Three.js hero remains available as the opt-in it always was, for anyone who wants real geometry and will pay for it.

Three constraints hold these together, and breaking any one of them silently kills the effect or the accessibility:

- **No `overflow:hidden` or `backdrop-filter` on anything carrying `preserve-3d`** — both force the browser to flatten the scene.
- **Nothing moves on its own.** The tilt is a hover transition and the entrance is scroll-driven, so motion always answers something the visitor did.
- **`prefers-reduced-motion: reduce` removes the 3D outright** — not just the transition, the transforms and the perspective too. Verified by forcing the branch on: every card and child flattens, perspective goes to `none`, and content stays visible rather than stranded at `opacity: 0`.

## Exported page performance

Measured, not estimated:

| | Google Fonts (default) | System fonts mode |
|---|---|---|
| File size (on disk) | ~45 KB | ~45 KB |
| File size (gzipped, as served) | ~10 KB | ~10 KB |
| External requests | 3 (preconnected, `display=swap`) | **0** |
| Executable scripts | **0** | **0** |
| *(with JS libraries opted in)* | *up to +736 KB* | *up to +736 KB* |
| DOMContentLoaded | ~8 ms | ~8 ms |

Measured on a Trades Bold export with every section populated; hiding the optional sections saves ~2 KB, because the weight is the stylesheet rather than the content. The inlined CSS is ~32 KB of the 45 KB and compresses hard, which is why the served size is ~10 KB.

**These figures are for the default settings**, where the JavaScript level is `Off`. That is the only configuration that is genuinely script-free. Opting into the JS libraries under Settings changes the picture a long way — Smooth scroll adds ~13 KB, GSAP effects ~128 KB and the WebGL hero ~736 KB, all fetched from jsDelivr on every visit — and the pre-flight check reports the real total whenever they are on. The client report generated from a site measures the actual export rather than repeating this table, so it stays honest either way.

All CSS is inlined and icons are inline SVG. At ~10 KB over the wire the page is a single round trip — real-world load time is dominated by your host's TTFB, not the page itself.

## Interface

Apple design language, light and dark. Typography is the real SF Pro stack via `-apple-system`, so on a Mac or iPhone it renders in genuine San Francisco — and the app chrome loads **no webfont at all**. Colour is Apple's system palette: system blue as the single accent, `#f5f5f7` / `#000` grounds, hairline separators, pill buttons, translucent blurred chrome.

Appearance follows your OS by default and can be pinned Light or Dark from the header toggle or the segmented control under Settings.

The 62 website themes are a **separate** palette system — a buyer's plumbing site shouldn't look like macOS — so switching app appearance never changes the site you're generating.

## Accessibility

Exported pages carry a `<main>` landmark and a keyboard skip link (WCAG 2.4.1), so a screen reader can jump straight to the content and a keyboard visitor does not re-tab the whole nav on every page. Headings run h1 → h2 → h3 with no level skips, images carry `alt` and intrinsic `width`/`height`, and every page declares `lang`.

Four independent guards run at boot and log loudly to the console on regression:

- **`verifyThemes()`** — all 62 output themes, against WCAG AA 4.5:1. Not just palette-vs-background but **button labels against their own fills** and **CTA text over both gradient stops**. These pair checks caught two real failures during development (white text on a light amber accent at 1.86:1, and a CTA gradient end at 3.95:1).
- **`verifyAppTokens()`** — the app's own chrome, in both appearances, against every ground it paints on (`bg`, `surface`, `surface-2`). This caught four failures in the first Apple palette, including the fact that Apple's `#0A84FF` reads beautifully as text on black (5.76:1) but carries a white button label at only 3.65:1 — which is why `--accent` (text) and `--accent-fill` (button background) are **separate tokens** in dark mode.
- **`verifyButtons()`** — the output's *interactive* states, measured on a real render rather than on the palette. It builds every theme in an iframe and asks the browser what it actually painted, resolving transparent backgrounds and gradients against the ground behind them. This is the one that catches what the other two cannot: it found a depth-family rule painting a secondary button's label onto its own fill at 1.00:1, invisible, which no palette check would ever see.

- **Duplicate theme keys.** Not a contrast check, but the same idea: a repeated key in the `THEMES` object literal is legal JavaScript — the last one silently wins and the earlier theme disappears. That happened once, and the only symptom was a theme count one lower than expected. `Object.keys` cannot see a duplicate, so this guard counts declarations in the source instead.

Verified by measuring computed styles on 21 rendered element pairs per appearance: all ≥ 4.5:1. Across the output themes that is 62 × 10 colour pairs, plus every button in every theme rendered and measured — currently all passing.

---

## Getting started

1. Open the app (link above), or clone and open `index.html` — there is no build step.
2. Get an Anthropic API key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).
3. Paste it under **Settings** in the left panel.
4. Fill in the business details, pick a theme, hit **Generate website**.
5. Click any text in the preview to edit it, then **Download**.

### About the API key

This is a **bring-your-own-key (BYOK)** app with no backend. The key is stored only in your browser's `localStorage` under `instantsite_api_key` and is sent only to `api.anthropic.com`. Nothing is proxied through any server, because there is no server.

Two consequences worth understanding:

- **Usage is billed to your own Anthropic account.** Roughly one Messages API call per generation, plus one per section regeneration.
- **Anyone with access to that browser profile can read the key.** Don't use a shared or public machine. Revoke the key from the Anthropic console if you suspect exposure.

Requests include the `anthropic-dangerous-direct-browser-access: true` header, which is required for calling the API directly from a browser.

## Architecture

Single file, vanilla JS, no dependencies, no bundler.

```
index.html
├── <style>   app chrome (Apple design language, light and dark)
├── HTML      3-column dashboard: history | brief+settings | preview+checks
└── <script>
    ├── config      MODEL, vertical packs, THEMES, icon allow-list
    ├── storage     localStorage: key, history (cap 20), prefs, white-label, brief
    ├── prompts     system + user prompt construction, incl. partial regeneration
    ├── callClaude  the ONLY network seam — swap this for a proxy in v3
    ├── validation  strict schema check; renders nothing on a miss
    ├── buildSite   one skeleton × 62 themes → preview (editable) and export (clean)
    └── checks      pre-flight panel, verifyThemes() contrast guard
```

`siteState` is the single source of truth for both the live preview and the exported file. There is deliberately no separate edit-tracking layer — that is why an export can never drift from what is on screen.

**Model:** `claude-sonnet-4-6`. Swappable to a cheaper model (e.g. `claude-haiku-4-5`) via the `MODEL` constant if per-generation cost matters at volume.

### Roadmap: server-side proxy (v3)

To sell metered generations instead of asking every customer for their own key, put a Cloudflare Worker in front: it holds one shared key as a secret, validates a customer token, decrements a quota, and forwards to the Messages API. Only `callClaude()` changes — everything downstream (validation, theming, rendering, export) is untouched. See the TODO block at the top of `index.html`.

## Selling the theme, and what the gate actually does

Building and previewing are free. The exportable theme file is the paid product, gated behind a licence key.

Every buyer — including you — gets their own key, issued from `admin.html` and stored in a Cloudflare D1 table by the Worker in `worker/`. The Download button checks the key against the Worker, re-checks about daily, and a key you revoke stops working everywhere on its next check. There is no shared passcode and no owner bypass.

**What the gate does not do.** The export is assembled in the visitor's browser out of their own content, so the Worker never touches the file and cannot withhold it. Anyone willing to edit the app's JavaScript can still export. This is not DRM and cannot be, because the architecture that makes the tool work offline with no backend is the same architecture that puts the export beyond the server's reach.

What you get is worth having anyway: casual non-payment is blocked, every buyer is identifiable, and a leaked key can be revoked in seconds. What you don't get is enforcement against someone technical who has decided not to pay. Price accordingly, and don't sell it as protected.

Two consequences worth knowing:

- **Without a deployed Worker the Download button stays locked.** There is no offline fallback — the thing it used to fall back to was a hardcoded passcode published in the page source, which is now removed.
- **`?client=1` is a courtesy, not a boundary.** It hides your pricing and white-label controls from a client you have shared the builder with, but the client controls their own address bar and can remove it. Anything you would not want a client to see should not be in a copy of the app you have given them.

## Known limitations

- **No image generation.** Themes use gradients and typography; the about section has a placeholder block. Add real photography and write `alt` text — the one manual step the export can't do for you.
- **No hosting or deploy integration.** Export is a downloadable `.html` file; publishing it is up to you.
- **No forms backend.** Contact CTAs are `tel:`, `mailto:` and booking links, which need no server.
- **The theme gate is not DRM.** See above — it deters and it revokes; it does not enforce.

---

## Licence

Copyright © 2026 digitalyticsagency. All rights reserved.

This repository is public so the app can be served from GitHub Pages. That is **not** a grant of rights — no open-source licence is offered, and reuse, redistribution or resale of this source requires written permission. Websites *generated by* the tool belong to you and carry no attribution or licence conditions.
