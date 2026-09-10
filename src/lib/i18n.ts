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
