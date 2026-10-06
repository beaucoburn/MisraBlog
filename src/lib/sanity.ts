import {createClient} from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  // Always read fresh, uncached content. Every query runs at build time,
  // and the Sanity webhook starts a Netlify build the moment something is
  // published. The cached API (apicdn) can still serve the pre-publish
  // version for a short while, which baked stale content into the site.
  // Visitors never hit this API (the site is static), so the CDN would
  // buy nothing here.
  useCdn: false,
})
