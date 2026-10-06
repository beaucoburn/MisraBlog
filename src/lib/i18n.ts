// Single source of truth for the site's supported locales, mirrored (by
// value, since astro.config.mjs can't import TS at config-eval time in a
// way we want to depend on) into the `i18n.locales` list there — keep the
// two in sync if this ever changes.
export const LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];

// Low-stakes technical fallback only (bare "/" with no locale segment) —
// does NOT imply English is the "primary" content language. See CLAUDE.md.
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

// The site's name. Deliberately NOT a Record<Locale, string> like the UI
// strings below: it's a proper name, identical in English and Turkish, so
// translating it would be wrong rather than merely unfinished.
export const SITE_TITLE = 'Bir Misra Daha';

// Builds the language-switcher href map for pages whose path is identical
// in every locale apart from the locale segment itself (home, about, and
// category listings - category slugs are a single canonical field, shared
// cross-locale). Post pages must NOT use this: their slugs can differ per
// language and have to be resolved through translation.metadata.
export function localizedPaths(path = ''): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, `/${locale}/${path}`])) as Record<
    Locale,
    string
  >;
}

// Publish dates rendered in the visitor's own locale conventions rather
// than one fixed (English) format, for the same symmetric-locale reason as
// the placeholder strings below.
export function formatDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

// Localized "not yet translated" placeholder, shown in the *visitor's*
// language rather than the source language, per the symmetric EN/TR
// authoring workflow (untranslated posts are never hidden or 404'd).
export const NOT_TRANSLATED_MESSAGE: Record<Locale, string> = {
  en: "This post hasn't been translated into English yet.",
  tr: 'Bu yazı henüz Türkçeye çevrilmedi.',
};

// Short fallback link label for an untranslated post in a category listing
// (its `title` field is empty for that language) - without this, the
// listing would render a blank, empty-text link instead of something a
// reader can actually recognize and click through on.
export const UNTRANSLATED_POST_LABEL: Record<Locale, string> = {
  en: 'Untranslated post',
  tr: 'Çevrilmemiş yazı',
};

// Chrome/UI strings. Every one of these is authored in both languages at
// the same time - no "English first, translate later" for site chrome (the
// author's own first language is Turkish).
export const HOME_LINK_LABEL: Record<Locale, string> = {
  en: 'Home',
  tr: 'Ana sayfa',
};

export const PAGES_NAV_LABEL: Record<Locale, string> = {
  en: 'Pages',
  tr: 'Sayfalar',
};

// Each language's name in that language (not translated into the current
// one), so a reader always recognizes their own language in the switcher.
export const LANGUAGE_NAME: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
};

export const ABOUT_LABEL: Record<Locale, string> = {
  en: 'About',
  tr: 'Hakkında',
};

// Placeholder copy only - the real bio is still to come from the author.
export const ABOUT_PLACEHOLDER_BODY: Record<Locale, string> = {
  en: 'Bio coming soon.',
  tr: 'Yakında.',
};

export const LATEST_POSTS_HEADING: Record<Locale, string> = {
  en: 'Latest posts',
  tr: 'Son yazılar',
};

export const NO_POSTS_MESSAGE: Record<Locale, string> = {
  en: 'No posts yet.',
  tr: 'Henüz yazı yok.',
};
