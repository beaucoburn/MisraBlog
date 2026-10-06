import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'xl4i9u1k',
    dataset: 'production'
  },
  deployment: {
    // Hosted Studio at https://birmisradaha.sanity.studio (first deployed
    // 2026-10-06). Lets `npm run deploy` skip the hostname prompt.
    appId: 'iclr3dmbkecwxjumntom5sgx',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
