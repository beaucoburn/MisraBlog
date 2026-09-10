import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {documentInternationalization} from '@sanity/document-internationalization'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'
import {createPublishWithTranslationStubAction} from './actions/publishWithTranslationStub'

// Fixed, hardcoded EN/TR locale list - this is a two-language site, not an
// open-ended editor-managed locale list, so this is intentionally not a
// content-type/document.
const SUPPORTED_LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'tr', title: 'Turkish'},
]

export default defineConfig({
  name: 'default',
  title: 'Misra Blog',

  projectId: 'xl4i9u1k',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    // Document-level localization for `post`: independent per-language
    // publish state + independent slugs per language, via paired
    // documents joined by a translation.metadata document.
    documentInternationalization({
      supportedLanguages: SUPPORTED_LANGUAGES,
      schemaTypes: ['post'],
    }),
    // Field-level localization for `category`: a translated display label
    // on a single document per category, not separate documents.
    internationalizedArray({
      languages: SUPPORTED_LANGUAGES,
      fieldTypes: ['string', 'text'],
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // @sanity/document-internationalization auto-registers a `post-en`
    // and `post-tr` initial value template per supported language (each
    // setting `language` on creation), alongside the schema's own
    // language-less default template. Deliberately keep BOTH language
    // templates visible - the editor should start writing in whichever
    // language she's inspired to write in that day, not be forced through
    // a fixed base language. The sibling-language stub is created
    // automatically on first publish either direction (see
    // actions/publishWithTranslationStub.ts), never manually, so only the
    // plain language-less `post` template and the parameterized one need
    // hiding.
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type !== 'global' && creationContext.type !== 'structure') {
        return prev
      }
      return prev
        .filter((templateItem) => !['post', 'post-parameterized'].includes(templateItem.templateId))
        .map((templateItem) => {
          if (templateItem.templateId === 'post-en') return {...templateItem, title: 'Post (English)'}
          if (templateItem.templateId === 'post-tr') return {...templateItem, title: 'Post (Turkish)'}
          return templateItem
        })
    },
    actions: (prev, context) =>
      context.schemaType === 'post'
        ? prev.map((action) =>
            action.action === 'publish' ? createPublishWithTranslationStubAction(action) : action,
          )
        : prev,
  },
})
