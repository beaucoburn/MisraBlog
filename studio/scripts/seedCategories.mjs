import { createClient } from '@sanity/client'
import 'dotenv/config'
import { CATEGORY_SEEDS, seedCategories } from './lib/seedCategories.js'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

await seedCategories(client)

for (const { title } of CATEGORY_SEEDS) {
  console.log(`Ensured category: ${title}`)
}
