# Bir Misra Daha: brand assets

Lettering is converted to outlines, so the SVGs render the same everywhere with no font loading.

## Files
- `logo/logo-full.svg` / `.png`: the cartouche logo with the daisy garland (hero, about page)
- `logo/logo-wordmark.svg`: one-line "BIR Misra DAHA", used as the site header logo; `-on-dark` for dark backgrounds
- `logo/monogram.svg`: the "M" seal on its own
- `social/og-image.svg`: source for the 1200x630 link preview (the PNG export lives at `public/og-image.png`)
- `social/profile-avatar.png`: for Instagram, not used by the site
- `daisies/`: bloom-stage frames for the daisy motif (see `daisies/README.md`)

## Where it's wired up
- Favicons, touch/app icons, `site.webmanifest` and `og-image.png` live in `public/` and are linked from `src/layouts/Layout.astro`. `og-image.png` is the link preview for every page except posts with a cover image.
- The header logo is picked up from `logo/logo-wordmark.*` by `src/lib/siteImages.ts`. Replacing that file is enough; no code change needed.

## Colors
| Role | Hex |
|---|---|
| Plum (Misra) | #8A3F72 |
| Ink (lines, Bir/Daha) | #5A3657 |
| Lavender | #B7A0D8 |
| Pastel pink | #F2C6D6 |
| Ground | #F3E6EE |
| Paper (oval) | #FFFBFD |
| Daisy center | #F6D58E |

## Fonts
Pinyon Script (Misra) and Cormorant SC 600 (Bir, Daha), both SIL Open Font License via Google Fonts.
