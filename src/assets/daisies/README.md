# Daisy bloom stages

Six stages, `0-bud-closed` → `5-full-bloom`, in `white/` and `pink/`.

- Every file shares `viewBox="-50 -50 100 100"` with the flower centre at 0,0, so frames stack exactly; position each daisy by its centre.
- Full bloom spans ~84 of the 100 units. Render at 40–64px for the cursor trail.
- `daisy-bloom-sprite.svg` holds all six as `<symbol id="daisy-0">` … `daisy-5`. Inline it once, then `<svg><use href="#daisy-3"/></svg>`.
- Colours are CSS custom properties with the brand colours as fallbacks, so inline SVGs can be recoloured:
  `--daisy-petal`, `--daisy-petal-back`, `--daisy-ink`, `--daisy-center`, `--daisy-center-dots`, `--daisy-sepal`, `--daisy-bud`.
  (When used as `<img>`, the fallbacks apply.)

## Animating the bloom
Crossfade through the stages (~70–90ms each, 0 → 5) and leave stage 5 in place, so the trail persists.
Easing feels best if stage 0–1 are quick and 4–5 slower.
Add a small random rotation (±30°) and scale (0.8–1.1) per daisy so the trail doesn't look stamped.
Under `prefers-reduced-motion`, place stage 5 directly.

Mobile static field: mix stages 3, 4 and 5 (mostly 5) with random rotation, plus a few pink ones.
