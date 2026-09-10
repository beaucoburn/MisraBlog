// title/titleTr provide the EN/TR values written into the
// internationalizedArrayString shape below - see toInternationalizedTitle.
export const CATEGORY_SEEDS = [
  { slug: 'music', title: 'Music', titleTr: 'Müzik' },
  { slug: 'art', title: 'Art', titleTr: 'Sanat' },
  { slug: 'cooking', title: 'Cooking', titleTr: 'Mutfak' },
  { slug: 'writing', title: 'Writing', titleTr: 'Yazı' },
]

// Builds the array shape expected by sanity-plugin-internationalized-array
// for a `internationalizedArrayString` field: one item per language, each
// with a stable `_key` (so repeated seed runs produce identical payloads)
// and a `language` field carrying the language id.
export function toInternationalizedTitle(slug, en, tr) {
  return [
    { _key: `${slug}-en`, _type: 'internationalizedArrayStringValue', language: 'en', value: en },
    { _key: `${slug}-tr`, _type: 'internationalizedArrayStringValue', language: 'tr', value: tr },
  ]
}

export async function seedCategories(client) {
  for (const { slug, title, titleTr } of CATEGORY_SEEDS) {
    // createIfNotExists (not createOrReplace): the seed script is meant to
    // idempotently bootstrap missing categories, not overwrite whatever an
    // editor may have since changed in Studio (e.g. an updated description
    // or translated title). Migrating already-existing documents to a new
    // schema shape is a separate, explicit one-off concern, not something
    // a routine "seed" run should silently do.
    await client.createIfNotExists({
      _id: `category-${slug}`,
      _type: 'category',
      title: toInternationalizedTitle(slug, title, titleTr),
      slug: { current: slug, _type: 'slug' },
    })
  }
}
