import { expect, test } from 'vitest';
import { getStaticPaths } from './[slug].astro';

const SEEDED_SLUGS = ['music', 'art', 'cooking', 'writing'];

type StaticPathEntry = {
  params: { slug: string };
  props: { category: { _id: string; title: string; slug: string } };
};

test('getStaticPaths returns one entry per seeded category', async () => {
  const paths = (await getStaticPaths()) as StaticPathEntry[];

  for (const slug of SEEDED_SLUGS) {
    const match = paths.find((p) => p.params.slug === slug);
    expect(match).toBeDefined();
    expect(match?.props.category._id).toBe(`category-${slug}`);
  }
});

test('getStaticPaths does not produce duplicate slugs', async () => {
  const paths = (await getStaticPaths()) as StaticPathEntry[];
  const slugs = paths.map((p) => p.params.slug);
  const uniqueSlugs = new Set(slugs);
  expect(uniqueSlugs.size).toBe(slugs.length);
});
