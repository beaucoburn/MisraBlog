import { expect, test, vi } from 'vitest';
import { CATEGORY_FIXTURES } from '../../lib/testFixtures';

// The published About page document returned for ABOUT_PAGE_QUERY, swapped
// per test (null = never published yet). Everything else is the shared
// header's CategoryNav.
let aboutDoc: unknown = null;

vi.mock('../../lib/sanity', () => ({
  sanityClient: {
    fetch: vi.fn((query: string) =>
      Promise.resolve(query.includes('_id == "aboutPage"') ? aboutDoc : CATEGORY_FIXTURES),
    ),
  },
}));

async function renderAbout(lang: string) {
  const { createTestContainer } = await import('../../lib/testContainer');
  const { default: AboutPage } = await import('./about.astro');

  const container = await createTestContainer();
  return container.renderToString(AboutPage, { props: { lang } });
}

const para = (text: string, style = 'normal') => ({
  _type: 'block',
  _key: text.slice(0, 8),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: 's', text, marks: [] }],
});

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('getStaticPaths returns one about page per locale', async () => {
  const { getStaticPaths } = await import('./about.astro');
  const paths = getStaticPaths();

  expect(paths).toContainEqual({ params: { lang: 'en' }, props: { lang: 'en' } });
  expect(paths).toContainEqual({ params: { lang: 'tr' }, props: { lang: 'tr' } });
});

test('until she publishes it, each locale shows the placeholder and nothing invented', async () => {
  aboutDoc = null;
  const en = await renderAbout('en');
  const tr = await renderAbout('tr');

  expect(en).toMatch(/<h1[^>]*>About<\/h1>/);
  expect(en).toContain('Bio coming soon.');
  expect(en).toContain('<title>About · Bir Misra Daha</title>');
  expect(tr).toMatch(/<h1[^>]*>Hakkında<\/h1>/);
  expect(tr).toContain('Yakında.');
  // No empty description tag for a page with nothing to say yet.
  expect(en).not.toContain('name="description"');
});

test('each locale renders its own language’s text as rich text', async () => {
  aboutDoc = {
    photo: null,
    bodyEn: [para('Hello, I write about small things.'), para('Where I live', 'h2')],
    bodyTr: [para('Merhaba, küçük şeyler hakkında yazıyorum.')],
  };
  const en = main(await renderAbout('en'));
  const tr = main(await renderAbout('tr'));

  expect(en).toContain('<p>Hello, I write about small things.</p>');
  expect(en).toContain('<h2>Where I live</h2>');
  expect(en).toContain('class="rich-text');
  expect(en).not.toContain('Merhaba');
  expect(en).not.toContain('Bio coming soon.');
  expect(tr).toContain('<p>Merhaba, küçük şeyler hakkında yazıyorum.</p>');
  expect(tr).not.toContain('Hello');
});

test('a language she hasn’t written yet shows the placeholder, not the other language', async () => {
  aboutDoc = { photo: null, bodyEn: [para('Only in English so far.')], bodyTr: null };
  const tr = main(await renderAbout('tr'));

  expect(tr).toContain('Yakında.');
  expect(tr).not.toContain('Only in English so far.');
});

test('her own opening words become the meta description', async () => {
  aboutDoc = { photo: null, bodyEn: [para('Hello, I write about small things.')], bodyTr: null };
  const en = await renderAbout('en');

  expect(en).toContain('<meta name="description" content="Hello, I write about small things.">');
});

test('the optional photo sits above the text, responsive and with its alt text', async () => {
  aboutDoc = {
    photo: {
      alt: 'Misra in the garden',
      asset: {
        url: 'https://cdn.sanity.io/images/xl4i9u1k/production/me-1200x1600.jpg',
        metadata: { dimensions: { width: 1200, height: 1600 } },
      },
    },
    bodyEn: [para('Hello.')],
    bodyTr: null,
  };
  const en = main(await renderAbout('en'));

  expect(en).toContain('class="about__photo"');
  expect(en).toContain('alt="Misra in the garden"');
  expect(en).toContain('me-1200x1600.jpg?w=704');
  expect(en.indexOf('about__photo')).toBeLessThan(en.indexOf('Hello.'));
});
