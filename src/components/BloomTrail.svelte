<!--
  Desktop daisy bloom trail (CLAUDE.md "Design: Daisy Motif"). Mounted by
  Layout.astro inside the fixed, decorative .bloom-layer, and hydrated only
  on hover-capable, fine-pointer devices (client:media), so touch devices
  never download it.

  - Daisies spring up behind the cursor in the page margins and persist,
    so the garden fills in over a visit. The layer is fixed, so the garden
    stays put like a backdrop while the content boxes scroll over it.
  - They never spawn inside [data-bloom-keepout] boxes. Rects are measured
    on resize/scroll/layout change, not on every mousemove.
  - Each bloom crossfades through the six bloom stages with CSS animations
    (no per-frame JS), then collapses to a single static stage-5 <use>, so
    a full garden of MAX_BLOOMS stays cheap.
  - Under prefers-reduced-motion, full blooms are placed directly.

  The rules and tuning live in lib/bloomTrail.ts (unit tested).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    BLOOM_SETTLE_MS,
    BLOOM_SIZE_PX,
    STAGE_FADE_MS,
    STAGE_STARTS_MS,
    createBloom,
    isFarEnoughAndLateEnough,
    isInsideAnyRect,
    keepoutRect,
    plant,
    type Bloom,
    type DaisyColor,
    type Rect,
  } from '../lib/bloomTrail';

  interface Props {
    // URLs of the pink and white bloom sprites (one <symbol> per stage,
    // daisy-0 … daisy-5). Referenced externally rather than inlined, since
    // the two sprites share symbol ids.
    sprites: Record<DaisyColor, string>;
  }

  let { sprites }: Props = $props();

  let blooms = $state<Bloom[]>([]);

  // How long each non-final stage stays on screen, including its fade out.
  const stageTimings = STAGE_STARTS_MS.slice(0, -1).map((start, i) => ({
    stage: i,
    delay: start,
    duration: STAGE_STARTS_MS[i + 1] - start + STAGE_FADE_MS,
  }));
  const finalStage = STAGE_STARTS_MS.length - 1;
  const finalDelay = STAGE_STARTS_MS[finalStage];

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let keepouts: Rect[] = [];
    let measureQueued = false;
    let nextId = 0;
    const spawn = { lastAt: -Infinity, last: null as { x: number; y: number } | null };
    const settleTimers = new Set<ReturnType<typeof setTimeout>>();

    const measure = () => {
      measureQueued = false;
      keepouts = Array.from(document.querySelectorAll<HTMLElement>('[data-bloom-keepout]'), (el) =>
        keepoutRect(el.getBoundingClientRect(), el.dataset.bloomKeepout),
      );
    };
    const queueMeasure = () => {
      if (measureQueued) return;
      measureQueued = true;
      requestAnimationFrame(measure);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const point = { x: event.clientX, y: event.clientY };
      const now = performance.now();
      if (!isFarEnoughAndLateEnough(spawn, point, now)) return;
      if (isInsideAnyRect(point, keepouts)) return;

      spawn.lastAt = now;
      spawn.last = point;

      const bloom = createBloom(nextId++, point);
      if (reducedMotion.matches) {
        bloom.settled = true;
      } else {
        const timer = setTimeout(() => {
          settleTimers.delete(timer);
          const live = blooms.find((b) => b.id === bloom.id);
          if (live) live.settled = true;
        }, BLOOM_SETTLE_MS);
        settleTimers.add(timer);
      }
      blooms = plant(blooms, bloom);
    };

    // Content boxes resize as fonts and images load; re-measure then too.
    const resizeObserver = new ResizeObserver(queueMeasure);
    document.querySelectorAll('[data-bloom-keepout]').forEach((el) => resizeObserver.observe(el));

    measure();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', queueMeasure, { passive: true });
    window.addEventListener('resize', queueMeasure);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', queueMeasure);
      window.removeEventListener('resize', queueMeasure);
      resizeObserver.disconnect();
      settleTimers.forEach(clearTimeout);
    };
  });
</script>

{#each blooms as bloom (bloom.id)}
  <svg
    class="bloom"
    class:bloom--growing={!bloom.settled}
    width={BLOOM_SIZE_PX}
    height={BLOOM_SIZE_PX}
    style:left="{bloom.x}px"
    style:top="{bloom.y}px"
    style:--rotation="{bloom.rotation}deg"
    style:--scale={bloom.scale}
    out:fade={{ duration: 400 }}
  >
    {#if bloom.settled}
      <use href="{sprites[bloom.color]}#daisy-{finalStage}" width="100%" height="100%" />
    {:else}
      {#each stageTimings as { stage, delay, duration } (stage)}
        <use
          class="bloom__stage"
          href="{sprites[bloom.color]}#daisy-{stage}"
          width="100%"
          height="100%"
          style:animation-delay="{delay}ms"
          style:animation-duration="{duration}ms"
        />
      {/each}
      <use
        class="bloom__stage bloom__stage--final"
        href="{sprites[bloom.color]}#daisy-{finalStage}"
        width="100%"
        height="100%"
        style:animation-delay="{finalDelay}ms"
        style:animation-duration="{STAGE_FADE_MS}ms"
      />
    {/if}
  </svg>
{/each}

<style>
  .bloom {
    position: absolute;
    overflow: visible;
    transform: translate(-50%, -50%) rotate(var(--rotation)) scale(var(--scale));
  }

  /* A little spring as it opens: grows from a small bud with a slight
     overshoot over the same time the stages take to play. */
  .bloom--growing {
    animation: bloom-grow 560ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes bloom-grow {
    from {
      transform: translate(-50%, -50%) rotate(var(--rotation)) scale(calc(var(--scale) * 0.45));
    }
  }

  /* Stages 0–4 each fade in, hold, and fade out as the next one arrives. */
  .bloom__stage {
    opacity: 0;
    animation-name: bloom-stage;
    animation-timing-function: ease-in-out;
    animation-fill-mode: both;
  }

  @keyframes bloom-stage {
    0% {
      opacity: 0;
    }
    25%,
    75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  /* Full bloom fades in and stays. */
  .bloom__stage--final {
    animation-name: bloom-final;
  }

  @keyframes bloom-final {
    to {
      opacity: 1;
    }
  }
</style>
