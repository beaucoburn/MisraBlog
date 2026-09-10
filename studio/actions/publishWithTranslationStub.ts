import {useCallback, useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionDescription, SanityDocument} from 'sanity'

/**
 * Auto-stub for the `post` document type: whenever a post in either
 * supported language is published for the first time, this wraps the
 * built-in "Publish" action to also create a linked, empty stub document
 * in the *other* language (same slug, no body) plus the
 * `translation.metadata` document that @sanity/document-internationalization
 * uses to recognize the pair - all with zero manual steps for the editor.
 * Deliberately symmetric (not English-first): the editor should be able to
 * start writing a post in whichever language she's inspired to write in
 * that day, not be forced through a fixed base language.
 *
 * The shape written here (translation.metadata document, and the
 * `internationalizedArrayReferenceValue` items inside its `translations`
 * array) matches exactly what @sanity/document-internationalization's own
 * "Translate" UI action produces internally (verified against the
 * installed 6.2.35 source), so the plugin's own badges/menus recognize the
 * pair correctly - see studio/actions/publishWithTranslationStub.test.ts
 * for the shape assertions.
 */

const API_VERSION = '2025-02-19'
const METADATA_SCHEMA_NAME = 'translation.metadata'
const SUPPORTED_LANGUAGES = ['en', 'tr'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function isSupportedLanguage(language: unknown): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
}

function otherLanguage(language: SupportedLanguage): SupportedLanguage {
  return language === 'en' ? 'tr' : 'en'
}

export function randomKey(): string {
  // Matches the general shape of Sanity's own array _key values closely
  // enough for our purposes; uniqueness (not a specific algorithm) is all
  // that's required here.
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export function createTranslationReference(language: string, ref: string, schemaTypeName: string) {
  return {
    _key: randomKey(),
    _type: 'internationalizedArrayReferenceValue',
    language,
    value: {
      _type: 'reference',
      _ref: ref,
      _weak: true,
      _strengthenOnPublish: {type: schemaTypeName},
    },
  }
}

type StubDoc = Record<string, unknown> & {_type: string}
type IdentifiedStubDoc = StubDoc & {_id: string}

type MinimalClient = {
  fetch: (query: string, params?: Record<string, unknown>) => Promise<unknown>
  transaction: () => {
    create: (doc: IdentifiedStubDoc) => unknown
    createIfNotExists: (doc: IdentifiedStubDoc) => unknown
    commit: () => Promise<unknown>
  }
}

/**
 * Creates the sibling-language stub post + translation.metadata document
 * for a newly-published post, unless a translation.metadata document
 * already references it (e.g. the editor already used the plugin's own
 * "Translate" button, or this post was already auto-stubbed on a previous
 * publish). Safe to call on every publish of a post in either supported
 * language - it's a no-op once the pair exists, and a no-op if the
 * source document's language isn't one of the two supported languages.
 */
export async function ensureTranslationStub(
  client: MinimalClient,
  sourceDocId: string,
  sourceDoc: SanityDocument | null,
  schemaTypeName = 'post',
): Promise<void> {
  const sourceLanguage = sourceDoc?.language
  if (!isSupportedLanguage(sourceLanguage)) return

  const existingMetadata = await client.fetch(
    `*[_type == $metadataType && $id in translations[].value._ref][0]{_id}`,
    {metadataType: METADATA_SCHEMA_NAME, id: sourceDocId},
  )
  if (existingMetadata) return

  const targetLanguage = otherLanguage(sourceLanguage)
  const stubBaseId = `post-${targetLanguage}-${randomKey()}${randomKey()}`
  const metadataId = `post-translation-metadata-${sourceDocId}`

  const tx = client.transaction()
  tx.create({
    _id: `drafts.${stubBaseId}`,
    _type: schemaTypeName,
    language: targetLanguage,
    slug: sourceDoc?.slug,
  })
  tx.createIfNotExists({
    _id: metadataId,
    _type: METADATA_SCHEMA_NAME,
    schemaTypes: [schemaTypeName],
    translations: [
      createTranslationReference(sourceLanguage, sourceDocId, schemaTypeName),
      createTranslationReference(targetLanguage, stubBaseId, schemaTypeName),
    ],
  })
  await tx.commit()
}

export function createPublishWithTranslationStubAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const PublishWithTranslationStub: DocumentActionComponent = (props) => {
    // Following the documented pattern for wrapping built-in actions:
    // call the original action creator with the same props to get its
    // description (label/icon/disabled/onHandle/etc), then override
    // onHandle to run our logic first.
    const original = originalAction(props)
    const client = useClient({apiVersion: API_VERSION})
    const [isPreparingStub, setIsPreparingStub] = useState(false)

    const handle = useCallback(() => {
      const sourceDoc = (props.draft ?? props.published) as SanityDocument | null
      const isLocalizedPost = props.type === 'post' && isSupportedLanguage(sourceDoc?.language)

      if (!isLocalizedPost) {
        original?.onHandle?.()
        return
      }

      setIsPreparingStub(true)
      ensureTranslationStub(client, props.id, sourceDoc, props.type)
        .catch((err) => {
          // Never block the editor's publish on stub-creation failure -
          // log and continue; worst case, the sibling stub can still be
          // created manually via the plugin's own "Translate" action.
          console.error('Failed to auto-create sibling translation stub', err)
        })
        .finally(() => {
          setIsPreparingStub(false)
          original?.onHandle?.()
        })
    }, [client, original, props.draft, props.published, props.id, props.type])

    if (!original) return null

    return {
      ...original,
      disabled: original.disabled || isPreparingStub,
      onHandle: handle,
    } satisfies DocumentActionDescription
  }

  PublishWithTranslationStub.action = originalAction.action

  return PublishWithTranslationStub
}
