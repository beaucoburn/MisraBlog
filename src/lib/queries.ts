export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }
`

export const POSTS_BY_CATEGORY_QUERY = /* groq */ `
  *[_type == "post" && references($categoryId)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt
  }
`
