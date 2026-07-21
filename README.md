# Instant Site

AI website generator for local service businesses — tradies, cleaners, coaches, consultants, real estate agents, drone and photography operators.

Describe a business, pick a theme, and get a complete one-page website: hero, services, about, testimonials, FAQ and contact. Edit any text inline, then export a single self-contained HTML file that loads in well under a second.

**Live app:** https://digitalyticsagency.github.io/instant-site/

---

## What it does

- **8 themes**, each tuned to a buyer segment (see below). Switching theme after generating is instant and costs **no API call** — the content is theme-independent.
- **Inline editing.** Click any text in the preview and type. Edits write straight into the single source of truth, so the export always matches what you see.
- **Per-section regeneration.** Redo just the hero, services, about, reviews or FAQ without touching the rest of the page.
- **Contact details wired end-to-end.** Phone, email, hours, service area and a booking link flow into the nav, hero card, contact section, footer and LocalBusiness JSON-LD automatically — no placeholder `hello@example.com` to hunt down.
- **Pre-flight checks** for colour contrast, heading hierarchy, meta length, missing contact fields, page weight and structured data. Advisory only; export is never blocked.
- **History** of your last 20 generations, stored locally.
- **White-label mode** for agencies. Exports never carry Instant Site branding either way.

## Themes

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

All eight share one semantic HTML skeleton and differ by design tokens plus three structural variants (hero, services, testimonials). That keeps the codebase small and fast while the output looks genuinely different.

## Exported page performance

Measured, not estimated:

| | Google Fonts (default) | System fonts mode |
|---|---|---|
| File size | ~18–20 KB | ~18–20 KB |
| External requests | 3 (preconnected, `display=swap`) | **0** |
| Executable scripts | **0** | **0** |
| DOMContentLoaded | ~8 ms | ~8 ms |

All CSS is inlined, icons are inline SVG, and below-fold sections use `content-visibility`. At ~20 KB the page is a single round trip — real-world load time is dominated by your host's TTFB, not the page itself.

## Interface

Apple design language, light and dark. Typography is the real SF Pro stack via `-apple-system`, so on a Mac or iPhone it renders in genuine San Francisco — and the app chrome loads **no webfont at all**. Colour is Apple's system palette: system blue as the single accent, `#f5f5f7` / `#000` grounds, hairline separators, pill buttons, translucent blurred chrome.

Appearance follows your OS by default and can be pinned Light or Dark from the header toggle or the segmented control under Settings.

The 8 website themes are a **separate** palette system — a buyer's plumbing site shouldn't look like macOS — so switching app appearance never changes the site you're generating.

## Accessibility

Two independent guards run at boot and log loudly to the console on regression:

- **`verifyThemes()`** — the 8 output themes, against WCAG AA 4.5:1. Not just palette-vs-background but **button labels against their own fills** and **CTA text over both gradient stops**. These pair checks caught two real failures during development (white text on a light amber accent at 1.86:1, and a CTA gradient end at 3.95:1).
- **`verifyAppTokens()`** — the app's own chrome, in both appearances, against every ground it paints on (`bg`, `surface`, `surface-2`). This caught four failures in the first Apple palette, including the fact that Apple's `#0A84FF` reads beautifully as text on black (5.76:1) but carries a white button label at only 3.65:1 — which is why `--accent` (text) and `--accent-fill` (button background) are **separate tokens** in dark mode.

Verified by measuring computed styles on 21 rendered element pairs per appearance: all ≥ 4.5:1.

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
├── <style>   dashboard chrome (dark glassmorphism)
├── HTML      3-column dashboard: history | brief+settings | preview+checks
└── <script>
    ├── config      MODEL, vertical packs, THEMES, icon allow-list
    ├── storage     localStorage: key, history (cap 20), prefs, white-label, brief
    ├── prompts     system + user prompt construction, incl. partial regeneration
    ├── callClaude  the ONLY network seam — swap this for a proxy in v3
    ├── validation  strict schema check; renders nothing on a miss
    ├── buildSite   one skeleton × 8 themes → preview (editable) and export (clean)
    └── checks      pre-flight panel, verifyThemes() contrast guard
```

`siteState` is the single source of truth for both the live preview and the exported file. There is deliberately no separate edit-tracking layer — that is why an export can never drift from what is on screen.

**Model:** `claude-sonnet-4-6`. Swappable to a cheaper model (e.g. `claude-haiku-4-5`) via the `MODEL` constant if per-generation cost matters at volume.

### Roadmap: server-side proxy (v3)

To sell metered generations instead of asking every customer for their own key, put a Cloudflare Worker in front: it holds one shared key as a secret, validates a customer token, decrements a quota, and forwards to the Messages API. Only `callClaude()` changes — everything downstream (validation, theming, rendering, export) is untouched. See the TODO block at the top of `index.html`.

## Known limitations

- **No image generation.** Themes use gradients and typography; the about section has a placeholder block. Add real photography and write `alt` text — the one manual step the export can't do for you.
- **No hosting or deploy integration.** Export is a downloadable `.html` file; publishing it is up to you.
- **No forms backend.** Contact CTAs are `tel:`, `mailto:` and booking links, which need no server.

---

## Licence

Copyright © 2026 digitalyticsagency. All rights reserved.

This repository is public so the app can be served from GitHub Pages. That is **not** a grant of rights — no open-source licence is offered, and reuse, redistribution or resale of this source requires written permission. Websites *generated by* the tool belong to you and carry no attribution or licence conditions.
