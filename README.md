# MisraBlog

A creative blog built for a friend, powered by a headless CMS so she can write and manage posts herself with no code changes. Built and maintained by Beau; the friend is the sole content author.

Hard requirement driving the stack: **no self-hosting.** Everything runs on hosted services (Sanity, Netlify) so ownership can be handed off cleanly later.

## Stack

- **[Astro](https://astro.build)** — static site framework, islands architecture
- **[Svelte](https://svelte.dev)** — component framework for interactive islands
- **[Sanity](https://www.sanity.io)** — hosted headless CMS, Studio lives in `studio/`
- **Netlify** — hosting (planned)

See `CLAUDE.md` for the full project brief, design notes (daisy motif), and open items.

## Repo layout

```
src/            Astro site (pages, components, lib)
studio/         Sanity Studio (separate package.json/lockfile)
tests/          Playwright e2e tests
docs/           QA checklist and other reference docs
TESTING.md      Test suite orientation — what's automated, how to run it
```

## Getting started

Requires Node >=22.12.0.

```sh
npm install
cp .env.example .env        # fill in PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET
npm run dev
```

To run the Sanity Studio locally (content editing UI):

```sh
cd studio
npm install
cp .env.example .env        # fill in SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET / SANITY_API_WRITE_TOKEN
npm run dev                 # Studio at localhost:3333
```

Current Sanity project: `xl4i9u1k`, dataset `production`.

## Scripts

Root (Astro app):

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Astro dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `astro check` |
| `npm run test` | Vitest unit/integration tests |
| `npm run test:e2e` | Playwright e2e tests |

`studio/` (Sanity Studio):

| Command | Description |
| --- | --- |
| `npm run dev` | Start Sanity Studio locally |
| `npm run build` / `deploy` | Build / deploy the Studio |
| `npm run seed` | Seed default categories into the dataset (idempotent) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (mocked, no network) |

See `TESTING.md` for full details on the test suite and CI, and `docs/qa-checklist.md` for manual QA items not covered by automated tests.

## Status

- ✅ Sanity CMS set up, category taxonomy live and content-managed (no hardcoded categories)
- ✅ Astro + Svelte scaffold, category browsing/filtering on the frontend
- ✅ Automated test suite (Vitest + Playwright) and GitHub Actions CI, all green
- 🚧 i18n (EN/TR): Sanity schema/plugins in place (`post` via document-internationalization, `category` via field-level translated arrays); Astro routing/locale-aware fetching not yet wired up
- ⏳ Not yet started: Astro i18n routing, daisy motif, Netlify deploy + build hook, link-in-bio, email capture
