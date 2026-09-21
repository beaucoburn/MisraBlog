// Shapes returned by the listing queries in ./queries.ts, shared by the
// homepage feed, the category listing and PostCard so the three can't
// drift apart.
//
// Everything that can legitimately be missing is optional here: `excerpt`
// and `coverImage` were added to the post schema after content already
// existed, so no document is guaranteed to have them, and `title` comes
// back empty for a post that hasn't been translated into the listing's
// language yet (see the untranslated-stub handling in queries.ts).

export interface CategoryRef {
  _id: string;
  title: string;
  slug: string;
}

export interface CoverImage {
  asset?: { url?: string } | null;
  hotspot?: { x?: number; y?: number; width?: number; height?: number } | null;
  alt?: string | null;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string | null;
  excerpt?: string | null;
  coverImage?: CoverImage | null;
  categories?: CategoryRef[] | null;
}
