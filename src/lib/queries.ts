// $lang defaults to "en" for now; real locale routing (passing the active
// locale through from Astro's i18n config) is a separate follow-up phase.
// Falls back to English when a Turkish label is missing rather than
// hard-requiring it, since category translation is filled in over time.
export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] {
    _id,
    "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
    "slug": slug.current
  } | order(title asc)
`

export const POSTS_BY_CATEGORY_QUERY = /* groq */ `
  *[_type == "post" && references($categoryId)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt
  }
`
