export const CATEGORY_SEEDS = [
  { slug: 'music', title: 'Music' },
  { slug: 'art', title: 'Art' },
  { slug: 'cooking', title: 'Cooking' },
  { slug: 'writing', title: 'Writing' },
]

export async function seedCategories(client) {
  for (const { slug, title } of CATEGORY_SEEDS) {
    await client.createIfNotExists({
      _id: `category-${slug}`,
      _type: 'category',
      title,
      slug: { current: slug, _type: 'slug' },
    })
  }
}
