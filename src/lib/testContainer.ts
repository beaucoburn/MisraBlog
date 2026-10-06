// Astro container for rendering pages/components in tests. Every page uses
// Layout.astro, which mounts a Svelte island (BloomTrail), so the container
// needs the Svelte renderer registered or rendering throws.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer } from '@astrojs/svelte/container-renderer';
import { loadRenderers } from 'astro:container';

export async function createTestContainer() {
  const renderers = await loadRenderers([getContainerRenderer()]);
  return AstroContainer.create({ renderers });
}
