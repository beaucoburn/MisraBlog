import {defineArrayMember, defineField} from 'sanity'

/**
 * The rich-text editor shared by post bodies and the About page, so both
 * offer exactly the same formatting and the site renders both the same
 * way (src/lib/portableText.ts).
 */
export const richTextMembers = [
  defineArrayMember({
    type: 'block',
    // A short menu instead of the default H1–H6: the page title is already
    // the page's main heading, and fewer choices are easier to write with.
    // The site still renders any older H1/H4–H6 content sensibly.
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Heading', value: 'h2'},
      {title: 'Subheading', value: 'h3'},
      {title: 'Quote', value: 'blockquote'},
    ],
  }),
  defineArrayMember({
    type: 'image',
    title: 'Image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        description: 'Brief description of the image for screen readers and SEO. Optional, but recommended.',
      }),
      defineField({
        name: 'caption',
        title: 'Caption',
        type: 'string',
        description: 'Optional. Shown under the image.',
      }),
    ],
  }),
]
