// $lang is threaded through from Astro's i18n routing (the active locale
// segment of the current route) rather than hardcoded, so every query
// below resolves content for the visitor's actual locale.
export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] {
    _id,
    "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
    "slug": slug.current
  } | order(title asc)
`

// Every post exists as a document in both languages (see
// studio/actions/publishWithTranslationStub.ts — a stub is auto-created for
// the sibling language on first publish), so this must filter by language
// or it will return both language variants of each post.
export const POSTS_BY_CATEGORY_QUERY = /* groq */ `
  *[_type == "post" && references($categoryId) && language == $lang] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt
  }
`

// Used by getStaticPaths() on the post detail page to enumerate every post
// slug that exists for a given language — including untranslated stubs
// (empty body), since those still need a page (which renders the
// "not yet translated" placeholder rather than 404ing).
export const POST_SLUGS_QUERY = /* groq */ `
  *[_type == "post" && language == $lang] {
    "slug": slug.current
  }
`

// "Translated or not" = whether `body` is non-empty, not whether the
// document exists (it always exists, per the stub behavior above).
export const POST_BY_SLUG_QUERY = /* groq */ `
  *[_type == "post" && slug.current == $slug && language == $lang][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    body,
    language
  }
`

// Resolves a post's sibling document(s) in the other language(s) via the
// translation.metadata document that links them, for the language
// switcher. Slugs can differ between languages, so this must never assume
// the same slug string works across locales.
export const TRANSLATION_SIBLING_QUERY = /* groq */ `
  *[_type == "translation.metadata" && $id in translations[].value._ref][0] {
    translations[] {
      language,
      "post": value->{ "slug": slug.current, body }
    }
  }
`
