# Testing

This document is the orientation for what's automated in this repo, how to run it locally, and how to extend it as new features (i18n, the daisy motif, Netlify build hooks) land.

## Running the suite locally

From the repo root (Astro app):

```sh
npm run typecheck      # astro check — type-checks .astro/.ts files
npm run test           # vitest run — unit/integration tests (root)
npm run test:watch     # vitest in watch mode
npm run build          # astro build — must succeed before e2e
npm run test:e2e       # playwright test — runs against `npm run preview`
```

From `studio/` (separate package.json/lockfile):

```sh
cd studio
npm run typecheck      # tsc --noEmit
npm run test           # vitest run — mocked, zero network calls
npm run seed           # actually seeds categories against the real dataset
```

CI (`.github/workflows/ci.yml`) runs all of the above end to end on every PR and push to `main`. It needs the `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` GitHub repo **Variables** set (Settings > Secrets and variables > Actions > Variables) before it will pass — these are not secrets, just the public project id/dataset name already in `.env`.

## Why root unit tests hit the real Sanity dataset (read-only, no mocking)

`src/lib/sanity.test.ts` and `src/lib/queries.test.ts` call `sanityClient.fetch(...)` against the real, live `production` dataset (project `xl4i9u1k`). This is intentional:

- It validates the **real schema contract** — if a field gets renamed or removed in Sanity Studio, these tests catch it immediately, which a mocked response never would.
- It's **safe**: this is public blog content served over Sanity's CDN with no write access (the read client here has no token), so there's no risk of corrupting data or leaking secrets.
- Assertions are written as **subset/shape checks**, not exact-equality snapshots — e.g. "the seeded slugs are present" and "results are sorted by title" rather than "there are exactly 4 categories" — specifically so the friend can add a real category (e.g. "Photography") from Sanity Studio at any time without breaking CI.

The **studio** unit tests do the opposite on purpose: `studio/scripts/lib/seedCategories.test.ts` mocks the Sanity client entirely, because that test is about the *shape of the payload sent to* `createIfNotExists`, not about live data — and it must never accidentally write to the real dataset.

## Template for testing future features

The general shape for any new feature:

1. **Extract pure logic** into a plain function (no Astro/Svelte/DOM coupling) under `src/lib/...`.
2. **Unit test it with Vitest.** Fast, deterministic, no browser needed.
3. **Add a couple of Playwright smoke tests** for routing/rendering — "does the page load, does the right heading/markup show up" — not exhaustive UI coverage.
4. **Anything about look/feel, animation quality, or physical hardware (real touch devices, real mice/trackpads, real screen readers) goes in `docs/qa-checklist.md`** as a manual pre-deploy check. Automated tests cannot meaningfully assert "this feels right" or "this daisy animation looks nice."

### Per-feature breakdown

**i18n (EN/TR routing)**
- Unit test any URL-building/locale-resolution helpers (e.g. "given locale + slug, build the right path") in isolation with Vitest.
- Playwright: assert `<html lang="...">` matches the route's locale, and that a locale-switcher link round-trips correctly (EN post -> TR link -> back to EN link lands on the same post).
- Translation quality/accuracy is not something to automate — that's a manual read-through, tracked in the QA checklist.

**Daisy motif (bloom trail)**
- Extract the interesting decision logic as pure, DOM-free functions in `src/lib/daisy/*.ts`, e.g. `shouldSpawnBloom()`, `isInKeepOutZone()`, `nextBloomSlot()`. These take plain data (cursor position, cached rects, last-spawn timestamp/position, current bloom count) and return a decision — no `getBoundingClientRect()` calls or DOM writes inside them.
- Unit test those pure functions directly: throttle timing, min-travel-distance math, keep-out-zone containment, cap enforcement.
- The actual "does it feel good," "does hover:hover vs. touch actually branch correctly on a real touch laptop," and "do blooms visually avoid the nav/post body" checks are manual — see `docs/qa-checklist.md`.

**Netlify build hook**
- This is essentially unit-untestable — it's a webhook triggered by Sanity's publish workflow hitting Netlify's build hook URL. There's no local unit of pure logic to extract.
- Verification is a manual checklist item: publish something in Sanity Studio, confirm a new Netlify deploy actually starts within a reasonable time, confirm the published content is live once the deploy completes.

## Known environment quirks

- `astro preview` auto-detects when it's being run by an AI coding agent (via the `am-i-vibing` package) and silently backgrounds itself, which breaks Playwright's `webServer` process-lifecycle expectations. This does **not** affect normal local development or CI (GitHub Actions runners aren't detected as an "agent"). If you ever hit `Error: Process from config.webServer exited early` while running `npm run test:e2e` from an AI coding assistant/agent shell, set `ASTRO_PREVIEW_BACKGROUND=1` in the environment before running the command to force foreground mode.
