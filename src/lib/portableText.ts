// Portable Text (Sanity rich text) helpers for post bodies.
//
// - renderPortableText(): the full body as HTML, via Sanity's official
//   @portabletext/to-html. Text is escaped and link URLs are vetted by the
//   library (javascript: and similar never reach an href).
// - blocksToPlainText(): text paragraphs only, for the meta description.
import { escapeHTML, toHTML, type PortableTextComponents } from '@portabletext/to-html';

export type PortableTextBlock = {
  _type: string;
  _key?: string;
  children?: Array<{ _type: string; text?: string }>;
  [key: string]: unknown;
};

// A body image as POST_BY_SLUG_QUERY projects it (asset dereferenced to
// its CDN URL and pixel dimensions).
export interface BodyImage {
  _type: 'image';
  alt?: string | null;
  caption?: string | null;
  asset?: {
    url: string;
    metadata?: { dimensions?: { width: number; height: number } | null } | null;
  } | null;
}

export function blocksToPlainText(blocks: PortableTextBlock[] | null | undefined): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => (block.children ?? []).map((child) => child.text ?? '').join(''));
}

// Widths offered to the browser for body images. The reading column tops
// out at 48rem minus padding (~704px), so 1408px covers 2x screens.
const IMAGE_WIDTHS = [480, 704, 1056, 1408];
const IMAGE_SIZES = '(min-width: 48rem) 44rem, 100vw';

// Sanity's image CDN resizes on the fly; fit=max never upscales or crops,
// so the author's whole image is always shown.
const cdnUrl = (url: string, width: number) => `${url}?w=${width}&fit=max&auto=format`;

// Also used for the About page photo.
export function renderSanityImage(image: BodyImage): string {
  const url = image.asset?.url;
  if (!url) return '';

  const dimensions = image.asset?.metadata?.dimensions;
  const naturalWidth = dimensions?.width ?? Infinity;
  const widths = IMAGE_WIDTHS.filter((w) => w <= naturalWidth);
  if (widths.length === 0) widths.push(naturalWidth);

  const srcset = widths.map((w) => `${escapeHTML(cdnUrl(url, w))} ${w}w`).join(', ');
  // Intrinsic size so the page doesn't jump as the image loads.
  const sizeAttrs = dimensions ? ` width="${dimensions.width}" height="${dimensions.height}"` : '';
  // No alt text means the author didn't describe it: an empty alt is better
  // for screen readers than announcing a filename.
  const img =
    `<img src="${escapeHTML(cdnUrl(url, widths.at(-1)!))}" srcset="${srcset}" sizes="${IMAGE_SIZES}"` +
    ` alt="${escapeHTML(image.alt ?? '')}"${sizeAttrs} loading="lazy" decoding="async">`;
  const caption = image.caption?.trim();

  return `<figure class="post-figure">${img}${caption ? `<figcaption>${escapeHTML(caption)}</figcaption>` : ''}</figure>`;
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => renderSanityImage(value as BodyImage),
  },
  block: {
    normal: ({ children }) => `<p>${children}</p>`,
    // The Studio offers Heading (h2) and Subheading (h3). Anything else
    // (content written before the menu was trimmed) maps onto those two,
    // so the post title stays the page's only <h1>.
    h1: ({ children }) => `<h2>${children}</h2>`,
    h2: ({ children }) => `<h2>${children}</h2>`,
    h3: ({ children }) => `<h3>${children}</h3>`,
    h4: ({ children }) => `<h3>${children}</h3>`,
    h5: ({ children }) => `<h3>${children}</h3>`,
    h6: ({ children }) => `<h3>${children}</h3>`,
    blockquote: ({ children }) => `<blockquote><p>${children}</p></blockquote>`,
  },
  // Unknown block types (e.g. something added to the schema before the
  // site knows how to show it) render nothing, instead of the library's
  // default hidden "Unknown block type" note in the page source.
  unknownType: () => '',
};

export function renderPortableText(blocks: PortableTextBlock[] | null | undefined): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';
  return toHTML(blocks as Parameters<typeof toHTML>[0], { components, onMissingComponent: false });
}
