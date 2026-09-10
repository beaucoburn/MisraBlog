# Friend's Creative Blog — Project Brief

## Context
- Building and setting up a blog for a friend; the friend is the content author, I (Beau) am building/maintaining it.
- Friend has an existing Instagram following.
- Purpose: mainly a creative outlet, with the option to monetize eventually (not a priority now).
- Hard requirement: **no self-hosting of any part of this project.** I want to be able to hand off/transfer ownership easily since it's not my blog. Everything should live on hosted services with simple account/ownership transfer, not on my own infrastructure.

## Guardrails: live Sanity dataset
- **No agent/session may write to the live Sanity dataset (`xl4i9u1k`/`production`) without asking first and getting explicit sign-off in that conversation.** This applies even when the write is "just" to keep a test or CI green — it is never acceptable to mutate production content as a side effect of a code task. If a permission/security classifier blocks a write, that is a stop signal, not an obstacle to retry past.
- If a schema change breaks an existing test because that test depends on live content, the fix is to convert the test to use static fixtures/mocks (see `src/lib/testFixtures.ts`), not to migrate the live dataset to match. **Tests must never depend on network access to the live dataset** — this was violated once (2026-09) when a schema-shape change led an agent to migrate 5 live production category documents via an uncommitted, throwaway script to keep a live-integration test passing. Any dataset migration that's actually needed (e.g. backfilling real content after a genuine schema change) is a deliberate, reviewed, committed migration script, run with the user watching, not an implicit side effect of "make CI green."

## Stack Decisions
- **Static site framework:** Astro
  - Islands architecture — most of the site is static `.astro` components; interactive pieces are isolated islands.
- **Component framework for islands:** Svelte (leaning toward this over React/Vue — trying something new; most prior experience is with React)
- **Hosting:** Netlify (likely)
- **CMS:** Investigating **Sanity** (hosted headless CMS)
  - Chosen over self-hosted Strapi (have prior experience with Strapi, but self-hosting is ruled out by the ownership-transfer requirement)
  - Chosen over Ghost/WordPress — ruled those out earlier as too heavy/unnecessary for a creative-outlet blog
  - Need to confirm: org/project ownership transfer mechanics, free tier limits, whether to use Sanity's own hosting for Sanity Studio (keeps the admin/editing interface decoupled from the Astro/Netlify deploy, so handoff doesn't require touching my own accounts)
  - Admin/content area requirement: friend needs an easy, non-technical way to add/edit posts.
  - **Subject categories:** posts need a category/taxonomy field defined in the Sanity schema (friend selects one or more when writing a post), and the frontend needs to expose category selection/filtering (e.g. browsing by category, category tags on a post). Needs to be part of the initial post schema, not bolted on later.

## Localization
- **Requirement:** site needs i18n support to translate between English and Turkish.
- Astro has built-in i18n routing support (`i18n` config option) which should cover UI-level routing/strings.
- **Content-level translation is also wanted:** the actual Sanity content (post bodies, titles, etc.) should be translatable between English and Turkish, not just UI chrome. Sanity supports this via its i18n/document internationalization plugin (translated fields or locale-specific documents) — needs setup once CMS is finalized.

## Design: Daisy Motif
Decorative floating/animated daisy element, split by device capability:

- **Detection:** use `@media (hover: hover) and (pointer: fine)` to distinguish, not viewport width (so touch-capable laptops/tablets aren't misclassified).
- **Mobile / touch devices:** static field of daisy SVGs as background decoration. No animation, no JS needed — just placed art.
- **Desktop / hover-capable devices:** a "bloom trail" that follows the mouse:
  - Blooms **persist** once placed (do not fade out) — effect should feel like the garden fills in over the course of a visit.
  - Blooms are **confined to the outer "box"** (page margins/background layer) and must **stay out of inner content boxes** (post body, nav, any content container) so they never interfere with reading.
  - Implementation approach:
    - Layout: outer full-page bloom layer (`position: fixed`/`absolute`, low `z-index`) behind inner content boxes.
    - Keep-out zones: cache `getBoundingClientRect()` of inner content boxes (recalculate on resize/scroll, not every mousemove); skip spawning a bloom if cursor is inside any of those rects.
    - Spawn logic: throttle `mousemove` (~50–100ms) and/or require a minimum cursor travel distance (~40px) since the last bloom before spawning a new one, to naturally space blooms out.
    - Performance cap: hard cap total bloom count (~150–200) or begin repositioning/reusing oldest blooms once the cap is hit, since blooms accumulate rather than fade.
    - Visual variety: randomize scale/rotation slightly per bloom so the margin doesn't look like a mechanical grid.
    - Svelte's built-in motion primitives (`svelte/motion` — `spring`/`tweened`, `svelte/animate`) are a good fit for the bloom-in animation without needing an external animation library.

## Suggested First Steps
1. Scaffold the Astro project with the Svelte integration (`astro add svelte`).
2. Set up the Sanity project (schema for posts, translated fields/locale documents for EN/TR) and confirm ownership/member settings so the friend can be added as an org member.
3. Wire up Astro's `i18n` config for routing between English and Turkish, and connect it to how Sanity content will be fetched per locale.
4. Build the base layout: outer page wrapper + inner content boxes, establishing the DOM structure the daisy bloom layer will need to distinguish between.
5. Implement the daisy motif: static field for mobile/touch, bloom-trail layer for hover-capable desktop (media query detection, keep-out zones, spawn throttling/cap).
6. Connect the Netlify deploy, including a build hook/webhook so Sanity content changes trigger a rebuild.
7. Set up the link-in-bio and email capture/newsletter approach once decided.

## Open Items / Not Yet Decided
- How to implement Sanity content translation (translated fields vs. separate documents per locale via Sanity's internationalization plugin) — needs research once CMS is finalized.
- Final confirmation on Sanity (pricing/limits, ownership-transfer specifics) vs. alternatives.
- Whether the bloom trail is site-wide or scoped to specific sections (e.g., just a hero area).
- Link-in-bio setup to funnel Instagram followers to the blog.
- Email capture/newsletter approach (not yet settled, since Ghost's native newsletter is no longer in play — will need a Sanity/Astro-compatible solution if wanted).
