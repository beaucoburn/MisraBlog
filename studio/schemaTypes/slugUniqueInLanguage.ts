import type {SlugIsUniqueValidator} from 'sanity'

const API_VERSION = '2025-02-19'

/**
 * Slug uniqueness for localized posts: a slug only has to be unique among
 * posts *in the same language*.
 *
 * Sanity's default check treats every post as one pool, but each post
 * exists once per language, and the auto-created translation stub (see
 * actions/publishWithTranslationStub.ts) deliberately starts with the same
 * slug as its source. The default check therefore flagged "Slug is already
 * in use" and disabled Publish on any post that had a stub. The site looks
 * posts up by slug *and* language (/en/post/x vs /tr/post/x), so a shared
 * slug across languages is fine.
 *
 * This follows the pattern @sanity/document-internationalization's docs
 * recommend: ignore this document's own draft/published copies, and match
 * on language.
 */
export const isSlugUniqueInLanguage: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  const publishedId = document?._id.replace(/^drafts\./, '')
  if (!publishedId) return true

  const client = getClient({apiVersion: API_VERSION})
  return client.fetch<boolean>(
    `!defined(*[
      _type == $type &&
      !(_id in [$draft, $published]) &&
      slug.current == $slug &&
      language == $language
    ][0]._id)`,
    {
      type: document?._type,
      draft: `drafts.${publishedId}`,
      published: publishedId,
      slug,
      language: document?.language ?? null,
    },
  )
}
