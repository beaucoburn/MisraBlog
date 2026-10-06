import { expect, test } from 'vitest';
import { blocksToPlainText, renderPortableText, type PortableTextBlock } from './portableText';

const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: text, text, marks });
const block = (children: object[], extra: Record<string, unknown> = {}): PortableTextBlock =>
  ({ _type: 'block', _key: Math.random().toString(36).slice(2), style: 'normal', markDefs: [], children, ...extra }) as PortableTextBlock;

test('renders paragraphs with bold, italic and links', () => {
  const html = renderPortableText([
    block(
      [span('Hello '), span('bold', ['strong']), span(' and '), span('soft', ['em']), span(' — '), span('a link', ['l1'])],
      { markDefs: [{ _type: 'link', _key: 'l1', href: 'https://example.com/daisies' }] },
    ),
  ]);

  expect(html).toContain('<p>Hello <strong>bold</strong> and <em>soft</em>');
  expect(html).toContain('<a href="https://example.com/daisies">a link</a>');
});

test('headings, quotes and lists render as their HTML elements', () => {
  const html = renderPortableText([
    block([span('Heading')], { style: 'h2' }),
    block([span('Subheading')], { style: 'h3' }),
    block([span('A quote')], { style: 'blockquote' }),
    block([span('one')], { listItem: 'bullet', level: 1 }),
    block([span('two')], { listItem: 'bullet', level: 1 }),
    block([span('first')], { listItem: 'number', level: 1 }),
  ]);

  expect(html).toContain('<h2>Heading</h2>');
  expect(html).toContain('<h3>Subheading</h3>');
  expect(html).toContain('<blockquote><p>A quote</p></blockquote>');
  expect(html).toMatch(/<ul><li>one<\/li><li>two<\/li><\/ul>/);
  expect(html).toMatch(/<ol><li>first<\/li><\/ol>/);
});

test('older H1/H4–H6 content maps onto h2/h3, so the post title stays the only h1', () => {
  const html = renderPortableText([
    block([span('Big')], { style: 'h1' }),
    block([span('Small')], { style: 'h5' }),
  ]);

  expect(html).not.toContain('<h1');
  expect(html).toContain('<h2>Big</h2>');
  expect(html).toContain('<h3>Small</h3>');
});

test('text is escaped and unsafe link URLs never reach an href', () => {
  const html = renderPortableText([
    block([span('<script>alert(1)</script>'), span('click', ['bad'])], {
      markDefs: [{ _type: 'link', _key: 'bad', href: 'javascript:alert(1)' }],
    }),
  ]);

  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('javascript:');
});

test('body images render responsively from the Sanity CDN, with alt text and caption', () => {
  const html = renderPortableText([
    {
      _type: 'image',
      _key: 'img1',
      alt: 'Daisies "in" the garden',
      caption: 'Spring, 2026',
      asset: {
        url: 'https://cdn.sanity.io/images/xl4i9u1k/production/abc-2000x1500.jpg',
        metadata: { dimensions: { width: 2000, height: 1500 } },
      },
    },
  ]);

  expect(html).toContain('<figure class="post-figure">');
  expect(html).toContain('alt="Daisies &quot;in&quot; the garden"');
  expect(html).toContain('width="2000" height="1500"');
  expect(html).toContain('abc-2000x1500.jpg?w=704&amp;fit=max&amp;auto=format 704w');
  expect(html).toContain('loading="lazy"');
  expect(html).toContain('<figcaption>Spring, 2026</figcaption>');
});

test('a small image is never upscaled, and a missing alt becomes an empty alt', () => {
  const html = renderPortableText([
    {
      _type: 'image',
      _key: 'img2',
      asset: {
        url: 'https://cdn.sanity.io/images/xl4i9u1k/production/tiny-400x300.png',
        metadata: { dimensions: { width: 400, height: 300 } },
      },
    },
  ]);

  expect(html).toContain('alt=""');
  expect(html).toContain(' 400w');
  expect(html).not.toContain('480w');
  expect(html).not.toContain('<figcaption>');
});

test('unknown block types and images without an asset are skipped, not fatal', () => {
  const html = renderPortableText([
    { _type: 'someFutureEmbed', _key: 'x' },
    { _type: 'image', _key: 'y', asset: null },
    block([span('still here')]),
  ]);

  expect(html).toBe('<p>still here</p>');
});

test('plain text for the meta description ignores images', () => {
  expect(
    blocksToPlainText([
      block([span('First '), span('para', ['strong'])]),
      { _type: 'image', _key: 'i' },
      block([span('Second')]),
    ]),
  ).toEqual(['First para', 'Second']);
});
