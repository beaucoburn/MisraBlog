import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {documentInternationalization} from '@sanity/document-internationalization'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {schemaTypes} from './schemaTypes'
import {createPublishWithTranslationStubAction} from './actions/publishWithTranslationStub'
import {UserIcon} from '@sanity/icons/User'
import {ABOUT_PAGE_ID} from './schemaTypes/aboutPage'

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
    structureTool({
      // The About page is a singleton: one fixed entry at the top of the
      // sidebar that opens its single document directly, instead of a list
      // she could add more About pages to. Everything else is the default.
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('About page')
              .id(ABOUT_PAGE_ID)
              .icon(UserIcon)
              .child(S.document().schemaType('aboutPage').documentId(ABOUT_PAGE_ID).title('About page')),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'aboutPage'),
          ]),
    }),
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
      // Never offer "new About page": there is exactly one (see structure above).
      prev = prev.filter((templateItem) => templateItem.templateId !== 'aboutPage')
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
    actions: (prev, context) => {
      if (context.schemaType === 'post') {
        return prev.map((action) =>
          action.action === 'publish' ? createPublishWithTranslationStubAction(action) : action,
        )
      }
      // The single About page can be edited and published, but not
      // duplicated or deleted.
      if (context.schemaType === 'aboutPage') {
        return prev.filter((action) => action.action !== 'duplicate' && action.action !== 'delete')
      }
      return prev
    },
  },
})
