// $lang is threaded through from Astro's i18n routing (the active locale
// segment of the current route) rather than hardcoded, so every query
// below resolves content for the visitor's actual locale.
export const CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"] {
    _id,
    "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
    "description": coalesce(description[language == $lang][0].value, description[language == "en"][0].value),
    "slug": slug.current
  } | order(title asc)
`

// Shared card projection for the listing views (homepage feed + category
// listing), so those two can't drift apart. `excerpt` and `coverImage` are
// optional post fields added after content already existed, so both come
// back null for older documents and every consumer must render around
// their absence.
//
// Deliberately does NOT select `body`: a card only ever shows `excerpt`,
// and pulling each post's full Portable Text body into a listing just to
// truncate it into a preview would be wasted payload. A post with no
// excerpt yet simply renders without one.
const POST_CARD_PROJECTION = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage { asset->{ url }, hotspot, alt },
  categories[]-> {
    _id,
    "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
    "slug": slug.current
  }
`

// The homepage grid: the newest $limit translated posts in the visitor's
// language, capped so the homepage doesn't grow with the archive
// (category pages are the way to browse everything). Untranslated stubs
// are excluded here (unlike the category listing, which still links them
// so a reader browsing a category doesn't see the post silently vanish) — an empty-bodied stub has nothing to show
// in a card. Same "translated = non-empty body" criterion used on the post
// detail page.
export const LATEST_POSTS_QUERY = /* groq */ `
  *[_type == "post" && language == $lang && defined(body) && count(body) > 0] | order(publishedAt desc) [0...$limit] {
    ${POST_CARD_PROJECTION}
  }
`

// Every post exists as a document in both languages (see
// studio/actions/publishWithTranslationStub.ts — a stub is auto-created for
// the sibling language on first publish), so this must filter by language
// or it will return both language variants of each post.
export const POSTS_BY_CATEGORY_QUERY = /* groq */ `
  *[_type == "post" && references($categoryId) && language == $lang] | order(publishedAt desc) {
    ${POST_CARD_PROJECTION}
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
// Body images get their asset dereferenced (CDN URL + pixel dimensions,
// for srcset and layout-stable width/height); text blocks pass through.
export const POST_BY_SLUG_QUERY = /* groq */ `
  *[_type == "post" && slug.current == $slug && language == $lang][0] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage { asset->{ url }, hotspot, alt },
    categories[]-> {
      _id,
      "title": coalesce(title[language == $lang][0].value, title[language == "en"][0].value),
      "slug": slug.current
    },
    body[] {
      ...,
      _type == "image" => {
        alt,
        caption,
        asset->{ url, metadata { dimensions { width, height } } }
      }
    },
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
