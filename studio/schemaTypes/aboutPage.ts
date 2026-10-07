import {defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'
import {richTextMembers} from './richText'

/**
 * The About page: a single document (a "singleton") with both languages
 * side by side. Simpler than posts' one-document-per-language setup,
 * because a bio needs no per-language slug or separate publish state.
 *
 * It always has the fixed id `aboutPage`. sanity.config.ts pins it in the
 * sidebar as one entry and removes "create new", "duplicate" and "delete",
 * so there can only ever be one. The document comes into existence the
 * first time someone edits it in the Studio. Until something is
 * published, the site keeps showing its placeholder text.
 */
export const ABOUT_PAGE_ID = 'aboutPage'

export default defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional. Shown at the top of the About page, in both languages.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Brief description of the photo for screen readers. Optional, but recommended.',
        }),
      ],
    }),
    defineField({
      name: 'bodyEn',
      title: 'About (English)',
      type: 'array',
      of: richTextMembers,
    }),
    defineField({
      name: 'bodyTr',
      title: 'About (Türkçe)',
      type: 'array',
      of: richTextMembers,
    }),
  ],
  preview: {
    prepare: () => ({title: 'About page'}),
  },
})
