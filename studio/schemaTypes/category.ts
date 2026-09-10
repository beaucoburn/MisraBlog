import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      // Field-level localization via sanity-plugin-internationalized-array
      // (configured in sanity.config.ts): stores one value per language in
      // an array of {_key, _type: 'internationalizedArrayStringValue',
      // language: 'en' | 'tr', value: string} items, rather than a
      // separate document per language.
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      // Left as a single plain field, not localized: one canonical slug
      // per category is enough for this small, fixed taxonomy. Derives
      // its source value from the English title, since `title` is no
      // longer a plain string the slugify UI can read directly.
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc: any) =>
          doc.title?.find((t: {language?: string}) => t.language === 'en')?.value ?? '',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}: {title?: Array<{language?: string; value?: string}>}) {
      const englishTitle = title?.find((item) => item.language === 'en')?.value
      return {title: englishTitle ?? title?.[0]?.value ?? 'Untitled category'}
    },
  },
})
