# QA Checklist

Manual, version-controlled checklist to run pre-deploy / pre-milestone. This covers everything that automated tests (Vitest/Playwright, see `TESTING.md`) can't meaningfully assert — real hardware, look/feel, and things that only a human eye or ear can judge.

Check items off (or note "N/A — not built yet") as of the date you run this. Sections for features that don't exist yet are included so the checklist is ready the day they land.

## Categories / CMS

- [ ] Add a new category in Sanity Studio, confirm it appears in the homepage nav after the next build/deploy (not before — this is a static build, not live-fetched).
- [ ] Publish a post tagged with 2+ categories, confirm it appears under **each** of those categories' pages.
- [ ] View a category page with zero posts, confirm a sane empty state (not a raw blank page or a broken loop).
- [ ] Edit an existing category's title in Studio, confirm the nav label and category page `<h1>` both update after rebuild, and the URL slug still resolves.
- [ ] Delete a category that still has posts referencing it in Studio, confirm the site doesn't crash the build (decide and document the intended behavior: post drops off that category's list, or build fails loudly — pick one on purpose).
- [ ] Confirm draft/unpublished posts do not appear on any category page.

## i18n

- [ ] Visit the EN homepage and the TR homepage, confirm each renders locale-appropriate UI chrome (nav labels, etc.), not just translated body copy.
- [ ] Confirm `<html lang="en">` on English routes and `<html lang="tr">` on Turkish routes.
- [ ] Use the locale switcher from an EN post to jump to its TR translation, then switch back — confirm it round-trips to the same post, not the TR homepage.
- [ ] Visit a post that has an EN version but no TR translation yet while on the TR locale — confirm the fallback behavior is sane (e.g. falls back to EN with a visible indicator, or redirects) rather than a broken/blank page.
- [ ] Spot-check that a TR route never leaks untranslated EN-only content silently (i.e., if fallback is intentional, it's visually indicated, not silent).
- [ ] Read through actual TR translation copy for accuracy/tone with the friend (not automatable — genuine human proofread).

## Daisy motif

- [ ] On a real desktop with a real mouse, move the cursor around the page and confirm blooms spawn and **persist** (garden fills in, nothing fades away).
- [ ] Confirm blooms never spawn inside the nav, post body, or any other inner content box — only in the outer margin/background layer.
- [ ] Confirm blooms are reasonably spaced (not spawning in a dense trail on every pixel of movement) — should feel like throttled/min-distance spawning, not a mechanical grid.
- [ ] Move the mouse continuously for ~2 minutes and confirm the bloom count caps out (around 150–200) with no visible slowdown/jank afterward.
- [ ] On a real touch phone (not just a resized browser window), confirm only the **static** daisy field renders — no bloom trail, no mousemove-driven JS running.
- [ ] On a touch-capable laptop or tablet (trackpad + touchscreen, or a Surface-style device), confirm it correctly selects **desktop** bloom-trail behavior via `hover: hover` and `pointer: fine`, not the mobile static field — this is the specific case the media-query choice (over viewport width) exists to get right.
- [ ] Resize the browser window and scroll the page; confirm keep-out zones (cached content box rects) update correctly rather than going stale.
- [ ] Confirm bloom scale/rotation is visibly randomized per bloom (not a mechanical, identical-looking grid of daisies).

## Cross-browser / device

- [ ] Load the site in Chrome, Firefox, and Safari (desktop) — layout and interactions match.
- [ ] Load the site on an actual iOS Safari device and an actual Android Chrome device — not just devtools device emulation.
- [ ] Check a mid-size tablet viewport (portrait and landscape) for layout breakage.
- [ ] Confirm favicon, page titles, and OG/meta tags render correctly when a page is shared as a link (e.g. paste the URL into iMessage/Slack and check the preview card).

## Accessibility

- [ ] Keyboard-only navigation: Tab through category nav links and any interactive elements, confirm a visible focus state at every stop.
- [ ] Screen reader spot-check (VoiceOver or NVDA) on the category nav and a post page — confirm nav landmark and links are announced sensibly, headings are in a logical order.
- [ ] Confirm the daisy bloom layer has `aria-hidden="true"` and is never announced by a screen reader.
- [ ] Confirm the daisy layer, at any bloom density, never lowers text contrast below WCAG AA against its background.
- [ ] Run an automated contrast/accessibility scan (e.g. axe or Lighthouse's a11y audit) against the homepage and a post page as a baseline sanity check (not a replacement for the manual checks above).

## Performance

- [ ] Run Lighthouse against the live Netlify preview URL (not localhost) for the homepage and a post page; note Performance/Accessibility/Best Practices/SEO scores.
- [ ] Confirm Svelte islands use appropriate hydration directives (`client:visible`, `client:idle`, etc.) rather than `client:load` unless there's a specific reason a component must hydrate immediately (e.g. above-the-fold interactivity).
- [ ] Confirm the daisy bloom-trail island doesn't hydrate/run at all on touch devices (no wasted JS shipped and executed for a feature that won't be used).
- [ ] Check total page weight and image sizes on a representative post (images should be reasonably optimized, not raw uploads).
- [ ] Confirm build time and deploy time stay reasonable as content grows (rough sanity check, not a hard budget).
